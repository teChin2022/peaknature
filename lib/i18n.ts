import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { Locale, locales, defaultLocale } from './i18n-config'

// Re-export for backwards compatibility (but prefer importing from i18n-config directly)
export { Locale, locales, defaultLocale, localeNames, localeFlags } from './i18n-config'

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
