'use client'

import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/components/providers/language-provider'
import { localeNames, localeFlags } from '@/lib/i18n'
import { useTranslations } from 'next-intl'

interface DashboardLanguageSwitcherProps {
  variant?: 'desktop' | 'mobile'
}

export function DashboardLanguageSwitcher({ variant = 'desktop' }: DashboardLanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()
  const t = useTranslations('dashboard')

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-500 flex items-center gap-2 px-4">
          <Globe className="h-4 w-4" />
          {t('actions.selectLanguage')}
        </span>
        <div className="flex gap-2 px-4">
          <button
            onClick={() => setLocale('th')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              locale === 'th' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {localeFlags.th} {localeNames.th}
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              locale === 'en' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {localeFlags.en} {localeNames.en}
          </button>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 text-sm font-medium"
        >
          <Globe className="h-[18px] w-[18px]" />
          <span>{localeFlags[locale]} {localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setLocale('th')}
          className={locale === 'th' ? 'bg-gray-100' : ''}
        >
          {localeFlags.th} {localeNames.th}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocale('en')}
          className={locale === 'en' ? 'bg-gray-100' : ''}
        >
          {localeFlags.en} {localeNames.en}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
