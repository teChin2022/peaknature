'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface RoomsEmptyStateProps {
  tenantSlug: string
}

export function RoomsEmptyState({ tenantSlug }: RoomsEmptyStateProps) {
  const t = useTranslations('room')

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
      <div className="text-stone-400 mb-4">
        <Calendar className="h-16 w-16 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-stone-900 mb-2">
        {t('noRooms')}
      </h3>
      <p className="text-stone-600 mb-6">
        {t('tryAdjusting')}
      </p>
      <Link href={`/${tenantSlug}/rooms`}>
        <Button variant="outline">
          {t('clearFilters')}
        </Button>
      </Link>
    </div>
  )
}

