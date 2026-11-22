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

-- Row level security: another user sees none of it
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select pg_temp.check((select count(*) from goals) = 0, 'other user sees no goals');
select pg_temp.check((select count(*) from metric_entries) = 0, 'other user sees no metric entries');
select pg_temp.check((select count(*) from journal_entries) = 0, 'other user sees no journal');
select pg_temp.check((select count(*) from life_areas) = 7, 'other user sees only own areas');
select pg_temp.check((select count(*) from reviews) = 0, 'other user sees no reviews');
