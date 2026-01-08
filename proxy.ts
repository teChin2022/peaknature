import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Simple in-memory cache for tenant validation
 * This reduces DB calls for repeated requests to the same tenant
 * Cache TTL: 60 seconds (short enough for changes to propagate)
 */
const tenantCache = new Map<string, { data: { id: string; is_active: boolean } | null; expiry: number }>()
const TENANT_CACHE_TTL = 60 * 1000 // 60 seconds

function getCachedTenant(slug: string) {
  const cached = tenantCache.get(slug)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  tenantCache.delete(slug)
  return undefined // undefined means not cached, null means cached as "not found"
}

function setCachedTenant(slug: string, data: { id: string; is_active: boolean } | null) {
  // Limit cache size to prevent memory bloat
  if (tenantCache.size > 100) {
    // Remove oldest entries
    const oldest = tenantCache.keys().next().value
    if (oldest) tenantCache.delete(oldest)
  }
  tenantCache.set(slug, { data, expiry: Date.now() + TENANT_CACHE_TTL })
}

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/my-bookings', '/booking']

// Performance timing helper (only logs in development)
function logTiming(label: string, start: number) {
  if (process.env.NODE_ENV === 'development') {
    const duration = Math.round(performance.now() - start)
    const emoji = duration > 500 ? '🐌' : duration > 200 ? '⚠️' : '⚡'
    console.log(`[Proxy] ${emoji} ${label}: ${duration}ms`)
  }
}

export async function proxy(request: NextRequest) {
  const totalStart = performance.now()
  const pathname = request.nextUrl.pathname
  
  // Quick bypass for static assets (no DB calls needed)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Session update with timing
  const sessionStart = performance.now()
  const { supabaseResponse, user, supabase } = await updateSession(request)
  logTiming('Session update', sessionStart)
  
  // If Supabase is not configured, skip all auth-related middleware
  if (!supabase) {
    return supabaseResponse
  }
  
  // Check if this is a host route
  if (pathname.startsWith('/host')) {
    // Allow access to public host pages without auth
    const publicHostRoutes = [
      '/host/login', 
      '/host/register', 
      '/host/auth/callback',
      '/host/forgot-password',
      '/host/reset-password'
    ]
    if (publicHostRoutes.some(route => pathname.startsWith(route))) {
      logTiming('Total proxy (host public)', totalStart)
      return supabaseResponse
    }
    
    // Other host routes require auth (if any in the future)
    if (!user) {
      const redirectUrl = new URL('/host/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    logTiming('Total proxy (host auth)', totalStart)
    return supabaseResponse
  }

  // Check if this is an admin route
  if (pathname.startsWith('/admin')) {
    // Allow access to login page without auth
    if (pathname === '/admin/login') {
      logTiming('Total proxy (admin login)', totalStart)
      return supabaseResponse
    }
    
    if (!user) {
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check if user is super admin
    const profileStart = performance.now()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    logTiming('Admin profile check', profileStart)
    
    // Profile not found - user was deleted, sign them out
    if (profileError?.code === 'PGRST116' || !profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Only super admins can access /admin/* routes
    if (profile.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    logTiming('Total proxy (admin)', totalStart)
    return supabaseResponse
  }
  
  // Extract tenant slug from the path (e.g., /viewmog/rooms -> viewmog)
  const pathParts = pathname.split('/').filter(Boolean)
  const potentialSlug = pathParts[0]
  
  // Skip for system routes that are not tenant slugs
  if (!potentialSlug || ['login', 'register', 'admin', 'host', 'upload', 'privacy', 'terms'].includes(potentialSlug)) {
    logTiming('Total proxy (system route)', totalStart)
    return supabaseResponse
  }
  
  // Check if this is a tenant route - first try cache
  let tenant = getCachedTenant(potentialSlug)
  
  if (tenant === undefined) {
    // Cache miss - fetch from DB
    const tenantStart = performance.now()
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id, is_active')
      .eq('slug', potentialSlug)
      .single()
    logTiming('Tenant lookup (cache miss)', tenantStart)
    
    // If there's a database error (not just "not found"), let the page handle it
    if (tenantError && tenantError.code !== 'PGRST116') {
      console.error('Proxy tenant lookup error:', tenantError)
      return supabaseResponse
    }
    
    tenant = tenantData
    setCachedTenant(potentialSlug, tenant)
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] ⚡ Tenant cache hit: ${potentialSlug}`)
  }
  
  if (!tenant) {
    // Tenant doesn't exist, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  if (!tenant.is_active) {
    // Tenant is inactive
    return NextResponse.redirect(new URL('/?error=tenant_inactive', request.url))
  }
  
  // Check protected routes within tenant
  const tenantPath = '/' + pathParts.slice(1).join('/')
  const isProtectedRoute = protectedRoutes.some(route => tenantPath.startsWith(route))
  
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL(`/${potentialSlug}/login`, request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Check if user is blocked or deleted (for protected routes)
  if (isProtectedRoute && user) {
    const profileStart = performance.now()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_blocked, tenant_id')
      .eq('id', user.id)
      .single()
    logTiming('User profile check', profileStart)
    
    // Profile not found - user was deleted, sign them out
    if (profileError?.code === 'PGRST116' || !profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(`/${potentialSlug}/login?error=account_deleted`, request.url))
    }
    
    if (profile.is_blocked) {
      // User is blocked, sign them out and redirect
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(`/${potentialSlug}/login?error=blocked`, request.url))
    }
    
    // Ensure user belongs to this tenant (except for hosts who own the tenant)
    if (profile.tenant_id && profile.tenant_id !== tenant.id) {
      return NextResponse.redirect(new URL(`/${potentialSlug}?error=wrong_tenant`, request.url))
    }
  }
  
  logTiming('Total proxy', totalStart)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
