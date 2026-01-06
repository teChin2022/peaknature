-- Create RPC function to get profile for deletion (bypasses RLS)
-- This allows hosts to verify guest profiles before deletion

CREATE OR REPLACE FUNCTION get_profile_for_deletion(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  role TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.role::TEXT,
    p.email
  FROM profiles p
  WHERE p.id = p_user_id
    AND p.tenant_id = p_tenant_id;
END;
$$;

-- Create RPC function to delete a guest (bypasses RLS)
-- This allows hosts to delete guest profiles from their tenant
CREATE OR REPLACE FUNCTION delete_tenant_guest(
  p_user_id UUID, 
  p_tenant_id UUID,
  p_host_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_role TEXT;
  v_host_role TEXT;
  v_host_tenant_id UUID;
BEGIN
  -- Verify the host is actually a host for this tenant
  SELECT role, tenant_id INTO v_host_role, v_host_tenant_id
  FROM profiles
  WHERE id = p_host_id;
  
  IF v_host_role != 'host' OR v_host_tenant_id != p_tenant_id THEN
    RAISE EXCEPTION 'Not authorized to delete users';
  END IF;
  
  -- Get the target user's role
  SELECT role INTO v_target_role
  FROM profiles
  WHERE id = p_user_id AND tenant_id = p_tenant_id;
  
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'User not found in this tenant';
  END IF;
  
  -- Don't allow deleting hosts or admins
  IF v_target_role IN ('host', 'super_admin') THEN
    RAISE EXCEPTION 'Cannot delete host or admin accounts';
  END IF;
  
  -- Delete related data
  DELETE FROM bookings WHERE user_id = p_user_id;
  DELETE FROM reviews WHERE user_id = p_user_id;
  DELETE FROM reservation_locks WHERE user_id = p_user_id;
  DELETE FROM date_waitlist WHERE user_id = p_user_id;
  
  -- Delete the profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create RPC function for self-deletion (bypasses RLS)
-- This allows guests to delete their own accounts
CREATE OR REPLACE FUNCTION delete_own_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Verify the user is deleting their own account
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only delete your own account';
  END IF;
  
  -- Get the user's role
  SELECT role INTO v_role
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Don't allow deleting hosts or admins through this function
  IF v_role IN ('host', 'super_admin') THEN
    RAISE EXCEPTION 'Cannot delete host or admin accounts through this method';
  END IF;
  
  -- Delete related data
  DELETE FROM bookings WHERE user_id = p_user_id;
  DELETE FROM reviews WHERE user_id = p_user_id;
  DELETE FROM reservation_locks WHERE user_id = p_user_id;
  DELETE FROM date_waitlist WHERE user_id = p_user_id;
  
  -- Delete the profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_for_deletion(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_tenant_guest(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_own_account(UUID) TO authenticated;

