-- Migration: Create function to get booked dates for a room
-- This bypasses RLS to show all bookings for availability checking

-- Function to get booked date ranges for a room (for calendar display)
CREATE OR REPLACE FUNCTION public.get_room_booked_dates(p_room_id UUID)
RETURNS TABLE (
  check_in DATE,
  check_out DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.check_in,
    b.check_out
  FROM public.bookings b
  WHERE b.room_id = p_room_id
    AND b.status IN ('pending', 'confirmed')
    AND b.check_out >= CURRENT_DATE
  ORDER BY b.check_in;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all (including anonymous)
GRANT EXECUTE ON FUNCTION public.get_room_booked_dates TO anon;
GRANT EXECUTE ON FUNCTION public.get_room_booked_dates TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_room_booked_dates(UUID) IS 
'Returns booked date ranges for a specific room. Used for calendar availability display.
Only returns check_in and check_out dates (no user info) for privacy.
Bypasses RLS to show all bookings regardless of who made them.';

