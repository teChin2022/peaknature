import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantHeader } from '@/components/tenant/header'
import { TenantFooter } from '@/components/tenant/footer'
import { Tenant, TenantSettings, defaultTenantSettings } from '@/types/database'

interface TenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

async function getTenantAndUser(slug: string): Promise<{ 
  tenant: Tenant | null; 
  user: { email: string; full_name?: string } | null;
  settings: TenantSettings;
}> {
  const supabase = await createClient()
  
  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return { tenant: null, user: null, settings: defaultTenantSettings }

  // Merge settings with defaults
  const rawSettings = tenant.settings as TenantSettings | null
  const settings: TenantSettings = rawSettings 
    ? {
        ...defaultTenantSettings,
        ...rawSettings,
        hero: { 
          ...defaultTenantSettings.hero, 
          ...(rawSettings.hero || {}),
          images: rawSettings.hero?.images || defaultTenantSettings.hero.images
        },
        contact: { ...defaultTenantSettings.contact, ...(rawSettings.contact || {}) },
        stats: { ...defaultTenantSettings.stats, ...(rawSettings.stats || {}) },
        social: { ...defaultTenantSettings.social, ...(rawSettings.social || {}) },
        amenities: rawSettings.amenities || defaultTenantSettings.amenities,
      }
    : defaultTenantSettings

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) return { tenant, user: null, settings }

  // Get profile - use authUser email as fallback if profile query fails
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', authUser.id)
    .single()

  if (profileError) {
    // PGRST116 = no rows found - user was likely deleted
    if (profileError.code === 'PGRST116') {
      // Sign out the stale session - user account was deleted
      await supabase.auth.signOut()
      return { tenant, user: null, settings }
    }
    
    // Other errors - fallback to auth user email if profile doesn't exist yet
    console.error('Profile fetch error:', profileError)
    return { 
      tenant, 
      user: { email: authUser.email || '', full_name: authUser.user_metadata?.full_name },
      settings
    }
  }

  return { 
    tenant, 
    user: profile ? { email: profile.email, full_name: profile.full_name || undefined } : null,
    settings
  }
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params
  const { tenant, user, settings } = await getTenantAndUser(slug)
  
  if (!tenant) {
    notFound()
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ '--tenant-primary': tenant.primary_color } as React.CSSProperties}
    >
      <TenantHeader tenant={tenant} user={user} />
      <main className="flex-1">
        {children}
      </main>
      <TenantFooter tenant={tenant} settings={settings} />
    </div>
  )
}

