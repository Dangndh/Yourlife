-- =====================================================================
-- 8. FAMILY (fam_)   — members = contacts.is_family, events = core events
-- =====================================================================
-- A responsibility is a standing duty; its schedule and completions live in a
-- (recurring) core task, so it shows up in Today and Calendar for free.
create table public.fam_responsibilities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title           text not null,
  for_contact_id  uuid references public.contacts(id) on delete set null,
  task_id         uuid references public.tasks(id) on delete set null,
  shared_with     text,                        -- 'with sister', free text
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
