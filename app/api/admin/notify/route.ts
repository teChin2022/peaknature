import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route for sending admin LINE notifications
 * 
 * Endpoints:
 * - POST /api/admin/notify
 * 
 * Body:
 * - type: 'new_tenant' | 'system_error' | 'subscription_payment'
 * - data: Object with type-specific fields
 */

interface NotifyRequest {
  type: 'new_tenant' | 'system_error' | 'subscription_payment'
  data: {
    // For new_tenant
    tenantName?: string
    tenantEmail?: string
    tenantSlug?: string
    // For system_error
    errorType?: string
    errorMessage?: string
    context?: string
    // For subscription_payment
    amount?: number
    plan?: string
    currency?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing type or data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get admin LINE configuration
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('line_channel_access_token, line_user_id, notify_new_tenant, notify_errors')
      .single()

    if (settingsError || !settings) {
      console.log('LINE notification skipped: No settings found')
      return NextResponse.json({ success: true, message: 'No settings configured' })
    }

    const { line_channel_access_token, line_user_id, notify_new_tenant, notify_errors } = settings

    // Check if LINE is configured
    if (!line_channel_access_token || !line_user_id) {
      console.log('LINE notification skipped: LINE not configured')
      return NextResponse.json({ success: true, message: 'LINE not configured' })
    }

    // Build message based on type
    let message = ''
    let shouldSend = true

    switch (type) {
      case 'new_tenant':
        if (!notify_new_tenant) {
          shouldSend = false
          break
        }
        message = `🏠 New Host/Tenant Registration

Name: ${data.tenantName || 'Unknown'}
Email: ${data.tenantEmail || 'N/A'}
URL: /${data.tenantSlug || 'unknown'}

A new host has registered on the platform.`
        break

      case 'system_error':
        if (!notify_errors) {
          shouldSend = false
          break
        }
        message = `🚨 System Error Alert

Type: ${data.errorType || 'Unknown'}
Message: ${data.errorMessage || 'No message'}
${data.context ? `Context: ${data.context}` : ''}

Please check the system immediately.`
        break

      case 'subscription_payment':
        const formattedAmount = new Intl.NumberFormat('th-TH', {
          style: 'currency',
          currency: data.currency || 'THB',
        }).format(data.amount || 0)

        message = `💳 Subscription Payment Received

Tenant: ${data.tenantName || 'Unknown'}
Plan: ${data.plan || 'N/A'}
Amount: ${formattedAmount}

Thank you for the payment!`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    if (!shouldSend) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notification disabled in settings' 
      })
    }

    // Send LINE message
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
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

    if (!lineResponse.ok) {
      const errorData = await lineResponse.text()
      console.error('LINE API error:', errorData)
      return NextResponse.json({
        success: false,
        error: `LINE API error: ${lineResponse.status}`
      })
    }

    console.log('LINE notification sent successfully:', type)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in notify API:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

