-- Database functions for stock queries and inventory management

-- Function: get_stock_by_store
CREATE OR REPLACE FUNCTION get_stock_by_store(
  p_business_id uuid DEFAULT NULL,
  p_store_ids uuid[] DEFAULT NULL,
  p_category_ids uuid[] DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category_name text,
  sku text,
  stores jsonb,
  total_unopened numeric,
  total_open_ml numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.sku,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'store_id', s.id,
          'store_name', s.name,
          'unopened', COALESCE(sl.quantity, 0),
          'open_ml', COALESCE(sl.open_quantity_ml, 0),
          'last_counted', sl.last_counted_at
        ) ORDER BY s.name
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) as stores,
    COALESCE(SUM(sl.quantity), 0) as total_unopened,
    COALESCE(SUM(sl.open_quantity_ml), 0) as total_open_ml
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN stock_levels sl ON p.id = sl.product_id
  LEFT JOIN stores s ON sl.store_id = s.id
  WHERE 
    p.is_deleted = false 
    AND p.is_active = true
    AND (p_business_id IS NULL OR p.business_id = p_business_id)
    AND (p_store_ids IS NULL OR s.id = ANY(p_store_ids))
    AND (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
    AND (p_search IS NULL OR 
         p.name ILIKE '%' || p_search || '%' OR
         p.sku ILIKE '%' || p_search || '%')
  GROUP BY p.id, p.name, c.name, p.sku
  HAVING COALESCE(SUM(sl.quantity), 0) > 0 OR COALESCE(SUM(sl.open_quantity_ml), 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_stock_by_store TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_by_store TO anon;

-- Function: get_inventory_sessions
CREATE OR REPLACE FUNCTION get_inventory_sessions(
  p_business_id uuid DEFAULT NULL,
  p_store_ids uuid[] DEFAULT NULL,
  p_status text[] DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  session_id uuid,
  session_name text,
  store_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  created_by_name text,
  total_items bigint,
  total_variance numeric,
  completed_items bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    isess.id as session_id,
    isess.name as session_name,
    s.name as store_name,
    isess.status,
    isess.created_at,
    isess.updated_at,
    u.name as created_by_name,
    COUNT(ii.id) as total_items,
    COALESCE(SUM(ii.variance), 0) as total_variance,
    COUNT(ii.id) FILTER (WHERE ii.status = 'completed') as completed_items
  FROM inventory_sessions isess
  LEFT JOIN stores s ON isess.store_id = s.id
  LEFT JOIN users u ON isess.created_by = u.id
  LEFT JOIN inventory_items ii ON isess.id = ii.session_id
  WHERE 
    (p_business_id IS NULL OR isess.business_id = p_business_id)
    AND (p_store_ids IS NULL OR isess.store_id = ANY(p_store_ids))
    AND (p_status IS NULL OR isess.status = ANY(p_status))
    AND (p_start_date IS NULL OR DATE(isess.created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(isess.created_at) <= p_end_date)
  GROUP BY isess.id, isess.name, s.name, isess.status, isess.created_at, isess.updated_at, u.name
  ORDER BY isess.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_inventory_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_sessions TO anon;

-- Function: get_inventory_session_items
CREATE OR REPLACE FUNCTION get_inventory_session_items(
  p_session_id uuid
)
RETURNS TABLE (
  item_id uuid,
  product_id uuid,
  product_name text,
  product_sku text,
  category_name text,
  baseline_quantity numeric,
  counted_quantity numeric,
  variance numeric,
  variance_percentage numeric,
  status text,
  last_counted_by text,
  last_counted_at timestamptz,
  store_name text,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.id as item_id,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    c.name as category_name,
    ii.baseline_quantity,
    ii.counted_quantity,
    ii.variance,
    CASE 
      WHEN ii.baseline_quantity = 0 THEN NULL
      ELSE ROUND((ii.variance / ii.baseline_quantity) * 100, 2)
    END as variance_percentage,
    ii.status,
    u.name as last_counted_by,
    ii.last_counted_at,
    s.name as store_name,
    ii.notes
  FROM inventory_items ii
  LEFT JOIN products p ON ii.product_id = p.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN users u ON ii.last_counted_by = u.id
  LEFT JOIN stores s ON ii.store_id = s.id
  WHERE ii.session_id = p_session_id
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_inventory_session_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_session_items TO anon;

-- Function: get_ai_recognition_attempts
CREATE OR REPLACE FUNCTION get_ai_recognition_attempts(
  p_business_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  attempt_id uuid,
  session_name text,
  product_name text,
  product_sku text,
  confidence_score numeric,
  recognition_method text,
  image_url text,
  created_at timestamptz,
  user_name text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ara.id as attempt_id,
    isess.name as session_name,
    p.name as product_name,
    p.sku as product_sku,
    ara.confidence_score,
    ara.recognition_method,
    ara.image_url,
    ara.created_at,
    u.name as user_name,
    ara.status
  FROM ai_recognition_attempts ara
  LEFT JOIN inventory_sessions isess ON ara.session_id = isess.id
  LEFT JOIN products p ON ara.product_id = p.id
  LEFT JOIN users u ON ara.user_id = u.id
  WHERE 
    (p_business_id IS NULL OR isess.business_id = p_business_id)
    AND (p_user_id IS NULL OR ara.user_id = p_user_id)
    AND (p_session_id IS NULL OR ara.session_id = p_session_id)
    AND (p_start_date IS NULL OR DATE(ara.created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(ara.created_at) <= p_end_date)
  ORDER BY ara.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_ai_recognition_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_recognition_attempts TO anon;

-- Function: get_stores
CREATE OR REPLACE FUNCTION get_stores(
  p_business_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  store_code text,
  address text,
  is_active boolean,
  syrve_store_id text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.code as store_code,
    s.address,
    s.is_active,
    s.syrve_store_id,
    s.created_at
  FROM stores s
  WHERE 
    (p_business_id IS NULL OR s.business_id = p_business_id)
    AND (p_is_active IS NULL OR s.is_active = p_is_active)
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_stores TO authenticated;
GRANT EXECUTE ON FUNCTION get_stores TO anon;

-- Function: get_users
CREATE OR REPLACE FUNCTION get_users(
  p_business_id uuid DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  is_active boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    ur.role as user_role,
    u.is_active,
    u.created_at,
    u.last_sign_in_at
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE 
    (p_business_id IS NULL OR u.business_id = p_business_id)
    AND (p_role IS NULL OR ur.role = p_role)
    AND (p_is_active IS NULL OR u.is_active = p_is_active)
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_users TO anon;