-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - FIXED
-- =====================================================

-- First, drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get user role without recursion
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_host()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'host'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- TENANTS POLICIES
-- =====================================================

-- Anyone can view active tenants (for public pages)
CREATE POLICY "tenants_select_active"
  ON tenants FOR SELECT
  USING (is_active = true);

-- Hosts can update their own tenant settings (name, logo, color)
CREATE POLICY "tenants_update_host"
  ON tenants FOR UPDATE
  USING (
    public.is_host() 
    AND id = public.get_my_tenant_id()
  );

-- Super admins can do everything with tenants
CREATE POLICY "tenants_all_super_admin"
  ON tenants FOR ALL
  USING (public.is_super_admin());

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Super admins can view all profiles
CREATE POLICY "profiles_select_super_admin"
  ON profiles FOR SELECT
  USING (public.is_super_admin());

-- Super admins can manage all profiles
CREATE POLICY "profiles_all_super_admin"
  ON profiles FOR ALL
  USING (public.is_super_admin());

-- Hosts can view profiles of guests in their tenant
CREATE POLICY "profiles_select_host_guests"
  ON profiles FOR SELECT
  USING (
    public.is_host() 
    AND tenant_id = public.get_my_tenant_id()
  );

-- =====================================================
-- ROOMS POLICIES
-- =====================================================

-- Anyone can view active rooms (for public pages)
CREATE POLICY "rooms_select_active"
  ON rooms FOR SELECT
  USING (is_active = true);

-- Hosts can view all their tenant's rooms (including inactive)
CREATE POLICY "rooms_select_host"
  ON rooms FOR SELECT
  USING (
    public.is_host() 
    AND tenant_id = public.get_my_tenant_id()
  );

-- Hosts can manage rooms in their tenant
CREATE POLICY "rooms_all_host"
  ON rooms FOR ALL
  USING (
    public.is_host() 
    AND tenant_id = public.get_my_tenant_id()
  );

-- Super admins can manage all rooms
CREATE POLICY "rooms_all_super_admin"
  ON rooms FOR ALL
  USING (public.is_super_admin());

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Users can view their own bookings
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create bookings
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending bookings (e.g., cancel)
CREATE POLICY "bookings_update_own"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Hosts can view bookings for their tenant
CREATE POLICY "bookings_select_host"
  ON bookings FOR SELECT
  USING (
    public.is_host() 
    AND tenant_id = public.get_my_tenant_id()
  );

-- Hosts can update bookings for their tenant (confirm/cancel)
CREATE POLICY "bookings_update_host"
  ON bookings FOR UPDATE
  USING (
    public.is_host() 
    AND tenant_id = public.get_my_tenant_id()
  );

-- Super admins can manage all bookings
CREATE POLICY "bookings_all_super_admin"
  ON bookings FOR ALL
  USING (public.is_super_admin());

-- =====================================================
-- ROOM_AVAILABILITY POLICIES
-- =====================================================

-- Anyone can view room availability (for calendar)
CREATE POLICY "room_availability_select_all"
  ON room_availability FOR SELECT
  USING (true);

-- Hosts can manage availability for their rooms
CREATE POLICY "room_availability_all_host"
  ON room_availability FOR ALL
  USING (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_availability.room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  );

-- Super admins can manage all availability
CREATE POLICY "room_availability_all_super_admin"
  ON room_availability FOR ALL
  USING (public.is_super_admin());

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can view reviews (for public pages)
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (true);

-- Users can create reviews for their completed bookings
CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Users can update their own reviews
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Super admins can manage all reviews
CREATE POLICY "reviews_all_super_admin"
  ON reviews FOR ALL
  USING (public.is_super_admin());
