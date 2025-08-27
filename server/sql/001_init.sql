-- TABLES ---------------------------------------------------------------------

create table if not exists profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  created_at timestamptz default now()
);

create table if not exists simulations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null,
  title      text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz default now()
);

-- INDEXES -------------------------------------------------------------------

create index if not exists idx_simulations_owner_id on simulations(owner_id);
create index if not exists idx_audit_logs_owner_id on audit_logs(owner_id);

-- ROW LEVEL SECURITY --------------------------------------------------------

alter table profiles   enable row level security;
alter table simulations enable row level security;
alter table audit_logs enable row level security;

-- profiles policies
drop policy if exists profiles_owner_policy on profiles;
create policy profiles_owner_policy on profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- simulations policies
drop policy if exists simulations_owner_policy on simulations;
create policy simulations_owner_policy on simulations
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- audit_logs policies
drop policy if exists audit_logs_select_policy on audit_logs;
create policy audit_logs_select_policy on audit_logs
  for select
  using (auth.uid() = owner_id);
-- no insert/update/delete policies: operations remain forbidden

-- SECURITY DEFINER FUNCTION -------------------------------------------------

create or replace function rpc_log_action(
  p_owner    uuid,
  p_action   text,
  p_entity   text,
  p_entity_id uuid,
  p_diff     jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_owner <> auth.uid() then
    raise exception 'insufficient privileges to log action';
  end if;

  insert into audit_logs (owner_id, action, entity, entity_id, diff)
  values (p_owner, p_action, p_entity, p_entity_id, p_diff);
end;
$$;
