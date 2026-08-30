create extension if not exists pgcrypto;

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  ideal_customer text not null,
  product_service text,
  geography text,
  average_deal_value text,
  gross_profit text,
  max_cac text,
  service_slug text default 'flooring',
  geo_tokens text[] default '{}',
  avg_deal_value_cad numeric,
  gross_profit_cad numeric,
  max_cac_cad numeric,
  min_budget_cad numeric default 0,
  max_cpl_cad numeric,
  exclusive boolean default true,
  priority int default 100,
  accept_sla_seconds int default 900,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  service text not null,
  location text,
  timeline text,
  budget text,
  details text,
  consent boolean not null default false,
  score int not null default 0 check (score between 0 and 100),
  status text not null default 'new',
  source text,
  service_slug text,
  geo_normalized text,
  budget_cad numeric,
  qualified boolean default false,
  disqualify_reason text,
  routed_buyer_id uuid references buyers(id) on delete set null,
  route_attempts int default 0,
  created_at timestamptz not null default now()
);

create table if not exists lead_matches (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  buyer_id uuid references buyers(id) on delete cascade,
  match_score int not null default 0,
  accepted boolean,
  quoted_value numeric,
  closed_value numeric,
  readycustomer_fee numeric,
  status text not null default 'offered',
  exclusive boolean default true,
  offered_at timestamptz default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  fee_cad numeric,
  clawback boolean default false,
  attempt int default 1,
  created_at timestamptz not null default now()
);

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

alter table buyers enable row level security;
alter table leads enable row level security;
alter table lead_matches enable row level security;
alter table events enable row level security;
