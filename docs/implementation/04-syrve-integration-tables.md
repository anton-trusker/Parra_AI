# 04 — Syrve Integration Tables

## Overview

Syrve-specific tables for configuration, raw data storage, sync tracking, API logging, and reliable document delivery.

## Tables

### syrve_config (One per tenant)

```sql
CREATE TABLE syrve_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  server_url TEXT NOT NULL,
  api_login TEXT NOT NULL,
  api_password_encrypted TEXT NOT NULL,

  -- Default selections
  default_store_id UUID,
  default_department_id UUID,
  selected_category_ids UUID[],

  -- Accounting codes for inventory documents
  account_surplus_code TEXT DEFAULT '5.10',
  account_shortage_code TEXT DEFAULT '5.09',

  -- Connection status
  connection_status TEXT DEFAULT 'disconnected',
  connection_tested_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_lock_until TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syrve_config_status ON syrve_config(connection_status);
```

### syrve_raw_objects (Audit Trail)

```sql
CREATE TABLE syrve_raw_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'product', 'category', 'store', 'stock', 'unit'
  syrve_id UUID NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL, -- SHA-256 for deduplication
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, syrve_id, payload_hash)
);

CREATE INDEX idx_syrve_raw_tenant ON syrve_raw_objects(tenant_id, entity_type, imported_at DESC);
CREATE INDEX idx_syrve_raw_entity ON syrve_raw_objects(tenant_id, syrve_id);
```

### syrve_sync_runs (Execution History)

```sql
CREATE TABLE syrve_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'bootstrap', 'products', 'stock', 'inventory_commit'
  status job_status NOT NULL DEFAULT 'pending',
  stats JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syrve_sync_runs_tenant ON syrve_sync_runs(tenant_id, created_at DESC);
CREATE INDEX idx_syrve_sync_runs_status ON syrve_sync_runs(tenant_id, status, created_at DESC);
```

### syrve_api_logs (Request/Response Detail)

```sql
CREATE TABLE syrve_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sync_run_id UUID REFERENCES syrve_sync_runs(id),
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  request_body TEXT,
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syrve_api_logs_tenant ON syrve_api_logs(tenant_id, created_at DESC);
CREATE INDEX idx_syrve_api_logs_endpoint ON syrve_api_logs(tenant_id, endpoint, created_at DESC);
```

### syrve_outbox_jobs (Reliable Document Sending)

```sql
CREATE TABLE syrve_outbox_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  job_type syrve_job_type NOT NULL,
  payload_xml TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status job_status DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  response_xml TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, job_type, payload_hash)
);

CREATE INDEX idx_syrve_outbox_pending ON syrve_outbox_jobs(status, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_syrve_outbox_tenant ON syrve_outbox_jobs(tenant_id, status, created_at DESC);
```

## Authentication Flow (Syrve Server API)

```
1. Hash password with SHA-1
2. GET /resto/api/auth?login={login}&pass={sha1_hash}
3. Response: plain text token (UUID)
4. Use ?key={token} on ALL subsequent requests
5. ALWAYS GET /resto/api/logout?key={token} when done
```

**Critical**: Always logout to release license seat. Use try/finally pattern.
