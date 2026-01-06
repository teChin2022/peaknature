import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getClientIP } from '@/lib/rate-limit'

/**
 * API Route for recording subscription payments
 * 
 * POST /api/admin/subscription-payment
 * 
 * Body:
 * - tenantId: string
 * - amount: number
 * - plan: string
 * - paymentMethod: string (optional, defaults to 'promptpay')
 * - notes: string (optional)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tenantId, amount, plan, paymentMethod = 'promptpay', notes } = body

    if (!tenantId || !amount || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tenantId, amount, plan' },
        { status: 400 }
      )
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, slug')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Record payment (create subscription_payments table if needed)
    // For now, we'll just update the tenant's plan and send notification
    
    // Update tenant plan if changed
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ plan })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error updating tenant plan:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update tenant plan' },
        { status: 500 }
      )
    }

    // Get platform settings for currency
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('default_currency, line_channel_access_token, line_user_id')
      .single()

    const currency = settings?.default_currency?.toUpperCase() || 'THB'

    // Send LINE notification
    if (settings?.line_channel_access_token && settings?.line_user_id) {
      const formattedAmount = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: currency,
      }).format(amount)

      const message = `💳 Subscription Payment Received

Tenant: ${tenant.name}
URL: /${tenant.slug}
Plan: ${plan}
Amount: ${formattedAmount}
Method: ${paymentMethod}
${notes ? `Notes: ${notes}` : ''}

Payment recorded successfully!`

      try {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.line_channel_access_token}`,
          },
          body: JSON.stringify({
            to: settings.line_user_id,
            messages: [{ type: 'text', text: message }],
          }),
        })
      } catch (lineError) {
        console.error('Failed to send LINE notification:', lineError)
        // Don't fail the request for notification errors
      }
    }

    // Log audit event
    try {
      const adminClient = createAdminClient()
      const clientIP = getClientIP(request.headers)
      const userAgent = request.headers.get('user-agent')
      
      await adminClient.from('audit_logs').insert({
        action: 'subscription.payment_recorded',
        category: 'admin',
        severity: 'info',
        actor_id: user.id,
        actor_email: user.email,
        actor_role: 'super_admin',
        actor_ip: clientIP,
        actor_user_agent: userAgent,
        target_type: 'tenant',
        target_id: tenantId,
        target_name: tenant.name,
        tenant_id: tenantId,
        details: { amount, plan, paymentMethod, notes },
        success: true
      })
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: `Payment of ${amount} recorded for ${tenant.name}`,
    })

  } catch (error) {
    console.error('Error in subscription payment API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

