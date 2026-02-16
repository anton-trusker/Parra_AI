# Mock Data Removal & Full Integration Checklist

## Overview
This checklist ensures complete removal of all mock data and full integration with Supabase backend, edge functions, and real-time features.

## Mock Data Files to Remove/Replace

### 1. Stock Data (`src/data/mockStockByStore.ts`)
- [ ] Replace with `useStockByStore` hook using Supabase RPC
- [ ] Create `get_stock_by_store` database function
- [ ] Update all components using mock stock data
- [ ] Test stock queries with real data

### 2. Inventory Sessions (`src/data/mockInventoryChecks.ts`)
- [ ] Replace with `useInventorySessions` hook
- [ ] Update session list components
- [ ] Test session creation and status updates
- [ ] Verify session filtering and sorting

### 3. Check Details (`src/data/mockCheckDetail.ts`)
- [ ] Replace with `useSessionItems` hook
- [ ] Update inventory detail views
- [ ] Test item aggregation and variance calculations
- [ ] Verify count event history

### 4. AI Scans (`src/data/mockAiScans.ts`)
- [ ] Replace with `useAiRecognitionAttempts` hook
- [ ] Update AI recognition history
- [ ] Test recognition result display
- [ ] Verify confidence scoring display

### 5. Store Data (`src/data/mockStores.ts`)
- [ ] Replace with `useStores` hook
- [ ] Update store selection components
- [ ] Test store-based filtering
- [ ] Verify store permissions

### 6. User Data (`src/data/mockUsers.ts`)
- [ ] Replace with `useUsers` hook
- [ ] Update user management interface
- [ ] Test role-based permissions
- [ ] Verify user creation/editing

## Edge Function Implementation Status

### ✅ Completed Functions
- [x] `syrve-sync` - Full Syrve integration
- [x] `ai-recognize-label` - AI wine recognition
- [x] `inventory-create-session` - Session creation
- [x] `inventory-load-baseline` - Baseline loading
- [x] `inventory-submit-to-syrve` - Final submission

### ⚠️ Functions Needing Configuration
- [ ] `syrve-connect-test` - Test connection endpoint
- [ ] `syrve-save-config` - Configuration management
- [ ] `manage-users` - User CRUD operations
- [ ] `ai-enrich-wine` - Wine data enrichment
- [ ] `generate-wine-embeddings` - Vector embeddings

### 🔧 Functions Needing Deployment
- [ ] Deploy all functions to production
- [ ] Set environment variables
- [ ] Test function execution
- [ ] Configure error handling
- [ ] Set up monitoring

## Real-time Integration Tasks

### WebSocket Configuration
- [ ] Enable realtime in Supabase project
- [ ] Configure presence tracking for sessions
- [ ] Set up inventory item change subscriptions
- [ ] Implement user activity tracking
- [ ] Test real-time updates across devices

### Presence System
- [ ] Create `useInventoryPresence` hook
- [ ] Implement user join/leave notifications
- [ ] Add activity status indicators
- [ ] Test collaborative counting scenarios
- [ ] Handle connection interruptions

## Database Function Requirements

### Core Functions to Create
```sql
-- Stock aggregation function
CREATE OR REPLACE FUNCTION get_stock_by_store(...)

-- Inventory summary function  
CREATE OR REPLACE FUNCTION get_inventory_summary(...)

-- User permissions function
CREATE OR REPLACE FUNCTION has_role(...)

-- Business context function
CREATE OR REPLACE FUNCTION current_business_id(...)

-- Wine matching function
CREATE OR REPLACE FUNCTION match_wines_trigram(...)
CREATE OR REPLACE FUNCTION match_wines_embedding(...)
```

### Indexes for Performance
```sql
-- Core indexes
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_stock_levels_product_store ON stock_levels(product_id, store_id);
CREATE INDEX idx_inventory_items_session_id ON inventory_items(session_id);
CREATE INDEX idx_ai_recognition_attempts_user_id ON ai_recognition_attempts(user_id);

-- Full-text search indexes
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku_trgm ON products USING gin(sku gin_trgm_ops);
```

## Frontend Integration Tasks

### Hook Replacements
- [ ] Replace `useMockStockByStore` → `useStockByStore`
- [ ] Replace `useMockInventoryChecks` → `useInventorySessions`
- [ ] Replace `useMockCheckDetail` → `useSessionItems`
- [ ] Replace `useMockAiScans` → `useAiRecognitionAttempts`
- [ ] Replace `useMockStores` → `useStores`
- [ ] Replace `useMockUsers` → `useUsers`

### Component Updates
- [ ] Update `CurrentStock.tsx` to use real data
- [ ] Update `InventoryChecksPage.tsx` with live sessions
- [ ] Update `InventoryCheckDetail.tsx` with real items
- [ ] Update `AiScansPage.tsx` with recognition history
- [ ] Update store selectors in all components
- [ ] Update user management in settings

### Real-time Updates
- [ ] Add presence tracking to counting sessions
- [ ] Implement live count updates
- [ ] Add user activity indicators
- [ ] Handle connection status UI
- [ ] Implement offline mode detection

## Configuration & Environment

### Environment Variables
```bash
# Required variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Syrve integration
SYRVE_ENCRYPTION_KEY=your-encryption-key

# AI services
LOVABLE_API_KEY=your-lovable-api-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

### Supabase Configuration
- [ ] Enable Row Level Security on all tables
- [ ] Configure RLS policies for business isolation
- [ ] Set up role-based permissions
- [ ] Enable realtime subscriptions
- [ ] Configure storage buckets
- [ ] Set up database triggers

## Testing & Validation

### Unit Tests
- [ ] Test all new hooks with real data
- [ ] Verify error handling
- [ ] Test loading states
- [ ] Validate data transformations
- [ ] Test caching behavior

### Integration Tests
- [ ] Test complete inventory workflow
- [ ] Verify Syrve data synchronization
- [ ] Test AI recognition pipeline
- [ ] Validate real-time updates
- [ ] Test multi-user scenarios

### Performance Tests
- [ ] Test with large datasets
- [ ] Verify query performance
- [ ] Test real-time scalability
- [ ] Check edge function response times
- [ ] Validate caching effectiveness

## Error Handling & Monitoring

### Frontend Error Handling
- [ ] Add error boundaries to components
- [ ] Implement retry logic for failed requests
- [ ] Add user-friendly error messages
- [ ] Handle network connectivity issues
- [ ] Implement offline mode

### Backend Error Handling
- [ ] Add try-catch blocks to all edge functions
- [ ] Implement audit logging
- [ ] Add performance monitoring
- [ ] Set up error alerting
- [ ] Create error recovery procedures

### Monitoring Setup
- [ ] Configure Supabase analytics
- [ ] Set up function execution monitoring
- [ ] Add database performance monitoring
- [ ] Implement user activity tracking
- [ ] Create health check endpoints

## Deployment Checklist

### Pre-deployment
- [ ] All mock data removed
- [ ] All hooks using real data
- [ ] Edge functions deployed and tested
- [ ] Database functions created
- [ ] RLS policies configured
- [ ] Environment variables set
- [ ] Performance optimizations applied

### Deployment
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Perform user acceptance testing
- [ ] Validate with real Syrve data
- [ ] Test real-time features
- [ ] Check performance metrics

### Post-deployment
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify data integrity
- [ ] Monitor performance metrics
- [ ] Set up maintenance procedures

## Rollback Plan

### If Issues Arise
1. **Data Issues**: Restore from backup
2. **Function Errors**: Rollback edge functions
3. **Performance Issues**: Scale up resources
4. **Integration Failures**: Disable problematic features
5. **User Impact**: Communicate status and timeline

### Emergency Contacts
- Database Administrator: [contact info]
- Supabase Support: support@supabase.io
- Syrve API Support: [contact info]
- Development Team: [contact info]

## Success Criteria

### Functional Requirements
- [ ] All pages load with real data
- [ ] Inventory sessions work end-to-end
- [ ] AI recognition functional
- [ ] Syrve integration operational
- [ ] Real-time updates working
- [ ] User management functional

### Performance Requirements
- [ ] Page load time < 2 seconds
- [ ] Query response time < 500ms
- [ ] Edge function execution < 30s
- [ ] Real-time latency < 1s
- [ ] Concurrent user support > 50

### Quality Requirements
- [ ] Zero data loss
- [ ] 99.9% uptime
- [ ] Error rate < 1%
- [ ] User satisfaction > 90%
- [ ] Security compliance verified

This checklist ensures systematic removal of mock data and complete integration with the Supabase backend infrastructure.