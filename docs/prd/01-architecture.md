# 01 — System Architecture

**Wine Inventory Platform Backend Architecture**

This document defines the system architecture, design principles, data flow patterns, and integration strategy for the Wine Inventory Management Platform.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Core Design Principles](#core-design-principles)
3. [Technology Stack](#technology-stack)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Integration Strategy](#integration-strategy)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)

---

## High-Level Architecture

### **System Components**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Web App)                     │
├─────────────────────────────────────────────────────────────────┤
│  • Manager Portal (Desktop) — Configuration, Review, Reports    │
│  • Staff Interface (Mobile Responsive) — Fast Scanning, Counting│
│  • React + TypeScript + Zustand + Responsive Design            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                        REST API + Realtime
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Layer (Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│  • PostgreSQL 15+ (with pgvector, pgcrypto, vault)            │
│  • PostgREST (Auto-generated REST API)                         │
│  • Supabase Auth (JWT-based)                                   │
│  • Edge Functions (Deno/TypeScript)                            │
│  • Storage (S3-compatible)                                     │
│  • Realtime (WebSocket subscriptions)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    External Integrations
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  • Syrve Server API (POS/ERP)                                  │
│  • Google Cloud Vision API (OCR)                               │
│  • OpenAI API (text-embedding-3-small)                         │
│  • Google Gemini 1.5 Flash (vision verification)               │
└─────────────────────────────────────────────────────────────────┘
```

### **System Layers**

| Layer | Purpose | Technology |
|-------|---------|------------|
| **Presentation** | User interface for managers and staff | React + TypeScript (Responsive) |
| **API** | RESTful API and real-time updates | PostgREST + Supabase Realtime |
| **Business Logic** | Custom logic and external integrations | Edge Functions (Deno) |
| **Data** | Persistent storage and vector search | PostgreSQL + pgvector |
| **Integration** | External service communication | Syrve API + AI Services |

---

## Core Design Principles

### **1. Single-Client Platform**

**Design Decision**: One Supabase project per restaurant/business

**Rationale**:
- Simpler schema without multi-tenant complexity
- Better performance (no business_id filtering)
- Easier RLS policies
- Faster queries with optimized indexes
- Lower development overhead

**Implementation**:
- No `business_id` columns in tables
- Simplified RLS policies (user-level only)
- Single configuration records (singletons)
- Global role-based access control

### **2. Syrve as Source of Truth**

**Design Decision**: Master data flows Syrve → Supabase (one-way sync)

**Syrve Owns**:
- Organization structure (departments, stores)
- Product catalog (categories, products, SKUs)
- Baseline stock snapshots
- Official inventory records (after submission)

**Supabase Owns**:
- Product enrichment (images, wine details, serving rules)
- AI recognition runs and feedback
- Inventory counting sessions and events
- User accounts and permissions
- Operational metadata

**Data Flow**:
```
Syrve (Master) → Bootstrap Sync → syrve_raw_objects (lossless mirror)
                      ↓
            Parse and Normalize
                      ↓
     stores, categories, products (canonical tables)
                      ↓
         Enrich with: wines, images, serving rules
                      ↓
     Use in: inventory_sessions, inventory_baseline_items
                      ↓
         Aggregate: inventory_product_aggregates
                      ↓
     Submit back via: syrve_outbox_jobs → Syrve
```

### **3. Event-Sourced Inventory**

**Design Decision**: Inventory uses event sourcing pattern

**Components**:
1. **Baseline** (`inventory_baseline_items`): Immutable snapshot from Syrve (manager-only)
2. **Events** (`inventory_count_events`): Append-only counting log (staff can insert)
3. **Aggregates** (`inventory_product_aggregates`): Materialized totals (updated via triggers/functions)
4. **Variances** (`inventory_variances`): Computed differences (expected vs counted)

**Benefits**:
- Complete audit trail
- Concurrent multi-user counting
- Historical playback capability
- Easy debugging and reconciliation
- No lost data from overwriting

**Tradeoffs**:
- More complex queries (requires aggregation)
- Additional storage for events
- Requires materialized views for performance

### **4. AI-Driven Label Recognition**

**Design Decision**: Hybrid OCR + embeddings + vision verification

**Pipeline**:
1. **OCR** (Google Cloud Vision): Extract text from label image
2. **Embedding Search** (OpenAI + pgvector): Find similar products via vector similarity
3. **Vision Verification** (Gemini 1.5 Flash): Validate and rank candidates
4. **Feedback Loop**: User confirms → stored in `ai_feedback` for learning

**Benefits**:
- High accuracy (multi-stage verification)
- Fast recognition (vector search)
- Continuous improvement (feedback loop)
- Handles variations (OCR errors, different vintages)

### **5. Mobile-Responsive Design**

**Design Decision**: Responsive web application optimized for mobile and desktop

**Features**:
- Mobile-first CSS (responsive breakpoints)
- Touch-optimized UI components
- Fast camera access for label scanning
- Optimized data loading and caching
- Real-time updates via WebSocket

**Use Cases**:
- Desktop management portal for managers
- Mobile-optimized counting interface for staff
- Tablet-friendly review and approval workflows

### **6. Reliable Outbox Pattern**

**Design Decision**: Asynchronous job queue for Syrve submissions

**Pattern**:
```
Manager approves inventory
        ↓
Insert job into syrve_outbox_jobs
        ↓
Background processor picks up job
        ↓
Attempt submission to Syrve API
        ↓
[Success] → Update job status + store response
[Failure] → Increment attempts + log error + retry
```

**Benefits**:
- Resilient to network failures
- Idempotent operations (hash-based deduplication)
- Retry logic with exponential backoff
- Audit trail of all submissions
- No blocking UI operations

---

## Technology Stack

### **Backend Technologies**

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Database** | PostgreSQL | 15+ | Primary data store |
| **Vector Search** | pgvector | 0.5+ | Embedding similarity search |
| **Auth** | Supabase Auth | Latest | JWT-based authentication |
| **API** | PostgREST | 11+ | Auto-generated REST API |
| **Functions** | Deno | 1.37+ | Serverless Edge Functions |
| **Storage** | Supabase Storage | Latest | S3-compatible object storage |
| **Realtime** | Supabase Realtime | Latest | WebSocket subscriptions |

### **PostgreSQL Extensions**

| Extension | Purpose |
|-----------|---------|
| `pgcrypto` | UUID generation + encryption |
| `uuid-ossp` | Alternative UUID functions |
| `pgvector` | Vector similarity search (embeddings) |
| `vault` | Secret management for encrypted credentials |
| `fuzzystrmatch` | Fuzzy string matching (optional) |
| `btree_gin` | GIN indexes for JSONB |

### **External Services**

| Service | Purpose | Provider |
|---------|---------|----------|
| **OCR** | Text extraction from label images | Google Cloud Vision API |
| **Embeddings** | Text vectorization for similarity search | OpenAI (text-embedding-3-small) |
| **Vision AI** | Image recognition and verification | Google Gemini 1.5 Flash |
| **POS/ERP** | Master data and inventory submission | Syrve Server API |

---

## Data Flow Patterns

### **1. Syrve Catalog Synchronization**

```
┌──────────────┐
│ Syrve Server │
└──────┬───────┘
       │ XML or JSON API
       ↓
┌──────────────────────┐
│ syrve-bootstrap-sync │ (Edge Function)
│ syrve-sync-products  │
└─────────┬────────────┘
          │ Insert/Update
          ↓
┌─────────────────────┐
│ syrve_raw_objects   │ (Lossless mirror)
└─────────┬───────────┘
          │ Parsed and Normalized
          ↓
┌───────────────────────────────┐
│ stores, categories, products  │ (Canonical tables)
└───────────────────────────────┘
```

**Sync Strategy**:
- **Bootstrap**: Full catalog pull on initial setup
- **Incremental**: Periodic sync (hourly/daily) for updates
- **Change Detection**: Compare `payload_hash` to detect changes
- **Soft Deletes**: Mark `is_deleted = true` instead of hard delete

### **2. Inventory Counting Workflow**

```
Manager creates session → inventory_sessions (status: draft)
        ↓
Load baseline from Syrve → inventory_baseline_items (immutable)
        ↓
Session starts → status: in_progress
        ↓
Staff scan labels → ai-scan Edge Function → ai_runs + ai_match_candidates
        ↓
Staff confirm products → inventory_count_events (append-only)
        ↓
Trigger updates aggregates → inventory_product_aggregates (materialized)
        ↓
Manager reviews → status: pending_review
        ↓
Manager approves → status: approved
        ↓
Create outbox job → syrve_outbox_jobs (pending)
        ↓
Background processor → Submit to Syrve
        ↓
[Success] → inventory_sessions (status: synced, syrve_document_id)
[Failure] → syrve_outbox_jobs (status: failed, retries++)
```

### **3. AI Label Recognition**

```
User scans label → Upload to ai-scans bucket
        ↓
POST /functions/v1/ai-scan
        ↓
┌──────────────────────────┐
│ OCR (Google Vision)      │ → Extract text
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Embedding (OpenAI)       │ → Generate vector
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Vector Search (pgvector) │ → Find similar products
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Vision (Gemini)          │ → Verify and rank candidates
└────────┬─────────────────┘
         ↓
Return ranked product list with confidence scores
        ↓
User confirms → Insert ai_feedback
```

---

## Integration Strategy

### **Syrve Server API Integration**

**Connection Model**:
- Singleton configuration: `syrve_config` (1 row)
- Credentials encrypted using Supabase Vault
- Base URL, login, encrypted password stored
- Connection status tracked (`connected`, `error`)

**API Communication**:
- All Syrve API calls via Edge Functions (not from frontend)
- Service role authentication for Edge Functions
- XML parsing for Syrve responses
- Raw payload storage in `syrve_raw_objects`
- API logging in `syrve_api_logs`

**Sync Operations**:
| Operation | Edge Function | Frequency | Purpose |
|-----------|---------------|-----------|---------|
| **Test Connection** | `syrve-connect-test` | On-demand | Validate credentials |
| **Bootstrap** | `syrve-bootstrap-sync` | Once | Initial full sync |
| **Product Sync** | `syrve-sync-products` | Hourly/Daily | Update product catalog |
| **Load Baseline** | `inventory-load-baseline` | Per session | Pull expected stock |
| **Submit Inventory** | `syrve-process-outbox` | Background | Export approved counts |

**Error Handling**:
- Exponential backoff for retries
- Max retry limit (configurable)
- Error logging with full context
- Manual retry capability via UI

### **AI Services Integration**

**Google Cloud Vision** (OCR):
- API Key stored in Supabase secrets
- Called from `ai-scan` Edge Function
- Extracts text blocks from label images
- Returns structured OCR result

**OpenAI** (Embeddings):
- API Key stored in Supabase secrets
- Model: `text-embedding-3-small` (1536 dimensions)
- Embeds product names/descriptions
- Stored in `product_search_index.embedding`

**Gemini 1.5 Flash** (Vision):
- API Key stored in Supabase secrets
- Receives top candidates from vector search
- Verifies product match via vision
- Returns ranked list with confidence

---

## Security Architecture

### **Authentication**

**Methods Supported**:
1. **Email + Password** — Standard Supabase Auth
2. **Username + Password** — Synthetic email (`{username}@inventory.local`)

**Flow**:
```
Frontend → auth-login-username Edge Function
        ↓
Construct synthetic email
        ↓
auth.signInWithPassword(email, password)
        ↓
Return JWT + session → Store in localStorage
```

### **Authorization**

**Row-Level Security (RLS)**:
- Enabled on all tables
- Policies based on `auth.uid()` and roles
- Manager-only baseline protection
- Append-only event policies for staff

**Role-Based Access Control (RBAC)**:
- Roles stored in `roles` table
- Permissions in JSONB format: `{"module.action": "level"}`
- Permission levels: `none`, `view`, `edit`, `full`
- User roles via `user_roles` junction table

**Permission Checking**:
```typescript
// Frontend permission check
const hasPermission = (module: string, action: string, level: string) => {
  const userRoles = useAuthStore.getState().roles;
  const perm = userRoles.permissions[`${module}.${action}`];
  return checkLevel(perm, level); // none < view < edit < full
};
```

### **Data Protection**

| Data Type | Protection Method |
|-----------|-------------------|
| **Passwords** | bcrypt hashing via Supabase Auth |
| **Syrve Credentials** | Encrypted with Supabase Vault |
| **AI API Keys** | Stored in Supabase secrets |
| **Storage Objects** | Private buckets + signed URLs |
| **Session Tokens** | JWT with expiration |
| **Database Connections** | SSL/TLS enforced |

---

## Deployment Architecture

### **Production Environment**

```
┌──────────────────────────────────────┐
│         Supabase Cloud               │
├──────────────────────────────────────┤
│  • PostgreSQL Database (Managed)     │
│  • Edge Functions (Global CDN)       │
│  • Storage (Multi-region)            │
│  • Auth (Global)                     │
└──────────────────────────────────────┘
          ↓ Deployed from
┌──────────────────────────────────────┐
│         CI/CD Pipeline               │
├──────────────────────────────────────┤
│  • GitHub Actions                    │
│  • supabase db push (migrations)     │
│  • supabase functions deploy         │
│  • npm run build (frontend)          │
└──────────────────────────────────────┘
          ↓ Serves to
┌──────────────────────────────────────┐
│     Frontend Hosting (Static)        │
├──────────────────────────────────────┤
│  • Vercel / Netlify / Cloudflare     │
│  • PWA Service Worker                │
│  • CDN Distribution                  │
└──────────────────────────────────────┘
```

### **Scalability Considerations**

| Component | Scaling Strategy |
|-----------|------------------|
| **Database** | Vertical scaling (Supabase plans) |
| **Edge Functions** | Auto-scaling (Supabase manages) |
| **Storage** | Unlimited (pay-per-use) |
| **API** | Connection pooling + caching |
| **Frontend** | CDN distribution |

### **Monitoring \u0026 Observability**

- **Database**: Supabase Dashboard metrics
- **Functions**: Edge Function logs and traces
- **Errors**: `error_logs` table + frontend error tracking
- **Audit**: `audit_logs` table for sensitive operations
- **Performance**: Query performance insights in Supabase

---

## Next Steps

- Review [02-database-schema.md](02-database-schema.md) for complete database structure
- Study [03-authentication.md](03-authentication.md) for security implementation
- Examine [04-syrve-integration.md](04-syrve-integration.md) for Syrve API details
