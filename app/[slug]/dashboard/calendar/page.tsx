import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tenant, Room } from '@/types/database'
import { CalendarPageContent } from './calendar-content'
import { startOfMonth, endOfMonth } from 'date-fns'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface CalendarPageProps {
  params: Promise<{ slug: string }>
}

interface BookingWithRoom {
  id: string
  room_id: string
  check_in: string
  check_out: string
  guests: number
  status: string
  tenant_id: string
  room?: { id: string; name: string }
  user?: { full_name?: string; email?: string }
}

interface BlockedDate {
  id: string
  room_id: string
  date: string
  is_blocked: boolean
  price_override?: number
}

async function getCalendarData(slug: string) {
  const supabase = await createClient()
  
  // Step 1: Fetch tenant
  const { data: tenantData } = await supabase
        .from('tenants')
    .select('id, name, slug, primary_color')
        .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: Pick<Tenant, 'id' | 'name' | 'slug' | 'primary_color'> | null }
  
  if (!tenantData) return null

  const tenantId = tenantData.id
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
      const monthStartStr = monthStart.toISOString().split('T')[0]
      const monthEndStr = monthEnd.toISOString().split('T')[0]
      
  // Step 2: Fetch rooms, bookings, and blocked dates in PARALLEL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [roomsResult, bookingsResult] = await Promise.all([
        supabase
          .from('rooms')
      .select('id, name, base_price')
      .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('bookings')
          .select(`
            id, room_id, check_in, check_out, guests, status, tenant_id,
            room:rooms!inner(id, name),
            user:profiles(full_name, email)
          `)
      .eq('tenant_id', tenantId)
          .gte('check_out', monthStartStr)
          .lte('check_in', monthEndStr)
          .in('status', ['confirmed', 'pending'])
          .order('check_in')
  ]) as any
      
  const rooms = (roomsResult.data || []) as Pick<Room, 'id' | 'name' | 'base_price'>[]
  const bookings = (bookingsResult.data || []) as BookingWithRoom[]
      
  // Fetch blocked dates (needs room IDs) - this is fast since rooms are already loaded
  let blockedDates: BlockedDate[] = []
  if (rooms.length > 0) {
        const { data: blockedData } = await supabase
          .from('room_availability')
          .select('id, room_id, date, is_blocked, price_override')
      .in('room_id', rooms.map(r => r.id))
          .eq('is_blocked', true)
          .gte('date', monthStartStr)
          .lte('date', monthEndStr)
        
    blockedDates = (blockedData || []) as BlockedDate[]
  }
    
    return {
    tenant: tenantData,
    rooms,
    bookings,
    blockedDates,
    initialMonth: now.toISOString(),
  }
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { slug } = await params
  const data = await getCalendarData(slug)
  
  if (!data) {
    notFound()
  }

  return (
    <CalendarPageContent
      slug={slug}
      tenantId={data.tenant.id}
      primaryColor={data.tenant.primary_color}
      initialRooms={data.rooms}
      initialBookings={data.bookings}
      initialBlockedDates={data.blockedDates}
      initialMonth={data.initialMonth}
    />
  )
}
