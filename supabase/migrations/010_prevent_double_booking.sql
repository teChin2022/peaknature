-- Migration: Add database-level protection against double bookings
-- This trigger prevents overlapping bookings for the same room

-- Function to check for overlapping bookings
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  -- Only check for pending and confirmed bookings
  IF NEW.status IN ('pending', 'confirmed') THEN
    SELECT COUNT(*) INTO overlap_count
    FROM bookings
    WHERE room_id = NEW.room_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND status IN ('pending', 'confirmed')
      AND check_in < NEW.check_out
      AND check_out > NEW.check_in;
    
    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'Booking dates overlap with an existing booking for this room';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_booking_overlap ON bookings;

-- Create trigger to run before INSERT or UPDATE
CREATE TRIGGER prevent_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Add comment for documentation
COMMENT ON FUNCTION check_booking_overlap() IS 
'Prevents double bookings by checking for overlapping date ranges on the same room. 
Only applies to bookings with status pending or confirmed.';

