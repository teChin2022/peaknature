'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

const COOKIE_CONSENT_KEY = 'cookie-consent'
const COOKIE_SESSION_KEY = 'cookie-session-id'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds
const PRIVACY_POLICY_VERSION = '1.0'

type ConsentStatus = 'accepted' | 'declined' | null

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * Set cookie with proper attributes
 */
function setCookie(name: string, value: string, maxAge: number) {
  // Only add Secure flag on HTTPS (production), not on localhost HTTP
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`
}

/**
 * Delete cookie
 */
function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

/**
 * Generate a unique session ID
 */
function getOrCreateSessionId(): string {
  let sessionId = getCookie(COOKIE_SESSION_KEY)
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    setCookie(COOKIE_SESSION_KEY, sessionId, COOKIE_MAX_AGE)
  }
  return sessionId
}

/**
 * Log consent to server for GDPR compliance
 */
async function logConsentToServer(status: 'accepted' | 'declined') {
  try {
    const sessionId = getOrCreateSessionId()
    
    const response = await fetch('/api/consent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentStatus: status,
        consentCategories: {
          necessary: true, // Always true
          analytics: status === 'accepted',
          marketing: status === 'accepted',
          preferences: status === 'accepted',
        },
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        sessionId,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      }),
    })
    
    const result = await response.json()
    if (!result.logged) {
      console.warn('Consent not logged to database:', result.message || result.error)
    }
  } catch (error) {
    // Don't block user experience if logging fails
    console.error('Failed to log consent:', error)
  }
}

export function CookieConsent() {
  const t = useTranslations('cookies')
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already made a choice (from cookie)
    const consent = getCookie(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = async () => {
    setIsLoading(true)
    setCookie(COOKIE_CONSENT_KEY, 'accepted', COOKIE_MAX_AGE)
    
    // Log consent to server (async, don't block)
    logConsentToServer('accepted')
    
    setIsVisible(false)
    setIsLoading(false)
    
    // Enable analytics/tracking cookies here if needed
    enableAnalytics()
  }

  const handleDecline = async () => {
    setIsLoading(true)
    setCookie(COOKIE_CONSENT_KEY, 'declined', COOKIE_MAX_AGE)
    
    // Log consent to server (async, don't block)
    logConsentToServer('declined')
    
    setIsVisible(false)
    setIsLoading(false)
    
    // Disable analytics/tracking cookies here if needed
    disableAnalytics()
  }

  const enableAnalytics = () => {
    // Add your analytics initialization here
    // Example: Google Analytics, Mixpanel, etc.
    console.log('Analytics enabled')
  }

  const disableAnalytics = () => {
    // Disable analytics tracking here
    console.log('Analytics disabled')
  }

  // Don't render on server or before checking consent
  if (!mounted || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Icon */}
            <div className="hidden md:flex h-12 w-12 rounded-full bg-blue-100 items-center justify-center flex-shrink-0">
              <Cookie className="h-6 w-6 text-blue-600" />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-blue-600 md:hidden" />
                  {t('title')}
                </h3>
                <button
                  onClick={handleDecline}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                {t('description')}{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                  {t('privacyPolicy')}
                </Link>
              </p>
              
              {/* Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={handleAccept}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
                >
                  {t('acceptAll')}
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6"
                >
                  {t('decline')}
                </Button>
                <Link href="/privacy" className="hidden sm:inline-flex">
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    {t('learnMore')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Cookie Settings Button - Can be placed in footer or settings page
 * Allows users to change their cookie preferences
 */
export function CookieSettingsButton() {
  const t = useTranslations('cookies')
  
  const handleOpenSettings = () => {
    // Reset consent to show the banner again
    deleteCookie(COOKIE_CONSENT_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={handleOpenSettings}
      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
    >
      <Settings className="h-4 w-4" />
      {t('manageSettings')}
    </button>
  )
}

/**
 * Hook to check if cookies have been accepted
 */
export function useCookieConsent(): ConsentStatus {
  const [consent, setConsent] = useState<ConsentStatus>(null)

  useEffect(() => {
    const stored = getCookie(COOKIE_CONSENT_KEY)
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored)
    }
  }, [])

  return consent
}

/**
 * Reset cookie consent (for testing or settings page)
 */
export function resetCookieConsent() {
  deleteCookie(COOKIE_CONSENT_KEY)
  window.location.reload()
}

