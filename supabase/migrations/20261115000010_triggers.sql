-- =====================================================================
-- 10. updated_at triggers on every table that has the column
-- =====================================================================
do $$
declare t text;
begin
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'updated_at' and tb.table_type = 'BASE TABLE'
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =====================================================================
-- 11. AUTO ACTIVITY LOG from domain records
--   args: (area_key, occurred_col, title_col, duration_col or '', title_prefix)
--   The log row is an index entry pointing back to the source record.
-- =====================================================================
create or replace function public.sync_activity_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r          jsonb;
  v_area     uuid;
  v_when     timestamptz;
  v_title    text;
  v_duration integer;
begin
  if tg_op = 'DELETE' then
    delete from activity_logs where source_table = tg_table_name and source_id = old.id;
    return old;
  end if;

  r := to_jsonb(new);

  if (r->>'deleted_at') is not null then
    delete from activity_logs where source_table = tg_table_name and source_id = new.id;
    return new;
  end if;

  select id into v_area from life_areas
   where user_id = new.user_id and key = tg_argv[0];
  if v_area is null then
    return new;  -- area disabled/missing: keep the source record, skip the log
  end if;

  v_when     := (r->>tg_argv[1])::timestamptz;
  v_title    := coalesce(nullif(tg_argv[4], '') || ': ', '') || coalesce(r->>tg_argv[2], '');
  v_duration := case when tg_argv[3] = '' then null else (r->>tg_argv[3])::integer end;

  insert into activity_logs (user_id, life_area_id, occurred_at, title, duration_min, source_table, source_id)
  values (new.user_id, v_area, v_when, v_title, v_duration, tg_table_name, new.id)
  on conflict (source_table, source_id) do update
     set occurred_at  = excluded.occurred_at,
         title        = excluded.title,
         duration_min = excluded.duration_min,
         life_area_id = excluded.life_area_id;
  return new;
end $$;

create trigger log_activity after insert or update or delete on public.lrn_study_sessions
  for each row execute function public.sync_activity_log('learning', 'occurred_at', 'topic', 'duration_min', 'Study');
create trigger log_activity after insert or update or delete on public.hlt_workouts
  for each row execute function public.sync_activity_log('health', 'occurred_at', 'workout_type', 'duration_min', 'Workout');
create trigger log_activity after insert or update or delete on public.hlt_medical_records
  for each row execute function public.sync_activity_log('health', 'occurred_on', 'title', '', 'Health');
create trigger log_activity after insert or update or delete on public.rel_interactions
  for each row execute function public.sync_activity_log('relationships', 'occurred_at', 'title', 'duration_min', '');
create trigger log_activity after insert or update or delete on public.car_achievements
  for each row execute function public.sync_activity_log('career', 'achieved_on', 'title', '', 'Achievement');
create trigger log_activity after insert or update or delete on public.grw_experiences
  for each row execute function public.sync_activity_log('growth', 'occurred_on', 'title', '', 'Experience');
-- fin_transactions are intentionally NOT logged (too many rows); Finance has its own feed.

-- When a task is completed, log it (and un-log if reopened)
create or replace function public.sync_task_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' or new.status <> 'done' or new.deleted_at is not null then
    delete from activity_logs where source_table = 'tasks' and source_id = coalesce(new.id, old.id);
    return coalesce(new, old);
  end if;
  insert into activity_logs (user_id, life_area_id, occurred_at, title, goal_id, project_id, task_id, source_table, source_id)
  values (new.user_id, new.life_area_id, new.completed_at, 'Done: ' || new.title,
          new.goal_id, new.project_id, new.id, 'tasks', new.id)
  on conflict (source_table, source_id) do update
     set occurred_at = excluded.occurred_at, title = excluded.title, life_area_id = excluded.life_area_id;
  return new;
end $$;

create trigger log_task_done after insert or update or delete on public.tasks
  for each row execute function public.sync_task_log();
