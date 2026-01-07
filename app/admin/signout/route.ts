import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get user before signing out for audit logging
  const { data: { user } } = await supabase.auth.getUser()
  
  // Log the sign out
  if (user) {
    try {
      const adminClient = createAdminClient()
      const clientIP = getClientIP(request.headers)
      const userAgent = request.headers.get('user-agent')
      
      await adminClient.from('audit_logs').insert({
        action: 'auth.logout',
        category: 'security',
        severity: 'info',
        actor_id: user.id,
        actor_email: user.email,
        actor_role: 'super_admin',
        actor_ip: clientIP,
        actor_user_agent: userAgent,
        success: true
      })
    } catch (error) {
      console.error('Failed to log sign out:', error)
    }
  }
  
  // Sign out from Supabase - this will clear the session cookies
  await supabase.auth.signOut()
  
  // Redirect to login page - use request.url to get the correct domain
  // Use 303 See Other to ensure the browser uses GET for the redirect (POST-Redirect-GET pattern)
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303)
  
  // Determine if we're on HTTPS (production)
  const isSecure = request.url.startsWith('https')
  
  // Get the Supabase project ref from env for cookie names
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || ''
  
  // Cookie names to clear (both old and new format)
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token.0`,
    `sb-${projectRef}-auth-token.1`,
  ]
  
  // Clear all auth cookies
  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
      secure: isSecure,
      sameSite: 'lax',
      httpOnly: true,
    })
  })
  
  return response
}

export async function GET(request: NextRequest) {
  return POST(request)
}

