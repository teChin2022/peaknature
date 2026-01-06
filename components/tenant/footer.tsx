'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react'
import { Tenant, TenantSettings } from '@/types/database'
import { useTranslations } from 'next-intl'

interface TenantFooterProps {
  tenant: Tenant
  settings: TenantSettings
}

export function TenantFooter({ tenant, settings }: TenantFooterProps) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  // Build full address
  const addressParts = [
    settings.contact.address,
    settings.contact.city,
    settings.contact.postal_code,
    settings.contact.country
  ].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  // Check if any social links exist
  const hasSocialLinks = settings.social.facebook || settings.social.instagram || 
                         settings.social.line || settings.social.whatsapp

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-white font-bold text-base sm:text-lg"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.name.charAt(0)}
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">
                {tenant.name}
              </span>
            </div>
            <p className="text-sm sm:text-base text-stone-400 max-w-md leading-relaxed">
              {settings.hero.description || 
                'Experience the warmth of home away from home. We offer comfortable accommodations with authentic local hospitality for travelers seeking memorable stays.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  href={`/${tenant.slug}/rooms`} 
                  className="text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                >
                  {tNav('rooms')}
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${tenant.slug}#amenities`} 
                  className="text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                >
                  {tNav('amenities')}
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${tenant.slug}#location`} 
                  className="text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                >
                  {tNav('location')}
                </Link>
              </li>
              <li>
                <Link 
                  href={`/${tenant.slug}/my-bookings`} 
                  className="text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                >
                  {tNav('myBookings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">
              {t('contact')}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {/* Address */}
              {fullAddress ? (
                <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-stone-400">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" style={{ color: tenant.primary_color }} />
                  <span>{fullAddress}</span>
                </li>
              ) : (
                <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-stone-400">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: tenant.primary_color }} />
                  <span className="italic text-stone-500">-</span>
                </li>
              )}

              {/* Phone */}
              {settings.contact.phone ? (
                <li>
                  <a 
                    href={`tel:${settings.contact.phone}`}
                    className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: tenant.primary_color }} />
                    <span>{settings.contact.phone}</span>
                  </a>
                </li>
              ) : (
                <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-stone-400">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: tenant.primary_color }} />
                  <span className="italic text-stone-500">-</span>
                </li>
              )}

              {/* Email */}
              {settings.contact.email ? (
                <li>
                  <a 
                    href={`mailto:${settings.contact.email}`}
                    className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-stone-400 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: tenant.primary_color }} />
                    <span>{settings.contact.email}</span>
                  </a>
                </li>
              ) : (
                <li className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-stone-400">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: tenant.primary_color }} />
                  <span className="italic text-stone-500">-</span>
                </li>
              )}
            </ul>

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex gap-4 mt-4 sm:mt-6">
                {settings.social.facebook && (
                  <a 
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-white transition-colors p-1"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings.social.instagram && (
                  <a 
                    href={settings.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-white transition-colors p-1"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings.social.line && (
                  <a 
                    href={`https://line.me/ti/p/${settings.social.line.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-white transition-colors p-1"
                    aria-label="LINE"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
                {settings.social.whatsapp && (
                  <a 
                    href={`https://wa.me/${settings.social.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-white transition-colors p-1"
                    aria-label="WhatsApp"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-stone-800 flex flex-col items-center gap-3 sm:gap-4 md:flex-row md:justify-between">
          <p className="text-stone-500 text-xs sm:text-sm text-center md:text-left">
            © {new Date().getFullYear()} {tenant.name}. {t('allRightsReserved')}.
          </p>
          <div className="flex gap-4 sm:gap-6">
            <Link 
              href={`/${tenant.slug}/privacy`}
              className="text-xs sm:text-sm text-stone-500 hover:text-white transition-colors"
            >
              {t('privacy')}
            </Link>
            <Link 
              href={`/${tenant.slug}/terms`}
              className="text-xs sm:text-sm text-stone-500 hover:text-white transition-colors"
            >
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
