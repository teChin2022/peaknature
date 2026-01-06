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
  
  // Redirect to login page with cache-busting
  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  
  // Clear all Supabase auth cookies explicitly
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  
  // Clear any cookies that start with 'sb-'
  const cookieNames = ['sb-access-token', 'sb-refresh-token']
  cookieNames.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    })
  })
  
  return response
}

export async function GET(request: NextRequest) {
  return POST(request)
}

