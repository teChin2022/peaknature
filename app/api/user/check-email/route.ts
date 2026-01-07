import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    // Check auth.users directly via admin API
    // Note: For large user bases, consider using a database function instead
    const { data: authData, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust based on expected user count
    })

    if (error) {
      console.error('Error checking email:', error)
      return NextResponse.json(
        { error: 'Failed to check email' },
        { status: 500 }
      )
    }

    const existingUser = authData?.users?.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    )

    return NextResponse.json({
      exists: !!existingUser,
    })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
