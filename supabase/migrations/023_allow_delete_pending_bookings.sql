-- =====================================================
-- FIX: Allow users to delete their own pending bookings
-- =====================================================
-- This is needed so that when payment verification fails,
-- the pending booking can be automatically deleted.

-- Users can delete their own pending bookings (for failed payments)
CREATE POLICY "bookings_delete_own_pending"
  ON bookings FOR DELETE
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

