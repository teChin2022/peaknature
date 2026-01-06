import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, checkIn, checkOut } = body

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Query for overlapping locks by OTHER users
    const { data: lockData, error: lockError } = await supabase
      .from('reservation_locks')
      .select('id, user_id, check_in, check_out, expires_at')
      .eq('room_id', roomId)
      .gt('expires_at', new Date().toISOString())

    if (lockError) {
      return NextResponse.json({
        success: true,
        isLocked: false,
        lockedBy: null,
        expiresAt: null,
        secondsRemaining: null
      })
    }

    // Check for overlapping lock by another user
    const requestedCheckIn = new Date(checkIn)
    const requestedCheckOut = new Date(checkOut)

    const conflictingLock = lockData?.find(lock => {
      const lockCheckIn = new Date(lock.check_in)
      const lockCheckOut = new Date(lock.check_out)
      
      // Check if dates overlap
      const datesOverlap = lockCheckIn < requestedCheckOut && lockCheckOut > requestedCheckIn
      
      // Check if it's a different user (or current user is not logged in)
      const isDifferentUser = !user?.id || lock.user_id !== user.id

      return datesOverlap && isDifferentUser
    })

    if (conflictingLock) {
      const expiresAt = new Date(conflictingLock.expires_at)
      const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))

      return NextResponse.json({
        success: true,
        isLocked: true,
        lockedBy: conflictingLock.user_id,
        expiresAt: conflictingLock.expires_at,
        secondsRemaining
      })
    }

    return NextResponse.json({
      success: true,
      isLocked: false,
      lockedBy: null,
      expiresAt: null,
      secondsRemaining: null
    })

  } catch (error) {
    console.error('[check-lock] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
