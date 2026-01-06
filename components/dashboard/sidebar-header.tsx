'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface SidebarHeaderProps {
  slug: string
  tenantName: string
  primaryColor: string
}

export function SidebarHeader({ slug, tenantName, primaryColor }: SidebarHeaderProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="h-16 px-6 flex items-center border-b border-gray-100">
      <Link href={`/${slug}/dashboard`} className="flex items-center gap-3 cursor-pointer">
        <div 
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {tenantName.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm tracking-tight">{tenantName}</div>
          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t('hostDashboard')}</div>
        </div>
      </Link>
    </div>
  )
}

