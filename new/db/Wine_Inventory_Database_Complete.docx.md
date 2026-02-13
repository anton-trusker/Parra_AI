**Wine Inventory Management System**

Complete Database Structure & Schema Documentation

**Version:** 1.0

**Date:** February 9, 2026

**Database:** PostgreSQL 15+

# Table of Contents

1\. Database Overview

2\. Design Principles & Naming Conventions

3\. Wines Table \- Complete Structure

4\. Wine Related Tables

5\. Inventory Management Tables

6\. User Management Tables

7\. Image & Media Tables

8\. Audit & Logging Tables

9\. Syrve Integration Tables

10\. Indexes & Performance

11\. Constraints & Business Rules

12\. Stored Procedures & Functions

13\. Views & Materialized Views

14\. Triggers

15\. Entity Relationship Diagram

# 1\. Database Overview

## 1.1 Architecture

The Wine Inventory Management System uses PostgreSQL 15+ as its primary database with the following characteristics:

• Character Set: UTF8

• Collation: utf8\_unicode\_ci

• Primary Keys: UUID v4 for global uniqueness

• Timestamps: All timestamps in UTC using timestamptz type

• Normalization: 3rd Normal Form (3NF)

• Audit Trail: Complete tracking of all changes

## 1.2 Core Table Groups

| Group | Tables | Purpose |
| ----- | ----- | ----- |
| Wine Management | wines, wine\_variants, wine\_producers, wine\_barcodes, wine\_images | Complete wine catalog with all details |
| Inventory | inventory\_sessions, inventory\_items, inventory\_movements, stock\_snapshots | Physical inventory tracking |
| User Management | users, user\_sessions, user\_activity\_log | Authentication and permissions |
| Integration | syrve\_config, wine\_syrve\_product\_mappings, syrve\_sync\_logs | Syrve/iiko integration |
| Media | uploaded\_files, scanned\_images | Image and file storage |
| Audit | audit\_logs, error\_logs, system\_notifications | Complete audit trail |

# 2\. Design Principles & Naming Conventions

## 2.1 Naming Conventions

| Element | Convention | Example |
| ----- | ----- | ----- |
| Tables | Plural, snake\_case | wines, inventory\_sessions |
| Columns | Singular, snake\_case | wine\_id, created\_at |
| Primary Keys | id (UUID) | id UUID PRIMARY KEY |
| Foreign Keys | {table}\_id | wine\_id, user\_id |
| Indexes | idx\_{table}\_{column(s)} | idx\_wines\_vintage |
| Unique Indexes | uk\_{table}\_{column(s)} | uk\_users\_email |
| Check Constraints | chk\_{table}\_{column}\_{rule} | chk\_wines\_vintage\_range |
| Triggers | trg\_{table}\_{event}\_{action} | trg\_wines\_after\_insert |
| Functions | fn\_{purpose} | fn\_calculate\_stock\_value |

## 2.2 Core Design Principles

1\. Soft Deletes: Use deleted\_at timestamps instead of hard deletes

2\. Audit Timestamps: Every table has created\_at, updated\_at, created\_by, updated\_by

3\. Referential Integrity: Foreign keys with appropriate CASCADE/RESTRICT rules

4\. JSONB for Flexibility: Use JSONB for dynamic/flexible data like metadata, settings

5\. Generated Columns: Use GENERATED ALWAYS AS for calculated fields

6\. Partial Indexes: Index only active/relevant rows for performance

# 3\. Wines Table \- Complete Structure

The wines table is the core of the system containing comprehensive details about each wine product.

## 3.1 Primary Key & Basic Information

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| id | UUID | PRIMARY KEY | Unique wine identifier (UUID v4) |
| name | VARCHAR(255) | NOT NULL | Wine name/label |
| full\_name | TEXT |  | Full descriptive name |
| producer | VARCHAR(255) | NOT NULL | Producer/winery name |
| producer\_slug | VARCHAR(255) |  | URL-friendly producer name |
| estate | VARCHAR(255) |  | Winery/Estate (if different from producer) |

## 3.2 Classification

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| wine\_type | VARCHAR(50) | NOT NULL | Type: red, white, rose, sparkling, fortified, dessert, other |
| wine\_category | VARCHAR(50) |  | Category: still, sparkling, fortified |
| wine\_style | VARCHAR(100) |  | Style: dry, off-dry, sweet, semi-sweet |
| primary\_grape | VARCHAR(100) |  | Dominant grape variety |
| grape\_varieties | JSONB |  | Array of grapes with percentages |

## 3.3 Vintage & Aging

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| vintage | INTEGER | 1800-2100 | Vintage year (NULL for non-vintage) |
| is\_non\_vintage | BOOLEAN | DEFAULT false | Non-vintage wine flag |
| bottling\_date | DATE |  | Date wine was bottled |
| release\_date | DATE |  | Date wine was released to market |
| optimal\_drinking\_start | INTEGER |  | Year optimal drinking starts |
| optimal\_drinking\_end | INTEGER |  | Year optimal drinking ends |
| aging\_potential\_years | INTEGER |  | Number of years wine can age |

## 3.4 Origin & Geography

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| country | VARCHAR(100) | NOT NULL | Country of origin |
| country\_code | CHAR(2) |  | ISO 3166-1 alpha-2 code |
| region | VARCHAR(255) |  | Wine region (e.g., Bordeaux, Tuscany) |
| sub\_region | VARCHAR(255) |  | Sub-region (e.g., Margaux, Chianti) |
| appellation | VARCHAR(255) |  | Official appellation (AOC, DOC, AVA) |
| vineyard | VARCHAR(255) |  | Specific vineyard/lieu-dit |
| terroir | TEXT |  | Soil type, climate description |

## 3.5 Product Details

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| volume\_ml | INTEGER | NOT NULL, \> 0 | Bottle volume in ml (375, 750, 1500, etc.) |
| volume\_label | VARCHAR(50) |  | Label: Half Bottle, Standard, Magnum |
| bottle\_size | VARCHAR(50) |  | Size name: Half, Magnum, Jeroboam, etc. |
| alcohol\_content | DECIMAL(4,2) | 0-100 | Alcohol by volume (% ABV) |
| residual\_sugar | DECIMAL(6,2) |  | Residual sugar in g/L |
| total\_acidity | DECIMAL(5,2) |  | Total acidity in g/L |
| ph\_level | DECIMAL(3,2) |  | pH level of the wine |

## 3.6 Closure & Packaging

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| closure\_type | VARCHAR(50) |  | Type: cork, screw\_cap, glass, synthetic |
| bottle\_color | VARCHAR(50) |  | Color: dark\_green, clear, amber |
| capsule\_type | VARCHAR(50) |  | Capsule: tin, plastic, wax |
| label\_design | VARCHAR(100) |  | Design: traditional, modern, artistic |

## 3.7 Pricing

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| purchase\_price | DECIMAL(10,2) | \>= 0 | Cost price per bottle |
| sale\_price | DECIMAL(10,2) | \>= 0 | Selling price per bottle |
| retail\_price | DECIMAL(10,2) | \>= 0 | Suggested retail price |
| currency | VARCHAR(3) | DEFAULT 'EUR' | Currency code (ISO 4217\) |
| price\_tier | VARCHAR(50) |  | Tier: budget, mid-range, premium, luxury |
| glass\_price | DECIMAL(10,2) |  | By-the-glass price |
| glass\_pour\_size\_ml | INTEGER | DEFAULT 150 | Standard glass pour size |
| available\_by\_glass | BOOLEAN | DEFAULT false | Available for glass service |

## 3.8 Stock Management

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| current\_stock\_unopened | INTEGER | NOT NULL, \>= 0 | Count of unopened bottles |
| current\_stock\_opened | INTEGER | NOT NULL, \>= 0 | Count of opened bottles (BTG) |
| min\_stock\_level | INTEGER | DEFAULT 12 | Minimum stock threshold |
| max\_stock\_level | INTEGER |  | Maximum stock capacity |
| reorder\_point | INTEGER |  | When to trigger reorder |
| reorder\_quantity | INTEGER |  | Standard reorder quantity |
| stock\_status | VARCHAR(50) |  | Status: in\_stock, low\_stock, out\_of\_stock |

## 3.9 Internal Management

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| sku | VARCHAR(100) | UNIQUE | Internal SKU/Product Code |
| internal\_code | VARCHAR(50) |  | Alternative internal code |
| bin\_location | VARCHAR(100) |  | Physical storage location |
| cellar\_section | VARCHAR(50) |  | Cellar section (e.g., Section A) |
| rack\_number | VARCHAR(20) |  | Rack number |
| shelf\_position | VARCHAR(20) |  | Shelf position on rack |

## 3.10 Supplier Information

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| supplier\_id | UUID | FK suppliers(id) | Reference to supplier |
| supplier\_sku | VARCHAR(100) |  | Supplier's product code |
| supplier\_name | VARCHAR(255) |  | Supplier name (denormalized) |
| last\_purchase\_date | DATE |  | Date of last purchase |
| last\_purchase\_quantity | INTEGER |  | Quantity of last purchase |
| last\_purchase\_price | DECIMAL(10,2) |  | Price of last purchase |

## 3.11 Tasting & Quality

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| tasting\_notes | TEXT |  | Detailed tasting notes (rich text/HTML) |
| tasting\_notes\_short | VARCHAR(500) |  | Brief tasting summary |
| color\_description | VARCHAR(255) |  | Color: Deep ruby, Pale straw, Golden amber |
| nose\_aromas | TEXT |  | Aromas: Black cherry, vanilla, tobacco |
| palate\_flavors | TEXT |  | Flavors on the palate |
| finish\_description | VARCHAR(500) |  | Description of the finish |
| body | VARCHAR(50) |  | Body: light, medium, full |
| tannins | VARCHAR(50) |  | Tannins: soft, medium, firm, grippy |
| sweetness | VARCHAR(50) |  | Sweetness level |
| acidity | VARCHAR(50) |  | Acidity: low, medium, high |

## 3.12 Ratings & Reviews

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| internal\_rating | DECIMAL(3,2) | 0.00-10.00 | Internal rating (0-10 scale) |
| critic\_scores | JSONB |  | Array of professional critic scores |
| average\_critic\_score | DECIMAL(5,2) |  | Average of all critic scores |
| wine\_advocate\_score | INTEGER |  | Robert Parker / Wine Advocate score |
| wine\_spectator\_score | INTEGER |  | Wine Spectator rating |
| decanter\_score | INTEGER |  | Decanter World Wine Awards score |
| jancis\_robinson\_score | DECIMAL(4,2) |  | Jancis Robinson rating |

## 3.13 Food Pairing

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| food\_pairing | TEXT |  | Recommended food pairings (text) |
| food\_pairing\_tags | JSONB |  | Array of pairing tags: \[beef, cheese, etc.\] |
| serving\_temperature\_min | INTEGER |  | Minimum serving temperature (Celsius) |
| serving\_temperature\_max | INTEGER |  | Maximum serving temperature (Celsius) |
| decanting\_time\_minutes | INTEGER |  | Recommended decanting time |

## 3.14 Production Information

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| production\_method | VARCHAR(100) |  | Method: Traditional, Charmat, etc. |
| fermentation\_vessel | VARCHAR(100) |  | Vessel: Stainless steel, Oak barrel |
| aging\_vessel | VARCHAR(100) |  | Aging vessel: French oak, Steel |
| oak\_aging\_months | INTEGER |  | Months aged in oak |
| oak\_type | VARCHAR(50) |  | Oak type: French, American, Hungarian |
| oak\_toast\_level | VARCHAR(50) |  | Toast level: Light, Medium, Heavy |
| malolactic\_fermentation | BOOLEAN |  | MLF performed or not |
| cases\_produced | INTEGER |  | Number of cases produced |
| bottles\_produced | INTEGER |  | Total bottles produced |
| production\_volume\_liters | INTEGER |  | Production volume in liters |
| is\_limited\_edition | BOOLEAN | DEFAULT false | Limited edition flag |

## 3.15 Certifications & Awards

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| certifications | JSONB |  | Array: \[Organic, Biodynamic, Sustainable\] |
| is\_organic | BOOLEAN | DEFAULT false | Organic certification flag |
| is\_biodynamic | BOOLEAN | DEFAULT false | Biodynamic certification flag |
| is\_natural | BOOLEAN | DEFAULT false | Natural wine flag |
| is\_vegan | BOOLEAN | DEFAULT false | Vegan-friendly flag |
| awards | JSONB |  | Array of awards with details |

## 3.16 Import & Legal

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| importer | VARCHAR(255) |  | Importer name |
| distributor | VARCHAR(255) |  | Distributor name |
| import\_date | DATE |  | Date imported |
| country\_of\_origin | VARCHAR(100) |  | Country of origin |
| contains\_sulfites | BOOLEAN | DEFAULT true | Contains sulfites flag |
| allergen\_info | TEXT |  | Allergen information |
| health\_warnings | TEXT |  | Required health warnings |
| alcohol\_warning\_required | BOOLEAN | DEFAULT true | Warning required flag |

## 3.17 Barcode Information

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| primary\_barcode | VARCHAR(50) |  | Main barcode (EAN-13/UPC) |
| barcode\_type | VARCHAR(20) |  | Type: EAN-13, UPC-A, Code-128 |
| alternative\_barcodes | JSONB |  | Additional barcodes (JSONB array) |

## 3.18 Marketing & Display

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| marketing\_description | TEXT |  | Customer-facing description |
| short\_description | VARCHAR(500) |  | Brief description for menus |
| story | TEXT |  | Winery story, history |
| winemaker\_name | VARCHAR(255) |  | Winemaker's name |
| winemaker\_bio | TEXT |  | Winemaker biography |
| vintage\_story | TEXT |  | Story of this specific vintage |
| featured\_wine | BOOLEAN | DEFAULT false | Featured on wine list |
| wine\_list\_position | INTEGER |  | Display order on menu |
| wine\_list\_category | VARCHAR(100) |  | Category: House, Premium, Rare |

## 3.19 Online & Digital

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| website\_url | VARCHAR(500) |  | Winery website |
| wine\_searcher\_url | VARCHAR(500) |  | Wine-Searcher.com link |
| vivino\_url | VARCHAR(500) |  | Vivino link |
| cellartracker\_url | VARCHAR(500) |  | CellarTracker link |
| instagram\_handle | VARCHAR(100) |  | Instagram username |

## 3.20 Metadata & Search

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| tags | JSONB |  | Array of tags: \[bold, elegant, age-worthy\] |
| internal\_notes | TEXT |  | Staff-only notes |
| private\_notes | TEXT |  | Admin-only notes |
| special\_handling | TEXT |  | Storage/serving instructions |
| search\_keywords | TEXT |  | Pre-computed search keywords |
| slug | VARCHAR(255) | UNIQUE | URL-friendly slug |
| meta\_title | VARCHAR(255) |  | SEO meta title |
| meta\_description | TEXT |  | SEO meta description |

## 3.21 Status & Lifecycle

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| is\_active | BOOLEAN | DEFAULT true | Active in system |
| is\_discontinued | BOOLEAN | DEFAULT false | Discontinued flag |
| is\_archived | BOOLEAN | DEFAULT false | Archived flag |
| discontinuation\_date | DATE |  | Date discontinued |
| discontinuation\_reason | TEXT |  | Reason for discontinuation |
| replacement\_wine\_id | UUID | FK wines(id) | Replacement wine |

## 3.22 Audit Fields

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| created\_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| created\_by | UUID | FK users(id) | User who created |
| updated\_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| updated\_by | UUID | FK users(id) | User who last updated |
| deleted\_at | TIMESTAMPTZ |  | Soft delete timestamp |
| deleted\_by | UUID | FK users(id) | User who deleted |

# 4\. Wine Related Tables

## 4.1 Wine Variants Table

Manages different variants of the same wine (different vintages, volumes, or bottle states).

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Variant identifier |
| base\_wine\_id | UUID NOT NULL FK | Reference to parent wine |
| vintage | INTEGER | Vintage year (can differ from parent) |
| volume\_ml | INTEGER NOT NULL | Bottle volume |
| bottle\_state | VARCHAR(20) | unopened or opened |
| variant\_name | VARCHAR(255) | E.g., 2019 Magnum Unopened |
| variant\_sku | VARCHAR(100) UNIQUE | Variant-specific SKU |
| variant\_barcode | VARCHAR(50) | Variant-specific barcode |
| current\_stock | INTEGER DEFAULT 0 | Current stock for this variant |
| min\_stock\_level | INTEGER | Minimum stock level |
| purchase\_price | DECIMAL(10,2) | Variant purchase price |
| sale\_price | DECIMAL(10,2) | Variant sale price |
| syrve\_product\_id | VARCHAR(255) | Linked Syrve product ID |
| is\_active | BOOLEAN DEFAULT true | Active status |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| updated\_at | TIMESTAMPTZ | Update timestamp |

## 4.2 Wine Producers Table

Stores information about wine producers, wineries, and estates.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Producer identifier |
| name | VARCHAR(255) NOT NULL UNIQUE | Producer name |
| legal\_name | VARCHAR(255) | Legal business name |
| slug | VARCHAR(255) UNIQUE | URL-friendly slug |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Phone number |
| website | VARCHAR(500) | Website URL |
| address\_line1 | VARCHAR(255) | Street address |
| city | VARCHAR(100) | City |
| country | VARCHAR(100) | Country |
| founded\_year | INTEGER | Year founded |
| description | TEXT | Producer description |
| winemaker | VARCHAR(255) | Head winemaker |
| total\_hectares | DECIMAL(10,2) | Total vineyard hectares |
| certifications | JSONB | Array of certifications |
| is\_organic | BOOLEAN | Organic certified |
| is\_biodynamic | BOOLEAN | Biodynamic certified |
| logo\_url | VARCHAR(500) | Logo image URL |

## 4.3 Grape Varieties Table

Master list of grape varieties with characteristics.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Grape variety identifier |
| name | VARCHAR(100) NOT NULL UNIQUE | Grape variety name |
| alternate\_names | JSONB | Array of alternate names |
| color | VARCHAR(20) | Grape color: red, white, pink |
| type | VARCHAR(50) | Type: wine, table, dual-purpose |
| origin\_country | VARCHAR(100) | Country of origin |
| origin\_region | VARCHAR(255) | Region of origin |
| typical\_characteristics | TEXT | Typical characteristics |
| flavor\_profile | TEXT | Flavor profile description |
| aromas | TEXT | Typical aromas |
| climate\_preference | VARCHAR(100) | Climate preference |
| is\_common | BOOLEAN | Commonly used flag |

## 4.4 Wine Barcodes Table

Multiple barcodes per wine for different packaging or regions.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Barcode record identifier |
| wine\_id | UUID NOT NULL FK | Reference to wine |
| barcode | VARCHAR(50) NOT NULL | Barcode value |
| barcode\_type | VARCHAR(20) NOT NULL | Type: EAN-13, UPC-A, Code-128, QR |
| region | VARCHAR(100) | Geographic region for this barcode |
| distributor | VARCHAR(255) | Specific distributor |
| packaging | VARCHAR(50) | Packaging: single, 6-pack, case |
| is\_primary | BOOLEAN DEFAULT false | Primary barcode flag |
| is\_active | BOOLEAN DEFAULT true | Active status |
| added\_at | TIMESTAMPTZ | When barcode was added |
| added\_by | UUID FK | User who added |
| notes | TEXT | Additional notes |

## 4.5 Wine Images Table

Wine label images, bottle photos, and captured scans.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Image identifier |
| wine\_id | UUID NOT NULL FK | Reference to wine |
| image\_url | VARCHAR(500) NOT NULL | Image URL |
| image\_path | VARCHAR(500) | Local file system path |
| storage\_provider | VARCHAR(50) | s3, cloudinary, or local |
| storage\_key | VARCHAR(255) | Provider-specific key |
| filename | VARCHAR(255) | Current filename |
| original\_filename | VARCHAR(255) | Original filename |
| mime\_type | VARCHAR(100) | MIME type |
| file\_size\_bytes | INTEGER | File size in bytes |
| width\_px | INTEGER | Image width |
| height\_px | INTEGER | Image height |
| image\_type | VARCHAR(50) | Type: label\_front, bottle\_full, etc. |
| is\_primary | BOOLEAN | Primary image flag |
| display\_order | INTEGER | Display order |
| source | VARCHAR(50) | Source: admin\_upload, staff\_scan, ai\_capture |
| captured\_during\_inventory | BOOLEAN | Captured during inventory |
| inventory\_session\_id | UUID FK | Inventory session reference |
| ai\_confidence\_score | DECIMAL(5,4) | AI recognition confidence |
| ai\_recognition\_successful | BOOLEAN | AI recognition success |
| ocr\_text | TEXT | Extracted text from OCR |
| is\_approved | BOOLEAN | Approval status |
| uploaded\_by | UUID FK | User who uploaded |
| uploaded\_at | TIMESTAMPTZ | Upload timestamp |

## 4.6 Suppliers Table

Wine suppliers and vendors information.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Supplier identifier |
| name | VARCHAR(255) NOT NULL | Supplier name |
| legal\_name | VARCHAR(255) | Legal business name |
| tax\_id | VARCHAR(100) | Tax ID number |
| contact\_person | VARCHAR(255) | Contact person name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Phone number |
| website | VARCHAR(500) | Website URL |
| address\_line1 | VARCHAR(255) | Street address |
| city | VARCHAR(100) | City |
| country | VARCHAR(100) | Country |
| payment\_terms | VARCHAR(100) | Payment terms: Net 30, Net 60 |
| minimum\_order\_amount | DECIMAL(10,2) | Minimum order amount |
| currency | VARCHAR(3) | Currency code |
| supplier\_type | VARCHAR(50) | Type: importer, distributor, direct |
| is\_preferred | BOOLEAN | Preferred supplier flag |
| is\_active | BOOLEAN | Active status |
| quality\_rating | DECIMAL(3,2) | Quality rating (1-5) |
| delivery\_rating | DECIMAL(3,2) | Delivery rating (1-5) |

# 5\. Inventory Management Tables

## 5.1 Inventory Sessions Table

Tracks physical inventory counting sessions.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Session identifier |
| session\_name | VARCHAR(255) | Session name/description |
| session\_type | VARCHAR(50) | Type: full, partial, spot\_check |
| description | TEXT | Detailed description |
| status | VARCHAR(50) | Status: draft, in\_progress, completed |
| location\_filter | VARCHAR(255) | Filter by location |
| wine\_filter | JSONB | Applied filters (type, region) |
| total\_wines\_expected | INTEGER | Expected wine count |
| total\_wines\_counted | INTEGER | Actual wine count |
| started\_at | TIMESTAMPTZ | Session start time |
| completed\_at | TIMESTAMPTZ | Session completion time |
| duration\_minutes | INTEGER | Duration in minutes |
| started\_by | UUID FK | User who started |
| completed\_by | UUID FK | User who completed |
| total\_items | INTEGER | Total inventory items |
| total\_variances | INTEGER | Total variances found |
| total\_shortage | INTEGER | Total shortage quantity |
| total\_excess | INTEGER | Total excess quantity |
| variance\_value | DECIMAL(10,2) | Total value of variances |
| synced\_with\_syrve | BOOLEAN | Synced to Syrve flag |
| syrve\_sync\_at | TIMESTAMPTZ | Syrve sync timestamp |
| syrve\_document\_id | VARCHAR(255) | Syrve document ID |
| notes | TEXT | Session notes |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| updated\_at | TIMESTAMPTZ | Update timestamp |

## 5.2 Inventory Items Table

Individual wine counts within an inventory session.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Item identifier |
| session\_id | UUID NOT NULL FK | Inventory session reference |
| wine\_id | UUID NOT NULL FK | Wine reference |
| variant\_id | UUID FK | Wine variant reference (optional) |
| expected\_quantity\_unopened | INTEGER | Expected unopened bottles |
| expected\_quantity\_opened | INTEGER | Expected opened bottles |
| counted\_quantity\_unopened | INTEGER | Counted unopened bottles |
| counted\_quantity\_opened | INTEGER | Counted opened bottles |
| variance\_unopened | INTEGER GENERATED | Calculated variance (unopened) |
| variance\_opened | INTEGER GENERATED | Calculated variance (opened) |
| total\_variance | INTEGER GENERATED | Total variance |
| count\_status | VARCHAR(50) | Status: pending, counted, verified |
| has\_variance | BOOLEAN GENERATED | Has variance flag |
| counted\_at | TIMESTAMPTZ | Counting timestamp |
| counted\_by | UUID FK | User who counted |
| counting\_method | VARCHAR(50) | Method: manual, barcode, image |
| counting\_duration\_seconds | INTEGER | Time taken to count |
| verified\_at | TIMESTAMPTZ | Verification timestamp |
| verified\_by | UUID FK | User who verified |
| notes | TEXT | Item notes |
| issue\_type | VARCHAR(100) | Issue: damaged, expired, etc. |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| updated\_at | TIMESTAMPTZ | Update timestamp |

## 5.3 Inventory Movements Table

Detailed log of every stock change with complete audit trail.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Movement identifier |
| session\_id | UUID FK | Inventory session (if applicable) |
| wine\_id | UUID NOT NULL FK | Wine reference |
| variant\_id | UUID FK | Variant reference (optional) |
| movement\_type | VARCHAR(50) | Type: count\_adjustment, sale, purchase |
| bottle\_state | VARCHAR(20) | State: unopened, opened |
| quantity\_before | INTEGER NOT NULL | Stock before movement |
| quantity\_change | INTEGER NOT NULL | Change amount (+/-) |
| quantity\_after | INTEGER NOT NULL | Stock after movement |
| unit\_cost | DECIMAL(10,2) | Unit cost |
| total\_value | DECIMAL(10,2) | Total value of movement |
| reason | TEXT | Reason for movement |
| reference\_number | VARCHAR(100) | Reference: invoice, PO number |
| location | VARCHAR(255) | Physical location |
| recording\_method | VARCHAR(50) | Method: manual, barcode, image, api |
| captured\_image\_id | UUID FK | Captured image reference |
| barcode\_scanned | VARCHAR(50) | Scanned barcode |
| ai\_confidence\_score | DECIMAL(5,4) | AI confidence |
| syrve\_document\_id | VARCHAR(255) | Syrve document ID |
| synced\_to\_syrve | BOOLEAN | Synced to Syrve flag |
| synced\_at | TIMESTAMPTZ | Sync timestamp |
| performed\_by | UUID NOT NULL FK | User who performed |
| performed\_at | TIMESTAMPTZ NOT NULL | Performance timestamp |
| is\_reversal | BOOLEAN | Reversal flag |
| reverses\_movement\_id | UUID FK | Original movement ID |
| notes | TEXT | Movement notes |
| metadata | JSONB | Additional metadata |
| created\_at | TIMESTAMPTZ | Creation timestamp |

## 5.4 Stock Snapshots Table

Periodic snapshots of stock levels for historical reporting.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Snapshot identifier |
| snapshot\_date | DATE NOT NULL | Snapshot date |
| snapshot\_time | TIMESTAMPTZ NOT NULL | Snapshot timestamp |
| wine\_id | UUID NOT NULL FK | Wine reference |
| stock\_unopened | INTEGER NOT NULL | Unopened stock at snapshot |
| stock\_opened | INTEGER NOT NULL | Opened stock at snapshot |
| total\_stock | INTEGER GENERATED | Total stock (calculated) |
| unit\_cost | DECIMAL(10,2) | Unit cost at time |
| total\_value | DECIMAL(10,2) GENERATED | Total value (calculated) |
| snapshot\_type | VARCHAR(50) | Type: daily, weekly, monthly |
| triggered\_by | VARCHAR(50) | Trigger: system, inventory, manual |
| session\_id | UUID FK | Inventory session (if applicable) |
| created\_at | TIMESTAMPTZ | Creation timestamp |

# 6\. User Management & Authentication

## 6.1 Users Table

Application users with roles and permissions.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | User identifier |
| email | VARCHAR(255) NOT NULL UNIQUE | User email (login) |
| password\_hash | VARCHAR(255) NOT NULL | Bcrypt password hash |
| password\_salt | VARCHAR(255) | Password salt |
| password\_changed\_at | TIMESTAMPTZ | Last password change |
| first\_name | VARCHAR(100) NOT NULL | First name |
| last\_name | VARCHAR(100) NOT NULL | Last name |
| full\_name | VARCHAR(255) GENERATED | Full name (calculated) |
| display\_name | VARCHAR(255) | Display name |
| role | VARCHAR(50) NOT NULL | Role: admin, staff, viewer |
| permissions | JSONB | Granular permissions array |
| phone | VARCHAR(50) | Phone number |
| avatar\_url | VARCHAR(500) | Avatar image URL |
| avatar\_color | VARCHAR(7) | Avatar background color (hex) |
| employee\_id | VARCHAR(50) | Employee ID |
| department | VARCHAR(100) | Department |
| job\_title | VARCHAR(100) | Job title |
| hire\_date | DATE | Hire date |
| is\_active | BOOLEAN DEFAULT true | Active status |
| is\_verified | BOOLEAN | Email verified |
| is\_locked | BOOLEAN | Account locked |
| failed\_login\_attempts | INTEGER | Failed login count |
| last\_login\_at | TIMESTAMPTZ | Last login time |
| last\_login\_ip | VARCHAR(45) | Last login IP |
| two\_factor\_enabled | BOOLEAN | 2FA enabled |
| language | VARCHAR(10) | Preferred language |
| timezone | VARCHAR(100) | Timezone |
| preferences | JSONB | User preferences |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| updated\_at | TIMESTAMPTZ | Update timestamp |
| deleted\_at | TIMESTAMPTZ | Soft delete timestamp |

## 6.2 User Sessions Table

Active user sessions for authentication and tracking.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Session identifier |
| user\_id | UUID NOT NULL FK | User reference |
| token\_hash | VARCHAR(255) UNIQUE | Hashed JWT token |
| refresh\_token\_hash | VARCHAR(255) | Hashed refresh token |
| session\_type | VARCHAR(50) | Type: web, mobile, api |
| device\_type | VARCHAR(50) | Device: mobile, tablet, desktop |
| device\_name | VARCHAR(255) | Device name |
| browser | VARCHAR(100) | Browser name |
| browser\_version | VARCHAR(50) | Browser version |
| operating\_system | VARCHAR(100) | Operating system |
| ip\_address | VARCHAR(45) | IP address |
| user\_agent | TEXT | User agent string |
| gps\_location | JSONB | GPS coordinates |
| created\_at | TIMESTAMPTZ | Session creation |
| expires\_at | TIMESTAMPTZ NOT NULL | Session expiration |
| last\_activity\_at | TIMESTAMPTZ | Last activity |
| is\_active | BOOLEAN | Active status |
| revoked\_at | TIMESTAMPTZ | Revocation time |
| revoked\_by | UUID FK | User who revoked |
| revoked\_reason | TEXT | Revocation reason |

## 6.3 User Activity Log

Track all user actions for audit purposes.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Log identifier |
| user\_id | UUID FK | User reference |
| session\_id | UUID FK | Session reference |
| action | VARCHAR(100) NOT NULL | Action: login, create\_wine, update\_stock |
| entity\_type | VARCHAR(50) | Entity type: wine, session, user |
| entity\_id | UUID | Entity identifier |
| description | TEXT | Action description |
| changes | JSONB | Before/after values |
| ip\_address | VARCHAR(45) | IP address |
| user\_agent | TEXT | User agent |
| success | BOOLEAN | Success flag |
| error\_message | TEXT | Error message (if failed) |
| performed\_at | TIMESTAMPTZ | Action timestamp |
| duration\_ms | INTEGER | Duration in milliseconds |

# 7\. Audit & Logging Tables

## 7.1 Audit Logs Table

Comprehensive audit trail for all system changes.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Audit log identifier |
| user\_id | UUID FK | User who performed action |
| session\_id | UUID FK | Session reference |
| action | VARCHAR(100) NOT NULL | Action: CREATE, UPDATE, DELETE |
| entity\_type | VARCHAR(50) NOT NULL | Table or entity type |
| entity\_id | UUID | Entity identifier |
| entity\_name | VARCHAR(255) | Human-readable identifier |
| old\_values | JSONB | Previous state (updates/deletes) |
| new\_values | JSONB | New state (creates/updates) |
| changed\_fields | TEXT\[\] | Array of changed field names |
| description | TEXT | Action description |
| reason | TEXT | Reason for action |
| ip\_address | VARCHAR(45) | IP address |
| user\_agent | TEXT | User agent |
| request\_id | VARCHAR(100) | Request correlation ID |
| success | BOOLEAN | Success flag |
| error\_message | TEXT | Error message (if failed) |
| performed\_at | TIMESTAMPTZ | Action timestamp |
| metadata | JSONB | Additional metadata |

## 7.2 Error Logs Table

Application error logging and tracking.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Error log identifier |
| error\_type | VARCHAR(100) NOT NULL | Type: database, api, auth, validation |
| error\_code | VARCHAR(50) | Error code |
| error\_message | TEXT NOT NULL | Error message |
| error\_stack | TEXT | Stack trace |
| user\_id | UUID FK | User reference (if applicable) |
| session\_id | UUID FK | Session reference |
| request\_id | VARCHAR(100) | Request correlation ID |
| http\_method | VARCHAR(10) | HTTP method |
| http\_path | VARCHAR(500) | Request path |
| http\_status | INTEGER | HTTP status code |
| request\_body | JSONB | Request payload |
| response\_body | JSONB | Response payload |
| ip\_address | VARCHAR(45) | IP address |
| user\_agent | TEXT | User agent |
| environment | VARCHAR(50) | Environment: production, staging |
| severity | VARCHAR(20) | Severity: debug, info, warning, error, critical |
| resolved | BOOLEAN | Resolved flag |
| resolved\_at | TIMESTAMPTZ | Resolution timestamp |
| resolved\_by | UUID FK | User who resolved |
| resolution\_notes | TEXT | Resolution notes |
| occurred\_at | TIMESTAMPTZ | Error timestamp |
| metadata | JSONB | Additional metadata |

## 7.3 System Notifications Table

System-generated notifications for users.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Notification identifier |
| user\_id | UUID NOT NULL FK | Recipient user |
| title | VARCHAR(255) NOT NULL | Notification title |
| message | TEXT NOT NULL | Notification message |
| notification\_type | VARCHAR(50) | Type: info, success, warning, error |
| related\_entity\_type | VARCHAR(50) | Related entity type |
| related\_entity\_id | UUID | Related entity ID |
| action\_url | VARCHAR(500) | Action URL |
| is\_read | BOOLEAN | Read flag |
| read\_at | TIMESTAMPTZ | Read timestamp |
| is\_dismissed | BOOLEAN | Dismissed flag |
| dismissed\_at | TIMESTAMPTZ | Dismissal timestamp |
| priority | VARCHAR(20) | Priority: low, normal, high, urgent |
| delivery\_channel | VARCHAR(50) | Channel: in\_app, email, sms |
| sent\_via\_email | BOOLEAN | Email sent flag |
| email\_sent\_at | TIMESTAMPTZ | Email sent timestamp |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| expires\_at | TIMESTAMPTZ | Expiration timestamp |
| metadata | JSONB | Additional metadata |

# 8\. Syrve (iiko) Integration Tables

## 8.1 Syrve Configuration Table

Syrve/iiko integration configuration and settings.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | SERIAL PRIMARY KEY | Config identifier |
| organization\_id | VARCHAR(255) UNIQUE | Syrve organization ID |
| organization\_name | VARCHAR(255) | Organization name |
| api\_login\_encrypted | TEXT NOT NULL | Encrypted API login |
| base\_url | VARCHAR(255) | API base URL |
| api\_region | VARCHAR(10) | Region: eu or ru |
| last\_nomenclature\_revision | BIGINT | Last sync revision |
| last\_full\_sync\_at | TIMESTAMPTZ | Last full sync |
| last\_delta\_sync\_at | TIMESTAMPTZ | Last delta sync |
| auto\_sync\_enabled | BOOLEAN | Auto sync enabled |
| sync\_frequency\_hours | INTEGER | Sync frequency |
| enable\_stock\_sync | BOOLEAN | Stock sync enabled |
| enable\_product\_sync | BOOLEAN | Product sync enabled |
| enable\_webhooks | BOOLEAN | Webhooks enabled |
| webhook\_url | VARCHAR(500) | Webhook endpoint |
| webhook\_secret\_encrypted | TEXT | Encrypted webhook secret |
| is\_active | BOOLEAN | Active status |
| last\_error | TEXT | Last error message |
| last\_error\_at | TIMESTAMPTZ | Last error timestamp |
| configuration | JSONB | Additional configuration |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| updated\_at | TIMESTAMPTZ | Update timestamp |

## 8.2 Wine-Syrve Product Mappings Table

Maps wines to Syrve products for integration.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | SERIAL PRIMARY KEY | Mapping identifier |
| wine\_id | UUID NOT NULL FK | Wine reference |
| variant\_id | UUID FK | Variant reference (optional) |
| syrve\_product\_id | VARCHAR(255) NOT NULL | Syrve product ID |
| syrve\_product\_code | VARCHAR(100) | Syrve product code/SKU |
| syrve\_product\_name | VARCHAR(255) | Syrve product name |
| syrve\_organization\_id | VARCHAR(255) NOT NULL | Syrve organization |
| confidence\_score | DECIMAL(3,2) | Match confidence (0-1) |
| match\_method | VARCHAR(50) | Method: exact\_id, code, fuzzy\_name |
| is\_active | BOOLEAN | Active mapping |
| is\_verified | BOOLEAN | Manually verified |
| verified\_by | UUID FK | User who verified |
| verified\_at | TIMESTAMPTZ | Verification timestamp |
| mapped\_at | TIMESTAMPTZ | Mapping creation |
| mapped\_by | UUID FK | User who created mapping |
| last\_synced\_at | TIMESTAMPTZ | Last sync timestamp |
| notes | TEXT | Mapping notes |

## 8.3 Syrve Sync Logs Table

Log all synchronization operations with Syrve.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | SERIAL PRIMARY KEY | Log identifier |
| sync\_type | VARCHAR(50) NOT NULL | Type: nomenclature, stock\_retrieval |
| organization\_id | VARCHAR(255) NOT NULL | Syrve organization |
| status | VARCHAR(50) NOT NULL | Status: success, failed, partial |
| started\_at | TIMESTAMPTZ NOT NULL | Sync start time |
| completed\_at | TIMESTAMPTZ | Sync completion time |
| duration\_seconds | INTEGER | Duration in seconds |
| items\_processed | INTEGER | Items processed |
| items\_succeeded | INTEGER | Items succeeded |
| items\_failed | INTEGER | Items failed |
| items\_skipped | INTEGER | Items skipped |
| api\_calls\_made | INTEGER | Number of API calls |
| revision\_before | BIGINT | Revision before sync |
| revision\_after | BIGINT | Revision after sync |
| correlation\_id | VARCHAR(255) | Syrve correlation ID |
| error\_message | TEXT | Error message |
| error\_details | JSONB | Detailed errors |
| retry\_count | INTEGER | Number of retries |
| triggered\_by | VARCHAR(50) | Trigger: scheduler, manual, webhook |
| triggered\_by\_user | UUID FK | User who triggered |
| metadata | JSONB | Additional metadata |
| created\_at | TIMESTAMPTZ | Creation timestamp |

## 8.4 Syrve Write-off Documents Table

Track inventory write-off documents sent to Syrve.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | SERIAL PRIMARY KEY | Document identifier |
| document\_id | VARCHAR(255) UNIQUE | Syrve document UUID |
| organization\_id | VARCHAR(255) NOT NULL | Syrve organization |
| inventory\_session\_id | UUID FK | Inventory session reference |
| correlation\_id | VARCHAR(255) | Syrve correlation ID |
| status | VARCHAR(50) | Status: pending, processing, success |
| items\_count | INTEGER NOT NULL | Number of items |
| total\_amount | DECIMAL(10,2) | Total amount |
| currency | VARCHAR(3) | Currency code |
| comment | TEXT | Document comment |
| created\_at | TIMESTAMPTZ | Creation timestamp |
| submitted\_at | TIMESTAMPTZ | Submission timestamp |
| processed\_at | TIMESTAMPTZ | Processing timestamp |
| error\_message | TEXT | Error message |
| error\_code | VARCHAR(50) | Error code |
| retry\_count | INTEGER | Retry count |
| last\_retry\_at | TIMESTAMPTZ | Last retry timestamp |
| verified\_in\_syrve | BOOLEAN | Verification flag |
| verification\_date | TIMESTAMPTZ | Verification timestamp |
| metadata | JSONB | Additional metadata |

## 8.5 Syrve Write-off Items Table

Individual items in write-off documents.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | SERIAL PRIMARY KEY | Item identifier |
| writeoff\_document\_id | INTEGER NOT NULL FK | Write-off document reference |
| wine\_id | UUID NOT NULL FK | Wine reference |
| variant\_id | UUID FK | Variant reference (optional) |
| syrve\_product\_id | VARCHAR(255) NOT NULL | Syrve product ID |
| amount | DECIMAL(10,2) NOT NULL | Quantity to write off |
| sum\_value | DECIMAL(10,2) NOT NULL | Total value |
| unit\_price | DECIMAL(10,2) | Unit price |
| item\_comment | TEXT | Item comment |
| reason | VARCHAR(100) | Reason: shortage, damage, expiry |
| created\_at | TIMESTAMPTZ | Creation timestamp |

## 8.6 Syrve Webhook Events Table

Log webhook events received from Syrve.

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID PRIMARY KEY | Event identifier |
| event\_type | VARCHAR(100) NOT NULL | Type: StopListUpdate, OrderCreated |
| event\_time | TIMESTAMPTZ NOT NULL | Event timestamp |
| organization\_id | VARCHAR(255) NOT NULL | Syrve organization |
| correlation\_id | VARCHAR(255) | Syrve correlation ID |
| payload | JSONB NOT NULL | Event payload |
| processed | BOOLEAN | Processed flag |
| processed\_at | TIMESTAMPTZ | Processing timestamp |
| processing\_error | TEXT | Processing error |
| received\_at | TIMESTAMPTZ | Receipt timestamp |
| signature\_valid | BOOLEAN | Signature validation |
| ip\_address | VARCHAR(45) | Source IP address |

# 9\. Indexes & Performance Optimization

## 9.1 Primary Indexes

All tables have primary key indexes on the id column (UUID).

## 9.2 Foreign Key Indexes

Foreign key columns are automatically indexed for join performance:

• wine\_id columns in all wine-related tables

• user\_id columns in user-related tables

• session\_id columns in inventory tables

## 9.3 Composite Indexes

Optimized multi-column indexes for common query patterns:

| Index Name | Table | Columns | Purpose |
| ----- | ----- | ----- | ----- |
| idx\_wines\_type\_region | wines | wine\_type, region | Filter by type and region |
| idx\_wines\_stock\_levels | wines | total\_stock, min\_stock | Low stock queries |
| idx\_inventory\_sessions\_user\_active | inventory\_sessions | started\_by, status | Active sessions by user |
| idx\_inventory\_movements\_wine\_recent | inventory\_movements | wine\_id, performed\_at | Recent movements |
| idx\_user\_sessions\_user\_active | user\_sessions | user\_id, is\_active | Active user sessions |

## 9.4 Full-Text Search Indexes

GIN indexes for full-text search on wines and producers:

| Index Name | Table | Type | Purpose |
| ----- | ----- | ----- | ----- |
| idx\_wines\_fulltext\_search | wines | GIN (tsvector) | Fast text search on wine details |
| idx\_producers\_fulltext\_search | wine\_producers | GIN (tsvector) | Fast text search on producers |

## 9.5 Partial Indexes

Indexes only on relevant subsets of data for efficiency:

| Index Name | Table | Condition | Purpose |
| ----- | ----- | ----- | ----- |
| idx\_wines\_active\_only | wines | WHERE is\_active \= true | Active wines only |
| idx\_wines\_low\_stock\_only | wines | WHERE total\_stock \< min\_stock | Low stock wines |
| idx\_inventory\_sessions\_pending | inventory\_sessions | WHERE status IN (draft, in\_progress) | Pending sessions |
| idx\_syrve\_sync\_logs\_failed | syrve\_sync\_logs | WHERE status \= failed | Failed syncs |

## 9.6 JSONB Indexes

GIN indexes on JSONB columns for efficient JSON queries:

| Index Name | Table | Column | Purpose |
| ----- | ----- | ----- | ----- |
| idx\_wines\_grape\_varieties | wines | grape\_varieties | Query grape varieties |
| idx\_wines\_tags | wines | tags | Query tags |
| idx\_wines\_critic\_scores | wines | critic\_scores | Query critic scores |
| idx\_wine\_barcodes\_alternatives | wine\_barcodes | alternative\_barcodes | Search alternative barcodes |

# 10\. Constraints & Business Rules

## 10.1 Check Constraints

Enforce business rules at the database level:

| Constraint Name | Table | Rule | Purpose |
| ----- | ----- | ----- | ----- |
| chk\_wines\_vintage\_range | wines | vintage \>= 1800 AND \<= 2100 | Reasonable vintage years |
| chk\_wines\_alcohol\_range | wines | alcohol\_content \>= 0 AND \<= 100 | Valid alcohol percentage |
| chk\_wines\_stock\_positive | wines | stock \>= 0 | Non-negative stock |
| chk\_wines\_prices\_positive | wines | All prices \>= 0 | Non-negative prices |
| chk\_inventory\_items\_variance | inventory\_items | total\_variance \= counted \- expected | Correct variance calculation |
| chk\_inventory\_movements\_math | inventory\_movements | after \= before \+ change | Stock math correct |
| chk\_wine\_variants\_bottle\_state | wine\_variants | bottle\_state IN (unopened, opened) | Valid bottle states |

## 10.2 Unique Constraints

Prevent duplicate records:

| Constraint Name | Table | Columns | Purpose |
| ----- | ----- | ----- | ----- |
| uk\_wines\_sku | wines | sku | Unique SKU per wine |
| uk\_users\_email | users | email | Unique user email |
| uk\_wine\_barcodes\_wine | wine\_barcodes | barcode, wine\_id | Unique barcode per wine |
| uk\_inventory\_items\_session\_wine | inventory\_items | session\_id, wine\_id | One item per wine per session |
| uk\_stock\_snapshots\_wine\_date | stock\_snapshots | wine\_id, snapshot\_date | One snapshot per wine per day |

## 10.3 Foreign Key Constraints

Referential integrity with appropriate CASCADE/RESTRICT rules:

| Parent Table | Child Table | FK Column | ON DELETE Action |
| ----- | ----- | ----- | ----- |
| wines | wine\_variants | base\_wine\_id | CASCADE |
| wines | wine\_images | wine\_id | CASCADE |
| wines | wine\_barcodes | wine\_id | CASCADE |
| wines | inventory\_items | wine\_id | RESTRICT |
| wines | inventory\_movements | wine\_id | RESTRICT |
| users | inventory\_sessions | started\_by | RESTRICT |
| users | inventory\_movements | performed\_by | RESTRICT |
| users | user\_sessions | user\_id | CASCADE |
| inventory\_sessions | inventory\_items | session\_id | CASCADE |
| inventory\_sessions | inventory\_movements | session\_id | SET NULL |

# 11\. Entity Relationship Summary

## 11.1 Core Relationships

Primary entity relationships in the system:

WINES → WINE\_VARIANTS (1:N)

• One wine can have multiple variants (vintages, volumes, bottle states)

• base\_wine\_id references wines.id

WINES → WINE\_IMAGES (1:N)

• One wine can have multiple images

• wine\_id references wines.id

• One primary image per wine (is\_primary \= true)

WINES → WINE\_BARCODES (1:N)

• One wine can have multiple barcodes

• Different barcodes for different regions/packaging

• One primary barcode per wine

USERS → INVENTORY\_SESSIONS (1:N)

• Users create and manage inventory sessions

• started\_by and completed\_by reference users.id

INVENTORY\_SESSIONS → INVENTORY\_ITEMS (1:N)

• Each session has multiple inventory items

• session\_id references inventory\_sessions.id

WINES → INVENTORY\_ITEMS (1:N)

• Each wine can be counted in multiple sessions

• wine\_id references wines.id

INVENTORY\_SESSIONS → INVENTORY\_MOVEMENTS (1:N)

• Sessions generate multiple stock movements

• session\_id references inventory\_sessions.id

WINES → SYRVE\_PRODUCT\_MAPPINGS (1:N)

• Wines mapped to Syrve products

• wine\_id references wines.id

• Can have mappings for different Syrve organizations

# 12\. Implementation Notes

## 12.1 Database Creation Order

Tables must be created in this order to satisfy foreign key dependencies:

1\. system\_config

2\. users

3\. user\_sessions

4\. suppliers

5\. wine\_producers

6\. grape\_varieties

7\. wines

8\. wine\_variants

9\. wine\_barcodes

10\. wine\_images

11\. inventory\_sessions

12\. inventory\_items

13\. inventory\_movements

14\. stock\_snapshots

15\. uploaded\_files

16\. scanned\_images

17\. audit\_logs

18\. error\_logs

19\. system\_notifications

20\. syrve\_config

21\. wine\_syrve\_product\_mappings

22\. syrve\_sync\_logs

23\. syrve\_writeoff\_documents

24\. syrve\_writeoff\_items

25\. syrve\_webhook\_events

## 12.2 Performance Considerations

• Use connection pooling (recommended: 20-50 connections)

• Enable query plan caching

• Regular VACUUM and ANALYZE operations

• Monitor slow queries and add indexes as needed

• Consider table partitioning for audit\_logs (by month)

• Use materialized views for complex reports

## 12.3 Backup Strategy

• Daily full backups at 2 AM

• Continuous WAL archiving for point-in-time recovery

• Retention: 30 days for daily backups, 12 months for monthly

• Test restoration monthly

• Store backups in geographically separate location

## 12.4 Monitoring & Maintenance

• Monitor disk space (alert at 80% usage)

• Track connection count (alert at 80% of max)

• Monitor query performance (alert on queries \> 5 seconds)

• Weekly index analysis and optimization

• Monthly statistics update

• Quarterly cleanup of old audit logs

# Document Control

| Field | Value |
| ----- | ----- |
| Document Version | 1.0 |
| Date Created | February 9, 2026 |
| Database Version | PostgreSQL 15+ |
| Total Tables | 26+ |
| Author | Technical Team |
| Status | Final |
| Next Review | May 2026 |

**END OF DOCUMENT**