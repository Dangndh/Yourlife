\set ON_ERROR_STOP 1
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x'), ('22222222-2222-2222-2222-222222222222','b@x');
select count(*) areas from life_areas; select count(*) metrics from metrics; select count(*) cats from fin_categories;
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) as my_areas from life_areas;
-- finance
insert into fin_accounts (name, account_type, opening_balance) values ('VCB','bank',10000000),('Cash','cash',500000);
insert into fin_transactions (account_id, txn_type, amount, category_id, occurred_on)
 select (select id from fin_accounts where name='VCB'), 'income', 30000000, (select id from fin_categories where name='Salary'), current_date;
insert into fin_transactions (account_id, txn_type, amount, category_id)
 select (select id from fin_accounts where name='VCB'), 'expense', 5000000, (select id from fin_categories where name='Education');
insert into fin_transactions (account_id, txn_type, amount, transfer_account_id)
 select (select id from fin_accounts where name='VCB'), 'transfer', 2000000, (select id from fin_accounts where name='Cash');
insert into fin_budgets (category_id, amount) select id, 4000000 from fin_categories where name='Education';
insert into fin_assets (name, kind, category) values ('Gold','asset','gold'),('Car loan','liability','loan');
insert into fin_asset_valuations (asset_id, value) select id, 20000000 from fin_assets where name='Gold';
insert into fin_asset_valuations (asset_id, value) select id, 8000000 from fin_assets where name='Car loan';
-- multi-currency: USD account, USD salary, VND->USD transfer, rates
insert into fin_accounts (name, account_type, currency, opening_balance) values ('Wise USD','bank','USD',100);
insert into fin_transactions (account_id, txn_type, amount, category_id)
 select (select id from fin_accounts where name='Wise USD'), 'income', 1000, (select id from fin_categories where name='Freelance');
insert into fin_transactions (account_id, txn_type, amount, transfer_account_id, transfer_amount)
 select (select id from fin_accounts where name='VCB'), 'transfer', 2540000, (select id from fin_accounts where name='Wise USD'), 100;
select name, currency, balance, fx_rate_today from v_account_balances order by name;
select net_worth, missing_rates from v_net_worth;   -- rate missing -> flagged
insert into fin_exchange_rates (currency, base_currency, rate_to_base, rate_date) values ('USD','VND',25400,current_date - 10),('EUR','VND',27500,current_date - 10);
select * from v_net_worth;
select month, income, expense, net, savings_rate_pct from v_finance_monthly;
select category, budget, spent, used_pct from v_budget_status;
-- learning goal with derived metric
insert into skills (name, category) values ('English','language');
insert into skill_assessments (skill_id, level) select id, 3 from skills;
insert into goals (life_area_id, title, metric_id, baseline_value, target_value, start_date, target_date)
 select la.id, 'Study 10h/week', m.id, 0, 10, current_date - 30, current_date + 60 from life_areas la, metrics m where la.key='learning' and m.derived_key='learning.weekly_study_hours';
insert into lrn_study_sessions (topic, duration_min, skill_id) select 'Writing task 2', 180, id from skills;
-- task-based goal
insert into goals (life_area_id, title) select id, 'Run a half marathon' from life_areas where key='health';
insert into tasks (life_area_id, goal_id, title) select life_area_id, id, 'Buy shoes' from goals where title like 'Run%';
insert into tasks (life_area_id, goal_id, title) select life_area_id, id, 'Plan' from goals where title like 'Run%';
update tasks set status='done', completed_at=now() where title='Buy shoes';
insert into hlt_workouts (workout_type, duration_min) values ('run', 45);
-- relationships/family
insert into contacts (full_name, relationship, is_family, family_role, desired_contact_days) values ('Mẹ','family',true,'mother',7),('Minh','friend',false,null,30);
insert into rel_interactions (title, kind, duration_min) values ('Ăn tối với mẹ','meet',120);
insert into rel_interaction_contacts (interaction_id, contact_id) select i.id, c.id from rel_interactions i, contacts c where c.full_name='Mẹ';
-- manual metric + manual log
insert into metric_entries (metric_id, value) select id, 68.5 from metrics where name='Weight';
insert into activity_logs (life_area_id, title, duration_min) select id, 'Read 20 pages', 30 from life_areas where key='growth';
select title, round(progress,3) progress, current_value, tasks_done, tasks_total from v_goal_progress order by title;
select source_table, title, duration_min from activity_logs order by source_table nulls first;
select key, active_goals, avg_goal_progress, logs_7d, minutes_7d from v_life_area_summary order by sort_order;
select full_name, days_since, is_overdue from v_contact_last_interaction order by full_name;
select name, current_level, study_minutes from v_skill_levels;
select m.name, l.value from v_metric_latest l join metrics m on m.id=l.metric_id order by 1;
select jsonb_pretty(period_summary(current_date - 6, current_date)) ;
-- generated log must be read-only
update activity_logs set title='hack' where source_table='hlt_workouts';
select title from activity_logs where source_table='hlt_workouts';
-- delete source -> log disappears; soft delete too
update hlt_workouts set deleted_at = now();
select count(*) as workout_logs_after_soft_delete from activity_logs where source_table='hlt_workouts';
update tasks set status='todo', completed_at=null where title='Buy shoes';
select count(*) as task_logs_after_reopen from activity_logs where source_table='tasks';
-- isolation
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as other_user_txns from fin_transactions; select count(*) other_user_logs from activity_logs; select * from v_net_worth;
