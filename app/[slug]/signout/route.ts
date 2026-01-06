import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Sign out from Supabase
  await supabase.auth.signOut()
  
  // Redirect to tenant's landing page after sign out
  const response = NextResponse.redirect(new URL(`/${slug}`, request.url))
  
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

// Support GET method as well (for direct navigation)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return POST(request, context)
}

