# 06 - AI & OCR Integration Specification

This document bridges the gap between the high-level OCR Scheme and the actual implementation required in the application.

## 1. Overview

The AI Pipeline is designed to:
1.  **Capture** images from the mobile web client.
2.  **Process** via Edge Functions (OCR + Embedding + Vision).
3.  **Return** structured wine data.
4.  **Learn** from user feedback.

## 2. Infrastructure Requirements

### 2.1 Supabase Storage
*   **Bucket Name**: `ai-scans`
*   **Privacy**: Private (Authenticated access only).
*   **Path Structure**: `/{business_id}/{session_id}/{timestamp}_{random}.jpg`
*   **Lifecycle**: Auto-delete after 30 days (unless marked as `product_asset`).

### 2.2 Database Extensions
*   Extension `vector` must be enabled.
*   Table `product_embeddings`:
    *   `product_id` (FK)
    *   `embedding` (vector(1536))
    *   `content` (text) - The raw text used to generate the embedding (name + producer + region).

## 3. Backend Implementation (Edge Functions)

### Function: `ai-scan`

**Steps**:
1.  **Receive**: `{ image_base64, session_id }`.
2.  **Auth**: Fetch active configuration from `ai_config`.
3.  **Vision Prompt (Gemini 1.5 Flash)**:
    ```
    Analyze this image of a wine bottle. Extract in JSON:
    - product_name (Full name)
    - producer
    - vintage (Year, 4 digits)
    - region
    - grape_variety
    - bottle_size (e.g. 750ml)
    ```
4.  **Family Logic**:
    *   If **vintage** is found -> Search `products` where `name` or `metadata->producer` matches AND `wines.vintage` matches.
    *   If **no vintage** -> Return all variants (separate products per year) from the same "Wine Family" (matched by name/producer similarity).
5.  **Log**:
    *   Insert result into `ai_recognition_attempts` for auditing and feedback.

## 4. Frontend Integration (`CameraScanner.tsx`)

The current "Simulation" logic must be replaced with:

```typescript
const handleImageCapture = async () => {
  // 1. Capture Frame from <video>
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.8));

  // 2. Upload to Supabase
  const path = `${sessionId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('ai-scans')
    .upload(path, blob);

  // 3. Call Edge Function
  const response = await supabase.functions.invoke('ai-recognize-label', {
    body: { image_path: path }
  });

  // 4. Handle Result
  if (response.data.match_id) {
    // Auto-select
    onScanSuccess(response.data.match_id);
  } else {
    // Show manual search with OCR text pre-filled
    showManualSearch(response.data.ocr_text);
  }
}
```

## 5. Learning Loop (Feedback)

When a user **Confirms** a count (whether auto-matched or manually selected after a scan):
1.  Frontend sends event to `ai_feedback` table.
    *   `ai_run_id`: The ID of the recognition attempt.
    *   `actual_product_id`: What the user actually selected.
2.  **Process**:
    *   If `confidence > 0.9` and `match` was correct -> Reinforce.
    *   If `match` was wrong -> Flag image for "Fine Tuning" or "Reference Gallery".
    *   Managers can review "Failed Scans" and link images to products to improve future matching (RAG).
