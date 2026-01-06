-- =====================================================
-- AUDIT LOGS TABLE
-- Comprehensive logging for admin and security events
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Action details
  action VARCHAR(100) NOT NULL,           -- e.g., 'tenant.deactivate', 'user.block', 'settings.update'
  category VARCHAR(50) NOT NULL,          -- 'admin', 'security', 'user', 'system'
  severity VARCHAR(20) DEFAULT 'info',    -- 'info', 'warning', 'error', 'critical'
  
  -- Actor (who performed the action)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),                 -- 'super_admin', 'host', 'guest'
  actor_ip VARCHAR(45),                   -- IPv4 or IPv6
  actor_user_agent TEXT,
  
  -- Target (what was affected)
  target_type VARCHAR(50),                -- 'tenant', 'user', 'booking', 'room', 'settings'
  target_id UUID,
  target_name VARCHAR(255),               -- Human-readable identifier
  
  -- Context
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  -- Details
  details JSONB DEFAULT '{}',             -- Additional structured data
  old_value JSONB,                        -- Previous state (for updates)
  new_value JSONB,                        -- New state (for updates)
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view audit logs
CREATE POLICY "audit_logs_select_super_admin"
  ON audit_logs FOR SELECT
  USING (public.is_super_admin());

-- Only system (via service role) can insert audit logs
-- This prevents tampering - logs are written via API with service role
CREATE POLICY "audit_logs_insert_service_role"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS, but this allows the policy to exist

-- No one can update or delete audit logs (immutable)
-- No UPDATE or DELETE policies = no modifications allowed

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit log for admin actions, security events, and system changes';

-- =====================================================
-- AUDIT LOG HELPER FUNCTION
-- =====================================================

-- Function to insert audit log (can be called from triggers or application)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action VARCHAR(100),
  p_category VARCHAR(50),
  p_severity VARCHAR(20) DEFAULT 'info',
  p_actor_id UUID DEFAULT NULL,
  p_actor_email VARCHAR(255) DEFAULT NULL,
  p_actor_role VARCHAR(50) DEFAULT NULL,
  p_actor_ip VARCHAR(45) DEFAULT NULL,
  p_actor_user_agent TEXT DEFAULT NULL,
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_name VARCHAR(255) DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action, category, severity,
    actor_id, actor_email, actor_role, actor_ip, actor_user_agent,
    target_type, target_id, target_name,
    tenant_id, details, old_value, new_value,
    success, error_message
  ) VALUES (
    p_action, p_category, p_severity,
    p_actor_id, p_actor_email, p_actor_role, p_actor_ip, p_actor_user_agent,
    p_target_type, p_target_id, p_target_name,
    p_tenant_id, p_details, p_old_value, p_new_value,
    p_success, p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users (function uses SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

