-- Migration: Fix RLS policies for reservation_locks
-- Problem: Current policy only allows users to see their own locks
-- Solution: Allow everyone to SELECT (to check if dates are locked), 
--           but only own user can INSERT/UPDATE/DELETE

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own locks" ON reservation_locks;
DROP POLICY IF EXISTS "Users can create locks" ON reservation_locks;
DROP POLICY IF EXISTS "Users can delete their own locks" ON reservation_locks;
DROP POLICY IF EXISTS "Anyone can view all locks" ON reservation_locks;
DROP POLICY IF EXISTS "Users can create their own locks" ON reservation_locks;
DROP POLICY IF EXISTS "Users can update their own locks" ON reservation_locks;
DROP POLICY IF EXISTS "Users can delete own or expired locks" ON reservation_locks;

-- New policies:

-- Allow everyone (including anonymous) to SELECT all locks
-- This is needed so User B can see that User A has a lock
CREATE POLICY "Anyone can view all locks"
  ON reservation_locks FOR SELECT
  USING (true);

-- Only authenticated users can create locks for themselves
CREATE POLICY "Users can create their own locks"
  ON reservation_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the lock owner can update their lock
CREATE POLICY "Users can update their own locks"
  ON reservation_locks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own locks OR any expired locks
CREATE POLICY "Users can delete own or expired locks"
  ON reservation_locks FOR DELETE
  USING (auth.uid() = user_id OR expires_at < NOW());

-- Grant SELECT on reservation_locks to anon and authenticated
GRANT SELECT ON reservation_locks TO anon;
GRANT SELECT ON reservation_locks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON reservation_locks TO authenticated;

