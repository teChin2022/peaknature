-- =====================================================
-- FIX: Update reviews insert policy
-- =====================================================
-- Allow users to insert reviews for bookings where:
-- 1. They own the booking
-- 2. The booking is either 'completed' OR the checkout date is in the past
-- 3. The booking is not cancelled

-- Drop existing policy
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;

-- Create new policy that allows reviews for past bookings too
CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status != 'cancelled'
      AND (
        bookings.status = 'completed' 
        OR bookings.check_out < CURRENT_DATE
      )
    )
  );

