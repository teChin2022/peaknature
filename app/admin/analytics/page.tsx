import { createClient } from '@/lib/supabase/server'
import { BarChart3, TrendingUp, Users, Building2, CalendarDays, Banknote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { formatPrice } from '@/lib/currency'
import { CurrencyCode } from '@/types/database'

async function getAnalytics() {
  const supabase = await createClient()
  
  // Calculate date ranges
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const prevMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

  // Run ALL queries in parallel for maximum performance
  const [
    // Current month stats
    currentBookingsResult,
    currentRevenueResult,
    currentUsersResult,
    currentTenantsResult,
    // Previous month stats
    prevBookingsResult,
    prevRevenueResult,
    prevUsersResult,
    prevTenantsResult,
    // Totals
    totalUsersResult,
    totalTenantsResult,
    totalBookingsResult,
    totalRevenueResult,
    // Settings
    platformSettingsResult,
  ] = await Promise.all([
    // Current month
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('bookings').select('total_price')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('tenants').select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart).lte('created_at', monthEnd),
    // Previous month
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('bookings').select('total_price')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabase.from('tenants').select('*', { count: 'exact', head: true })
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    // Totals
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('total_price').in('status', ['confirmed', 'completed']),
    // Settings
    supabase.from('platform_settings').select('default_currency').limit(1),
  ])

  const currency = (platformSettingsResult.data?.[0]?.default_currency as CurrencyCode) || 'USD'

  return {
    current: {
      bookings: currentBookingsResult.count || 0,
      revenue: currentRevenueResult.data?.reduce((sum, b) => sum + b.total_price, 0) || 0,
      users: currentUsersResult.count || 0,
      tenants: currentTenantsResult.count || 0,
    },
    previous: {
      bookings: prevBookingsResult.count || 0,
      revenue: prevRevenueResult.data?.reduce((sum, b) => sum + b.total_price, 0) || 0,
      users: prevUsersResult.count || 0,
      tenants: prevTenantsResult.count || 0,
    },
    totals: {
      users: totalUsersResult.count || 0,
      tenants: totalTenantsResult.count || 0,
      bookings: totalBookingsResult.count || 0,
      revenue: totalRevenueResult.data?.reduce((sum, b) => sum + b.total_price, 0) || 0,
    },
    currency
  }
}

function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: true }
  const change = ((current - previous) / previous) * 100
  return { value: Math.abs(Math.round(change)), isPositive: change >= 0 }
}

export default async function AdminAnalyticsPage() {
  const { current, previous, totals, currency } = await getAnalytics()

  const bookingsChange = calculateChange(current.bookings, previous.bookings)
  const revenueChange = calculateChange(current.revenue, previous.revenue)
  const usersChange = calculateChange(current.users, previous.users)
  const tenantsChange = calculateChange(current.tenants, previous.tenants)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform performance and insights</p>
      </div>

      {/* Current Month Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          {format(new Date(), 'MMMM yyyy')} Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bookings</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1.5">{current.bookings}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className={`text-xs font-medium mt-4 inline-flex items-center gap-1 ${bookingsChange.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${!bookingsChange.isPositive && 'rotate-180'}`} />
              {bookingsChange.value}% vs last month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1.5">{formatPrice(current.revenue, currency)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className={`text-xs font-medium mt-4 inline-flex items-center gap-1 ${revenueChange.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${!revenueChange.isPositive && 'rotate-180'}`} />
              {revenueChange.value}% vs last month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Users</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1.5">{current.users}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
            <div className={`text-xs font-medium mt-4 inline-flex items-center gap-1 ${usersChange.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${!usersChange.isPositive && 'rotate-180'}`} />
              {usersChange.value}% vs last month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Tenants</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1.5">{current.tenants}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-violet-500" />
              </div>
            </div>
            <div className={`text-xs font-medium mt-4 inline-flex items-center gap-1 ${tenantsChange.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${!tenantsChange.isPositive && 'rotate-180'}`} />
              {tenantsChange.value}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* All Time Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">All Time Totals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Users</p>
                <p className="text-xl font-semibold text-gray-900 mt-0.5">{totals.users.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Tenants</p>
                <p className="text-xl font-semibold text-gray-900 mt-0.5">{totals.tenants.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Bookings</p>
                <p className="text-xl font-semibold text-gray-900 mt-0.5">{totals.bookings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total GMV</p>
                <p className="text-xl font-semibold text-gray-900 mt-0.5">{formatPrice(totals.revenue, currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for Charts */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Revenue Trend</h2>
        </div>
        <div className="p-5">
          <div className="h-56 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/30">
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Chart visualization coming soon</p>
              <p className="text-xs text-gray-400 mt-1">Integrate with a charting library like Recharts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

