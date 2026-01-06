'use client'

import Link from 'next/link'
import { 
  BedDouble, CalendarDays, Users, 
  TrendingUp, ArrowRight, Clock, Banknote
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/currency'
import { useTranslations } from 'next-intl'
import { GuestDemographics } from './guest-demographics'

interface BookingData {
  id: string
  check_in: string
  check_out: string
  check_in_formatted: string
  check_out_formatted: string
  status: string
  total_price: number
  user?: { full_name?: string; email?: string }
  room?: { name?: string }
}

interface DashboardOverviewContentProps {
  slug: string
  tenantName: string
  primaryColor: string
  tenantId: string
  currency: string
  stats: {
    rooms: number
    bookings: number
    guests: number
    revenue: number
    pending: number
  }
  recentBookings: BookingData[]
}

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
}

export function DashboardOverviewContent({
  slug,
  tenantName,
  primaryColor,
  tenantId,
  currency,
  stats,
  recentBookings,
}: DashboardOverviewContentProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('welcomeBack', { name: tenantName })}</p>
      </div>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <div 
          className="flex items-center justify-between p-4 rounded-xl text-white shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            <span className="font-medium text-sm">
              {t('pending.alert', { count: stats.pending })}
            </span>
          </div>
          <Link href={`/${slug}/dashboard/bookings?status=pending`}>
            <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs">
              {t('pending.reviewNow')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('stats.totalRooms')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.rooms}</p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <BedDouble className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <Link 
            href={`/${slug}/dashboard/rooms`}
            className="text-xs font-medium mt-3 inline-flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            {t('stats.manageRooms')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('stats.activeBookings')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.bookings}</p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <CalendarDays className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <Link 
            href={`/${slug}/dashboard/bookings`}
            className="text-xs font-medium mt-3 inline-flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            {t('stats.viewBookings')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('stats.totalGuests')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.guests}</p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Users className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <Link 
            href={`/${slug}/dashboard/guests`}
            className="text-xs font-medium mt-3 inline-flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            {t('stats.viewGuests')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('stats.thisMonth')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(stats.revenue, currency)}</p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Banknote className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-3 inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {t('stats.revenueThisMonth')}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{t('recentBookings.title')}</h2>
          <Link href={`/${slug}/dashboard/bookings`}>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
              {t('stats.viewBookings').replace('View bookings', 'View All')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="p-5">
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(booking.user?.full_name || booking.user?.email || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user?.full_name || booking.user?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.room?.name} · {booking.check_in_formatted} - {booking.check_out_formatted}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                      {t(`status.${booking.status}`)}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(booking.total_price, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('recentBookings.noBookings')}
            </div>
          )}
        </div>
      </div>

      {/* Guest Demographics */}
      <GuestDemographics 
        tenantId={tenantId}
        currency={currency}
        primaryColor={primaryColor}
      />
    </div>
  )
}

