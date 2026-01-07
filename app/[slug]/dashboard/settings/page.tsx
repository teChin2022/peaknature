import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tenant, TenantSettings, defaultTenantSettings } from '@/types/database'
import { SettingsPageContent } from './settings-content'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface SettingsPageProps {
  params: Promise<{ slug: string }>
}

async function getTenantSettings(slug: string) {
  const supabase = await createClient()
  
  // Only select the columns we actually need - faster query
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, primary_color, plan, settings')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: Pick<Tenant, 'id' | 'name' | 'slug' | 'logo_url' | 'primary_color' | 'plan' | 'settings'> | null }
  
  if (!tenantData) return null

  // Merge settings with defaults on the server
  const rawSettings = tenantData.settings as TenantSettings | null
  const settings: TenantSettings = rawSettings 
    ? {
        ...defaultTenantSettings,
        ...rawSettings,
        hero: { 
          ...defaultTenantSettings.hero, 
          ...(rawSettings.hero || {}),
          images: rawSettings.hero?.images || defaultTenantSettings.hero.images
        },
        amenities: rawSettings.amenities?.length ? rawSettings.amenities : defaultTenantSettings.amenities,
        location: { ...defaultTenantSettings.location, ...(rawSettings.location || {}) },
        contact: { ...defaultTenantSettings.contact, ...(rawSettings.contact || {}) },
        stats: { ...defaultTenantSettings.stats, ...(rawSettings.stats || {}) },
        social: { ...defaultTenantSettings.social, ...(rawSettings.social || {}) },
        payment: { ...defaultTenantSettings.payment, ...(rawSettings.payment || {}) },
        transport: { ...defaultTenantSettings.transport, ...(rawSettings.transport || {}) },
      }
    : defaultTenantSettings

  return {
    tenant: tenantData,
    settings,
  }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params
  const data = await getTenantSettings(slug)
  
  if (!data) {
    notFound()
  }

  return (
    <SettingsPageContent
      slug={slug}
      tenant={data.tenant}
      initialSettings={data.settings}
    />
  )
}
