import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantSettings, defaultTenantSettings, CurrencyCode } from '@/types/database'
import { RoomFilters } from '@/components/room/room-filters'
import { RoomCardClient } from '@/components/room/room-card-client'
import { RoomsPageHeader } from '@/components/room/rooms-page-header'
import { RoomsEmptyState } from '@/components/room/rooms-empty-state'
import { Pagination } from '@/components/ui/pagination'
import { paginateData } from '@/lib/pagination'

const ITEMS_PER_PAGE = 6

interface RoomsPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ guests?: string; minPrice?: string; maxPrice?: string; page?: string }>
}

async function getTenantWithRooms(slug: string, filters?: { guests?: number; minPrice?: number; maxPrice?: number }) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  let query = supabase
    .from('rooms')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('base_price', { ascending: true })

  if (filters?.guests) {
    query = query.gte('max_guests', filters.guests)
  }
  if (filters?.minPrice) {
    query = query.gte('base_price', filters.minPrice)
  }
  if (filters?.maxPrice) {
    query = query.lte('base_price', filters.maxPrice)
  }

  const { data: rooms } = await query
  
  return { tenant, rooms: rooms || [] }
}

export default async function RoomsPage({ params, searchParams }: RoomsPageProps) {
  const { slug } = await params
  const search = await searchParams
  
  const filters = {
    guests: search.guests ? parseInt(search.guests) : undefined,
    minPrice: search.minPrice ? parseFloat(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? parseFloat(search.maxPrice) : undefined,
  }
  
  const data = await getTenantWithRooms(slug, filters)
  
  if (!data) {
    notFound()
  }

  const { tenant, rooms } = data
  const settings = (tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = (settings.currency || 'USD') as CurrencyCode

  // Pagination
  const page = search.page ? parseInt(search.page) : 1
  const { items: paginatedRooms, currentPage, totalPages, totalItems, itemsPerPage } = paginateData(rooms, page, ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <RoomsPageHeader roomCount={rooms.length} />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <RoomFilters
              initialGuests={search.guests}
              initialMinPrice={search.minPrice}
              initialMaxPrice={search.maxPrice}
              primaryColor={tenant.primary_color}
              tenantSlug={tenant.slug}
            />
          </aside>

          {/* Room List */}
          <div className="flex-1">
            {rooms.length > 0 ? (
              <div className="space-y-6">
                {paginatedRooms.map((room) => (
                  <RoomCardClient 
                    key={room.id} 
                    room={room} 
                    tenantSlug={tenant.slug}
                    primaryColor={tenant.primary_color}
                    currency={currency}
                  />
                ))}
                
                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  className="mt-8 pt-6 border-t border-stone-200"
                />
              </div>
            ) : (
              <RoomsEmptyState tenantSlug={tenant.slug} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
