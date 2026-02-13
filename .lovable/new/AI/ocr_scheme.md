Below is a **web-app (mobile responsive) implementation blueprint** for bottle-label recognition that plugs cleanly into **Supabase (Storage + Edge Functions + Postgres/pgvector)**, with **model comparison, processing pipeline, cost math, and step-by-step implementation instructions**.

---

## 1) Best practical architecture for a web app (mobile responsive)

### High-level flow (fast + robust)

1. **User takes photo in web UI** (camera capture).
2. Upload image to **Supabase Storage** (private bucket).
3. Call **Supabase Edge Function** `recognize-label` (so secrets stay server-side). Supabase explicitly positions Edge Functions for orchestrating calls to external LLM APIs like OpenAI. ([Supabase][1])
4. The Edge Function:

   * (A) runs **OCR** → extracts text
   * (B) normalizes text → builds a query string
   * (C) computes **text embedding** and runs **pgvector similarity search** inside Postgres (Supabase supports pgvector for embeddings storage & similarity search). ([Supabase][2])
   * (D) sends the photo + top candidates to a **vision LLM** for verification (pick best match + confidence)
5. Write results into your DB (`ai_runs`, candidates, chosen product, feedback loop).

This is the “market-best” pattern for messy real-world labels: **OCR + retrieval + vision verification**, with human fallback.

---

## 2) Model comparison: which OpenAI model to use (and why)

You need **two capabilities**:

* **Embeddings** (for fast retrieval)
* **Vision reasoning** (for disambiguation using the photo)

### A) Embeddings (retrieval)

Use **`text-embedding-3-small`** by default:

* Cost: **$0.02 / 1M tokens** (Batch: $0.01 / 1M) ([OpenAI Platform][3])
* More than enough quality for OCR text matching and product name search.

Upgrade to **`text-embedding-3-large`** only if you measure poor retrieval on your dataset:

* Cost: **$0.13 / 1M tokens** ([OpenAI Platform][3])

### B) Vision verification (final match + extraction)

For cost/performance on “choose among top candidates”, use **`gpt-4.1-mini`**:

* Cheap per text tokens (and it supports image input) ([OpenAI Platform][4])
* Great for structured extraction + decision among 5–10 candidates.

Use **`gpt-4.1`** only as a fallback tier for difficult cases:

* More expensive, but higher reasoning headroom ([OpenAI Developers][5])

### Why not “one big model only”?

Because you’ll pay the vision model for every attempt. The best approach is:

* **Embeddings** shrink the candidate set cheaply
* **Vision** only decides among shortlist

---

## 3) OCR options: what to use and why

### Option 1 (recommended for web MVP): **Google Cloud Vision OCR**

* Pricing is per “unit” (feature per image), with **first 1,000 units/month free**. ([Google Cloud][6])
* Works well on label text in varied lighting (generally strong OCR).

### Option 2: “No external OCR” (use OpenAI vision only)

Pros: fewer vendors, simpler
Cons: higher cost + slower, and you lose a clean text signal for vector search. OpenAI notes image inputs are metered in tokens and cost depends on image tokenization. ([OpenAI Developers][7])

**Bottom line:** For your use case, OCR is cheap leverage. Use it.

---

## 4) Supabase integration design (exact components)

### Storage

* Bucket: `label-photos` (private)
* You store:

  * original upload
  * optional processed/cropped version (later)

### Database

* Enable `pgvector` extension (Supabase doc) ([Supabase][2])
* Tables (you already have most):

  * `media_assets` (bucket/path/hash)
  * `ai_runs` (one per recognition attempt)
  * `ai_match_candidates` (top K from vector search)
  * `ai_feedback` (user confirmed match)

### Edge Functions

* `recognize-label` (main)
* `embed-text` (optional helper)
* `admin-reindex-products` (build embeddings for all products)

Supabase Edge Functions are intended for “small AI inference tasks or orchestrating calls to external LLM APIs (like OpenAI)”. ([Supabase][1])

---

## 5) Processing pipeline (detailed) — what happens per scan

### Step 0 — Upload

Web client uploads image → Storage.

### Step 1 — OCR (Cloud Vision)

Edge Function:

* downloads image bytes (using service key)
* calls Vision OCR
* returns raw text + per-line structure

**Normalize text** (critical):

* uppercase
* remove punctuation
* normalize accents
* keep useful tokens: producer, region, vintage, varietal, “DOC/DOP/AOC”, etc.

### Step 2 — Candidate retrieval (pgvector)

You should precompute and store embeddings for each product:

**What to embed for each product**

* `product_name`
* `producer` / wine profile fields (if you have them)
* `region` / `appellation`
* synonyms and OCR variants (optional)
* concatenated “search_text” field

Then:

* embed OCR text (`text-embedding-3-small`)
* query `products_embedding` table:

  * `order by embedding <-> query_embedding limit 10`

### Step 3 — Vision verification (OpenAI vision model)

Call a vision-capable model (recommend `gpt-4.1-mini`) with:

* the **image**
* the **top 10 candidates** (name + producer + region + bottle size + your internal id)
* (optional) include each candidate’s **reference label image** URL if you have it

Ask for JSON:

* `chosen_product_id`
* `confidence` (0..1)
* `extracted`: `vintage`, `bottle_size_ml`, `producer_guess`, `label_name_guess`

OpenAI’s docs confirm **image inputs are token-metered** similar to text. ([OpenAI Developers][7])

### Step 4 — Confidence logic + fallback UX

* If confidence ≥ 0.80 → auto-select product
* If 0.55–0.80 → show top 3 with thumbnails, user picks
* If < 0.55 → force manual search + capture feedback (“no match”)

### Step 5 — Learning loop

Store:

* OCR text
* embedding vector (optional)
* top candidates list
* final chosen product
* user feedback

Then you can “auto-grow” your label library by adding successful photos as reference assets (with manager approval).

---

## 6) Cost model (real numbers + how to estimate)

### A) Embeddings cost

`text-embedding-3-small` = **$0.02 / 1M tokens** ([OpenAI Platform][3])

Practical reality: OCR text per scan might be ~100–500 tokens.
So embeddings cost per scan is typically **fractions of a cent** (very low).

### B) Vision model cost (OpenAI)

Image inputs are charged in tokens. ([OpenAI Developers][7])
A commonly used token estimate approach for tiled images is:

* base **85 tokens** + **170 tokens per 512×512 tile** ([OpenAI Developer Community][8])

Example (reasonable phone image resized/capped server-side to ~1024×1024):

* tiles = 4 → image tokens ≈ 85 + 170×4 = **765 tokens**
  If you use `gpt-4.1-mini` (text token pricing shown in model docs; image tokens billed as tokens too) ([OpenAI Platform][4])
  Then cost per scan is roughly:
* input: ~765 tokens + prompt tokens
* output: maybe 150–400 tokens JSON

This usually comes out to **well under $0.01 per scan** for mini models in typical settings (varies by image size + output length). Use OpenAI’s pricing page and the vision calculator note to fine tune. ([OpenAI Developers][7])

### C) OCR cost (Google Vision)

Google Vision pricing is tiered, and the **first 1,000 units/month are free**. ([Google Cloud][6])
After that, you pay per 1,000 units per feature (OCR is a “unit” per image). ([Google Cloud][6])

### Cost-control levers (important)

1. **Resize images server-side** before vision (max 1024px or 768px short side)
2. **Limit vision output tokens** (strict JSON, no explanations)
3. **Skip vision** when embeddings confidence is high (e.g., cosine similarity gap)
4. Cache embeddings for common OCR texts (optional)

---

## 7) Implementation instructions (step-by-step)

### Step 1 — Supabase setup

1. Enable `pgvector` extension ([Supabase][2])
2. Create table `product_search_index`:

   * `product_id`
   * `business_id`
   * `search_text`
   * `embedding vector(1536)` (for embedding-3-small)
3. Create index:

   * `ivfflat` or `hnsw` depending on your preference (Supabase pgvector guide covers vector columns + indexes) ([Supabase][9])

### Step 2 — Build your product “search_text”

For each product:

* include Syrve name + category
* include wine fields (producer/region/appellation/vintage if known)
* include bottle size
* include common OCR aliases (optional)

### Step 3 — Batch embed all products

Create Edge Function `admin-reindex-products`:

* loads products in batches (e.g., 500)
* calls embeddings API `text-embedding-3-small`
* upserts vectors into `product_search_index`

### Step 4 — Create recognition Edge Function

Edge Function `recognize-label`:

1. Input: `asset_id` or storage path
2. Download file from Storage
3. OCR → normalized text
4. embedding(query) → pgvector search → top 10
5. call vision model with:

   * image
   * candidate list
6. write:

   * `ai_runs`
   * `ai_match_candidates`
   * chosen result (+ confidence)
7. return result to client

### Step 5 — Frontend UX (web responsive)

* “Scan” page:

  * camera capture
  * immediate preview
  * “Submit”
* Results:

  * if high confidence: auto-selected product + “Confirm”
  * else: show top candidates with label thumbs

### Step 6 — Feedback loop

When user confirms:

* write `ai_feedback`
* if manager-approved, optionally attach the photo as a new `product_asset` reference

---

## 8) My recommended stack for you (simple + scalable)

**OCR:** Google Vision OCR ([Google Cloud][6])
**Embeddings:** `text-embedding-3-small` ([OpenAI Platform][3])
**Verification:** `gpt-4.1-mini` (fallback to `gpt-4.1` for low-confidence cases) ([OpenAI Platform][4])
**Vector DB:** Supabase Postgres + pgvector ([Supabase][2])
**Orchestration:** Supabase Edge Functions ([Supabase][1])

This is the fastest route to a working product that improves over time.

---

If you tell me your expected volume (roughly: **scans/day per restaurant** and **#restaurants**), I’ll compute a concrete monthly cost table (OCR + embeddings + vision) using conservative image token assumptions and show where to cut cost without losing accuracy.

[1]: https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions | Supabase Docs"
[2]: https://supabase.com/docs/guides/database/extensions/pgvector?utm_source=chatgpt.com "pgvector: Embeddings and vector similarity"
[3]: https://platform.openai.com/docs/pricing?utm_source=chatgpt.com "Pricing | OpenAI API"
[4]: https://platform.openai.com/docs/models/gpt-4.1-mini?utm_source=chatgpt.com "GPT-4.1 mini Model | OpenAI API"
[5]: https://developers.openai.com/api/docs/models/gpt-4.1?utm_source=chatgpt.com "GPT-4.1 Model | OpenAI API"
[6]: https://cloud.google.com/vision/pricing?utm_source=chatgpt.com "Pricing | Cloud Vision API"
[7]: https://developers.openai.com/api/docs/guides/images-vision/?utm_source=chatgpt.com "Images and vision | OpenAI API"
[8]: https://community.openai.com/t/how-do-i-calculate-image-tokens-in-gpt4-vision/492318?utm_source=chatgpt.com "How do I calculate image tokens in GPT4 Vision? - API"
[9]: https://supabase.com/docs/guides/ai/vector-columns?utm_source=chatgpt.com "Vector columns | Supabase Docs"
