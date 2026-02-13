-- =====================================================================
-- SUPABASE SQL MIGRATION PACK (Server API only, multi-tenant SaaS)
-- Copy into numbered migrations (e.g., supabase/migrations/0001_*.sql ...)
-- Assumes: you use Supabase Auth (auth.users) and Supabase Storage
-- =====================================================================

-- =========================================================
-- 0001_extensions_base.sql
-- =========================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================
-- 0002_enums_core.sql
-- =========================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('owner','admin','manager','staff','viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_session_status') then
    create type inventory_session_status as enum (
      'draft','in_progress','pending_review','approved','synced','cancelled','flagged'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_count_method') then
    create type inventory_count_method as enum ('manual','barcode','image_ai','manager_adjustment');
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_run_type') then
    create type ai_run_type as enum ('label_recognition','ocr','embedding_match');
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_run_status') then
    create type ai_run_status as enum ('queued','running','succeeded','failed','cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'syrve_job_type') then
    create type syrve_job_type as enum ('bootstrap','products_sync','stock_snapshot','inventory_check','inventory_commit');
  end if;

  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('pending','processing','success','failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'asset_role') then
    create type asset_role as enum ('product_primary','product_label','product_bottle','inventory_evidence','other');
  end if;
end $$;

-- =========================================================
-- 0003_tenant_auth.sql
-- =========================================================
-- Tenant root
create table if not exists public.business_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  country text,
  city text,
  address text,
  currency text default 'EUR',
  language text default 'en',
  timezone text default 'Europe/Lisbon',
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User profile (one per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.business_profile(id) on delete set null,
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (business_id, user_id, role)
);

-- Trigger: updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_business_profile_updated_at on public.business_profile;
create trigger trg_business_profile_updated_at
before update on public.business_profile
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Utility: current business_id
create or replace function public.current_business_id()
returns uuid language sql stable as $$
  select business_id from public.profiles where id = auth.uid()
$$;

-- Utility: role check
create or replace function public.has_role(required app_role)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.business_id = public.current_business_id()
      and ur.user_id = auth.uid()
      and ur.role = required
  )
$$;

create or replace function public.has_any_role(required app_role[])
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.business_id = public.current_business_id()
      and ur.user_id = auth.uid()
      and ur.role = any(required)
  )
$$;

-- =========================================================
-- 0004_logging_settings.sql
-- =========================================================
create table if not exists public.business_settings (
  business_id uuid primary key references public.business_profile(id) on delete cascade,
  inventory_requires_approval boolean not null default true,
  ai_recognition_enabled boolean not null default true,
  default_glass_id uuid null,
  default_bottle_size_ml numeric null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, flag_key)
);

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
before update on public.feature_flags
for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  actor_user_id uuid null references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  severity text not null default 'error',
  source text not null default 'app',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 0005_syrve_integration.sql
-- =========================================================
create table if not exists public.syrve_config (
  business_id uuid primary key references public.business_profile(id) on delete cascade,
  server_url text not null,
  api_login text not null,
  api_password_encrypted text not null,
  default_store_id uuid null,         -- Syrve store UUID
  default_department_id uuid null,    -- Syrve department UUID (optional)
  selected_category_ids uuid[] null,  -- Syrve product group UUIDs (optional)
  account_surplus_code text default '5.10',
  account_shortage_code text default '5.09',
  connection_status text not null default 'disconnected',
  connection_tested_at timestamptz null,
  last_sync_at timestamptz null,
  sync_lock_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_syrve_config_updated_at on public.syrve_config;
create trigger trg_syrve_config_updated_at
before update on public.syrve_config
for each row execute function public.set_updated_at();

-- Lossless mirror store
create table if not exists public.syrve_raw_objects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  entity_type text not null,       -- department|group|store|product|product_group|terminal|...
  syrve_id uuid not null,
  payload jsonb not null,
  payload_hash text not null,
  synced_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  unique (business_id, entity_type, syrve_id, payload_hash)
);

create index if not exists idx_syrve_raw_objects_lookup
on public.syrve_raw_objects (business_id, entity_type, syrve_id);

create table if not exists public.syrve_sync_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  run_type syrve_job_type not null,
  status job_status not null default 'pending',
  stats jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create table if not exists public.syrve_api_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  action_type text not null, -- AUTH|FETCH_PRODUCTS|STOCK_SNAPSHOT|INV_CHECK|INV_COMMIT
  status text not null,
  request_payload text,
  response_payload text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Outbox jobs for idempotent Syrve sends
create table if not exists public.syrve_outbox_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  session_id uuid null, -- FK added later after inventory_sessions exists
  job_type syrve_job_type not null,
  payload_xml text not null,
  payload_hash text not null,
  status job_status not null default 'pending',
  attempts int not null default 0,
  last_error text,
  last_attempt_at timestamptz,
  response_xml text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, job_type, payload_hash)
);

drop trigger if exists trg_syrve_outbox_jobs_updated_at on public.syrve_outbox_jobs;
create trigger trg_syrve_outbox_jobs_updated_at
before update on public.syrve_outbox_jobs
for each row execute function public.set_updated_at();

-- =========================================================
-- 0006_org_catalog.sql
-- =========================================================
create table if not exists public.org_nodes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  syrve_id uuid not null,
  node_type text not null,
  parent_id uuid null references public.org_nodes(id) on delete set null,
  name text not null,
  code text,
  is_active boolean not null default true,
  synced_at timestamptz,
  syrve_data jsonb not null default '{}'::jsonb,
  unique (business_id, syrve_id)
);

create index if not exists idx_org_nodes_parent
on public.org_nodes (business_id, parent_id);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  syrve_store_id uuid not null,
  org_node_id uuid null references public.org_nodes(id) on delete set null,
  name text not null,
  code text,
  is_active boolean not null default true,
  synced_at timestamptz,
  unique (business_id, syrve_store_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  syrve_group_id uuid not null,
  parent_id uuid null references public.categories(id) on delete set null,
  name text not null,
  sort_order int not null default 0,
  is_in_scope boolean not null default true,
  is_active boolean not null default true,
  default_glass_id uuid null, -- FK added after glass_dimensions
  synced_at timestamptz,
  syrve_data jsonb not null default '{}'::jsonb,
  unique (business_id, syrve_group_id)
);

create index if not exists idx_categories_parent
on public.categories (business_id, parent_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  syrve_product_id uuid not null,
  category_id uuid null references public.categories(id) on delete set null,
  name text not null,
  description text,
  sku text,             -- Syrve "num"
  code text,            -- Syrve "code"
  product_type text,
  unit_name text,
  unit_capacity_liters numeric,
  default_sale_price numeric,
  not_in_store_movement boolean not null default false,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  synced_at timestamptz,
  syrve_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  unique (business_id, syrve_product_id)
);

create index if not exists idx_products_category
on public.products (business_id, category_id);

create index if not exists idx_products_search
on public.products (business_id, name);

create table if not exists public.product_barcodes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  barcode text not null,
  source text not null default 'syrve', -- syrve|manual|ai
  confidence numeric,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, barcode)
);

create index if not exists idx_product_barcodes_product
on public.product_barcodes (business_id, product_id);

-- =========================================================
-- 0007_wine_rules_media_ai.sql
-- =========================================================
-- Wine extension (optional 1:1 for wine-only fields)
create table if not exists public.wines (
  product_id uuid primary key references public.products(id) on delete cascade,
  business_id uuid not null references public.business_profile(id) on delete cascade,
  wine_type text,
  producer text,
  vintage int,
  country text,
  region text,
  appellation text,
  alcohol_content numeric,
  volume_ml numeric,
  tasting_notes text,
  grape_varieties jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  critic_scores jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_wines_updated_at on public.wines;
create trigger trg_wines_updated_at
before update on public.wines
for each row execute function public.set_updated_at();

-- Glass + bottle configs
create table if not exists public.glass_dimensions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  name text not null,
  capacity_ml numeric not null check (capacity_ml > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

drop trigger if exists trg_glass_dimensions_updated_at on public.glass_dimensions;
create trigger trg_glass_dimensions_updated_at
before update on public.glass_dimensions
for each row execute function public.set_updated_at();

alter table public.categories
  add constraint fk_categories_default_glass
  foreign key (default_glass_id) references public.glass_dimensions(id) on delete set null;

create table if not exists public.bottle_sizes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  name text not null,
  ml numeric not null check (ml > 0),
  is_active boolean not null default true,
  unique (business_id, ml)
);

create table if not exists public.product_serving_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  product_id uuid null references public.products(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete cascade,
  sold_by_glass boolean not null default false,
  glass_dimension_id uuid null references public.glass_dimensions(id) on delete set null,
  bottle_size_ml numeric null check (bottle_size_ml is null or bottle_size_ml > 0),
  priority int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or category_id is not null)
);

drop trigger if exists trg_product_serving_rules_updated_at on public.product_serving_rules;
create trigger trg_product_serving_rules_updated_at
before update on public.product_serving_rules
for each row execute function public.set_updated_at();

-- Traits (flexible flags)
create table if not exists public.product_traits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  trait_key text not null,
  trait_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, trait_key)
);

drop trigger if exists trg_product_traits_updated_at on public.product_traits;
create trigger trg_product_traits_updated_at
before update on public.product_traits
for each row execute function public.set_updated_at();

-- Media registry (Supabase Storage metadata)
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  hash text,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (business_id, bucket, path)
);

create table if not exists public.product_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  role asset_role not null default 'product_primary',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, asset_id, role)
);

-- AI tables
create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  run_type ai_run_type not null,
  status ai_run_status not null default 'queued',
  model_name text,
  model_version text,
  input_asset_id uuid null references public.media_assets(id) on delete set null,
  confidence numeric,
  result jsonb not null default '{}'::jsonb,
  duration_ms int,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ai_runs_updated_at on public.ai_runs;
create trigger trg_ai_runs_updated_at
before update on public.ai_runs
for each row execute function public.set_updated_at();

create table if not exists public.ai_match_candidates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  ai_run_id uuid not null references public.ai_runs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  score numeric not null,
  rank int not null,
  created_at timestamptz not null default now(),
  unique (ai_run_id, product_id)
);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  ai_run_id uuid not null references public.ai_runs(id) on delete cascade,
  chosen_product_id uuid null references public.products(id) on delete set null,
  chosen_by uuid not null references public.profiles(id) on delete cascade,
  feedback_type text not null, -- correct|incorrect|partial|no_match
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 0008_inventory_stock.sql
-- =========================================================
create table if not exists public.stock_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  snapshot_at timestamptz not null default now(),
  qty numeric not null default 0,
  source text not null default 'syrve_stock_and_sales',
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_snapshots_lookup
on public.stock_snapshots (business_id, store_id, product_id, snapshot_at desc);

create table if not exists public.inventory_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete restrict,
  status inventory_session_status not null default 'draft',
  title text,
  comment text,
  baseline_source text not null default 'syrve_stock_snapshot',
  baseline_taken_at timestamptz,
  manager_only_expected boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid null references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  approved_at timestamptz,
  syrve_document_id text,
  syrve_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_inventory_sessions_updated_at on public.inventory_sessions;
create trigger trg_inventory_sessions_updated_at
before update on public.inventory_sessions
for each row execute function public.set_updated_at();

create index if not exists idx_inventory_sessions_status
on public.inventory_sessions (business_id, status, created_at desc);

-- Baseline expected stock (immutable per session)
create table if not exists public.inventory_baseline_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  session_id uuid not null references public.inventory_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  expected_qty_unopened numeric not null default 0,
  expected_open_liters numeric not null default 0,
  expected_total_liters numeric,
  captured_at timestamptz not null default now(),
  unique (session_id, product_id)
);

create index if not exists idx_inventory_baseline_session
on public.inventory_baseline_items (business_id, session_id);

-- Append-only counting events (collaboration safe)
create table if not exists public.inventory_count_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  session_id uuid not null references public.inventory_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  counted_by uuid not null references public.profiles(id) on delete restrict,
  bottles_unopened numeric not null default 0,
  open_ml numeric not null default 0,
  open_liters numeric generated always as (open_ml / 1000.0) stored,
  method inventory_count_method not null default 'manual',
  confidence numeric,
  ai_run_id uuid null references public.ai_runs(id) on delete set null,
  asset_id uuid null references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_count_events_session
on public.inventory_count_events (business_id, session_id, created_at desc);

-- Aggregates table for fast manager UI
create table if not exists public.inventory_product_aggregates (
  business_id uuid not null references public.business_profile(id) on delete cascade,
  session_id uuid not null references public.inventory_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  counted_unopened_total numeric not null default 0,
  counted_open_liters_total numeric not null default 0,
  counted_total_liters numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (session_id, product_id)
);

-- Optional variances materialization
create table if not exists public.inventory_variances (
  business_id uuid not null references public.business_profile(id) on delete cascade,
  session_id uuid not null references public.inventory_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  expected_total_liters numeric not null default 0,
  counted_total_liters numeric not null default 0,
  difference_liters numeric not null default 0,
  has_variance boolean not null default false,
  computed_at timestamptz not null default now(),
  primary key (session_id, product_id)
);

-- Link evidence assets to events (optional if you use asset_id directly)
create table if not exists public.inventory_event_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  count_event_id uuid not null references public.inventory_count_events(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (count_event_id, asset_id)
);

-- Wire outbox session FK now that sessions exist
alter table public.syrve_outbox_jobs
  add constraint fk_syrve_outbox_session
  foreign key (session_id) references public.inventory_sessions(id) on delete cascade;

-- =========================================================
-- 0009_triggers_aggregates.sql
-- =========================================================
-- Aggregate updater (on each count event insert)
create or replace function public.upsert_inventory_aggregate()
returns trigger language plpgsql as $$
declare
  total_liters numeric;
begin
  -- "Total liters" model:
  -- bottles_unopened contribution is ambiguous across products; for wine, you should convert using bottle size.
  -- For MVP, we store:
  --   counted_unopened_total as "bottle count"
  --   counted_open_liters_total as liters
  --   counted_total_liters = open liters only (or you can compute bottle->liters in app layer using rules)
  total_liters := new.open_liters;

  insert into public.inventory_product_aggregates (
    business_id, session_id, product_id,
    counted_unopened_total, counted_open_liters_total, counted_total_liters, updated_at
  )
  values (
    new.business_id, new.session_id, new.product_id,
    new.bottles_unopened, new.open_liters, total_liters, now()
  )
  on conflict (session_id, product_id)
  do update set
    counted_unopened_total = public.inventory_product_aggregates.counted_unopened_total + excluded.counted_unopened_total,
    counted_open_liters_total = public.inventory_product_aggregates.counted_open_liters_total + excluded.counted_open_liters_total,
    counted_total_liters = public.inventory_product_aggregates.counted_total_liters + excluded.counted_total_liters,
    updated_at = now();

  return new;
end $$;

drop trigger if exists trg_inventory_count_events_agg on public.inventory_count_events;
create trigger trg_inventory_count_events_agg
after insert on public.inventory_count_events
for each row execute function public.upsert_inventory_aggregate();

-- Variance recompute helper (call from app when manager enters review)
create or replace function public.recompute_inventory_variances(p_session_id uuid)
returns void language plpgsql as $$
begin
  insert into public.inventory_variances (
    business_id, session_id, product_id,
    expected_total_liters, counted_total_liters, difference_liters, has_variance, computed_at
  )
  select
    s.business_id,
    b.session_id,
    b.product_id,
    coalesce(b.expected_total_liters, (b.expected_open_liters + 0)),
    coalesce(a.counted_total_liters, 0),
    coalesce(a.counted_total_liters, 0) - coalesce(b.expected_total_liters, (b.expected_open_liters + 0)),
    (coalesce(a.counted_total_liters, 0) <> coalesce(b.expected_total_liters, (b.expected_open_liters + 0))),
    now()
  from public.inventory_sessions s
  join public.inventory_baseline_items b on b.session_id = s.id
  left join public.inventory_product_aggregates a
    on a.session_id = b.session_id and a.product_id = b.product_id
  where s.id = p_session_id
  on conflict (session_id, product_id)
  do update set
    expected_total_liters = excluded.expected_total_liters,
    counted_total_liters = excluded.counted_total_liters,
    difference_liters = excluded.difference_liters,
    has_variance = excluded.has_variance,
    computed_at = now();
end $$;

-- =========================================================
-- 0010_rls_policies.sql
-- =========================================================
-- Enable RLS for all business-scoped tables
alter table public.business_profile enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.business_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;
alter table public.error_logs enable row level security;

alter table public.syrve_config enable row level security;
alter table public.syrve_raw_objects enable row level security;
alter table public.syrve_sync_runs enable row level security;
alter table public.syrve_api_logs enable row level security;
alter table public.syrve_outbox_jobs enable row level security;

alter table public.org_nodes enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_barcodes enable row level security;

alter table public.wines enable row level security;
alter table public.glass_dimensions enable row level security;
alter table public.bottle_sizes enable row level security;
alter table public.product_serving_rules enable row level security;
alter table public.product_traits enable row level security;

alter table public.media_assets enable row level security;
alter table public.product_assets enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_match_candidates enable row level security;
alter table public.ai_feedback enable row level security;

alter table public.stock_snapshots enable row level security;
alter table public.inventory_sessions enable row level security;
alter table public.inventory_baseline_items enable row level security;
alter table public.inventory_count_events enable row level security;
alter table public.inventory_product_aggregates enable row level security;
alter table public.inventory_variances enable row level security;
alter table public.inventory_event_assets enable row level security;

-- ------------------------------
-- Helper predicate: same business
-- ------------------------------
create or replace function public.is_same_business(row_business_id uuid)
returns boolean language sql stable as $$
  select row_business_id = public.current_business_id()
$$;

-- ------------------------------
-- business_profile: allow read for members, write for owners/admin
-- ------------------------------
drop policy if exists "bp_select" on public.business_profile;
create policy "bp_select"
on public.business_profile for select
using (public.is_same_business(id));

drop policy if exists "bp_update_admin" on public.business_profile;
create policy "bp_update_admin"
on public.business_profile for update
using (public.is_same_business(id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(id) and public.has_any_role(array['owner','admin']));

-- ------------------------------
-- profiles: user can read within business; user can update self
-- ------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles for select
using (public.is_same_business(business_id));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- ------------------------------
-- user_roles: admin manages
-- ------------------------------
drop policy if exists "roles_select" on public.user_roles;
create policy "roles_select"
on public.user_roles for select
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "roles_admin_write" on public.user_roles;
create policy "roles_admin_write"
on public.user_roles for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

drop policy if exists "roles_admin_update" on public.user_roles;
create policy "roles_admin_update"
on public.user_roles for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

drop policy if exists "roles_admin_delete" on public.user_roles;
create policy "roles_admin_delete"
on public.user_roles for delete
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

-- ------------------------------
-- Generic policy template for most business tables (read all in business; write admin/manager)
-- ------------------------------
-- NOTE: For strict environments, split per table. This is a sane default.

-- business_settings
drop policy if exists "bs_select" on public.business_settings;
create policy "bs_select" on public.business_settings for select
using (public.is_same_business(business_id));

drop policy if exists "bs_admin_update" on public.business_settings;
create policy "bs_admin_update" on public.business_settings for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

-- Syrve config
drop policy if exists "syrve_config_select" on public.syrve_config;
create policy "syrve_config_select" on public.syrve_config for select
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "syrve_config_admin_write" on public.syrve_config;
create policy "syrve_config_admin_write" on public.syrve_config for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

drop policy if exists "syrve_config_admin_update" on public.syrve_config;
create policy "syrve_config_admin_update" on public.syrve_config for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

-- Catalog: read for everyone in business; writes only admin (sync/service role usually bypasses RLS)
-- categories
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories for select
using (public.is_same_business(business_id));

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

-- products
drop policy if exists "products_select" on public.products;
create policy "products_select" on public.products for select
using (public.is_same_business(business_id));

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin']));

-- Inventory sessions: staff can read sessions in business; only manager/admin can create/advance status
drop policy if exists "inv_sessions_select" on public.inventory_sessions;
create policy "inv_sessions_select" on public.inventory_sessions for select
using (public.is_same_business(business_id));

drop policy if exists "inv_sessions_manager_insert" on public.inventory_sessions;
create policy "inv_sessions_manager_insert" on public.inventory_sessions for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "inv_sessions_manager_update" on public.inventory_sessions;
create policy "inv_sessions_manager_update" on public.inventory_sessions for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

-- Baseline items: manager/admin only SELECT (staff must not see expected)
drop policy if exists "inv_baseline_select_manager" on public.inventory_baseline_items;
create policy "inv_baseline_select_manager" on public.inventory_baseline_items for select
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "inv_baseline_manager_write" on public.inventory_baseline_items;
create policy "inv_baseline_manager_write" on public.inventory_baseline_items for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

-- Count events: staff can insert during in_progress, read within business
drop policy if exists "inv_events_select" on public.inventory_count_events;
create policy "inv_events_select" on public.inventory_count_events for select
using (public.is_same_business(business_id));

drop policy if exists "inv_events_insert_staff" on public.inventory_count_events;
create policy "inv_events_insert_staff" on public.inventory_count_events for insert
with check (
  public.is_same_business(business_id)
  and public.has_any_role(array['owner','admin','manager','staff'])
  and exists (
    select 1 from public.inventory_sessions s
    where s.id = inventory_count_events.session_id
      and s.business_id = inventory_count_events.business_id
      and s.status = 'in_progress'
  )
);

-- Aggregates: read within business; writes by trigger (security definer not needed; trigger runs as table owner)
drop policy if exists "inv_aggs_select" on public.inventory_product_aggregates;
create policy "inv_aggs_select" on public.inventory_product_aggregates for select
using (public.is_same_business(business_id));

-- Variances: manager/admin read
drop policy if exists "inv_variances_select_manager" on public.inventory_variances;
create policy "inv_variances_select_manager" on public.inventory_variances for select
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

-- Media assets: read within business, write staff
drop policy if exists "media_select" on public.media_assets;
create policy "media_select" on public.media_assets for select
using (public.is_same_business(business_id));

drop policy if exists "media_insert" on public.media_assets;
create policy "media_insert" on public.media_assets for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager','staff']));

-- Outbox: manager/admin read; manager/admin write
drop policy if exists "outbox_select_manager" on public.syrve_outbox_jobs;
create policy "outbox_select_manager" on public.syrve_outbox_jobs for select
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "outbox_insert_manager" on public.syrve_outbox_jobs;
create policy "outbox_insert_manager" on public.syrve_outbox_jobs for insert
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));

drop policy if exists "outbox_update_manager" on public.syrve_outbox_jobs;
create policy "outbox_update_manager" on public.syrve_outbox_jobs for update
using (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']))
with check (public.is_same_business(business_id) and public.has_any_role(array['owner','admin','manager']));


-- =========================================================
-- 0011_fully_correct_liters_aggregation.sql
-- Purpose:
--   Make inventory_product_aggregates.counted_total_liters fully correct:
--     counted_total_liters = (bottles_unopened * bottle_size_ml/1000) + open_liters
--   Bottle size resolution precedence:
--     1) product_serving_rules (product-specific, active, lowest priority first)
--     2) product_serving_rules (category-specific, active, lowest priority first)
--     3) wines.volume_ml (if wine extension exists)
--     4) products.unit_capacity_liters * 1000
--     5) business_settings.default_bottle_size_ml
--     6) fallback 750
--
-- Notes:
--   - This keeps your DB as the source of “liters truth” for reporting and variance.
--   - Allows negative adjustments (manager corrections) because bottles_unopened/open_ml are numeric.
-- =========================================================

-- 1) Helper: resolve bottle size (ml) for a product within a business
create or replace function public.resolve_bottle_size_ml(
  p_business_id uuid,
  p_product_id uuid
) returns numeric
language plpgsql
stable
as $$
declare
  v_ml numeric;
  v_category_id uuid;
  v_unit_capacity_liters numeric;
  v_wine_volume_ml numeric;
  v_default_ml numeric;
begin
  -- Fetch product category + unit capacity
  select category_id, unit_capacity_liters
    into v_category_id, v_unit_capacity_liters
  from public.products
  where id = p_product_id
    and business_id = p_business_id;

  -- 1) Product-specific serving rule
  select psr.bottle_size_ml
    into v_ml
  from public.product_serving_rules psr
  where psr.business_id = p_business_id
    and psr.is_active = true
    and psr.product_id = p_product_id
    and psr.bottle_size_ml is not null
  order by psr.priority asc, psr.created_at asc
  limit 1;

  if v_ml is not null then
    return v_ml;
  end if;

  -- 2) Category-specific serving rule
  if v_category_id is not null then
    select psr.bottle_size_ml
      into v_ml
    from public.product_serving_rules psr
    where psr.business_id = p_business_id
      and psr.is_active = true
      and psr.category_id = v_category_id
      and psr.bottle_size_ml is not null
    order by psr.priority asc, psr.created_at asc
    limit 1;

    if v_ml is not null then
      return v_ml;
    end if;
  end if;

  -- 3) Wine extension volume (if present)
  select w.volume_ml
    into v_wine_volume_ml
  from public.wines w
  where w.business_id = p_business_id
    and w.product_id = p_product_id
    and w.is_active = true
  limit 1;

  if v_wine_volume_ml is not null and v_wine_volume_ml > 0 then
    return v_wine_volume_ml;
  end if;

  -- 4) Syrve product unit capacity (liters -> ml)
  if v_unit_capacity_liters is not null and v_unit_capacity_liters > 0 then
    return v_unit_capacity_liters * 1000.0;
  end if;

  -- 5) Business default
  select bs.default_bottle_size_ml
    into v_default_ml
  from public.business_settings bs
  where bs.business_id = p_business_id;

  if v_default_ml is not null and v_default_ml > 0 then
    return v_default_ml;
  end if;

  -- 6) Hard fallback
  return 750.0;
end $$;


-- 2) Replace aggregate trigger function to compute full liters
create or replace function public.upsert_inventory_aggregate()
returns trigger
language plpgsql
as $$
declare
  v_bottle_ml numeric;
  v_bottles_liters numeric;
  v_total_liters numeric;
begin
  -- Resolve bottle size in ml and compute liters contributed by unopened bottles
  v_bottle_ml := public.resolve_bottle_size_ml(new.business_id, new.product_id);
  v_bottles_liters := (coalesce(new.bottles_unopened, 0) * coalesce(v_bottle_ml, 750.0)) / 1000.0;

  -- Total liters for this event = unopened bottles liters + open liters
  v_total_liters := coalesce(v_bottles_liters, 0) + coalesce(new.open_liters, 0);

  insert into public.inventory_product_aggregates (
    business_id, session_id, product_id,
    counted_unopened_total,
    counted_open_liters_total,
    counted_total_liters,
    updated_at
  )
  values (
    new.business_id, new.session_id, new.product_id,
    coalesce(new.bottles_unopened, 0),
    coalesce(new.open_liters, 0),
    v_total_liters,
    now()
  )
  on conflict (session_id, product_id)
  do update set
    counted_unopened_total   = public.inventory_product_aggregates.counted_unopened_total + excluded.counted_unopened_total,
    counted_open_liters_total= public.inventory_product_aggregates.counted_open_liters_total + excluded.counted_open_liters_total,
    counted_total_liters     = public.inventory_product_aggregates.counted_total_liters + excluded.counted_total_liters,
    updated_at               = now();

  return new;
end $$;

-- Trigger remains the same name, but we recreate it to be explicit
drop trigger if exists trg_inventory_count_events_agg on public.inventory_count_events;
create trigger trg_inventory_count_events_agg
after insert on public.inventory_count_events
for each row execute function public.upsert_inventory_aggregate();


-- 3) Recompute helper (backfill / repair) for a session
--    Use this after deploying to recalc existing aggregates correctly.
create or replace function public.recompute_inventory_aggregates(p_session_id uuid)
returns void
language plpgsql
as $$
begin
  -- Delete previous aggregates for the session
  delete from public.inventory_product_aggregates
  where session_id = p_session_id;

  -- Rebuild aggregates from events using the same bottle-size rules
  insert into public.inventory_product_aggregates (
    business_id, session_id, product_id,
    counted_unopened_total,
    counted_open_liters_total,
    counted_total_liters,
    updated_at
  )
  select
    e.business_id,
    e.session_id,
    e.product_id,
    sum(coalesce(e.bottles_unopened, 0)) as counted_unopened_total,
    sum(coalesce(e.open_liters, 0)) as counted_open_liters_total,
    sum(
      ((coalesce(e.bottles_unopened, 0) * public.resolve_bottle_size_ml(e.business_id, e.product_id)) / 1000.0)
      + coalesce(e.open_liters, 0)
    ) as counted_total_liters,
    now() as updated_at
  from public.inventory_count_events e
  where e.session_id = p_session_id
  group by e.business_id, e.session_id, e.product_id;
end $$;


-- 4) (Optional) One-time backfill for all existing sessions
--    Uncomment if you already have data and want to recalc everything.
-- do $$
-- declare r record;
-- begin
--   for r in select id from public.inventory_sessions loop
--     perform public.recompute_inventory_aggregates(r.id);
--   end loop;
-- end $$;

-- 5) Update variance recompute to use counted_total_liters (now fully correct)
create or replace function public.recompute_inventory_variances(p_session_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.inventory_variances (
    business_id, session_id, product_id,
    expected_total_liters, counted_total_liters, difference_liters, has_variance, computed_at
  )
  select
    s.business_id,
    b.session_id,
    b.product_id,
    coalesce(b.expected_total_liters, (b.expected_open_liters + 0)),
    coalesce(a.counted_total_liters, 0),
    coalesce(a.counted_total_liters, 0) - coalesce(b.expected_total_liters, (b.expected_open_liters + 0)),
    (coalesce(a.counted_total_liters, 0) <> coalesce(b.expected_total_liters, (b.expected_open_liters + 0))),
    now()
  from public.inventory_sessions s
  join public.inventory_baseline_items b on b.session_id = s.id
  left join public.inventory_product_aggregates a
    on a.session_id = b.session_id and a.product_id = b.product_id
  where s.id = p_session_id
  on conflict (session_id, product_id)
  do update set
    expected_total_liters = excluded.expected_total_liters,
    counted_total_liters = excluded.counted_total_liters,
    difference_liters = excluded.difference_liters,
    has_variance = excluded.has_variance,
    computed_at = now();
end $$;
