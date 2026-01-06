import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 consent logs per minute per IP
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(5, `consent:${clientIP}`)
    if (!rateLimitOk) {
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()
    const headersList = await headers()
    
    // Get request body
    const body = await request.json()
    const { 
      consentStatus, 
      consentCategories,
      pageUrl,
      referrer,
      sessionId,
      privacyPolicyVersion 
    } = body

    if (!consentStatus || !['accepted', 'declined'].includes(consentStatus)) {
      return NextResponse.json({ error: 'Invalid consent status' }, { status: 400 })
    }

    // Get IP address from headers
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

    // Get user agent
    const userAgent = headersList.get('user-agent') || null

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client to bypass RLS for consent logging
    // This ensures consent is always logged regardless of auth state
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch {
      // Fall back to regular client if admin client not available
      adminClient = await createClient()
    }

    // Insert consent log
    const { data, error } = await adminClient
      .from('cookie_consent_logs')
      .insert({
        user_id: user?.id || null,
        session_id: sessionId || null,
        consent_status: consentStatus,
        consent_categories: consentCategories || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer || null,
        page_url: pageUrl || null,
        privacy_policy_version: privacyPolicyVersion || '1.0',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error logging consent:', error)
      // Don't fail the consent - just log the error
      return NextResponse.json({ 
        success: true, 
        logged: false,
        message: 'Consent recorded but logging failed',
        error: error.message
      })
    }

    return NextResponse.json({ 
      success: true, 
      logged: true,
      id: data.id 
    })

  } catch (error) {
    console.error('Consent logging error:', error)
    // Don't block the user experience
    return NextResponse.json({ 
      success: true, 
      logged: false,
      error: 'Failed to log consent' 
    })
  }
}

// GET endpoint to check if user has given consent (for server-side checks)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ hasConsent: false, status: null })
    }

    // Get the latest consent for this user
    const { data } = await supabase
      .from('cookie_consent_logs')
      .select('consent_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ 
      hasConsent: !!data, 
      status: data?.consent_status || null,
      consentedAt: data?.created_at || null
    })

  } catch {
    return NextResponse.json({ hasConsent: false, status: null })
  }
}

