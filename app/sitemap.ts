import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://peaksnature.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Get all active tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('slug, created_at')
    .eq('is_active', true)

  // Get all active rooms with their tenant slugs
  const { data: rooms } = await supabase
    .from('rooms')
    .select(`
      id,
      created_at,
      tenant:tenants!inner(slug, is_active)
    `)
    .eq('is_active', true)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Tenant pages
  const tenantPages: MetadataRoute.Sitemap = (tenants || []).map((tenant) => ({
    url: `${siteUrl}/${tenant.slug}`,
    lastModified: new Date(tenant.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Tenant room listing pages
  const tenantRoomListPages: MetadataRoute.Sitemap = (tenants || []).map((tenant) => ({
    url: `${siteUrl}/${tenant.slug}/rooms`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Individual room pages
  const roomPages: MetadataRoute.Sitemap = (rooms || [])
    .filter((room) => {
      const tenant = room.tenant as { slug: string; is_active: boolean } | null
      return tenant?.is_active
    })
    .map((room) => {
      const tenant = room.tenant as { slug: string; is_active: boolean }
      return {
        url: `${siteUrl}/${tenant.slug}/rooms/${room.id}`,
        lastModified: new Date(room.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    })

  return [...staticPages, ...tenantPages, ...tenantRoomListPages, ...roomPages]
}

