import { createClient } from '@/lib/supabase/server'
import { CreditCard, Building2, TrendingUp, Banknote, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, parseISO, differenceInDays } from 'date-fns'
import { formatPrice } from '@/lib/currency'
import { CurrencyCode } from '@/types/database'
import { PRO_PLAN_PRICE, formatSubscriptionStatus, getStatusColor } from '@/lib/subscription'
// Note: Server-side functions are in lib/subscription-server.ts
import { SubscriptionActions } from '@/components/admin/subscription-actions'
import { Pagination } from '@/components/ui/pagination'
import { paginateData } from '@/lib/pagination'

const ITEMS_PER_PAGE = 10

interface SubscriptionsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

async function getSubscriptionStats(statusFilter?: string) {
  const supabase = await createClient()
  
  // Build tenant query
  let tenantsQuery = supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    tenantsQuery = tenantsQuery.eq('subscription_status', statusFilter)
  }

  // Run all queries in parallel for better performance
  const [tenantsResult, pendingPaymentsResult, platformSettingsResult] = await Promise.all([
    tenantsQuery,
    supabase
      .from('subscription_payments')
      .select('*, tenant:tenants(name, slug, primary_color)', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('platform_settings')
      .select('default_currency')
      .limit(1),
  ])

  const allTenants = tenantsResult.data || []
  
  // Calculate stats from already-fetched data
  const stats = {
    trial: allTenants.filter(t => t.subscription_status === 'trial').length,
    active: allTenants.filter(t => t.subscription_status === 'active').length,
    expired: allTenants.filter(t => t.subscription_status === 'expired').length,
    total: allTenants.length,
    mrr: allTenants.filter(t => t.subscription_status === 'active' && t.plan === 'pro').length * PRO_PLAN_PRICE,
  }

  const currency = (platformSettingsResult.data?.[0]?.default_currency as CurrencyCode) || 'THB'

  return { 
    stats, 
    tenants: allTenants, 
    pendingPayments: pendingPaymentsResult.data || [],
    pendingCount: pendingPaymentsResult.count || 0,
    currency 
  }
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const params = await searchParams
  const { stats, tenants, pendingPayments, pendingCount, currency } = await getSubscriptionStats(params.status)

  // Pagination
  const page = params.page ? parseInt(params.page) : 1
  const { items: paginatedTenants, currentPage, totalPages, totalItems, itemsPerPage } = paginateData(tenants, page, ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage plans, trials, and payments across all tenants</p>
      </div>

      {/* Pending Payments Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">
                {pendingCount} pending payment{pendingCount > 1 ? 's' : ''} to verify
              </p>
              <p className="text-sm text-amber-600">Review and approve subscription payments</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{formatPrice(stats.mrr, currency)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-4 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            From {stats.active} Pro subscribers
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trial</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.trial}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-4">2 months free trial</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Pro</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-4">{formatPrice(PRO_PLAN_PRICE, currency)}/mo each</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Expired</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.expired}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-4">Need attention</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1.5">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Active tenants</p>
        </div>
      </div>

      {/* Pending Payments Table */}
      {pendingPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
            <h2 className="text-sm font-semibold text-amber-800">Pending Payments</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-50 bg-gray-50/50">
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Period</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.map((payment) => (
                <TableRow key={payment.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm"
                        style={{ backgroundColor: payment.tenant?.primary_color || '#3B82F6' }}
                      >
                        {payment.tenant?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.tenant?.name}</div>
                        <div className="text-xs text-gray-400">/{payment.tenant?.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">
                    {formatPrice(payment.amount, currency)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(parseISO(payment.period_start), 'MMM d')} - {format(parseISO(payment.period_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(parseISO(payment.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <SubscriptionActions 
                      payment={payment} 
                      currency={currency}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* All Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">All Subscriptions</h2>
          <div className="flex items-center gap-2">
            <a 
              href="/admin/subscriptions" 
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!params.status || params.status === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All
            </a>
            <a 
              href="/admin/subscriptions?status=trial" 
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${params.status === 'trial' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Trial
            </a>
            <a 
              href="/admin/subscriptions?status=active" 
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${params.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Active
            </a>
            <a 
              href="/admin/subscriptions?status=expired" 
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${params.status === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Expired
            </a>
          </div>
        </div>
        {paginatedTenants.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-50 bg-gray-50/50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trial/Subscription</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTenants.map((tenant) => {
                  const now = new Date()
                  const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
                  const subscriptionEndsAt = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null
                  
                  let daysLeft = 0
                  let endDate = null
                  if (tenant.subscription_status === 'trial' && trialEndsAt) {
                    daysLeft = Math.max(0, differenceInDays(trialEndsAt, now))
                    endDate = trialEndsAt
                  } else if (tenant.subscription_status === 'active' && subscriptionEndsAt) {
                    daysLeft = Math.max(0, differenceInDays(subscriptionEndsAt, now))
                    endDate = subscriptionEndsAt
                  }

                  return (
                    <TableRow key={tenant.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm"
                            style={{ backgroundColor: tenant.primary_color }}
                          >
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-xs text-gray-400">/{tenant.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${tenant.plan === 'pro' ? 'bg-indigo-500 text-white' : 'bg-gray-400 text-white'}`}>
                          {tenant.plan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(tenant.subscription_status)}`}>
                          {formatSubscriptionStatus(tenant.subscription_status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {endDate ? format(endDate, 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {tenant.subscription_status === 'trial' || tenant.subscription_status === 'active' ? (
                          <span className={`text-sm font-medium ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 14 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {daysLeft} days
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <SubscriptionActions 
                          tenant={tenant}
                          currency={currency}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div className="px-5 py-4 border-t border-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No subscriptions</h3>
            <p className="text-sm text-gray-500">No tenants match the current filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
