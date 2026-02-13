# Wine Inventory Platform — Backend Documentation

**Complete Production-Ready Backend Reference for Supabase Integration**

This documentation provides a comprehensive reference for the Wine Inventory Management Platform's backend architecture, database schema, API specifications, and deployment procedures.

---

## 📚 Documentation Structure

| Document | Description |
|----------|-------------|
| **[00-README.md](00-README.md)** | This file — overview and navigation |
| **[01-architecture.md](01-architecture.md)** | System architecture, data flow, and design principles |
| **[02-database-schema.md](02-database-schema.md)** | Complete database schema with all tables and relationships |
| **[03-authentication.md](03-authentication.md)** | Authentication flows, RLS policies, and permission system |
| **[04-s yrve-integration.md](04-syrve-integration.md)** | Syrve POS integration specification and sync logic |
| **[05-edge-functions.md](05-edge-functions.md)** | Edge Functions API reference and implementation |
| **[06-ai-recognition.md](06-ai-recognition.md)** | AI/OCR label recognition pipeline |
| **[07-inventory-management.md](07-inventory-management.md)** | Event-sourced inventory workflow and business logic |
| **[08-deployment-guide.md](08-deployment-guide.md)** | Step-by-step Supabase setup and deployment |
| **[09-api-reference.md](09-api-reference.md)** | REST API and RPC function reference |

---

## 🎯 Quick Start

### **For Developers**
1. Read [01-architecture.md](01-architecture.md) for system overview
2. Review [02-database-schema.md](02-database-schema.md) for data model
3. Study [03-authentication.md](03-authentication.md) for security model
4. Follow [08-deployment-guide.md](08-deployment-guide.md) for setup

### **For System Architects**
1. Study [01-architecture.md](01-architecture.md) for design principles
2. Review [04-syrve-integration.md](04-syrve-integration.md) for external integration patterns
3. Examine [07-inventory-management.md](07-inventory-management.md) for business logic

### **For DevOps Engineers**
1. Follow [08-deployment-guide.md](08-deployment-guide.md) for infrastructure setup
2. Review [05-edge-functions.md](05-edge-functions.md) for function deployment
3. Study [03-authentication.md](03-authentication.md) for security configuration

---

## 🏗️  System Overview

### **Architecture**
- **Frontend**: React/TypeScript web app (responsive mobile + desktop)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage)
- **Integration**: Syrve POS (ERP/inventory source of truth)
- **AI Services**: Google Vision (OCR) + Gemini (recognition)

### **Core Principles**
1. **Single-Client Platform** — Optimized for one restaurant/business per deployment
2 **Syrve as Source of Truth** — Master data (products, categories) synced from Syrve
3. **Event-Sourced Inventory** — Append-only counting events for audit trail
4. **AI-Driven Recognition** — Hybrid OCR + embeddings + vision verification
5. **Responsive Design** — Mobile-optimized counting interface for warehouse/cellar use

### **Key Features**
- 👤 **Dual Auth Methods**: Email/password + username/password (synthetic email)
- 📊 **Event-Sourced Inventory**: Immutable baseline + append-only events
- 🔗 **Syrve Integration**: Bidirectional sync with reliable outbox pattern
- 🤖 **AI Label Recognition**: OCR + pgvector embeddings + Gemini verification
- 🔐 **Role-Based Access**: Granular permissions with JSONB configuration
- 📱 **Mobile Responsive**: Optimized UI for mobile counting and desktop management

---

## 🗂️ Database Schema Layers

The database is organized into 7 logical layers:

1. **User Layer** — `profiles`, `roles`, `user_roles`
2. **Settings** — `business_profile`, `app_settings`, `ai_config`, `syrve_config`
3. **Syrve Integration** — `syrve_raw_objects`, `syrve_sync_runs`, `syrve_outbox_jobs`
4. **Catalog** — `org_nodes`, `stores`, `categories`, `products`, `product_barcodes`
5. **Enrichment** — `wines`, `glass_dimensions`, `product_serving_rules`, `product_traits`
6. **Media \u0026 AI** — `media_assets`, `product_assets`, `ai_runs`, `product_search_index` (pgvector)
7. **Inventory** — `inventory_sessions`, `inventory_baseline_items`, `inventory_count_events`, `inventory_product_aggregates`

See [02-database-schema.md](02-database-schema.md) for complete schema reference.

---

## 🔐 Authentication \u0026 Authorization

### **Login Methods**
1. **Email + Password** — Standard Supabase auth
2. **Username + Password** — Synthetic email pattern (`{username}@inventory.local`)

### **Role Hierarchy**
- **Super Admin** — Platform owner (full access)
- **Manager** — Restaurant admin (configure, approve, manage)
- **Staff** — Inventory counting (limited visibility)
- **Viewer** — Read-only access (optional)

### **Security Features**
- Row-Level Security (RLS) policies on all tables
- Encrypted credentials (Syrve API, AI providers)
- JWT-based session management
- Permission checking at module.action granularity
- Baseline protection (only managers see expected quantities)

See [03-authentication.md](03-authentication.md) for detailed security model.

---

## 🔄 Syrve Integration

### **Data Flow**
```
Syrve Server API (Source of Truth)
        ↓
Bootstrap/Incremental Sync
        ↓
syrve_raw_objects (lossless mirror)
        ↓
Parsed into: stores, categories, products
        ↓
Enriched with: wines, images, serving rules
        ↓
Used in: inventory_sessions, inventory_baseline_items
        ↓
Outbox Pattern (syrve_outbox_jobs)
        ↓
Submit approved inventory back to Syrve
```

### **Integration Strategy**
- **Bootstrap Sync**: Full initial catalog pull
- **Incremental Sync**: Periodic product updates
- **Raw Mirroring**: Store complete Syrve JSON payloads
- **Outbox Pattern**: Reliable inventory submission with retries

See [04-syrve-integration.md](04-syrve-integration.md) for complete specification.

---

## 🤖 AI Recognition Pipeline

### **Workflow**
1. **Capture**: User scans wine label via mobile camera
2. **OCR**: Google Cloud Vision extracts text from image
3 **Embedding Search**: OpenAI embeds text → pgvector similarity search
4. **Vision Verification**: Gemini 1.5 Flash verifies top candidates
5. **Return**: Ranked product list with confidence scores
6. **Feedback Loop**: User confirms → stored in `ai_feedback`

### **Tables**
- `ai_config` — AI provider configuration (singleton)
- `ai_runs` — Audit trail of all recognition attempts
- `ai_match_candidates` — Potential product matches per run
- `ai_feedback` — User corrections for learning loop
- `product_search_index` — pgvector embeddings for similarity search

See [06-ai-recognition.md](06-ai-recognition.md) for technical details.

---

## 📦 Inventory Management

### **Event-Sourced Design**
- **Baseline** (`inventory_baseline_items`): Immutable snapshot from Syrve (manager-only)
- **Events** (`inventory_count_events`): Append-only counting log (staff can insert)
- **Aggregates** (`inventory_product_aggregates`): Materialized totals for performance
- **Variances** (`inventory_variances`): Computed differences (expected vs counted)
- **Outbox** (`syrve_outbox_jobs`): Reliable export queue to Syrve

### **Session Workflow**
1. **Draft** → Manager creates session
2. **Load Baseline** → Pull expected stock from Syrve
3. **In Progress** → Staff count products (append events)
4. **Pending Review** → Manager reviews variances
5. **Approved** → Creates outbox job
6. **Synced** → Successfully submitted to Syrve

See [07-inventory-management.md](07-inventory-management.md) for business logic.

---

## 🚀 Deployment

### **Prerequisites**
- Supabase project (https://app.supabase.com)
- Syrve Server API credentials
- Google Cloud Vision API key
- OpenAI API key (for embeddings)
- Gemini API key (for vision verification)

### **Quick Deploy**
```bash
# 1. Create Supabase project
# 2. Clone repository
git clone https://github.com/your-org/inventory_ai.git
cd inventory_ai

# 3. Deploy database schema
supabase db push

# 4. Deploy Edge Functions
supabase functions deploy

# 5. Configure secrets
supabase secrets set SYRVE_ENCRYPTION_KEY=your-key
supabase secrets set GOOGLE_VISION_API_KEY=your-key
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set GEMINI_API_KEY=your-key

# 6. Deploy frontend
npm run build
```

See [08-deployment-guide.md](08-deployment-guide.md) for complete setup guide.

---

## 📊 Technology Stack

### **Backend**
- **Database**: PostgreSQL 15+ (Supabase)
- **Extensions**: pgcrypto, pgvector, uuid-ossp, vault
- **Auth**: Supabase Auth (JWT)
- **API**: PostgREST (auto-generated) + Edge Functions (Deno)
- **Storage**: Supabase Storage (S3-compatible)

### **Edge Functions** (Deno/TypeScript)
- `syrve-connect-test` — Test Syrve credentials
- `syrve-save-config` — Encrypt and store config
- `syrve-bootstrap-sync` — Initial catalog sync
- `syrve-sync-products` — Incremental product sync
- `syrve-process-outbox` — Inventory submission
- `inventory-create-session` — Create session record
- `inventory-load-baseline` — Pull baseline from Syrve
- `ai-scan` — OCR + embeddings + vision pipeline
- `auth-login-username` — Username/password login
- `manage-users` — User management

### **AI Services**
- Google Cloud Vision API (OCR)
- OpenAI API (text-embedding-3-small)
- Google Gemini 1.5 Flash (vision verification)

---

## 🔧 Configuration

### **Environment Variables**
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Edge Functions (Supabase secrets)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SYRVE_ENCRYPTION_KEY=your-encryption-key
GOOGLE_VISION_API_KEY=your-vision-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

### **Storage Buckets**
- `product-labels` — Confirmed label library (private + signed URLs)
- `inventory-evidence` — Per-session evidence images (private)
- `ai-scans` — Temporary scan images (private, auto-delete 30 days)
- `logos` — Business logos (public)

---

## ��️ API Reference

### **REST API** (PostgREST)
All tables accessible via auto-generated REST API:
```
GET    /rest/v1/products?select=*,category:categories(name)
POST   /rest/v1/inventory_count_events
PATCH  /rest/v1/products?id=eq.{id}
DELETE /rest/v1/categories?id=eq.{id}
```

### **RPC Functions**
```sql
-- User permissions
get_user_permissions(user_id UUID) → JSONB

-- Inventory aggregates
refresh_inventory_aggregates(session_id UUID) → VOID
```

### **Edge Functions**
```
POST /functions/v1/syrve-connect-test
POST /functions/v1/syrve-bootstrap-sync
POST /functions/v1/inventory-load-baseline
POST /functions/v1/ai-scan
POST /functions/v1/auth-login-username
```

See [09-api-reference.md](09-api-reference.md) for complete API documentation.

---

## 📖 Additional Resources

### **Related Documentation**
- [Product Documentation](../new/wine_inventory_platform_full_product_documentation.md)
- [UI Field Specifications](../new/12-page-field-specifications.md)
- [Syrve DB Architecture](../new/syrve_integration/syrve_db_architecture.md)
- [OCR Specification](../new/AI/ocr_spec.md)

### **External Resources**
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL pgvector](https://github.com/pgvector/pgvector)
- [Syrve API Documentation](https://api.syrve.com/docs)
- [Google Cloud Vision](https://cloud.google.com/vision/docs)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

## 📝 Document Version

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-13 | Initial production-ready documentation |

---

**Next Steps**: Begin with [01-architecture.md](01-architecture.md) for system architecture overview.
