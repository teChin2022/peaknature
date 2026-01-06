-- =====================================================
-- FIX: Allow hosts to view profiles of guests who booked at their tenant
-- =====================================================
-- The current policy only allows hosts to see profiles with matching tenant_id
-- But guests have tenant_id = NULL, so hosts can't see their names

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "profiles_select_host_guests" ON profiles;

-- Create a new policy that allows hosts to see:
-- 1. Their own tenant's staff (profiles with matching tenant_id)
-- 2. Guests who have made bookings at their tenant
CREATE POLICY "profiles_select_host_guests"
  ON profiles FOR SELECT
  USING (
    public.is_host() 
    AND (
      -- Can see their own tenant's staff
      tenant_id = public.get_my_tenant_id()
      OR
      -- Can see guests who have bookings at their tenant
      id IN (
        SELECT DISTINCT b.user_id 
        FROM bookings b
        WHERE b.tenant_id = public.get_my_tenant_id()
      )
    )
  );

