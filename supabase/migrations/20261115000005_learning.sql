-- =====================================================================
-- 5. LEARNING (lrn_)
-- =====================================================================
create table public.lrn_courses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id        uuid references public.skills(id) on delete set null,
  goal_id         uuid references public.goals(id) on delete set null,
  title           text not null,
  provider        text,                        -- 'Coursera','British Council','Book',...
  format          text not null default 'course'
                  check (format in ('course','book','certificate','workshop','self_study','other')),
  url             text,
  status          text not null default 'planned'
                  check (status in ('planned','in_progress','completed','dropped')),
  started_on      date,
  completed_on    date,
  est_hours       numeric(6,1),
  certificate_url text,
  fin_transaction_id uuid references public.fin_transactions(id) on delete set null, -- what it cost
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table public.lrn_study_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id     uuid references public.lrn_courses(id) on delete set null,
  skill_id      uuid references public.skills(id) on delete set null,
  occurred_at   timestamptz not null default now(),
  duration_min  integer not null check (duration_min > 0),
  topic         text not null,
  notes         text,
  focus_rating  smallint check (focus_rating between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on public.lrn_study_sessions (user_id, occurred_at desc);
