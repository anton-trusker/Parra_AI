Here’s the **best-practice, production-ready solution** for bottle label recognition in your app (restaurant inventory context), optimized for **speed, accuracy, and cost**, and designed to get better over time.

The key reality: **“wine label recognition” is not a single model problem**. The winning approach is a **multi-stage pipeline**: *fast candidate retrieval* → *high-precision verification* → *human-in-the-loop feedback*.

---

## The best solution (recommended): Hybrid pipeline (OCR + embeddings + vision verification)

### Why this is the market-best approach

* Works even when the label is partially visible, angled, glossy, or in low light
* Does not require you to train a huge custom model upfront
* Improves automatically from user feedback
* Keeps costs low by using expensive vision only on shortlists

### Pipeline overview

**Input:** photo from mobile camera (bottle label)

1. **On-device pre-processing (fast + improves quality)**

* Crop to label area (simple heuristic + optional on-device detection)
* Correct rotation/perspective
* Enhance contrast / reduce glare if possible
* Save original + processed image as evidence (helps support + AI training)

2. **Text extraction (OCR)**

* Extract:

  * producer / brand
  * wine name
  * appellation / region
  * vintage
  * ABV
  * bottle volume (750ml etc.)
* OCR is your *best cheap signal* for wine recognition (labels are text-heavy).
* It also helps when you don’t have barcodes.

3. **Candidate retrieval (vector search)**

* Build an internal “label index”:

  * Store multiple images per product (front label, back label, variations)
  * Generate embeddings for:

    * OCR text (string embedding)
    * image embedding (label photo embedding)
* Query both:

  * text embedding search on OCR output
  * image embedding search on label image
* Merge into a shortlist: **top 10 candidates**.

4. **High-precision verification (vision model)**

* Send the image + top candidates to a vision-capable LLM to pick the best match.
* Ask it to return structured JSON:

  * `chosen_product_id`
  * `confidence`
  * `extracted_fields` (vintage, bottle size)
  * `reason` (short)
* This is where OpenAI vision fits well for “disambiguation” and robust reasoning on messy images. ([OpenAI Developers][1])

5. **Fallback UX**

* If confidence < threshold:

  * Show top 5 candidates with label thumbnails
  * Allow manual search
  * Save feedback (“picked X”, “none match”)

6. **Learning loop**

* Store:

  * image
  * OCR text
  * candidates
  * final chosen product
  * confidence
* This creates a powerful dataset for future improvements (and optional custom model training).

---

## Tech choices (what I’d use in your case)

### A) Vision + reasoning (verification step)

* **OpenAI Vision via the OpenAI API** for the verification/disambiguation step (choose among top candidates; extract vintage/volume). ([OpenAI Developers][1])
  This is the most flexible route because you want structured extraction + matching logic, not just generic label detection.

### B) OCR

Pick one:

* **Google Cloud Vision OCR** (strong OCR, easy integration). It’s mainly general-purpose, but reliable OCR is what you need. ([Google Cloud Documentation][2])
* Or **on-device OCR** (iOS Vision / Android ML Kit) if you want offline-first and lower cloud costs.

### C) Embeddings + vector search

* Supabase Postgres with **pgvector** for:

  * `product_label_text_embedding`
  * `product_label_image_embedding`
* This keeps infra simple (you’re already on Supabase).

### D) Optional: Custom model training later

If you reach scale (thousands+ label shots with feedback), then consider:

* **AWS Rekognition Custom Labels** for “closed-world classification” (your catalog only). Pricing is documented and viable, but hosting/training tradeoffs exist. ([Amazon Web Services, Inc.][3])
  This becomes worth it when you want:
* low latency
* predictable per-image cost
* minimal LLM usage

---

## What you should NOT do (common trap)

### “Train a classifier from day 1”

Bad ROI early:

* you need a lot of labeled images per wine (labels change by vintage, import region, special editions)
* you’ll spend weeks collecting and cleaning data
* accuracy will still be fragile in real restaurant lighting

Start hybrid; train later.

---

## How this plugs into your product reality (Syrve is source of truth)

Because Syrve products may be minimal, you’ll maintain your own enrichment:

* product images (multiple)
* wine meta
* bottle size rules
* “sold by glass”
* recognition dataset

Then recognition returns your **internal product_id**, which maps to `syrve_product_id` for inventory export.

---

## Data you must store (minimum for a strong AI loop)

You already asked for DB-driven AI, so here’s the essential set:

* `media_assets` (original + processed)
* `ai_runs` (per recognition attempt)
* `ai_match_candidates` (top K from vector retrieval)
* `ai_feedback` (final selection)
* `product_assets` (label library per product)
* `product_label_text` (canonical normalized text for indexing)

This makes the system get better without “big model training”.

---

## Accuracy boosters (cheap but high impact)

1. **Ask staff to take photos in “scan mode”**

* show an overlay: “keep label inside frame”
* auto-capture when stable

2. **Maintain a “label library”**

* every time recognition succeeds, optionally save the photo as another label reference for that product (after manager approval)

3. **Detect bottle volume + ABV**

* reduces false matches drastically (750ml vs 375ml, etc.)

4. **“Top wines” caching**

* Restaurants repeatedly count the same 200–500 SKUs.
* Pre-cache embeddings + keep a local shortlist per store.

---

## Implementation plan (fast MVP → strong v1)

### MVP (1–2 weeks)

* On-device photo → OCR → text search (simple) → manual selection
* Store every attempt + feedback

### v1 (best experience)

* OCR + embeddings retrieval
* Vision verification (OpenAI)
* Confidence threshold + fallback UI
* Auto-learn label library

### v2 (scale)

* Optional Rekognition Custom Labels for classification
* Offline OCR + partial offline retrieval
* Active learning: “ask for 1 better photo” when confidence low

---

## Bottom-line recommendation

**Go with Hybrid**:

* OCR + pgvector retrieval + OpenAI vision verification (shortlist)
  It’s the fastest to ship, most robust in real conditions, and sets you up for future custom model training.

