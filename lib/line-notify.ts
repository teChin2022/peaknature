/**
 * LINE Messaging API Utility for Admin Notifications
 * 
 * This utility sends notifications to the admin via LINE Messaging API.
 * Used for:
 * 1. New host/tenant registration
 * 2. System errors
 * 3. Monthly subscription payments
 */

import { createClient } from '@/lib/supabase/server'

interface LineNotificationResult {
  success: boolean
  error?: string
}

/**
 * Send a LINE message to the admin
 */
export async function sendAdminLineNotification(
  message: string
): Promise<LineNotificationResult> {
  try {
    const supabase = await createClient()
    
    // Get admin LINE configuration from platform_settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('line_channel_access_token, line_user_id')
      .single()

    if (settingsError || !settings) {
      console.log('LINE notification skipped: No settings found')
      return { success: false, error: 'No LINE settings configured' }
    }

    const { line_channel_access_token, line_user_id } = settings

    if (!line_channel_access_token || !line_user_id) {
      console.log('LINE notification skipped: LINE not configured')
      return { success: false, error: 'LINE not configured' }
    }

    // Send message via LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${line_channel_access_token}`,
      },
      body: JSON.stringify({
        to: line_user_id,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LINE API error:', errorData)
      return { success: false, error: `LINE API error: ${response.status}` }
    }

    console.log('LINE notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Error sending LINE notification:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Send notification for new tenant registration
 */
export async function notifyNewTenantRegistration(
  tenantName: string,
  tenantEmail: string,
  tenantSlug: string
): Promise<LineNotificationResult> {
  const message = `🏠 New Tenant Registration

Name: ${tenantName}
Email: ${tenantEmail}
URL: /${tenantSlug}

A new host has registered on the platform.`

  return sendAdminLineNotification(message)
}

/**
 * Send notification for system error
 */
export async function notifySystemError(
  errorType: string,
  errorMessage: string,
  context?: string
): Promise<LineNotificationResult> {
  const message = `🚨 System Error Alert

Type: ${errorType}
Message: ${errorMessage}
${context ? `Context: ${context}` : ''}

Please check the system immediately.`

  return sendAdminLineNotification(message)
}

/**
 * Send notification for subscription payment
 */
export async function notifySubscriptionPayment(
  tenantName: string,
  amount: number,
  plan: string,
  currency: string = 'THB'
): Promise<LineNotificationResult> {
  const formattedAmount = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
  }).format(amount)

  const message = `💳 Subscription Payment Received

Tenant: ${tenantName}
Plan: ${plan}
Amount: ${formattedAmount}

Thank you for the payment!`

  return sendAdminLineNotification(message)
}

