-- ReadyCustomer v0.2 additive migration. Safe for existing v0.1 data.
create extension if not exists pgcrypto;

alter table buyers add column if not exists phone text;
alter table buyers add column if not exists service_slug text default 'flooring';
alter table buyers add column if not exists geo_tokens text[] default '{}';
alter table buyers add column if not exists avg_deal_value_cad numeric;
alter table buyers add column if not exists gross_profit_cad numeric;
alter table buyers add column if not exists max_cac_cad numeric;
alter table buyers add column if not exists min_budget_cad numeric default 0;
alter table buyers add column if not exists max_cpl_cad numeric;
alter table buyers add column if not exists exclusive boolean default true;
alter table buyers add column if not exists priority int default 100;
alter table buyers add column if not exists accept_sla_seconds int default 900;
alter table buyers alter column status set default 'new';

alter table leads add column if not exists service_slug text;
alter table leads add column if not exists geo_normalized text;
alter table leads add column if not exists budget_cad numeric;
alter table leads add column if not exists qualified boolean default false;
alter table leads add column if not exists disqualify_reason text;
alter table leads add column if not exists routed_buyer_id uuid references buyers(id) on delete set null;
alter table leads add column if not exists route_attempts int default 0;

alter table lead_matches add column if not exists status text default 'offered';
alter table lead_matches add column if not exists exclusive boolean default true;
alter table lead_matches add column if not exists offered_at timestamptz default now();
alter table lead_matches add column if not exists expires_at timestamptz;
alter table lead_matches add column if not exists accepted_at timestamptz;
alter table lead_matches add column if not exists declined_at timestamptz;
alter table lead_matches add column if not exists fee_cad numeric;
alter table lead_matches add column if not exists clawback boolean default false;
alter table lead_matches add column if not exists attempt int default 1;

update lead_matches set status = 'accepted' where accepted is true;
update lead_matches set status = 'offered' where status is null;
update lead_matches set offered_at = coalesce(offered_at, created_at, now()) where offered_at is null;

-- If legacy data ever created more than one open match, keep the newest active
-- offer and close older duplicates before enforcing exclusivity.
with ranked as (
  select id, row_number() over (partition by lead_id order by coalesce(offered_at, created_at) desc, id desc) as rn
  from lead_matches
  where status = 'offered'
)
update lead_matches lm
set status = 'routed_next'
from ranked r
where lm.id = r.id and r.rn > 1;

create unique index if not exists lead_matches_one_active_offer_per_lead
  on lead_matches(lead_id) where status = 'offered';

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid,
  type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table events enable row level security;
