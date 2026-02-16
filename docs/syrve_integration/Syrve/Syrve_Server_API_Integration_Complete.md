# Wine Inventory Management System
## Syrve Server API Integration - Complete Technical Specification

**Document Version:** 2.0  
**Date:** February 9, 2026  
**Integration Type:** Bi-directional Stock Synchronization  
**API Version:** Syrve Server API (Local Installation)  
**Alternative:** iiko Cloud API (if needed)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Server API vs Cloud API](#api-comparison)
3. [Authentication (Server API)](#authentication)
4. [Product/Wine Retrieval](#product-retrieval)
5. [Inventory Document Operations](#inventory-operations)
6. [Complete Integration Workflow](#integration-workflow)
7. [Data Models & Schemas](#data-models)
8. [XML Templates](#xml-templates)
9. [Error Handling](#error-handling)
10. [Implementation Code Examples](#implementation)
11. [Testing Strategy](#testing)
12. [Migration to Cloud API (Optional)](#migration)

---

<a name="executive-summary"></a>
## 1. Executive Summary

### Integration Overview

This document provides complete technical specifications for integrating the Wine Inventory Management System with **Syrve Server API** - the local installation API that runs on-premise at `http://host:port/resto/api/`.

### Key Differences: Server API vs Cloud API

| Feature | Server API (Local) | Cloud API |
|---------|-------------------|-----------|
| **Installation** | On-premise server | Cloud-hosted |
| **Base URL** | `http://localhost:8080/resto/api/` | `https://api-eu.iiko.services/` |
| **Authentication** | SHA1 password hash + session token | API Login key + JWT token |
| **Data Format** | XML | JSON |
| **License** | Takes one API license per session | API license required |
| **Network** | Local network access | Internet required |
| **Response Time** | Faster (local) | Depends on internet |
| **Use Case** | Direct on-premise integration | Cloud/remote integration |

### Why Use Server API?

✅ **Direct local access** - No internet dependency  
✅ **Faster response times** - Local network only  
✅ **More control** - XML format provides detailed control  
✅ **Real-time access** - Direct database access  
✅ **Inventory documents** - Full document workflow support  

### Integration Capabilities

1. **Retrieve Product List** - Get all wines/products from Syrve
2. **Get Current Stock** - Retrieve current inventory levels  
3. **Submit Inventory** - Send physical count results via XML documents
4. **Automatic Variance Calculation** - Syrve calculates shortage/excess
5. **Document Validation** - Validate before posting

---

<a name="api-comparison"></a>
## 2. Server API vs Cloud API

### 2.1 Architecture Comparison

```
SERVER API (LOCAL):
┌─────────────────────────────────────────────────────┐
│  Wine Inventory System                              │
│  http://your-restaurant.com                         │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/XML
                     │ Local Network
┌────────────────────┴────────────────────────────────┐
│  Syrve Server API                                   │
│  http://localhost:8080/resto/api/                   │
│  (Running on local server)                          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│  Syrve Back Office Database                         │
│  (Local PostgreSQL/SQL Server)                      │
└─────────────────────────────────────────────────────┘

CLOUD API:
┌─────────────────────────────────────────────────────┐
│  Wine Inventory System                              │
│  http://your-restaurant.com                         │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/JSON
                     │ Internet
┌────────────────────┴────────────────────────────────┐
│  iiko Cloud API                                     │
│  https://api-eu.iiko.services/                      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│  iiko Cloud Database                                │
│  (Cloud-hosted)                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 When to Use Each API

**Use Server API when:**
- Syrve is installed on-premise
- You have local network access
- You want faster response times
- You prefer XML format
- You need full document workflow

**Use Cloud API when:**
- Using Syrve cloud version
- Integration is remote/cloud-based
- You prefer JSON format
- You need simpler authentication

---

<a name="authentication"></a>
## 3. Authentication (Server API)

### 3.1 Authentication Flow

**IMPORTANT:** When you log in, you take one API Server license. The token can be used until it expires. If you have only one server license, you can only get one token at a time.

### 3.2 Login (Get Token)

**Endpoint:** `GET /resto/api/auth`

**Parameters:**
- `login` - Syrve Office user login
- `pass` - Password in SHA1 hash format

**URL Format:**
```
http://host:port/resto/api/auth?login=[login]&pass=[sha1hash]
```

**Example:**
```
http://localhost:8080/resto/api/auth?login=admin&pass=2155245b2c002a1986d3f384af93be813537a476
```

**How to Generate SHA1 Hash:**

```bash
# Linux/Mac
printf "your_password" | sha1sum

# Result example:
# 2155245b2c002a1986d3f384af93be813537a476
```

```javascript
// Node.js
const crypto = require('crypto');
const password = 'your_password';
const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
console.log(sha1Hash); // 2155245b2c002a1986d3f384af93be813537a476
```

**Response:**
```
b354d18c-3d3a-e1a6-c3b9-9ef7b5055318
```

The response is a **token** (UUID format) that must be passed as `key` parameter in all subsequent requests.

### 3.3 Logout (Release License)

**Endpoint:** `GET /resto/api/logout`

**Parameters:**
- `key` - The token received during authentication

**Example:**
```
http://localhost:8080/resto/api/logout?key=b354d18c-3d3a-e1a6-c3b9-9ef7b5055318
```

**CRITICAL:** Always logout when done to release the API license for other users/systems.

### 3.4 Authentication Service Implementation

```typescript
class SyrveServerAuthService {
  private baseUrl: string;
  private login: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(baseUrl: string, login: string, password: string) {
    this.baseUrl = baseUrl; // e.g., 'http://localhost:8080/resto/api'
    this.login = login;
    this.password = password;
  }

  // Generate SHA1 hash
  private generateSHA1(text: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(text).digest('hex');
  }

  // Authenticate and get token
  async authenticate(): Promise<string> {
    const sha1Hash = this.generateSHA1(this.password);
    const url = `${this.baseUrl}/auth?login=${this.login}&pass=${sha1Hash}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      this.token = await response.text(); // Token is plain text response
      // Server API tokens don't have explicit expiry, but best practice is to refresh every hour
      this.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      console.log('Authenticated successfully. Token:', this.token);
      return this.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Get valid token (authenticate if needed)
  async getValidToken(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    return await this.authenticate();
  }

  // Logout and release license
  async logout(): Promise<void> {
    if (!this.token) {
      return;
    }

    const url = `${this.baseUrl}/logout?key=${this.token}`;

    try {
      await fetch(url);
      this.token = null;
      this.tokenExpiry = null;
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Make authenticated request
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${separator}key=${token}`;

    return fetch(url, options);
  }
}

// Usage
const auth = new SyrveServerAuthService(
  'http://localhost:8080/resto/api',
  'admin',
  'your_password'
);

// Login
await auth.authenticate();

// Use token for requests
const response = await auth.makeRequest('/products');

// Always logout when done
await auth.logout();
```

---

<a name="product-retrieval"></a>
## 4. Product/Wine Retrieval

### 4.1 Get Product List

**Endpoint:** `GET /resto/api/products`

**Parameters:**
- `key` - Authentication token (required)
- `includeDeleted` - Include deleted items (true/false, default: false)

**Example Request:**
```
http://localhost:8080/resto/api/products?key=754a4184-a626-d2eb-c7a9-94d8244b5ca7
```

**Response Format:** XML

**Example Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<productDto>
  <items>
    <item>
      <id>F464E4D4-CF9C-49A2-9E18-1227B41A3801</id>
      <code>00001</code>
      <name>Château Margaux 2018</name>
      <type>DISH</type>
      <productGroupType>PRODUCTS</productGroupType>
      <category>
        <id>group-uuid</id>
        <name>Wines - Red</name>
      </category>
      <mainUnit>bottle</mainUnit>
      <price>125.00</price>
      <num>1</num>
      <deleted>false</deleted>
    </item>
    <item>
      <id>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E</id>
      <code>00002</code>
      <name>Domaine de la Romanée-Conti 2019</name>
      <type>DISH</type>
      <productGroupType>PRODUCTS</productGroupType>
      <category>
        <id>group-uuid</id>
        <name>Wines - Red</name>
      </category>
      <mainUnit>bottle</mainUnit>
      <price>450.00</price>
      <num>2</num>
      <deleted>false</deleted>
    </item>
  </items>
</productDto>
```

**Product Types:**
- `GOODS` - Ingredients
- `DISH` - Menu items (use for wines)
- `PREPARED` - Prepared items
- `SERVICE` - Services
- `MODIFIER` - Modifiers
- `OUTER` - Outer goods
- `PETROL` - Petrol
- `RATE` - Rates

### 4.2 Product Search

**Endpoint:** `GET /resto/api/products/search`

**Parameters:**
- `key` - Authentication token
- `num` - Product number
- `code` - Product code/SKU
- `barCode` - Barcode

**Example:**
```
http://localhost:8080/resto/api/products/search?key=[token]&barCode=5901234123457
```

### 4.3 Get Current Stock (via Stores)

**Endpoint:** `GET /resto/api/v2/entities/products/stock-and-sales`

**Parameters:**
- `key` - Authentication token
- `storeIds` - Comma-separated store IDs
- `productIds` - Comma-separated product IDs

**Example:**
```
http://localhost:8080/resto/api/v2/entities/products/stock-and-sales?key=[token]&storeIds=store-uuid&productIds=product-uuid1,product-uuid2
```

**Response:** XML with stock information

---

<a name="inventory-operations"></a>
## 5. Inventory Document Operations

### 5.1 Incoming Inventory Document Structure

The **Incoming Inventory** document is used to record physical inventory counts and adjust stock levels based on actual counts.

**Purpose:** Submit physical inventory count results to Syrve

**Endpoint:** `POST /resto/api/documents/import/incomingInventory`

**Headers:**
```
Content-Type: application/xml
```

**Body:** XML document in `incomingInventoryDto` format

### 5.2 Inventory Document XML Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document>
  <!-- Document number (unique identifier) -->
  <documentNumber>INV-2026-02-09-001</documentNumber>
  
  <!-- Document date/time (ISO 8601 format) -->
  <dateIncoming>2026-02-09T18:30:00</dateIncoming>
  
  <!-- Use default document time from settings -->
  <useDefaultDocumentTime>false</useDefaultDocumentTime>
  
  <!-- Document status: NEW, PROCESSED, DELETED -->
  <status>PROCESSED</status>
  
  <!-- Account code for surplus (default: "5.10" - Inventory surplus) -->
  <accountSurplusCode>5.10</accountSurplusCode>
  
  <!-- Account code for shortage (default: "5.09" - Inventory shortage) -->
  <accountShortageCode>5.09</accountShortageCode>
  
  <!-- Store ID (REQUIRED) -->
  <storeId>1239d270-1bbe-f64f-b7ea-5f00518ef508</storeId>
  
  <!-- Optional: Conception ID (if using conceptions) -->
  <conceptionId></conceptionId>
  
  <!-- Comment -->
  <comment>Physical wine inventory - Session ID: INV-2026-02-09-001</comment>
  
  <!-- Inventory items -->
  <items>
    <!-- Item 1: Wine counted -->
    <item>
      <!-- Item status: NEW, SAVE, RECALC -->
      <status>SAVE</status>
      
      <!-- Product ID (wine UUID from Syrve) -->
      <productId>F464E4D4-CF9C-49A2-9E18-1227B41A3801</productId>
      
      <!-- Actual quantity counted (in base units) -->
      <amountContainer>8.0</amountContainer>
      
      <!-- Optional: Comment for this item -->
      <comment>Château Margaux 2018 - Unopened bottles</comment>
    </item>
    
    <!-- Item 2: Wine with container/packaging -->
    <item>
      <status>SAVE</status>
      <productId>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E</productId>
      
      <!-- Optional: Container/packaging ID -->
      <containerId>551E0382-64CA-49F1-B74F-733EBC6902C4</containerId>
      
      <!-- Quantity in containers -->
      <amountContainer>18.0</amountContainer>
      
      <comment>DRC 2019 - Case count</comment>
    </item>
    
    <!-- Item 3: Another wine -->
    <item>
      <status>SAVE</status>
      <productId>A1234567-89AB-CDEF-0123-456789ABCDEF</productId>
      <amountContainer>5.0</amountContainer>
    </item>
  </items>
</document>
```

### 5.3 Item Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `NEW` | Not saved, no postings created | Draft items, not finalized |
| `SAVE` | Saved, postings created | Final counted items |
| `RECALC` | Deleted (from previous count) | Items from previous inventory |

**Important:** All items for the same product must have the same status.

### 5.4 Response - Validation Result

**Response Structure:** `incomingInventoryValidationResult`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<incomingInventoryValidationResult>
  <!-- Validation result -->
  <valid>true</valid>
  
  <!-- Warning flag -->
  <warning>false</warning>
  
  <!-- Document number -->
  <documentNumber>INV-2026-02-09-001</documentNumber>
  
  <!-- Store information -->
  <store>
    <id>1239d270-1bbe-f64f-b7ea-5f00518ef508</id>
    <code>1</code>
    <name>Main Wine Cellar</name>
  </store>
  
  <!-- Document date -->
  <date>2026-02-09T18:30:00+00:00</date>
  
  <!-- Inventory items with variances -->
  <items>
    <item>
      <!-- Product details -->
      <product>
        <id>F464E4D4-CF9C-49A2-9E18-1227B41A3801</id>
        <code>00001</code>
        <name>Château Margaux 2018</name>
      </product>
      
      <!-- Expected quantity (from system) -->
      <expectedAmount>10.000000000</expectedAmount>
      
      <!-- Expected value -->
      <expectedSum>1250.000000000</expectedSum>
      
      <!-- Actual quantity (counted) -->
      <actualAmount>8.000</actualAmount>
      
      <!-- Difference (actual - expected) -->
      <differenceAmount>-2.000000000</differenceAmount>
      
      <!-- Difference value -->
      <differenceSum>-250.000000000</differenceSum>
    </item>
    
    <item>
      <product>
        <id>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E</id>
        <code>00002</code>
        <name>DRC 2019</name>
      </product>
      <expectedAmount>15.000000000</expectedAmount>
      <expectedSum>6750.000000000</expectedSum>
      <actualAmount>18.000</actualAmount>
      <differenceAmount>3.000000000</differenceAmount>
      <differenceSum>1350.000000000</differenceSum>
    </item>
  </items>
</incomingInventoryValidationResult>
```

**Key Fields:**
- `valid` - true if document is valid and can be processed
- `warning` - true if there are warnings (but document can still be processed)
- `differenceAmount` - Positive = surplus, Negative = shortage
- `differenceSum` - Value of variance

### 5.5 Check/Validate Before Submitting

**Endpoint:** `POST /resto/api/documents/check/incomingInventory`

**Purpose:** Validate inventory document without actually posting it

**Headers:** Same as import endpoint

**Body:** Same XML structure as import

**Response:** Same validation result structure

**Use Case:** Check for errors before final submission

---

<a name="integration-workflow"></a>
## 6. Complete Integration Workflow

### 6.1 End-to-End Inventory Process

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: START INVENTORY SESSION                           │
└─────────────────────────────────────────────────────────────┘

1. User starts inventory session in Wine Inventory System
   ↓
2. Authenticate with Syrve Server API
   GET /resto/api/auth?login=admin&pass=[sha1]
   ← Token: b354d18c-3d3a-e1a6-c3b9-9ef7b5055318
   ↓
3. Retrieve all wines/products from Syrve
   GET /resto/api/products?key=[token]
   ← XML list of all products
   ↓
4. Parse XML and match to Wine Inventory catalog
   - Match by product ID (stored in wine_syrve_product_mappings)
   - Match by code/SKU
   - Match by barcode
   ↓
5. Get current stock levels for each wine
   GET /resto/api/v2/entities/products/stock-and-sales?key=[token]&productIds=...
   ← Stock levels for each product
   ↓
6. Store baseline stock in inventory_items table
   - expected_quantity_unopened = current stock from Syrve
   - counted_quantity_unopened = 0 (to be filled during count)

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: PERFORM PHYSICAL COUNT                            │
└─────────────────────────────────────────────────────────────┘

7. Staff counts wines using mobile app
   - Scan barcodes or use image recognition
   - Enter quantities
   - System updates inventory_items.counted_quantity_*
   ↓
8. System calculates variances in real-time
   - variance = counted - expected
   ↓
9. User completes inventory session
   - Status changes to 'completed'

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: SUBMIT TO SYRVE                                   │
└─────────────────────────────────────────────────────────────┘

10. Build XML inventory document
    - Document number: INV-[session_id]
    - Status: PROCESSED
    - Items: All counted wines with amountContainer = counted quantity
    ↓
11. Validate document first (optional but recommended)
    POST /resto/api/documents/check/incomingInventory
    Headers: Content-Type: application/xml
    Body: [XML document]
    ← Validation result
    ↓
12. If valid, submit inventory document
    POST /resto/api/documents/import/incomingInventory
    Headers: Content-Type: application/xml
    Body: [XML document]
    ← Validation result with variances
    ↓
13. Process response
    - Parse XML response
    - Extract differenceAmount for each product
    - Store in syrve_writeoff_documents table
    - Update inventory_movements with Syrve correlation
    ↓
14. Update local stock levels
    UPDATE wines SET current_stock_unopened = counted_quantity
    WHERE wine_id IN (...)
    ↓
15. Mark session as synced
    UPDATE inventory_sessions SET synced_with_syrve = true
    ↓
16. Logout from Syrve (release license)
    GET /resto/api/logout?key=[token]
```

### 6.2 Complete Code Example

```typescript
class SyrveInventoryIntegration {
  private auth: SyrveServerAuthService;
  private db: Database; // Your database connection

  constructor(baseUrl: string, login: string, password: string, db: Database) {
    this.auth = new SyrveServerAuthService(baseUrl, login, password);
    this.db = db;
  }

  async performInventorySync(sessionId: string): Promise<void> {
    try {
      // 1. Authenticate
      console.log('Authenticating with Syrve...');
      await this.auth.authenticate();

      // 2. Get products from Syrve
      console.log('Fetching products from Syrve...');
      const products = await this.getSyrveProducts();

      // 3. Match products to wines
      console.log('Matching products to wine catalog...');
      await this.matchProductsToWines(products);

      // 4. Get inventory items from session
      const inventoryItems = await this.db.query(
        'SELECT * FROM inventory_items WHERE session_id = $1',
        [sessionId]
      );

      // 5. Build XML document
      console.log('Building XML inventory document...');
      const xml = this.buildInventoryXML(sessionId, inventoryItems.rows);

      // 6. Validate document
      console.log('Validating inventory document...');
      const validationResult = await this.validateInventory(xml);

      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errorMessage}`);
      }

      // 7. Submit inventory document
      console.log('Submitting inventory to Syrve...');
      const submitResult = await this.submitInventory(xml);

      // 8. Process response and update database
      console.log('Processing Syrve response...');
      await this.processInventoryResponse(sessionId, submitResult);

      // 9. Mark session as synced
      await this.db.query(
        'UPDATE inventory_sessions SET synced_with_syrve = true, syrve_sync_at = NOW() WHERE id = $1',
        [sessionId]
      );

      console.log('Inventory sync completed successfully!');

    } catch (error) {
      console.error('Inventory sync failed:', error);
      throw error;
    } finally {
      // Always logout to release license
      await this.auth.logout();
    }
  }

  private async getSyrveProducts(): Promise<any[]> {
    const response = await this.auth.makeRequest('/products');
    const xmlText = await response.text();
    
    // Parse XML
    const parser = new XMLParser();
    const result = parser.parse(xmlText);
    
    return result.productDto?.items?.item || [];
  }

  private async matchProductsToWines(syrveProducts: any[]): Promise<void> {
    for (const product of syrveProducts) {
      // Try to find existing mapping
      const existing = await this.db.query(
        'SELECT * FROM wine_syrve_product_mappings WHERE syrve_product_id = $1',
        [product.id]
      );

      if (existing.rows.length > 0) {
        continue; // Already mapped
      }

      // Try to match by code
      const wineByCode = await this.db.query(
        'SELECT * FROM wines WHERE sku = $1 OR primary_barcode = $2',
        [product.code, product.code]
      );

      if (wineByCode.rows.length > 0) {
        // Create mapping
        await this.db.query(`
          INSERT INTO wine_syrve_product_mappings 
          (wine_id, syrve_product_id, syrve_product_code, syrve_product_name, match_method, confidence_score)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          wineByCode.rows[0].id,
          product.id,
          product.code,
          product.name,
          'code',
          1.0
        ]);
      } else {
        // Try fuzzy match by name
        const fuzzyMatch = await this.fuzzyMatchWineByName(product.name);
        if (fuzzyMatch) {
          await this.db.query(`
            INSERT INTO wine_syrve_product_mappings 
            (wine_id, syrve_product_id, syrve_product_code, syrve_product_name, match_method, confidence_score)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            fuzzyMatch.id,
            product.id,
            product.code,
            product.name,
            'fuzzy_name',
            fuzzyMatch.confidence
          ]);
        }
      }
    }
  }

  private buildInventoryXML(sessionId: string, inventoryItems: any[]): string {
    const session = this.db.query('SELECT * FROM inventory_sessions WHERE id = $1', [sessionId]);
    
    const xmlItems = inventoryItems.map(item => {
      return `
    <item>
      <status>SAVE</status>
      <productId>${item.syrve_product_id}</productId>
      <amountContainer>${item.counted_quantity_unopened + item.counted_quantity_opened}</amountContainer>
      <comment>${item.notes || ''}</comment>
    </item>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>INV-${sessionId}</documentNumber>
  <dateIncoming>${new Date().toISOString()}</dateIncoming>
  <status>PROCESSED</status>
  <accountSurplusCode>5.10</accountSurplusCode>
  <accountShortageCode>5.09</accountShortageCode>
  <storeId>${process.env.SYRVE_STORE_ID}</storeId>
  <comment>Physical wine inventory - Session ${sessionId}</comment>
  <items>${xmlItems}
  </items>
</document>`;
  }

  private async validateInventory(xml: string): Promise<any> {
    const response = await this.auth.makeRequest('/documents/check/incomingInventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml
    });

    const xmlText = await response.text();
    const parser = new XMLParser();
    return parser.parse(xmlText).incomingInventoryValidationResult;
  }

  private async submitInventory(xml: string): Promise<any> {
    const response = await this.auth.makeRequest('/documents/import/incomingInventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml
    });

    const xmlText = await response.text();
    const parser = new XMLParser();
    return parser.parse(xmlText).incomingInventoryValidationResult;
  }

  private async processInventoryResponse(sessionId: string, result: any): Promise<void> {
    // Store document reference
    await this.db.query(`
      INSERT INTO syrve_inventory_documents 
      (document_number, session_id, status, store_id, document_date)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      result.documentNumber,
      sessionId,
      result.valid ? 'success' : 'failed',
      result.store.id,
      result.date
    ]);

    // Process each item's variance
    if (result.items && result.items.item) {
      const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
      
      for (const item of items) {
        // Find wine by Syrve product ID
        const mapping = await this.db.query(
          'SELECT wine_id FROM wine_syrve_product_mappings WHERE syrve_product_id = $1',
          [item.product.id]
        );

        if (mapping.rows.length > 0) {
          // Log the variance
          await this.db.query(`
            INSERT INTO inventory_movements 
            (wine_id, session_id, movement_type, quantity_before, quantity_change, quantity_after, 
             synced_to_syrve, performed_by, performed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          `, [
            mapping.rows[0].wine_id,
            sessionId,
            'syrve_inventory_adjustment',
            parseFloat(item.expectedAmount),
            parseFloat(item.differenceAmount),
            parseFloat(item.actualAmount),
            true,
            'system' // Or get from session
          ]);
        }
      }
    }
  }

  private async fuzzyMatchWineByName(productName: string): Promise<any> {
    // Implement fuzzy matching logic
    // This is a simplified example
    const wines = await this.db.query(
      `SELECT id, name, similarity(name, $1) as score 
       FROM wines 
       WHERE similarity(name, $1) > 0.6 
       ORDER BY score DESC 
       LIMIT 1`,
      [productName]
    );

    if (wines.rows.length > 0) {
      return {
        id: wines.rows[0].id,
        confidence: wines.rows[0].score
      };
    }

    return null;
  }
}

// Usage
const integration = new SyrveInventoryIntegration(
  'http://localhost:8080/resto/api',
  'admin',
  'your_password',
  db
);

await integration.performInventorySync('session-uuid-here');
```

---

<a name="data-models"></a>
## 7. Data Models & Schemas

### 7.1 Additional Database Tables for Server API

```sql
-- Store Syrve Server API configuration
CREATE TABLE syrve_server_config (
  id SERIAL PRIMARY KEY,
  
  -- Server details
  base_url VARCHAR(255) NOT NULL DEFAULT 'http://localhost:8080/resto/api',
  login VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL, -- Encrypted password (not SHA1)
  
  -- Store configuration
  store_id VARCHAR(255) NOT NULL,
  store_code VARCHAR(50),
  store_name VARCHAR(255),
  
  -- Accounts
  account_surplus_code VARCHAR(50) DEFAULT '5.10',
  account_shortage_code VARCHAR(50) DEFAULT '5.09',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_successful_auth TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Syrve inventory documents
CREATE TABLE syrve_inventory_documents (
  id SERIAL PRIMARY KEY,
  
  document_number VARCHAR(255) NOT NULL UNIQUE,
  session_id UUID REFERENCES inventory_sessions(id),
  
  status VARCHAR(50) NOT NULL, -- 'pending', 'submitted', 'success', 'failed'
  
  store_id VARCHAR(255) NOT NULL,
  document_date TIMESTAMPTZ,
  
  -- XML content
  request_xml TEXT,
  response_xml TEXT,
  
  -- Validation result
  is_valid BOOLEAN,
  has_warning BOOLEAN,
  error_message TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_syrve_inventory_docs_session ON syrve_inventory_documents(session_id);
CREATE INDEX idx_syrve_inventory_docs_number ON syrve_inventory_documents(document_number);
```

---

<a name="xml-templates"></a>
## 8. XML Templates

### 8.1 Minimal Inventory Document

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>MIN-001</documentNumber>
  <dateIncoming>2026-02-09T18:30:00</dateIncoming>
  <status>PROCESSED</status>
  <storeId>YOUR-STORE-UUID</storeId>
  <items>
    <item>
      <status>SAVE</status>
      <productId>WINE-PRODUCT-UUID</productId>
      <amountContainer>10</amountContainer>
    </item>
  </items>
</document>
```

### 8.2 Full Featured Inventory Document

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>FULL-001</documentNumber>
  <dateIncoming>2026-02-09T18:30:00</dateIncoming>
  <useDefaultDocumentTime>false</useDefaultDocumentTime>
  <status>PROCESSED</status>
  <accountSurplusCode>5.10</accountSurplusCode>
  <accountShortageCode>5.09</accountShortageCode>
  <storeId>YOUR-STORE-UUID</storeId>
  <conceptionId>CONCEPTION-UUID</conceptionId>
  <comment>Complete wine inventory with detailed tracking</comment>
  <items>
    <item>
      <status>SAVE</status>
      <recalculationNumber>0</recalculationNumber>
      <productId>WINE-UUID-1</productId>
      <productArticle>SKU-001</productArticle>
      <containerId>CONTAINER-UUID</containerId>
      <amountContainer>12.5</amountContainer>
      <amountGross>15.0</amountGross>
      <producerId>PRODUCER-UUID</producerId>
      <comment>Premium red wine - cellar section A</comment>
    </item>
  </items>
</document>
```

---

<a name="error-handling"></a>
## 9. Error Handling

### 9.1 Common Errors

| Error | HTTP Status | Description | Solution |
|-------|-------------|-------------|----------|
| Invalid credentials | 401 | Wrong login/password | Check credentials, regenerate SHA1 |
| License taken | 403 | API license already in use | Wait or logout from other session |
| Invalid token | 401 | Token expired or invalid | Re-authenticate |
| Invalid XML | 400 | Malformed XML document | Validate XML structure |
| Product not found | 404 | Product ID doesn't exist | Refresh product list |
| Store not found | 404 | Invalid store ID | Check store configuration |
| Duplicate document | 409 | Document number already exists | Generate new unique number |

### 9.2 XML Validation Errors

**Example Error Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<incomingInventoryValidationResult>
  <valid>false</valid>
  <warning>false</warning>
  <documentNumber>INV-001</documentNumber>
  <errorMessage>Product with ID 'invalid-uuid' not found</errorMessage>
  <additionalInfo>Check product IDs in your inventory document</additionalInfo>
</incomingInventoryValidationResult>
```

### 9.3 Error Handling Implementation

```typescript
async function handleSyrveError(error: any, operation: string): Promise<void> {
  const errorLog = {
    timestamp: new Date(),
    operation,
    errorType: error.name || 'Unknown',
    errorMessage: error.message,
    httpStatus: error.response?.status,
    responseBody: error.response?.data
  };

  // Log to database
  await db.query(`
    INSERT INTO error_logs 
    (error_type, error_message, http_status, occurred_at, metadata)
    VALUES ($1, $2, $3, NOW(), $4)
  `, [
    errorLog.errorType,
    errorLog.errorMessage,
    errorLog.httpStatus,
    JSON.stringify(errorLog)
  ]);

  // Handle specific errors
  if (error.response?.status === 401) {
    console.log('Authentication failed - re-authenticating...');
    // Re-authenticate
  } else if (error.response?.status === 403) {
    console.log('License taken - waiting...');
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 5000));
  } else if (error.response?.status === 409) {
    console.log('Duplicate document - generating new number...');
    // Generate new document number
  }
}
```

---

## 10. Summary & Next Steps

### Key Takeaways

1. **Server API is XML-based** - All requests/responses use XML format
2. **Authentication is SHA1-based** - Convert password to SHA1 hash
3. **License management** - Always logout to release license
4. **Inventory documents** - Use incoming inventory documents for stock updates
5. **Validation first** - Always validate before submitting

### Implementation Checklist

- [ ] Set up Syrve Server API access (get credentials)
- [ ] Implement SHA1 authentication
- [ ] Test product retrieval
- [ ] Map Syrve products to wines
- [ ] Build XML document generation
- [ ] Implement validation endpoint
- [ ] Test complete inventory flow
- [ ] Add error handling and logging
- [ ] Set up automatic logout
- [ ] Monitor license usage

---

**END OF DOCUMENT**
