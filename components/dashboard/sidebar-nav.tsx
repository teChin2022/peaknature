'use client'

import Link from 'next/link'
import { 
  LayoutDashboard, BedDouble, Calendar, ClipboardList, 
  Users, Star, BarChart3, Settings, CreditCard
} from 'lucide-react'
import { useTranslations } from 'next-intl'

// Define nav items with translation keys
const navItems = [
  { key: 'dashboard', href: '', icon: LayoutDashboard },
  { key: 'rooms', href: '/rooms', icon: BedDouble },
  { key: 'calendar', href: '/calendar', icon: Calendar },
  { key: 'bookings', href: '/bookings', icon: ClipboardList },
  { key: 'guests', href: '/guests', icon: Users },
  { key: 'reviews', href: '/reviews', icon: Star },
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'subscription', href: '/subscription', icon: CreditCard },
  { key: 'settings', href: '/settings', icon: Settings },
]

interface SidebarNavProps {
  slug: string
}

export function SidebarNav({ slug }: SidebarNavProps) {
  const t = useTranslations('dashboard')

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={`/${slug}/dashboard${item.href}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer"
        >
          <item.icon className="h-[18px] w-[18px]" />
          {t(`nav.${item.key}`)}
        </Link>
      ))}
    </nav>
  )
}

