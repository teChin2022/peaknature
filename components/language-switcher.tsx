'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/components/providers/language-provider'
import { Locale, locales, localeNames, localeFlags } from '@/lib/i18n-config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal'
  primaryColor?: string
}

export function LanguageSwitcher({ variant = 'default', primaryColor }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              locale === loc
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
            style={locale === loc && primaryColor ? { backgroundColor: primaryColor } : undefined}
          >
            {localeFlags[loc]} {localeNames[loc]}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-stone-500" />
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            {localeFlags[locale]} {localeNames[locale]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeFlags[loc]} {localeNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

