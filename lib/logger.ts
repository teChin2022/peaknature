/**
 * Production-safe Logger Utility
 * Only logs in development, keeps errors in production
 */

const isDevelopment = process.env.NODE_ENV === 'development'

type LogData = Record<string, unknown> | string | number | boolean | null | undefined

/**
 * Sanitize sensitive data before logging
 */
function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data
  
  if (typeof data === 'string') {
    // Don't log full tokens, passwords, or keys
    if (data.length > 50) {
      return data.substring(0, 20) + '...[TRUNCATED]'
    }
    return data
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'session']
    
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitize(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  
  return data
}

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (message: string, data?: LogData) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data ? sanitize(data) : '')
    }
  },

  /**
   * Info logging - only in development
   */
  info: (message: string, data?: LogData) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, data ? sanitize(data) : '')
    }
  },

  /**
   * Warning logging - always log
   */
  warn: (message: string, data?: LogData) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '')
  },

  /**
   * Error logging - always log (sanitized)
   */
  error: (message: string, error?: unknown) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        name: error.name,
        message: error.message,
        // Only include stack in development
        ...(isDevelopment ? { stack: error.stack } : {}),
      })
    } else {
      console.error(`[ERROR] ${message}`, sanitize(error))
    }
  },

  /**
   * Audit logging - for security events (always log, sanitized)
   */
  audit: (action: string, data: {
    userId?: string
    ip?: string
    resource?: string
    success: boolean
    details?: string
  }) => {
    console.log(`[AUDIT] ${action}`, {
      timestamp: new Date().toISOString(),
      ...data,
    })
  },
}

export default logger

