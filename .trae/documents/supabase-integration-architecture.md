# Supabase Integration Architecture

## System Architecture Overview

```mermaid
graph TD
    A[React Frontend] --> B[Supabase Client SDK]
    B --> C[Supabase Auth]
    B --> D[Supabase Database]
    B --> E[Supabase Realtime]
    B --> F[Supabase Storage]
    
    G[Edge Functions] --> D
    G --> H[Syrve API]
    G --> I[AI Services]
    
    J[Mobile Scanner] --> A
    K[Manager Dashboard] --> A
    L[Staff Interface] --> A
    
    subgraph "Frontend Layer"
        A
        B
    end
    
    subgraph "Supabase Backend"
        C
        D
        E
        F
        G
    end
    
    subgraph "External Services"
        H
        I
    end
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **TanStack Query** for data fetching and caching
- **React Hook Form** for form management
- **Shadcn/UI** components
- **Zustand** for state management
- **React Scanner** for camera integration

### Backend (Supabase)
- **PostgreSQL 15** with pgvector extension
- **Edge Functions** (Deno runtime)
- **Row Level Security (RLS)** policies
- **Realtime subscriptions** via WebSocket
- **Storage buckets** for image assets

### External Integrations
- **Syrve Server API** for inventory data
- **Google Gemini** for AI label recognition
- **OpenAI Embeddings** for vector search
- **Lovable AI Gateway** for API aggregation

## Database Schema Architecture

```mermaid
erDiagram
    businesses ||--o{ users : has
    businesses ||--o{ stores : owns
    businesses ||--o{ products : catalogs
    businesses ||--o{ inventory_sessions : creates
    businesses ||--o{ syrve_config : configures
    
    stores ||--o{ stock_levels : contains
    stores ||--o{ inventory_sessions : hosts
    
    products ||--o{ stock_levels : has
    products ||--o{ inventory_items : counted_in
    products ||--o{ product_barcodes : has
    products }o--|| categories : belongs_to
    
    inventory_sessions ||--o{ inventory_items : contains
    inventory_sessions ||--o{ ai_recognition_attempts : generates
    
    users ||--o{ inventory_items : counts
    users ||--o{ ai_recognition_attempts : initiates
    
    products ||--o{ wines : enriches
    wines ||--o{ product_assets : has_images
    
    syrve_config ||--o{ syrve_sync_runs : tracks
    syrve_config ||--o{ syrve_api_logs : logs
```

## Edge Functions Architecture

### Core Functions

#### 1. Syrve Integration Functions
```mermaid
graph TD
    A[syrve-sync] --> B[Authentication]
    B --> C[Fetch Stores]
    C --> D[Fetch Categories]
    D --> E[Fetch Products]
    E --> F[Sync Stock Levels]
    F --> G[Sync Prices]
    G --> H[Wine Enrichment]
    H --> I[AI Enrichment]
    
    J[syrve-connect-test] --> K[Test Connection]
    K --> L[Validate Credentials]
    L --> M[Return Status]
    
    N[inventory-submit-to-syrve] --> O[Validate Session]
    O --> P[Aggregate Counts]
    P --> Q[Create Syrve Document]
    Q --> R[Submit to Syrve]
    R --> S[Update Session Status]
```

#### 2. AI Recognition Functions
```mermaid
graph TD
    A[ai-recognize-label] --> B[Upload Image]
    B --> C[Extract Text via OCR]
    C --> D[Generate Embedding]
    D --> E[Vector Search]
    E --> F[Trigram Search]
    F --> G[Score Candidates]
    G --> H[Return Results]
    
    I[ai-enrich-wine] --> J[Parse Wine Name]
    J --> K[Extract Vintage]
    K --> L[Extract Volume]
    L --> M[Determine Glass Availability]
    M --> N[Update Wine Record]
```

#### 3. Inventory Management Functions
```mermaid
graph TD
    A[inventory-create-session] --> B[Validate Permissions]
    B --> C[Create Session Record]
    C --> D[Set Initial Status]
    D --> E[Return Session ID]
    
    F[inventory-load-baseline] --> G[Fetch Syrve Stock]
    G --> H[Create Inventory Items]
    H --> I[Update Session Status]
    
    J[manage-users] --> K[Validate Manager Role]
    K --> L[Create/Update User]
    L --> M[Set Permissions]
    M --> N[Send Notifications]
```

## Data Flow Architecture

### Inventory Session Lifecycle
```mermaid
sequenceDiagram
    participant M as Manager
    participant F as Frontend
    participant E as Edge Functions
    participant S as Supabase
    participant Syr as Syrve API
    
    M->>F: Create Session
    F->>E: inventory-create-session
    E->>S: Create session record
    E->>S: Set status: draft
    S-->>F: Session ID
    
    M->>F: Load Baseline
    F->>E: inventory-load-baseline
    E->>Syr: Fetch stock data
    Syr-->>E: Stock levels
    E->>S: Create inventory items
    E->>S: Set status: in_progress
    
    M->>F: Start Counting
    F->>S: Update status
    
    loop Staff Counting
        F->>E: AI Recognition
        E->>S: Create count events
        S-->>F: Real-time updates
    end
    
    M->>F: Review & Approve
    F->>S: Set status: approved
    
    M->>F: Submit to Syrve
    F->>E: inventory-submit-to-syrve
    E->>S: Aggregate counts
    E->>Syr: Submit inventory
    Syr-->>E: Document ID
    E->>S: Update session: synced
```

### AI Recognition Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as Camera
    participant E as Edge Functions
    participant AI as AI Service
    participant V as Vector DB
    participant S as Supabase
    
    U->>F: Scan Label
    F->>C: Capture Image
    C-->>F: Image Data
    F->>E: ai-recognize-label
    
    E->>AI: Vision Analysis
    AI-->>E: Extracted Data
    
    E->>V: Vector Search
    V-->>E: Candidates
    E->>S: Trigram Search
    S-->>E: Additional Candidates
    
    E->>E: Score & Rank
    E->>S: Store Attempt
    E-->>F: Results + Variants
    
    U->>F: Select Product
    F->>S: Create Count Event
```

## Security Architecture

### Row Level Security (RLS)

#### Business Isolation
```sql
-- All tables have business_id for multi-tenancy
CREATE POLICY "Business isolation" ON products
  FOR ALL USING (business_id = current_business_id());

-- Function to get current business ID
CREATE OR REPLACE FUNCTION current_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_business_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Role-Based Access
```sql
-- Manager can access all business data
CREATE POLICY "Manager access" ON inventory_sessions
  FOR ALL USING (
    business_id = current_business_id() 
    AND has_role('manager')
  );

-- Staff can only access active sessions
CREATE POLICY "Staff access" ON inventory_sessions
  FOR SELECT USING (
    business_id = current_business_id() 
    AND has_role('staff')
    AND status = 'in_progress'
  );
```

### API Security

#### Edge Function Authentication
```typescript
// Validate JWT token
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Get user claims
const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

#### Service Role Usage
```typescript
// Use service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Set business context for RLS
await supabaseAdmin.rpc('set_business_context', {
  business_id: businessId
});
```

## Real-time Architecture

### WebSocket Connections
```typescript
// Real-time subscription setup
const channel = supabase
  .channel(`inventory:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'inventory_items',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    queryClient.invalidateQueries(['inventory_items', sessionId]);
  })
  .subscribe();
```

### Presence Tracking
```typescript
// User presence in inventory sessions
const presenceChannel = supabase.channel(`presence:${sessionId}`);

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    setActiveUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        last_activity: new Date().toISOString()
      });
    }
  });
```

## Performance Optimization

### Database Indexing
```sql
-- Core indexes for performance
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_stock_levels_product_store ON stock_levels(product_id, store_id);
CREATE INDEX idx_inventory_items_session_id ON inventory_items(session_id);
CREATE INDEX idx_ai_recognition_attempts_user_id ON ai_recognition_attempts(user_id);

-- Composite indexes for common queries
CREATE INDEX idx_inventory_sessions_business_status ON inventory_sessions(business_id, status);
CREATE INDEX idx_products_category_active ON products(category_id, is_active) WHERE is_deleted = false;
```

### Query Optimization
```typescript
// Batch operations for better performance
const BATCH_SIZE = 50;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await supabase.from('table').upsert(batch);
}

// Use database functions for complex operations
const { data } = await supabase
  .rpc('get_stock_summary', {
    product_ids: productIds,
    store_ids: storeIds
  });
```

### Caching Strategy
```typescript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## Monitoring & Observability

### Audit Logging
```sql
-- Central audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_business_created ON audit_logs(business_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
```

### Performance Metrics
```typescript
// Track function execution time
const startTime = Date.now();
try {
  // Function logic
  const duration = Date.now() - startTime;
  
  await supabaseAdmin.from('performance_metrics').insert({
    function_name: 'function_name',
    duration_ms: duration,
    status: 'success',
    business_id: businessId
  });
} catch (error) {
  const duration = Date.now() - startTime;
  
  await supabaseAdmin.from('performance_metrics').insert({
    function_name: 'function_name',
    duration_ms: duration,
    status: 'error',
    error_message: error.message,
    business_id: businessId
  });
}
```

## Deployment Architecture

### Infrastructure Components
```yaml
# Supabase Configuration
project:
  name: wine-inventory-platform
  region: us-east-1
  
database:
  version: "15"
  extensions:
    - pgvector
    - pg_trgm
    - pgcrypto
    
edge_functions:
  runtime: "deno"
  memory: "512MB"
  timeout: "60s"
  
realtime:
  enabled: true
  max_connections: 200
  
storage:
  buckets:
    - name: "product-images"
      public: false
    - name: "ai-labels"
      public: false
```

### Environment Configuration
```bash
# Production Environment Variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Syrve Integration
SYRVE_ENCRYPTION_KEY=your-encryption-key

# AI Services
LOVABLE_API_KEY=your-lovable-api-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

This architecture ensures scalable, secure, and performant integration with Supabase while maintaining real-time capabilities and robust error handling.