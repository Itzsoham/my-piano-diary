# My Piano Diary

A lesson management system for piano teachers — manage students, schedule lessons, track attendance, generate monthly reports, and view analytics.

Built with the [T3 Stack](https://create.t3.gg/): **Next.js 16** · **tRPC 11** · **Prisma 6** · **PostgreSQL** · **NextAuth 5** · **Tailwind CSS 4** · **TypeScript**

## Features

- **Authentication** — Email/password, plus a one-click "Try the demo" login that seeds a full sample studio to explore instantly
- **Students** — Full CRUD, data tables with search/sort/filter, family grouping for siblings billed together
- **Lessons** — Schedule, reschedule (drag-and-drop), cancel, link to pieces
- **Attendance** — Mark Present/Pending/Cancelled with notes, and rate completed lessons 1-5 ("blossom" quality score)
- **Calendar** — Interactive monthly view with drag-and-drop
- **Reports** — Monthly student reports with print-to-PDF, plus combined reports for families
- **Pieces** — Music repertoire management with difficulty ratings
- **Profile** — User settings, password change, lesson rate config
- **Dashboard** — Analytics overview with charts and a top-students leaderboard ranked by lesson score
- **Design** — "Blossom Diary" visual theme across every screen, with a responsive sidebar (icon rail on desktop, bottom tab bar on mobile)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, CLOUDINARY_URL

# Push the Prisma schema to your database
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Database note:** this project uses `prisma db push` only — the migration history is out of sync, so `npm run db:generate` / `npm run db:migrate` (`prisma migrate dev` / `deploy`) must not be used here. See [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) for details.

## Scripts

| Command                | Description                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start dev server (Turbopack)                         |
| `npm run build`        | Production build                                     |
| `npm start`            | Start production server                              |
| `npm run db:studio`    | Open Prisma Studio                                   |
| `npm run db:push`      | Push the Prisma schema to the database (use this)    |
| `npm run db:generate`  | ⚠️ `prisma migrate dev` — do not use in this repo    |
| `npm run db:migrate`   | ⚠️ `prisma migrate deploy` — do not use in this repo |
| `npm run test`         | Run the Vitest test suite                            |
| `npm run lint:fix`     | Fix ESLint issues                                    |
| `npm run format:write` | Format with Prettier                                 |
| `npm run typecheck`    | TypeScript check                                     |

## Docs

| Document                                             | What's in it                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)       | Current architecture, tech stack, database schema, API routes, implemented features |
| [docs/ISSUES_AND_FIXES.md](docs/ISSUES_AND_FIXES.md) | Known issues, bugs, and how to fix them                                             |
| [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md)   | Roadmap, planned features, implementation guides                                    |

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **API**: [tRPC 11](https://trpc.io) (end-to-end type safety)
- **Database**: [Prisma 6](https://prisma.io) + PostgreSQL ([Neon](https://neon.tech))
- **Auth**: [NextAuth.js 5](https://authjs.dev) (Credentials/email-password)
- **UI**: [Tailwind CSS 4](https://tailwindcss.com) + [Shadcn/UI](https://ui.shadcn.com)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) + [React Query](https://tanstack.com/query)
- **Testing**: [Vitest](https://vitest.dev) (`npm run test`), CI via GitHub Actions on every push/PR to `main`

## Deploy

Deploy to [Vercel](https://create.t3.gg/en/deployment/vercel) — set environment variables and connect your database.

