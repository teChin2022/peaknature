import { getRequestConfig } from 'next-intl/server'

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

export default getRequestConfig(async () => {
  // For now, we'll use a simple approach - locale from cookie or default
  // This will be enhanced when we add the language switcher
  const locale = defaultLocale
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})

