-- =====================================================================
-- 7. RELATIONSHIPS (rel_)   — people live in public.contacts
-- =====================================================================
create table public.rel_interactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  kind          text not null default 'meet'
                check (kind in ('meet','call','message','date','gift','help','other')),
  title         text not null,
  duration_min  integer check (duration_min >= 0),
  quality       smallint check (quality between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on public.rel_interactions (user_id, occurred_at desc);

create table public.rel_interaction_contacts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  interaction_id  uuid not null references public.rel_interactions(id) on delete cascade,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (interaction_id, contact_id)
);
create index on public.rel_interaction_contacts (contact_id);

create table public.rel_milestones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  kind          text not null default 'milestone'
                check (kind in ('first_met','anniversary','milestone','other')),
  title         text not null,
  occurred_on   date not null,
  recurs_yearly boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Who takes part in a calendar event (family dinners, birthdays...).
-- Family events ARE core events (life area = family) — not a second table.
create table public.rel_event_contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, contact_id)
);
