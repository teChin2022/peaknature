// Shared i18n configuration - safe to import in both client and server components

export type Locale = 'th' | 'en'

export const locales: Locale[] = ['th', 'en']
export const defaultLocale: Locale = 'th'

export const localeNames: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English'
}

export const localeFlags: Record<Locale, string> = {
  th: '🇹🇭',
  en: '🇺🇸'
}

