# 06 — AI Label Recognition

**AI-Powered Wine Label Recognition Pipeline**

This document defines the complete AI recognition system using OCR, embeddings, and vision verification.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Stage 1: OCR Text Extraction](#stage-1-ocr-text-extraction)
3. [Stage 2: Vector Similarity Search](#stage-2-vector-similarity-search)
4. [Stage 3: Vision Verification](#stage-3-vision-verification)
5. [Feedback Loop](#feedback-loop)
6. [Performance Optimization](#performance-optimization)

---

## Pipeline Overview

### **Architecture**

```
Mobile Camera → Label Image
        ↓
[1] Google Cloud Vision OCR
        ↓
Extract: producer, wine name, vintage, region, ABV
        ↓
[2] OpenAI Embeddings (text-embedding-3-small)
        ↓
Generate 1536-dim vector
        ↓
[3] pgvector Similarity Search
        ↓
Top 10 candidates from product_search_index
        ↓
[4] Gemini 1.5 Flash Vision Verification
        ↓
Rank candidates + return confidence
        ↓
[5] User Confirmation → ai_feedback
        ↓
Continuous Learning
```

### **Why This Approach?**

1. **OCR First**: Wine labels are text-heavy (best cheap signal)
2. **Vector Search**: Fast candidate retrieval (milliseconds for 10K+ products)
3. **Vision Verification**: High-precision confirmation on shortlist
4. **Feedback Loop**: Improves over time from user corrections

### **Cost Optimization**

- **OCR**: $1.50 per 1,000 images (Google Vision)
- **Embeddings**: $0.02 per 1M tokens (OpenAI)
- **Vision**: $0.075 per 1K images for Gemini 1.5 Flash
- **Total**: ~$0.10 per 100 scans (assuming 10 candidates verified)

---

## Stage 1: OCR Text Extraction

### **Google Cloud Vision API**

**Purpose**: Extract all text from wine label

**Request**:
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractTextFromLabel(imageBuffer) {
  const [result] = await client.textDetection(imageBuffer);
  const detections = result.textAnnotations;
  
  return {
    fullText: detections[0]?.description || '',
    blocks: detections.slice(1).map(block => ({
      text: block.description,
      bounds: block.boundingPoly.vertices
    }))
  };
}
```

**Example Output**:
```json
{
  "fullText": "CHÂTEAU MARGAUX\n2015\nGrand Cru Classé\nMargaux\n13.5% Vol.\n750ml",
  "blocks": [
    { "text": "CHÂTEAU", "bounds": [...] },
    { "text": "MARGAUX", "bounds": [...] },
    { "text": "2015", "bounds": [...] }
  ]
}
```

### **Field Extraction**

Parse OCR text into structured fields:

```typescript
interface ExtractedFields {
  producer?: string;
  wine_name?: string;
  vintage?: number;
  region?: string;
  appellation?: string;
  alcohol_content?: number;
  volume_ml?: number;
}

function parseOCRText(fullText: string): ExtractedFields {
  const lines = fullText.split('\n').filter(l => l.trim());
  
  const fields: ExtractedFields = {};
  
  // Extract vintage (4-digit year)
  const vintageMatch = fullText.match(/\b(19|20)\d{2}\b/);
  if (vintageMatch) {
    fields.vintage = parseInt(vintageMatch[0]);
  }
  
  // Extract ABV (alcohol content)
  const abvMatch = fullText.match(/(\d+\.?\d*)\s*%\s*(Vol|Alc)/i);
  if (abvMatch) {
    fields.alcohol_content = parseFloat(abvMatch[1]);
  }
  
  // Extract volume
  const volumeMatch = fullText.match(/(\d+)\s*ml/i);
  if (volumeMatch) {
    fields.volume_ml = parseInt(volumeMatch[1]);
  }
  
  // Extract producer (usually first line or contains "Château", "Domaine", etc.)
  const producerPatterns = /(château|domaine|bodega|tenuta|estate)/i;
  const producerLine = lines.find(l => producerPatterns.test(l));
  if (producerLine) {
    fields.producer = producerLine.trim();
  }
  
  return fields;
}
```

---

## Stage 2: Vector Similarity Search

### **Embedding Generation**

**OpenAI text-embedding-3-small** (1536 dimensions):

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}
```

### **Product Index Table**

```sql
CREATE TABLE product_search_index (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### **Build Index** (Run periodically or on product updates)

```typescript
async function rebuildProductIndex() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, wines(producer, region, appellation, vintage)')
    .eq('is_active', true);
  
  for (const product of products) {
    // Build searchable content
    const content = [
      product.name,
      product.wines?.producer,
      product.wines?.region,
      product.wines?.appellation,
      product.wines?.vintage
    ].filter(Boolean).join(' ');
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Upsert into index
    await supabase
      .from('product_search_index')
      .upsert({
        product_id: product.id,
        search_text: product.name,
        content: content,
        embedding: embedding
      });
  }
}
```

### **Vector Similarity Search**

```sql
-- RPC function for vector search
CREATE OR REPLACE FUNCTION vector_search_products(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    producer TEXT,
    vintage INT,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        psi.product_id,
        p.name,
        w.producer,
        w.vintage,
        1 - (psi.embedding <=> query_embedding) AS similarity
    FROM product_search_index psi
    JOIN products p ON p.id = psi.product_id
    LEFT JOIN wines w ON w.product_id = p.id
    WHERE 1 - (psi.embedding <=> query_embedding) > match_threshold
    ORDER BY psi.embedding <=> query_embedding
    LIMIT match_count;
$$;
```

**Usage**:
```typescript
const { data: candidates } = await supabase.rpc('vector_search_products', {
  query_embedding: embeddingVector,
  match_threshold: 0.7,
  match_count: 10
});
```

---

## Stage 3: Vision Verification

### **Gemini 1.5 Flash**

**Purpose**: Verify which candidate matches the label image

**Request**:
```typescript
async function verifyWithVision(
  imageBase64: string,
  candidates: Product[]
): Promise<VerificationResult> {
  const prompt = `You are a wine expert. Analyze this wine label image and determine which product from the candidate list it matches.

Candidates:
${candidates.map((c, idx) => `${idx + 1}. ${c.name} - ${c.producer} (${c.vintage})`).join('\n')}

Return JSON with:
- chosen_index: The 1-based index of the matching product (or null if no match)
- confidence: 0.0 to 1.0
- reason: Brief explanation
- extracted_vintage: Vintage visible on label
- extracted_volume: Bottle size (ml) if visible`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      })
    }
  );
  
  const data = await response.json();
  const result = JSON.parse(data.candidates[0].content.parts[0].text);
  
  return {
    product_id: result.chosen_index ? candidates[result.chosen_index - 1].id : null,
    confidence: result.confidence,
    reason: result.reason,
    extracted_fields: {
      vintage: result.extracted_vintage,
      volume_ml: result.extracted_volume
    }
  };
}
```

**Response Example**:
```json
{
  "chosen_index": 2,
  "confidence": 0.95,
  "reason": "Label clearly shows 'Château Margaux' with 2015 vintage, matching candidate #2",
  "extracted_vintage": 2015,
  "extracted_volume": 750
}
```

---

## Feedback Loop

### **Storing Recognition Results**

```sql
-- ai_runs table stores each recognition attempt
INSERT INTO ai_runs (run_type, status, input_asset_id, confidence, result)
VALUES (
    'label_recognition',
    'succeeded',
    'asset-uuid',
    0.95,
    '{"ocr_text": "...", "top_match": {...}, "candidates": [...]}'
);

-- ai_match_candidates stores all candidates with scores
INSERT INTO ai_match_candidates (ai_run_id, product_id, score, rank)
VALUES
    ('run-uuid', 'product-1-uuid', 0.95, 1),
    ('run-uuid', 'product-2-uuid', 0.82, 2),
    ('run-uuid', 'product-3-uuid', 0.71, 3);
```

### **User Feedback**

```typescript
async function submitFeedback(
  aiRunId: string,
  chosenProductId: string,
  feedbackType: 'correct' | 'incorrect' | 'partial' | 'no_match',
  notes?: string
) {
  await supabase
    .from('ai_feedback')
    .insert({
      ai_run_id: aiRunId,
      chosen_product_id: chosenProductId,
      chosen_by: userId,
      feedback_type: feedbackType,
      notes: notes
    });
  
  // If user corrected AI, update learning dataset
  if (feedbackType === 'incorrect') {
    // Future: retrain or adjust embeddings
    console.log('User correction logged for model improvement');
  }
}
```

### **Learning Loop Dashboard** (Future)

```sql
-- Accuracy metrics
SELECT
    COUNT(*) FILTER (WHERE af.feedback_type = 'correct') * 100.0 / COUNT(*) AS accuracy_pct,
    AVG(ar.confidence) AS avg_confidence
FROM ai_runs ar
JOIN ai_feedback af ON af.ai_run_id = ar.id
WHERE ar.created_at > NOW() - INTERVAL '30 days';

-- Common failure patterns
SELECT
    p.name,
    COUNT(*) AS incorrect_count
FROM ai_feedback af
JOIN ai_runs ar ON ar.id = af.ai_run_id
JOIN ai_match_candidates amc ON amc.ai_run_id = ar.id AND amc.rank = 1
JOIN products p ON p.id = amc.product_id
WHERE af.feedback_type = 'incorrect'
GROUP BY p.id, p.name
ORDER BY incorrect_count DESC
LIMIT 20;
```

---

---

## Rate Limiting and Cost Control

### **Rate Limit Configuration**

Protect against abuse and control AI costs:

```typescript
// In Edge Function: ai-scan
import { checkRateLimit } from '../_shared/security.ts';

serve(async (req) => {
  const { supabase, userId } = await validateCallerPermissions(req);

  // Check rate limit: 50 scans per hour per user
  const rateLimit = await checkRateLimit(supabase, userId, {
    maxRequests: 50,
    windowMs: 3600000, // 1 hour
    keyPrefix: 'ai-scan'
  });

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      resetAt: rateLimit.resetAt,
      remaining: 0
    }), { 
      status: 429,
      headers: { 
        'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))
      }
    });
  }

  // ... proceed with AI recognition
});
```

### **Cost Tracking**

Track AI API costs per scan:

```sql
-- Add cost tracking to ai_runs table
ALTER TABLE ai_runs 
ADD COLUMN cost_usd NUMERIC(10, 4),
ADD COLUMN provider_usage JSONB DEFAULT '{}';

-- Example cost calculation after AI run
UPDATE ai_runs
SET 
  cost_usd = (
    (ocr_chars / 1000.0 * 0.0015) +  -- Google Vision
    (embedding_tokens / 1000000.0 * 0.02) +  -- OpenAI embeddings
    (vision_api_calls * 0.000075)    -- Gemini Flash
  ),
  provider_usage = jsonb_build_object(
    'ocr_chars', 450,
    'embedding_tokens', 120,
    'vision_calls', 1
  )
WHERE id = 'run-uuid';
```

### **Monthly Cost Dashboard**

```sql
-- Query monthly AI costs
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_scans,
  SUM(cost_usd) AS total_cost_usd,
  AVG(cost_usd) AS avg_cost_per_scan,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS successful_scans,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_scans
FROM ai_runs
WHERE run_type = 'label_recognition'
GROUP BY month
ORDER BY month DESC;
```

---

## AI Provider Configuration

### **Multi-Provider Support**

Configure AI providers via `ai_config` singleton:

```sql
-- AI provider configuration
SELECT * FROM ai_config;

{
  "id": "00000000-0000-0000-0000-000000000001",
  "is_active": true,
  "ocr_provider": "google_vision",  -- or "azure_vision", "aws_textract"
  "vision_provider": "gemini",       -- or "gpt4_vision", "claude_vision"
  "embedding_provider": "openai",    -- or "azure_openai", "cohere"
  "use_system_key": true,            -- Use system-wide keys vs custom
  "custom_api_key_encrypted": null,
  "model_config": {
    "ocr_model": "vision-1",
    "vision_model": "gemini-1.5-flash",
    "embedding_model": "text-embedding-3-small",
    "temperature": 0.1,
    "max_tokens": 2048
  }
}
```

### **Provider Abstraction**

Edge Function pattern for multi-provider support:

```typescript
interface AIProviderConfig {
  ocr_provider: 'google_vision' | 'azure_vision';
  vision_provider: 'gemini' | 'gpt4_vision';
  embedding_provider: 'openai' | 'azure_openai';
}

async function getAIConfig(supabase: SupabaseClient): Promise<AIProviderConfig> {
  const { data } = await supabase
    .from('ai_config')
    .select('*')
    .single();

  return {
    ocr_provider: data.ocr_provider,
    vision_provider: data.vision_provider,
    embedding_provider: data.embedding_provider
  };
}

async function callOCR(imageBuffer: Buffer, provider: string): Promise<string> {
  switch (provider) {
    case 'google_vision':
      return await googleVisionOCR(imageBuffer);
    case 'azure_vision':
      return await azureVisionOCR(imageBuffer);
    default:
      throw new Error(`Unknown OCR provider: ${provider}`);
  }
}

async function callVisionModel(
  imageBase64: string,
  candidates: Product[],
  provider: string
): Promise<VerificationResult> {
  switch (provider) {
    case 'gemini':
      return await geminiVerify(imageBase64, candidates);
    case 'gpt4_vision':
      return await gpt4VisionVerify(imageBase64, candidates);
    default:
      throw new Error(`Unknown vision provider: ${provider}`);
  }
}
```

### **API Key Management**

Store provider keys in Supabase Secrets:

```bash
# Set AI provider API keys
supabase secrets set GOOGLE_VISION_API_KEY=AIza...
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set AZURE_VISION_KEY=...
supabase secrets set AZURE_VISION_ENDPOINT=https://...
```

Access in Edge Functions:

```typescript
const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
if (!apiKey) {
  throw new Error('AI provider API key not configured');
}
```

### **Confidence Threshold Tuning**

Adjust confidence thresholds via `ai_config`:

```sql
UPDATE ai_config
SET model_config = jsonb_set(
  model_config,
  '{confidence_thresholds}',
  '{
    "vector_search_min": 0.7,
    "vision_verification_min": 0.75,
    "auto_accept_threshold": 0.95
  }'::jsonb
);
```

Usage in Edge Function:

```typescript
const { data: aiConfig } = await supabase
  .from('ai_config')
  .select('model_config')
  .single();

const thresholds = aiConfig.model_config.confidence_thresholds;

// Filter vector search results
const highConfidenceCandidates = vectorResults.filter(
  c => c.similarity >= thresholds.vector_search_min
);

// Auto-accept high confidence matches
if (visionResult.confidence >= thresholds.auto_accept_threshold) {
  // Automatically add to inventory count without user confirmation
  await autoAddToInventory(sessionId, visionResult.product_id);
}
```

---

## Performance Optimization

### **1. Image Pre-processing**

```typescript
async function preprocessLabelImage(imageBlob: Blob): Promise<Blob> {
  // Resize to max 1024px (reduces API costs)
  const maxSize = 1024;
  
  // Crop to label area (simple center crop)
  // Enhance contrast
  // Reduce glare
  
  return processedBlob;
}
```

### **2. Caching**

```typescript
// Cache OCR results by image hash
const imageHash = await computePerceptualHash(imageBuffer);

const { data: cached } = await supabase
  .from('ai_runs')
  .select('*')
  .eq('result->image_hash', imageHash)
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days
  .single();

if (cached) {
  return cached.result;
}
```

### **3. Index Optimization**

```sql
-- Tune IVFFlat index for dataset size
-- lists = sqrt(rows) for optimal performance
-- For 10K products: lists ≈ 100
-- For 100K products: lists ≈ 316

CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Rebuild index periodically
REINDEX INDEX idx_product_search_embedding;
```

### **4. Batch Processing**

```typescript
// Process multiple images in parallel
async function batchRecognize(images: string[]) {
  const promises = images.map(img => recognizeLabel(img));
  return await Promise.all(promises);
}
```

---

## Next Steps

- Review [07-inventory-management.md](07-inventory-management.md) for inventory workflow
- Study [05-edge-functions.md](05-edge-functions.md) for AI scan implementation
- Examine [08-deployment-guide.md](08-deployment-guide.md) for AI API key configuration
