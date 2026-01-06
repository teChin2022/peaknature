-- =====================================================
-- ADD TENANT SETTINGS JSON COLUMN
-- =====================================================

-- Add settings column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "hero": {
    "tagline": "Highly Rated Homestay",
    "description": "Discover comfort and tranquility in our carefully curated spaces. Your perfect retreat awaits with authentic hospitality and modern amenities."
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
    "rating": "4.9",
    "guest_count": "500+",
    "custom_stat_label": "Cozy Rooms",
    "custom_stat_value": ""
  },
  "social": {
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "line": "",
    "whatsapp": ""
  }
}'::jsonb;

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_tenants_settings ON tenants USING GIN (settings);

-- Update existing tenants with default settings if null
UPDATE tenants 
SET settings = '{
  "hero": {
    "tagline": "Highly Rated Homestay",
    "description": "Discover comfort and tranquility in our carefully curated spaces. Your perfect retreat awaits with authentic hospitality and modern amenities."
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
    "rating": "4.9",
    "guest_count": "500+",
    "custom_stat_label": "Cozy Rooms",
    "custom_stat_value": ""
  },
  "social": {
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "line": "",
    "whatsapp": ""
  }
}'::jsonb
WHERE settings IS NULL;

