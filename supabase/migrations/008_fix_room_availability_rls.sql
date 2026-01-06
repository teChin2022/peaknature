-- =====================================================
-- FIX ROOM AVAILABILITY RLS POLICY FOR INSERT
-- =====================================================

-- Drop existing host policy
DROP POLICY IF EXISTS "room_availability_all_host" ON room_availability;

-- Recreate with proper WITH CHECK for INSERT
CREATE POLICY "room_availability_select_host"
  ON room_availability FOR SELECT
  USING (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_availability.room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  );

CREATE POLICY "room_availability_insert_host"
  ON room_availability FOR INSERT
  WITH CHECK (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  );

CREATE POLICY "room_availability_update_host"
  ON room_availability FOR UPDATE
  USING (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_availability.room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  )
  WITH CHECK (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  );

CREATE POLICY "room_availability_delete_host"
  ON room_availability FOR DELETE
  USING (
    public.is_host() 
    AND EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_availability.room_id 
      AND rooms.tenant_id = public.get_my_tenant_id()
    )
  );

