# 📐 Plan — Parent Portal, Payment QR & Practice Videos

> Status: **draft, not implemented yet.** Decisions below were confirmed with the
> owner on 2026-11-03. One PR-sized epic, best built in the 6 phases at the bottom.

---

## 🎯 The three features

| # | Feature | Decision made |
|---|---------|---------------|
| 1 | **Parent login** | Teacher creates parent accounts (name + email + password) from the studio and links them to students. Parents see only their own children's data. |
| 2 | **Payment QR** | Teacher uploads their own QR image **once** (UPI / VietQR / QRIS / any bank QR — country-agnostic). Parents open their payment app, scan, pay out-of-band; the teacher then records the transaction as usual in the studio. |
| 3 | **Practice videos** | Hybrid: parent either **pastes a YouTube/Drive link** (zero cost, embedded player) **or uploads directly to Cloudinary** (unsigned upload preset, client → Cloudinary, bypasses Vercel's 4.5 MB serverless body limit). Teacher sees a feed and can leave feedback. |

---

## 1. Data model — `prisma/schema.prisma`

### New enum
```prisma
enum UserRole {
  TEACHER
  PARENT
}
```

### `User` — changes
```diff
   timezone      String    @default("UTC")
+  role          UserRole  @default(TEACHER)
   createdAt     DateTime  @default(now()) @db.Timestamptz
   accounts      Account[]
   sessions      Session[]
   teacher       Teacher?
+  parent        Parent?
```
`@default(TEACHER)` keeps every existing `User` valid without a backfill. It
does **not** create missing `Teacher` rows; account lifecycle changes below
handle that separately.

### `Student` — changes
```diff
   familyMemberships FamilyMember[]
+  parentLinks       ParentStudent[]
```

### New models
```prisma
/// A parent login. Owns a User (role PARENT) and is linked to N students
/// (so one account can cover siblings).
model Parent {
  id         String    @id @default(cuid())
  userId     String    @unique          // the login — has role PARENT
  teacherId  String                     // which studio it belongs to
  createdAt  DateTime  @default(now()) @db.Timestamptz
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  teacher    Teacher   @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  studentLinks ParentStudent[]

  @@index([teacherId])
}

model ParentStudent {
  id        String  @id @default(cuid())
  parentId  String
  studentId String
  parent    Parent  @relation(fields: [parentId], references: [id], onDelete: Cascade)
  student   Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([parentId, studentId])
  @@index([studentId])
}

enum VideoProvider {
  YOUTUBE
  DRIVE
  CLOUDINARY
  LINK          // any other URL — shown as a chip, not embedded
}

model PracticeVideo {
  id         String        @id @default(cuid())
  studentId  String
  teacherId  String
  postedById String        // User.id of whoever posted (parent — or teacher later)
  title      String
  note       String?
  url        String        // watch/embed URL, or Cloudinary secure_url
  provider   VideoProvider
  teacherComment String?   // teacher feedback, the core of the loop
  createdAt  DateTime      @default(now()) @db.Timestamptz

  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher    Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  postedBy   User     @relation(fields: [postedById], references: [id], onDelete: Cascade)

  @@index([teacherId, createdAt])
  @@index([studentId, createdAt])
}
```
`Student` and `User`/`Teacher` also need back-relations
(`practiceVideos PracticeVideo[]`) and `User.practiceVideos[]`.

### `Teacher` — changes (payment QR)
```diff
   families  Family[]
+  parents   Parent[]
+  practiceVideos PracticeVideo[]
   user      User      @relation(fields: [userId], references: [id])
+  /// Teacher's own payment QR image (UPI / VietQR / QRIS / bank QR).
+  /// Stored as a small base64 data URL (~10–100 KB); parents scan it with
+  /// their banking app. Teacher records received money as a normal
+  /// PaymentTransaction afterwards — no gateway, no processing, any country.
+  paymentQrData String?
+  paymentQrName String?
+  /// Short note shown next to the QR, e.g. "Pay to BIDV · Nguyen Minh Anh —
+  /// put student name + month in the payment note".
+  paymentNote   String?
```

**Schema deployment:** use `npm run db:push` (the project intentionally does
not use Prisma migrations: its Neon migration history is out of sync). Stop
the dev server first, then regenerate the Prisma client if required. This
change is additive and the `TEACHER` default keeps existing `User` rows valid;
no data backfill is needed.

Note: there are **no** existing `Family`/`FamilyMember` ties to auth — deliberately
model Parent separately (Family stays a pure print/reporting bundle).

---

## 2. Auth — role-aware sessions

**`src/server/auth/config.ts`** (everything else in NextAuth stays put):

```diff
 declare module "next-auth" {
   interface Session extends DefaultSession {
     user: {
       id: string;
       timezone: string;
+      role: "TEACHER" | "PARENT";
     } & DefaultSession["user"];
   }
   interface JWT {
     id: string;
+    role?: "TEACHER" | "PARENT";
     image?: string | null;
     timezone?: string;
   }
   interface User {
+    role?: "TEACHER" | "PARENT";
     image?: string | null;
     timezone?: string;
   }
 }
```

- `authorize()` returns `role: user.role`.
- `jwt` callback: set `token.role` on sign-in. **Important edge case:** sessions
  issued before this change have no `role` in the token (JWT strategy) — so when
  `token.role === undefined`, look the user up once (`db.user.findUnique` select
  role) and stamp it. That makes existing teachers' sessions survive the deploy.
- `session` callback mirrors `token.role` → `session.user.role` (fallback `"TEACHER"`).

**Route guarding (layout-based, matching the existing pattern — no middleware):**

- `src/app/(root)/layout.tsx`: after the session check,
  `if (session.user.role !== "TEACHER") redirect("/portal")` — a parent who lands
  anywhere in the studio shell (incl. the login redirect to `/dashboard`) bounces out.
- New `src/app/(portal)/layout.tsx`: `!session → /login`, `role === "TEACHER" → /dashboard`,
  `robots: { index: false, follow: false }`, same noindex treatment as `(root)`.

**Where each account type is born:**
- Teacher → existing `registerAction` — create `User(role: "TEACHER")` **and**
  its `Teacher` row in one transaction. Today the app lazily creates a Teacher
  only when a user first creates a student; that would make a newly registered,
  empty studio unable to manage parent accounts or payment settings.
- Parent → new teacher-side tRPC mutation (section 3), teacher sets email + password.
- Demo seed (`demo.ts` / `seed-steps.ts`): no change needed; explicit `TEACHER`
  role is set by the schema default (optionally seed one demo parent +
  1–2 demo videos later, out of scope for v1).

Credentials login already works for any `User`, but redirects must become
role-aware in **four** existing places: `loginAction`, the client login form,
`(auth)/login/page.tsx`, and `(auth)/register/page.tsx`. They currently always
send an authenticated user to `/dashboard`. Return the role from `loginAction`
and route parents directly to `/portal`; the two auth pages should apply the
same server-side target. The edge proxy may keep its lightweight cookie-only
check because the layouts remain the security boundary. Add the parent-login
hint below the form while touching that surface.

---

## 3. tRPC layer

**`src/server/api/trpc.ts`** — two new role-narrowing procedures alongside
`protectedProcedure` (existing teacher routers may remain unchanged initially:
most look up a Teacher row and therefore fail or return no records for a
parent, while the new portal surface uses the explicit parent procedure):

```ts
/** Authenticated TEACHER only. */
export const teacherProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const teacher = await ctx.db.teacher.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (ctx.session.user.role !== "TEACHER" || !teacher) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Teacher account required" });
    }
    return next({ ctx: { session: ctx.session, teacher } });
  });

/** Authenticated PARENT only; ctx.parent + ctx.studentIds injected. */
export const parentProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const parent = await ctx.db.parent.findUnique({
      where: { userId: ctx.session.user.id },
      include: { studentLinks: true },
    });
    if (ctx.session.user.role !== "PARENT" || !parent) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Parent account required" });
    }
    return next({
      ctx: { session: ctx.session, parent, studentIds: parent.studentLinks.map(l => l.studentId) },
    });
  });
```

### New router A — `src/server/api/routers/parent.ts` (teacher-side studio admin)

| Procedure | Type | Notes |
|---|---|---|
| `list` | query | All parents in the studio, each with linked students + `createdAt` |
| `create` | mutation | `{ name, email, password, studentIds[] }` — bcrypt-hash password (same as `registerAction`), unique-email guard (409-style message if exists), create `User(role: PARENT)` + `Parent` + `ParentStudent` rows. Return the created account (UI shows the password once) |
| `update` | mutation | `{ parentId, name?, password? }` — reset password / rename |
| `setStudents` | mutation | `{ parentId, studentIds[] }` — re-link (disconnect-all + connect given rows) |
| `delete` | mutation | Delete the parent-owned `User` in a transaction. `Parent.userId` points to `User`, so Prisma's cascade runs in the opposite direction (`User → Parent`); deleting the Parent alone would leave a usable orphaned login. |

Every mutation above must first find the `Parent` with both `id: parentId` and
`teacherId: ctx.teacher.id`. `create` and `setStudents` must de-duplicate and
verify that **every** submitted student belongs to that same teacher before
writing any `ParentStudent` rows. Use `TRPCError` (`CONFLICT`, `FORBIDDEN`, or
`NOT_FOUND`) rather than generic `Error`, matching the established API pattern.

```diff
 export const appRouter = createTRPCRouter({
+  parent: parentRouter,
+  portal: portalRouter,
   student: studentRouter,
```

### New router B — `src/server/api/routers/portal.ts` (parent-side, `parentProcedure`)

Every read is scoped with `where: { studentId: { in: ctx.studentIds } }` —
**the parent can never touch an unlinked student's data by guessing IDs.**

| Procedure | Type | Returns |
|---|---|---|
| `overview` | query | children, teacher contact (name/avatar), upcoming PENDING lessons (next 7 days per child, teacher's timezone rendering), count of practice videos, this month's payment status per child |
| `payments` | query | Per child, return recent payment rows plus any billed months with no `PaymentMonth` yet. Recompute expected tuition from completed lessons with `expectedByMonth`, and derive status/remaining with the existing payment helpers. `PaymentMonth.expectedAmount` is only a snapshot and the existing payment router deliberately does not trust it after lesson edits. Bucket using `teacher.user.timezone` (never the parent's default timezone). Display currency remains the parent's browser-local `useCurrency` preference. |
| `qr` | query | `Teacher.paymentQrData / paymentQrName / paymentNote` (the shared studio QR — no per-student QR for v1) |
| `videos` | query | `PracticeVideo`s of the linked students, newest first (players rendered client-side) |
| `addVideo` | mutation | `{ studentId, title, note?, url }` — validate studentId ∈ ctx.studentIds, else FORBIDDEN. Infer provider server-side from the URL; do not trust a caller-provided provider. Add `cloudinaryPublicId` to the model and request only if lifecycle management (such as later deletion from Cloudinary) needs it. |
| `deleteVideo` | mutation | Own posts only (`postedById === session.user.id`), else FORBIDDEN |
| `updateVideoComment` | mutation | Teacher-only; scope by both `id` and `teacherId`, then save `teacherComment`. This is required by the teacher feed UI. |

**Deliberately out:** parent-side "mark as paid" claims. Money is only ever
recorded by the teacher, so the ledger stays a single source of truth. The
parent UI ends at "scan → pay → tell the teacher". (A future `PaymentClaim`
notification table could live in the parent payment page — see FUTURE below.)

---

## 4. Practice-video plumbing

### URL parsing + embedding — `src/lib/practice-video.ts` (new, pure & testable)

```ts
parseVideoUrl(url): { provider: VideoProvider; videoId: string | null; embedUrl: string | null }
```
- YouTube — matches `youtube.com/watch?v=`, `youtu.be/<id>`, `shorts/<id>`,
  `embed/<id>` → `https://www.youtube-nocookie.com/embed/<id>`
- Gmail/Drive — `drive.google.com/file/d/<id>/...` or `open?id=<id>` →
  `https://drive.google.com/file/d/<id>/preview` (iframe-compatible)
- Cloudinary — `res.cloudinary.com/<cloud>/video/upload/...` → render `<video>` tag
- Anything else http(s) → `LINK` chip

### Upload pipeline — client → Cloudinary direct (unsigned preset)

Vercel (and most hosts) cap **request bodies at ~4.5 MB**, so a server-relayed
upload would die on real practice videos. Therefore the browser uploads straight
to Cloudinary and only the resulting URL enters tRPC:

- `src/lib/cloudinary.ts` (new):
  - `isUploadConfigured()` — needs `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` +
    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  - `uploadPracticeVideo(file, { studentId })` — POST `FormData` (file,
    `upload_preset`, `folder: "my-piano-diary/practice"`, `resource_type: "video"`)
    to `https://api.cloudinary.com/v1_1/<cloud>/video/upload`, 2-minute timeout,
    returns `secure_url`, `public_id`, duration
- `src/env.js`: add optional `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (server vars
  `CLOUDINARY_URL/API_KEY/API_SECRET` already exist but stay unused for v1)
- **Setup docs** go in the plan + the upload dialog's empty state:
  1. Cloudinary (free) → Settings → Upload → add unsigned preset (folder
     `my-piano-diary/practice`, max ~200 MB)
  2. Copy cloud name + preset name to `.env` as the two `NEXT_PUBLIC_` vars
  3. Redeploy
- When not configured: the upload button renders disabled with a tooltip
  "Uploads need Cloudinary setup — see docs"; **link mode always works**, so the
  feature is usable with zero config. (Later swap to R2 by replacing only
  `cloudinary.ts` + the CLOUDINARY branch of `parseVideoUrl` — API shape unchanged.)

**Unsigned-upload boundary:** the preset name is public by design, so configure
the Cloudinary unsigned preset itself with a video-only format allow-list,
maximum file size, and the fixed practice folder. The app must validate the
returned URL before persisting it: HTTPS only, `res.cloudinary.com`, the
configured cloud name, and the expected `my-piano-diary/practice/` path.

---

## 5. UI — teacher side (Blossom Diary components, `(root)` group)

### 5a. Payment QR — payments page header card
New `src/app/(root)/payments/_components/payment-qr-card.tsx`:
- Small card next to the month filters: QR preview, or empty state
  "Parents can't pay you until you upload a payment QR";
- Upload = file `type="image/*"` (accept `image/png,image/jpeg,image/webp`),
  client-side canvas downscale to ≤ 512 px → JPEG/PNG ≤ 300 KB (QR is small; keeps
  DB rows tiny), data-URL preview, optional one-line `paymentNote` text field
- Mutations via new `teacher.profile`-style additions **or** a small
  `payment.setQr` procedure — implementation note: add to
  `parent.ts` router as `setPaymentQr` / `clearPaymentQr` to avoid touching
  `user.ts` — zod schema `z.string().startsWith("data:image/").max(400_000)`
- Server validation must be stricter than the UI `accept` attribute: permit only
  base64 `image/png`, `image/jpeg`, or `image/webp` data URLs, cap encoded size,
  and bound `paymentQrName` / `paymentNote`. Never permit SVG data URLs.
- Delete button with `ConfirmDialog`.

### 5b. Parent accounts — new "Parents" manager on the students page
New `src/app/(root)/students/_components/parents-manager.tsx`, rendered on
`students/page.tsx` right after `<FamiliesManager />` (same section-head +
Blossom conventions):
- Card list: parent name, email (masked like `a••••@gmail.com`), linked student
  avatars, created date
- **Account sheet** (`parents-account-sheet.tsx`): create/edit — name, email,
  password (12-char generated default + "generate" dice button + copy), student
  checkboxes; edit reuses sheet for rename/password-reset/reselect
- Post-create toast/sheet reveals the password with "copy" + hint "It's shown
  once — our DB only stores the hash"
- Delete via `ConfirmDialog`
- Reuses `api.parent.*` and the same visual DNA as `families-manager.tsx`
  (`Badge`, `Avatar`, `Button rounded-full`, etc.)

### 5c. Practice feed — new `(root)/practice` page + sidebar item
- `app-sidebar.tsx` `data.manage` += `{ title: "Practice", url: "/practice", icon: Video }`
- `src/app/(root)/practice/page.tsx` + `practice-feed.tsx`:
  - Filter chips: all students / per student
  - Reverse-chron cards: student, title, note, when, embedded player
    (`parseVideoUrl` helper), teacher commenting inline via
    `api.parent.updateVideoComment` (`PracticeVideo.teacherComment`, autosave on
    blur or explicit save)
  - Optional: confetti animation plays on first comment per video — matches the app's habit of celebrating moments (see `canvas-confetti` dep already present)
- `src/config/app-config.ts` — add `/portal` paths to `PRIVATE_ROUTES`,
  `/practice` to private list

---

## 6. UI — parent side, new `(portal)` route group

Styling: reuses `bg-app`, Blossom accents; a simpler shell — top header with a
**child switcher** (avatars) instead of the teacher sidebar. Mobile-first: most
parents will be on phones.

```
src/app/(portal)/layout.tsx        guard + header (children + sign out)
src/app/(portal)/_components/portal-header.tsx
src/app/(portal)/page.tsx          home overview
src/app/(portal)/payments/page.tsx + _components/payments-view.tsx
src/app/(portal)/videos/page.tsx   + _components/videos-view.tsx, video-post-dialog.tsx
```

**Home (`/portal`)**
- Greeting w/ child switcher; per child: this-month payment status token
  (🟥 unpaid / 🟨 partial / 🟩 paid), upcoming lessons (next 7 days),
  latest practice video w/ inline play, link to payments/videos
- If the teacher hasn't uploaded a QR yet → a gentle nudge card; payments page
  shows "Upload a QR" disabled state

**Payments (`/portal/payments`)**
- QR card (tap to enlarge in a dialog → full-screen scan-friendly image,
  white background + safe margin so camera apps crop correctly)
- `paymentNote` (teacher's instructions) underneath
- Per child: month rows = status badge, expected / received / remaining
  (parent's `useCurrency` — currency is a shared human setting, not a
  secret), transaction history (read-only: date, amount, method)
- Copy-paste hint: "After paying, tell your teacher — she'll mark it here."

**Videos (`/portal/videos`)**
- "Post practice" dialog: title (required), note (optional), **two tabs** —
  "Paste link" (validated by `parseVideoUrl`, warns on non-embeddable URI types) or
  "Upload video" (max ~200 MB, shows upload %, disabled unless configured)
- Feed: own + any other child's videos, inline playback, teacher's
  `teacherComment` in a distinct quote-styled block ("Ms. Mai's note")

---

## 7. Security & correctness notes (worth copying into tests)

1. Portal reads/scoped by `ctx.studentIds` — an `addVideo`/`deleteVideo` on a
   foreign studentId throws FORBIDDEN.
2. Parent accounts never go anywhere near `teacherProcedure` routers — role
   check + separate context guarantee it structurally. Existing getTeacherOrThrow
   routers also still throw if hit.
3. Teacher identity of a parent = the `Parent.teacherId` they were created
   under; all queries additionally match `practiceVideos.teacherId` etc. so a
   stale parent of a removed teacher studio can't read cross-teacher data.
4. Uploaded URL allow-list — only http(s); Cloudinary URLs must match the
   configured cloud and practice folder before we trust provider CLOUDINARY.
5. Mum's-the-word on "email leak": parent manager masks emails by default, reveal
   per-account.
6. Parent-admin mutations scope the parent and every linked student to the
   authenticated teacher's studio; guessed cross-studio IDs never disclose
   whether the target exists.

---

## 8. Validation schemas — `src/lib/validations/api-schemas.ts`

```ts
createParentAccountSchema:  name 2–80, email email(), password min 8 max 72,
                            studentIds array(cuid).min(1)
updateParentAccountSchema:  parentId cuid, name?, password? (≥8 when present)
setParentStudentsSchema:    { parentId, studentIds[] }
setPaymentQrSchema:         { dataUrl: base64 PNG/JPEG/WebP only, ≤ 400_000, name? ≤ 120, note? ≤ 280 }
addPracticeVideoSchema:     { studentId cuid, title 2–140, note? ≤ 1000, url: HTTP(S) URL }
deletePracticeVideoVideoSchema: { videoId }
updatePracticeVideoCommentSchema: { videoId cuid, teacherComment: string ≤ 2,000 | null }
```
(Names may drift ±: match the existing naming style in that file.)

---

## 9. Tests

| File | Covers |
|---|---|
| `src/lib/practice-video.test.ts` | YouTube variants, Drive variants, Cloudinary, non-embeddable link, junk input |
| `src/lib/validations` tests (pattern to confirm with existing tests) | video url validation, parent schemas |
| (optional) `derivePaymentStatus` already covered | — nothing new |

Add router tests with a mocked Prisma context/caller for the security boundary:
parent access only to linked students, own-video-only delete, cross-studio
parent-admin IDs, teacher-only comments, and parent/teacher role rejection.
Add payment query cases proving expected totals are recomputed from completed
lessons in the **teacher** timezone and that billed-but-unpaid months appear.

Run gates at the end: `npm run check` (lint + tsc) and `npm run test`
(`test:tz` too, since timezone code is reused for the 7-day upcoming list).

---

## 10. Build order (each step passes `npm run check` before the next)

1. **Schema + database push** — add the models/enums, stop dev server, run `npm run db:push`, then regenerate the client if needed
2. **Auth roles + teacher lifecycle** — config.ts callbacks + type augments; create Teacher with a new teacher User; role-aware post-login redirects in actions/auth pages/login form; `(root)` layout gate
3. **`trpc.ts` role procedures** + `parent.ts` router + root registration
4. **Teacher UI:** QR card (payments page), Parents manager (students page); include scoped ownership checks and orphan-free parent deletion
5. **Practice feed teacher page** + sidebar entry + comment mutation
6. **Portal routers** (`portal.ts`) + `practice-video.ts` lib + tests; extract/reuse the existing live payment calculation semantics
7. **Portal route group:** layout + header + home
8. **Portal payments page (QR view)** + portal videos page (link mode first)
9. **Cloudinary upload** (`cloudinary.ts`, env.js, upload tab, docs)
10. **Polish/mobile pass:** bottom-tab-less; `app-config` route registration; final `npm run check && npm run test`

Est. ~2 focused sessions of coding; docs worth adding after: a
`docs/PARENT_PORTAL.md` teacher-facing how-to (accounts, QR, Cloudinary setup).

---

## 11. Planned codebase changes (review-only; not implemented)

| Area | Files to add or modify | Change |
|---|---|---|
| Data | `prisma/schema.prisma` | Add roles, Parent/ParentStudent/PracticeVideo, teacher QR fields, and all back-relations; optionally persist `cloudinaryPublicId`. |
| Authentication | `src/server/auth/config.ts`, `src/server/actions/auth-actions.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/_components/login-form.tsx`, `src/app/(root)/layout.tsx` | Carry role through JWT/session, create the teacher record at registration, and send parents directly to `/portal`. |
| Authorization/API | `src/server/api/trpc.ts`, `src/server/api/root.ts`, new `routers/parent.ts` and `routers/portal.ts` | Add role procedures, studio/child scoping, QR and video APIs, and the missing teacher-comment mutation. |
| Payments | new shared portal payment query/helper as appropriate, `src/lib/payment.ts` | Reuse live expected-tuition calculation and teacher-timezone bucketing; do not use only `PaymentMonth.expectedAmount`. |
| Video upload | new `src/lib/practice-video.ts`, `src/lib/cloudinary.ts`, `src/env.js` | Safe provider parsing, direct unsigned uploads, and validated resulting URLs. |
| Teacher UI | payments/students/practice route components, `app-sidebar.tsx`, `app-config.ts` | QR manager, parent-account manager, practice feed, navigation, and private-route registration. |
| Parent UI | new `src/app/(portal)/...` group | Parent shell, overview, payments, and video posting/playback screens. |
| Tests/docs | new lib/router tests, `docs/PARENT_PORTAL.md` | Parsing, schemas, role/ownership/payment correctness tests; teacher setup guide. |

No application source, Prisma schema, environment configuration, or database has
been changed by this planning revision.

---

## 12. Explicitly out of scope for v1 (candidates for `FUTURE_FEATURES.md`)

- Parent "I paid" claim → teacher notification queue (`PaymentClaim` model)
- Parent-specific QR per student (e.g. pre-filled amount via dynamic UPI string)
- Demo seeding of a parent account + sample practice videos
- Role switcher on the existing login UI, forgot-password emails, email
  domain validation, per-lesson cancel windows, etc.
