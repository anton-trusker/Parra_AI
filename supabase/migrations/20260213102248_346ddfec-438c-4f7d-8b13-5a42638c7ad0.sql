
-- Add search_text and embedding columns to wines
ALTER TABLE public.wines
  ADD COLUMN IF NOT EXISTS search_text text,
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- Create GIN index for trigram similarity on search_text
CREATE INDEX IF NOT EXISTS idx_wines_search_text_trgm
  ON public.wines USING gin (search_text extensions.gin_trgm_ops);

-- Create HNSW index for vector similarity search on embedding
CREATE INDEX IF NOT EXISTS idx_wines_embedding_hnsw
  ON public.wines USING hnsw (embedding extensions.vector_cosine_ops);

-- Function to build search_text from wine fields
CREATE OR REPLACE FUNCTION public.build_wine_search_text(
  p_name text,
  p_producer text,
  p_vintage integer,
  p_region text,
  p_country text,
  p_appellation text,
  p_grape_varieties jsonb,
  p_volume_ml integer
)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT upper(trim(
    coalesce(p_producer, '') || ' ' ||
    coalesce(p_name, '') || ' ' ||
    CASE WHEN p_vintage IS NOT NULL THEN p_vintage::text ELSE '' END || ' ' ||
    coalesce(p_region, '') || ' ' ||
    coalesce(p_country, '') || ' ' ||
    coalesce(p_appellation, '') || ' ' ||
    CASE WHEN p_grape_varieties IS NOT NULL AND jsonb_typeof(p_grape_varieties) = 'array'
         THEN (SELECT string_agg(elem::text, ' ') FROM jsonb_array_elements_text(p_grape_varieties) AS elem)
         ELSE '' END || ' ' ||
    CASE WHEN p_volume_ml IS NOT NULL THEN p_volume_ml::text || 'ML' ELSE '' END
  ));
$$;

-- Trigger to auto-update search_text on wine insert/update
CREATE OR REPLACE FUNCTION public.fn_update_wine_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.search_text := public.build_wine_search_text(
    NEW.name, NEW.producer, NEW.vintage, NEW.region,
    NEW.country, NEW.appellation, NEW.grape_varieties, NEW.volume_ml
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wines_search_text
  BEFORE INSERT OR UPDATE OF name, producer, vintage, region, country, appellation, grape_varieties, volume_ml
  ON public.wines
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_wine_search_text();

-- Backfill search_text for existing wines
UPDATE public.wines SET search_text = public.build_wine_search_text(
  name, producer, vintage, region, country, appellation, grape_varieties, volume_ml
);

-- RPC: match wines by trigram similarity
CREATE OR REPLACE FUNCTION public.match_wines_trigram(
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  wine_id uuid,
  wine_name text,
  producer text,
  vintage integer,
  volume_ml integer,
  volume_label text,
  region text,
  country text,
  similarity_score real
)
LANGUAGE sql STABLE
SET search_path = 'public, extensions'
AS $$
  SELECT
    w.id,
    w.name,
    w.producer,
    w.vintage,
    w.volume_ml,
    w.volume_label,
    w.region,
    w.country,
    extensions.similarity(w.search_text, upper(p_query)) AS similarity_score
  FROM public.wines w
  WHERE w.is_active = true
    AND w.search_text IS NOT NULL
    AND extensions.similarity(w.search_text, upper(p_query)) > 0.1
  ORDER BY extensions.similarity(w.search_text, upper(p_query)) DESC
  LIMIT p_limit;
$$;

-- RPC: match wines by vector embedding cosine similarity
CREATE OR REPLACE FUNCTION public.match_wines_embedding(
  p_query_embedding extensions.vector(1536),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  wine_id uuid,
  wine_name text,
  producer text,
  vintage integer,
  volume_ml integer,
  volume_label text,
  region text,
  country text,
  cosine_score float
)
LANGUAGE plpgsql STABLE
SET search_path = 'public, extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.producer,
    w.vintage,
    w.volume_ml,
    w.volume_label,
    w.region,
    w.country,
    (1 - (w.embedding <=> p_query_embedding))::float AS cosine_score
  FROM public.wines w
  WHERE w.is_active = true
    AND w.embedding IS NOT NULL
  ORDER BY w.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;
