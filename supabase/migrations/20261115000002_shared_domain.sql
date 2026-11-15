-- =====================================================================
-- 2. SHARED DOMAIN (used by more than one module)
-- =====================================================================

-- Skills: shared by Career and Learning (one skill, one row)
create table public.skills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id  uuid references public.life_areas(id) on delete set null,
  name          text not null,
  category      text,                         -- 'language','technical','soft','aviation',...
  target_level  smallint check (target_level between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (user_id, name)
);

-- Level history (current level = latest assessment; never stored on skills)
create table public.skill_assessments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id     uuid not null references public.skills(id) on delete cascade,
  level        smallint not null check (level between 1 and 5),
  assessed_on  date not null default current_date,
  evidence     text,                          -- 'IELTS mock 6.5', 'Passed AWS SAA'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.skill_assessments (skill_id, assessed_on desc);

-- Contacts: shared by Relationships and Family (family = is_family)
create table public.contacts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name        text not null,
  nickname         text,
  relationship     text not null default 'friend'
                   check (relationship in ('partner','family','friend','colleague','mentor','acquaintance','other')),
  is_family        boolean not null default false,
  family_role      text,                      -- 'mother','father','sibling','child',...
  birthday         date,
  phone            text,
  email            text,
  closeness        smallint check (closeness between 1 and 5),
  desired_contact_days integer check (desired_contact_days > 0), -- "reach out every N days"
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- Habits: shown in Health, attachable to any area
create table public.habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  life_area_id      uuid not null references public.life_areas(id) on delete restrict,
  goal_id           uuid references public.goals(id) on delete set null,
  title             text not null,
  cadence           text not null default 'daily' check (cadence in ('daily','weekly')),
  target_per_period smallint not null default 1 check (target_per_period > 0),
  is_active         boolean not null default true,
  started_on        date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table public.habit_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id      uuid not null references public.habits(id) on delete cascade,
  checkin_date  date not null default current_date,
  value         numeric not null default 1,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (habit_id, checkin_date)
);
