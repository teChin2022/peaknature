-- =====================================================
-- RPC FUNCTION: Get tenant stats (bypasses RLS)
-- =====================================================
-- This function allows fetching tenant statistics
-- without requiring authentication (for landing page)

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_tenant_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_tenant_stats(p_tenant_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INT,
  guest_count INT,
  room_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH review_stats AS (
    -- Reviews are linked to bookings, which are linked to rooms
    -- Join: reviews -> bookings -> check tenant_id
    SELECT 
      CASE 
        WHEN COUNT(r.id) > 0 THEN ROUND(AVG(r.rating)::NUMERIC, 1)
        ELSE NULL
      END as avg_rating,
      COUNT(r.id)::INT as review_count
    FROM public.reviews r
    INNER JOIN public.bookings b ON r.booking_id = b.id
    WHERE b.tenant_id = p_tenant_id
  ),
  guest_stats AS (
    SELECT COUNT(DISTINCT user_id)::INT as unique_guests
    FROM public.bookings
    WHERE bookings.tenant_id = p_tenant_id
    AND status IN ('confirmed', 'completed')
  ),
  room_stats AS (
    SELECT COUNT(*)::INT as active_rooms
    FROM public.rooms
    WHERE tenant_id = p_tenant_id AND is_active = true
  )
  SELECT 
    rs.avg_rating,
    rs.review_count,
    gs.unique_guests,
    rms.active_rooms
  FROM review_stats rs, guest_stats gs, room_stats rms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_stats(UUID) TO authenticated;

