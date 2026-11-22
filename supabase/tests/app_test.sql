-- Checks the rules the app relies on. Every failed check raises an error, so psql stops with a non-zero exit.
\set ON_ERROR_STOP 1
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;
grant execute on function pg_temp.check(boolean, text) to authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'a@x'), ('22222222-2222-2222-2222-222222222222', 'b@x');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Sign-up seed
select pg_temp.check((select count(*) from life_areas) = 7, 'new user gets 7 life areas');
select pg_temp.check((select count(*) from metrics where source = 'manual') = 3, 'new user gets 3 manual metrics');

-- Goals, projects, tasks; progress from tasks
insert into goals (title, life_area_id, start_date, target_date)
  select 'IELTS 7.5', id, current_date - 10, current_date + 20 from life_areas where key = 'learning';
insert into tasks (title, life_area_id, goal_id) select 'Essay ' || n, g.life_area_id, g.id from goals g, generate_series(1, 4) n;
update tasks set status = 'done', completed_at = now() where title = 'Essay 1';
select pg_temp.check((select progress from v_goal_progress where title = 'IELTS 7.5') = 0.25, 'goal progress = done tasks / tasks');

-- A done task writes a generated activity log, which the user cannot edit
select pg_temp.check((select count(*) from activity_logs where source_table = 'tasks') = 1, 'done task creates a log');
update activity_logs set title = 'changed' where source_table = 'tasks';
select pg_temp.check((select title from activity_logs where source_table = 'tasks') <> 'changed', 'generated log is read-only');

-- Journal: one daily entry per day
insert into journal_entries (entry_date, kind, body) values (current_date, 'daily', 'hi');
do $$ begin
  insert into journal_entries (entry_date, kind, body) values (current_date, 'daily', 'again');
  raise exception 'FAILED: second daily journal entry was accepted';
exception when unique_violation then raise notice 'ok: one daily journal entry per day';
end $$;

-- Metrics: entries at local noon (Asia/Ho_Chi_Minh = 05:00 UTC) land on that day
insert into metric_entries (metric_id, value, recorded_at) select id, 72, '2026-11-01T05:00:00Z' from metrics where name = 'Weight';
insert into metric_entries (metric_id, value, recorded_at) select id, 70.5, '2026-11-22T05:00:00Z' from metrics where name = 'Weight';
select pg_temp.check(
  (select array_agg(period_start::text order by period_start) from v_metric_series s join metrics m on m.id = s.metric_id where m.name = 'Weight')
    = array['2026-11-01', '2026-11-22'], 'metric series uses the entry day');

-- A goal measured by a metric needs a target; progress comes from the metric
do $$ begin
  insert into goals (title, life_area_id, metric_id)
    select 'No target', la.id, m.id from life_areas la, metrics m where la.key = 'health' and m.name = 'Weight';
  raise exception 'FAILED: goal with metric but no target was accepted';
exception when check_violation then raise notice 'ok: metric goal needs a target';
end $$;
insert into goals (title, life_area_id, metric_id, baseline_value, target_value)
  select 'Reach 68 kg', la.id, m.id, 72, 68 from life_areas la, metrics m where la.key = 'health' and m.name = 'Weight';
select pg_temp.check((select progress from v_goal_progress where title = 'Reach 68 kg') = 0.375, 'metric goal progress');

-- Reviews: one per period, Life Wheel scores 1–10, upsert per area
insert into reviews (period_type, period_start, period_end) values ('weekly', '2026-11-16', '2026-11-22');
do $$ begin
  insert into reviews (period_type, period_start, period_end) values ('weekly', '2026-11-16', '2026-11-22');
  raise exception 'FAILED: second review for the same week was accepted';
exception when unique_violation then raise notice 'ok: one review per period';
end $$;
insert into review_area_scores (review_id, life_area_id, score)
  select r.id, la.id, 6 from reviews r, life_areas la where la.key in ('health', 'learning');
insert into review_area_scores (review_id, life_area_id, score)
  select r.id, la.id, 8 from reviews r, life_areas la where la.key = 'health'
  on conflict (review_id, life_area_id) do update set score = excluded.score;
do $$ begin
  insert into review_area_scores (review_id, life_area_id, score) select r.id, la.id, 11 from reviews r, life_areas la where la.key = 'family';
  raise exception 'FAILED: score 11 was accepted';
exception when check_violation then raise notice 'ok: scores are 1–10';
end $$;
select pg_temp.check((select last_score from v_life_area_summary where key = 'health') = 8, 'area summary shows the latest score');
delete from reviews;
select pg_temp.check((select count(*) from review_area_scores) = 0, 'deleting a review deletes its scores');
insert into reviews (period_type, period_start, period_end) values ('weekly', '2026-11-16', '2026-11-22');

-- Learning: a study session writes a read-only log and feeds the weekly study-hours metric
insert into skills (name, category, target_level, life_area_id) select 'English', 'language', 4, id from life_areas where key = 'learning';
insert into skill_assessments (skill_id, level, assessed_on) select id, 2, '2026-10-01' from skills;
insert into skill_assessments (skill_id, level, assessed_on) select id, 3, '2026-11-20' from skills;
insert into lrn_courses (title, status, skill_id, est_hours) select 'IELTS Writing', 'in_progress', id, 20 from skills;
insert into lrn_study_sessions (topic, duration_min, occurred_at, course_id, skill_id)
  select 'Task 2 essay', 90, '2026-11-18T03:00:00Z', c.id, c.skill_id from lrn_courses c;
select pg_temp.check((select title from activity_logs where source_table = 'lrn_study_sessions') = 'Study: Task 2 essay', 'study session creates a log');
select pg_temp.check((select current_level from v_skill_levels where name = 'English') = 3, 'skill level = latest assessment');
select pg_temp.check((select study_minutes from v_skill_levels where name = 'English') = 90, 'skill counts study minutes');
select pg_temp.check(
  (select s.value from v_metric_series s join metrics m on m.id = s.metric_id where m.derived_key = 'learning.weekly_study_hours') = 1.5,
  'weekly study hours metric');
update lrn_study_sessions set deleted_at = now();
select pg_temp.check((select count(*) from activity_logs where source_table = 'lrn_study_sessions') = 0, 'deleting a session removes its log');

-- Vocabulary: reviews roll up into one study session per deck per day (and so into the Activity Log)
insert into lrn_decks (name, language, skill_id) select 'English words', 'en-US', id from skills;
insert into lrn_cards (deck_id, term, meaning) select id, 'apple', 'quả táo' from lrn_decks;
insert into lrn_cards (deck_id, term, meaning) select id, 'river', 'dòng sông' from lrn_decks;
select pg_temp.check((select total from v_deck_stats) = 2 and (select new_cards from v_deck_stats) = 2, 'deck stats count new cards');
insert into lrn_reviews (card_id, deck_id, rating, state_before, duration_ms, reviewed_at)
  select id, deck_id, 3, 0, 40000, '2026-11-20T02:00:00Z' from lrn_cards where term = 'apple';
insert into lrn_reviews (card_id, deck_id, rating, state_before, duration_ms, reviewed_at)
  select id, deck_id, 1, 0, 50000, '2026-11-20T02:05:00Z' from lrn_cards where term = 'river';
select pg_temp.check((select count(*) from lrn_study_sessions where deck_id is not null and deleted_at is null) = 1, 'reviews on one day share one session');
select pg_temp.check((select duration_min from lrn_study_sessions where deck_id is not null) = 2, 'session minutes = answer time, rounded up');
select pg_temp.check((select title from activity_logs a join lrn_study_sessions s on s.id = a.source_id where s.deck_id is not null) = 'Study: English words · 2 cards', 'vocab session appears in the log');
insert into lrn_reviews (card_id, deck_id, rating, state_before, duration_ms, reviewed_at)
  select id, deck_id, 3, 1, 10000, '2026-11-21T02:00:00Z' from lrn_cards where term = 'river';
select pg_temp.check((select count(*) from lrn_study_sessions where deck_id is not null) = 2, 'next day starts a new session');
select pg_temp.check((select reviews from v_vocab_daily where day = '2026-11-20') = 2
  and (select new_cards from v_vocab_daily where day = '2026-11-20') = 2
  and (select forgotten from v_vocab_daily where day = '2026-11-20') = 1, 'daily review counts');
insert into lrn_preferences default values;
select pg_temp.check((select daily_review_goal from lrn_preferences) = 20, 'default daily goal');
select id as deck_id from lrn_decks \gset
select set_config('test.deck_id', :'deck_id', false);

-- Row level security: another user sees none of it
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select pg_temp.check((select count(*) from goals) = 0, 'other user sees no goals');
select pg_temp.check((select count(*) from metric_entries) = 0, 'other user sees no metric entries');
select pg_temp.check((select count(*) from journal_entries) = 0, 'other user sees no journal');
select pg_temp.check((select count(*) from life_areas) = 7, 'other user sees only own areas');
select pg_temp.check((select count(*) from reviews) = 0, 'other user sees no reviews');
select pg_temp.check((select count(*) from lrn_courses) + (select count(*) from skills) = 0, 'other user sees no courses or skills');
select pg_temp.check((select count(*) from lrn_decks) + (select count(*) from lrn_cards) + (select count(*) from lrn_reviews) = 0, 'other user sees no vocabulary');
do $$ begin
  insert into lrn_cards (deck_id, term, meaning) values (current_setting('test.deck_id')::uuid, 'x', 'y');
  raise exception 'FAILED: other user added a card to someone else''s deck';
exception when foreign_key_violation then raise notice 'ok: cards only go into your own deck';
end $$;
