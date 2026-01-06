'use client'

import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/providers/language-provider'

interface RoomsPageHeaderProps {
  roomCount: number
}

export function RoomsPageHeader({ roomCount }: RoomsPageHeaderProps) {
  const t = useTranslations('room')
  const { locale } = useLanguage()

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">
          {t('ourRooms')}
        </h1>
        <p className="text-lg text-stone-600">
          {locale === 'th' 
            ? `พบห้องพักที่เหมาะกับคุณจากห้องพักที่ว่าง ${roomCount} ห้อง`
            : `Find your perfect space from our ${roomCount} available room${roomCount !== 1 ? 's' : ''}`
          }
        </p>
      </div>
    </div>
  )
}

