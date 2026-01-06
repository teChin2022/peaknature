-- Migration: Fix tenant cascade delete
-- The bookings table was created without ON DELETE CASCADE, preventing tenant deletion

-- Drop the existing foreign key constraint and recreate with CASCADE
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_tenant_id_fkey;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_tenant_id_fkey 
  FOREIGN KEY (tenant_id) 
  REFERENCES tenants(id) 
  ON DELETE CASCADE;

-- Also fix room_id foreign key to cascade on room deletion
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_room_id_fkey;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_room_id_fkey 
  FOREIGN KEY (room_id) 
  REFERENCES rooms(id) 
  ON DELETE CASCADE;

-- Fix user_id to set null on user deletion (don't delete bookings when user is deleted)
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Make user_id nullable to support SET NULL
ALTER TABLE bookings 
  ALTER COLUMN user_id DROP NOT NULL;

