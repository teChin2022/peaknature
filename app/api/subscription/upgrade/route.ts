import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addMonths } from 'date-fns'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 upgrade requests per minute per IP
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(5, `upgrade:${clientIP}`)
    if (!rateLimitOk) {
      logger.warn('Rate limit exceeded for subscription upgrade', { ip: clientIP })
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    logger.audit('subscription_upgrade_attempt', { 
      userId: user.id, 
      ip: clientIP, 
      success: true 
    })

    // Get request body
    const body = await request.json()
    const { tenantId, amount, currency, paymentProofUrl } = body

    if (!tenantId || !amount || !paymentProofUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify that the user is the host of this tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is the host of this tenant
    if (profile.tenant_id !== tenantId && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Not authorized for this tenant' }, { status: 403 })
    }

    // Calculate period
    const periodStart = new Date()
    const periodEnd = addMonths(periodStart, 1)

    // Insert payment record using service role to bypass RLS
    const { data: payment, error: insertError } = await supabase
      .from('subscription_payments')
      .insert({
        tenant_id: tenantId,
        amount: amount,
        currency: currency || 'THB',
        payment_method: 'promptpay',
        payment_proof_url: paymentProofUrl,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting payment:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Payment submitted successfully. Awaiting verification.'
    })

  } catch (error) {
    console.error('Subscription upgrade error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

