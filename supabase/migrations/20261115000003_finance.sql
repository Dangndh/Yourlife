-- =====================================================================
-- 3. FINANCE (fin_)
-- =====================================================================
create table public.fin_accounts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                 text not null,
  account_type         text not null
                       check (account_type in ('cash','bank','e_wallet','credit_card','savings','investment','loan')),
  currency             public.currency_code not null default 'VND',
  opening_balance      numeric(18,2) not null default 0,
  opened_on            date,
  include_in_net_worth boolean not null default true,
  is_archived          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create table public.fin_categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id     uuid references public.fin_categories(id) on delete set null,
  name          text not null,
  kind          text not null check (kind in ('income','expense')),
  life_area_id  uuid references public.life_areas(id) on delete set null, -- e.g. "Courses" -> Learning
  icon          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (user_id, kind, name)
);

create table public.fin_transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id          uuid not null references public.fin_accounts(id) on delete restrict,
  txn_type            text not null check (txn_type in ('income','expense','transfer')),
  amount              numeric(18,2) not null check (amount > 0),   -- always positive, in the account's currency
  transfer_amount     numeric(18,2) check (transfer_amount > 0),   -- received amount when the target account
                                                                  -- has another currency (NULL = same as amount)
  occurred_on         date not null default current_date,
  category_id         uuid references public.fin_categories(id) on delete set null,
  transfer_account_id uuid references public.fin_accounts(id) on delete restrict,
  payee               text,
  note                text,
  goal_id             uuid references public.goals(id) on delete set null,    -- e.g. savings goal
  contact_id          uuid references public.contacts(id) on delete set null, -- gift, loan to friend
  import_ref          text,                                                -- dedupe key for CSV import
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  check ((txn_type = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  check (transfer_amount is null or txn_type = 'transfer'),
  unique (user_id, import_ref)
);
create index on public.fin_transactions (user_id, occurred_on desc);
create index on public.fin_transactions (account_id);
create index on public.fin_transactions (category_id);

-- Exchange rates entered by the user: 1 <currency> = rate_to_base <base_currency>
-- e.g. ('USD', 'VND', 25400). Amounts are converted at the rate valid on their date.
create table public.fin_exchange_rates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  currency      public.currency_code not null,
  base_currency public.currency_code not null,
  rate_date     date not null default current_date,
  rate_to_base  numeric(18,6) not null check (rate_to_base > 0),
  source        text,                          -- 'manual', 'Vietcombank', ...
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, currency, base_currency, rate_date),
  check (currency <> base_currency)
);

create table public.fin_budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid not null references public.fin_categories(id) on delete cascade,
  amount       numeric(18,2) not null check (amount > 0),   -- per month, in base currency
  starts_on    date not null default date_trunc('month', current_date)::date,
  ends_on      date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- Assets & liabilities that are not cash accounts (house, car, gold, loans...)
create table public.fin_assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  kind         text not null check (kind in ('asset','liability')),
  category     text not null default 'other'
               check (category in ('real_estate','vehicle','gold','stock','fund','crypto','loan','mortgage','other')),
  currency     public.currency_code not null default 'VND',
  acquired_on  date,
  disposed_on  date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- Value history; current value = latest valuation (never stored on fin_assets)
create table public.fin_asset_valuations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset_id   uuid not null references public.fin_assets(id) on delete cascade,
  valued_on  date not null default current_date,
  value      numeric(18,2) not null check (value >= 0),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset_id, valued_on)
);
