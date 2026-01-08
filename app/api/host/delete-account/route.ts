import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/host/delete-account
 * 
 * Deletes a host's account along with their tenant and all related data.
 * This is a destructive operation that cannot be undone.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the user is a host
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'host') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is for hosts only' },
        { status: 403 }
      )
    }

    if (!profile.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'No tenant associated with this account' },
        { status: 400 }
      )
    }

    const tenantId = profile.tenant_id

    // Delete in order to respect foreign key constraints:
    // 1. Delete all bookings for rooms in this tenant
    const { error: bookingsError } = await adminClient
      .from('bookings')
      .delete()
      .eq('tenant_id', tenantId)

    if (bookingsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete bookings' },
        { status: 500 }
      )
    }

    // 2. Delete room availability for all rooms in this tenant
    const { data: rooms } = await adminClient
      .from('rooms')
      .select('id')
      .eq('tenant_id', tenantId)

    if (rooms && rooms.length > 0) {
      const roomIds = rooms.map(r => r.id)
      
      await adminClient
        .from('room_availability')
        .delete()
        .in('room_id', roomIds)
    }

    // 3. Delete all rooms for this tenant
    await adminClient
      .from('rooms')
      .delete()
      .eq('tenant_id', tenantId)

    // 4. Delete subscription payments for this tenant
    await adminClient
      .from('subscription_payments')
      .delete()
      .eq('tenant_id', tenantId)

    // 5. Delete notification queue for this tenant
    await adminClient
      .from('notification_queue')
      .delete()
      .eq('tenant_id', tenantId)

    // 6. Delete upload tokens for this tenant
    await adminClient
      .from('upload_tokens')
      .delete()
      .eq('tenant_id', tenantId)

    // 7. Delete verified slips for this tenant
    await adminClient
      .from('verified_slips')
      .delete()
      .eq('tenant_id', tenantId)

    // 8. Delete all guest profiles for this tenant (not the host)
    await adminClient
      .from('profiles')
      .delete()
      .eq('tenant_id', tenantId)
      .neq('id', user.id)

    // 9. Delete the host's profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    // 10. Delete the tenant
    const { error: tenantError } = await adminClient
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (tenantError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete tenant' },
        { status: 500 }
      )
    }

    // 11. Delete the auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authError) {
      // Profile and tenant are already deleted, log but continue
    }

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Account and property deleted successfully'
    })

  } catch {
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

