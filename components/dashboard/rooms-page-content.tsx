'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Plus, Users, Crown, AlertTriangle, BedDouble } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoomActions } from '@/components/dashboard/room-actions'
import { Pagination } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/currency'

interface Room {
  id: string
  name: string
  description: string | null
  images: string[]
  base_price: number
  max_guests: number
  is_active: boolean
}

interface RoomsPageContentProps {
  slug: string
  tenant: {
    id: string
    name: string
    primary_color: string
  }
  rooms: Room[]
  roomLimit: number | null
  reachedRoomLimit: boolean
  currency: string
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export function RoomsPageContent({
  slug,
  tenant,
  rooms,
  roomLimit,
  reachedRoomLimit,
  currency,
  pagination,
}: RoomsPageContentProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="space-y-6">
      {/* Room Limit Banner */}
      {roomLimit !== null && rooms.length >= roomLimit * 0.8 && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${
          reachedRoomLimit 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${reachedRoomLimit ? 'text-red-600' : 'text-amber-600'}`} />
            <div>
              <p className={`font-medium ${reachedRoomLimit ? 'text-red-800' : 'text-amber-800'}`}>
                {reachedRoomLimit 
                  ? t('rooms.limitReached', { limit: roomLimit })
                  : t('rooms.limitWarning', { current: rooms.length, limit: roomLimit })
                }
              </p>
              <p className={`text-sm ${reachedRoomLimit ? 'text-red-600' : 'text-amber-600'}`}>
                {t('rooms.upgradeForUnlimited')}
              </p>
            </div>
          </div>
          <Link href={`/${slug}/dashboard/subscription`}>
            <Button 
              size="sm"
              className={reachedRoomLimit 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-amber-600 hover:bg-amber-700'
              }
            >
              <Crown className="h-4 w-4 mr-2" />
              {t('rooms.upgrade')}
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('rooms.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('rooms.subtitle')}</p>
        </div>
        {!reachedRoomLimit ? (
          <Link href={`/${slug}/dashboard/rooms/new`}>
            <Button 
              className="gap-2 text-white shadow-sm"
              style={{ backgroundColor: tenant.primary_color }}
            >
              <Plus className="h-4 w-4" />
              {t('rooms.addRoom')}
            </Button>
          </Link>
        ) : (
          <Link href={`/${slug}/dashboard/subscription`}>
            <Button 
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm"
            >
              <Crown className="h-4 w-4" />
              {t('rooms.upgradeToAdd')}
            </Button>
          </Link>
        )}
      </div>

      {rooms.length > 0 ? (
        <div className="space-y-4">
          {rooms.map((room) => {
            const displayImage = room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80'
            
            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                    <Image
                      src={displayImage}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{room.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={room.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                          }
                        >
                          {room.is_active ? t('rooms.active') : t('rooms.inactive')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {room.description || t('rooms.noDescription')}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{t('rooms.maxGuests', { count: room.max_guests })}</span>
                        </div>
                        <div className="font-medium" style={{ color: tenant.primary_color }}>
                          {formatPrice(room.base_price, currency)}{t('rooms.perNight')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/${slug}/dashboard/rooms/${room.id}`}>
                        <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                          {t('rooms.editRoom')}
                        </Button>
                      </Link>
                      <RoomActions room={room} tenantSlug={slug} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BedDouble className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{t('rooms.noRooms')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('rooms.noRoomsDesc')}</p>
          <Link href={`/${slug}/dashboard/rooms/new`}>
            <Button style={{ backgroundColor: tenant.primary_color }} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t('rooms.addRoom')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

