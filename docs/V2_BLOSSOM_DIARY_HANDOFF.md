# Blossom Diary v2 Redesign — Context Handoff

Paste this whole file into a new chat to continue applying the **Blossom Diary**
theme to the rest of the app. It is self-contained.

---

## 0. TL;DR — what you're doing

Apply the **Blossom Diary** design (already built for the Dashboard) to every
remaining screen of a Next.js piano-studio app, **one screen at a time**, on the
`redesign-v2` branch. The user (Soham) verifies each screen before you move to
the next. The app is a gift/portfolio project for his partner, a piano teacher.

**Do NOT redesign from scratch** — the design is decided. Port it. Follow the
HTML mockups + the tokens/components that already exist.

---

## 1. Repo state

- Repo: `c:\Users\Hp\Desktop\Practice\Next\my-piano-diary` (Windows, Git Bash + PowerShell).
  GitHub remote: `Itzsoham/my-piano-diary`. Deploys on **Vercel** from `main`.
- **`v1.0.0`** tag = pre-redesign baseline (pushed). Return with `git checkout v1.0.0`.
- Work happens on branch **`redesign-v2`** (NOT main — production stays on v1 until the
  whole redesign is done and approved). Latest commit there: the Dashboard redesign.
- Stack: Next.js 16 (App Router, **Turbopack**), tRPC 11, Prisma 6 (Neon Postgres),
  NextAuth 5, Tailwind **v4**, shadcn/ui, Zustand, framer-motion, FullCalendar.

---

## 2. The design: "Blossom Diary"

A fusion the user chose from HTML mockups: **The Diary's editorial bones** (serif
headings, vertical timelines, generous whitespace, hero bands) wrapped in
**Sugar Bloom's ornament** (5-petal blossoms, scalloped edges, drifting pastel
blobs, hand-drawn squiggle underlines, washi tape, sparkles, a piano-key motif,
and **Mochi** — a small cat-at-a-piano mascot).

### THE ONE RULE — bloom the frame, not the data
Ornament lives in **heroes, headings, empty states, card corners, timeline
nodes**. The **data layer stays sober**: money is `tabular-nums` and undecorated;
NO petals/blobs/sparkles inside tables, calendar grids, attendance grids, or money
columns; numbers are never emoji-fied. That contrast IS the design. Budget: ≤3
ornament types per card; one washi-tape card per screen. All decoration is
`aria-hidden` + `pointer-events-none` and respects `prefers-reduced-motion`.

### Palette (Candy Floss)
Bubble Gum `#F3A2BE` · Cotton Candy `#FFD3DD` · Candy Floss `#F0F9F8` ·
Mint `#C6E6E3` · Wintergreen `#81BFB7`. Raw pastels are **backgrounds, never
text** — they can't carry accessible small text. Deep shades carry text.

### Mockup references (READ THESE — they are the visual target)
In `public/design-mockups/` (self-contained HTML, open in a browser):
- Blossom Diary (the target language): `dashboard-e.html`, `calendar-e.html`,
  `lessons-e.html`, `reports-e.html`.
- `styleguide.html` — palette, status tokens, component gallery, the Tailwind handoff.
- Sugar Bloom mockups for screens without an `-e` variant (use for STRUCTURE,
  apply the Blossom Diary language on top): `students.html`, `payments.html`,
  `pieces.html`, `profile.html`, `login.html`.
- `index.html` — gallery of all of them with a device-width switcher.

---

## 3. Foundation already in place (USE IT, don't rebuild)

### `src/styles/globals.css`
Candy Floss is mapped onto the shadcn tokens AND the full Blossom vocabulary is
exposed as CSS custom properties + Tailwind utilities. The `.dark` block was
removed (app is light-only; there was no theme provider, zero `dark:` classes).

Available Tailwind utilities: `bg-primary text-primary bg-secondary bg-accent
text-muted-foreground border-border bg-destructive` (all retinted) PLUS
`text-ink text-ink-soft text-mint-ink text-pink-{50,100,200,300,400,500,600,700,800}
text-teal-{50,100,200,400,600,700} bg-teal-100 bg-pink-50 text-bubblegum
text-wintergreen bg-mint bg-cotton text-ok-fg bg-ok-bg text-no-fg bg-no-bg
text-wait-fg bg-wait-bg text-special-fg bg-special-bg font-serif`.

CSS vars for inline/gradient use: `var(--grad-pink|grad-mint|grad-brand|grad-hero|
app-bg)`, `var(--sh|sh-lg|sh-xl|sh-pink|sh-mint)`, `var(--pink-500|wintergreen|
ok-dot|no-dot|wait-dot|ink|line|surface|cotton|bubblegum)`, `var(--radius)` (=1rem).

Helper classes: `.bg-app` (signature mint→floss→cotton wash — already on the
content area via layout), `.hero-band` (grad-hero), `.scallop-b` (scalloped
bottom edge), `.text-grad-pink`, `.rise` (staggered entrance, set `--i`).
Keyframe utilities: `animate-[bob_...]`, `animate-[drift_...]` (both motion-safe).

**Contrast law:** body/data text = `text-ink` (12.4:1) or `text-ink-soft` (5.1:1).
`text-ink-faint` is DECORATIVE ONLY — never real data/labels. Pink/teal text uses
`-600`/`-700`. White text only on `bg-primary`/`--pink-600`+ or a deep gradient.
`.av` initials use `text-mint-ink`, never white on pastel.

### `src/components/blossom/`
- `blossom.tsx` exports `<Blossom>`, `<Petal>`, `<Sparkle>`, `<Bow>`, `<Squiggle>`.
- `mochi.tsx` exports `<Mochi mood bob size>` (full cat at piano) and
  `<MochiPeek mood size>` (head+paws to hook over a card's top edge; parent needs
  `relative` + `overflow: visible`). `mood`: `"content" | "delighted" | "sleepy"`.
All are decorative (aria-hidden, no pointer events). Colour via `currentColor` →
set with a `text-*` utility. Import from `@/components/blossom/blossom` and
`@/components/blossom/mochi`. Mochi geometry is identical everywhere (one source).

### Shell (already retheme'd)
`layout.tsx` (`.bg-app` on `SidebarInset`), `app-sidebar.tsx`, `site-header.tsx`
(serif greeting), `nav-action.tsx` (pink "Add lesson" gradient, no purple),
`sonner.tsx` (toasts pinned to light).

### Dashboard (DONE — your reference implementation)
`src/app/(root)/dashboard/`: `page.tsx`, `_components/dashboard-hero.tsx`
(scalloped hero + serif greeting + squiggle + narrative + bobbing Mochi),
`section-cards.tsx` (KPI candy tiles, blossom corners, piano-key strip, spoiler
card preserved), `today-lessons-table.tsx` (vertical blossom timeline; honest
COMPLETE-only "billable" total), `dashboard-top-students-card.tsx` (blossom
podium), `dashboard-quick-insights-card.tsx` (washi-tape card + MochiPeek),
`dashboard-earnings-trend-card.tsx` (soft inline-SVG area chart, blossom peak),
`dashboard-intelligence-panel.tsx` (bento layout). **Study these to match style.**

Open item: verify the hero greeting renders on-screen (DOM-measured present & dark;
headless screenshots were ambiguous). Firstname was fixed to use the first token.

---

## 4. Domain rules you must NEVER get wrong

- **`LessonStatus` enum = exactly `PENDING | COMPLETE | CANCELLED`.** No others.
  Never invent "Rescheduled/No-show/Makeup". Chips: PENDING→`wait`, COMPLETE→`ok`,
  CANCELLED→`no`. A cancelled lesson's earnings render **struck through** in `text-no-fg`.
- **Only COMPLETE lessons are billable** (`src/lib/report/tuition.ts` filters
  `status === "COMPLETE"`). NEVER sum PENDING/CANCELLED into a revenue/earnings/
  tuition total. If you show a total, it must be COMPLETE-only, with an honest
  caption (e.g. "550.000 ₫ billable · 2 pending · 1 cancelled"). ⚠️ The server's
  `lesson.earnings` is `rate` for every non-cancelled lesson (incl. PENDING), so
  compute billable from `status === "COMPLETE"`, not by summing `earnings`.
- **Currency**: VND (default) | IDR | USD | INR. Use `useCurrency()` +
  `formatCurrency()` from `@/lib/currency` / `@/lib/format` — never hardcode a
  symbol. VND = trailing `₫`, dot grouping, 0 decimals. Rate inputs use `đ` prefix.
- **Rates are frozen per lesson** (`Lesson.rate` snapshot at creation) — past months
  never re-price.
- **Payment state (Paid/Partial/Outstanding) is DERIVED** from `PaymentMonth.
  expectedAmount` vs sum of `PaymentTransaction.amount`. There is NO payment status
  enum. Show the derivation.
- **Student** has: name, avatar?, notes?, lessonRate (in-person), onlineLessonRate.
  NO email/phone/grade. **Piece**: title, description?, level?, difficulty (1–5).
  **Family**: named bundle of students + `FamilyMember.position` (STT order) → one
  combined tuition sheet.
- **Birthday mode** is a real feature (`useBirthday()` / `isBirthdayMode`). PRESERVE
  every birthday branch when editing a component — let it coexist.
- Lessons screen has **no bulk actions / no row checkboxes** — don't invent them.
- These mockups/screens are HER studio → **VND + Vietnamese names**. (INR/English is
  only for the interview demo account.)

---

## 5. Remaining screens (do one, user verifies, then next)

Suggested order + mockup reference. All under `src/app/(root)/`:
1. **Calendar** (`calendar/`) → `calendar-e.html`. Month grid with blossom count-pills
   (NO event chips in month view — the app sets `eventDisplay:"none"`), status legend,
   day panel. FullCalendar; grid stays sober. Files: `calendar/page.tsx`,
   `_components/full-calendar-view.tsx`, `attendance-dialog.tsx`.
2. **Lessons** (`lessons/`) → `lessons-e.html`. Grouped-by-day timeline on a blossom
   rail. Real filters (Student/Status/From/To/Reset). `_components/lessons-page.tsx`.
3. **Reports** (`reports/`) → `reports-e.html`. The printable A4 sheet (serif "paper",
   VI/EN toggle, attendance grid, tuition totals). Also the reports index + family
   combined sheet. Keep `@media print` clean. Many files under `reports/_components/`
   and `students/[id]/reports/`.
4. **Students** (`students/`) → `students.html` (Sugar Bloom mockup). Card garden;
   surface BOTH rates; Families tab (STT order). `_components/students-table.tsx`,
   `student-sheet.tsx`, `families-manager.tsx`.
5. **Payments** (`payments/`) → `payments.html`. Make the derived paid/partial/
   outstanding math visible. `_components/payments-page.tsx`, dialogs.
6. **Pieces** (`pieces/`) → `pieces.html`. Difficulty 1–5 as a blossom rating.
7. **Profile** (`profile/`) → `profile.html`. Profile/password/studio settings
   (currency incl. INR, timezone).
8. **Login/auth** (`(auth)/`) → `login.html`. Already token-retinted and looks good;
   optionally add the Mochi-at-piano art. Login form has a working "Try the demo".

Shared shell is done; just retheme screen internals. Keep every hook, query, prop,
dialog, skeleton, empty state, currency call, and birthday branch intact.

---

## 6. The workflow pattern that worked (recommended)

For a screen with several components, use a **Workflow** (ultracode/opt-in) with a
`pipeline(files, build, audit, fix)`: one agent transforms each component in place
against the mockup + a shared contract, an independent agent audits it (behavior-
regression, contrast, responsive, data-fidelity, tokens, bloom-vs-data, a11y, TS),
then a fix agent applies findings. Give every agent: the contract (§2–4 above),
the token/component list (§3), the mockup path, and hard "preserve behavior X"
rules. Then integrate any page-level/hero pieces yourself and browser-verify.
API stream/idle timeouts occasionally kill an agent — check output, resume or
redo that one file. (The dashboard run: zero blockers, ~20 issues fixed.)

---

## 7. Verification (browser) — and the gotchas

Always verify the real rendered screen, logged in, at tablet + desktop widths.

- **Demo login**: `demo@pianodiary.dev` / `demo1234` (has seeded studio; INR data).
  Or click "Try the demo" on `/login` (reseeds current+last month, sets INR).
- **Turbopack cache corrupts** if two dev servers run at once → symptom is
  `0xc0000142` / "Failed to write app endpoint … globals.css". Fix: kill ALL next
  processes, `rm -rf .next`, start exactly ONE `npm run dev`. Discipline:
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ? {$_.CommandLine -like "*next*"} | % { Stop-Process -Id $_.ProcessId -Force }` then clear `.next`.
- Background `npm run dev` sometimes survives TaskStop as an orphan → check port 3000
  before starting a new one; kill the orphan first.
- **Headless screenshots**: the `chrome --headless --screenshot` FLAG hangs on this
  machine. Use the CDP scripts in the scratchpad (`login-shoot.cjs`, `cdpshot.cjs`,
  `measure.cjs`) — they drive Chrome via the DevTools protocol (login, navigate,
  `Page.captureScreenshot`, DOM measure). Chrome is at
  `C:/Program Files/Google/Chrome/Application/chrome.exe`. Reused Chrome profiles go
  stale/logged-out → do a fresh login per capture. Cold Turbopack compiles are slow
  (10–15s) — wait before asserting a screenshot is blank.
- After each screen: `npx tsc --noEmit` (must be 0 errors) and
  `npx prettier --write` the touched files. `react-hooks/set-state-in-effect`
  warnings are pre-existing — ignore.

---

## 8. Database safety (production Neon)

- DB is **production Neon Postgres**. Schema changes: `prisma db push` ONLY — never
  `migrate deploy` (history is out of sync). Run the LOCAL binary
  `node_modules/.bin/prisma.cmd` (`npx prisma` silently no-ops in this shell). Stop
  the dev server before `prisma generate`.
- **Protected account — NEVER touch/delete/reseed:** `thuydan685@gmail.com` (the real
  teacher, ~21 students / 800+ lessons). The demo seeder is scoped to
  `demo@pianodiary.dev` and refuses protected emails.
- Redesign is UI-only — you should not need DB writes. If you read prod data, mask
  other users' PII (the auto-mode classifier blocks unmasked prod PII reads).

---

## 9. Workflow etiquette with the user

- He commits/pushes himself sometimes mid-task — always `git status`/`git log`
  before committing to avoid surprises. He's on `main` as the default branch; keep
  redesign work on `redesign-v2`, commit WIP freely there (reversible).
- End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- He wants to VERIFY each screen. After finishing one: typecheck, prettier,
  browser-screenshot it logged-in, show him, wait for approval before the next.
- To let him preview from anywhere (incl. his partner): push `redesign-v2` → Vercel
  builds a preview URL. The design gallery is also live at `/design-mockups/index.html`
  (behind auth) and linked from the `/forever` page's "See the new designs" button.

---

## 10. First action in the new chat

1. Read `public/design-mockups/dashboard-e.html` + one done component
   (`src/app/(root)/dashboard/_components/today-lessons-table.tsx`) to internalize the
   pattern, and skim `src/styles/globals.css` for exact token names.
2. Confirm the branch: `git checkout redesign-v2` (should already be there).
3. Start the next screen (Calendar → `calendar-e.html`) — or ask the user which
   screen to do next / whether to restart the dev server for a local Dashboard review
   vs push the branch for a Vercel preview.
