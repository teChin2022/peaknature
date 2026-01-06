import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { paginateData } from '@/lib/pagination'
import { getSubscriptionInfo, hasReachedRoomLimit } from '@/lib/subscription-server'
import { TenantSettings, defaultTenantSettings } from '@/types/database'
import { RoomsPageContent } from '@/components/dashboard/rooms-page-content'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 10

interface RoomsPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getRooms(slug: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  // Get subscription info
  const subscriptionInfo = await getSubscriptionInfo(tenant.id)
  const reachedRoomLimit = await hasReachedRoomLimit(tenant.id)
  
  // Get room limit (calculated on server)
  const roomLimit = subscriptionInfo?.getFeatureLimit('rooms') ?? null

  // Get currency from settings
  const settings = (tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = settings.currency || 'THB'

  return { 
    tenant, 
    rooms: rooms || [],
    roomLimit,
    reachedRoomLimit,
    currency,
  }
}

export default async function DashboardRoomsPage({ params, searchParams }: RoomsPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const data = await getRooms(slug)
  
  if (!data) {
    notFound()
  }

  const { tenant, rooms, roomLimit, reachedRoomLimit, currency } = data

  // Pagination
  const page = pageParam ? parseInt(pageParam) : 1
  const { items: paginatedRooms, currentPage, totalPages, totalItems, itemsPerPage } = paginateData(rooms, page, ITEMS_PER_PAGE)

  return (
    <RoomsPageContent
      slug={slug}
      tenant={{
        id: tenant.id,
        name: tenant.name,
        primary_color: tenant.primary_color,
      }}
      rooms={paginatedRooms}
      roomLimit={roomLimit}
      reachedRoomLimit={reachedRoomLimit}
      currency={currency}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
      }}
    />
  )
}
