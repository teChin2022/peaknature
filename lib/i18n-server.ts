import { cookies } from 'next/headers'
import { Locale, locales, defaultLocale } from './i18n-config'

// Get locale from cookie for server components
export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale
  }
  return defaultLocale
}

// Get translations for a specific locale
export async function getTranslations(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default
}

