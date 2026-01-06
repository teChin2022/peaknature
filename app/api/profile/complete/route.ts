import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { phone, province, district, sub_district } = body
    
    // Validate required fields
    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }
    
    if (!province) {
      return NextResponse.json(
        { error: 'Province is required' },
        { status: 400 }
      )
    }
    
    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: phone.trim(),
        province,
        district: district || null,
        sub_district: sub_district || null,
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile complete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

