import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 delete requests per minute per IP (very restrictive)
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(3, `delete-user:${clientIP}`)
    if (!rateLimitOk) {
      logger.warn('Rate limit exceeded for user deletion', { ip: clientIP })
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { userId, tenantId, isHostAction } = await request.json()

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    logger.audit('user_delete_attempt', { 
      userId: currentUser.id, 
      ip: clientIP, 
      resource: userId || currentUser.id, 
      success: true,
      details: isHostAction ? 'host_action' : 'self_delete'
    })

    let targetUserId = userId

    // If self-deletion (guest deleting own account)
    if (!isHostAction) {
      targetUserId = currentUser.id
    } else {
      // Host trying to delete a guest - verify host permission
      if (!tenantId) {
        return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 })
      }

      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
      }

      // Check if current user is the host of this tenant
      // Host is identified by: role = 'host' AND tenant_id matches
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('id, role, tenant_id')
        .eq('id', currentUser.id)
        .single()

      if (!hostProfile || hostProfile.role !== 'host' || hostProfile.tenant_id !== tenantId) {
        return NextResponse.json({ success: false, error: 'Not authorized to delete this user' }, { status: 403 })
      }

      // Verify the target user belongs to this tenant and is a guest
      // Use RPC function to bypass RLS restrictions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: targetProfile, error: targetError } = await (supabase.rpc as any)('get_profile_for_deletion', {
        p_user_id: targetUserId,
        p_tenant_id: tenantId
      })

      // If RPC doesn't exist, fall back to direct query
      if (targetError && targetError.code === 'PGRST202') {
        // RPC function doesn't exist, try direct query
        const { data: directProfile } = await supabase
          .from('profiles')
          .select('tenant_id, role')
          .eq('id', targetUserId)
          .single()
        
        if (!directProfile) {
          return NextResponse.json({ success: false, error: 'User not found or not accessible' }, { status: 400 })
        }
        
        if (directProfile.tenant_id !== tenantId) {
          return NextResponse.json({ success: false, error: 'User does not belong to this tenant' }, { status: 400 })
        }

        if (directProfile.role === 'host' || directProfile.role === 'super_admin') {
          return NextResponse.json({ success: false, error: 'Cannot delete host or admin accounts' }, { status: 400 })
        }
      } else if (targetError) {
        console.error('Error fetching target profile:', targetError)
        return NextResponse.json({ success: false, error: 'Failed to verify user' }, { status: 500 })
      } else if (!targetProfile) {
        return NextResponse.json({ success: false, error: 'User not found in this tenant' }, { status: 400 })
      } else if (targetProfile.role === 'host' || targetProfile.role === 'super_admin') {
        return NextResponse.json({ success: false, error: 'Cannot delete host or admin accounts' }, { status: 400 })
      }
    }

    // For host actions, use the RPC function that bypasses RLS
    if (isHostAction) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deleteResult, error: deleteError } = await (supabase.rpc as any)('delete_tenant_guest', {
        p_user_id: targetUserId,
        p_tenant_id: tenantId,
        p_host_id: currentUser.id
      })

      if (deleteError) {
        console.error('Error deleting guest via RPC:', deleteError)
        
        // If RPC doesn't exist, fall back to direct deletion
        if (deleteError.code === 'PGRST202') {
          // RPC function doesn't exist, try direct deletion
          console.log('RPC not found, falling back to direct deletion')
        } else {
          return NextResponse.json({ 
            success: false, 
            error: deleteError.message || 'Failed to delete user' 
          }, { status: 500 })
        }
      } else {
        // Also delete from auth.users using admin client
        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(targetUserId)
        
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError)
          // Profile is already deleted, but auth user remains - still return success
          // but log for debugging
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'User account deleted successfully' 
        })
      }
    } else {
      // For self-deletion, try RPC first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: selfDeleteResult, error: selfDeleteError } = await (supabase.rpc as any)('delete_own_account', {
        p_user_id: targetUserId
      })

      if (selfDeleteError) {
        console.error('Error self-deleting via RPC:', selfDeleteError)
        
        // If RPC doesn't exist, fall back to direct deletion
        if (selfDeleteError.code === 'PGRST202') {
          console.log('Self-delete RPC not found, falling back to direct deletion')
        } else {
          return NextResponse.json({ 
            success: false, 
            error: selfDeleteError.message || 'Failed to delete account' 
          }, { status: 500 })
        }
      } else {
        // Also delete from auth.users using admin client
        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(targetUserId)
        
        if (authDeleteError) {
          console.error('Error deleting auth user (self):', authDeleteError)
        }
        
        // Sign out after successful deletion
        await supabase.auth.signOut()
        return NextResponse.json({ 
          success: true, 
          message: 'Account deleted successfully' 
        })
      }
    }

    // Fallback: use direct queries (only reached if RPC doesn't exist)
    // Get the profile for the target user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, tenant_id')
      .eq('id', targetUserId)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete in order: bookings -> reviews -> profile
    // 1. Delete all bookings by this user
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', targetUserId)

    if (bookingsError) {
      console.error('Error deleting bookings:', bookingsError)
    }

    // 2. Delete all reviews by this user
    const { error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', targetUserId)

    if (reviewsError) {
      console.error('Error deleting reviews:', reviewsError)
    }

    // 3. Delete any reservation locks
    const { error: locksError } = await supabase
      .from('reservation_locks')
      .delete()
      .eq('user_id', targetUserId)

    if (locksError) {
      console.error('Error deleting reservation locks:', locksError)
    }

    // 4. Delete from date_waitlist
    const { error: waitlistError } = await supabase
      .from('date_waitlist')
      .delete()
      .eq('user_id', targetUserId)

    if (waitlistError) {
      console.error('Error deleting from waitlist:', waitlistError)
    }

    // 5. Delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUserId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete user profile: ' + profileError.message 
      }, { status: 500 })
    }

    // 6. Delete from auth.users using admin client
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(targetUserId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user (fallback):', authDeleteError)
      // Profile is already deleted, log error but continue
    }

    // If self-deletion, sign out the user
    if (!isHostAction) {
      await supabase.auth.signOut()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account deleted successfully' 
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while deleting the account' 
    }, { status: 500 })
  }
}

