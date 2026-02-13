# 07 — Inventory Management

**Event-Sourced Inventory Workflow**

This document defines the complete inventory counting workflow using event sourcing for audit trails and concurrent access.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Event-Sourced Design](#event-sourced-design)
3. [Session Lifecycle](#session-lifecycle)
4. [Counting Methods](#counting-methods)
5. [Variance Calculation](#variance-calculation)
6. [Approval \u0026 Export](#approval--export)

---

## Workflow Overview

### **Complete Flow**

```
1. CREATE SESSION (Draft)
   Manager creates session → inventory_sessions
   
2. LOAD BASELINE (Syrve → Baseline)
   Pull expected stock from Syrve → inventory_baseline_items
   Session status: draft → in_progress
   
3. COUNT ITEMS (Staff Counting)
   Staff scan/count products → inventory_count_events (append-only)
   Triggers update → inventory_product_aggregates
   
4. REVIEW VARIANCES (Manager Review)
   Manager reviews differences between baseline & counted
   Session status: in_progress → pending_review
   
5. APPROVE (Manager Approval)
   Manager approves session
   Session status: pending_review → approved
   
6. EXPORT TO SYRVE (Outbox)
   Create syrve_outbox_jobs → background processor submits
   Session status: approved → synced
```

### **Key Participants**

| Role | Permissions | Actions |
|------|-------------|---------|
| **Manager** | Full access | Create session, load baseline, review, approve |
| **Staff** | Limited access | Count items, cannot see expected baseline |
| **System** | Service role | Update aggregates, process outbox |

---

## Event-Sourced Design

### **Why Event Sourcing?**

**Benefits**:
- ✅ Complete audit trail (who counted what, when)
- ✅ Concurrent counting (multiple staff simultaneously)
- ✅ Historical playback (reconstruct state at any point)
- ✅ Easy debugging (trace every change)
- ✅ No lost data (append-only, never overwrite)

**Trade-offs**:
- ⚠️ More complex queries (requires aggregation)
- ⚠️ Additional storage (events + aggregates)
- ⚠️ Requires materialized views for performance

### **Architecture**

```
inventory_baseline_items (Immutable)
    ↓ Expected quantities from Syrve (manager-only)
    
inventory_count_events (Append-Only)
    ↓ Staff insert count events
    ↓ Triggers on INSERT
    
inventory_product_aggregates (Materialized)
    ↓ Real-time totals for performance
    
inventory_variances (Computed)
    ↓ Differences (expected vs counted)
```

### **Tables**

#### **1. `inventory_baseline_items`** (Immutable)

```sql
CREATE TABLE inventory_baseline_items (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES inventory_sessions(id),
    product_id UUID REFERENCES products(id),
    expected_qty_unopened NUMERIC DEFAULT 0,
    expected_open_liters NUMERIC DEFAULT 0,
    expected_total_liters NUMERIC,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, product_id)
);

-- RLS: Only managers can see baseline
CREATE POLICY "Managers only" ON inventory_baseline_items
    FOR SELECT
    USING (has_permission('inventory', 'view_expected', 'view'));
```

#### **2. `inventory_count_events`** (Append-Only)

```sql
CREATE TABLE inventory_count_events (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES inventory_sessions(id),
    product_id UUID REFERENCES products(id),
    counted_by UUID REFERENCES profiles(id),
    bottles_unopened NUMERIC DEFAULT 0,
    open_ml NUMERIC DEFAULT 0,
    open_liters NUMERIC GENERATED ALWAYS AS (open_ml / 1000.0) STORED,
    method TEXT DEFAULT 'manual',  -- 'manual', 'barcode', 'image_ai', 'manager_adjustment'
    confidence NUMERIC,
    ai_run_id UUID REFERENCES ai_runs(id),
    asset_id UUID REFERENCES media_assets(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Update aggregates on INSERT
CREATE TRIGGER update_aggregates_on_count
    AFTER INSERT ON inventory_count_events
    FOR EACH ROW
    EXECUTE FUNCTION refresh_product_aggregate();
```

#### **3. `inventory_product_aggregates`** (Materialized)

```sql
CREATE TABLE inventory_product_aggregates (
    session_id UUID REFERENCES inventory_sessions(id),
    product_id UUID REFERENCES products(id),
    counted_unopened_total NUMERIC DEFAULT 0,
    counted_open_liters_total NUMERIC DEFAULT 0,
    counted_total_liters NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (session_id, product_id)
);

-- Function to refresh aggregates
CREATE OR REPLACE FUNCTION refresh_product_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_product_aggregates (session_id, product_id, counted_unopened_total, counted_open_liters_total, counted_total_liters)
    SELECT
        NEW.session_id,
        NEW.product_id,
        SUM(bottles_unopened),
        SUM(open_liters),
        SUM(bottles_unopened * COALESCE(p.unit_capacity_liters, 0.75) + open_liters)
    FROM inventory_count_events ice
    JOIN products p ON p.id = ice.product_id
    WHERE ice.session_id = NEW.session_id AND ice.product_id = NEW.product_id
    GROUP BY NEW.session_id, NEW.product_id
    ON CONFLICT (session_id, product_id)
    DO UPDATE SET
        counted_unopened_total = EXCLUDED.counted_unopened_total,
        counted_open_liters_total = EXCLUDED.counted_open_liters_total,
        counted_total_liters = EXCLUDED.counted_total_liters,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

```

#### **Aggregate Maintenance**

While triggers handle real-time updates, a manual refresh function is provided for maintenance or to fix drift:

```sql
CREATE OR REPLACE FUNCTION refresh_inventory_aggregates(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM inventory_product_aggregates WHERE session_id = p_session_id;
    
    INSERT INTO inventory_product_aggregates 
    (session_id, product_id, counted_unopened_total, counted_open_liters_total, counted_total_liters)
    SELECT
        session_id,
        product_id,
        SUM(bottles_unopened),
        SUM(open_liters),
        SUM(bottles_unopened * COALESCE(750, 750) / 1000.0 + open_liters) -- Simplified, join products for real cap
    FROM inventory_count_events
    WHERE session_id = p_session_id
    GROUP BY session_id, product_id;
END;
$$ LANGUAGE plpgsql;
```

#### **4. `inventory_variances`** (Computed View)

```sql
CREATE OR REPLACE VIEW inventory_variances AS
SELECT
    s.id AS session_id,
    b.product_id,
    p.name AS product_name,
    b.expected_total_liters,
    COALESCE(a.counted_total_liters, 0) AS counted_total_liters,
    COALESCE(a.counted_total_liters, 0) - b.expected_total_liters AS difference_liters,
    ABS(COALESCE(a.counted_total_liters, 0) - b.expected_total_liters) > 0.1 AS has_variance
FROM inventory_sessions s
JOIN inventory_baseline_items b ON b.session_id = s.id
LEFT JOIN inventory_product_aggregates a ON a.session_id = s.id AND a.product_id = b.product_id
JOIN products p ON p.id = b.product_id
WHERE s.status IN ('in_progress', 'pending_review', 'approved', 'synced');
```

---

## Session Lifecycle

### **Status Flow**

```
draft → in_progress → pending_review → approved → synced
  ↓           ↓              ↓            ↓          ↓
cancelled   cancelled     flagged     flagged    (final)
```

### **1. CREATE SESSION** (`draft`)

**UI**: Manager clicks "New Inventory Count"

**Request**:
```typescript
const { data: session } = await supabase
  .from('inventory_sessions')
  .insert({
    store_id: currentStore.id,
    title: 'Weekly Count - Feb 13',
    comment: 'Full cellar inventory',
    created_by: currentUser.id,
    status: 'draft'
  })
  .select()
  .single();
```

**Result**: Session created with `status='draft'`

### **2. LOAD BASELINE** (`draft` → `in_progress`)

**UI**: Manager clicks "Load Expected Stock from Syrve"

**Edge Function**: `inventory-load-baseline`

```typescript
POST /functions/v1/inventory-load-baseline
{
  "session_id": "uuid"
}
```

**Workflow**:
1. Login to Syrve
2. Fetch `/stock-and-sales` for `session.store_id`
3. Insert baseline records
4. Update session: `status='in_progress'`, `baseline_taken_at=NOW()`

### **3. COUNT ITEMS** (`in_progress`)

**UI**: Staff mobile app

**Methods**:

**Manual Entry**:
```typescript
await supabase
  .from('inventory_count_events')
  .insert({
    session_id: currentSession.id,
    product_id: selectedProduct.id,
    counted_by: currentUser.id,
    bottles_unopened: 12,
    open_ml: 375,
    method: 'manual'
  });
```

**Barcode Scan**:
```typescript
const barcode = await scanBarcode();
const { data: product } = await supabase
  .from('product_barcodes')
  .select('product:products(*)')
  .eq('barcode', barcode)
  .single();

await supabase
  .from('inventory_count_events')
  .insert({
    session_id: currentSession.id,
    product_id: product.id,
    counted_by: currentUser.id,
    bottles_unopened: 1,
    method: 'barcode'
  });
```

**AI Scan**:
```typescript
const { data: aiResult } = await supabase.functions.invoke('ai-scan', {
  body: {
    session_id: currentSession.id,
    image_path: uploadedImage.path
  }
});

await supabase
  .from('inventory_count_events')
  .insert({
    session_id: currentSession.id,
    product_id: aiResult.top_match.product_id,
    counted_by: currentUser.id,
    bottles_unopened: 1,
    method: 'image_ai',
    confidence: aiResult.top_match.confidence,
    ai_run_id: aiResult.run_id,
    asset_id: aiResult.asset_id
  });
```

### **4. REVIEW VARIANCES** (`in_progress` → `pending_review`)

**UI**: Manager dashboard

**Query Variances**:
```typescript
const { data: variances } = await supabase
  .from('inventory_variances')
  .select('*')
  .eq('session_id', currentSession.id)
  .eq('has_variance', true)
  .order('difference_liters', { ascending: false });

// Show:  name | expected | counted | difference
```

**Manager Adjustments** (if discrepancies):
```typescript
await supabase
  .from('inventory_count_events')
  .insert({
    session_id: currentSession.id,
    product_id: product.id,
    counted_by: currentUser.id,
    bottles_unopened: correctedAmount,
    method: 'manager_adjustment',
    comment: 'Correcting staff miscount'
  });
```

**Mark for Review**:
```typescript
await supabase
  .from('inventory_sessions')
  .update({ status: 'pending_review' })
  .eq('id', currentSession.id);
```

### **5. APPROVE** (`pending_review` → `approved`)

**UI**: Manager clicks "Approve \u0026 Submit to Syrve"

```typescript
await supabase
  .from('inventory_sessions')
  .update({
    status: 'approved',
    approved_by: currentUser.id,
    approved_at: new Date().toISOString()
  })
  .eq('id', currentSession.id);
```

### **6. EXPORT TO SYRVE** (`approved` → `synced`)

**Edge Function**: `inventory-submit-to-syrve`

```typescript
const { data: outboxJob } = await supabase.functions.invoke('inventory-submit-to-syrve', {
  body: { session_id: currentSession.id }
});

// Background processor picks up job
// On success: session.status = 'synced'
```

---

## Counting Methods

### **Method Comparison**

| Method | Speed | Accuracy | Use Case |
|--------|-------|----------|----------|
| **Manual** | Slow | Medium | Open bottles, custom items |
| **Barcode** | Fast | High | Products with barcodes |
| **Image AI** | Medium | High | Wine labels without barcodes |
| **Manager Adjustment** | N/A | Authoritative | Corrections after review |

### **Concurrency Handling**

**Scenario**: Two staff count the same product simultaneously

```
Staff A inserts: bottles_unopened = 5 @ 10:00:00
Staff B inserts: bottles_unopened = 3 @ 10:00:05

Aggregate: 5 + 3 = 8 total (WRONG!)

Solution: Manager reviews, adds adjustment:
bottles_unopened = -3, method='manager_adjustment'

Final aggregate: 5 + 3 - 3 = 5 ✓
```

**Best Practice**: Assign product ranges to staff to minimize overlaps.

---

## Variance Calculation

### **Formula**

```
Expected Total Liters = 
    (expected_qty_unopened × unit_capacity_liters) + expected_open_liters

Counted Total Liters = 
    (counted_unopened_total × unit_capacity_liters) + counted_open_liters_total

Variance = Counted Total Liters - Expected Total Liters
```

### **Variance Threshold**

```typescript
const VARIANCE_THRESHOLD_LITERS = 0.1; // 100ml tolerance

if (Math.abs(variance) > VARIANCE_THRESHOLD_LITERS) {
  // Flag for review
}
```

### **Variance Report**

```sql
SELECT
    p.name,
    p.code,
    v.expected_total_liters,
    v.counted_total_liters,
    v.difference_liters,
    CASE
        WHEN v.difference_liters > 0 THEN 'Overage'
        WHEN v.difference_liters < 0 THEN 'Shortage'
        ELSE 'Match'
    END AS variance_type,
    ABS(v.difference_liters * p.default_sale_price / COALESCE(p.unit_capacity_liters, 0.75)) AS value_impact_eur
FROM inventory_variances v
JOIN products p ON p.id = v.product_id
WHERE v.session_id = $1
  AND v.has_variance = true
ORDER BY ABS(v.difference_liters) DESC;
```

---

## Approval \u0026 Export

### **Pre-Approval Checks**

```typescript
async function validateSessionForApproval(sessionId: string) {
  // 1. Check all products in baseline have been counted
  const { data: uncounted } = await supabase
    .from('inventory_baseline_items')
    .select('product_id')
    .eq('session_id', sessionId)
    .not('product_id', 'in', `(
      SELECT DISTINCT product_id
      FROM inventory_count_events
      WHERE session_id = '${sessionId}'
    )`);
  
  if (uncounted.length > 0) {
    throw new Error(`${uncounted.length} products not yet counted`);
  }
  
  // 2. Check for high variances
  const { data: highVariances } = await supabase
    .from('inventory_variances')
    .select('*')
    .eq('session_id', sessionId)
    .gt('difference_liters', 5); // >5L variance
  
  if (highVariances.length > 0) {
    // Warn but allow approval
  console.log(`Warning: ${highVariances.length} high variances detected`);
  }
  
  return { valid: true };
}
```

### **XML Generation**

```typescript
function buildInventoryXML(sessionId: string, aggregates: Aggregate[]) {
  return `<?xml version="1.0" encoding="utf-8"?>
<document>
  <documentNumber>${sessionId}</documentNumber>
  <dateIncoming>${new Date().toISOString()}</dateIncoming>
  <store>${session.store_id}</store>
  <items>
    ${aggregates.map(agg => {
      const product = getProduct(agg.product_id);
      const syrveAmount = agg.counted_unopened_total + 
        (agg.counted_open_liters_total / (product.unit_capacity_liters || 0.75));
      
      return `<item>
      <product>${product.syrve_product_id}</product>
      <amount>${syrveAmount.toFixed(3)}</amount>
    </item>`;
    }).join('\n')}
  </items>
</document>`;
}
```

---

## Next Steps

- Review [04-syrve-integration.md](04-syrve-integration.md) for Syrve submission details
- Study [05-edge-functions.md](05-edge-functions.md) for inventory function implementations
- Examine [08-deployment-guide.md](08-deployment-guide.md) for database migration
