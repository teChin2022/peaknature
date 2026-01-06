-- Migration: Database Cleanup and Optimization
-- Fixes: Unused columns, currency defaults, missing indexes, FK behavior, JSONB defaults

-- =====================================================
-- 1. REMOVE UNUSED COLUMNS
-- =====================================================

-- Remove Stripe-related columns (not using Stripe, using PromptPay)
ALTER TABLE tenants DROP COLUMN IF EXISTS stripe_account_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS stripe_payment_id;

-- Remove promptpay_id from platform_settings (using QR image upload instead)
ALTER TABLE platform_settings DROP COLUMN IF EXISTS promptpay_id;

-- =====================================================
-- 2. FIX CURRENCY DEFAULT (uppercase THB)
-- =====================================================

-- Update default_currency to uppercase
ALTER TABLE platform_settings 
  ALTER COLUMN default_currency SET DEFAULT 'THB';

-- Fix any existing lowercase values
UPDATE platform_settings 
SET default_currency = UPPER(default_currency)
WHERE default_currency IS NOT NULL;

-- =====================================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Bookings: created_at for time-based analytics
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Subscription payments: tenant_id for filtering
CREATE INDEX IF NOT EXISTS idx_subscription_payments_tenant ON subscription_payments(tenant_id);

-- Subscription payments: status for admin queries
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- Profiles: created_at for user growth analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Tenants: subscription_status for filtering
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);

-- Tenants: plan for filtering
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);

-- =====================================================
-- 4. FIX REVIEWS.USER_ID FOREIGN KEY
-- =====================================================

-- Drop existing constraint if exists
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Recreate with ON DELETE SET NULL (keep reviews when user is deleted)
ALTER TABLE reviews 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE reviews 
  ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- =====================================================
-- 5. UPDATE TENANTS.SETTINGS JSONB DEFAULT
-- =====================================================

-- Update the default settings to match TypeScript TenantSettings
ALTER TABLE tenants 
  ALTER COLUMN settings SET DEFAULT '{
    "currency": "THB",
    "hero": {
      "tagline": "Highly Rated Homestay",
      "description": "Discover comfort and tranquility in our carefully curated spaces. Your perfect retreat awaits with authentic hospitality and modern amenities.",
      "images": []
    },
    "amenities": [
      {"id": "wifi", "name": "Free WiFi", "icon": "wifi", "enabled": true},
      {"id": "parking", "name": "Free Parking", "icon": "car", "enabled": true},
      {"id": "breakfast", "name": "Breakfast", "icon": "coffee", "enabled": true},
      {"id": "kitchen", "name": "Kitchen", "icon": "utensils", "enabled": true},
      {"id": "ac", "name": "Air Conditioning", "icon": "wind", "enabled": true},
      {"id": "tv", "name": "Smart TV", "icon": "tv", "enabled": true}
    ],
    "contact": {
      "address": "",
      "city": "",
      "postal_code": "",
      "country": "",
      "phone": "",
      "email": "",
      "directions": "",
      "map_url": "",
      "map_embed": ""
    },
    "stats": {
      "show_stats": true,
      "custom_stat_label": "Cozy Rooms",
      "custom_stat_value": ""
    },
    "social": {
      "facebook": "",
      "instagram": "",
      "twitter": "",
      "line": "",
      "whatsapp": ""
    },
    "payment": {
      "promptpay_id": "",
      "promptpay_name": "",
      "promptpay_qr_url": "",
      "payment_timeout_minutes": 15,
      "easyslip_enabled": true,
      "line_channel_access_token": "",
      "line_user_id": ""
    },
    "transport": {
      "pickup_enabled": false,
      "pickup_price": 0,
      "pickup_description": "Airport/Train Station pickup",
      "dropoff_enabled": false,
      "dropoff_price": 0,
      "dropoff_description": "Airport/Train Station drop-off"
    }
  }'::jsonb;

-- =====================================================
-- 6. CLEAN UP STATS FIELDS IN EXISTING TENANTS
-- =====================================================

-- Update stats to only have valid fields (remove deprecated rating, guest_count)
-- This rebuilds the stats object with only the valid keys
UPDATE tenants
SET settings = jsonb_set(
  settings,
  '{stats}',
  jsonb_build_object(
    'show_stats', COALESCE((settings->'stats'->>'show_stats')::boolean, true),
    'custom_stat_label', COALESCE(settings->'stats'->>'custom_stat_label', 'Cozy Rooms'),
    'custom_stat_value', COALESCE(settings->'stats'->>'custom_stat_value', '')
  )
)
WHERE settings ? 'stats';

-- =====================================================
-- 7. UPDATE PLAN CONSTRAINT TO ONLY ALLOW FREE AND PRO
-- =====================================================

-- First update any 'enterprise' plans to 'pro'
UPDATE tenants SET plan = 'pro' WHERE plan = 'enterprise';

-- The constraint was already updated in migration 033


