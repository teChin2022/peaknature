-- Migration: Create Storage Buckets for uploads
-- This creates the necessary storage buckets for file uploads

-- ============================================================================
-- 1. CREATE TENANTS BUCKET (for QR code images)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants', 'tenants', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE BOOKINGS BUCKET (for payment slips)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('bookings', 'bookings', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. STORAGE POLICIES FOR TENANTS BUCKET
-- ============================================================================

-- Anyone can view tenant files (public QR codes)
DROP POLICY IF EXISTS "Public can view tenant files" ON storage.objects;
CREATE POLICY "Public can view tenant files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenants');

-- Authenticated users can upload to tenants bucket
DROP POLICY IF EXISTS "Authenticated users can upload to tenants" ON storage.objects;
CREATE POLICY "Authenticated users can upload to tenants"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tenants' AND auth.role() = 'authenticated');

-- Authenticated users can update their uploads
DROP POLICY IF EXISTS "Authenticated users can update tenant files" ON storage.objects;
CREATE POLICY "Authenticated users can update tenant files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tenants' AND auth.role() = 'authenticated');

-- Authenticated users can delete their uploads
DROP POLICY IF EXISTS "Authenticated users can delete tenant files" ON storage.objects;
CREATE POLICY "Authenticated users can delete tenant files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tenants' AND auth.role() = 'authenticated');

-- ============================================================================
-- 4. STORAGE POLICIES FOR BOOKINGS BUCKET
-- ============================================================================

-- Anyone can view booking files (payment slips need to be readable)
DROP POLICY IF EXISTS "Public can view booking files" ON storage.objects;
CREATE POLICY "Public can view booking files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bookings');

-- Authenticated users can upload payment slips
DROP POLICY IF EXISTS "Authenticated users can upload payment slips" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment slips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bookings' AND auth.role() = 'authenticated');

-- Authenticated users can update their slips
DROP POLICY IF EXISTS "Authenticated users can update booking files" ON storage.objects;
CREATE POLICY "Authenticated users can update booking files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'bookings' AND auth.role() = 'authenticated');

-- Authenticated users can delete their slips
DROP POLICY IF EXISTS "Authenticated users can delete booking files" ON storage.objects;
CREATE POLICY "Authenticated users can delete booking files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bookings' AND auth.role() = 'authenticated');

