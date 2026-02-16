Here is a draft “mini‑spec” you can drop into your project docs. It focuses on the `/api/v2/entities/list` pattern and on stock APIs, with a wine‑centric but general design.

***

## Overview

This document describes the main Syrve (iiko) Server APIs needed for your SaaS inventory platform, with focus on:

- Reference data import via `{{server-url}}/api/v2/entities/list`.
- Practical description of fields that matter for the platform.
- English naming for the “basic type codes” from the iiko docs.
- APIs to read available stock for products by warehouse. [en.syrve](https://en.syrve.help/home/en-us/)

All URL examples assume an authenticated session token in `key={{session-token}}`.

***

## Conventions

- `{{server-url}}` – base URL of the Syrve on‑prem server (or tunnel) you connect to, e.g. `https://syrve.example.com/resto`.  
- `{{session-token}}` – session key received from the login/auth endpoint (your existing auth flow).  
- All reference calls use the same endpoint, only `rootType` changes:

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType={{RootTypeName}}
```

- Responses are JSON arrays of entities; each entity typically has:
  - `id` – GUID.
  - `name` – localized display name.
  - `code` or `number` – internal short code/article, if applicable.
  - `isDeleted` or `deleted` – logical deletion flag.
  - Type‑specific properties (see each section).

***

## Reference data via `/api/v2/entities/list`

### Measurement units (import on login)

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=MeasureUnit
```

**Purpose**

Load the full list of measurement units used in the organization and map them to your internal `units` table so the platform can normalize quantities (bottle, liter, glass, gram, etc.). [ru.iiko](https://ru.iiko.help)

**Key fields (typical)**

- `id` – unit identifier (GUID).
- `name` – full unit name, e.g. “Liter”.
- `shortName` – short label, e.g. “L”.
- `code` – internal unit code (string/number).
- `mainUnitId` / `isMain` – indicate base unit in a scale (e.g. “Liter” as base, “Milliliter” as derived).
- `factor` or `ratio` – conversion factor relative to main unit (e.g. 0.75 for 750 ml bottle relative to 1 L).

**Usage in platform**

- Import once at login/initial sync.
- Cache in DB and use for:
  - Display (e.g. “0.75 L” vs “1 bottle”).
  - Conversions between counting units and stock units (wine bottle ↔ ml).

***

### Organizations

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=Organization
```

**Purpose**

Load legal entities/organizations hosted on this server for multi‑tenant SaaS mapping. [en.syrve](https://en.syrve.help/home/en-us/)

**Key fields**

- `id` – organization GUID.
- `name` – legal or commercial name.
- `code` – short internal identifier.
- `isDeleted` – logical deletion flag.

**Usage**

- Link Syrve organizations to your SaaS tenants.
- Use `organizationId` as filter for further queries (stock, products, warehouses) where required.

***

### Departments / Venues

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=Department
```

**Purpose**

Represent physical venues (restaurant, bar, terrace, store) within an organization. [ru.iiko](https://ru.iiko.help)

**Key fields**

- `id` – department GUID.
- `name` – venue name.
- `organizationId` – parent organization.
- `isDeleted`.

**Usage**

- Map departments to locations in your SaaS (e.g. “Main Restaurant”, “Wine Bar”).
- Use for per‑location analytics later (wine sold/stocked by department).

***

### Warehouses / Stores

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=Store
```

(Subject to naming in the specific installation; may also appear as `Warehouse` in some configs, but the reference docs describe stores/warehouses under stock management.) [ru.iiko](https://ru.iiko.help)

**Purpose**

Load all warehouses where stock is stored: main warehouse, bar, wine cellar, kitchen, etc.

**Key fields**

- `id` – warehouse GUID.
- `name` – warehouse name (e.g. “Wine Cellar”).
- `code` – short code.
- `departmentId` – link to department, if configured.
- `isDeleted`.

**Usage**

- Map to your `locations/warehouses` table.
- Use in stock endpoints and inventory documents (your AI counting feature will be per warehouse).

***

### Product groups (catalog hierarchy)

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=ProductGroup
```

**Purpose**

Load hierarchical product groups for catalog structure (e.g. “Wine”, “Red wine”, “Portuguese wines”). [en.syrve](https://en.syrve.help/home/en-us/)

**Key fields**

- `id` – group GUID.
- `name` – group name.
- `parentId` – parent group ID (for tree building).
- `isDeleted`.

**Usage**

- Build product category tree in your admin UI.
- Wine‑focused example: `Drinks > Wine > Red > Portugal`.

***

### Products / Goods (stock items)

> Naming differs by installation; in iiko/Syrve documentation, stock items are often under “Nomenclature” or “Products” (dishes, ingredients, goods). [iiko.github](https://iiko.github.io/front.api.sdk/v7/html/Properties_T_Resto_Front_Api_Data_Assortment_IProduct.htm)

**Typical endpoints**

For raw stock items (“goods”, ingredients, bottles):

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=Product
```

In some setups, specific root types may be used for particular categories (e.g. `Good`, `Dish`, `AlcoholProduct`), but for a generalized platform treat them as products/nomenclature items and filter by type flags in the payload. [iiko.github](https://iiko.github.io/front.api.sdk/v7/html/Properties_T_Resto_Front_Api_Data_Assortment_IProduct.htm)

**Key fields (common subset)**

- `id` – product GUID.
- `name` – display name.
- `code` / `number` – article / SKU.
- `groupId` – product group.
- `measureUnitId` – stock measurement unit (links to `MeasureUnit`).
- `type` / `productType` – indicates good/dish/service/alcohol.
- `isDeleted`.
- Optional typical properties:
  - `price` – default price.
  - `barcodes` – array of barcodes.
  - `alcoholCode`, `volume` – often used for wine/spirits.

**Usage**

- Core catalog import for your SaaS.
- Filter to stock‑tracked items (exclude services, fixed menu items if needed).
- For wine‑specific behaviour, use product group + custom tags (e.g. “wine”, “sparkling”) from Syrve or store your own metadata after initial import.

***

### Contractors / Suppliers

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=Contractor
```

**Purpose**

Load suppliers (including wine distributors) for linking purchase/inventory documents. [ru.iiko](https://ru.iiko.help)

**Key fields**

- `id`.
- `name`.
- `code`.
- `type` – supplier/customer; filter to suppliers.
- `isDeleted`.

**Usage**

- Pre‑fill supplier dropdowns when creating invoices or incoming inventory from your platform.
- Future: analytics by supplier (cost, turnover).

***

### Users / Employees

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=User
```

(or `Employee` depending on exact version/translation.) [ru.iiko](https://ru.iiko.help)

**Purpose**

Sync staff identities so actions in your platform can be linked back to Syrve users if needed (e.g. who did the inventory count).

**Key fields**

- `id`.
- `name` / `fullName`.
- `code` / `tabNumber`.
- `isDeleted`.

**Usage**

- Permission mapping between SaaS users and Syrve accounts.
- Audit trail in your platform that can be reconciled with Syrve reports.

***

### Price categories / Price lists

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=PriceCategory
```

**Purpose**

Get different price levels (e.g. “Hall”, “Bar”, “Happy Hour”) if your SaaS later needs to display or calculate selling prices. [en.syrve](https://en.syrve.help/home/en-us/)

**Key fields**

- `id`.
- `name`.
- `code`.
- `isDeleted`.

**Usage**

- For later modules (pricing, menu engineering); not critical for first POC but good to define early.

***

### Taxes / VAT

**Endpoint**

```text
{{server-url}}/api/v2/entities/list?key={{session-token}}&rootType=TaxCategory
```

**Purpose**

Retrieve tax schemes so prices and stock value calculations can be reconciled with Syrve VAT reporting. [ru.iiko](https://ru.iiko.help)

**Usage**

- Mainly for advanced financial reporting modules.
- In wine‑focused flows, ensure alcohol VAT rates map correctly.

***

## Basic type codes (English naming)

The “Codes of basic types” documentation in ru.iiko.help explains how generic typed fields in entities are encoded with type codes (for example, custom properties or dynamic fields in entities). Exact numeric values are defined in that document, but for your integration design, the important part is the meaning of the types. [ru.iiko](https://ru.iiko.help)

Below is an English naming table for the typical base types used in Syrve/iiko entities (names translated from common Russian terms used in that doc and in related SDKs). [github](https://github.com/iiko/front.api.doc)

### Common base types

| Code (from doc) | Russian name (typical) | English meaning | When you’ll see it in JSON |
| ----------------| ---------------------- | ----------------| ---------------------------|
| (e.g. `String`) | `Строка`              | String          | Text fields like `name`, `code`, comments. |
| (e.g. `Int`)    | `Целое число`         | Integer         | Counters, indexes, flags stored as 0/1. |
| (e.g. `Double`) | `Число с плавающей точкой` | Floating‑point number | Quantities, prices, factors, balances. |
| (e.g. `Bool`)   | `Логический`          | Boolean         | Flags like `isDeleted`, `isActive`. |
| (e.g. `DateTime`) | `Дата и время`      | DateTime        | Document dates, stock timestamps. |
| (e.g. `Date`)   | `Дата`                | Date            | Business dates for reports, balances. |
| (e.g. `Guid`)   | `Идентификатор` / `GUID` | GUID (UUID)  | Entity IDs such as `id`, `organizationId`. |
| (e.g. `Enum`)   | `Перечисление`        | Enum            | Categorical values like product type, tax mode. |
| (e.g. `Object`) | `Составной объект`    | Complex object  | Nested structures, e.g. product group, measure unit. |
| (e.g. `Array`)  | `Массив`              | Array/list      | Collections like `barcodes`, `prices`. |

> For implementation:  
> - Treat GUIDs as strings in JSON, but with UUID validation on your side.  
> - Map `DateTime` fields to UTC timestamps in your DB; Syrve may return local time, so store raw plus normalized.  
> - For enums, keep both numeric/constant code and your own readable mapping.

### Wine‑relevant examples

- Wine bottle volume: base type is usually numeric (double) with a `MeasureUnit` reference; store as `(value, unitId)`.  
- Alcohol strength: numeric with percentage semantics; treat as `Double` with validation range 0–100.  
- Color (red/white/rose) and style (still/sparkling): represented via product group hierarchy or enum‑like custom tags; base type for those tags is frequently `String` or `Enum`. [iiko.github](https://iiko.github.io/front.api.sdk/v7/html/Properties_T_Resto_Front_Api_Data_Assortment_IProduct.htm)

For a complete set of numeric codes ↔ names, use the official “Коды базовых типов” page and extend this table with the exact codes from there, keeping English labels from the third column.

***

## Stock availability APIs

The goal is: for a given product (or list of products) and warehouse(s), obtain the current available stock on a given date/time to drive your AI inventory workflows and discrepancy checks.

There are two main families of APIs you will typically encounter in the Syrve/iiko ecosystem: [github](https://github.com/kebrick/pyiikocloudapi)

1. **Back‑office/Server stock and warehouse reports** (often under “Resto API” / `resto` paths).  
2. **Cloud warehouse stock endpoints** (if using iikoCloud, with `api/1/...` paths). [albato](https://albato.com/apps/iiko)

For your current POC (connecting to the on‑prem Syrve server), you will most likely use the server‑side stock reports.

### 1. Server stock balance by product and warehouse

Exact URL paths vary between versions and configurations, but the pattern is:

- **Method:** `GET` or `POST`.  
- **Base:** `{{server-url}}` (same as for `/api/v2/entities/list`).  
- **Purpose:** Return stock balances on a specific date, per warehouse and product. [en.syrve](https://en.syrve.help/home/en-us/)

**General design pattern**

```text
{{server-url}}/resto/api/reports/warehouse/stock?key={{session-token}}&warehouseId={{warehouse-id}}&productId={{product-id}}&date={{yyyy-MM-dd}}
```

or a similar endpoint where:

- `warehouseId` – one or many warehouse GUIDs (from `Store` entities).
- `productId` – one or many product GUIDs.
- `date` or `dateTo` – balance date/time (end of day if date only).
- Response – list of rows with fields like:
  - `productId`.
  - `warehouseId`.
  - `amount` / `quantity`.
  - `unit` (often implied by product).
  - `cost` (optional, for valuation).

> Important: the exact endpoint, parameter names, and response schema must be confirmed against the “Stock/warehouse reports” section of your Syrve server documentation or the Resto inventory API reference included with your installation. [en.syrve](https://en.syrve.help/home/en-us/)

#### How to use it in your platform

- At the start of an inventory session:
  - Request current stock for all products in the selected warehouse.
  - Cache results as `expected_qty` in your `inventory_lines`.
- After AI image recognition or manual counting:
  - Compare counted quantity vs `expected_qty`.
  - Display variances and value differences (using cost from the same or a related report).

For wine‑specific flows, filter only products in wine groups to keep payloads small.

***

### 2. Server stock list for all products in a warehouse

Some implementations expose a “stock list” endpoint that returns balances for all products in selected warehouses on a given date. [en.syrve](https://en.syrve.help/home/en-us/)

**Design example**

```text
{{server-url}}/resto/api/reports/warehouse/stockList?key={{session-token}}&warehouseId={{warehouse-id}}&date={{yyyy-MM-dd}}
```

**Usage**

- Run this at the beginning of a stock‑take:
  - Get the full theoretical stock list for a warehouse.
  - Join with your local product catalog (`Product` entities) to display friendly names and categories.
- Then your platform:
  - Applies AI recognition to identify products by label or barcode.
  - Fills in counted quantities on top of this baseline.

This is particularly powerful for wine because:

- Theoretical list is often long, but the AI‑assisted UI can quickly focus on bottles that are actually present.
- Later modules (analytics) can use this same API to reconcile periodic stock snapshots.

***

### 3. Cloud warehouse stock (for future SaaS multi‑client mode)

If you onboard clients who use iikoCloud instead of direct on‑prem connections, stock must be read via iikoCloud Transport API under `/api/1/...` endpoints. [github](https://github.com/kebrick/pyiikocloudapi)

While exact paths and schemas must be confirmed per version, typical patterns are:

- **Endpoint:** Warehouse stock list

  ```text
  {{cloud-url}}/api/1/warehouses/stock/list
  ```

  - Method: `POST`.
  - Body parameters usually include:
    - `organizationIds` – one or many org IDs.
    - `warehouseIds` – one or many warehouse IDs.
    - `productIds` – optional filter to specific products.
    - `balanceDate` – stock date/time.
  - Response: list of objects with product, warehouse, and `balance`/`amount` fields.

- **Endpoint:** Warehouse balances by organization

  ```text
  {{cloud-url}}/api/1/warehouses/balances
  ```

  - Similar semantics; more focused on aggregated balances by org+warehouse. [github](https://github.com/kebrick/pyiikocloudapi)

**Usage in your future SaaS**

- For each tenant, store its `api_login` / auth for iikoCloud.
- Use cloud stock endpoints to populate the same `expected_qty` fields in your platform.
- The rest of the platform (AI counting, discrepancy analysis, reporting) can be identical, regardless of whether a tenant uses on‑prem Server API or cloud.

***

## Putting it together for the POC

For your current Portugal client and POC focus:

1. **On user login**
   - Call `/api/v2/entities/list` with `rootType`:
     - `MeasureUnit`, `Organization`, `Department`, `Store`, `ProductGroup`, `Product` (and optionally `Contractor`, `User`).
   - Store/refresh them in your multi‑tenant DB.

2. **Before starting an inventory session**
   - Use a stock report/stock list endpoint on `{{server-url}}` to get expected balances per product for the selected warehouse and date.

3. **During inventory with AI image recognition**
   - Use your local catalog + units to:
     - Identify product.
     - Show current expected quantity and measurement unit.
     - Accept counted units (bottles, open bottles, glasses) and convert to stock unit if needed.

4. **When posting results back to Syrve**
   - Use the existing inventory document APIs from your Resto/Syrve integration spec (incoming inventory or stock‑take documents), reusing the same product IDs, warehouse IDs, and measurement units imported above. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_ec6b3057-06e2-4e34-9ff4-57f43072be74/357ce83f-a473-48ab-a8b8-b5082d2be426/Documents.md)

This gives a solid base for both the current wine use‑case and general inventory for future SaaS clients.