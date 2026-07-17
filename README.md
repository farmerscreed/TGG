# TGG Campus Eco-Challenge 2026

Web platform for the **Tilda Goes Green Foundation** Campus Eco-Challenge — a
university environmental-innovation competition for students at RSU, IAUE, and
UNIPORT (Port Harcourt, Nigeria).

Participants register, complete their profile, form teams, and submit a
multi-step project entry with supporting files. Coordinators track their
university's participants and submissions, judges score assigned entries against
weighted criteria, and admins manage the whole competition (categories,
settings, judges, coordinators, leaderboard, reports, and status decisions).

Live site: **https://www.tggcampuschallenge.com**

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 |
| Backend / DB | Supabase (Postgres, Auth, Storage, RLS) via `@supabase/ssr` |
| UI | Tailwind CSS 4, shadcn/Radix UI, lucide-react, sonner, next-themes |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Email | Resend |
| Hosting | Vercel |

## Roles & dashboards

| Role | Can do |
|---|---|
| **Participant** | Profile, team create/join, multi-step submission with file uploads |
| **Coordinator** | View their university's participants and submissions |
| **Judge** | Score assigned submissions against weighted criteria |
| **Admin** | Participants, submissions (+ status decisions), judges, coordinators, categories, settings, leaderboard, reports, CSV export |

Roles live in `user_roles`; the landing page routes each user to their dashboard.
Submissions move through: `draft → submitted → under_review → shortlisted →
winner / not_selected / disqualified`.

---

## Getting started (local)

```bash
npm install
cp .env.example .env      # then fill in the values (see docs/CONFIGURATION.md)
npm run dev               # http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build (requires RESEND_API_KEY to be set)
npm run start   # serve the production build
npm run lint    # eslint
```

> **Note:** the build imports the Resend client at module load, so
> `RESEND_API_KEY` must be present at build time (any non-empty value works
> locally). See `docs/CONFIGURATION.md`.

---

## Project structure

```
src/
  app/
    (auth)/            login, register, reset-password
    (dashboard)/       participant | coordinator | judge | admin dashboards
    api/               admin/create-judge, create-coordinator, export, notify
    auth/callback      Supabase auth callback
    team/join          team invite acceptance
  components/
    shared/            file-upload, word-counter, status badges/tracker
    ui/                shadcn/Radix primitives
    layout/            nav
  lib/
    supabase/          client / server / middleware helpers
    email/             Resend templates + triggers
    scoring.ts         shared judging weighted-total math
    constants.ts       universities, roles, statuses, limits, brand
docs/                  see below
```

## Documentation

| Doc | What it covers |
|---|---|
| [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) | Environment variables, Supabase Auth URL config, Vercel deploy, secret rotation |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Full schema, relationships, RLS, storage, triggers, RPCs |
| [`docs/AUDIT-2026-07.md`](docs/AUDIT-2026-07.md) | July 2026 codebase/DB audit — findings and fixes |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes |

---

## Deployment

Hosted on Vercel; pushes to the default branch deploy automatically. Because
`NEXT_PUBLIC_*` values are inlined at **build time**, changing them in Vercel
requires a **redeploy** to take effect. See `docs/CONFIGURATION.md` for the full
environment-variable and Supabase Auth setup.
