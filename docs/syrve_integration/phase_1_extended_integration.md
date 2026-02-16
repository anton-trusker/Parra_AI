# **Phase 1.1: Syrve Initial Integration \- Complete Solution Document**

**Version:** 1.0  
**Date:** February 14, 2026  
**Author:** Technical Architecture Team  
**Status:** Production Ready

---

## **Document Overview**

## **Purpose**

This document provides a **complete, production-ready specification** for Phase 1.1: Initial Integration with Syrve Server API. It covers every API endpoint, data structure, import sequence, error handling, and database schema required to build a robust foundation for inventory management.

## **Scope**

* ✅ Complete Syrve Server API integration  
* ✅ All data import workflows (organization, catalog, stock, accounting)  
* ✅ Database schema with all relationships  
* ✅ Error handling and retry logic  
* ✅ Multi-tenant security  
* ✅ Performance optimization  
* ✅ Testing strategy

## **Out of Scope (Future Phases)**

* Inventory counting workflows (Phase 1.2)  
* Document submission to Syrve (Phase 1.3)  
* AI/ML features (Phase 2.x)  
* Advanced analytics (Phase 3.x)

---

## **Table of Contents**

1. Executive Summary  
2. Syrve Server API Complete Reference  
3. Complete Data Model  
4. Database Schema (Full)  
5. Import Workflow (Step-by-Step)  
6. API Integration Implementation  
7. Data Processing Logic  
8. Error Handling & Resilience  
9. Security & Multi-Tenancy  
10. Performance Optimization  
11. Testing Strategy  
12. Deployment Guide  
13. Appendix: Complete API Mappings

---

## **1\. Executive Summary**

## **1.1 What Phase 1.1 Achieves**

Phase 1.1 establishes the **complete data foundation** by importing all necessary data from Syrve Server API:

| Data Category | What Gets Imported | API Endpoint(s) | Critical for Inventory? |
| ----- | ----- | ----- | ----- |
| **Authentication** | Session token | `/auth` | ✅ **CRITICAL** \- Required for all calls |
| **Organization** | Departments, stores, groups, terminals | `/corporation/*` | ✅ Yes \- Business structure |
| **Measurement Units** | All units, conversions | `/units/list`, extracted from products | ✅ **CRITICAL** \- Unit conversions |
| **Catalog Structure** | Categories (hierarchical) | `/v2/entities/products/group/list` | ✅ Yes \- Product organization |
| **Products** | All product types with full details | `/v2/entities/products/list` | ✅ **CRITICAL** \- What to count |
| **Modifiers** | Modifier groups and relationships | Embedded in products | ⚠️ Optional \- Menu context |
| **Pricing** | Prices by store/schedule | `/v2/price`, `/nomenclature/priceCategories` | ⚠️ Optional \- Valuation |
| **Stock** | Current inventory levels | `/v2/entities/products/stock-and-sales` | ✅ **CRITICAL** \- Baseline |
| **Accounting** | Tax categories, accounting categories | `/v2/entities/taxCategories/list`, `/accountingCategories/list` | ✅ Yes \- Document creation |
| **Suppliers** | Counteragent list | `/v2/entities/counteragents/list` | ⚠️ Optional \- Receiving |
| **Employees** | User list | `/v2/entities/employees/list` | ⚠️ Optional \- Audit trail |

## **1.2 Key Capabilities After Phase 1.1**

✅ **Complete data mirror** \- All Syrve data stored locally  
✅ **Fast queries** \- Optimized database with indexes  
✅ **Hierarchical navigation** \- Categories, departments with depth tracking  
✅ **Unit conversion** \- Automatic conversion between units  
✅ **Multi-warehouse support** \- Separate stock per location  
✅ **Incremental sync** \- Delta updates without full reload  
✅ **Audit trail** \- Complete sync history with raw payloads  
✅ **Error resilience** \- Retry logic and graceful degradation

## **1.3 Architecture Overview**

text  
`┌─────────────────────────────────────────────────────────────┐`  
`│                     YOUR PLATFORM                           │`  
`│  ┌────────────────────────────────────────────────────┐    │`  
`│  │              PRESENTATION LAYER                     │    │`  
`│  │  • Admin Dashboard  • Product Browser              │    │`  
`│  │  • Sync Management  • Stock Viewer                 │    │`  
`│  └────────────────────────────────────────────────────┘    │`  
`│                          ↓                                   │`  
`│  ┌────────────────────────────────────────────────────┐    │`  
`│  │           APPLICATION / BUSINESS LOGIC              │    │`  
`│  │  • Import Orchestrator  • Data Processors          │    │`  
`│  │  • Sync Scheduler       • Error Handler            │    │`  
`│  └────────────────────────────────────────────────────┘    │`  
`│                          ↓                                   │`  
`│  ┌────────────────────────────────────────────────────┐    │`  
`│  │            SYRVE INTEGRATION LAYER                  │    │`  
`│  │  • Auth Manager      • API Client                  │    │`  
`│  │  • XML Parser        • Rate Limiter                │    │`  
`│  │  • Response Cache    • Connection Pool             │    │`  
`│  └────────────────────────────────────────────────────┘    │`  
`│                          ↓                                   │`  
`│  ┌────────────────────────────────────────────────────┐    │`  
`│  │               DATABASE LAYER                        │    │`  
`│  │  Layer 1: Raw Payloads (Audit)                     │    │`  
`│  │  Layer 2: Canonical Model (Normalized)             │    │`  
`│  │  Layer 3: Aggregates (Performance)                 │    │`  
`│  └────────────────────────────────────────────────────┘    │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↕`  
                   `HTTP/HTTPS (REST)`  
                          `↕`  
`┌─────────────────────────────────────────────────────────────┐`  
`│                  SYRVE SERVER API                           │`  
`│  • Authentication       • Corporation Data                  │`  
`│  • Product Catalog      • Stock Reports                     │`  
`│  • Pricing              • Accounting Data                   │`  
`└─────────────────────────────────────────────────────────────┘`

---

## **2\. Syrve Server API Complete Reference**

## **2.1 Authentication & Session Management**

## **2.1.1 Login (Get Token)**

text  
`GET /resto/api/auth?login={login}&pass={sha1_hash}`

**Parameters:**

* `login` \- API user login  
* `pass` \- SHA1 hash of password (lowercase hex)

**Response:**

xml  
`<string xmlns="http://schemas.microsoft.com/2003/10/Serialization/">`  
  `550e8400-e29b-41d4-a716-446655440000`  
`</string>`

**Response Type:** Plain text token (UUID format)

**Usage:**

typescript  
*`// SHA1 hash generation`*  
`import crypto from 'crypto';`  
`const passwordHash = crypto.createHash('sha1')`  
  `.update(password)`  
  `.digest('hex')`  
  `.toLowerCase();`

*`// API call`*  
`const response = await fetch(`  
  `` `${baseUrl}/auth?login=${login}&pass=${passwordHash}` ``  
`);`  
`const token = await response.text();`

**Error Handling:**

* 401 Unauthorized \- Invalid credentials  
* 423 Locked \- License limit reached (wait for other sessions to logout)

## **2.1.2 Logout (Release License)**

text  
`GET /resto/api/logout?key={token}`

**Critical:** ALWAYS logout after operations to release license seat.

**Best Practice:**

typescript  
`let token: string | null = null;`  
`try {`  
  `token = await authenticate();`  
  `await performOperations(token);`  
`} finally {`  
  `if (token) {`  
    `await logout(token);`  
  `}`  
`}`

## **2.2 Corporation / Organization Structure**

## **2.2.1 Departments (Hierarchy)**

text  
`GET /resto/api/corporation/departments?key={token}`

**Response Structure:**

xml  
`<corporateItemDtoes>`  
  `<corporateItemDto>`  
    `<id>uuid</id>`  
    `<parentId>uuid</parentId>`  
    `<code>string</code>`  
    `<name>string</name>`  
    `<type>CORPORATION|JURPERSON|DEPARTMENT|STORE|...</type>`  
    `<additionalInfo>string</additionalInfo>`  
    `<deleted>boolean</deleted>`  
  `</corporateItemDto>`  
  `...`  
`</corporateItemDtoes>`

**Import Priority:** 🔴 HIGH \- Required for organizational context

**What to Extract:**

* Complete hierarchy (parent-child relationships)  
* Department types  
* Active/deleted status  
* Organizational tree for filtering and access control

## **2.2.2 Stores (Warehouses)**

text  
`GET /resto/api/corporation/stores?key={token}`

**Response Structure:**

xml  
`<corporateItemDtoes>`  
  `<corporateItemDto>`  
    `<id>uuid</id>`  
    `<code>string</code>`  
    `<name>string</name>`  
    `<type>DEFAULT|EXTERNAL|PRODUCTION</type>`  
    `<address>string</address>`  
    `<deleted>boolean</deleted>`  
  `</corporateItemDto>`  
  `...`  
`</corporateItemDtoes>`

**Import Priority:** 🔴 CRITICAL \- Required for inventory (stock is store-specific)

**What to Extract:**

* Store UUID (used in all stock queries)  
* Store type (affects inventory rules)  
* Store name and location  
* Create warehouse records

## **2.2.3 Groups (Branch/Section Groups)**

text  
`GET /resto/api/corporation/groups?key={token}`

**Response Structure:**

xml  
`<groupDto>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<code>string</code>`  
  `<departmentId>uuid</departmentId>`  
  `<pointsOfSale>`  
    `<pointOfSaleDto>`  
      `<id>uuid</id>`  
      `<name>string</name>`  
      `<address>string</address>`  
    `</pointOfSaleDto>`  
  `</pointsOfSale>`  
  `<restaurantSectionInfos>`  
    `<restaurantSectionInfo>`  
      `<id>uuid</id>`  
      `<name>string</name>`  
      `<terminalGroups>`  
        `<terminalGroupDto>`  
          `<id>uuid</id>`  
          `<name>string</name>`  
        `</terminalGroupDto>`  
      `</terminalGroups>`  
    `</restaurantSectionInfo>`  
  `</restaurantSectionInfos>`  
`</groupDto>`

**Import Priority:** 🟡 MEDIUM \- Optional for zone tracking

**What to Extract:**

* Branch groups  
* Points of sale (physical locations)  
* Restaurant sections (Bar, Kitchen, Terrace) \- can map to storage areas  
* Terminal groups

## **2.2.4 Terminals (POS Devices)**

text  
`GET /resto/api/corporation/terminals?key={token}`

**Response Structure:**

xml  
`<terminalDto>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<departmentId>uuid</departmentId>`  
`</terminalDto>`

**Import Priority:** 🟢 LOW \- Audit only

## **2.3 Measurement Units**

## **2.3.1 Units List**

text  
`GET /resto/api/units/list?key={token}`

**Response Structure:**

xml  
`<units>`  
  `<unit>`  
    `<id>uuid</id>`  
    `<name>string</name>`  
    `<code>string</code>`  
    `<comment>string</comment>`  
    `<deleted>boolean</deleted>`  
  `</unit>`  
  `...`  
`</units>`

**Import Priority:** 🔴 CRITICAL \- Required for unit conversions

**What to Extract:**

* Unit UUID, name, code  
* All units (volume, weight, count)  
* Build conversion table

**Note:** If endpoint not available, extract from products `mainUnit` field.

## **2.3.2 Extract Units from Products (Fallback)**

If `/units/list` is not available, parse from products:

xml  
`<product>`  
  `<mainUnit>`  
    `<id>uuid</id>`  
    `<name>string</name>`  
    `<code>string</code>`  
  `</mainUnit>`  
`</product>`

## **2.4 Catalog / Products**

## **2.4.1 Product Groups (Categories)**

text  
`GET /resto/api/v2/entities/products/group/list?key={token}&includeDeleted={bool}`

**Response Structure:**

xml  
`<productGroupDtoes>`  
  `<productGroupDto>`  
    `<id>uuid</id>`  
    `<name>string</name>`  
    `<code>string</code>`  
    `<parentGroup>uuid</parentGroup>`  
    `<productGroupType>PRODUCTS|MODIFIERS</productGroupType>`  
    `<images>`  
      `<image>`  
        `<imageId>uuid</imageId>`  
        `<imageUrl>string</imageUrl>`  
      `</image>`  
    `</images>`  
    `<taxCategory>uuid</taxCategory>`  
    `<accountingCategory>uuid</accountingCategory>`  
    `<seoDescription>string</seoDescription>`  
    `<seoKeywords>string</seoKeywords>`  
    `<seoText>string</seoText>`  
    `<seoTitle>string</seoTitle>`  
    `<additionalInfo>string</additionalInfo>`  
    `<deleted>boolean</deleted>`  
  `</productGroupDto>`  
  `...`  
`</productGroupDtoes>`

**Import Priority:** 🔴 CRITICAL \- Required for catalog organization

**What to Extract:**

* Group hierarchy (unlimited depth via parentGroup)  
* Group types (PRODUCTS vs MODIFIERS)  
* Tax and accounting category links  
* Images  
* SEO metadata (for future e-commerce)

## **2.4.2 Products List (Complete)**

text  
`GET /resto/api/v2/entities/products/list?key={token}&includeDeleted={bool}`

**Response Structure (Detailed):**

xml  
`<productDto>`  
  `<!-- CORE IDENTIFIERS -->`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<num>string</num>              <!-- SKU -->`  
  `<code>string</code>             <!-- Quick dial code -->`  
  `<description>string</description>`  
    
  `<!-- CLASSIFICATION -->`  
  `<type>GOODS|DISH|PREPARED|SERVICE|MODIFIER|OUTER|PETROL|RATE</type>`  
  `<parent>uuid</parent>           <!-- Category/group UUID -->`  
  `<productGroupType>PRODUCTS|MODIFIERS</productGroupType>`  
    
  `<!-- MEASUREMENT -->`  
  `<mainUnit>`  
    `<id>uuid</id>`  
    `<name>string</name>`  
    `<code>string</code>`  
  `</mainUnit>`  
  `<unitCapacity>decimal</unitCapacity>  <!-- Product capacity in main unit -->`  
  `<unitWeight>decimal</unitWeight>`  
    
  `<!-- PRICING -->`  
  `<defaultSalePrice>decimal</defaultSalePrice>`  
    
  `<!-- INVENTORY BEHAVIOR -->`  
  `<notInStoreMovement>boolean</notInStoreMovement>`  
    
  `<!-- COOKING (for DISH type) -->`  
  `<cookingPlaceType>string</cookingPlaceType>`  
    
  `<!-- VISUAL -->`  
  `<color>`  
    `<red>int</red>`  
    `<green>int</green>`  
    `<blue>int</blue>`  
  `</color>`  
  `<fontColor>...</fontColor>`  
  `<frontImageId>uuid</frontImageId>`  
  `<position>int</position>`  
    
  `<!-- TAX & ACCOUNTING -->`  
  `<taxCategory>uuid</taxCategory>`  
  `<accountingCategory>uuid</accountingCategory>`  
    
  `<!-- MODIFIERS -->`  
  `<modifiers>`  
    `<modifier>`  
      `<modifier>uuid</modifier>          <!-- Product/group UUID -->`  
      `<modifierGroupId>uuid</modifierGroupId>`  
      `<modifierSchemaId>uuid</modifierSchemaId>`  
      `<defaultAmount>int</defaultAmount>`  
      `<freeOfChargeAmount>int</freeOfChargeAmount>`  
      `<minimumAmount>int</minimumAmount>`  
      `<maximumAmount>int</maximumAmount>`  
      `<hideIfDefaultAmount>boolean</hideIfDefaultAmount>`  
      `<required>boolean</required>`  
      `<childModifiers>...</childModifiers>`  
      `<childModifiersHaveMinMaxRestrictions>boolean</childModifiersHaveMinMaxRestrictions>`  
      `<splittable>boolean</splittable>`  
    `</modifier>`  
  `</modifiers>`  
    
  `<!-- BARCODES -->`  
  `<barcodes>`  
    `<barcode>string</barcode>`  
    `...`  
  `</barcodes>`  
    
  `<!-- CONTAINERS (PACKAGING) -->`  
  `<containers>`  
    `<container>`  
      `<id>uuid</id>`  
      `<name>string</name>`  
      `<code>string</code>`  
      `<count>decimal</count>`  
      `<containerWeight>decimal</containerWeight>`  
      `<minContainerWeight>decimal</minContainerWeight>`  
      `<maxContainerWeight>decimal</maxContainerWeight>`  
      `<fullContainerWeight>decimal</fullContainerWeight>`  
      `<density>decimal</density>`  
      `<backwardRecalculation>boolean</backwardRecalculation>`  
      `<useInFront>boolean</useInFront>`  
    `</container>`  
  `</containers>`  
    
  `<!-- SIZES (VARIANTS) -->`  
  `<sizes>`  
    `<size>`  
      `<id>uuid</id>`  
      `<name>string</name>`  
      `<priority>int</priority>`  
      `<prices>...</prices>`  
    `</size>`  
  `</sizes>`  
    
  `<!-- EXCLUDED SECTIONS -->`  
  `<excludedSections>`  
    `<section>uuid</section>`  
    `...`  
  `</excludedSections>`  
    
  `<!-- STATUS -->`  
  `<deleted>boolean</deleted>`  
  `<defaultIncludedInMenu>boolean</defaultIncludedInMenu>`  
    
  `<!-- COMPOSITION (Recipe/BOM) -->`  
  `<composition>`  
    `<item>`  
      `<product>uuid</product>`  
      `<count>decimal</count>`  
    `</item>`  
  `</composition>`  
`</productDto>`

**Import Priority:** 🔴 CRITICAL \- Core catalog data

**What to Extract:**

* All core fields (identifiers, names, descriptions)  
* Product type (determines if countable for inventory)  
* Measurement units and capacity  
* Complete modifier tree  
* All barcodes  
* All containers (for conversion)  
* Sizes (variants)  
* Tax/accounting links  
* Complete raw XML in `syrve_data` JSONB

## **2.4.3 Products by Type (Filtered)**

To reduce payload size, filter by type:

text  
`GET /resto/api/v2/entities/products/list?key={token}&types=GOODS`  
`GET /resto/api/v2/entities/products/list?key={token}&types=GOODS,DISH`

**Best Practice:** Import GOODS first (critical for inventory), then others.

## **2.5 Stock / Inventory Data**

## **2.5.1 Stock and Sales Report**

text  
`GET /resto/api/v2/entities/products/stock-and-sales?key={token}&storeIds={uuid}&productIds={uuids}`

**Parameters:**

* `storeIds` \- Single store UUID  
* `productIds` \- Comma-separated product UUIDs (max \~500 recommended)

**Response Structure:**

xml  
`<productStockInStoreDto>`  
  `<productId>uuid</productId>`  
  `<storeId>uuid</storeId>`  
  `<amount>decimal</amount>          <!-- Current stock in product's main unit -->`  
  `<amountUnit>`  
    `<id>uuid</id>`  
    `<name>string</name>`  
  `</amountUnit>`  
`</productStockInStoreDto>`

**Import Priority:** 🔴 CRITICAL \- Required for inventory baseline

**What to Extract:**

* Current stock level per product per store  
* Stock unit (should match product's main unit)  
* Store as current stock snapshot

**Batching Strategy:**

typescript  
*`// Split products into batches of 500`*  
`const batches = chunk(allProductIds, 500);`  
`for (const batch of batches) {`  
  `const stockData = await fetchStock(storeId, batch.join(','));`  
  `await processStock(stockData);`  
  `await sleep(100); // Rate limiting`  
`}`

## **2.5.2 Balance Report (Alternative)**

text  
`POST /resto/api/v2/reports/balance?key={token}`

**Request Body:**

xml  
`<balanceRequest>`  
  `<storeId>uuid</storeId>`  
  `<dateFrom>2026-02-01</dateFrom>`  
  `<dateTo>2026-02-14</dateTo>`  
`</balanceRequest>`

**Response:** Detailed balance report with opening/closing stock, movements

**Import Priority:** 🟡 MEDIUM \- For historical analysis

## **2.6 Pricing**

## **2.6.1 Price Categories**

text  
`GET /resto/api/nomenclature/priceCategories?key={token}`

**Response Structure:**

xml  
`<priceCategory>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<description>string</description>`  
`</priceCategory>`

**Import Priority:** 🟡 MEDIUM \- For valuation

## **2.6.2 Product Prices**

text  
`GET /resto/api/v2/price?key={token}&priceCategoryId={uuid}&organizationIds={uuid}`

**Parameters:**

* `priceCategoryId` \- Price category UUID (optional)  
* `organizationIds` \- Department/store UUID

**Response Structure:**

xml  
`<productPriceDto>`  
  `<productId>uuid</productId>`  
  `<price>decimal</price>`  
  `<priceCategory>uuid</priceCategory>`  
`</productPriceDto>`

**Import Priority:** 🟡 MEDIUM \- Optional for inventory (useful for valuation)

## **2.7 Accounting Data**

## **2.7.1 Tax Categories**

text  
`GET /resto/api/v2/entities/taxCategories/list?key={token}`

**Response Structure:**

xml  
`<taxCategoryDto>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<percent>decimal</percent>`  
  `<isDeleted>boolean</isDeleted>`  
`</taxCategoryDto>`

**Import Priority:** 🟡 MEDIUM \- Required for document creation

## **2.7.2 Accounting Categories**

text  
`GET /resto/api/accountingCategories/list?key={token}`

**Response Structure:**

xml  
`<accountingCategory>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<code>string</code>`  
`</accountingCategory>`

**Import Priority:** 🟡 MEDIUM \- For financial integration

## **2.8 Counteragents (Suppliers)**

## **2.8.1 Counteragents List**

text  
`GET /resto/api/v2/entities/counteragents/list?key={token}&includeDeleted={bool}`

**Response Structure:**

xml  
`<counteragentDto>`  
  `<id>uuid</id>`  
  `<name>string</name>`  
  `<comment>string</comment>`  
  `<legalName>string</legalName>`  
  `<inn>string</inn>`  
  `<kpp>string</kpp>`  
  `<addresses>`  
    `<address>`  
      `<city>string</city>`  
      `<street>string</street>`  
      `<index>string</index>`  
    `</address>`  
  `</addresses>`  
  `<phone>string</phone>`  
  `<email>string</email>`  
  `<isSupplier>boolean</isSupplier>`  
  `<isClient>boolean</isClient>`  
  `<deleted>boolean</deleted>`  
`</counteragentDto>`

**Import Priority:** 🟢 LOW \- Future receiving module

## **2.9 Employees (Users)**

## **2.9.1 Employees List**

text  
`GET /resto/api/v2/entities/employees/list?key={token}&includeDeleted={bool}`

**Response Structure:**

xml  
`<employeeDto>`  
  `<id>uuid</id>`  
  `<firstName>string</firstName>`  
  `<middleName>string</middleName>`  
  `<lastName>string</lastName>`  
  `<displayName>string</displayName>`  
  `<phone>string</phone>`  
  `<email>string</email>`  
  `<code>string</code>`  
  `<deleted>boolean</deleted>`  
`</employeeDto>`

**Import Priority:** 🟢 LOW \- For audit trail mapping

## **2.10 Additional Endpoints (Research Complete)**

## **2.10.1 Conception List (Document Templates)**

text  
`GET /resto/api/corporation/conceptions?key={token}`

**What it provides:** Document type templates for inventory documents

**Import Priority:** 🟡 MEDIUM \- Useful for document creation

## **2.10.2 Removal Types (Waste/Spoilage Reasons)**

text  
`GET /resto/api/v2/entities/products/removalTypes?key={token}`

**What it provides:** Predefined reasons for stock removal (damaged, expired, theft, etc.)

**Import Priority:** 🟢 LOW \- Future waste tracking

## **2.10.3 Document Numbering Templates**

text  
`GET /resto/api/documents/numerators?key={token}`

**What it provides:** Document number generation templates

**Import Priority:** 🟢 LOW \- Auto-numbering

---

## **3\. Complete Data Model**

## **3.1 Entity Relationship Diagram (Conceptual)**

text  
`┌─────────────────────────────────────────────────────────────┐`  
`│                    BUSINESS PROFILE                         │`  
`│  (Multi-tenant root)                                        │`  
`└─────────────────────────────────────────────────────────────┘`  
         `│`  
         `├──────┬──────┬──────┬──────┬──────┬──────┬─────────┐`  
         `│      │      │      │      │      │      │         │`  
         `↓      ↓      ↓      ↓      ↓      ↓      ↓         ↓`  
    `┌─────┐ ┌─────┐ ┌──────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐`  
    `│ORG  │ │WARE │ │UNITS │ │CAT │ │PROD│ │STK │ │PRC │ │ACC │`  
    `│NODES│ │HOUSE│ │      │ │    │ │    │ │    │ │    │ │    │`  
    `└─────┘ └─────┘ └──────┘ └────┘ └────┘ └────┘ └────┘ └────┘`  
       `│       │        │        │      │      │      │      │`  
       `│       │        │        ↓      ↓      ↓      │      │`  
       `│       │        │    ┌──────────────────┐    │      │`  
       `│       │        └───→│   PRODUCTS       │←───┘      │`  
       `│       │             │  (all types)     │           │`  
       `│       │             └──────────────────┘           │`  
       `│       │                  │  │  │  │                │`  
       `│       │                  │  │  │  └────────┐       │`  
       `│       │                  │  │  │           ↓       │`  
       `│       │                  │  │  │     ┌─────────┐   │`  
       `│       │                  │  │  │     │MODIFIERS│   │`  
       `│       │                  │  │  │     └─────────┘   │`  
       `│       │                  │  │  │                   │`  
       `│       │                  │  │  └─────────┐         │`  
       `│       │                  │  │            ↓         │`  
       `│       │                  │  │      ┌─────────┐     │`  
       `│       │                  │  │      │BARCODES │     │`  
       `│       │                  │  │      └─────────┘     │`  
       `│       │                  │  │                      │`  
       `│       │                  │  └──────────┐           │`  
       `│       │                  │             ↓           │`  
       `│       │                  │       ┌──────────┐      │`  
       `│       │                  │       │CONTAINERS│      │`  
       `│       │                  │       └──────────┘      │`  
       `│       │                  │                         │`  
       `│       └──────────────────┴─────────────────────────┘`  
       `│                          │`  
       `└──────────────────────────┘`

## **3.2 Data Relationships Matrix**

| Parent Entity | Child Entity | Relationship Type | Cardinality | Critical Path |
| ----- | ----- | ----- | ----- | ----- |
| business\_profile | org\_nodes | 1:Many | 1 business → N nodes | ✅ Yes |
| org\_nodes | org\_nodes | Self-referential | Parent → Children | ✅ Yes |
| business\_profile | warehouses | 1:Many | 1 business → N warehouses | ✅ Yes |
| warehouses | storage\_areas | 1:Many | 1 warehouse → N areas | ⚠️ Optional |
| business\_profile | measurement\_units | 1:Many | 1 business → N units | ✅ Yes |
| measurement\_units | measurement\_units | Self-ref (base) | Derived → Base | ✅ Yes |
| business\_profile | categories | 1:Many | 1 business → N categories | ✅ Yes |
| categories | categories | Self-referential | Parent → Children | ✅ Yes |
| categories | products | 1:Many | 1 category → N products | ✅ Yes |
| products | products | Self-ref (parent) | Recipe/BOM | ⚠️ Optional |
| products | product\_modifiers | 1:Many | 1 product → N modifiers | ⚠️ Optional |
| products | product\_barcodes | 1:Many | 1 product → N barcodes | ✅ Yes |
| products | product\_containers | 1:Many | 1 product → N containers | ✅ Yes |
| products | stock\_levels | 1:Many | 1 product → N stocks (per warehouse) | ✅ Yes |
| warehouses | stock\_levels | 1:Many | 1 warehouse → N stock items | ✅ Yes |
| measurement\_units | stock\_levels | 1:Many | 1 unit → N stock records | ✅ Yes |

---

## **4\. Database Schema (Full)**

## **4.1 Schema Organization**

sql  
*`-- =====================================================`*  
*`-- SCHEMA OVERVIEW`*  
*`-- =====================================================`*  
*`-- This schema is organized into logical groups:`*  
*`-- 1. Tenant & Auth (business_profile, profiles, user_roles)`*  
*`-- 2. Syrve Integration (syrve_config, syrve_raw_payloads, syrve_sync_runs)`*  
*`-- 3. Organization (org_nodes, warehouses, storage_areas, stores, terminals)`*  
*`-- 4. Measurement (measurement_units)`*  
*`-- 5. Catalog (categories, products, product_*)`*  
*`-- 6. Stock (stock_levels, stock_history)`*  
*`-- 7. Pricing (price_categories, product_prices)`*  
*`-- 8. Accounting (tax_categories, accounting_categories)`*  
*`-- 9. Counteragents (counteragents, counteragent_addresses)`*  
*`-- 10. Employees (employees)`*

*`-- Dependencies are handled via foreign keys`*  
*`-- All tables include business_id for multi-tenancy`*  
*`-- RLS (Row Level Security) enforces data isolation`*

## **4.2 Extensions & Enums**

sql  
*`-- =====================================================`*  
*`-- EXTENSIONS`*  
*`-- =====================================================`*  
`CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- For UUID generation`  
`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- For UUID functions`  
`CREATE EXTENSION IF NOT EXISTS "btree_gin";   -- For GIN indexes on multiple columns`

*`-- =====================================================`*  
*`-- ENUMS (All Type Definitions)`*  
*`-- =====================================================`*

*`-- User roles`*  
`CREATE TYPE app_role AS ENUM (`  
  `'owner',      -- Full system access`  
  `'admin',      -- Business administration`  
  `'manager',    -- Operational management`  
  `'staff',      -- Data entry`  
  `'viewer'      -- Read-only`  
`);`

*`-- Organization node types`*  
`CREATE TYPE org_node_type AS ENUM (`  
  `'CORPORATION',`  
  `'JURPERSON',`  
  `'DEPARTMENT',`  
  `'STORE',`  
  `'SECTION',`  
  `'OTHER'`  
`);`

*`-- Warehouse types`*  
`CREATE TYPE warehouse_type AS ENUM (`  
  `'MAIN',`  
  `'STORE',`  
  `'PRODUCTION',`  
  `'EXTERNAL',`  
  `'VIRTUAL'`  
`);`

*`-- Storage area types`*  
`CREATE TYPE storage_area_type AS ENUM (`  
  `'BAR',`  
  `'CELLAR',`  
  `'KITCHEN',`  
  `'DRY_STORAGE',`  
  `'COLD_STORAGE',`  
  `'FREEZER',`  
  `'DISPLAY',`  
  `'RECEIVING',`  
  `'STAGING',`  
  `'OTHER'`  
`);`

*`-- Measurement unit types`*  
`CREATE TYPE unit_type AS ENUM (`  
  `'VOLUME',`  
  `'WEIGHT',`  
  `'COUNT',`  
  `'LENGTH',`  
  `'AREA',`  
  `'TIME',`  
  `'OTHER'`  
`);`

*`-- Product types`*  
`CREATE TYPE product_type AS ENUM (`  
  `'GOODS',`  
  `'DISH',`  
  `'PREPARED',`  
  `'SERVICE',`  
  `'MODIFIER',`  
  `'OUTER',`  
  `'PETROL',`  
  `'RATE'`  
`);`

*`-- Product group types`*  
`CREATE TYPE product_group_type AS ENUM (`  
  `'PRODUCTS',`  
  `'MODIFIERS'`  
`);`

*`-- Barcode sources`*  
`CREATE TYPE barcode_source AS ENUM (`  
  `'syrve',`  
  `'manual',`  
  `'ai',`  
  `'import'`  
`);`

*`-- Sync status`*  
`CREATE TYPE sync_status AS ENUM (`  
  `'running',`  
  `'success',`  
  `'partial',`  
  `'failed',`  
  `'cancelled'`  
`);`

## **4.3 Tenant & Authentication**

sql  
*`-- =====================================================`*  
*`-- TENANT ROOT`*  
*`-- =====================================================`*  
`CREATE TABLE business_profile (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    
  `-- Business details`  
  `name TEXT NOT NULL,`  
  `legal_name TEXT,`  
  `tax_id TEXT,                          -- VAT/Tax ID`  
    
  `-- Contact`  
  `email TEXT,`  
  `phone TEXT,`  
  `website TEXT,`  
    
  `-- Location`  
  `country TEXT DEFAULT 'PT',`  
  `city TEXT,`  
  `address TEXT,`  
  `postal_code TEXT,`  
    
  `-- Localization`  
  `currency TEXT DEFAULT 'EUR',`  
  `language TEXT DEFAULT 'en',`  
  `timezone TEXT DEFAULT 'Europe/Lisbon',`  
  `date_format TEXT DEFAULT 'DD/MM/YYYY',`  
  `time_format TEXT DEFAULT 'HH:mm',`  
    
  `-- Business settings`  
  `fiscal_year_start TEXT DEFAULT '01-01', -- MM-DD format`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_trial BOOLEAN DEFAULT false,`  
  `trial_ends_at TIMESTAMPTZ,`  
  `subscription_tier TEXT DEFAULT 'standard',`  
    
  `-- Flexible settings`  
  `settings JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Constraints`  
  `CONSTRAINT business_profile_name_length CHECK (length(name) >= 2),`  
  `CONSTRAINT business_profile_currency_code CHECK (length(currency) = 3)`  
`);`

`CREATE INDEX idx_business_profile_active ON business_profile(is_active);`  
`CREATE INDEX idx_business_profile_trial ON business_profile(is_trial, trial_ends_at);`

*`-- =====================================================`*  
*`-- USER PROFILES`*  
*`-- =====================================================`*  
`CREATE TABLE profiles (`  
  `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,`  
  `business_id UUID REFERENCES business_profile(id) ON DELETE SET NULL,`  
    
  `-- Personal info`  
  `full_name TEXT,`  
  `email TEXT,`  
  `phone TEXT,`  
  `avatar_url TEXT,`  
    
  `-- Preferences`  
  `language TEXT DEFAULT 'en',`  
  `timezone TEXT,`  
  `notification_preferences JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `last_login_at TIMESTAMPTZ,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE INDEX idx_profiles_business ON profiles(business_id);`  
`CREATE INDEX idx_profiles_email ON profiles(email);`  
`CREATE INDEX idx_profiles_active ON profiles(business_id, is_active);`

*`-- =====================================================`*  
*`-- USER ROLES`*  
*`-- =====================================================`*  
`CREATE TABLE user_roles (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,`  
  `role app_role NOT NULL,`  
    
  `-- Scope (optional: role can be scoped to specific warehouse/department)`  
  `warehouse_id UUID,                    -- If set, role only applies to this warehouse`  
  `department_id UUID,                   -- If set, role only applies to this department`  
    
  `-- Metadata`  
  `granted_by UUID REFERENCES profiles(id),`  
  `granted_at TIMESTAMPTZ DEFAULT NOW(),`  
  `expires_at TIMESTAMPTZ,               -- Optional: temporary role`  
    
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, user_id, role, COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'), COALESCE(department_id, '00000000-0000-0000-0000-000000000000'))`  
`);`

`CREATE INDEX idx_user_roles_lookup ON user_roles(business_id, user_id);`  
`CREATE INDEX idx_user_roles_warehouse ON user_roles(business_id, warehouse_id) WHERE warehouse_id IS NOT NULL;`

*`-- =====================================================`*  
*`-- HELPER FUNCTIONS`*  
*`-- =====================================================`*

*`-- Trigger: Auto-update updated_at`*  
`CREATE OR REPLACE FUNCTION set_updated_at()`  
`RETURNS TRIGGER AS $$`  
`BEGIN`  
  `NEW.updated_at = NOW();`  
  `RETURN NEW;`  
`END;`  
`$$ LANGUAGE plpgsql;`

*`-- Apply to all tables with updated_at`*  
`CREATE TRIGGER trg_business_profile_updated_at`  
  `BEFORE UPDATE ON business_profile`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

`CREATE TRIGGER trg_profiles_updated_at`  
  `BEFORE UPDATE ON profiles`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- Get current user's business`*  
`CREATE OR REPLACE FUNCTION current_business_id()`  
`RETURNS UUID LANGUAGE sql STABLE AS $$`  
  `SELECT business_id FROM profiles WHERE id = auth.uid()`  
`$$;`

*`-- Check if user has specific role`*  
`CREATE OR REPLACE FUNCTION has_role(required_role app_role)`  
`RETURNS BOOLEAN LANGUAGE sql STABLE AS $$`  
  `SELECT EXISTS (`  
    `SELECT 1 FROM user_roles`  
    `WHERE business_id = current_business_id()`  
      `AND user_id = auth.uid()`  
      `AND role = required_role`  
      `AND (expires_at IS NULL OR expires_at > NOW())`  
  `)`  
`$$;`

*`-- Check if user has any of the specified roles`*  
`CREATE OR REPLACE FUNCTION has_any_role(required_roles app_role[])`  
`RETURNS BOOLEAN LANGUAGE sql STABLE AS $$`  
  `SELECT EXISTS (`  
    `SELECT 1 FROM user_roles`  
    `WHERE business_id = current_business_id()`  
      `AND user_id = auth.uid()`  
      `AND role = ANY(required_roles)`  
      `AND (expires_at IS NULL OR expires_at > NOW())`  
  `)`  
`$$;`

*`-- Check if row belongs to user's business`*  
`CREATE OR REPLACE FUNCTION is_same_business(row_business_id UUID)`  
`RETURNS BOOLEAN LANGUAGE sql STABLE AS $$`  
  `SELECT row_business_id = current_business_id()`  
`$$;`

## **4.4 Syrve Integration Layer**

sql  
*`-- =====================================================`*  
*`-- SYRVE CONNECTION CONFIGURATION`*  
*`-- =====================================================`*  
`CREATE TABLE syrve_config (`  
  `business_id UUID PRIMARY KEY REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Connection details`  
  `server_url TEXT NOT NULL,             -- http://host:port/resto/api`  
  `api_login TEXT NOT NULL,`  
  `api_password_encrypted TEXT NOT NULL, -- Encrypted at rest`  
    
  `-- Connection status`  
  `connection_status TEXT DEFAULT 'disconnected',`  
  `last_test_at TIMESTAMPTZ,`  
  `last_test_result TEXT,`  
  `test_error TEXT,`  
    
  `-- Sync settings`  
  `auto_sync_enabled BOOLEAN DEFAULT false,`  
  `sync_frequency_hours INTEGER DEFAULT 24,`  
  `last_full_sync_at TIMESTAMPTZ,`  
  `last_incremental_sync_at TIMESTAMPTZ,`  
  `sync_lock_until TIMESTAMPTZ,          -- Prevent concurrent syncs`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
  `created_by UUID REFERENCES profiles(id)`  
`);`

`CREATE TRIGGER trg_syrve_config_updated_at`  
  `BEFORE UPDATE ON syrve_config`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- IMPORT CONFIGURATION`*  
*`-- =====================================================`*  
`CREATE TABLE syrve_import_config (`  
  `business_id UUID PRIMARY KEY REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Warehouse selection`  
  `selected_warehouse_ids UUID[] DEFAULT '{}'::uuid[],`  
  `import_all_warehouses BOOLEAN DEFAULT false,`  
    
  `-- Product type filters`  
  `import_goods BOOLEAN DEFAULT true,`  
  `import_dishes BOOLEAN DEFAULT false,`  
  `import_prepared BOOLEAN DEFAULT false,`  
  `import_services BOOLEAN DEFAULT false,`  
  `import_modifiers BOOLEAN DEFAULT true,`  
  `import_outer BOOLEAN DEFAULT false,`  
  `import_petrol BOOLEAN DEFAULT false,`  
  `import_rate BOOLEAN DEFAULT false,`  
    
  `-- Category filters`  
  `selected_category_ids UUID[],         -- If set, only import these categories`  
    
  `-- Additional data`  
  `import_stock BOOLEAN DEFAULT true,`  
  `import_prices BOOLEAN DEFAULT false,`  
  `import_accounting BOOLEAN DEFAULT true,`  
  `import_counteragents BOOLEAN DEFAULT false,`  
  `import_employees BOOLEAN DEFAULT false,`  
    
  `-- Sync behavior`  
  `include_deleted BOOLEAN DEFAULT false,`  
    
  `-- Metadata`  
  `configured_at TIMESTAMPTZ DEFAULT NOW(),`  
  `configured_by UUID REFERENCES profiles(id),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE TRIGGER trg_import_config_updated_at`  
  `BEFORE UPDATE ON syrve_import_config`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- RAW PAYLOADS (Audit Log)`*  
*`-- =====================================================`*  
`CREATE TABLE syrve_raw_payloads (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Request details`  
  `endpoint TEXT NOT NULL,`  
  `method TEXT DEFAULT 'GET',`  
  `request_params JSONB,`  
    
  `-- What was fetched`  
  `entity_type TEXT NOT NULL,            -- department|store|category|product|stock|etc.`  
  `syrve_id UUID,                        -- Entity's UUID (if single entity)`  
    
  `-- Response`  
  `http_status INTEGER,`  
  `response_payload JSONB NOT NULL,      -- Parsed XML → JSON`  
  `response_raw TEXT,                    -- Original XML`  
  `payload_hash TEXT,                    -- MD5 for deduplication`  
    
  `-- Status`  
  `is_error BOOLEAN DEFAULT false,`  
  `error_message TEXT,`  
    
  `-- Sync tracking`  
  `sync_run_id UUID,                     -- FK added after syrve_sync_runs exists`  
    
  `-- Timing`  
  `fetched_at TIMESTAMPTZ DEFAULT NOW(),`  
  `response_time_ms INTEGER,`  
    
  `-- Deduplication`  
  `UNIQUE(business_id, entity_type, COALESCE(syrve_id, '00000000-0000-0000-0000-000000000000'::uuid), payload_hash)`  
`);`

`CREATE INDEX idx_raw_payloads_business ON syrve_raw_payloads(business_id, entity_type);`  
`CREATE INDEX idx_raw_payloads_sync_run ON syrve_raw_payloads(business_id, sync_run_id);`  
`CREATE INDEX idx_raw_payloads_fetched ON syrve_raw_payloads(business_id, fetched_at DESC);`  
`CREATE INDEX idx_raw_payloads_error ON syrve_raw_payloads(business_id, is_error) WHERE is_error = true;`

*`-- =====================================================`*  
*`-- SYNC EXECUTION HISTORY`*  
*`-- =====================================================`*  
`CREATE TABLE syrve_sync_runs (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Run details`  
  `sync_type TEXT NOT NULL,              -- full|incremental|manual`  
  `scope TEXT NOT NULL,                  -- all|organizations|categories|products|stock|prices`  
    
  `-- Status`  
  `status sync_status DEFAULT 'running',`  
    
  `-- Counters`  
  `items_fetched INTEGER DEFAULT 0,`  
  `items_created INTEGER DEFAULT 0,`  
  `items_updated INTEGER DEFAULT 0,`  
  `items_deleted INTEGER DEFAULT 0,`  
  `items_skipped INTEGER DEFAULT 0,`  
  `items_failed INTEGER DEFAULT 0,`  
    
  `-- Error tracking`  
  `errors JSONB DEFAULT '[]'::jsonb,`  
  `warnings JSONB DEFAULT '[]'::jsonb,`  
    
  `-- Timing`  
  `started_at TIMESTAMPTZ DEFAULT NOW(),`  
  `finished_at TIMESTAMPTZ,`  
  `duration_seconds INTEGER,`  
    
  `-- Who initiated`  
  `initiated_by UUID REFERENCES profiles(id),`  
  `trigger_type TEXT,                    -- manual|scheduled|webhook`  
    
  `-- Results summary`  
  `summary JSONB DEFAULT '{}'::jsonb,`  
    
  `CONSTRAINT check_duration CHECK (finished_at IS NULL OR finished_at >= started_at)`  
`);`

`CREATE INDEX idx_sync_runs_business ON syrve_sync_runs(business_id, started_at DESC);`  
`CREATE INDEX idx_sync_runs_status ON syrve_sync_runs(business_id, status);`  
`CREATE INDEX idx_sync_runs_type ON syrve_sync_runs(business_id, sync_type, scope);`

*`-- Now add FK to raw_payloads`*  
`ALTER TABLE syrve_raw_payloads`  
  `ADD CONSTRAINT fk_raw_payloads_sync_run`  
  `FOREIGN KEY (sync_run_id) REFERENCES syrve_sync_runs(id) ON DELETE SET NULL;`

## **4.5 Organization Structure**

sql  
*`-- =====================================================`*  
*`-- ORGANIZATION NODES (Departments Hierarchy)`*  
*`-- =====================================================`*  
`CREATE TABLE org_nodes (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Hierarchy`  
  `parent_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
  `node_type org_node_type NOT NULL,`  
  `depth INTEGER DEFAULT 0,`  
  `path TEXT[],                          -- Array of ancestor IDs`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
  `additional_info TEXT,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_id)`  
`);`

`CREATE INDEX idx_org_nodes_parent ON org_nodes(business_id, parent_id);`  
`CREATE INDEX idx_org_nodes_type ON org_nodes(business_id, node_type);`  
`CREATE INDEX idx_org_nodes_active ON org_nodes(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_org_nodes_depth ON org_nodes(business_id, depth);`  
`CREATE INDEX idx_org_nodes_path ON org_nodes USING gin(path);`

`CREATE TRIGGER trg_org_nodes_updated_at`  
  `BEFORE UPDATE ON org_nodes`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- Trigger: Auto-compute hierarchy`*  
`CREATE OR REPLACE FUNCTION update_org_node_hierarchy()`  
`RETURNS TRIGGER AS $$`  
`DECLARE`  
  `parent_depth INTEGER;`  
  `parent_path TEXT[];`  
`BEGIN`  
  `IF NEW.parent_id IS NULL THEN`  
    `NEW.depth := 0;`  
    `NEW.path := ARRAY[NEW.id::TEXT];`  
  `ELSE`  
    `SELECT depth, path INTO parent_depth, parent_path`  
    `FROM org_nodes WHERE id = NEW.parent_id;`  
    `NEW.depth := parent_depth + 1;`  
    `NEW.path := parent_path || NEW.id::TEXT;`  
  `END IF;`  
  `RETURN NEW;`  
`END;`  
`$$ LANGUAGE plpgsql;`

`CREATE TRIGGER trg_org_node_hierarchy`  
  `BEFORE INSERT OR UPDATE OF parent_id ON org_nodes`  
  `FOR EACH ROW EXECUTE FUNCTION update_org_node_hierarchy();`

*`-- =====================================================`*  
*`-- STORES (Points of Sale / Locations)`*  
*`-- =====================================================`*  
`CREATE TABLE stores (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_store_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Organization link`  
  `org_node_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
    
  `-- Location`  
  `address TEXT,`  
  `city TEXT,`  
  `postal_code TEXT,`  
  `country TEXT,`  
  `coordinates JSONB,                    -- {lat, lon}`  
    
  `-- Store type`  
  `store_type TEXT,                      -- DEFAULT|EXTERNAL|PRODUCTION`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_store_id)`  
`);`

`CREATE INDEX idx_stores_business ON stores(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_stores_org_node ON stores(business_id, org_node_id);`

`CREATE TRIGGER trg_stores_updated_at`  
  `BEFORE UPDATE ON stores`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- WAREHOUSES (Storage Facilities)`*  
*`-- =====================================================`*  
`CREATE TABLE warehouses (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers (usually same as store)`  
  `syrve_store_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Links`  
  `store_id UUID REFERENCES stores(id) ON DELETE SET NULL,`  
  `org_node_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
  `warehouse_type warehouse_type DEFAULT 'MAIN',`  
    
  `-- Location`  
  `address TEXT,`  
  `city TEXT,`  
  `postal_code TEXT,`  
  `country TEXT,`  
  `coordinates JSONB,`  
    
  `-- Capacity`  
  `total_capacity_sqm NUMERIC(10,2),`  
    
  `-- Settings`  
  `allow_negative_stock BOOLEAN DEFAULT false,`  
  `require_approval_for_adjustments BOOLEAN DEFAULT true,`  
  `default_storage_days INTEGER,        -- Default shelf life`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_store_id)`  
`);`

`CREATE INDEX idx_warehouses_business ON warehouses(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_warehouses_store ON warehouses(business_id, store_id);`  
`CREATE INDEX idx_warehouses_type ON warehouses(business_id, warehouse_type);`

`CREATE TRIGGER trg_warehouses_updated_at`  
  `BEFORE UPDATE ON warehouses`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- STORAGE AREAS (Zones within warehouses)`*  
*`-- =====================================================`*  
`CREATE TABLE storage_areas (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Which warehouse`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,`  
    
  `-- Hierarchy (areas can have sub-areas)`  
  `parent_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `code TEXT,`  
  `area_type storage_area_type DEFAULT 'OTHER',`  
  `description TEXT,`  
    
  `-- Physical properties`  
  `capacity_sqm NUMERIC(10,2),`  
  `temperature_min NUMERIC(5,2),`  
  `temperature_max NUMERIC(5,2),`  
  `humidity_min NUMERIC(5,2),`  
  `humidity_max NUMERIC(5,2),`  
    
  `-- Display`  
  `sort_order INTEGER DEFAULT 0,`  
  `color_hex TEXT,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(warehouse_id, code)`  
`);`

`CREATE INDEX idx_storage_areas_warehouse ON storage_areas(business_id, warehouse_id);`  
`CREATE INDEX idx_storage_areas_parent ON storage_areas(business_id, parent_area_id);`  
`CREATE INDEX idx_storage_areas_type ON storage_areas(business_id, area_type);`

`CREATE TRIGGER trg_storage_areas_updated_at`  
  `BEFORE UPDATE ON storage_areas`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- STORE GROUPS (Branch/Section Groupings)`*  
*`-- =====================================================`*  
`CREATE TABLE store_groups (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_group_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
    
  `-- Department link`  
  `department_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data (includes POS, restaurant sections)`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_group_id)`  
`);`

`CREATE INDEX idx_store_groups_dept ON store_groups(business_id, department_id);`

`CREATE TRIGGER trg_store_groups_updated_at`  
  `BEFORE UPDATE ON store_groups`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- TERMINALS (POS Devices)`*  
*`-- =====================================================`*  
`CREATE TABLE terminals (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_terminal_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
    
  `-- Organization links`  
  `department_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
  `store_id UUID REFERENCES stores(id) ON DELETE SET NULL,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_terminal_id)`  
`);`

`CREATE INDEX idx_terminals_dept ON terminals(business_id, department_id);`  
`CREATE INDEX idx_terminals_store ON terminals(business_id, store_id);`

`CREATE TRIGGER trg_terminals_updated_at`  
  `BEFORE UPDATE ON terminals`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

## **4.6 Measurement Units**

sql  
*`-- =====================================================`*  
*`-- MEASUREMENT UNITS`*  
*`-- =====================================================`*  
`CREATE TABLE measurement_units (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_unit_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `short_name TEXT NOT NULL,`  
  `plural_name TEXT,`  
  `unit_type unit_type NOT NULL,`  
    
  `-- Conversion`  
  `base_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,`  
  `conversion_factor NUMERIC(20,10),`  
  `conversion_offset NUMERIC(20,10) DEFAULT 0,`  
    
  `-- Display`  
  `decimal_places INTEGER DEFAULT 2,`  
  `display_format TEXT,`  
    
  `-- Usage flags`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_system_unit BOOLEAN DEFAULT false,`  
  `can_be_fractional BOOLEAN DEFAULT true,`  
  `use_in_inventory BOOLEAN DEFAULT true,`  
  `use_in_counting BOOLEAN DEFAULT true,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_unit_id),`  
  `UNIQUE(business_id, short_name)`  
`);`

`CREATE INDEX idx_units_business ON measurement_units(business_id, is_active);`  
`CREATE INDEX idx_units_type ON measurement_units(business_id, unit_type);`  
`CREATE INDEX idx_units_base ON measurement_units(business_id, base_unit_id);`  
`CREATE INDEX idx_units_inventory ON measurement_units(business_id, use_in_inventory) WHERE use_in_inventory = true;`

`CREATE TRIGGER trg_units_updated_at`  
  `BEFORE UPDATE ON measurement_units`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- Conversion function`*  
`CREATE OR REPLACE FUNCTION convert_quantity(`  
  `p_quantity NUMERIC,`  
  `p_from_unit_id UUID,`  
  `p_to_unit_id UUID,`  
  `p_business_id UUID`  
`)`  
`RETURNS NUMERIC AS $$`  
`DECLARE`  
  `v_from_factor NUMERIC;`  
  `v_to_factor NUMERIC;`  
  `v_from_offset NUMERIC;`  
  `v_to_offset NUMERIC;`  
  `v_base_quantity NUMERIC;`  
`BEGIN`  
  `IF p_from_unit_id = p_to_unit_id THEN`  
    `RETURN p_quantity;`  
  `END IF;`  
    
  `SELECT`  
    `COALESCE(from_unit.conversion_factor, 1),`  
    `COALESCE(from_unit.conversion_offset, 0),`  
    `COALESCE(to_unit.conversion_factor, 1),`  
    `COALESCE(to_unit.conversion_offset, 0)`  
  `INTO v_from_factor, v_from_offset, v_to_factor, v_to_offset`  
  `FROM measurement_units from_unit`  
  `CROSS JOIN measurement_units to_unit`  
  `WHERE from_unit.id = p_from_unit_id`  
    `AND to_unit.id = p_to_unit_id`  
    `AND from_unit.business_id = p_business_id`  
    `AND to_unit.business_id = p_business_id;`  
    
  `IF v_from_factor IS NULL THEN`  
    `RAISE EXCEPTION 'Invalid units for conversion';`  
  `END IF;`  
    
  `v_base_quantity := (p_quantity * v_from_factor) + v_from_offset;`  
  `RETURN (v_base_quantity - v_to_offset) / v_to_factor;`  
`END;`  
`$$ LANGUAGE plpgsql IMMUTABLE;`

## **4.7 Catalog (Categories & Products)**

sql  
*`-- =====================================================`*  
*`-- CATEGORIES (Product Groups)`*  
*`-- =====================================================`*  
`CREATE TABLE categories (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_group_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Hierarchy`  
  `parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,`  
  `depth INTEGER DEFAULT 0,`  
  `path TEXT[],`  
  `product_group_type product_group_type DEFAULT 'PRODUCTS',`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
    
  `-- Display`  
  `sort_order INTEGER DEFAULT 0,`  
  `display_order INTEGER,`  
  `color_rgb JSONB,`  
  `font_color_rgb JSONB,`  
  `image_id UUID,`  
    
  `-- SEO (for e-commerce)`  
  `seo_title TEXT,`  
  `seo_description TEXT,`  
  `seo_keywords TEXT,`  
  `seo_text TEXT,`  
    
  `-- Visibility (store-specific)`  
  `visible_in_warehouse_ids UUID[],`  
  `excluded_from_warehouse_ids UUID[],`  
    
  `-- Tax & Accounting`  
  `tax_category_id UUID,`  
  `accounting_category_id UUID,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_group_id)`  
`);`

`CREATE INDEX idx_categories_parent ON categories(business_id, parent_id);`  
`CREATE INDEX idx_categories_active ON categories(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_categories_depth ON categories(business_id, depth);`  
`CREATE INDEX idx_categories_path ON categories USING gin(path);`  
`CREATE INDEX idx_categories_type ON categories(business_id, product_group_type);`

`CREATE TRIGGER trg_categories_updated_at`  
  `BEFORE UPDATE ON categories`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- Hierarchy trigger`*  
`CREATE OR REPLACE FUNCTION update_category_hierarchy()`  
`RETURNS TRIGGER AS $$`  
`DECLARE`  
  `parent_depth INTEGER;`  
  `parent_path TEXT[];`  
`BEGIN`  
  `IF NEW.parent_id IS NULL THEN`  
    `NEW.depth := 0;`  
    `NEW.path := ARRAY[NEW.id::TEXT];`  
  `ELSE`  
    `SELECT depth, path INTO parent_depth, parent_path`  
    `FROM categories WHERE id = NEW.parent_id;`  
    `NEW.depth := parent_depth + 1;`  
    `NEW.path := parent_path || NEW.id::TEXT;`  
  `END IF;`  
  `RETURN NEW;`  
`END;`  
`$$ LANGUAGE plpgsql;`

`CREATE TRIGGER trg_category_hierarchy`  
  `BEFORE INSERT OR UPDATE OF parent_id ON categories`  
  `FOR EACH ROW EXECUTE FUNCTION update_category_hierarchy();`

*`-- =====================================================`*  
*`-- PRODUCTS (All Types)`*  
*`-- =====================================================`*  
`CREATE TABLE products (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_product_id UUID NOT NULL,`  
  `sku TEXT,`  
  `code TEXT,`  
    
  `-- Hierarchy & Classification`  
  `category_id UUID REFERENCES categories(id) ON DELETE SET NULL,`  
  `parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,`  
    
  `-- Product details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
  `product_type product_type NOT NULL,`  
  `product_group_type product_group_type,`  
    
  `-- Measurement`  
  `main_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,`  
  `unit_capacity NUMERIC(20,6),`  
  `unit_weight NUMERIC(20,6),`  
    
  `-- Counting units (what staff counts in)`  
  `counting_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,`  
  `container_type TEXT,`  
  `container_capacity NUMERIC(20,6),`  
  `container_capacity_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Pricing`  
  `default_sale_price NUMERIC(15,2),`  
  `average_cost NUMERIC(15,2),`  
    
  `-- Inventory behavior`  
  `not_in_store_movement BOOLEAN DEFAULT false,`  
  `track_inventory BOOLEAN DEFAULT true,`  
  `min_stock_level NUMERIC(20,6),`  
  `max_stock_level NUMERIC(20,6),`  
  `reorder_point NUMERIC(20,6),`  
    
  `-- Cooking (for DISH type)`  
  `cooking_place_type TEXT,`  
    
  `-- Visual`  
  `color_rgb JSONB,`  
  `font_color_rgb JSONB,`  
  `front_image_id UUID,`  
  `display_order INTEGER,`  
    
  `-- Tax & Accounting`  
  `tax_category_id UUID,`  
  `accounting_category_id UUID,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
  `default_included_in_menu BOOLEAN DEFAULT false,`  
    
  `-- Excluded stores`  
  `excluded_warehouse_ids UUID[] DEFAULT '{}'::uuid[],`  
    
  `-- Complete Syrve data (CRITICAL: Store everything)`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_product_id)`  
`);`

*`-- Indexes`*  
`CREATE INDEX idx_products_business ON products(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_products_category ON products(business_id, category_id);`  
`CREATE INDEX idx_products_parent ON products(business_id, parent_product_id);`  
`CREATE INDEX idx_products_type ON products(business_id, product_type);`  
`CREATE INDEX idx_products_sku ON products(business_id, sku);`  
`CREATE INDEX idx_products_code ON products(business_id, code);`  
`CREATE INDEX idx_products_goods ON products(business_id, product_type, track_inventory)`  
  `WHERE product_type = 'GOODS' AND is_deleted = false AND track_inventory = true;`  
`CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('simple', name));`  
`CREATE INDEX idx_products_main_unit ON products(business_id, main_unit_id);`

`CREATE TRIGGER trg_products_updated_at`  
  `BEFORE UPDATE ON products`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- PRODUCT BARCODES`*  
*`-- =====================================================`*  
`CREATE TABLE product_barcodes (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Barcode data`  
  `barcode TEXT NOT NULL,`  
  `barcode_type TEXT,`  
    
  `-- Container link`  
  `container_id UUID,`  
    
  `-- Metadata`  
  `source barcode_source DEFAULT 'syrve',`  
  `is_primary BOOLEAN DEFAULT false,`  
  `confidence NUMERIC(5,4),`  
    
  `-- Timestamps`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `created_by UUID REFERENCES profiles(id),`  
    
  `UNIQUE(business_id, barcode)`  
`);`

`CREATE INDEX idx_barcodes_product ON product_barcodes(business_id, product_id);`  
`CREATE INDEX idx_barcodes_lookup ON product_barcodes(business_id, barcode);`  
`CREATE INDEX idx_barcodes_primary ON product_barcodes(business_id, product_id, is_primary) WHERE is_primary = true;`

*`-- =====================================================`*  
*`-- PRODUCT CONTAINERS (Packaging Units)`*  
*`-- =====================================================`*  
`CREATE TABLE product_containers (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_container_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Container details`  
  `name TEXT NOT NULL,`  
  `container_type TEXT,`  
    
  `-- Capacity`  
  `capacity NUMERIC(20,6) NOT NULL,`  
  `capacity_unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Quantity`  
  `units_per_container INTEGER DEFAULT 1,`  
    
  `-- Weight tracking`  
  `tare_weight NUMERIC(15,6),`  
  `gross_weight NUMERIC(15,6),`  
  `net_weight NUMERIC(15,6),`  
  `min_container_weight NUMERIC(15,6),`  
  `max_container_weight NUMERIC(15,6),`  
  `full_container_weight NUMERIC(15,6),`  
    
  `-- Density`  
  `density NUMERIC(15,6),`  
    
  `-- Settings`  
  `backward_recalculation BOOLEAN DEFAULT false,`  
  `use_in_front BOOLEAN DEFAULT false,`  
  `is_default BOOLEAN DEFAULT false,`  
  `use_in_inventory BOOLEAN DEFAULT true,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_container_id)`  
`);`

`CREATE INDEX idx_containers_product ON product_containers(business_id, product_id);`  
`CREATE INDEX idx_containers_default ON product_containers(business_id, product_id, is_default) WHERE is_default = true;`

`CREATE TRIGGER trg_containers_updated_at`  
  `BEFORE UPDATE ON product_containers`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- PRODUCT SIZES (Variants)`*  
*`-- =====================================================`*  
`CREATE TABLE product_sizes (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_size_id UUID NOT NULL,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Size details`  
  `name TEXT NOT NULL,`  
  `priority INTEGER DEFAULT 0,`  
    
  `-- Pricing`  
  `price NUMERIC(15,2),`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_size_id)`  
`);`

`CREATE INDEX idx_sizes_product ON product_sizes(business_id, product_id);`

`CREATE TRIGGER trg_sizes_updated_at`  
  `BEFORE UPDATE ON product_sizes`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- PRODUCT MODIFIERS`*  
*`-- =====================================================`*  
`CREATE TABLE product_modifier_groups (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifier`  
  `syrve_group_id UUID NOT NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
    
  `-- Hierarchy`  
  `parent_group_id UUID REFERENCES product_modifier_groups(id) ON DELETE SET NULL,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_group_id)`  
`);`

`CREATE INDEX idx_modifier_groups_parent ON product_modifier_groups(business_id, parent_group_id);`

`CREATE TRIGGER trg_modifier_groups_updated_at`  
  `BEFORE UPDATE ON product_modifier_groups`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

`CREATE TABLE product_modifiers (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Parent product`  
  `parent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Modifier (can be product OR group)`  
  `modifier_product_id UUID REFERENCES products(id) ON DELETE CASCADE,`  
  `modifier_group_id UUID REFERENCES product_modifier_groups(id) ON DELETE CASCADE,`  
    
  `-- Rules`  
  `default_amount INTEGER DEFAULT 0,`  
  `free_of_charge_amount INTEGER DEFAULT 0,`  
  `minimum_amount INTEGER DEFAULT 0,`  
  `maximum_amount INTEGER DEFAULT 0,`  
    
  `-- UI behavior`  
  `hide_if_default_amount BOOLEAN DEFAULT false,`  
  `required BOOLEAN DEFAULT false,`  
  `splittable BOOLEAN DEFAULT false,`  
  `child_modifiers_have_min_max_restrictions BOOLEAN DEFAULT false,`  
    
  `-- Display`  
  `display_order INTEGER DEFAULT 0,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `CHECK (`  
    `(modifier_product_id IS NOT NULL AND modifier_group_id IS NULL) OR`  
    `(modifier_product_id IS NULL AND modifier_group_id IS NOT NULL)`  
  `)`  
`);`

`CREATE INDEX idx_modifiers_parent ON product_modifiers(business_id, parent_product_id);`  
`CREATE INDEX idx_modifiers_product ON product_modifiers(business_id, modifier_product_id);`  
`CREATE INDEX idx_modifiers_group ON product_modifiers(business_id, modifier_group_id);`

`CREATE TRIGGER trg_modifiers_updated_at`  
  `BEFORE UPDATE ON product_modifiers`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- PRODUCT COMPOSITION (Recipe/BOM)`*  
*`-- =====================================================`*  
`CREATE TABLE product_composition (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Parent product (e.g., DISH)`  
  `parent_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Child product (e.g., GOODS)`  
  `child_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Quantity required`  
  `quantity NUMERIC(20,6) NOT NULL,`  
  `unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Type`  
  `composition_type TEXT DEFAULT 'ingredient',`  
    
  `-- Loss/waste`  
  `waste_percentage NUMERIC(5,2) DEFAULT 0,`  
    
  `-- Display`  
  `display_order INTEGER DEFAULT 0,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(parent_product_id, child_product_id)`  
`);`

`CREATE INDEX idx_composition_parent ON product_composition(business_id, parent_product_id);`  
`CREATE INDEX idx_composition_child ON product_composition(business_id, child_product_id);`

`CREATE TRIGGER trg_composition_updated_at`  
  `BEFORE UPDATE ON product_composition`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

## **4.8 Stock Management**

sql  
*`-- =====================================================`*  
*`-- STOCK LEVELS (Current Inventory)`*  
*`-- =====================================================`*  
`CREATE TABLE stock_levels (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- What & where`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,`  
  `storage_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,`  
    
  `-- Quantity`  
  `quantity NUMERIC(20,6) NOT NULL DEFAULT 0,`  
  `unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Converted to product's main unit`  
  `quantity_in_product_unit NUMERIC(20,6),`  
    
  `-- Value`  
  `unit_cost NUMERIC(15,4),`  
  `total_value NUMERIC(15,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,`  
    
  `-- Timestamp`  
  `as_of_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),`  
    
  `-- Source`  
  `source TEXT DEFAULT 'syrve',`  
  `sync_run_id UUID REFERENCES syrve_sync_runs(id),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(product_id, warehouse_id, as_of_date),`  
    
  `CONSTRAINT check_stock_non_negative CHECK (`  
    `quantity >= 0 OR`  
    `EXISTS (SELECT 1 FROM warehouses w WHERE w.id = warehouse_id AND w.allow_negative_stock = true)`  
  `)`  
`);`

`CREATE INDEX idx_stock_product_warehouse ON stock_levels(business_id, product_id, warehouse_id);`  
`CREATE INDEX idx_stock_warehouse ON stock_levels(business_id, warehouse_id);`  
`CREATE INDEX idx_stock_positive ON stock_levels(business_id, warehouse_id) WHERE quantity > 0;`  
`CREATE INDEX idx_stock_as_of_date ON stock_levels(business_id, as_of_date DESC);`  
`CREATE INDEX idx_stock_sync_run ON stock_levels(business_id, sync_run_id);`

`CREATE TRIGGER trg_stock_levels_updated_at`  
  `BEFORE UPDATE ON stock_levels`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- STOCK HISTORY (Point-in-time Snapshots)`*  
*`-- =====================================================`*  
`CREATE TABLE stock_history (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- What & where`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,`  
    
  `-- Quantity`  
  `quantity NUMERIC(20,6) NOT NULL,`  
  `unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
  `quantity_in_product_unit NUMERIC(20,6),`  
    
  `-- Value`  
  `unit_cost NUMERIC(15,4),`  
  `total_value NUMERIC(15,2),`  
    
  `-- Snapshot metadata`  
  `snapshot_at TIMESTAMPTZ NOT NULL,`  
  `source TEXT DEFAULT 'syrve',`  
  `sync_run_id UUID REFERENCES syrve_sync_runs(id),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE INDEX idx_stock_history_product_warehouse ON stock_history(business_id, product_id, warehouse_id, snapshot_at DESC);`  
`CREATE INDEX idx_stock_history_snapshot ON stock_history(business_id, snapshot_at DESC);`

*`-- Partition by month (optional, for high-volume businesses)`*  
*`-- ALTER TABLE stock_history PARTITION BY RANGE (snapshot_at);`*

*`-- =====================================================`*  
*`-- HELPER: Get Countable Products`*  
*`-- =====================================================`*  
`CREATE OR REPLACE FUNCTION get_countable_products(`  
  `p_business_id UUID,`  
  `p_warehouse_id UUID,`  
  `p_category_id UUID DEFAULT NULL`  
`)`  
`RETURNS TABLE(`  
  `product_id UUID,`  
  `product_name TEXT,`  
  `sku TEXT,`  
  `code TEXT,`  
  `category_name TEXT,`  
  `current_stock NUMERIC,`  
  `stock_unit TEXT,`  
  `counting_unit TEXT,`  
  `container_type TEXT,`  
  `container_capacity NUMERIC,`  
  `image_id UUID`  
`) AS $$`  
`BEGIN`  
  `RETURN QUERY`  
  `SELECT`  
    `p.id AS product_id,`  
    `p.name AS product_name,`  
    `p.sku,`  
    `p.code,`  
    `c.name AS category_name,`  
    `sl.quantity AS current_stock,`  
    `mu_stock.short_name AS stock_unit,`  
    `mu_count.short_name AS counting_unit,`  
    `p.container_type,`  
    `p.container_capacity,`  
    `p.front_image_id AS image_id`  
  `FROM products p`  
  `INNER JOIN stock_levels sl ON sl.product_id = p.id`  
  `LEFT JOIN categories c ON c.id = p.category_id`  
  `LEFT JOIN measurement_units mu_stock ON mu_stock.id = p.main_unit_id`  
  `LEFT JOIN measurement_units mu_count ON mu_count.id = p.counting_unit_id`  
  `WHERE p.business_id = p_business_id`  
    `AND sl.business_id = p_business_id`  
    `AND sl.warehouse_id = p_warehouse_id`  
    `AND p.product_type = 'GOODS'`  
    `AND p.track_inventory = true`  
    `AND p.not_in_store_movement = false`  
    `AND p.is_active = true`  
    `AND p.is_deleted = false`  
    `AND sl.quantity > 0`  
    `AND (p_category_id IS NULL OR p.category_id = p_category_id)`  
  `ORDER BY c.name, p.name;`  
`END;`  
`$$ LANGUAGE plpgsql STABLE;`

## **4.9 Pricing (Optional)**

sql  
*`-- =====================================================`*  
*`-- PRICE CATEGORIES`*  
*`-- =====================================================`*  
`CREATE TABLE price_categories (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_price_category_id UUID NOT NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_price_category_id)`  
`);`

`CREATE INDEX idx_price_categories_business ON price_categories(business_id, is_active);`

`CREATE TRIGGER trg_price_categories_updated_at`  
  `BEFORE UPDATE ON price_categories`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- PRODUCT PRICES`*  
*`-- =====================================================`*  
`CREATE TABLE product_prices (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Price category & organization`  
  `price_category_id UUID REFERENCES price_categories(id) ON DELETE CASCADE,`  
  `org_node_id UUID REFERENCES org_nodes(id) ON DELETE CASCADE,`  
    
  `-- Price`  
  `price NUMERIC(15,2) NOT NULL,`  
    
  `-- Effective dates`  
  `valid_from DATE,`  
  `valid_to DATE,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(product_id, price_category_id, org_node_id, valid_from)`  
`);`

`CREATE INDEX idx_product_prices_product ON product_prices(business_id, product_id);`  
`CREATE INDEX idx_product_prices_category ON product_prices(business_id, price_category_id);`  
`CREATE INDEX idx_product_prices_org ON product_prices(business_id, org_node_id);`  
`CREATE INDEX idx_product_prices_dates ON product_prices(business_id, valid_from, valid_to);`

`CREATE TRIGGER trg_product_prices_updated_at`  
  `BEFORE UPDATE ON product_prices`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

## **4.10 Accounting Data**

sql  
*`-- =====================================================`*  
*`-- TAX CATEGORIES`*  
*`-- =====================================================`*  
`CREATE TABLE tax_categories (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_tax_category_id UUID NOT NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `percent NUMERIC(5,2),`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_tax_category_id)`  
`);`

`CREATE INDEX idx_tax_categories_business ON tax_categories(business_id, is_active);`

`CREATE TRIGGER trg_tax_categories_updated_at`  
  `BEFORE UPDATE ON tax_categories`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- ACCOUNTING CATEGORIES`*  
*`-- =====================================================`*  
`CREATE TABLE accounting_categories (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_accounting_category_id UUID NOT NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `code TEXT,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_accounting_category_id)`  
`);`

`CREATE INDEX idx_accounting_categories_business ON accounting_categories(business_id, is_active);`

`CREATE TRIGGER trg_accounting_categories_updated_at`  
  `BEFORE UPDATE ON accounting_categories`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- Link tax/accounting categories back to products/categories (FKs)`*  
`ALTER TABLE products`  
  `ADD CONSTRAINT fk_products_tax_category`  
  `FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id) ON DELETE SET NULL;`

`ALTER TABLE products`  
  `ADD CONSTRAINT fk_products_accounting_category`  
  `FOREIGN KEY (accounting_category_id) REFERENCES accounting_categories(id) ON DELETE SET NULL;`

`ALTER TABLE categories`  
  `ADD CONSTRAINT fk_categories_tax_category`  
  `FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id) ON DELETE SET NULL;`

`ALTER TABLE categories`  
  `ADD CONSTRAINT fk_categories_accounting_category`  
  `FOREIGN KEY (accounting_category_id) REFERENCES accounting_categories(id) ON DELETE SET NULL;`

## **4.11 Counteragents (Suppliers)**

sql  
*`-- =====================================================`*  
*`-- COUNTERAGENTS (Suppliers/Clients)`*  
*`-- =====================================================`*  
`CREATE TABLE counteragents (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_counteragent_id UUID NOT NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `legal_name TEXT,`  
  `comment TEXT,`  
    
  `-- Tax identifiers`  
  `inn TEXT,                             -- Tax ID`  
  `kpp TEXT,                             -- Additional tax code`  
    
  `-- Contact`  
  `phone TEXT,`  
  `email TEXT,`  
    
  `-- Type`  
  `is_supplier BOOLEAN DEFAULT false,`  
  `is_client BOOLEAN DEFAULT false,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_counteragent_id)`  
`);`

`CREATE INDEX idx_counteragents_business ON counteragents(business_id, is_active);`  
`CREATE INDEX idx_counteragents_supplier ON counteragents(business_id, is_supplier) WHERE is_supplier = true;`

`CREATE TRIGGER trg_counteragents_updated_at`  
  `BEFORE UPDATE ON counteragents`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

*`-- =====================================================`*  
*`-- COUNTERAGENT ADDRESSES`*  
*`-- =====================================================`*  
`CREATE TABLE counteragent_addresses (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `counteragent_id UUID NOT NULL REFERENCES counteragents(id) ON DELETE CASCADE,`  
    
  `-- Address`  
  `city TEXT,`  
  `street TEXT,`  
  `postal_code TEXT,`  
  `country TEXT,`  
    
  `-- Type`  
  `address_type TEXT DEFAULT 'main',     -- main|billing|shipping|other`  
  `is_primary BOOLEAN DEFAULT false,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE INDEX idx_counteragent_addresses_counteragent ON counteragent_addresses(business_id, counteragent_id);`

`CREATE TRIGGER trg_counteragent_addresses_updated_at`  
  `BEFORE UPDATE ON counteragent_addresses`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

## **4.12 Employees**

sql  
*`-- =====================================================`*  
*`-- EMPLOYEES (Syrve Users)`*  
*`-- =====================================================`*  
`CREATE TABLE employees (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_employee_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Personal info`  
  `first_name TEXT,`  
  `middle_name TEXT,`  
  `last_name TEXT,`  
  `display_name TEXT NOT NULL,`  
    
  `-- Contact`  
  `phone TEXT,`  
  `email TEXT,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_employee_id)`  
`);`

`CREATE INDEX idx_employees_business ON employees(business_id, is_active);`  
`CREATE INDEX idx_employees_email ON employees(business_id, email);`

`CREATE TRIGGER trg_employees_updated_at`  
  `BEFORE UPDATE ON employees`  
  `FOR EACH ROW EXECUTE FUNCTION set_updated_at();`

---

## **5\. Import Workflow (Step-by-Step)**

## **5.1 Complete Import Sequence**

text  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 1: PRE-FLIGHT CHECKS                              │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Validate Syrve config exists                         │`  
`│ 2. Test authentication                                   │`  
`│ 3. Check import config (what to import)                 │`  
`│ 4. Create sync run record                               │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 2: FOUNDATION DATA (Required for everything else) │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Import Measurement Units                             │`  
`│    • Call: GET /units/list OR extract from products     │`  
`│    • Parse: All units with names, codes                 │`  
`│    • Store: measurement_units table                     │`  
`│    • Post-process: Identify base units, set conversions │`  
`│                                                          │`  
`│ 2. Import Organization Structure                        │`  
`│    • Call: GET /corporation/departments                 │`  
`│    • Parse: Hierarchy with parent references            │`  
`│    • Store: org_nodes table                             │`  
`│    • Build: Depth and path fields                       │`  
`│                                                          │`  
`│ 3. Import Stores                                        │`  
`│    • Call: GET /corporation/stores                      │`  
`│    • Parse: Store details and types                     │`  
`│    • Store: stores table                                │`  
`│                                                          │`  
`│ 4. Create Warehouses                                    │`  
`│    • Source: From stores response                       │`  
`│    • Map: Store → Warehouse (1:1 initially)             │`  
`│    • Store: warehouses table                            │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 3: CATALOG STRUCTURE                              │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Import Accounting Data (if enabled)                  │`  
`│    • Call: GET /v2/entities/taxCategories/list          │`  
`│    • Call: GET /accountingCategories/list               │`  
`│    • Store: tax_categories, accounting_categories       │`  
`│                                                          │`  
`│ 2. Import Categories                                    │`  
`│    • Call: GET /v2/entities/products/group/list         │`  
`│    • Parse: Hierarchy with parentGroup references       │`  
`│    • Store: categories table                            │`  
`│    • Build: Depth and path fields                       │`  
`│    • Link: Tax and accounting categories                │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 4: PRODUCTS (Core Catalog)                        │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Import Products                                       │`  
`│    • Call: GET /v2/entities/products/list               │`  
`│    • Filter: By selected types (config)                 │`  
`│    • Parse: All product fields                          │`  
`│    • Store: products table                              │`  
`│    • Store: Complete XML in syrve_data                  │`  
`│                                                          │`  
`│ 2. Process Embedded Data                                │`  
`│    For each product:                                     │`  
`│    • Extract barcodes → product_barcodes                │`  
`│    • Extract containers → product_containers            │`  
`│    • Extract sizes → product_sizes                      │`  
`│    • Extract modifiers → product_modifiers              │`  
`│    • Extract composition → product_composition          │`  
`│                                                          │`  
`│ 3. Link Products                                        │`  
`│    • Link to categories (category_id)                   │`  
`│    • Link to units (main_unit_id, counting_unit_id)     │`  
`│    • Link to tax categories                             │`  
`│    • Link to accounting categories                      │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 5: STOCK DATA                                     │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Import Stock Levels                                  │`  
`│    For each warehouse:                                   │`  
`│      • Get all GOODS product IDs                        │`  
`│      • Batch into groups of 500                         │`  
`│      • Call: GET /v2/entities/products/stock-and-sales  │`  
`│      • Parse: Quantities and units                      │`  
`│      • Store: stock_levels table                        │`  
`│      • Convert: To product's main unit if needed        │`  
`│                                                          │`  
`│ 2. Snapshot to History                                  │`  
`│    • Copy stock_levels → stock_history                  │`  
`│    • Tag with sync_run_id and timestamp                 │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 6: OPTIONAL DATA (Based on config)                │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Import Prices (if enabled)                           │`  
`│    • Call: GET /nomenclature/priceCategories            │`  
`│    • Call: GET /v2/price (multiple calls per category)  │`  
`│    • Store: price_categories, product_prices            │`  
`│                                                          │`  
`│ 2. Import Counteragents (if enabled)                    │`  
`│    • Call: GET /v2/entities/counteragents/list          │`  
`│    • Parse: Supplier/client data                        │`  
`│    • Store: counteragents, counteragent_addresses       │`  
`│                                                          │`  
`│ 3. Import Employees (if enabled)                        │`  
`│    • Call: GET /v2/entities/employees/list              │`  
`│    • Parse: Employee data                               │`  
`│    • Store: employees table                             │`  
`│                                                          │`  
`│ 4. Import Groups (if needed for zones)                  │`  
`│    • Call: GET /corporation/groups                      │`  
`│    • Parse: Branch groups and sections                  │`  
`│    • Store: store_groups                                │`  
`│    • Optional: Map sections → storage_areas             │`  
`│                                                          │`  
`│ 5. Import Terminals (audit only)                        │`  
`│    • Call: GET /corporation/terminals                   │`  
`│    • Store: terminals table                             │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 7: POST-PROCESSING                                │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Verify Relationships                                 │`  
`│    • Check all foreign keys are valid                   │`  
`│    • Identify orphaned records                          │`  
`│    • Log warnings for missing references                │`  
`│                                                          │`  
`│ 2. Update Statistics                                    │`  
`│    • Count products per category                        │`  
`│    • Count stock items per warehouse                    │`  
`│    • Calculate total inventory value                    │`  
`│                                                          │`  
`│ 3. Build Aggregates                                     │`  
`│    • Refresh materialized views (if any)                │`  
`│    • Update denormalized counters                       │`  
`│                                                          │`  
`│ 4. Update Sync Run                                      │`  
`│    • Mark as success/partial/failed                     │`  
`│    • Store counters and summary                         │`  
`│    • Calculate duration                                 │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 8: CLEANUP                                        │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Logout from Syrve                                    │`  
`│    • Call: GET /logout?key={token}                      │`  
`│    • Release license seat                               │`  
`│                                                          │`  
`│ 2. Notify Admin                                         │`  
`│    • Send completion notification                       │`  
`│    • Include summary and any errors                     │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
                   `[COMPLETE]`

## **5.2 Import Order (Dependencies)**

**Critical Order:**

1. ✅ measurement\_units (no dependencies)  
2. ✅ org\_nodes (self-referential, needs hierarchy logic)  
3. ✅ stores (depends on org\_nodes)  
4. ✅ warehouses (depends on stores)  
5. ✅ tax\_categories (no dependencies)  
6. ✅ accounting\_categories (no dependencies)  
7. ✅ categories (depends on tax/accounting categories)  
8. ✅ products (depends on categories, units, tax/accounting)  
9. ✅ product\_barcodes (depends on products)  
10. ✅ product\_containers (depends on products, units)  
11. ✅ product\_modifiers (depends on products)  
12. ✅ stock\_levels (depends on products, warehouses, units)  
13. ⚠️ prices (depends on products, categories)  
14. ⚠️ counteragents (no dependencies)  
15. ⚠️ employees (no dependencies)

---

## **6\. API Integration Implementation**

## **6.1 Authentication Manager**

typescript  
*`// =====================================================`*   
*`// SYRVE AUTHENTICATION SERVICE`*  
*`// =====================================================`*  
`import crypto from 'crypto';`  
`import axios, { AxiosInstance } from 'axios';`

`interface SyrveConfig {`  
  `server_url: string;`  
  `api_login: string;`  
  `api_password_encrypted: string; // Encrypted in DB`  
`}`

`interface AuthToken {`  
  `token: string;`  
  `expires_at: Date;`  
  `logged_in_at: Date;`  
`}`

`class SyrveAuthManager {`  
  `private config: SyrveConfig;`  
  `private currentToken: AuthToken | null = null;`  
  `private axios: AxiosInstance;`  
    
  `constructor(config: SyrveConfig) {`  
    `this.config = config;`  
    `this.axios = axios.create({`  
      `baseURL: config.server_url,`  
      `timeout: 30000, // 30 seconds`  
      `headers: {`  
        `'Content-Type': 'application/xml',`  
      `},`  
    `});`  
  `}`  
    
  `/**`  
   *`* Authenticate and get token`*  
   *`*/`*  
  `async authenticate(): Promise<string> {`  
    `// Decrypt password (use your encryption method)`  
    `const password = await this.decryptPassword(this.config.api_password_encrypted);`  
      
    `// Generate SHA1 hash`  
    `const passwordHash = crypto`  
      `.createHash('sha1')`  
      `.update(password)`  
      `.digest('hex')`  
      `.toLowerCase();`  
      
    `// Call auth endpoint`  
    `try {`  
      `const response = await this.axios.get('/auth', {`  
        `params: {`  
          `login: this.config.api_login,`  
          `pass: passwordHash,`  
        `},`  
      `});`  
        
      `// Extract token from XML response`  
      `const token = this.parseTokenFromXML(response.data);`  
        
      `if (!token) {`  
        `throw new Error('No token received from Syrve');`  
      `}`  
        
      `// Store token`  
      `this.currentToken = {`  
        `token,`  
        `expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours default`  
        `logged_in_at: new Date(),`  
      `};`  
        
      ``console.log(`✅ Authenticated to Syrve: ${token.substring(0, 8)}...`);``  
        
      `return token;`  
        
    `} catch (error) {`  
      `if (error.response?.status === 401) {`  
        `throw new Error('Invalid Syrve credentials');`  
      `} else if (error.response?.status === 423) {`  
        `throw new Error('Syrve license limit reached. Please wait or logout other sessions.');`  
      `}`  
      ``throw new Error(`Authentication failed: ${error.message}`);``  
    `}`  
  `}`  
    
  `/**`  
   *`* Logout and release license`*  
   *`*/`*  
  `async logout(): Promise<void> {`  
    `if (!this.currentToken) {`  
      `return;`  
    `}`  
      
    `try {`  
      `await this.axios.get('/logout', {`  
        `params: { key: this.currentToken.token },`  
      `});`  
        
      `console.log('✅ Logged out from Syrve');`  
        
    `} catch (error) {`  
      `console.warn('⚠️ Logout warning:', error.message);`  
    `} finally {`  
      `this.currentToken = null;`  
    `}`  
  `}`  
    
  `/**`  
   *`* Get current token (authenticate if needed)`*  
   *`*/`*  
  `async getToken(): Promise<string> {`  
    `if (this.currentToken && this.currentToken.expires_at > new Date()) {`  
      `return this.currentToken.token;`  
    `}`  
    `return await this.authenticate();`  
  `}`  
    
  `/**`  
   *`* Execute operation with auto-auth and auto-logout`*  
   *`*/`*  
  `async withAuth<T>(operation: (token: string) => Promise<T>): Promise<T> {`  
    `const token = await this.getToken();`  
    `try {`  
      `return await operation(token);`  
    `} finally {`  
      `await this.logout();`  
    `}`  
  `}`  
    
  `// Helper methods`  
    
  `private async decryptPassword(encrypted: string): Promise<string> {`  
    `// Implement your decryption logic`  
    `// Example using crypto:`  
    `// const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);`  
    `// return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');`  
    `return encrypted; // Placeholder`  
  `}`  
    
  `private parseTokenFromXML(xml: string): string | null {`  
    `// Parse simple XML: <string xmlns="...">token-here</string>`  
    `const match = xml.match(/<string[^>]*>([^<]+)<\/string>/);`  
    `return match ? match[1].trim() : null;`  
  `}`  
`}`

`export default SyrveAuthManager;`

## **6.2 API Client (Generic)**

typescript  
*`// =====================================================`*  
*`// SYRVE API CLIENT`*  
*`// =====================================================`*  
`import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';`  
`import xml2js from 'xml2js';`  
`import crypto from 'crypto';`

`interface APICallOptions {`  
  `endpoint: string;`  
  `method?: 'GET' | 'POST';`  
  `params?: Record<string, any>;`  
  `body?: string;`  
  `token: string;`  
`}`

`interface APIResponse {`  
  `data: any; // Parsed JSON`  
  `raw: string; // Original XML`  
  `hash: string; // MD5 hash`  
  `status: number;`  
  `duration: number;`  
`}`

`class SyrveAPIClient {`  
  `private axios: AxiosInstance;`  
  `private xmlParser: xml2js.Parser;`  
    
  `constructor(baseURL: string) {`  
    `this.axios = axios.create({`  
      `baseURL,`  
      `timeout: 60000, // 60 seconds`  
      `headers: {`  
        `'Content-Type': 'application/xml',`  
        `'Accept': 'application/xml',`  
      `},`  
    `});`  
      
    `this.xmlParser = new xml2js.Parser({`  
      `explicitArray: false,`  
      `trim: true,`  
      `normalizeTags: false,`  
      `attrkey: '@attributes',`  
      `charkey: '#text',`  
    `});`  
  `}`  
    
  `/**`  
   *`* Make API call to Syrve`*  
   *`*/`*  
  `async call(options: APICallOptions): Promise<APIResponse> {`  
    `const startTime = Date.now();`  
      
    `const config: AxiosRequestConfig = {`  
      `method: options.method || 'GET',`  
      `url: options.endpoint,`  
      `params: {`  
        `key: options.token,`  
        `...options.params,`  
      `},`  
    `};`  
      
    `if (options.body) {`  
      `config.data = options.body;`  
    `}`  
      
    `try {`  
      `const response = await this.axios.request(config);`  
      `const duration = Date.now() - startTime;`  
        
      `// Parse XML to JSON`  
      `const parsedData = await this.parseXML(response.data);`  
        
      `// Calculate hash`  
      `const hash = crypto`  
        `.createHash('md5')`  
        `.update(JSON.stringify(response.data))`  
        `.digest('hex');`  
        
      `return {`  
        `data: parsedData,`  
        `raw: response.data,`  
        `hash,`  
        `status: response.status,`  
        `duration,`  
      `};`  
        
    `} catch (error) {`  
      `throw this.handleError(error);`  
    `}`  
  `}`  
    
  `/**`  
   *`* Parse XML to JSON`*  
   *`*/`*  
  `private async parseXML(xml: string): Promise<any> {`  
    `try {`  
      `return await this.xmlParser.parseStringPromise(xml);`  
    `} catch (error) {`  
      `console.error('XML Parse Error:', error.message);`  
      `return { rawXML: xml }; // Fallback: return raw XML`  
    `}`  
  `}`  
    
  `/**`  
   *`* Handle API errors`*  
   *`*/`*  
  `private handleError(error: any): Error {`  
    `if (error.response) {`  
      `const status = error.response.status;`  
      `const message = error.response.data;`  
        
      `switch (status) {`  
        `case 400:`  
          ``return new Error(`Bad Request: ${message}`);``  
        `case 401:`  
          `return new Error('Unauthorized: Invalid token');`  
        `case 403:`  
          `return new Error('Forbidden: Access denied');`  
        `case 404:`  
          ``return new Error(`Not Found: ${error.config.url}`);``  
        `case 423:`  
          `return new Error('Locked: License limit reached');`  
        `case 500:`  
          ``return new Error(`Syrve Server Error: ${message}`);``  
        `default:`  
          ``return new Error(`HTTP ${status}: ${message}`);``  
      `}`  
    `} else if (error.request) {`  
      `return new Error('No response from Syrve server (timeout or network error)');`  
    `} else {`  
      ``return new Error(`Request setup error: ${error.message}`);``  
    `}`  
  `}`  
    
  `/**`  
   *`* Rate limiting helper`*  
   *`*/`*  
  `async sleep(ms: number): Promise<void> {`  
    `return new Promise(resolve => setTimeout(resolve, ms));`  
  `}`  
`}`

`export default SyrveAPIClient;`

## **6.3 Import Orchestrator**

typescript  
*`// =====================================================`*  
*`// IMPORT ORCHESTRATOR (Main Controller)`*  
*`// =====================================================`*  
`import SyrveAuthManager from './SyrveAuthManager';`  
`import SyrveAPIClient from './SyrveAPIClient';`  
`import { Database } from './database';`

`interface ImportConfig {`  
  `businessId: string;`  
  `selectedWarehouseIds: string[];`  
  `importAllWarehouses: boolean;`  
  `importGoods: boolean;`  
  `importDishes: boolean;`  
  `importStock: boolean;`  
  `importPrices: boolean;`  
  `importAccounting: boolean;`  
  `// ... other flags`  
`}`

`interface ImportResult {`  
  `success: boolean;`  
  `syncRunId: string;`  
  `summary: {`  
    `itemsFetched: number;`  
    `itemsCreated: number;`  
    `itemsUpdated: number;`  
    `itemsFailed: number;`  
    `duration: number;`  
  `};`  
  `errors: Array<{ entity: string; message: string }>;`  
`}`

`class SyrveImportOrchestrator {`  
  `private authManager: SyrveAuthManager;`  
  `private apiClient: SyrveAPIClient;`  
  `private db: Database;`  
    
  `constructor(authManager: SyrveAuthManager, apiClient: SyrveAPIClient, db: Database) {`  
    `this.authManager = authManager;`  
    `this.apiClient = apiClient;`  
    `this.db = db;`  
  `}`  
    
  `/**`  
   *`* Run full bootstrap import`*  
   *`*/`*  
  `async runFullImport(config: ImportConfig): Promise<ImportResult> {`  
    `const syncRunId = await this.createSyncRun(config.businessId, 'full', 'all');`  
    `const startTime = Date.now();`  
      
    `let itemsFetched = 0;`  
    `let itemsCreated = 0;`  
    `let itemsUpdated = 0;`  
    `let itemsFailed = 0;`  
    `const errors: Array<{ entity: string; message: string }> = [];`  
      
    `try {`  
      `// Authenticate`  
      `const token = await this.authManager.authenticate();`  
        
      `// Phase 1: Foundation Data`  
      `console.log('📦 Phase 1: Foundation Data');`  
        
      `const unitsResult = await this.importMeasurementUnits(config.businessId, token, syncRunId);`  
      `itemsFetched += unitsResult.fetched;`  
      `itemsCreated += unitsResult.created;`  
        
      `const orgResult = await this.importOrganizations(config.businessId, token, syncRunId);`  
      `itemsFetched += orgResult.fetched;`  
      `itemsCreated += orgResult.created;`  
        
      `const warehousesResult = await this.importWarehouses(config.businessId, token, syncRunId);`  
      `itemsFetched += warehousesResult.fetched;`  
      `itemsCreated += warehousesResult.created;`  
        
      `// Phase 2: Catalog Structure`  
      `console.log('📚 Phase 2: Catalog Structure');`  
        
      `if (config.importAccounting) {`  
        `const accountingResult = await this.importAccounting(config.businessId, token, syncRunId);`  
        `itemsFetched += accountingResult.fetched;`  
        `itemsCreated += accountingResult.created;`  
      `}`  
        
      `const categoriesResult = await this.importCategories(config.businessId, token, syncRunId);`  
      `itemsFetched += categoriesResult.fetched;`  
      `itemsCreated += categoriesResult.created;`  
        
      `// Phase 3: Products`  
      `console.log('🛍️  Phase 3: Products');`  
        
      `const productsResult = await this.importProducts(config.businessId, token, syncRunId, config);`  
      `itemsFetched += productsResult.fetched;`  
      `itemsCreated += productsResult.created;`  
      `itemsUpdated += productsResult.updated;`  
        
      `// Phase 4: Stock`  
      `if (config.importStock) {`  
        `console.log('📊 Phase 4: Stock Levels');`  
          
        `const stockResult = await this.importStock(config.businessId, token, syncRunId, config);`  
        `itemsFetched += stockResult.fetched;`  
        `itemsCreated += stockResult.created;`  
      `}`  
        
      `// Phase 5: Optional Data`  
      `if (config.importPrices) {`  
        `console.log('💰 Phase 5: Prices');`  
          
        `const pricesResult = await this.importPrices(config.businessId, token, syncRunId);`  
        `itemsFetched += pricesResult.fetched;`  
        `itemsCreated += pricesResult.created;`  
      `}`  
        
      `// Post-processing`  
      `console.log('🔧 Post-Processing');`  
      `await this.postProcess(config.businessId, syncRunId);`  
        
      `// Logout`  
      `await this.authManager.logout();`  
        
      `// Mark sync as complete`  
      `const duration = Math.floor((Date.now() - startTime) / 1000);`  
      `await this.completeSyncRun(syncRunId, 'success', {`  
        `itemsFetched,`  
        `itemsCreated,`  
        `itemsUpdated,`  
        `itemsFailed,`  
        `duration,`  
      `});`  
        
      ``console.log(`✅ Import completed in ${duration}s`);``  
        
      `return {`  
        `success: true,`  
        `syncRunId,`  
        `summary: {`  
          `itemsFetched,`  
          `itemsCreated,`  
          `itemsUpdated,`  
          `itemsFailed,`  
          `duration,`  
        `},`  
        `errors,`  
      `};`  
        
    `} catch (error) {`  
      `console.error('❌ Import failed:', error.message);`  
        
      `await this.completeSyncRun(syncRunId, 'failed', {`  
        `error: error.message,`  
        `itemsFetched,`  
        `itemsCreated,`  
        `itemsUpdated,`  
        `itemsFailed,`  
      `});`  
        
      `return {`  
        `success: false,`  
        `syncRunId,`  
        `summary: {`  
          `itemsFetched,`  
          `itemsCreated,`  
          `itemsUpdated,`  
          `itemsFailed,`  
          `duration: Math.floor((Date.now() - startTime) / 1000),`  
        `},`  
        `errors: [{ entity: 'general', message: error.message }],`  
      `};`  
    `}`  
  `}`  
    
  `// Import methods for each entity type...`  
  `// (Implementations in next section)`  
    
  `private async createSyncRun(businessId: string, syncType: string, scope: string): Promise<string> {`  
    `` const result = await this.db.query(` ``  
      `INSERT INTO syrve_sync_runs (business_id, sync_type, scope, status, started_at)`  
      `VALUES ($1, $2, $3, 'running', NOW())`  
      `RETURNING id`  
    `` `, [businessId, syncType, scope]); ``  
      
    `return result.rows[0].id;`  
  `}`  
    
  `private async completeSyncRun(syncRunId: string, status: string, summary: any): Promise<void> {`  
    `` await this.db.query(` ``  
      `UPDATE syrve_sync_runs`  
      `SET`  
        `status = $1,`  
        `finished_at = NOW(),`  
        `duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,`  
        `items_fetched = $2,`  
        `items_created = $3,`  
        `items_updated = $4,`  
        `items_failed = $5,`  
        `summary = $6`  
      `WHERE id = $7`  
    `` `, [ ``  
      `status,`  
      `summary.itemsFetched || 0,`  
      `summary.itemsCreated || 0,`  
      `summary.itemsUpdated || 0,`  
      `summary.itemsFailed || 0,`  
      `JSON.stringify(summary),`  
      `syncRunId,`  
    `]);`  
  `}`  
    
  `private async importMeasurementUnits(businessId: string, token: string, syncRunId: string): Promise<{ fetched: number; created: number }> {`  
    `// Implementation in next section`  
    `return { fetched: 0, created: 0 };`  
  `}`  
    
  `private async importOrganizations(businessId: string, token: string, syncRunId: string): Promise<{ fetched: number; created: number }> {`  
    `// Implementation in next section`  
    `return { fetched: 0, created: 0 };`  
  `}`  
    
  `// ... other import methods`  
    
  `private async postProcess(businessId: string, syncRunId: string): Promise<void> {`  
    `// Verify relationships, update statistics, etc.`  
  `}`  
`}`

`export default SyrveImportOrchestrator;`

---

**\[DOCUMENT CONTINUES IN NEXT PART DUE TO LENGTH LIMIT\]**

This is Part 1 of the Phase 1.1 specification. Would you like me to continue with:

* Part 2: Detailed import implementations for each entity  
* Part 3: Error handling, testing, and deployment  
* Or would you prefer a summary document combining all sections?

