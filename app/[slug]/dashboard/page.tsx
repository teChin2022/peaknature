import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'
import { TenantSettings, defaultTenantSettings } from '@/types/database'
import { DashboardOverviewContent } from '@/components/dashboard/dashboard-overview-content'

// Force dynamic rendering to prevent stale data
export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  params: Promise<{ slug: string }>
}

async function getDashboardData(slug: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  const tenantId = tenant.id
  const monthStart = startOfMonth(new Date()).toISOString()
  const monthEnd = endOfMonth(new Date()).toISOString()

  // Run all queries in parallel for better performance
  const [
    roomResult, 
    bookingResult, 
    guestResult, 
    monthlyBookingsResult, 
    recentBookingsResult,
    pendingResult
  ] = await Promise.all([
    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'confirmed']),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'guest'),
    supabase
      .from('bookings')
      .select('total_price')
      .eq('tenant_id', tenantId)
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd),
    supabase
      .from('bookings')
      .select(`
        *,
        room:rooms(name),
        user:profiles(full_name, email)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
  ])

  const monthlyRevenue = monthlyBookingsResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0

  // Format booking dates on server to avoid hydration mismatch
  const formattedBookings = (recentBookingsResult.data || []).map((booking) => ({
    ...booking,
    check_in_formatted: format(parseISO(booking.check_in), 'MMM d'),
    check_out_formatted: format(parseISO(booking.check_out), 'MMM d'),
  }))

  return { 
    tenant, 
    stats: {
      rooms: roomResult.count || 0,
      bookings: bookingResult.count || 0,
      guests: guestResult.count || 0,
      revenue: monthlyRevenue,
      pending: pendingResult.count || 0,
    },
    recentBookings: formattedBookings
  }
}

export default async function DashboardOverview({ params }: DashboardPageProps) {
  const { slug } = await params
  const data = await getDashboardData(slug)
  
  if (!data) {
    notFound()
  }

  const { tenant, stats, recentBookings } = data
  const settings = (tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = settings.currency || 'USD'

  return (
    <DashboardOverviewContent
      slug={slug}
      tenantName={tenant.name}
      primaryColor={tenant.primary_color}
      tenantId={tenant.id}
      currency={currency}
      stats={stats}
      recentBookings={recentBookings}
    />
  )
}
