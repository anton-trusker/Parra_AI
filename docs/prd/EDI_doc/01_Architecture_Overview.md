# 01 - Architecture Overview & Integration Strategy

## 1. High-Level Architecture

The Wine Inventory Platform is designed as a **Supabase-centric** application that acts as an intelligent operational extension to **Syrve** (the core ERP).

### Core Components

1.  **Frontend (Web/Mobile PWA)**:
    *   React-based application.
    *   **Manager Portal**: Desktop-optimized for configuration, review, and reporting.
    *   **Staff App**: Mobile-optimized for fast inventory scanning and counting.

2.  **Backend (Supabase)**:
    *   **Postgres Database**: Storage for mirrored catalog, inventory sessions, and operational data.
    *   **Auth**: Handles user identity and session management.
    *   **Edge Functions**:
        *   Syrve API communication (proxying and logic).
        *   Complex business logic (auth wrapping, inventory aggregation).
        *   AI orchestration (OCR, image recognition).
    *   **Storage**: Images (product labels, inventory evidence).
    *   **Realtime**: (Optional) Live updates of inventory progress.

3.  **Integrations**:
    *   **Syrve Server API**: The "Source of Truth" for Master Data (Products, Categories, Stores).
    *   **AI Services**: Google Cloud Vision / OpenAI for label recognition.

### Data Flow Principles

1.  **Syrve is Master**: We typically do **not** create or edit Products, Categories, or Stores in Supabase. We mirror them from Syrve.
2.  **Supabase is Operational Master**: We own Inventory Sessions, Counts, Variances, and Enriched Metadata (Images, Wine specifics).
3.  **One-Way Sync (mostly)**: Data flows Syrve -> Supabase.
4.  **Transactional Write-Back**: Only specific documents (Inventory Records) are sent back to Syrve via an "Outbox" pattern.

## 2. Technology Stack

*   **Database**: PostgreSQL 15+ (Supabase)
*   **Vector Search**: `pgvector` extension (for label matching)
*   **API Layer**: PostgREST (auto-generated) + Deno Edge Functions (custom logic)
*   **Authentication**: Supabase Auth (JWT)
*   **Language**: TypeScript (Frontend & Edge Functions)

---

## 3. Integration Strategy (Syrve)

### Connection Model
*   Each **Tenant** (Business) has one `syrve_config` record.
*   Credentials (login/password) are stored **encrypted** (using Supabase Vault or symmetric encryption keys).
*   The system communicates with the **Syrve Server API** (not the local generic client API).

### Sync Strategy
*   **Bootstrap Sync**: On initial setup, we pull the entire relevant tree:
    *   Corporation Structure -> Stores/Departments.
    *   Product Groups -> Categories.
    *   Products -> Catalog.
*   **Incremental Sync**: Periodic jobs or manual triggers to update changes (price updates, new products).
*   **Raw Mirroring**: We store the full JSON payload from Syrve in `syrve_raw_objects`. This allows us to "replay" parsing logic without re-fetching from Syrve if requirements change, and provides a debugging safety net.

### Inventory Submission (The "Outbox")
*   We do not call Syrve synchronously when a Manager clicks "Send".
*   Instead, we write a job to `syrve_outbox_jobs`.
*   A background function picks up the job, attempts the send, handles retries, and logs the result.
*   This ensures resilience against network blips or Syrve API timeouts.

---

## 4. User Types & Access

| Role | Auth Method | Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | Email/Password | System oversight, multi-tenant management. |
| **Business Manager** | Email/Password OR Username/Password | Configure Syrve, manage staff, review inventory, approve sessions. |
| **Staff** | Username/Password* | Scan items, count stock. Restricted visibility (no cost syntax). |

*\*Staff login is implemented via an Edge Function that maps a simple `username` to a secure internal Email/Password identity or manages a custom session.*
