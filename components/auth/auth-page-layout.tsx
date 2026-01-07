'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tenant } from '@/types/database'

interface AuthPageLayoutProps {
  tenant: Tenant
  type: 'login' | 'register' | 'forgot-password' | 'reset-password'
  error?: string | null
  success?: boolean
  redirectTo?: string
  children: React.ReactNode
}

export function AuthPageLayout({ 
  tenant, 
  type, 
  error,
  success,
  redirectTo,
  children 
}: AuthPageLayoutProps) {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')

  // Get title and subtitle based on type
  const getTitle = () => {
    switch (type) {
      case 'login':
        return t('welcomeBack')
      case 'register':
        return t('signUpTitle')
      case 'forgot-password':
        return success ? t('resetLinkSent') : t('resetPasswordTitle')
      case 'reset-password':
        return success ? t('passwordUpdated') : t('setNewPassword')
      default:
        return ''
    }
  }

  const getSubtitle = () => {
    switch (type) {
      case 'login':
        return t('signInToAccount')
      case 'register':
        return t('signUpSubtitle')
      case 'forgot-password':
        return success ? t('resetLinkSentDesc') : t('resetPasswordSubtitle')
      case 'reset-password':
        return success ? t('passwordUpdatedDesc') : t('enterNewPassword')
      default:
        return ''
    }
  }

  // Get link text and URL for bottom of form
  const getBottomLink = () => {
    switch (type) {
      case 'login':
        return {
          text: t('noAccount'),
          linkText: t('register'),
          href: `/${tenant.slug}/register${redirectTo ? `?redirect=${redirectTo}` : ''}`
        }
      case 'register':
        return {
          text: t('hasAccount'),
          linkText: t('login'),
          href: `/${tenant.slug}/login${redirectTo ? `?redirect=${redirectTo}` : ''}`
        }
      case 'forgot-password':
      case 'reset-password':
        return {
          text: '',
          linkText: t('backToLogin'),
          href: `/${tenant.slug}/login`,
          icon: true
        }
      default:
        return null
    }
  }

  // Error message mapping
  const getErrorMessage = (errorCode: string | null | undefined) => {
    if (!errorCode) return null
    switch (errorCode) {
      case 'blocked':
        return tErrors('accountNotFound')
      case 'account_deleted':
        return tErrors('accountNotFound')
      case 'wrong_tenant':
        return tErrors('unauthorized')
      default:
        return errorCode
    }
  }

  const bottomLink = getBottomLink()

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-2xl mb-4"
            style={{ backgroundColor: tenant.primary_color }}
          >
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {getTitle()}
          </h1>
          <p className="text-stone-600 mt-2">
            {getSubtitle()}
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        )}

        {/* Success State for forgot-password/reset-password */}
        {success && (type === 'forgot-password' || type === 'reset-password') ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <div className="text-center">
              <div 
                className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: `${tenant.primary_color}15` }}
              >
                <CheckCircle2 
                  className="h-8 w-8" 
                  style={{ color: tenant.primary_color }}
                />
              </div>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">
                {type === 'forgot-password' ? t('checkEmail') : t('passwordUpdated')}
              </h2>
              <p className="text-stone-600 text-sm mb-6">
                {type === 'forgot-password' ? t('resetLinkSentDesc') : t('passwordUpdatedDesc')}
              </p>
              {type === 'forgot-password' && (
                <p className="text-stone-500 text-xs mb-6">
                  {t('checkSpam')}
                </p>
              )}
              {type === 'reset-password' ? (
                <Link
                  href={`/${tenant.slug}/login`}
                  className="inline-flex items-center justify-center w-full h-11 rounded-lg text-white font-medium"
                  style={{ backgroundColor: tenant.primary_color }}
                >
                  {t('signInWithEmail')}
                </Link>
              ) : (
                <Link
                  href={`/${tenant.slug}/login`}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: tenant.primary_color }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToLogin')}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Form Container */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
              {children}
            </div>

            {/* Bottom Link */}
            {bottomLink && (
              <p className="text-center mt-6 text-stone-600">
                {bottomLink.text}{' '}
                <Link 
                  href={bottomLink.href}
                  className={`font-medium hover:underline ${bottomLink.icon ? 'inline-flex items-center gap-2' : ''}`}
                  style={{ color: tenant.primary_color }}
                >
                  {bottomLink.icon && <ArrowLeft className="h-4 w-4" />}
                  {bottomLink.linkText}
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

