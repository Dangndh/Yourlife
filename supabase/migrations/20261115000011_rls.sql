-- =====================================================================
-- 12. ROW LEVEL SECURITY
-- =====================================================================
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'user_id'
      and table_name in (select table_name from information_schema.tables
                         where table_schema = 'public' and table_type = 'BASE TABLE')
      and table_name <> 'activity_logs'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_all on public.%I for all to authenticated
                    using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Activity logs: generated rows (source_table set) are read-only for the user
alter table public.activity_logs enable row level security;
create policy logs_select on public.activity_logs for select to authenticated
  using (user_id = auth.uid());
create policy logs_insert on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid() and source_table is null);
create policy logs_update on public.activity_logs for update to authenticated
  using (user_id = auth.uid() and source_table is null)
  with check (user_id = auth.uid() and source_table is null);
create policy logs_delete on public.activity_logs for delete to authenticated
  using (user_id = auth.uid() and source_table is null);
