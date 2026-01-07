import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

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
  // Get locale from cookie or use default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = localeCookie && locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : defaultLocale
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})

