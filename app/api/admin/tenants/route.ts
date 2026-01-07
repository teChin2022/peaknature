import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route for admin tenant management
 * Uses server-side Supabase client with proper auth checking
 * 
 * PATCH /api/admin/tenants - Update tenant (approve/deactivate)
 * DELETE /api/admin/tenants - Delete tenant
 */

// Helper function to verify super_admin role
async function verifySuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { authorized: false, error: 'Profile not found' }
  }

  if (profile.role !== 'super_admin') {
    return { authorized: false, error: 'Access denied. Super admin required.' }
  }

  return { authorized: true, userId: user.id }
}

// PATCH - Update tenant (approve, deactivate, update details)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const authCheck = await verifySuperAdmin(supabase)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tenantId, updates } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      )
    }

    // Whitelist allowed fields to update
    const allowedFields = ['is_active', 'name', 'slug', 'primary_color', 'plan']
    const sanitizedUpdates: Record<string, unknown> = {}
    
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key]
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Perform the update using service role through RPC
    // First verify the tenant exists
    const { data: existingTenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name, is_active')
      .eq('id', tenantId)
      .single()

    if (fetchError || !existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Use an RPC function to bypass RLS for the update
    const { data: updatedTenant, error: updateError } = await supabase.rpc('admin_update_tenant', {
      p_tenant_id: tenantId,
      p_updates: sanitizedUpdates
    })

    if (updateError) {
      console.error('Tenant update error:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
      message: sanitizedUpdates.is_active !== undefined 
        ? (sanitizedUpdates.is_active ? 'Tenant approved successfully' : 'Tenant deactivated successfully')
        : 'Tenant updated successfully'
    })

  } catch (error) {
    console.error('Error in tenant PATCH:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify super_admin role
    const authCheck = await verifySuperAdmin(supabase)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Use RPC function to delete tenant (bypasses RLS)
    const { error: deleteError } = await supabase.rpc('admin_delete_tenant', {
      p_tenant_id: tenantId
    })

    if (deleteError) {
      console.error('Tenant delete error:', deleteError)
      
      // Check for foreign key constraint error
      if (deleteError.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Cannot delete tenant: There are bookings or other data associated with this tenant.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    })

  } catch (error) {
    console.error('Error in tenant DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

