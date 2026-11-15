# YourLife

> One life. One system. One truth.

A personal operating system to manage, understand and improve every dimension of life.
Responsive web app (PWA) built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui and Supabase.

## Status: Phase 0 (Setup)

- Magic-link sign-in (Supabase Auth), every page except `/login` requires a session
- App shell: desktop sidebar with the 7 life areas, phone bottom nav (Home · Tasks · Log · Journal · More)
- English / Vietnamese UI (`messages/en.json`, `messages/vi.json`), switch in Settings
- Command Center reads `v_life_area_summary`; each area page reads `v_goal_progress`
- Full database: 40 tables, 14 views, RLS on every table, seed on sign-up (`supabase/migrations`)
- Installable PWA manifest

## Project structure

```
src/
  app/(auth)/login        magic-link sign-in
  app/auth/callback       exchanges the link code for a session
  app/(app)/...           signed-in pages: /, /[area], /[area]/[page], /goals, /tasks, /log, ...
  core/                   shared layer: navigation, module manifest type, row types
  modules/<area>/         one folder per life area (manifest.ts today; components, queries, actions later)
  lib/supabase/           browser, server and proxy clients
  i18n/                   next-intl config (locale from cookie, no locale in URL)
  proxy.ts                refreshes the session and protects routes (Next 16 "proxy" = old middleware)
supabase/migrations/      SQL, applied in file-name order
```

Rules: modules import from `core`, never from each other. Dashboards and reports only query views;
no aggregated numbers are stored.

## Setup

1. **Environment**: copy `.env.example` to `.env.local` and fill in the Supabase Project URL and anon
   (publishable) key from *Supabase → Project Settings → API*. Never put the `service_role` key in this app.
2. **Database**: apply the migrations to your Supabase project, either
   - with the CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`, or
   - by pasting each file of `supabase/migrations/` in order into *SQL Editor → Run*.
3. **Auth**: in *Authentication → URL Configuration* set **Site URL** to your production URL and add these
   **Redirect URLs** (the magic link returns to whichever site you signed in from):
   - `http://localhost:3000/**`
   - `https://<your-app>.vercel.app/**` (production)
   - `https://*-<your-vercel-team>.vercel.app/**` (preview deployments)
4. **Run**: `npm install`, `npm run dev`, open http://localhost:3000 and sign in with your email.
   Or deploy on Vercel: import the repo, add the two `NEXT_PUBLIC_SUPABASE_*` variables, deploy.
   The sign-up trigger creates your profile, 7 life areas, 11 default metrics and 12 finance categories.

## Testing the database without Supabase

```bash
createdb yourlife_test
psql -d yourlife_test -f supabase/local_auth_mock.sql $(ls supabase/migrations/*.sql | grep -v storage | sed 's/^/-f /')
psql -d yourlife_test -f supabase/smoke_test.sql
```

## Docs

Product requirements and the database design live in the project docs (PRD v1.0, Database Schema v1.1).
