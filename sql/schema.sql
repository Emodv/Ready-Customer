create extension if not exists pgcrypto;

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  ideal_customer text not null,
  product_service text,
  geography text,
  average_deal_value text,
  gross_profit text,
  max_cac text,
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
  created_at timestamptz not null default now()
);

alter table buyers enable row level security;
alter table leads enable row level security;
alter table lead_matches enable row level security;
