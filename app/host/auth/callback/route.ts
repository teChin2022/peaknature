import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/host/login'
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error_param = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error_param) {
    console.error('Host auth callback error:', error_param, error_description)
    return NextResponse.redirect(
      new URL(`/host/login?error=${encodeURIComponent(error_description || error_param)}`, requestUrl.origin)
    )
  }

  const supabase = await createClient()

  // Handle email verification with token_hash first (PKCE email confirmation)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink',
    })

    if (verifyError) {
      console.error('Host email verification error:', verifyError)
      // For recovery type, redirect to forgot-password with error
      if (type === 'recovery') {
        return NextResponse.redirect(
          new URL(`/host/forgot-password?error=${encodeURIComponent('Password reset link has expired or is invalid. Please request a new one.')}`, requestUrl.origin)
        )
      }
      return NextResponse.redirect(
        new URL(`/host/login?error=${encodeURIComponent('Email verification failed. Please try again or request a new link.')}`, requestUrl.origin)
      )
    }

    // For recovery type, redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/host/reset-password', requestUrl.origin)
      )
    }

    // After verification, redirect to next or login
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Get user profile to find their tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'host' && profile?.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug, is_active')
          .eq('id', profile.tenant_id)
          .single()

        if (tenant?.is_active) {
          return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, requestUrl.origin))
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Verification succeeded but no session - redirect to login
    return NextResponse.redirect(
      new URL('/host/login?message=Email verified! Please login to continue.', requestUrl.origin)
    )
  }

  // Handle code exchange (OAuth or PKCE email flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Host code exchange error:', error)
      return NextResponse.redirect(
        new URL(`/host/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`, requestUrl.origin)
      )
    }

    // Get the session to check profile
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Get user profile to find their tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'host' && profile?.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug, is_active')
          .eq('id', profile.tenant_id)
          .single()

        if (tenant?.is_active) {
          return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, requestUrl.origin))
        }
      }
    }

    // Redirect to destination
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No valid parameters - redirect to login
  return NextResponse.redirect(
    new URL('/host/login?error=Invalid authentication link.', requestUrl.origin)
  )
}

