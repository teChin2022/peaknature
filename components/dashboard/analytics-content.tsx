'use client'

import Link from 'next/link'
import { 
  Lock, Crown, BarChart3, TrendingUp, Users, BedDouble, Star, Banknote, CalendarDays 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/currency'
import { useTranslations } from 'next-intl'

interface AnalyticsData {
  tenant: {
    primary_color: string
  }
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: string
  totalBookings: number
  thisMonthBookings: number
  uniqueGuests: number
  roomCount: number
  avgRating: string | null
  reviewCount: number
}

interface AnalyticsContentProps {
  slug: string
  analytics: AnalyticsData
  currency: string
  isLocked: boolean
}

export function AnalyticsContent({ slug, analytics, currency, isLocked }: AnalyticsContentProps) {
  const t = useTranslations('dashboard.analytics')

  if (isLocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>

        {/* Locked Overlay */}
        <div className="relative">
          {/* Background blur content */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('locked.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('locked.description')}
              </p>
              <Link href={`/${slug}/dashboard/subscription`}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  {t('locked.upgradeButton')}
                </Button>
              </Link>
              <p className="text-xs text-gray-400 mt-4">
                {t('locked.trialNote')}
              </p>
            </div>
          </div>

          {/* Blurred sample content */}
          <div className="opacity-30 pointer-events-none select-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('thisMonthRevenue')}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">฿XX,XXX</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600">+XX%</span>
                  <span className="text-gray-500">{t('vsLastMonth')}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('totalBookings')}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">XX</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('uniqueGuests')}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">XX</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{t('activeRooms')}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">X</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <BedDouble className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('revenueOverTime')}</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-gray-300" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('bookingsByRoom')}</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Star className="h-12 w-12 text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unlocked state - full analytics
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('thisMonthRevenue')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatPrice(analytics.thisMonthRevenue, currency)}
              </p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${analytics.tenant.primary_color}15` }}
            >
              <Banknote className="h-5 w-5" style={{ color: analytics.tenant.primary_color }} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className={`h-3 w-3 ${Number(analytics.revenueGrowth) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={Number(analytics.revenueGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {analytics.revenueGrowth}%
            </span>
            <span className="text-gray-500">{t('vsLastMonth')}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('totalBookings')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {analytics.totalBookings}
              </p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${analytics.tenant.primary_color}15` }}
            >
              <CalendarDays className="h-5 w-5" style={{ color: analytics.tenant.primary_color }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {analytics.thisMonthBookings} {t('thisMonth')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('totalGuests')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {analytics.uniqueGuests}
              </p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${analytics.tenant.primary_color}15` }}
            >
              <Users className="h-5 w-5" style={{ color: analytics.tenant.primary_color }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {t('uniqueGuests')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('averageRating')}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {analytics.avgRating || 'N/A'}
              </p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${analytics.tenant.primary_color}15` }}
            >
              <Star className="h-5 w-5" style={{ color: analytics.tenant.primary_color }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {t('fromReviews', { count: analytics.reviewCount })}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">{t('propertyOverview')}</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('activeRooms')}</span>
              <span className="text-sm font-medium text-gray-900">{analytics.roomCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('totalBookings')}</span>
              <span className="text-sm font-medium text-gray-900">{analytics.totalBookings}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('totalGuests')}</span>
              <span className="text-sm font-medium text-gray-900">{analytics.uniqueGuests}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t('totalReviews')}</span>
              <span className="text-sm font-medium text-gray-900">{analytics.reviewCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">{t('monthlyComparison')}</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('thisMonth')}</span>
              <span className="text-sm font-medium text-emerald-600">
                {formatPrice(analytics.thisMonthRevenue, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('last30Days')}</span>
              <span className="text-sm font-medium text-gray-900">
                {formatPrice(analytics.lastMonthRevenue, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t('growth')}</span>
              <span className={`text-sm font-medium ${Number(analytics.revenueGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Number(analytics.revenueGrowth) >= 0 ? '+' : ''}{analytics.revenueGrowth}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
