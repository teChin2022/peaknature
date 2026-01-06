-- Migration: Payment System with PromptPay + EasySlip
-- This adds reservation locks, payment tracking, and notification queue

-- ============================================================================
-- 1. RESERVATION LOCKS TABLE
-- Tracks temporary locks when a guest is in the payment process
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservation_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate locks for same room/dates
  CONSTRAINT unique_room_date_lock UNIQUE (room_id, check_in, check_out)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_reservation_locks_room_dates 
  ON reservation_locks(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservation_locks_expires 
  ON reservation_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservation_locks_user 
  ON reservation_locks(user_id);

-- ============================================================================
-- 2. ADD PAYMENT FIELDS TO BOOKINGS
-- ============================================================================
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS payment_slip_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS easyslip_data JSONB,
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);

-- Add 'awaiting_payment' to booking status if not exists
-- Note: We'll handle this in application logic since enum modification can be tricky

-- ============================================================================
-- 3. NOTIFICATION QUEUE TABLE
-- For email and LINE notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'line')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
  ON notification_queue(status, created_at);

-- ============================================================================
-- 4. WAITING QUEUE TABLE
-- Guests waiting for locked dates to become available
-- ============================================================================
CREATE TABLE IF NOT EXISTS date_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One entry per user per room/dates
  CONSTRAINT unique_waitlist_entry UNIQUE (room_id, user_id, check_in, check_out)
);

CREATE INDEX IF NOT EXISTS idx_date_waitlist_room_dates 
  ON date_waitlist(room_id, check_in, check_out);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to check if dates are locked by another user
CREATE OR REPLACE FUNCTION check_reservation_lock(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by UUID,
  expires_at TIMESTAMPTZ,
  seconds_remaining INTEGER
) AS $$
BEGIN
  -- Clean up expired locks first
  DELETE FROM reservation_locks WHERE expires_at < NOW();
  
  RETURN QUERY
  SELECT 
    TRUE AS is_locked,
    rl.user_id AS locked_by,
    rl.expires_at,
    EXTRACT(EPOCH FROM (rl.expires_at - NOW()))::INTEGER AS seconds_remaining
  FROM reservation_locks rl
  WHERE rl.room_id = p_room_id
    AND rl.check_in < p_check_out  -- Overlapping dates
    AND rl.check_out > p_check_in
    AND (p_user_id IS NULL OR rl.user_id != p_user_id)  -- Not the same user
    AND rl.expires_at > NOW()
  LIMIT 1;
  
  -- If no rows returned, dates are not locked
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ, NULL::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a reservation lock
CREATE OR REPLACE FUNCTION create_reservation_lock(
  p_room_id UUID,
  p_user_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_timeout_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  success BOOLEAN,
  lock_id UUID,
  expires_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
DECLARE
  v_lock_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_existing_lock RECORD;
BEGIN
  -- Clean up expired locks first
  DELETE FROM reservation_locks WHERE expires_at < NOW();
  
  -- Check if dates are already locked by another user
  SELECT * INTO v_existing_lock
  FROM reservation_locks rl
  WHERE rl.room_id = p_room_id
    AND rl.check_in < p_check_out
    AND rl.check_out > p_check_in
    AND rl.user_id != p_user_id
    AND rl.expires_at > NOW()
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, v_existing_lock.expires_at, 
      'Dates are locked by another guest'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user already has a lock on these dates (extend it)
  SELECT id, expires_at INTO v_lock_id, v_expires_at
  FROM reservation_locks
  WHERE room_id = p_room_id
    AND user_id = p_user_id
    AND check_in = p_check_in
    AND check_out = p_check_out;
  
  IF FOUND THEN
    -- Extend existing lock
    v_expires_at := NOW() + (p_timeout_minutes || ' minutes')::INTERVAL;
    UPDATE reservation_locks 
    SET expires_at = v_expires_at
    WHERE id = v_lock_id;
    
    RETURN QUERY SELECT TRUE, v_lock_id, v_expires_at, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create new lock
  v_expires_at := NOW() + (p_timeout_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO reservation_locks (room_id, user_id, check_in, check_out, expires_at)
  VALUES (p_room_id, p_user_id, p_check_in, p_check_out, v_expires_at)
  RETURNING id INTO v_lock_id;
  
  RETURN QUERY SELECT TRUE, v_lock_id, v_expires_at, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release a reservation lock
CREATE OR REPLACE FUNCTION release_reservation_lock(
  p_room_id UUID,
  p_user_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM reservation_locks
  WHERE room_id = p_room_id
    AND user_id = p_user_id
    AND check_in = p_check_in
    AND check_out = p_check_out;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify waitlist when dates become available
CREATE OR REPLACE FUNCTION notify_waitlist_on_lock_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark waitlist entries for notification
  UPDATE date_waitlist
  SET notified = FALSE
  WHERE room_id = OLD.room_id
    AND check_in < OLD.check_out
    AND check_out > OLD.check_in
    AND notified = FALSE;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify waitlist when lock expires/released
DROP TRIGGER IF EXISTS trigger_notify_waitlist ON reservation_locks;
CREATE TRIGGER trigger_notify_waitlist
  AFTER DELETE ON reservation_locks
  FOR EACH ROW
  EXECUTE FUNCTION notify_waitlist_on_lock_release();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE reservation_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_waitlist ENABLE ROW LEVEL SECURITY;

-- Reservation locks policies
CREATE POLICY "Users can view their own locks"
  ON reservation_locks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create locks"
  ON reservation_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks"
  ON reservation_locks FOR DELETE
  USING (auth.uid() = user_id);

-- Notification queue policies (hosts can view their tenant's notifications)
CREATE POLICY "Hosts can view tenant notifications"
  ON notification_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = notification_queue.tenant_id
        AND profiles.role = 'host'
    )
  );

-- Date waitlist policies
CREATE POLICY "Users can view their waitlist entries"
  ON date_waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to waitlist"
  ON date_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from waitlist"
  ON date_waitlist FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. GRANT PERMISSIONS TO RPC FUNCTIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION check_reservation_lock TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_reservation_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_reservation_lock TO authenticated;

-- ============================================================================
-- 8. SCHEDULED CLEANUP (Run via Supabase Edge Function or pg_cron)
-- Clean up expired locks every minute
-- ============================================================================
-- If using pg_cron extension:
-- SELECT cron.schedule('cleanup-expired-locks', '* * * * *', 
--   'DELETE FROM reservation_locks WHERE expires_at < NOW()');

