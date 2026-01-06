import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get token status
    const { data: tokenData, error: tokenError } = await supabase
      .from('upload_tokens')
      .select('is_uploaded, slip_url, expires_at')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        success: false,
        error: 'Token not found or expired',
        expired: true,
      })
    }

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expired',
        expired: true,
      })
    }

    return NextResponse.json({
      success: true,
      isUploaded: tokenData.is_uploaded,
      slipUrl: tokenData.slip_url,
      expired: false,
    })

  } catch (error) {
    console.error('Check status error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

