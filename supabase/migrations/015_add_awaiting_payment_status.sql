-- Migration: Add 'awaiting_payment' status to bookings
-- This allows bookings to be in a pending payment state

-- First, drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new check constraint with 'awaiting_payment' included
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'));

-- If using an enum type instead of check constraint, use this:
-- ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';

