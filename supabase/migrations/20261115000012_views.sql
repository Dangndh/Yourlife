-- =====================================================================
-- 13. VIEWS — Dashboard & Reports read only from here (security_invoker
--     makes every view obey the caller's RLS)
-- =====================================================================

-- 13.1 Finance (multi-currency: every total is converted to the profile's base currency)

-- Rate to base currency for a date: latest rate on/before the date, else the nearest later one.
-- Returns 1 for the base currency, NULL when no rate has been entered yet.
create or replace function public.fx_rate(p_user uuid, p_currency text, p_on date)
returns numeric language sql stable security invoker set search_path = public as $$
  select case
    when p_currency = (select currency from profiles where user_id = p_user) then 1::numeric
    else (select r.rate_to_base from fin_exchange_rates r
           join profiles p on p.user_id = r.user_id and p.currency = r.base_currency
          where r.user_id = p_user and r.currency = p_currency
          order by (r.rate_date <= p_on) desc, abs(r.rate_date - p_on)
          limit 1)
  end
$$;

-- Every transaction with its amount converted to base currency (single place for conversion)
create view public.v_transactions_base with (security_invoker = true) as
select t.*, a.currency,
       round(t.amount * public.fx_rate(t.user_id, a.currency, t.occurred_on), 2) as amount_base
from public.fin_transactions t
join public.fin_accounts a on a.id = t.account_id
where t.deleted_at is null;

create view public.v_account_balances with (security_invoker = true) as
select a.id as account_id, a.user_id, a.name, a.account_type, a.currency, a.include_in_net_worth,
       a.opening_balance
       + coalesce(sum(case when t.account_id = a.id and t.txn_type = 'income'   then t.amount end), 0)
       - coalesce(sum(case when t.account_id = a.id and t.txn_type in ('expense','transfer') then t.amount end), 0)
       + coalesce(sum(case when t.transfer_account_id = a.id then coalesce(t.transfer_amount, t.amount) end), 0) as balance,
       public.fx_rate(a.user_id, a.currency, current_date) as fx_rate_today
from public.fin_accounts a
left join public.fin_transactions t
  on (t.account_id = a.id or t.transfer_account_id = a.id) and t.deleted_at is null
where a.deleted_at is null
group by a.id;

create view public.v_asset_current_values with (security_invoker = true) as
select distinct on (s.id)
       s.id as asset_id, s.user_id, s.name, s.kind, s.category, s.currency,
       v.value as current_value, v.valued_on,
       round(v.value * public.fx_rate(s.user_id, s.currency, current_date), 2) as current_value_base
from public.fin_assets s
join public.fin_asset_valuations v on v.asset_id = s.id
where s.deleted_at is null and s.disposed_on is null
order by s.id, v.valued_on desc;

-- Net worth in base currency; missing_rates > 0 means some USD/EUR amounts have no rate yet
create view public.v_net_worth with (security_invoker = true) as
select p.user_id, p.currency,
       coalesce((select sum(round(balance * fx_rate_today, 2)) from public.v_account_balances b
                  where b.user_id = p.user_id and b.include_in_net_worth), 0)
     + coalesce((select sum(case when kind = 'asset' then current_value_base else -current_value_base end)
                   from public.v_asset_current_values a
                  where a.user_id = p.user_id), 0) as net_worth,
       (select count(*) from public.v_account_balances b
         where b.user_id = p.user_id and b.include_in_net_worth and b.fx_rate_today is null)
     + (select count(*) from public.v_asset_current_values a
         where a.user_id = p.user_id and a.current_value_base is null) as missing_rates
from public.profiles p;

create view public.v_finance_monthly with (security_invoker = true) as
select t.user_id,
       date_trunc('month', t.occurred_on)::date as month,
       sum(t.amount_base) filter (where t.txn_type = 'income')  as income,
       sum(t.amount_base) filter (where t.txn_type = 'expense') as expense,
       coalesce(sum(t.amount_base) filter (where t.txn_type = 'income'), 0)
     - coalesce(sum(t.amount_base) filter (where t.txn_type = 'expense'), 0) as net,
       round(100 * (coalesce(sum(t.amount_base) filter (where t.txn_type = 'income'), 0)
                  - coalesce(sum(t.amount_base) filter (where t.txn_type = 'expense'), 0))
             / nullif(sum(t.amount_base) filter (where t.txn_type = 'income'), 0), 1) as savings_rate_pct,
       count(*) filter (where t.amount_base is null and t.txn_type <> 'transfer') as missing_rates
from public.v_transactions_base t
group by t.user_id, 2;

create view public.v_budget_status with (security_invoker = true) as
select b.id as budget_id, b.user_id, c.name as category, m.month, b.amount as budget,
       coalesce(sum(t.amount_base), 0) as spent,
       round(100 * coalesce(sum(t.amount_base), 0) / b.amount, 1) as used_pct
from public.fin_budgets b
join public.fin_categories c on c.id = b.category_id
cross join lateral (select date_trunc('month', current_date)::date as month) m
left join public.v_transactions_base t
  on t.category_id = b.category_id and t.txn_type = 'expense'
 and t.occurred_on >= m.month and t.occurred_on < m.month + interval '1 month'
where b.deleted_at is null and b.starts_on <= m.month and (b.ends_on is null or b.ends_on >= m.month)
group by b.id, c.name, m.month;

-- 13.2 Metrics: derived series are computed from source tables
create view public.v_derived_metric_values with (security_invoker = true) as
select user_id, 'finance.monthly_income'  as derived_key, month as period_start, coalesce(income, 0)  as value from public.v_finance_monthly
union all
select user_id, 'finance.monthly_expense', month, coalesce(expense, 0) from public.v_finance_monthly
union all
select user_id, 'finance.savings_rate', month, savings_rate_pct from public.v_finance_monthly where savings_rate_pct is not null
union all
select user_id, 'learning.weekly_study_hours', date_trunc('week', occurred_at)::date, round(sum(duration_min) / 60.0, 1)
  from public.lrn_study_sessions where deleted_at is null group by 1, 3
union all
select user_id, 'health.weekly_workouts', date_trunc('week', occurred_at)::date, count(*)
  from public.hlt_workouts where deleted_at is null group by 1, 3
union all
select user_id, 'career.quarterly_achievements', date_trunc('quarter', achieved_on)::date, count(*)
  from public.car_achievements where deleted_at is null group by 1, 3
union all
select user_id, 'relationships.monthly_interactions', date_trunc('month', occurred_at)::date, count(*)
  from public.rel_interactions where deleted_at is null group by 1, 3
union all
select i.user_id, 'family.weekly_hours', date_trunc('week', i.occurred_at)::date, round(sum(coalesce(i.duration_min, 0)) / 60.0, 1)
  from public.rel_interactions i
 where i.deleted_at is null
   and exists (select 1 from public.rel_interaction_contacts ic join public.contacts c on c.id = ic.contact_id
                where ic.interaction_id = i.id and c.is_family)
 group by 1, 3;

-- One series for every metric, manual or derived
create view public.v_metric_series with (security_invoker = true) as
select m.id as metric_id, m.user_id, e.recorded_at::date as period_start, e.value
from public.metrics m
join public.metric_entries e on e.metric_id = m.id and e.deleted_at is null
where m.source = 'manual' and m.deleted_at is null
union all
select m.id, m.user_id, d.period_start, d.value
from public.metrics m
join public.v_derived_metric_values d on d.derived_key = m.derived_key and d.user_id = m.user_id
where m.source = 'derived' and m.deleted_at is null;

create view public.v_metric_latest with (security_invoker = true) as
select distinct on (metric_id) metric_id, user_id, period_start, value
from public.v_metric_series
order by metric_id, period_start desc;

-- 13.3 Goal progress (never typed by hand)
create view public.v_goal_progress with (security_invoker = true) as
with task_stats as (
  select coalesce(t.goal_id, p.goal_id) as goal_id,
         count(*) filter (where t.status <> 'cancelled') as tasks_total,
         count(*) filter (where t.status = 'done')       as tasks_done
  from public.tasks t
  left join public.projects p on p.id = t.project_id
  where t.deleted_at is null and coalesce(t.goal_id, p.goal_id) is not null
  group by 1
)
select g.id as goal_id, g.user_id, g.life_area_id, g.title, g.status, g.target_date,
       g.baseline_value, g.target_value, ml.value as current_value,
       coalesce(ts.tasks_total, 0) as tasks_total, coalesce(ts.tasks_done, 0) as tasks_done,
       case
         when g.status = 'achieved' then 1.0
         when g.metric_id is not null and ml.value is not null and g.target_value <> coalesce(g.baseline_value, 0)
           then round(least(greatest((ml.value - coalesce(g.baseline_value, 0))
                                   / (g.target_value - coalesce(g.baseline_value, 0)), 0), 1), 3)
         when ts.tasks_total > 0 then round(ts.tasks_done::numeric / ts.tasks_total, 3)
       end as progress,
       case when g.target_date is not null and g.start_date is not null and g.target_date > g.start_date
            then round(least(greatest((current_date - g.start_date)::numeric
                                    / (g.target_date - g.start_date), 0), 1), 3)
       end as time_elapsed           -- compare with progress => on track / behind
from public.goals g
left join public.v_metric_latest ml on ml.metric_id = g.metric_id
left join task_stats ts on ts.goal_id = g.id
where g.deleted_at is null;

-- 13.4 Relationships
create view public.v_contact_last_interaction with (security_invoker = true) as
select c.id as contact_id, c.user_id, c.full_name, c.is_family, c.desired_contact_days,
       max(i.occurred_at) as last_interaction_at,
       current_date - max(i.occurred_at)::date as days_since,
       (c.desired_contact_days is not null
        and (max(i.occurred_at) is null or current_date - max(i.occurred_at)::date > c.desired_contact_days)) as is_overdue
from public.contacts c
left join public.rel_interaction_contacts ic on ic.contact_id = c.id
left join public.rel_interactions i on i.id = ic.interaction_id and i.deleted_at is null
where c.deleted_at is null
group by c.id;

-- 13.5 Skills: current level = latest assessment
create view public.v_skill_levels with (security_invoker = true) as
select s.id as skill_id, s.user_id, s.name, s.category, s.target_level,
       la.level as current_level, la.assessed_on,
       (select coalesce(sum(duration_min), 0) from public.lrn_study_sessions ss
         where ss.skill_id = s.id and ss.deleted_at is null) as study_minutes
from public.skills s
left join lateral (select level, assessed_on from public.skill_assessments a
                    where a.skill_id = s.id order by assessed_on desc limit 1) la on true
where s.deleted_at is null;

-- 13.6 Habits: this week vs target
create view public.v_habit_this_week with (security_invoker = true) as
select h.id as habit_id, h.user_id, h.life_area_id, h.title, h.cadence,
       case when h.cadence = 'daily' then h.target_per_period * 7 else h.target_per_period end as weekly_target,
       count(c.id) as done_this_week
from public.habits h
left join public.habit_checkins c
  on c.habit_id = h.id and c.checkin_date >= date_trunc('week', current_date)::date
where h.deleted_at is null and h.is_active
group by h.id;

-- 13.7 Life Dashboard: one row per life area
create view public.v_life_area_summary with (security_invoker = true) as
select la.id as life_area_id, la.user_id, la.key, la.name, la.sort_order,
       (select count(*) from public.goals g
         where g.life_area_id = la.id and g.status = 'active' and g.deleted_at is null) as active_goals,
       (select round(avg(gp.progress), 3) from public.v_goal_progress gp
         where gp.life_area_id = la.id and gp.status = 'active') as avg_goal_progress,
       (select count(*) from public.activity_logs l
         where l.life_area_id = la.id and l.deleted_at is null
           and l.occurred_at >= now() - interval '7 days') as logs_7d,
       (select coalesce(sum(duration_min), 0) from public.activity_logs l
         where l.life_area_id = la.id and l.deleted_at is null
           and l.occurred_at >= now() - interval '7 days') as minutes_7d,
       (select max(occurred_at) from public.activity_logs l
         where l.life_area_id = la.id and l.deleted_at is null) as last_activity_at,
       (select s.score from public.review_area_scores s join public.reviews r on r.id = s.review_id
         where s.life_area_id = la.id order by r.period_start desc limit 1) as last_score,
       (select s.score from public.review_area_scores s join public.reviews r on r.id = s.review_id
         where s.life_area_id = la.id order by r.period_start desc offset 1 limit 1) as previous_score
from public.life_areas la
where la.is_active;

-- 13.8 Weekly / Monthly review numbers, computed for any period on demand
create or replace function public.period_summary(p_start date, p_end date)
returns jsonb
language sql stable security invoker set search_path = public
as $$
  select jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end),
    'tasks_done', (select count(*) from tasks
                    where status = 'done' and completed_at::date between p_start and p_end and deleted_at is null),
    'by_area', (select coalesce(jsonb_agg(x order by x.sort_order), '[]'::jsonb) from (
                  select la.key, la.name, la.sort_order,
                         count(l.id) as logs,
                         coalesce(sum(l.duration_min), 0) as minutes
                  from life_areas la
                  left join activity_logs l on l.life_area_id = la.id and l.deleted_at is null
                        and l.occurred_at::date between p_start and p_end
                  where la.is_active
                  group by la.id) x),
    'finance', (select jsonb_build_object(
                  'currency', (select currency from profiles where user_id = auth.uid()),
                  'income',  coalesce(sum(t.amount_base) filter (where t.txn_type = 'income'), 0),
                  'expense', coalesce(sum(t.amount_base) filter (where t.txn_type = 'expense'), 0))
                from v_transactions_base t
                where t.occurred_on between p_start and p_end),
    'goals_achieved', (select count(*) from goals
                        where achieved_at::date between p_start and p_end and deleted_at is null),
    'journal_days', (select count(*) from journal_entries
                      where kind = 'daily' and entry_date between p_start and p_end and deleted_at is null),
    'avg_mood', (select round(avg(mood), 2) from journal_entries
                  where entry_date between p_start and p_end and deleted_at is null)
  );
$$;
