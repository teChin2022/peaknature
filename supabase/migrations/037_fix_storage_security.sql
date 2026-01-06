-- =====================================================
-- FIX STORAGE BUCKET SECURITY POLICIES
-- Restrict uploads to appropriate roles only
-- =====================================================

-- ============================================================================
-- 1. FIX TENANTS BUCKET - Only hosts/admins can upload
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload to tenants" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update tenant files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete tenant files" ON storage.objects;

-- Hosts can upload to tenants bucket (for QR codes, logos, etc.)
CREATE POLICY "Hosts can upload to tenants"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenants' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- Hosts can update their tenant files
CREATE POLICY "Hosts can update tenant files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tenants' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- Hosts can delete their tenant files
CREATE POLICY "Hosts can delete tenant files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tenants' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- ============================================================================
-- 2. FIX BOOKINGS BUCKET - Only authenticated guests can upload payment slips
-- ============================================================================

-- Keep existing policies but ensure they're properly scoped
-- The current policy allows any authenticated user to upload, which is correct
-- for payment slips since guests need to upload them

-- ============================================================================
-- 3. CREATE ROOMS BUCKET FOR ROOM IMAGES (if not exists)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rooms',
  'rooms',
  true,
  5242880, -- 5MB limit for room images
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Public can view room images
DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
CREATE POLICY "Public can view room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rooms');

-- Only hosts/admins can upload room images
DROP POLICY IF EXISTS "Hosts can upload room images" ON storage.objects;
CREATE POLICY "Hosts can upload room images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rooms' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- Only hosts/admins can update room images
DROP POLICY IF EXISTS "Hosts can update room images" ON storage.objects;
CREATE POLICY "Hosts can update room images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'rooms' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- Only hosts/admins can delete room images
DROP POLICY IF EXISTS "Hosts can delete room images" ON storage.objects;
CREATE POLICY "Hosts can delete room images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'rooms' 
    AND (public.is_host() OR public.is_super_admin())
  );

-- ============================================================================
-- 4. ADD FILE SIZE AND TYPE RESTRICTIONS TO EXISTING BUCKETS
-- ============================================================================

-- Update tenants bucket with restrictions
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
WHERE id = 'tenants';

-- Update bookings bucket with restrictions (payment slips)
UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10MB for payment slips (can be photos)
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
WHERE id = 'bookings';

