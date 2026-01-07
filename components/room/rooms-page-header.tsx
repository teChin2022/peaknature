'use client'

import { useTranslations } from 'next-intl'

interface RoomsPageHeaderProps {
  roomCount: number
}

export function RoomsPageHeader({ roomCount }: RoomsPageHeaderProps) {
  const t = useTranslations('room')

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">
          {t('ourRooms')}
        </h1>
        <p className="text-lg text-stone-600">
          {roomCount === 1 
            ? t('findYourPerfectSpaceSingular', { count: roomCount })
            : t('findYourPerfectSpace', { count: roomCount })
          }
        </p>
      </div>
    </div>
  )
}

