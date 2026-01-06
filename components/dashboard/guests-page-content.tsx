'use client'

import { Users } from 'lucide-react'
import { GuestList } from '@/components/dashboard/guest-list'
import { Pagination } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'

interface Guest {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  province: string | null
  bookingCount: number
  totalSpent: number
}

interface GuestsPageContentProps {
  slug: string
  tenantId: string
  primaryColor: string
  guests: Guest[]
  currency: string
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export function GuestsPageContent({
  slug,
  tenantId,
  primaryColor,
  guests,
  currency,
  pagination,
}: GuestsPageContentProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('guests.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('guests.subtitle')}</p>
      </div>

      {/* Guest List */}
      {guests.length > 0 ? (
        <>
          <GuestList 
            guests={guests} 
            tenantId={tenantId} 
            primaryColor={primaryColor}
            currency={currency}
          />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center py-16">
            <div className="h-14 w-14 mx-auto rounded-xl flex items-center justify-center mb-4 bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t('guests.noGuests')}</h3>
            <p className="text-sm text-gray-500">{t('guests.noGuestsDesc')}</p>
          </div>
        </div>
      )}
    </div>
  )
}

