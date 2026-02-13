Below is a **complete, implementation-ready spec** for your requirement:

* **Same wine name but different years (2024/2025) must be stored as separate products** in DB.
* If **year is not identified**, system must **show all year variants** for user selection.
* You also asked for **all Edge Functions** + **prompt template** → included.

Everything is written for **Supabase Edge Functions (Deno/TypeScript)** + **Supabase Postgres + pgvector** + **Supabase Storage**.

---

## 1) DB model change: vintages are separate products

### Core idea

You need a “family” concept (wine identity without vintage), and then each vintage is an individual product.

### Add a Wine Family table (recommended)

This is clean and avoids trying to infer “family” from product name each time.

```sql
-- 0101_wine_families.sql

create table if not exists public.wine_families (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,

  -- canonical fields for grouping vintages
  producer_norm text not null,
  label_norm text not null,
  region_norm text,
  appellation_norm text,

  -- optional display fields
  producer_display text,
  label_display text,
  region_display text,
  appellation_display text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, producer_norm, label_norm, coalesce(region_norm,''), coalesce(appellation_norm,''))
);

create trigger trg_wine_families_updated_at
before update on public.wine_families
for each row execute function public.set_updated_at();
```

### Extend your `products` to support vintages

Each vintage is its own row in `products`.

```sql
-- 0102_products_vintage_fields.sql

alter table public.products
  add column if not exists wine_family_id uuid null references public.wine_families(id) on delete set null,
  add column if not exists vintage_year int null check (vintage_year is null or (vintage_year >= 1900 and vintage_year <= 2100)),
  add column if not exists is_nv boolean not null default false,
  add column if not exists producer_norm text,
  add column if not exists label_norm text;

-- ensure you can't have duplicate vintage in same family
create unique index if not exists ux_products_family_vintage
on public.products (business_id, wine_family_id, vintage_year, is_nv)
where wine_family_id is not null;
```

### Why this design works

* **Inventory** counts still link to `product_id` (unique per vintage).
* Recognition returns a specific `product_id`.
* If year is unknown → you can query all products in that `wine_family_id` and show variants.

---

## 2) Recognition output rules (your “variants” requirement)

### What “match” means

1. Recognize **family** (producer + label) first.
2. Then resolve **vintage**:

   * if year detected → choose matching product (family + year)
   * if year not detected → return **all variants** in the family

### API behavior

* If year **found & exists** → `status="needs_confirmation"`, return chosen product + variants list
* If year **not found** → `status="select_variant"`, return family variants, no auto selection
* If family not confident → `status="no_match"`, show candidates + manual search

---

## 3) Data structures for search + cost reduction

### A) Product search index (pgvector)

Store an embedding per product (per vintage), but also create a **family-biased search_text**:

**search_text** examples:

* `"GAJA BARBARESCO 2021 PIEMONTE DOCG 750ML"`
* `"GAJA BARBARESCO NV PIEMONTE DOCG 750ML"`

```sql
-- 0103_product_search_index.sql
create table if not exists public.product_search_index (
  product_id uuid primary key references public.products(id) on delete cascade,
  business_id uuid not null references public.business_profile(id) on delete cascade,
  search_text text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_search_index_business
on public.product_search_index (business_id);

-- create vector index (HNSW recommended)
-- NOTE: choose one depending on pgvector version; this is typical:
create index if not exists idx_product_search_index_embedding_hnsw
on public.product_search_index using hnsw (embedding vector_l2_ops);
```

### B) Label hash index (for near-zero cost on repeat bottles)

Store perceptual hash per label asset. Repeated labels will be recognized without OCR/LLM.

```sql
-- 0104_label_hash_index.sql
create table if not exists public.label_hash_index (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profile(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,

  -- perceptual hash (aHash/pHash as hex string)
  phash text not null,

  created_at timestamptz not null default now(),
  unique (business_id, asset_id),
  unique (business_id, product_id, phash)
);

create index if not exists idx_label_hash_lookup
on public.label_hash_index (business_id, phash);
```

---

## 4) Postgres RPC for vector search (used by Edge Function)

```sql
-- 0105_rpc_match_products.sql
create or replace function public.match_products(
  p_business_id uuid,
  p_query_embedding vector(1536),
  p_limit int default 10
)
returns table (
  product_id uuid,
  score float
)
language sql stable
as $$
  select psi.product_id,
         1 - (psi.embedding <-> p_query_embedding) as score
  from public.product_search_index psi
  where psi.business_id = p_business_id
  order by psi.embedding <-> p_query_embedding
  limit p_limit;
$$;
```

---

# 5) Edge Functions (complete set)

You asked “create all edge functions” — here are the ones you need:

1. `recognize_label` – main recognition pipeline
2. `reindex_products` – build/refresh embeddings in bulk
3. `compute_label_hash` – compute and store hash for label assets (optional utility)

All are written as Supabase Edge Functions (Deno TS).
Assume you have ENV vars set in Supabase:

* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `OPENAI_API_KEY`
* `GOOGLE_VISION_API_KEY` (if using Google OCR)

---

## 5.1 Edge Function: `reindex_products` (bulk embeddings)

**Purpose:** run after Syrve sync or whenever products change. It builds `product_search_index`.

`supabase/functions/reindex_products/index.ts`

```ts
/// <reference deno="true" />
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

type ProductRow = {
  id: string;
  business_id: string;
  name: string;
  vintage_year: number | null;
  is_nv: boolean;
  unit_capacity_liters: number | null;
  wines?: { producer?: string; region?: string; appellation?: string } | null;
  metadata: any;
};

function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function buildSearchText(p: ProductRow): string {
  const producer = p?.metadata?.producer ?? p?.wines?.producer ?? "";
  const region = p?.metadata?.region ?? p?.wines?.region ?? "";
  const appellation = p?.metadata?.appellation ?? p?.wines?.appellation ?? "";
  const year = p.is_nv ? "NV" : (p.vintage_year ? String(p.vintage_year) : "");
  const ml =
    p?.metadata?.bottle_size_ml ??
    (p.unit_capacity_liters ? Math.round(p.unit_capacity_liters * 1000) : "");
  const text = `${producer} ${p.name} ${year} ${region} ${appellation} ${ml ? `${ml}ML` : ""}`;
  return normalizeText(text);
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) throw new Error(`Embeddings failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  try {
    const { business_id, batch_size = 200 } = await req.json();
    if (!business_id) return new Response("Missing business_id", { status: 400 });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch products in batches
    let from = 0;
    while (true) {
      const { data: products, error } = await sb
        .from("products")
        .select("id,business_id,name,vintage_year,is_nv,unit_capacity_liters,metadata")
        .eq("business_id", business_id)
        .range(from, from + batch_size - 1);

      if (error) throw error;
      if (!products || products.length === 0) break;

      const upserts = [];
      for (const p of products as any as ProductRow[]) {
        const searchText = buildSearchText(p);
        const embedding = await embedText(searchText);

        upserts.push({
          product_id: p.id,
          business_id: p.business_id,
          search_text: searchText,
          embedding,
          updated_at: new Date().toISOString(),
        });
      }

      const { error: upsertErr } = await sb.from("product_search_index").upsert(upserts, {
        onConflict: "product_id",
      });
      if (upsertErr) throw upsertErr;

      from += batch_size;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

---

## 5.2 Edge Function: `recognize_label` (main pipeline)

**Purpose:** given a label photo, return:

* best product match OR variant picker list OR no-match

`supabase/functions/recognize_label/index.ts`

```ts
/// <reference deno="true" />
import { createClient } from "npm:@supabase/supabase-js";
import Jimp from "npm:jimp";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const GOOGLE_VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY")!;

type Candidate = { product_id: string; score: number };

function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function extractYear(text: string): { year: number | null; confidence: number } {
  // Simple heuristic: pick first year in [1950..2100]
  const m = text.match(/\b(19[5-9]\d|20\d\d|2100)\b/);
  if (!m) return { year: null, confidence: 0 };
  const y = Number(m[1]);
  return { year: y, confidence: 0.7 }; // real confidence can be improved using OCR structure
}

async function downloadFromStorage(sb: any, bucket: string, path: string): Promise<Uint8Array> {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

async function resizeForAI(imageBytes: Uint8Array, maxSide = 1024): Promise<Uint8Array> {
  const img = await Jimp.read(imageBytes);
  const w = img.getWidth();
  const h = img.getHeight();
  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale < 1) img.resize(Math.round(w * scale), Math.round(h * scale));
  const out = await img.quality(80).getBufferAsync(Jimp.MIME_JPEG);
  return new Uint8Array(out);
}

// Lightweight aHash (not full pHash, but works well for “same label photo family”)
async function computeAHashHex(imageBytes: Uint8Array): Promise<string> {
  const img = await Jimp.read(imageBytes);
  img.resize(8, 8).grayscale();
  const pixels: number[] = [];
  let sum = 0;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const { r } = Jimp.intToRGBA(img.getPixelColor(x, y));
      pixels.push(r);
      sum += r;
    }
  }
  const avg = sum / pixels.length;
  let bits = "";
  for (const p of pixels) bits += p >= avg ? "1" : "0";

  // bits(64) -> hex(16)
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = bits.slice(i, i + 4);
    hex += parseInt(nibble, 2).toString(16);
  }
  return hex;
}

async function ocrGoogleVision(imageBytes: Uint8Array): Promise<string> {
  const content = btoa(String.fromCharCode(...imageBytes));
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`OCR failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = json?.responses?.[0]?.fullTextAnnotation?.text ?? "";
  return normalizeText(text);
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

async function visionVerify(
  imageBytesJpeg: Uint8Array,
  candidates: any[],
  ocrText: string
): Promise<{ chosen_product_id: string | null; confidence: number; extracted_year: number | null }> {
  const imageB64 = btoa(String.fromCharCode(...imageBytesJpeg));

  const prompt = buildVisionPrompt(candidates, ocrText);

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: `data:image/jpeg;base64,${imageB64}` },
          ],
        },
      ],
      max_output_tokens: 250,
    }),
  });

  if (!res.ok) throw new Error(`Vision verify failed: ${res.status} ${await res.text()}`);
  const json = await res.json();

  // The Responses API output text is in output[0].content[0].text in many cases.
  const textOut =
    json?.output?.[0]?.content?.find((c: any) => c.type === "output_text")?.text ??
    json?.output_text ??
    "";

  let parsed: any;
  try {
    parsed = JSON.parse(textOut);
  } catch {
    // If the model ever fails JSON, treat as uncertain
    return { chosen_product_id: null, confidence: 0, extracted_year: null };
  }

  return {
    chosen_product_id: parsed.chosen_product_id ?? null,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    extracted_year: parsed.extracted?.vintage_year ?? null,
  };
}

function buildVisionPrompt(candidates: any[], ocrText: string): string {
  // Prompt template is provided in section 6; this function injects candidate list + OCR.
  return `
You are verifying a wine label photo against a list of candidate products.
Return ONLY valid JSON, no markdown, no extra text.

Rules:
- Choose the best matching product_id from the candidates array.
- If you are not confident, set chosen_product_id = null and confidence <= 0.55.
- Extract vintage_year if visible. If no year visible, set vintage_year = null.
- Confidence must be between 0 and 1.

OCR_TEXT:
${ocrText}

CANDIDATES (JSON):
${JSON.stringify(candidates, null, 2)}

Return JSON schema:
{
  "chosen_product_id": "uuid|null",
  "confidence": 0.0,
  "extracted": {
    "producer": "string|null",
    "label_name": "string|null",
    "vintage_year": 2024|null,
    "nv": true|false|null,
    "bottle_size_ml": 750|null
  }
}
`.trim();
}

Deno.serve(async (req) => {
  try {
    const { business_id, bucket = "label-photos", path, session_id } = await req.json();
    if (!business_id || !path) return new Response("Missing business_id or path", { status: 400 });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Download + resize (cost control)
    const rawBytes = await downloadFromStorage(sb, bucket, path);
    const resized = await resizeForAI(rawBytes, 1024);

    // 2) Hash shortcut
    const ahash = await computeAHashHex(resized);

    const { data: hashHit, error: hashErr } = await sb
      .from("label_hash_index")
      .select("product_id, products!inner(wine_family_id,vintage_year,is_nv,name)")
      .eq("business_id", business_id)
      .eq("phash", ahash)
      .limit(1)
      .maybeSingle();

    if (hashErr) throw hashErr;

    if (hashHit?.product_id) {
      // Return matched with variants (always require confirmation)
      const familyId = (hashHit as any).products.wine_family_id;

      const variants = familyId
        ? await sb
            .from("products")
            .select("id,name,vintage_year,is_nv")
            .eq("business_id", business_id)
            .eq("wine_family_id", familyId)
            .eq("is_active", true)
            .order("vintage_year", { ascending: false })
        : { data: [] as any[] };

      return new Response(
        JSON.stringify({
          status: "needs_confirmation",
          chosen_product_id: hashHit.product_id,
          confidence: 0.95,
          extracted: { vintage_year: (hashHit as any).products.vintage_year ?? null },
          variants: variants.data ?? [],
          reason: "label_hash_match",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) OCR
    const ocrText = await ocrGoogleVision(resized);
    const yearInfo = extractYear(ocrText);

    // 4) Embedding + vector candidates
    const qEmb = await embedText(ocrText);

    const { data: matches, error: matchErr } = await sb.rpc("match_products", {
      p_business_id: business_id,
      p_query_embedding: qEmb,
      p_limit: 10,
    });
    if (matchErr) throw matchErr;

    const candidateIds = (matches as Candidate[]).map((m) => m.product_id);

    const { data: candidateRows, error: candErr } = await sb
      .from("products")
      .select("id,name,wine_family_id,vintage_year,is_nv,metadata")
      .in("id", candidateIds)
      .eq("business_id", business_id);

    if (candErr) throw candErr;

    // Map scores into candidates
    const scoreById = new Map<string, number>();
    (matches as Candidate[]).forEach((m) => scoreById.set(m.product_id, m.score));

    const candidates = (candidateRows ?? []).map((p) => ({
      product_id: p.id,
      name: p.name,
      wine_family_id: p.wine_family_id,
      vintage_year: p.vintage_year,
      is_nv: p.is_nv,
      score: scoreById.get(p.id) ?? 0,
    })).sort((a,b)=> (b.score - a.score));

    // 5) Variant logic
    // Choose a "best family" = family of top candidate
    const bestFamilyId = candidates[0]?.wine_family_id ?? null;

    // Load variants for that family
    let variants: any[] = [];
    if (bestFamilyId) {
      const { data: v } = await sb
        .from("products")
        .select("id,name,vintage_year,is_nv")
        .eq("business_id", business_id)
        .eq("wine_family_id", bestFamilyId)
        .eq("is_active", true)
        .order("vintage_year", { ascending: false });
      variants = v ?? [];
    }

    // 6) If year detected -> try direct variant match without vision
    if (bestFamilyId && yearInfo.year) {
      const exact = variants.find((x) => x.vintage_year === yearInfo.year);
      if (exact) {
        return new Response(
          JSON.stringify({
            status: "needs_confirmation",
            chosen_product_id: exact.id,
            confidence: Math.min(0.85, candidates[0]?.score ?? 0.85),
            extracted: { vintage_year: yearInfo.year, vintage_confidence: yearInfo.confidence },
            variants,
            reason: "embedding_family_plus_year",
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      // year found but not in DB -> must show variants (user decides)
      return new Response(
        JSON.stringify({
          status: "select_variant",
          chosen_product_id: null,
          confidence: 0.0,
          extracted: { vintage_year: yearInfo.year, vintage_confidence: yearInfo.confidence },
          variants,
          candidates,
          reason: "year_found_but_variant_missing",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 7) If year NOT identified -> must show all variants (your requirement)
    if (bestFamilyId && !yearInfo.year) {
      // Optionally run vision verification to rank candidates, but still require selection if year missing.
      // If you prefer: skip vision here to save cost.
      return new Response(
        JSON.stringify({
          status: "select_variant",
          chosen_product_id: null,
          confidence: candidates[0]?.score ?? 0,
          extracted: { vintage_year: null, vintage_confidence: 0 },
          variants,
          candidates,
          reason: "year_not_identified_show_variants",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 8) Low-confidence fallback: use vision to decide among top candidates
    const topForVision = candidates.slice(0, 8);
    const vision = await visionVerify(resized, topForVision, ocrText);

    // If vision picks something, still return variants for confirmation
    let chosen = vision.chosen_product_id;
    let chosenFamilyId = topForVision.find((c) => c.product_id === chosen)?.wine_family_id ?? null;

    let chosenVariants: any[] = [];
    if (chosenFamilyId) {
      const { data: v } = await sb
        .from("products")
        .select("id,name,vintage_year,is_nv")
        .eq("business_id", business_id)
        .eq("wine_family_id", chosenFamilyId)
        .eq("is_active", true)
        .order("vintage_year", { ascending: false });
      chosenVariants = v ?? [];
    }

    // If vision extracted year and variants exist, prefer exact year
    if (chosenFamilyId && vision.extracted_year) {
      const exact = chosenVariants.find((x) => x.vintage_year === vision.extracted_year);
      if (exact) chosen = exact.id;
      else {
        // year extracted but not in DB => force variant selection
        return new Response(
          JSON.stringify({
            status: "select_variant",
            chosen_product_id: null,
            confidence: vision.confidence,
            extracted: { vintage_year: vision.extracted_year },
            variants: chosenVariants,
            candidates: topForVision,
            reason: "vision_year_not_in_db",
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        status: chosen ? "needs_confirmation" : "no_match",
        chosen_product_id: chosen,
        confidence: vision.confidence,
        extracted: { vintage_year: vision.extracted_year ?? null },
        variants: chosenVariants,
        candidates: topForVision,
        reason: "vision_verification",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### Important: your “year not identified” requirement

Notice this block:

```ts
if (bestFamilyId && !yearInfo.year) {
  return { status: "select_variant", variants: all variants in family, chosen_product_id: null }
}
```

That is exactly what you requested: **no year → show all variants**.

---

## 5.3 Edge Function: `compute_label_hash` (utility)

Use this when admin uploads label images into the library. It computes hash and stores it.

`supabase/functions/compute_label_hash/index.ts`

```ts
/// <reference deno="true" />
import { createClient } from "npm:@supabase/supabase-js";
import Jimp from "npm:jimp";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function computeAHashHex(imageBytes: Uint8Array): Promise<string> {
  const img = await Jimp.read(imageBytes);
  img.resize(8, 8).grayscale();
  const pixels: number[] = [];
  let sum = 0;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const { r } = Jimp.intToRGBA(img.getPixelColor(x, y));
      pixels.push(r);
      sum += r;
    }
  }
  const avg = sum / pixels.length;
  let bits = "";
  for (const p of pixels) bits += p >= avg ? "1" : "0";
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

Deno.serve(async (req) => {
  try {
    const { business_id, bucket, path, product_id, asset_id } = await req.json();
    if (!business_id || !bucket || !path || !product_id || !asset_id) {
      return new Response("Missing fields", { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) throw error;

    const bytes = new Uint8Array(await data.arrayBuffer());
    const phash = await computeAHashHex(bytes);

    const { error: upErr } = await sb.from("label_hash_index").upsert({
      business_id,
      product_id,
      asset_id,
      phash,
    });

    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, phash }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

---

# 6) Prompt template (final version, strict + safe)

Use this as the exact prompt for vision verification (you already saw it in code, here is the “final spec” format).

### Vision Prompt (gpt-4.1-mini)

```text
You are verifying a wine label photo against a list of candidate products.
Return ONLY valid JSON. No markdown, no explanation.

Goals:
1) Pick the correct product_id from the candidate list.
2) Extract vintage_year if clearly visible.
3) If vintage year is NOT visible, vintage_year MUST be null.
4) If you are not confident, chosen_product_id MUST be null and confidence <= 0.55.

Rules:
- Confidence is a number between 0 and 1.
- Do not guess the year; only extract if visible on the label.
- If multiple years appear (rare), choose the most prominent vintage year.

OCR_TEXT:
{OCR_TEXT}

CANDIDATES (JSON):
{CANDIDATES_JSON}

Return JSON schema EXACTLY:
{
  "chosen_product_id": "uuid|null",
  "confidence": 0.0,
  "extracted": {
    "producer": "string|null",
    "label_name": "string|null",
    "vintage_year": 2024|null,
    "nv": true|false|null,
    "bottle_size_ml": 750|null
  }
}
```

---

# 7) Frontend behavior (what you implement in UI)

### Always confirmation

Even if `status="needs_confirmation"`:

* Show the chosen product (preselected)
* Buttons: Confirm / Rescan / Choose variant

### If `status="select_variant"`:

* Show “Select vintage year”
* List `variants[]` sorted newest → oldest, plus NV if exists
* If OCR extracted a year (but DB doesn’t have it) → show warning:

  * “Detected 2025, but not found in catalog. Choose closest.”

### On confirm:

* Save `ai_feedback` and then allow user to enter:

  * bottles_unopened
  * open_ml

---

# 8) Key cost optimization (you asked explicitly)

Yes: **stored labels reduce costs a lot** because of the hash shortcut.

At your volume (700–800/month), after 1–2 months you’ll likely see:

* 30–60% labels repeated → hash match → near zero AI cost
* embeddings cost is already negligible
* OCR may be free under Google’s 1,000/month free tier

So the main bill becomes only “ambiguous/new labels” needing vision verification.
