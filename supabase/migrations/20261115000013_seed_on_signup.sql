-- =====================================================================
-- 14. SEED on sign-up: profile, 7 life areas, default metrics, categories
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
begin
  insert into profiles (user_id) values (new.id);

  insert into life_areas (user_id, key, name, icon, color, sort_order) values
    (new.id, 'finance',       'Finance',         'wallet',      'emerald', 1),
    (new.id, 'career',        'Career',          'briefcase',   'blue',    2),
    (new.id, 'learning',      'Learning',        'book-open',   'violet',  3),
    (new.id, 'health',        'Health',          'heart-pulse', 'rose',    4),
    (new.id, 'relationships', 'Relationships',   'users',       'pink',    5),
    (new.id, 'family',        'Family',          'home',        'amber',   6),
    (new.id, 'growth',        'Personal Growth', 'sprout',      'teal',    7);

  insert into metrics (user_id, life_area_id, name, unit, value_type, aggregation, direction, source, derived_key, period)
  select new.id, la.id, m.name, m.unit, m.value_type, m.aggregation, m.direction, m.source, m.derived_key, m.period
  from (values
    ('finance',       'Monthly income',        'VND',    'currency', 'sum',   'up',      'derived', 'finance.monthly_income',            'month'),
    ('finance',       'Monthly expense',       'VND',    'currency', 'sum',   'down',    'derived', 'finance.monthly_expense',           'month'),
    ('finance',       'Savings rate',          '%',      'percent',  'last',  'up',      'derived', 'finance.savings_rate',              'month'),
    ('career',        'Achievements',          'times',  'number',   'count', 'up',      'derived', 'career.quarterly_achievements',     'quarter'),
    ('learning',      'Study hours',           'h',      'duration', 'sum',   'up',      'derived', 'learning.weekly_study_hours',       'week'),
    ('health',        'Workouts',              'times',  'number',   'count', 'up',      'derived', 'health.weekly_workouts',            'week'),
    ('health',        'Weight',                'kg',     'number',   'last',  'neutral', 'manual',  null,                                null),
    ('health',        'Sleep',                 'h',      'duration', 'avg',   'up',      'manual',  null,                                'day'),
    ('relationships', 'Interactions',          'times',  'number',   'count', 'up',      'derived', 'relationships.monthly_interactions','month'),
    ('family',        'Family time',           'h',      'duration', 'sum',   'up',      'derived', 'family.weekly_hours',               'week'),
    ('growth',        'Life satisfaction',     '/10',    'rating',   'last',  'up',      'manual',  null,                                'week')
  ) as m(area_key, name, unit, value_type, aggregation, direction, source, derived_key, period)
  join life_areas la on la.user_id = new.id and la.key = m.area_key;

  insert into fin_categories (user_id, name, kind, life_area_id)
  select new.id, c.name, c.kind, la.id
  from (values
    ('Salary', 'income', 'career'), ('Freelance', 'income', 'career'), ('Other income', 'income', null),
    ('Food & drinks', 'expense', null), ('Housing', 'expense', null), ('Transport', 'expense', null),
    ('Health', 'expense', 'health'), ('Education', 'expense', 'learning'), ('Family', 'expense', 'family'),
    ('Gifts & social', 'expense', 'relationships'), ('Entertainment', 'expense', null), ('Other expense', 'expense', null)
  ) as c(name, kind, area_key)
  left join life_areas la on la.user_id = new.id and la.key = c.area_key;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
