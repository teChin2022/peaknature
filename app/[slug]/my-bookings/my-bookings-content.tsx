'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Users, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'
import { CurrencyCode } from '@/types/database'
import { formatPrice } from '@/lib/currency'
import { CancelBookingButton } from '@/components/booking/cancel-booking-button'
import { ReviewDialog } from '@/components/review/review-dialog'
import { Pagination, PaginationResult } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'

interface BookingReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface BookingWithRoom {
  id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  room: {
    name: string
    images?: string[]
    check_in_time: string
    check_out_time: string
    base_price: number
  }
  reviews?: BookingReview[]
}

interface MyBookingsContentProps {
  tenantName: string
  tenantSlug: string
  primaryColor: string
  currency: CurrencyCode
  guestPhone?: string | null
  bookings: BookingWithRoom[]
  upcomingBookings: BookingWithRoom[]
  pastBookings: BookingWithRoom[]
  cancelledBookings: BookingWithRoom[]
  activeTab: string
  paginatedUpcoming: PaginationResult<BookingWithRoom>
  paginatedPast: PaginationResult<BookingWithRoom>
  paginatedCancelled: PaginationResult<BookingWithRoom>
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
}

function BookingCard({ 
  booking, 
  tenantSlug, 
  primaryColor, 
  currency, 
  guestPhone,
  t 
}: { 
  booking: BookingWithRoom
  tenantSlug: string
  primaryColor: string
  currency: CurrencyCode
  guestPhone?: string | null
  t: ReturnType<typeof useTranslations<'myBookings'>>
}) {
  const room = booking.room
  const checkInDate = parseISO(booking.check_in)
  const checkOutDate = parseISO(booking.check_out)
  const numberOfNights = differenceInDays(checkOutDate, checkInDate)
  const isUpcoming = !isPast(checkInDate) && booking.status !== 'cancelled'
  
  const displayImage = room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'

  const statusLabels = {
    pending: t('pending'),
    confirmed: t('confirmed'),
    cancelled: t('cancelled'),
    completed: t('completed'),
  }

  return (
    <Card className="overflow-hidden border-stone-200 hover:border-stone-300 transition-all !p-0">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-56 lg:w-64 aspect-[16/10] md:aspect-auto md:min-h-[200px] flex-shrink-0">
          <Image
            src={displayImage}
            alt={room.name}
            fill
            className="object-cover"
          />
          <Badge 
            className={`absolute top-3 left-3 border ${statusColors[booking.status as keyof typeof statusColors]}`}
          >
            {statusLabels[booking.status as keyof typeof statusLabels]}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-5 md:p-6 !px-5 md:!px-6">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-stone-900 text-lg">
                    {room.name}
                  </h3>
                  <p className="text-sm text-stone-500 font-mono">
                    {t('ref')}: {booking.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: primaryColor }}>
                    {formatPrice(booking.total_price, currency)}
                  </div>
                  <div className="text-xs text-stone-500">{t('total')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(checkInDate, 'MMM d')} - {format(checkOutDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Users className="h-4 w-4" />
                  <span>{booking.guests} {booking.guests > 1 ? t('guests') : t('guest')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Clock className="h-4 w-4" />
                  <span>{numberOfNights} {numberOfNights > 1 ? t('nights') : t('night')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              {isUpcoming && (
                <div className="text-sm text-stone-500">
                  {t('checkInLabel')}: {room.check_in_time} · {t('checkOutLabel')}: {room.check_out_time}
                </div>
              )}
              {!isUpcoming && booking.status !== 'cancelled' && (
                <div className="text-sm text-stone-500">
                  {t('stayed')}: {format(checkInDate, 'MMM d')} - {format(checkOutDate, 'MMM d, yyyy')}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                {/* Review button - only for completed/past bookings */}
                {(isPast(checkOutDate) || booking.status === 'completed') && booking.status !== 'cancelled' && (
                  <ReviewDialog
                    bookingId={booking.id}
                    roomName={room.name}
                    tenantSlug={tenantSlug}
                    primaryColor={primaryColor}
                    hasReview={Boolean(booking.reviews && booking.reviews.length > 0)}
                    existingReview={booking.reviews && booking.reviews.length > 0 ? booking.reviews[0] : null}
                  />
                )}
                {/* Cancel button - only shows if within 24 hours after booking */}
                <CancelBookingButton 
                  bookingId={booking.id}
                  createdAt={booking.created_at}
                  status={booking.status}
                  guestPhone={guestPhone}
                />
                <Link href={`/${tenantSlug}/booking/confirmation/${booking.id}`}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-1"
                    style={{ color: primaryColor }}
                  >
                    {t('viewDetails')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

function EmptyState({ 
  title, 
  description, 
  tenantSlug, 
  primaryColor,
  showCta = true,
  ctaText
}: { 
  title: string
  description: string
  tenantSlug: string
  primaryColor: string
  showCta?: boolean
  ctaText: string
}) {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-xl border border-stone-200">
      <Calendar className="h-16 w-16 mx-auto text-stone-300 mb-4" />
      <h3 className="text-xl font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-600 mb-6 max-w-md mx-auto">{description}</p>
      {showCta && (
        <Link href={`/${tenantSlug}/rooms`}>
          <Button 
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}

export function MyBookingsContent({
  tenantName,
  tenantSlug,
  primaryColor,
  currency,
  guestPhone,
  bookings,
  upcomingBookings,
  pastBookings,
  cancelledBookings,
  activeTab,
  paginatedUpcoming,
  paginatedPast,
  paginatedCancelled,
}: MyBookingsContentProps) {
  const t = useTranslations('myBookings')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-stone-600">
            {t('subtitleWithName', { name: tenantName })}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        {bookings.length > 0 ? (
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="w-full md:w-auto mb-6">
              <TabsTrigger value="upcoming" className="flex-1 md:flex-none" asChild>
                <Link href={`/${tenantSlug}/my-bookings?tab=upcoming`}>
                  {t('upcoming')} ({upcomingBookings.length})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1 md:flex-none" asChild>
                <Link href={`/${tenantSlug}/my-bookings?tab=past`}>
                  {t('past')} ({pastBookings.length})
                </Link>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-1 md:flex-none" asChild>
                <Link href={`/${tenantSlug}/my-bookings?tab=cancelled`}>
                  {t('cancelled')} ({cancelledBookings.length})
                </Link>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length > 0 ? (
                <>
                  {paginatedUpcoming.items.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      tenantSlug={tenantSlug}
                      primaryColor={primaryColor}
                      currency={currency}
                      guestPhone={guestPhone}
                      t={t}
                    />
                  ))}
                  <Pagination
                    currentPage={paginatedUpcoming.currentPage}
                    totalPages={paginatedUpcoming.totalPages}
                    totalItems={paginatedUpcoming.totalItems}
                    itemsPerPage={paginatedUpcoming.itemsPerPage}
                    className="mt-6 pt-6 border-t border-stone-200"
                  />
                </>
              ) : (
                <EmptyState 
                  title={t('noUpcoming')}
                  description={t('noUpcomingDesc')}
                  tenantSlug={tenantSlug}
                  primaryColor={primaryColor}
                  ctaText={t('browseRooms')}
                />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length > 0 ? (
                <>
                  {paginatedPast.items.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      tenantSlug={tenantSlug}
                      primaryColor={primaryColor}
                      currency={currency}
                      guestPhone={guestPhone}
                      t={t}
                    />
                  ))}
                  <Pagination
                    currentPage={paginatedPast.currentPage}
                    totalPages={paginatedPast.totalPages}
                    totalItems={paginatedPast.totalItems}
                    itemsPerPage={paginatedPast.itemsPerPage}
                    className="mt-6 pt-6 border-t border-stone-200"
                  />
                </>
              ) : (
                <EmptyState 
                  title={t('noPast')}
                  description={t('noPastDesc')}
                  tenantSlug={tenantSlug}
                  primaryColor={primaryColor}
                  ctaText={t('browseRooms')}
                />
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length > 0 ? (
                <>
                  {paginatedCancelled.items.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      tenantSlug={tenantSlug}
                      primaryColor={primaryColor}
                      currency={currency}
                      guestPhone={guestPhone}
                      t={t}
                    />
                  ))}
                  <Pagination
                    currentPage={paginatedCancelled.currentPage}
                    totalPages={paginatedCancelled.totalPages}
                    totalItems={paginatedCancelled.totalItems}
                    itemsPerPage={paginatedCancelled.itemsPerPage}
                    className="mt-6 pt-6 border-t border-stone-200"
                  />
                </>
              ) : (
                <EmptyState 
                  title={t('noCancelled')}
                  description={t('noCancelledDesc')}
                  tenantSlug={tenantSlug}
                  primaryColor={primaryColor}
                  showCta={false}
                  ctaText={t('browseRooms')}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState 
            title={t('noBookings')}
            description={t('noBookingsDescLong')}
            tenantSlug={tenantSlug}
            primaryColor={primaryColor}
            ctaText={t('browseRooms')}
          />
        )}
      </div>
    </div>
  )
}

