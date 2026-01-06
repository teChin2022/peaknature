import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string
    const file = formData.get('file') as File

    if (!token || !file) {
      return NextResponse.json(
        { success: false, error: 'Token and file are required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for storage uploads
    const supabase = createAdminClient()

    // Get token data (this works for anon due to RLS policy)
    const { data: tokenData, error: tokenError } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_uploaded', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      console.error('Token error:', tokenError)
      return NextResponse.json({
        success: false,
        error: tokenError ? `Token error: ${tokenError.message}` : 'Invalid or expired token',
      })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Please upload an image file',
      })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Image must be less than 10MB',
      })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique filename
    const fileName = `payment-slips/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bookings')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: `Failed to upload image: ${uploadError.message}`,
      })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bookings')
      .getPublicUrl(uploadData.path)

    // Update token with slip URL
    const { error: updateError } = await supabase
      .from('upload_tokens')
      .update({
        slip_url: publicUrl,
        is_uploaded: true,
      })
      .eq('token', token)

    if (updateError) {
      console.error('Update token error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update upload status',
      })
    }

    return NextResponse.json({
      success: true,
      slipUrl: publicUrl,
      message: 'Upload successful! You can now close this page.',
    })

  } catch (error) {
    console.error('Mobile upload error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

