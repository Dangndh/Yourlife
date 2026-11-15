-- =====================================================================
-- 6. HEALTH (hlt_)   — body measurements (weight, sleep...) are metric_entries
-- =====================================================================
create table public.hlt_workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  workout_type  text not null default 'other'
                check (workout_type in ('run','walk','cycle','swim','gym','yoga','sport','other')),
  duration_min  integer not null check (duration_min > 0),
  distance_km   numeric(6,2),
  intensity     smallint check (intensity between 1 and 5),
  calories      integer,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on public.hlt_workouts (user_id, occurred_at desc);

create table public.hlt_medical_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_type   text not null
                check (record_type in ('checkup','vaccination','illness','test_result','medication','dental','other')),
  occurred_on   date not null default current_date,
  title         text not null,
  provider      text,
  result        text,
  follow_up_on  date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
