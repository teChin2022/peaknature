import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { differenceInHours, parseISO, format } from 'date-fns'
import { sendLineMessage, sendEmail } from '@/lib/notifications'
import { formatPrice } from '@/lib/currency'
import { TenantSettings, defaultTenantSettings } from '@/types/database'
import { apiLimiter, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import logger from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 cancellations per minute per IP
    const clientIP = getClientIP(request.headers)
    const { success: rateLimitOk, reset } = await apiLimiter.check(5, `cancel:${clientIP}`)
    if (!rateLimitOk) {
      logger.warn('Rate limit exceeded for booking cancellation', { ip: clientIP })
      return rateLimitResponse(reset)
    }

    const { bookingId, reason } = await request.json()
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing booking ID' }, { status: 400 })
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: 'Cancellation reason is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    logger.audit('booking_cancel_attempt', { 
      userId: user.id, 
      ip: clientIP, 
      resource: bookingId, 
      success: true 
    })

    // Get booking with room and guest details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`*, room:rooms(*), guest:profiles(*)`)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Already cancelled' })
    }
    if (booking.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Cannot cancel completed booking' })
    }

    // 24-hour rule: Can only cancel within 24 hours AFTER booking was created
    const bookingCreatedAt = parseISO(booking.created_at)
    const hoursSinceBooking = differenceInHours(new Date(), bookingCreatedAt)
    
    if (hoursSinceBooking > 24) {
      return NextResponse.json({
        success: false,
        error: 'Cancellation period has expired. Please contact the property.'
      })
    }

    // Cancel booking
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to cancel' })
    }

    // Log booking cancellation to audit log
    try {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        action: 'booking.cancel',
        category: 'user',
        severity: 'info',
        actor_id: user.id,
        actor_email: user.email,
        actor_role: 'guest',
        actor_ip: clientIP,
        target_type: 'booking',
        target_id: bookingId,
        target_name: booking.room?.name || 'Room',
        tenant_id: booking.tenant_id,
        details: { 
          reason, 
          checkIn: booking.check_in, 
          checkOut: booking.check_out,
          totalPrice: booking.total_price
        },
        success: true
      })
    } catch (auditError) {
      logger.error('Failed to log booking cancellation', auditError)
    }

    // Release any reservation lock for these dates
    try {
      await supabase
        .from('reservation_locks')
        .delete()
        .eq('room_id', booking.room_id)
        .eq('user_id', user.id)
        .eq('check_in', booking.check_in)
        .eq('check_out', booking.check_out)
    } catch {
      // Ignore lock release errors - lock may not exist
    }

    // Get tenant settings for notifications
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', booking.tenant_id)
      .single()

    if (tenant) {
      const settings: TenantSettings = { ...defaultTenantSettings, ...(tenant.settings || {}) }
      const currency = settings.currency || 'USD'
      
      // Prepare notification content
      const guestName = booking.guest?.full_name || 'Guest'
      const guestEmail = booking.guest?.email || 'N/A'
      const guestPhone = booking.guest?.phone || 'N/A'
      const roomName = booking.room?.name || 'Room'
      const checkIn = format(parseISO(booking.check_in), 'MMM d, yyyy')
      const checkOut = format(parseISO(booking.check_out), 'MMM d, yyyy')
      const refundAmount = formatPrice(booking.total_price, currency)
      const bookingRef = bookingId.slice(0, 8).toUpperCase()

      const lineMessage = `🚫 BOOKING CANCELLED

Ref: ${bookingRef}
Room: ${roomName}
Guest: ${guestName}
Dates: ${checkIn} - ${checkOut}

📝 Reason: ${reason}

💰 REFUND REQUIRED: ${refundAmount}

Guest Contact:
📧 ${guestEmail}
📱 ${guestPhone}

Please process the refund.`

      const emailHtml = `
        <h2 style="color: #dc2626;">🚫 Booking Cancelled</h2>
        <p>A guest has cancelled their booking. Please process the refund.</p>
        
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${bookingRef}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Room</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${roomName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Guest</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${guestName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Dates</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${checkIn} - ${checkOut}</td></tr>
          <tr style="background: #fef2f2;"><td style="padding: 8px; border: 1px solid #ddd;"><strong>Refund Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd; color: #dc2626; font-weight: bold;">${refundAmount}</td></tr>
        </table>
        
        <h3>📝 Cancellation Reason</h3>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; border-left: 4px solid #dc2626;">${reason}</p>
        
        <h3>Guest Contact Information</h3>
        <p>📧 Email: ${guestEmail}<br>📱 Phone: ${guestPhone}</p>
      `

      // Send LINE notification
      if (settings.payment?.line_channel_access_token && settings.payment?.line_user_id) {
        try {
          await sendLineMessage({
            channelAccessToken: settings.payment.line_channel_access_token,
            userId: settings.payment.line_user_id,
            message: lineMessage
          })
        } catch (e) { console.error('LINE notification error:', e) }
      }

      // Send email notification
      if (settings.contact?.email) {
        try {
          await sendEmail({
            to: settings.contact.email,
            subject: `🚫 Booking Cancelled - ${bookingRef} - Refund Required`,
            html: emailHtml
          })
        } catch (e) { console.error('Email notification error:', e) }
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

