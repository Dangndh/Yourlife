-- =====================================================================
-- 4. CAREER (car_)
-- =====================================================================
create table public.car_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company         text not null,
  title           text not null,
  employment_type text not null default 'full_time'
                  check (employment_type in ('full_time','part_time','contract','freelance','internship','self_employed')),
  location        text,
  started_on      date not null,
  ended_on        date,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (ended_on is null or ended_on >= started_on)
);

create table public.car_work_projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id       uuid references public.car_jobs(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null, -- optional link to a core project
  name         text not null,
  role         text,
  status       text not null default 'active' check (status in ('planned','active','completed','cancelled')),
  started_on   date,
  ended_on     date,
  description  text,
  outcome      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.car_achievements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id           uuid references public.car_jobs(id) on delete set null,
  work_project_id  uuid references public.car_work_projects(id) on delete set null,
  skill_id         uuid references public.skills(id) on delete set null,
  goal_id          uuid references public.goals(id) on delete set null,
  title            text not null,
  achieved_on      date not null default current_date,
  kind             text not null default 'achievement'
                   check (kind in ('achievement','promotion','award','certification','publication','other')),
  impact           text,                       -- measurable result, for CV later
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
