-- =====================================================================
-- 9. PERSONAL GROWTH (grw_)  — reflections = journal_entries(kind='reflection')
-- =====================================================================
create table public.grw_experiences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id      uuid references public.goals(id) on delete set null,
  title        text not null,
  kind         text not null default 'other'
               check (kind in ('travel','first_time','event','challenge','volunteer','other')),
  occurred_on  date not null default current_date,
  ended_on     date,
  location     text,
  rating       smallint check (rating between 1 and 5),
  story        text,
  lessons      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
