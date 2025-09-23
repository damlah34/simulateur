-- 010_budget.sql

-- 1) Catégories globales (pas de user_id ici)
create table if not exists budget_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('income','expense')),
  created_at timestamptz not null default now()
);

-- Seed (ne casse pas si déjà là)
insert into budget_categories (name, kind)
values 
  ('Salaire', 'income'),
  ('Loyers', 'income'),
  ('Alimentation', 'expense'),
  ('Logement', 'expense'),
  ('Transports', 'expense'),
  ('Santé', 'expense'),
  ('Loisirs', 'expense'),
  ('Services', 'expense'),
  ('Frais bancaires', 'expense')
on conflict (name) do nothing;

-- 2) Règles d’auto-catégorisation (par user)
create table if not exists budget_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  keyword text not null,
  category_id uuid not null references budget_categories(id),
  created_at timestamptz not null default now(),
  unique (user_id, keyword)
);

alter table budget_rules enable row level security;

drop policy if exists "rules-own" on budget_rules;
create policy "rules-own"
on budget_rules
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3) Transactions (par user)
create table if not exists budget_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  label text not null,
  amount numeric not null, -- >0 recette ; <0 dépense
  currency text default 'EUR',
  category_id uuid references budget_categories(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_bt_user_date on budget_transactions(user_id, date);

alter table budget_transactions enable row level security;

drop policy if exists "tx-own" on budget_transactions;
create policy "tx-own"
on budget_transactions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 4) Vue de synthèse mensuelle
create or replace view budget_monthly_summary as
select
  bt.user_id,
  to_char(bt.date, 'YYYY-MM') as ym,
  coalesce(bc.name, 'Non catégorisé') as category_name,
  coalesce(bc.kind, case when bt.amount >= 0 then 'income' else 'expense' end) as kind,
  sum(bt.amount)::numeric as total_amount
from budget_transactions bt
left join budget_categories bc on bc.id = bt.category_id
group by bt.user_id, ym, category_name, kind;
