import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantSettings, defaultTenantSettings, CurrencyCode } from '@/types/database'
import { RoomDetailClient } from '@/components/room/room-detail-client'

// Disable caching to always get fresh booking data
export const dynamic = 'force-dynamic'

interface RoomDetailPageProps {
  params: Promise<{ slug: string; roomId: string }>
  searchParams: Promise<{ 
    error?: string
    checkIn?: string
    checkOut?: string
    guests?: string 
  }>
}

async function getRoomWithTenant(slug: string, roomId: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()
  
  if (!room) return null

  // Get blocked dates for this room
  const { data: blockedDates } = await supabase
    .from('room_availability')
    .select('date')
    .eq('room_id', roomId)
    .eq('is_blocked', true)
    .gte('date', new Date().toISOString().split('T')[0])

  // Get existing bookings using RPC function (bypasses RLS)
  // This allows any user to see booked dates for availability checking
  const { data: bookings } = await supabase
    .rpc('get_room_booked_dates', { p_room_id: roomId })

  // Get reviews for this room (via bookings)
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      booking:bookings!inner(room_id),
      user:profiles(full_name, avatar_url)
    `)
    .eq('booking.room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Calculate average rating
  const roomReviews = reviews || []
  const totalReviews = roomReviews.length
  const averageRating = totalReviews > 0 
    ? roomReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0

  return { 
    tenant, 
    room, 
    blockedDates: blockedDates?.map(d => d.date) || [],
    bookedRanges: bookings || [],
    reviews: roomReviews,
    averageRating,
    totalReviews
  }
}

export default async function RoomDetailPage({ params, searchParams }: RoomDetailPageProps) {
  const { slug, roomId } = await params
  const { error, checkIn, checkOut, guests } = await searchParams
  const data = await getRoomWithTenant(slug, roomId)
  
  if (!data) {
    notFound()
  }

  const { tenant, room, blockedDates, bookedRanges, averageRating, totalReviews } = data
  const settings = (tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = (settings.currency || 'USD') as CurrencyCode
  const images = room.images?.length ? room.images : [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'
  ]
  
  // Initial values for editing (from query params)
  const initialCheckIn = checkIn || undefined
  const initialCheckOut = checkOut || undefined
  const initialGuests = guests ? parseInt(guests) : undefined

  return (
    <RoomDetailClient
      room={room}
      tenant={tenant}
      images={images}
      blockedDates={blockedDates}
      bookedRanges={bookedRanges}
      currency={currency}
      averageRating={averageRating}
      totalReviews={totalReviews}
      error={error}
      initialCheckIn={initialCheckIn}
      initialCheckOut={initialCheckOut}
      initialGuests={initialGuests}
    />
  )
}
