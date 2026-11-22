-- =====================================================================
-- Learning Hub: vocabulary decks with spaced repetition (FSRS)
--   lrn_decks     a word list for one language
--   lrn_cards     one word/phrase + its scheduling state
--   lrn_reviews   every answer (the history FSRS learns from)
-- Each day of reviews in a deck becomes one study session, so it shows in
-- the Activity Log and in weekly study hours like any other study.
-- =====================================================================

create table public.lrn_decks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id         uuid references public.skills(id) on delete set null,
  name             text not null check (length(name) between 1 and 200),
  language         text not null default 'en-US',   -- BCP 47, used for text-to-speech
  description      text,
  new_per_day      smallint not null default 10 check (new_per_day between 0 and 200),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index on public.lrn_decks (user_id) where deleted_at is null;

create table public.lrn_cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deck_id          uuid not null references public.lrn_decks(id) on delete cascade,
  term             text not null check (length(term) between 1 and 500),
  meaning          text not null check (length(meaning) between 1 and 1000),
  pronunciation    text,                             -- IPA or romanization
  example          text,
  example_meaning  text,
  notes            text,
  -- scheduling state (see src/modules/learning/vocab/srs.ts)
  state            smallint not null default 0 check (state between 0 and 3), -- 0 new, 1 learning, 2 review, 3 relearning
  step             smallint not null default 0,      -- learning step while state is 1 or 3
  stability        double precision,                 -- days until recall drops to 90%
  difficulty       double precision check (difficulty between 1 and 10),
  due_at           timestamptz not null default now(),
  last_review_at   timestamptz,
  reps             integer not null default 0,
  lapses           integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index on public.lrn_cards (deck_id, due_at) where deleted_at is null;
create index on public.lrn_cards (user_id, state) where deleted_at is null;

create table public.lrn_reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id          uuid not null references public.lrn_cards(id) on delete cascade,
  deck_id          uuid not null references public.lrn_decks(id) on delete cascade,
  reviewed_at      timestamptz not null default now(),
  rating           smallint not null check (rating between 1 and 4), -- 1 again, 2 hard, 3 good, 4 easy
  mode             text not null default 'flip' check (mode in ('flip','choice','type','listen')),
  state_before     smallint not null check (state_before between 0 and 3),
  interval_days    double precision,                 -- scheduled gap after this answer
  duration_ms      integer check (duration_ms between 0 and 600000),
  created_at       timestamptz not null default now()
);
create index on public.lrn_reviews (user_id, reviewed_at desc);
create index on public.lrn_reviews (card_id, reviewed_at);

-- One row per user
create table public.lrn_preferences (
  user_id            uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  daily_review_goal  smallint not null default 20 check (daily_review_goal between 1 and 1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Study sessions can come from a deck (one per deck per local day).
alter table public.lrn_study_sessions
  add column deck_id uuid references public.lrn_decks(id) on delete set null;
create index on public.lrn_study_sessions (deck_id, occurred_at) where deck_id is not null;

-- ---------------------------------------------------------------------
-- Same-owner checks: a card/review must point at the user's own deck.
-- ---------------------------------------------------------------------
create or replace function public.lrn_check_deck_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.lrn_decks d where d.id = new.deck_id and d.user_id = new.user_id) then
    raise exception 'deck not found' using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger check_deck_owner before insert or update of deck_id, user_id on public.lrn_cards
  for each row execute function public.lrn_check_deck_owner();
create trigger check_deck_owner before insert or update of deck_id, user_id on public.lrn_reviews
  for each row execute function public.lrn_check_deck_owner();

-- ---------------------------------------------------------------------
-- Reviews → that day's study session for the deck (→ Activity Log).
-- ---------------------------------------------------------------------
create or replace function public.lrn_review_to_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz      text;
  v_day     date;
  v_from    timestamptz;
  v_to      timestamptz;
  v_name    text;
  v_count   integer;
  v_ms      bigint;
  v_first   timestamptz;
  v_session uuid;
  v_minutes integer;
begin
  select coalesce(p.timezone, 'UTC') into v_tz from profiles p where p.user_id = new.user_id;
  v_tz   := coalesce(v_tz, 'UTC');
  v_day  := (new.reviewed_at at time zone v_tz)::date;
  v_from := v_day::timestamp at time zone v_tz;
  v_to   := (v_day + 1)::timestamp at time zone v_tz;

  select d.name into v_name from lrn_decks d where d.id = new.deck_id;

  select count(*), coalesce(sum(coalesce(r.duration_ms, 0)), 0), min(r.reviewed_at)
    into v_count, v_ms, v_first
    from lrn_reviews r
   where r.deck_id = new.deck_id and r.reviewed_at >= v_from and r.reviewed_at < v_to;

  -- Answer time only, so idle tabs don't count as study. At least 1 minute.
  v_minutes := greatest(1, ceil(v_ms / 60000.0)::integer);

  select s.id into v_session
    from lrn_study_sessions s
   where s.deck_id = new.deck_id and s.deleted_at is null
     and s.occurred_at >= v_from and s.occurred_at < v_to
   order by s.occurred_at
   limit 1;

  if v_session is null then
    insert into lrn_study_sessions (user_id, deck_id, skill_id, occurred_at, duration_min, topic)
    select new.user_id, new.deck_id, d.skill_id, v_first, v_minutes,
           d.name || ' · ' || v_count || ' cards'
      from lrn_decks d where d.id = new.deck_id;
  else
    update lrn_study_sessions
       set duration_min = v_minutes,
           occurred_at  = v_first,
           topic        = v_name || ' · ' || v_count || ' cards'
     where id = v_session;
  end if;
  return new;
end $$;

create trigger review_to_session after insert on public.lrn_reviews
  for each row execute function public.lrn_review_to_session();

-- updated_at
create trigger set_updated_at before update on public.lrn_decks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lrn_cards
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lrn_preferences
  for each row execute function public.set_updated_at();

-- RLS: owner only
do $$
declare t text;
begin
  foreach t in array array['lrn_decks','lrn_cards','lrn_reviews','lrn_preferences'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_all on public.%I for all to authenticated
                    using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------
-- Reviews per local day: streaks, today's goal, history.
create view public.v_vocab_daily with (security_invoker = true) as
select r.user_id,
       (r.reviewed_at at time zone coalesce(p.timezone, 'UTC'))::date as day,
       count(*)::integer                                      as reviews,
       count(*) filter (where r.state_before = 0)::integer    as new_cards,
       count(*) filter (where r.rating = 1)::integer          as forgotten,
       coalesce(sum(r.duration_ms), 0)::bigint                as duration_ms
  from public.lrn_reviews r
  left join public.profiles p on p.user_id = r.user_id
 group by r.user_id, 2;

-- Card counts per deck. "Known" = in review with a stability of 21+ days.
create view public.v_deck_stats with (security_invoker = true) as
select d.id as deck_id,
       d.user_id,
       count(c.id)::integer                                                     as total,
       count(c.id) filter (where c.state = 0)::integer                          as new_cards,
       count(c.id) filter (where c.state in (1, 3))::integer                    as learning,
       count(c.id) filter (where c.state = 2 and c.stability < 21)::integer     as young,
       count(c.id) filter (where c.state = 2 and c.stability >= 21)::integer    as known,
       count(c.id) filter (where c.state <> 0 and c.due_at <= now())::integer   as due_now
  from public.lrn_decks d
  left join public.lrn_cards c on c.deck_id = d.id and c.deleted_at is null
 where d.deleted_at is null
 group by d.id, d.user_id;
