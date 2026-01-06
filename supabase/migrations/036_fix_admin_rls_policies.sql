-- Fix RLS policies for super_admin to properly allow UPDATE operations
-- The original policies were missing WITH CHECK clauses

-- =====================================================
-- FIX TENANTS POLICIES
-- =====================================================

-- Drop and recreate the super_admin policy for tenants with proper WITH CHECK
DROP POLICY IF EXISTS "tenants_all_super_admin" ON tenants;

CREATE POLICY "tenants_all_super_admin"
  ON tenants FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- =====================================================
-- FIX PROFILES POLICIES  
-- =====================================================

-- Drop and recreate the super_admin policy for profiles with proper WITH CHECK
DROP POLICY IF EXISTS "profiles_all_super_admin" ON profiles;

CREATE POLICY "profiles_all_super_admin"
  ON profiles FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- =====================================================
-- VERIFY is_super_admin function exists and works
-- =====================================================

-- Recreate the is_super_admin function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

