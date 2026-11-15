-- =====================================================================
-- YOURLIFE — Database Schema v1.1 (PostgreSQL 15+ / Supabase)
-- One life. One system. One truth.
--
-- Layer A (core)   : shared by every life area
-- Layer B (domain) : one prefix per module (fin_, car_, lrn_, hlt_, rel_, fam_, grw_)
-- Rules:
--   * Every table has user_id + RLS (single-user now, multi-user ready).
--   * Domain tables may reference core tables. Core never references domain
--     tables by FK; it uses (source_table, source_id) pointers instead.
--   * Aggregates (balances, progress, totals, dashboards, reports) are VIEWS
--     or functions over source tables. Nothing aggregated is stored.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------
-- Supported currencies: add a code here to support a new one.
create domain public.currency_code as char(3)
  check (value in ('VND','USD','EUR'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- 1. CORE (Layer A)
-- =====================================================================

-- 1.1 Profile & settings (1 row per user)
create table public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  locale        text not null default 'en' check (locale in ('en','vi')),
  timezone      text not null default 'Asia/Ho_Chi_Minh',
  currency      public.currency_code not null default 'VND',  -- base currency for all totals
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6), -- 1 = Monday
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 1.2 Life areas (the 7 modules; users can add more)
create table public.life_areas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key         text not null,                 -- 'finance','career','learning','health','relationships','family','growth'
  name        text not null,                 -- display name (override); UI falls back to i18n by key
  description text,
  icon        text,
  color       text,
  sort_order  smallint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, key)
);

-- 1.3 Metrics (definitions) — declared before goals because goals point at them
create table public.metrics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id  uuid references public.life_areas(id) on delete set null,
  name          text not null,
  unit          text,                         -- 'kg','h','VND','%','times'
  value_type    text not null default 'number'
                check (value_type in ('number','duration','currency','percent','rating','boolean')),
  aggregation   text not null default 'last'
                check (aggregation in ('sum','avg','last','count','min','max')),
  direction     text not null default 'up' check (direction in ('up','down','neutral')),
  source        text not null default 'manual' check (source in ('manual','derived')),
  derived_key   text,                         -- e.g. 'finance.monthly_expense' (see v_derived_metric_values)
  period        text check (period in ('day','week','month','quarter','year')),
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  check ((source = 'derived') = (derived_key is not null))
);

create table public.metric_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  metric_id    uuid not null references public.metrics(id) on delete cascade,
  value        numeric not null,
  recorded_at  timestamptz not null default now(),
  note         text,
  activity_log_id uuid,                       -- optional: entry captured from a Quick Log (FK added below)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index on public.metric_entries (metric_id, recorded_at desc);

-- 1.4 Goals (what to achieve)
create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id   uuid not null references public.life_areas(id) on delete restrict,
  parent_goal_id uuid references public.goals(id) on delete set null,
  title          text not null,
  description    text,
  why            text,                        -- motivation, shown in reviews
  goal_type      text not null default 'outcome' check (goal_type in ('outcome','habit','milestone')),
  status         text not null default 'active'
                 check (status in ('planned','active','paused','achieved','abandoned')),
  priority       smallint not null default 2 check (priority between 1 and 4),
  start_date     date,
  target_date    date,
  metric_id      uuid references public.metrics(id) on delete set null,
  baseline_value numeric,
  target_value   numeric,
  achieved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  check (metric_id is null or target_value is not null)
);
create index on public.goals (user_id, life_area_id, status);

-- 1.5 Projects (what to execute)
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id  uuid not null references public.life_areas(id) on delete restrict,
  goal_id       uuid references public.goals(id) on delete set null,
  title         text not null,
  description   text,
  status        text not null default 'active'
                check (status in ('planned','active','on_hold','completed','cancelled')),
  start_date    date,
  due_date      date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on public.projects (user_id, goal_id);

-- 1.6 Tasks
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id    uuid not null references public.life_areas(id) on delete restrict,
  project_id      uuid references public.projects(id) on delete set null,
  goal_id         uuid references public.goals(id) on delete set null,   -- for tasks directly under a goal
  parent_task_id  uuid references public.tasks(id) on delete cascade,
  title           text not null,
  notes           text,
  status          text not null default 'todo' check (status in ('todo','doing','done','cancelled')),
  priority        smallint not null default 3 check (priority between 1 and 4),  -- 1 = highest
  due_date        date,
  scheduled_for   date,                       -- "do on" date (Today view)
  recurrence_rule text,                       -- RFC 5545 RRULE, e.g. 'FREQ=WEEKLY;BYDAY=SU'
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check ((status = 'done') = (completed_at is not null))
);
create index on public.tasks (user_id, status, due_date);
create index on public.tasks (user_id, scheduled_for);

-- 1.7 Events (calendar)
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id    uuid not null references public.life_areas(id) on delete restrict,
  goal_id         uuid references public.goals(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  title           text not null,
  description     text,
  location        text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  all_day         boolean not null default false,
  recurrence_rule text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);
create index on public.events (user_id, starts_at);

-- 1.8 Activity logs (timeline: what actually happened)
--   source_table/source_id = NULL  -> manual log (Quick Log), editable
--   source_table/source_id set     -> index row maintained by trigger from a
--                                     domain record; read-only, never edited
create table public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id  uuid not null references public.life_areas(id) on delete restrict,
  occurred_at   timestamptz not null default now(),
  title         text not null,
  notes         text,
  duration_min  integer check (duration_min >= 0),
  goal_id       uuid references public.goals(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  task_id       uuid references public.tasks(id) on delete set null,
  source_table  text,
  source_id     uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (source_table, source_id),
  check ((source_table is null) = (source_id is null))
);
create index on public.activity_logs (user_id, occurred_at desc);
create index on public.activity_logs (user_id, life_area_id, occurred_at desc);

alter table public.metric_entries
  add constraint metric_entries_activity_log_fk
  foreign key (activity_log_id) references public.activity_logs(id) on delete set null;

-- 1.9 Journal (daily entries + free reflections)
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date    date not null default current_date,
  kind          text not null default 'daily' check (kind in ('daily','reflection')),
  life_area_id  uuid references public.life_areas(id) on delete set null,
  title         text,
  body          text not null default '',     -- markdown
  mood          smallint check (mood between 1 and 5),
  energy        smallint check (energy between 1 and 5),
  is_private    boolean not null default false, -- hidden from dashboard and (later) AI
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create unique index journal_one_daily_per_day
  on public.journal_entries (user_id, entry_date) where kind = 'daily' and deleted_at is null;

-- 1.10 Reviews (only the human-written part is stored; numbers are computed)
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_type   text not null check (period_type in ('weekly','monthly','quarterly','yearly')),
  period_start  date not null,
  period_end    date not null,
  status        text not null default 'draft' check (status in ('draft','completed')),
  wins          text,
  challenges    text,
  lessons       text,
  next_focus    text,
  overall_score smallint check (overall_score between 1 and 10),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, period_type, period_start),
  check (period_end >= period_start)
);

-- Life Wheel: one score per area per review
create table public.review_area_scores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  review_id     uuid not null references public.reviews(id) on delete cascade,
  life_area_id  uuid not null references public.life_areas(id) on delete cascade,
  score         smallint not null check (score between 1 and 10),
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (review_id, life_area_id)
);

-- 1.11 Attachments (files in Supabase Storage, bucket 'attachments/<user_id>/...')
create table public.attachments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type   text not null,                -- table name, e.g. 'goals','fin_transactions'
  entity_id     uuid not null,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.attachments (entity_type, entity_id);

-- 1.12 Tags (cross-cutting labels)
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table public.taggings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  entity_type text not null,
  entity_id   uuid not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id)
);
create index on public.taggings (entity_type, entity_id);
