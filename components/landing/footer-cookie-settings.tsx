'use client'

import { useTranslations } from 'next-intl'

const COOKIE_CONSENT_KEY = 'cookie-consent'

/**
 * Delete cookie by name
 */
function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export function FooterCookieSettings() {
  const t = useTranslations('cookies')
  
  const handleOpenSettings = () => {
    // Delete the consent cookie to show the banner again
    deleteCookie(COOKIE_CONSENT_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={handleOpenSettings}
      className="hover:text-white transition-colors cursor-pointer"
    >
      {t('manageSettings')}
    </button>
  )
}

