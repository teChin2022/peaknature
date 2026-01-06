import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Redirect host to host login page after sign out
  return NextResponse.redirect(new URL('/host/login', request.url))
}

