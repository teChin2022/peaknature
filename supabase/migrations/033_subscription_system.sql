-- Migration: Subscription System
-- Adds trial period tracking, subscription dates, and payment history

-- =====================================================
-- UPDATE TENANTS TABLE
-- =====================================================

-- Add subscription-related columns to tenants
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled'));

-- Update plan check constraint to only allow free and pro
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check 
  CHECK (plan IN ('free', 'pro'));

-- Set default trial dates for new tenants (2 months free trial)
-- This will be set by a trigger

-- =====================================================
-- SUBSCRIPTION PAYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  payment_method TEXT DEFAULT 'promptpay',
  payment_proof_url TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PLAN FEATURES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  limit_value INT, -- NULL means unlimited
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan, feature_key)
);

-- Insert default plan features
INSERT INTO plan_features (plan, feature_key, feature_name, description, limit_value, is_enabled) VALUES
  -- Free plan features (during trial, same as Pro)
  ('free', 'rooms', 'Number of Rooms', 'Maximum rooms you can create', 3, true),
  ('free', 'bookings_per_month', 'Bookings per Month', 'Maximum bookings per month', 50, true),
  ('free', 'analytics', 'Analytics', 'Access to analytics dashboard', NULL, false),
  ('free', 'custom_branding', 'Custom Branding', 'Upload logo and set colors', NULL, true),
  ('free', 'online_payments', 'Online Payments', 'Accept online payments', NULL, true),
  ('free', 'email_notifications', 'Email Notifications', 'Booking email notifications', NULL, true),
  ('free', 'line_notifications', 'LINE Notifications', 'LINE booking notifications', NULL, false),
  ('free', 'priority_support', 'Priority Support', 'Priority customer support', NULL, false),
  ('free', 'api_access', 'API Access', 'Access to API for integrations', NULL, false),
  
  -- Pro plan features (unlimited everything)
  ('pro', 'rooms', 'Number of Rooms', 'Maximum rooms you can create', NULL, true),
  ('pro', 'bookings_per_month', 'Bookings per Month', 'Maximum bookings per month', NULL, true),
  ('pro', 'analytics', 'Analytics', 'Access to analytics dashboard', NULL, true),
  ('pro', 'custom_branding', 'Custom Branding', 'Upload logo and set colors', NULL, true),
  ('pro', 'online_payments', 'Online Payments', 'Accept online payments', NULL, true),
  ('pro', 'email_notifications', 'Email Notifications', 'Booking email notifications', NULL, true),
  ('pro', 'line_notifications', 'LINE Notifications', 'LINE booking notifications', NULL, true),
  ('pro', 'priority_support', 'Priority Support', 'Priority customer support', NULL, true),
  ('pro', 'api_access', 'API Access', 'Access to API for integrations', NULL, true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- =====================================================
-- FUNCTION: Set trial dates on new tenant
-- =====================================================

CREATE OR REPLACE FUNCTION set_tenant_trial_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial dates (2 months from now)
  NEW.trial_started_at := NOW();
  NEW.trial_ends_at := NOW() + INTERVAL '2 months';
  NEW.subscription_status := 'trial';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new tenants
DROP TRIGGER IF EXISTS set_trial_dates_trigger ON tenants;
CREATE TRIGGER set_trial_dates_trigger
  BEFORE INSERT ON tenants
  FOR EACH ROW
  WHEN (NEW.trial_started_at IS NULL)
  EXECUTE FUNCTION set_tenant_trial_dates();

-- =====================================================
-- FUNCTION: Check and update subscription status
-- =====================================================

CREATE OR REPLACE FUNCTION check_subscription_status(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tenant_record RECORD;
  current_status TEXT;
BEGIN
  SELECT * INTO tenant_record FROM tenants WHERE id = tenant_uuid;
  
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  
  -- Check if trial has expired
  IF tenant_record.subscription_status = 'trial' AND tenant_record.trial_ends_at < NOW() THEN
    -- Check if they have an active subscription payment
    IF EXISTS (
      SELECT 1 FROM subscription_payments 
      WHERE tenant_id = tenant_uuid 
      AND status = 'verified'
      AND period_end >= CURRENT_DATE
    ) THEN
      current_status := 'active';
    ELSE
      current_status := 'expired';
    END IF;
    
    -- Update the tenant status
    UPDATE tenants SET subscription_status = current_status WHERE id = tenant_uuid;
    RETURN current_status;
  END IF;
  
  -- Check if subscription has expired
  IF tenant_record.subscription_status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM subscription_payments 
      WHERE tenant_id = tenant_uuid 
      AND status = 'verified'
      AND period_end >= CURRENT_DATE
    ) THEN
      current_status := 'expired';
      UPDATE tenants SET subscription_status = current_status WHERE id = tenant_uuid;
      RETURN current_status;
    END IF;
  END IF;
  
  RETURN tenant_record.subscription_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Subscription payments: Hosts can view their own, super_admin can do everything
CREATE POLICY "subscription_payments_select_host"
  ON subscription_payments FOR SELECT
  USING (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "subscription_payments_insert_host"
  ON subscription_payments FOR INSERT
  WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    OR public.is_super_admin()
  );

CREATE POLICY "subscription_payments_all_super_admin"
  ON subscription_payments FOR ALL
  USING (public.is_super_admin());

-- Plan features: Anyone can read
CREATE POLICY "plan_features_select_all"
  ON plan_features FOR SELECT
  USING (true);

CREATE POLICY "plan_features_all_super_admin"
  ON plan_features FOR ALL
  USING (public.is_super_admin());

-- =====================================================
-- UPDATE EXISTING TENANTS
-- =====================================================

-- Set trial dates for existing tenants that don't have them
UPDATE tenants 
SET 
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '2 months',
  subscription_status = CASE 
    WHEN plan = 'pro' THEN 'active'
    WHEN created_at + INTERVAL '2 months' < NOW() THEN 'expired'
    ELSE 'trial'
  END
WHERE trial_started_at IS NULL;

