import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 30 requests per minute for admin settings
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(30, `admin-settings:${clientIP}`)
    if (!rateLimitOk) {
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()

    // Check if user is authenticated and is super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get settings
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)

    if (error) {
      logger.error('Error fetching settings', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data?.[0] || null })
  } catch (error) {
    logger.error('Settings GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 updates per minute for admin settings
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(10, `admin-settings-post:${clientIP}`)
    if (!rateLimitOk) {
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()

    // Check if user is authenticated and is super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      logger.audit('admin_settings_unauthorized', { 
        userId: user.id, 
        ip: clientIP, 
        success: false 
      })
      return NextResponse.json({ error: 'Unauthorized - super_admin required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    logger.debug('Saving settings', { keys: Object.keys(body) })

    // Build settings data
    const settingsData = {
      platform_name: body.platform_name || 'Homestay Booking',
      support_email: body.support_email || '',
      default_currency: body.default_currency || 'thb',
      default_timezone: body.default_timezone || 'gmt7',
      smtp_host: body.smtp_host || '',
      smtp_port: body.smtp_port || 587,
      from_email: body.from_email || '',
      from_name: body.from_name || '',
      promptpay_name: body.promptpay_name || '',
      promptpay_qr_url: body.promptpay_qr_url || '',
      platform_fee_percent: body.platform_fee_percent || 10,
      line_channel_access_token: body.line_channel_access_token || '',
      line_user_id: body.line_user_id || '',
      require_email_verification: body.require_email_verification ?? true,
      require_2fa_admin: body.require_2fa_admin ?? false,
      notify_new_tenant: body.notify_new_tenant ?? true,
      notify_daily_summary: body.notify_daily_summary ?? true,
      notify_errors: body.notify_errors ?? true,
    }

    // Check if any row exists
    const { data: existingData, error: selectError } = await supabase
      .from('platform_settings')
      .select('id')
      .limit(1)

    if (selectError) {
      logger.error('Error checking existing settings', selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      // Update existing row
      logger.debug('Updating existing settings row', { id: existingData[0].id })
      const { error: updateError } = await supabase
        .from('platform_settings')
        .update(settingsData)
        .eq('id', existingData[0].id)

      if (updateError) {
        logger.error('Settings update error', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Insert new row
      logger.debug('Inserting new settings row')
      const { error: insertError } = await supabase
        .from('platform_settings')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          ...settingsData
        })

      if (insertError) {
        logger.error('Settings insert error', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    logger.audit('admin_settings_updated', { 
      userId: user.id, 
      ip: clientIP, 
      success: true 
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Settings POST error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

