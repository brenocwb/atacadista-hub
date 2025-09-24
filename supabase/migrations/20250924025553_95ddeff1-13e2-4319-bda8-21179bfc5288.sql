-- Create a security definer function for sales reports instead of a view
CREATE OR REPLACE FUNCTION public.get_sales_reports(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  representative_name TEXT,
  representative_id UUID,
  total_orders BIGINT,
  total_sales NUMERIC,
  total_commissions NUMERIC,
  month_year TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.full_name as representative_name,
    p.id as representative_id,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_sales,
    COALESCE(SUM(o.commission_amount), 0) as total_commissions,
    DATE_TRUNC('month', o.created_at) as month_year
  FROM public.profiles p
  LEFT JOIN public.orders o ON p.id = o.representative_id
  WHERE p.role = 'representante' 
    AND (start_date IS NULL OR o.created_at >= start_date)
    AND (end_date IS NULL OR o.created_at <= end_date)
    AND is_admin() -- Only admins can call this function
  GROUP BY p.id, p.full_name, DATE_TRUNC('month', o.created_at)
  ORDER BY month_year DESC, total_sales DESC;
$$;