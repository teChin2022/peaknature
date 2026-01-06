-- =====================================================
-- PROMPTPAY QR CODE STORAGE BUCKET
-- Storage for admin PromptPay QR code images
-- =====================================================

-- Create the storage bucket for PromptPay QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promptpay-qr',
  'promptpay-qr',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Allow super admins to upload and manage QR codes
CREATE POLICY "promptpay_qr_insert_super_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'promptpay-qr' 
    AND public.is_super_admin()
  );

CREATE POLICY "promptpay_qr_update_super_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'promptpay-qr' 
    AND public.is_super_admin()
  );

CREATE POLICY "promptpay_qr_delete_super_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'promptpay-qr' 
    AND public.is_super_admin()
  );

-- Allow public read access (for displaying QR code)
CREATE POLICY "promptpay_qr_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'promptpay-qr');

