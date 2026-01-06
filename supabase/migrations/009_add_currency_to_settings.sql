-- Migration: Add currency to tenant settings
-- This updates existing settings to include the currency field if not present

-- Update existing tenant settings to include currency field (default: USD)
UPDATE tenants
SET settings = settings || '{"currency": "USD"}'::jsonb
WHERE settings IS NOT NULL 
  AND NOT settings ? 'currency';

-- For tenants with null settings, initialize with default settings including currency
UPDATE tenants
SET settings = '{
  "currency": "USD",
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

