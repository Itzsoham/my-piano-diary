# My Piano Diary

A lesson management system for piano teachers — manage students, schedule lessons, track attendance, generate monthly reports, and view analytics.

Built with the [T3 Stack](https://create.t3.gg/): **Next.js 15** · **tRPC 11** · **Prisma 6** · **PostgreSQL** · **NextAuth 5** · **Tailwind CSS 4** · **TypeScript**

## Features

- **Authentication** — Email/password + Google OAuth
- **Students** — Full CRUD, data tables with search/sort/filter
- **Lessons** — Schedule, reschedule (drag-and-drop), cancel, link to pieces
- **Attendance** — Mark Present/Absent/Makeup with notes
- **Calendar** — Interactive monthly view with drag-and-drop
- **Reports** — Monthly student reports with print-to-PDF
- **Pieces** — Music repertoire management with difficulty ratings
- **Profile** — User settings, password change, lesson rate config
- **Dashboard** — Analytics overview with charts

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start dev server (Turbopack) |
| `npm run build`        | Production build             |
| `npm start`            | Start production server      |
| `npm run db:studio`    | Open Prisma Studio           |
| `npm run db:generate`  | Run migrations (dev)         |
| `npm run db:migrate`   | Deploy migrations (prod)     |
| `npm run lint:fix`     | Fix ESLint issues            |
| `npm run format:write` | Format with Prettier         |
| `npm run typecheck`    | TypeScript check             |

## Docs

| Document                                             | What's in it                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)       | Current architecture, tech stack, database schema, API routes, implemented features |
| [docs/ISSUES_AND_FIXES.md](docs/ISSUES_AND_FIXES.md) | Known issues, bugs, and how to fix them                                             |
| [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md)   | Roadmap, planned features, implementation guides                                    |

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **API**: [tRPC 11](https://trpc.io) (end-to-end type safety)
- **Database**: [Prisma 6](https://prisma.io) + PostgreSQL ([Neon](https://neon.tech))
- **Auth**: [NextAuth.js 5](https://authjs.dev)
- **UI**: [Tailwind CSS 4](https://tailwindcss.com) + [Shadcn/UI](https://ui.shadcn.com)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) + [React Query](https://tanstack.com/query)

## Deploy

Deploy to [Vercel](https://create.t3.gg/en/deployment/vercel) — set environment variables and connect your database.

---
🎂 Happy Birthday! This update was made on the `birthday` branch.

