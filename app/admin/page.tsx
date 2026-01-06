import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  Building2, Users, CalendarDays, Banknote, 
  TrendingUp, ArrowRight, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { startOfMonth, endOfMonth } from 'date-fns'
import { formatPrice } from '@/lib/currency'
import { CurrencyCode } from '@/types/database'

async function getAdminStats() {
  const supabase = await createClient()
  
  // Calculate date ranges
  const monthStart = startOfMonth(new Date()).toISOString().split('T')[0]
  const monthEnd = endOfMonth(new Date()).toISOString().split('T')[0]
  
  // Run all queries in parallel for better performance
  const [
    tenantCountResult,
    userCountResult,
    bookingCountResult,
    monthBookingsResult,
    recentTenantsResult,
    pendingTenantsResult,
    platformSettingsResult,
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings')
      .select('total_price')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd),
    supabase.from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false),
    supabase.from('platform_settings')
      .select('default_currency')
      .limit(1),
  ])

  const monthlyRevenue = monthBookingsResult.data?.reduce((sum, b) => sum + b.total_price, 0) || 0
  const currency = (platformSettingsResult.data?.[0]?.default_currency as CurrencyCode) || 'USD'

  return { 
    stats: {
      tenants: tenantCountResult.count || 0,
      users: userCountResult.count || 0,
      bookings: bookingCountResult.count || 0,
      revenue: monthlyRevenue,
      pending: pendingTenantsResult.count || 0,
    },
    recentTenants: recentTenantsResult.data || [],
    currency
  }
}

const planColors = {
  free: 'bg-gray-400',
  pro: 'bg-indigo-500',
}

export default async function AdminDashboard() {
  const { stats, recentTenants, currency } = await getAdminStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here's your platform overview.</p>
        </div>
      </div>

      {/* Pending Approval Alert */}
      {stats.pending > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-amber-50/80 border border-amber-100">
          <div className="flex items-center gap-3 text-amber-700">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">
              {stats.pending} property{stats.pending > 1 ? ' registrations' : ' registration'} pending approval
            </span>
          </div>
          <Link href="/admin/tenants?status=pending">
            <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs h-8">
              Review Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Tenants</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.tenants}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <Link 
            href="/admin/tenants"
            className="text-xs font-medium mt-4 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all tenants
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.users}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <Link 
            href="/admin/users"
            className="text-xs font-medium mt-4 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Manage users
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.bookings}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Across all tenants
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly GMV</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{formatPrice(stats.revenue, currency)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-violet-500" />
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-4 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Gross merchandise value
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Recent Tenants</h2>
          <Link href="/admin/tenants">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700 text-xs h-8">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="p-2">
          {recentTenants.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentTenants.map((tenant) => (
                <div 
                  key={tenant.id}
                  className="flex items-center justify-between px-3 py-3 hover:bg-gray-50/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm"
                      style={{ backgroundColor: tenant.primary_color }}
                    >
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-gray-400">/{tenant.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${planColors[tenant.plan as keyof typeof planColors]} text-white`}>
                      {tenant.plan}
                    </span>
                    {tenant.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              No tenants registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

