/**
 * Audit Logging Utility
 * Client-side helper to log admin and security events
 */

export type AuditCategory = 'admin' | 'security' | 'user' | 'system'
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AuditLogParams {
  action: string
  category: AuditCategory
  severity?: AuditSeverity
  targetType?: string
  targetId?: string
  targetName?: string
  tenantId?: string
  details?: Record<string, unknown>
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  success?: boolean
  errorMessage?: string
}

/**
 * Log an audit event to the database
 * Fire-and-forget - doesn't block the UI
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Don't await - fire and forget
    fetch('/api/admin/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }).catch(err => {
      // Log to console as fallback
      console.error('[Audit] Failed to log:', params.action, err)
    })
  } catch {
    // Silently fail - audit logging should never break the app
    console.error('[Audit] Failed to log:', params.action)
  }
}

/**
 * Pre-defined audit actions for consistency
 */
export const AuditActions = {
  // Admin - Tenant Management
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',
  TENANT_ACTIVATE: 'tenant.activate',
  TENANT_DEACTIVATE: 'tenant.deactivate',
  TENANT_PLAN_CHANGE: 'tenant.plan_change',
  
  // Admin - User Management
  USER_BLOCK: 'user.block',
  USER_UNBLOCK: 'user.unblock',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  
  // Admin - Subscription
  SUBSCRIPTION_APPROVE: 'subscription.approve',
  SUBSCRIPTION_REJECT: 'subscription.reject',
  
  // Admin - Settings
  SETTINGS_UPDATE: 'settings.update',
  
  // Security Events
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGE: 'auth.password_change',
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  
  // Booking Events
  BOOKING_CREATE: 'booking.create',
  BOOKING_CANCEL: 'booking.cancel',
  BOOKING_COMPLETE: 'booking.complete',
  
  // Payment Events
  PAYMENT_VERIFY: 'payment.verify',
  PAYMENT_FAILED: 'payment.failed',
} as const

/**
 * Helper to log admin actions
 */
export function logAdminAction(
  action: string,
  target: { type: string; id?: string; name?: string },
  options?: {
    tenantId?: string
    details?: Record<string, unknown>
    oldValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    success?: boolean
    errorMessage?: string
  }
) {
  return logAudit({
    action,
    category: 'admin',
    severity: options?.success === false ? 'error' : 'info',
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    tenantId: options?.tenantId,
    details: options?.details,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    success: options?.success ?? true,
    errorMessage: options?.errorMessage,
  })
}

/**
 * Helper to log security events
 */
export function logSecurityEvent(
  action: string,
  severity: AuditSeverity = 'warning',
  details?: Record<string, unknown>
) {
  return logAudit({
    action,
    category: 'security',
    severity,
    details,
  })
}

/**
 * Helper to log booking events
 */
export function logBookingEvent(
  action: string,
  booking: { id: string; roomName?: string },
  options?: {
    tenantId?: string
    userId?: string
    details?: Record<string, unknown>
    success?: boolean
    errorMessage?: string
  }
) {
  return logAudit({
    action,
    category: 'user',
    severity: options?.success === false ? 'error' : 'info',
    targetType: 'booking',
    targetId: booking.id,
    targetName: booking.roomName,
    tenantId: options?.tenantId,
    details: { userId: options?.userId, ...options?.details },
    success: options?.success ?? true,
    errorMessage: options?.errorMessage,
  })
}

/**
 * Helper to log payment events
 */
export function logPaymentEvent(
  action: string,
  payment: { bookingId: string; amount?: number },
  options?: {
    tenantId?: string
    userId?: string
    success?: boolean
    errorMessage?: string
    details?: Record<string, unknown>
  }
) {
  return logAudit({
    action,
    category: 'user',
    severity: options?.success === false ? 'error' : 'info',
    targetType: 'payment',
    targetId: payment.bookingId,
    tenantId: options?.tenantId,
    details: { amount: payment.amount, userId: options?.userId, ...options?.details },
    success: options?.success ?? true,
    errorMessage: options?.errorMessage,
  })
}

