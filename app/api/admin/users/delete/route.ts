import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 delete requests per minute per IP
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(10, `admin-delete-user:${clientIP}`)
    if (!rateLimitOk) {
      logger.warn('Rate limit exceeded for admin user deletion', { ip: clientIP })
      return rateLimitResponse(reset)
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Get current user and verify they are super_admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is super_admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'super_admin') {
      logger.warn('Non-admin attempted to delete user', { 
        userId: currentUser.id, 
        targetId: userId,
        ip: clientIP 
      })
      return NextResponse.json({ success: false, error: 'Only super admins can delete users' }, { status: 403 })
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    logger.audit('admin_user_delete_attempt', { 
      userId: currentUser.id, 
      ip: clientIP, 
      resource: userId,
      success: true
    })

    // Get the target user profile for logging
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, tenant_id')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete in order: bookings -> reviews -> reservation_locks -> date_waitlist -> profile
    // 1. Delete all bookings by this user
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', userId)

    if (bookingsError) {
      console.error('Error deleting bookings:', bookingsError)
    }

    // 2. Delete all reviews by this user
    const { error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', userId)

    if (reviewsError) {
      console.error('Error deleting reviews:', reviewsError)
    }

    // 3. Delete any reservation locks
    const { error: locksError } = await supabase
      .from('reservation_locks')
      .delete()
      .eq('user_id', userId)

    if (locksError) {
      console.error('Error deleting reservation locks:', locksError)
    }

    // 4. Delete from date_waitlist
    const { error: waitlistError } = await supabase
      .from('date_waitlist')
      .delete()
      .eq('user_id', userId)

    if (waitlistError) {
      console.error('Error deleting from waitlist:', waitlistError)
    }

    // 5. Delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete user profile: ' + profileError.message 
      }, { status: 500 })
    }

    // 6. Delete from auth.users using admin client
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      // Profile is already deleted, log error but continue
    }

    logger.audit('admin_user_delete_success', { 
      userId: currentUser.id, 
      ip: clientIP, 
      resource: userId,
      details: {
        deletedEmail: targetProfile.email,
        deletedName: targetProfile.full_name,
        deletedRole: targetProfile.role
      },
      success: true
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })

  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while deleting the user' 
    }, { status: 500 })
  }
}

