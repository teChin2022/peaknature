/**
 * Notification Service
 * 
 * Handles sending notifications via Email and LINE Messaging API
 */

import { removeTrailingSlash } from './utils'

// LINE Messaging API endpoint
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push'

/**
 * Get the app base URL (server-side), ensuring no trailing slash
 */
function getServerBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''
  return removeTrailingSlash(url)
}

export interface LineMessageOptions {
  channelAccessToken: string
  userId: string
  message: string
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  replyTo?: string
}

export interface NotificationResult {
  success: boolean
  error?: string
}

/**
 * Send LINE message using Messaging API
 * 
 * @param options - LINE Messaging API options
 * @returns Notification result
 */
export async function sendLineMessage(options: LineMessageOptions): Promise<NotificationResult> {
  const { channelAccessToken, userId, message } = options

  if (!channelAccessToken || !userId) {
    console.warn('LINE Messaging not configured (missing channelAccessToken or userId)')
    return { success: false, error: 'LINE not configured' }
  }

  try {
    const response = await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('LINE Messaging API error:', error)
      return {
        success: false,
        error: `LINE message failed: ${error.message || response.status}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('LINE Messaging API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send LINE message'
    }
  }
}

/**
 * Send LINE Flex Message (rich message) using Messaging API
 * 
 * @param options - LINE Messaging API options with flex content
 * @returns Notification result
 */
export async function sendLineFlexMessage(options: {
  channelAccessToken: string
  userId: string
  altText: string
  contents: object
}): Promise<NotificationResult> {
  const { channelAccessToken, userId, altText, contents } = options

  if (!channelAccessToken || !userId) {
    console.warn('LINE Messaging not configured')
    return { success: false, error: 'LINE not configured' }
  }

  try {
    const response = await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'flex',
            altText,
            contents
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('LINE Flex Message error:', error)
      return {
        success: false,
        error: `LINE flex message failed: ${error.message || response.status}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('LINE Flex Message error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send LINE flex message'
    }
  }
}

/**
 * Send email notification using Resend API (or other provider)
 * 
 * Note: You'll need to set up an email service like Resend, SendGrid, etc.
 * For now, this uses a simple fetch to a webhook or the built-in Supabase Edge Function
 */
export async function sendEmail(options: EmailOptions): Promise<NotificationResult> {
  const { to, subject, html, text, fromName, replyTo } = options

  // Check if email API key is configured
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    console.warn('Email service not configured (RESEND_API_KEY missing)')
    // Log the email for development
    console.log('Email would be sent:', { to, subject, fromName, replyTo })
    return { success: true } // Return success in dev mode
  }

  // Build the FROM address
  // Use platform email if configured, otherwise use Resend's free test email
  // Note: For production, set EMAIL_FROM to a verified domain email (e.g., noreply@yourdomain.com)
  // Resend's test email (onboarding@resend.dev) works for development without domain verification
  const platformEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const fromAddress = fromName 
    ? `${fromName} <${platformEmail}>`
    : `Peaksnature <${platformEmail}>`

  try {
    const emailPayload: Record<string, unknown> = {
      from: fromAddress,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for plain text
    }

    // Add reply-to so guest replies go to tenant
    if (replyTo) {
      emailPayload.reply_to = replyTo
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Email send error:', error)
      return {
        success: false,
        error: `Email failed: ${JSON.stringify(error)}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Translation messages type
interface EmailTranslations {
  hostBookingConfirmed: {
    title: string
    paymentVerified: string
    description: string
    guest: string
    room: string
    checkIn: string
    checkOut: string
    guests: string
    total: string
    bookingReference: string
    guestNotes: string
    viewDashboard: string
    subject: string
  }
}

// Helper function to get translations for email
async function getEmailTranslations(language: 'th' | 'en'): Promise<EmailTranslations> {
  const messages = await import(`../messages/${language}.json`)
  return messages.default.emailNotifications
}

// Helper function to darken a color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt)
  const B = Math.max(0, (num & 0x0000ff) - amt)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

/**
 * Generate booking confirmation notification message
 */
export async function generateBookingNotification(params: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: string
  bookingRef: string
  notes?: string | null
  primaryColor?: string
  language?: 'th' | 'en'
  tenantName?: string
}) {
  const { 
    guestName, roomName, checkIn, checkOut, guests, totalPrice, bookingRef, notes,
    primaryColor = '#059669', language = 'th', tenantName = ''
  } = params

  // Get translations
  const t = await getEmailTranslations(language)
  const h = t.hostBookingConfirmed

  // Calculate darker shade for gradient
  const darkerColor = darkenColor(primaryColor, 20)

  // Include notes if they contain transport info or special requests
  let notesSection = ''
  if (notes) {
    notesSection = `\n📝 ${h.guestNotes}:\n${notes}\n`
  }

  const lineMessage = `
🏠 ${h.title}

👤 ${h.guest}: ${guestName}
🛏️ ${h.room}: ${roomName}
📅 ${h.checkIn}: ${checkIn}
📅 ${h.checkOut}: ${checkOut}
👥 ${h.guests}: ${guests}
💰 ${h.total}: ${totalPrice}
📋 Ref: ${bookingRef}${notesSection}

${h.paymentVerified} ✅`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                🏡 ${h.title}
              </h1>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); padding: 8px 20px; border-radius: 50px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">✓ ${h.paymentVerified}</span>
                  </td>
                </tr>
              </table>
              ${tenantName ? `<p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">${tenantName}</p>` : ''}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${h.description}
              </p>
              
              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <!-- Booking Reference -->
                <tr>
                  <td style="padding: 20px 24px; background-color: ${primaryColor}10; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="text-align: center;">
                          <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">${h.bookingReference}</span>
                          <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 22px; font-weight: 700; color: ${primaryColor}; letter-spacing: 2px;">${bookingRef}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Guest -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">👤 ${h.guest}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${guestName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Room -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">🏠 ${h.room}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${roomName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Check-in -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">📅 ${h.checkIn}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${checkIn}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Check-out -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">📅 ${h.checkOut}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${checkOut}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Guests -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">👥 ${h.guests}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${guests}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Total -->
                <tr>
                  <td style="padding: 20px 24px; background-color: #ffffff; border-radius: 0 0 12px 12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #111827; font-size: 16px; font-weight: 600;">${h.total}</td>
                        <td style="color: ${primaryColor}; font-size: 24px; font-weight: 700; text-align: right;">${totalPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${notes ? `
              <!-- Guest Notes -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">📝 ${h.guestNotes}</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; white-space: pre-line;">${notes}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Footer text -->
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                ${h.viewDashboard}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const emailSubject = `✅ ${h.subject.replace('{guestName}', guestName).replace('{roomName}', roomName).replace('{checkIn}', checkIn)}`

  return {
    lineMessage,
    emailHtml,
    emailSubject
  }
}

/**
 * Generate payment pending notification
 */
export function generatePaymentPendingNotification(params: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
  totalPrice: string
  expiresAt: string
}) {
  const { guestName, roomName, checkIn, checkOut, totalPrice, expiresAt } = params

  const lineMessage = `
⏳ Pending Payment

👤 Guest: ${guestName}
🛏️ Room: ${roomName}
📅 ${checkIn} - ${checkOut}
💰 Amount: ${totalPrice}
⏰ Expires: ${expiresAt}

Waiting for payment confirmation...`

  return { lineMessage }
}

// Guest email translations type
interface GuestEmailTranslations {
  guestBookingConfirmed: {
    title: string
    thankYou: string
    paymentVerified: string
    greeting: string
    message: string
    bookingReference: string
    room: string
    checkIn: string
    checkOut: string
    from: string
    until: string
    guests: string
    guestSingular: string
    guestPlural: string
    totalPaid: string
    whatsNext: string
    saveEmail: string
    arriveOn: string
    contactUs: string
    yourNotes: string
    viewBookings: string
    thankYouFooter: string
    questionsFooter: string
    subject: string
  }
}

// Helper function to get guest email translations
async function getGuestEmailTranslations(language: 'th' | 'en'): Promise<GuestEmailTranslations> {
  const messages = await import(`../messages/${language}.json`)
  return messages.default.emailNotifications
}

/**
 * Generate guest booking confirmation email
 */
export async function generateGuestConfirmationEmail(params: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: string
  bookingRef: string
  checkInTime: string
  checkOutTime: string
  tenantName: string
  tenantSlug: string
  primaryColor?: string
  notes?: string | null
  language?: 'th' | 'en'
}) {
  const { 
    guestName, roomName, checkIn, checkOut, guests, totalPrice, bookingRef,
    checkInTime, checkOutTime, tenantName, tenantSlug, primaryColor = '#059669', notes,
    language = 'th'
  } = params

  // Get translations
  const t = await getGuestEmailTranslations(language)
  const g = t.guestBookingConfirmed

  // Calculate darker shade for gradient
  const darkerColor = darkenColor(primaryColor, 20)

  const confirmationUrl = `${getServerBaseUrl()}/${tenantSlug}/my-bookings`

  // Guest label based on count
  const guestLabel = guests === 1 ? g.guestSingular : g.guestPlural

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                🎉 ${g.title}
              </h1>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                ${g.thankYou.replace('{tenantName}', tenantName)}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Payment Verified Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #10b981; padding: 10px 24px; border-radius: 50px;">
                          <span style="color: #ffffff; font-size: 14px; font-weight: 600;">✓ ${g.paymentVerified}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                ${g.greeting.replace('{guestName}', guestName)}
              </p>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${g.message}
              </p>
              
              <!-- Booking Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                
                <!-- Booking Reference -->
                <tr>
                  <td style="padding: 24px; background-color: ${primaryColor}10; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px;">${g.bookingReference}</span>
                    <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 26px; font-weight: 700; color: ${primaryColor}; letter-spacing: 3px;">${bookingRef}</span>
                  </td>
                </tr>
                
                <!-- Room -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">🏠 ${g.room}</span>
                    <span style="font-size: 18px; font-weight: 600; color: #111827;">${roomName}</span>
                  </td>
                </tr>
                
                <!-- Check-in / Check-out Row -->
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                          <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">📅 ${g.checkIn}</span>
                          <span style="display: block; font-size: 16px; font-weight: 600; color: #111827;">${checkIn}</span>
                          <span style="font-size: 14px; color: #6b7280;">${g.from.replace('{time}', checkInTime)}</span>
                        </td>
                        <td width="50%" style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
                          <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">📅 ${g.checkOut}</span>
                          <span style="display: block; font-size: 16px; font-weight: 600; color: #111827;">${checkOut}</span>
                          <span style="font-size: 14px; color: #6b7280;">${g.until.replace('{time}', checkOutTime)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Guests -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">👥 ${g.guests}</td>
                        <td style="color: #111827; font-size: 16px; font-weight: 600; text-align: right;">${guests} ${guestLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Total -->
                <tr>
                  <td style="padding: 24px; background-color: #ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #111827; font-size: 18px; font-weight: 600;">${g.totalPaid}</td>
                        <td style="color: ${primaryColor}; font-size: 28px; font-weight: 700; text-align: right;">${totalPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #1e40af;">📍 ${g.whatsNext}</p>
                    <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                      <li>${g.saveEmail}</li>
                      <li>${g.arriveOn.replace('{date}', checkIn).replace('{time}', checkInTime)}</li>
                      <li>${g.contactUs}</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              ${notes ? `
              <!-- Guest Notes -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">📝 ${g.yourNotes}</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6; white-space: pre-line;">${notes}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      ${g.viewBookings}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 15px; font-weight: 500;">
                ${g.thankYouFooter.replace('{tenantName}', tenantName)}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                ${g.questionsFooter}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const emailSubject = `✅ ${g.subject.replace('{roomName}', roomName).replace('{checkIn}', checkIn).replace('{checkOut}', checkOut)}`

  return { emailHtml, emailSubject }
}

// Cancellation email translations type
interface CancellationEmailTranslations {
  hostBookingCancelled: {
    title: string
    badge: string
    description: string
    bookingReference: string
    guest: string
    room: string
    dates: string
    refundAmount: string
    cancellationReason: string
    guestContact: string
    email: string
    phone: string
    pleaseProcess: string
    viewDashboard: string
    subject: string
  }
  guestBookingCancelled: {
    title: string
    badge: string
    greeting: string
    message: string
    bookingReference: string
    room: string
    dates: string
    refundAmount: string
    yourReason: string
    refundInfo: string
    refundMessage: string
    refundContact: string
    questions: string
    contactUs: string
    thankYou: string
    subject: string
  }
}

// Helper function to get cancellation email translations
async function getCancellationEmailTranslations(language: 'th' | 'en'): Promise<CancellationEmailTranslations> {
  const messages = await import(`../messages/${language}.json`)
  return messages.default.emailNotifications
}

/**
 * Generate booking cancellation notification for host
 */
export async function generateBookingCancellationNotification(params: {
  guestName: string
  guestEmail: string
  guestPhone: string
  roomName: string
  checkIn: string
  checkOut: string
  refundAmount: string
  bookingRef: string
  reason: string
  primaryColor?: string
  language?: 'th' | 'en'
  tenantName?: string
}) {
  const { 
    guestName, guestEmail, guestPhone, roomName, checkIn, checkOut, 
    refundAmount, bookingRef, reason,
    primaryColor = '#dc2626', language = 'th', tenantName = ''
  } = params

  // Get translations
  const t = await getCancellationEmailTranslations(language)
  const h = t.hostBookingCancelled

  // Use red as the cancel color with subtle branding
  const cancelColor = '#dc2626'
  const darkerCancelColor = '#b91c1c'

  const lineMessage = `🚫 ${h.title}

📋 ${h.bookingReference}: ${bookingRef}
🏠 ${h.room}: ${roomName}
👤 ${h.guest}: ${guestName}
📅 ${h.dates}: ${checkIn} - ${checkOut}

📝 ${h.cancellationReason}:
${reason}

💰 ${h.refundAmount}: ${refundAmount}

${h.guestContact}:
📧 ${guestEmail}
📱 ${guestPhone}

${h.pleaseProcess}`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${cancelColor} 0%, ${darkerCancelColor} 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                🚫 ${h.title}
              </h1>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); padding: 8px 20px; border-radius: 50px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">⚠️ ${h.badge}</span>
                  </td>
                </tr>
              </table>
              ${tenantName ? `<p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">${tenantName}</p>` : ''}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${h.description}
              </p>
              
              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-radius: 12px; overflow: hidden; border: 1px solid #fecaca;">
                <!-- Booking Reference -->
                <tr>
                  <td style="padding: 20px 24px; background-color: #fee2e2; border-bottom: 1px solid #fecaca;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="text-align: center;">
                          <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #991b1b; margin-bottom: 4px;">${h.bookingReference}</span>
                          <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 22px; font-weight: 700; color: ${cancelColor}; letter-spacing: 2px;">${bookingRef}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Guest -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #fecaca; background-color: #ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">👤 ${h.guest}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${guestName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Room -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #fecaca; background-color: #ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">🏠 ${h.room}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${roomName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Dates -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #fecaca; background-color: #ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 120px;">📅 ${h.dates}</td>
                        <td style="color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${checkIn} - ${checkOut}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Refund Amount -->
                <tr>
                  <td style="padding: 20px 24px; background-color: #ffffff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #991b1b; font-size: 16px; font-weight: 600;">💰 ${h.refundAmount}</td>
                        <td style="color: ${cancelColor}; font-size: 24px; font-weight: 700; text-align: right;">${refundAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Cancellation Reason -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">📝 ${h.cancellationReason}</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; white-space: pre-line;">${reason}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Guest Contact -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1e40af;">📞 ${h.guestContact}</p>
                    <p style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 14px;">
                      📧 ${h.email}: <a href="mailto:${guestEmail}" style="color: #2563eb; text-decoration: none;">${guestEmail}</a>
                    </p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                      📱 ${h.phone}: <a href="tel:${guestPhone}" style="color: #2563eb; text-decoration: none;">${guestPhone}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer text -->
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                ${h.viewDashboard}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const emailSubject = `🚫 ${h.subject.replace('{bookingRef}', bookingRef)}`

  return {
    lineMessage,
    emailHtml,
    emailSubject
  }
}

/**
 * Generate booking cancellation confirmation email for guest
 */
export async function generateGuestCancellationEmail(params: {
  guestName: string
  roomName: string
  checkIn: string
  checkOut: string
  refundAmount: string
  bookingRef: string
  reason: string
  tenantName: string
  tenantSlug: string
  primaryColor?: string
  language?: 'th' | 'en'
}) {
  const { 
    guestName, roomName, checkIn, checkOut, refundAmount, bookingRef, reason,
    tenantName, tenantSlug, primaryColor = '#059669', language = 'th'
  } = params

  // Get translations
  const t = await getCancellationEmailTranslations(language)
  const g = t.guestBookingCancelled

  // Use a muted color for cancellation
  const cancelColor = '#6b7280'
  const darkerCancelColor = '#4b5563'

  const confirmationUrl = `${getServerBaseUrl()}/${tenantSlug}/my-bookings`

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${g.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${cancelColor} 0%, ${darkerCancelColor} 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                📋 ${g.title}
              </h1>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.2); padding: 8px 20px; border-radius: 50px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">✓ ${g.badge}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                ${g.greeting.replace('{guestName}', guestName)}
              </p>
              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${g.message}
              </p>
              
              <!-- Booking Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                
                <!-- Booking Reference -->
                <tr>
                  <td style="padding: 24px; background-color: #f3f4f6; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px;">${g.bookingReference}</span>
                    <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 26px; font-weight: 700; color: #374151; letter-spacing: 3px; text-decoration: line-through;">${bookingRef}</span>
                  </td>
                </tr>
                
                <!-- Room -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">🏠 ${g.room}</span>
                    <span style="font-size: 18px; font-weight: 600; color: #111827;">${roomName}</span>
                  </td>
                </tr>
                
                <!-- Dates -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">📅 ${g.dates}</span>
                    <span style="font-size: 16px; font-weight: 600; color: #6b7280; text-decoration: line-through;">${checkIn} - ${checkOut}</span>
                  </td>
                </tr>
                
                <!-- Refund Amount -->
                <tr>
                  <td style="padding: 24px; background-color: #ecfdf5;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #065f46; font-size: 16px; font-weight: 600;">💰 ${g.refundAmount}</td>
                        <td style="color: #059669; font-size: 28px; font-weight: 700; text-align: right;">${refundAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Cancellation Reason -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f9fafb; border-left: 4px solid #9ca3af; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #4b5563;">📝 ${g.yourReason}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; white-space: pre-line;">${reason}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Refund Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #065f46;">💵 ${g.refundInfo}</p>
                    <p style="margin: 0 0 8px 0; color: #047857; font-size: 14px; line-height: 1.6;">
                      ${g.refundMessage.replace('{amount}', refundAmount)}
                    </p>
                    <p style="margin: 0; color: #047857; font-size: 13px;">
                      ${g.refundContact}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Questions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">❓ ${g.questions}</p>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      ${g.contactUs}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${darkenColor(primaryColor, 20)} 100%); color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      ${language === 'th' ? 'ดูการจองของฉัน' : 'View My Bookings'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 15px; font-weight: 500;">
                ${g.thankYou}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                ${tenantName}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const emailSubject = `📋 ${g.subject.replace('{roomName}', roomName).replace('{checkIn}', checkIn).replace('{checkOut}', checkOut)}`

  return { emailHtml, emailSubject }
}

/**
 * Generate waitlist notification
 */
export function generateWaitlistNotification(params: {
  roomName: string
  checkIn: string
  checkOut: string
  tenantSlug: string
}) {
  const { roomName, checkIn, checkOut, tenantSlug } = params

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 Dates Available!</h1>
    </div>
    <div class="content">
      <p>Good news! The dates you were waiting for are now available.</p>
      
      <p><strong>Room:</strong> ${roomName}</p>
      <p><strong>Dates:</strong> ${checkIn} - ${checkOut}</p>
      
      <a href="${getServerBaseUrl()}/${tenantSlug}/rooms" class="btn">
        Book Now →
      </a>
      
      <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
        Hurry! These dates are available on a first-come, first-served basis.
      </p>
    </div>
  </div>
</body>
</html>`

  const emailSubject = `🎉 Dates Available: ${roomName} (${checkIn} - ${checkOut})`

  return { emailHtml, emailSubject }
}

