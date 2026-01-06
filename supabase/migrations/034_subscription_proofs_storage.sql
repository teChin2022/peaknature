-- Migration: Subscription Proofs Storage Bucket
-- Create storage bucket for subscription payment proofs

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('subscription-proofs', 'subscription-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (hosts) to upload their payment proofs
CREATE POLICY "subscription_proofs_insert_host"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'subscription-proofs'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own proofs
CREATE POLICY "subscription_proofs_update_host"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'subscription-proofs'
    AND auth.role() = 'authenticated'
  );

-- Allow public read access (for admin to view)
CREATE POLICY "subscription_proofs_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'subscription-proofs');

-- Allow super admin to delete
CREATE POLICY "subscription_proofs_delete_super_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'subscription-proofs'
    AND public.is_super_admin()
  );

