/**
 * Rate Limiting Utility
 * Uses in-memory LRU cache for simple rate limiting
 * For production at scale, consider Redis-based rate limiting
 */

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max number of unique tokens to track
}

interface TokenBucket {
  count: number
  resetTime: number
}

// Simple in-memory store (for single-server deployment)
// For multi-server deployment, use Redis or similar
const tokenStore = new Map<string, TokenBucket>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of tokenStore.entries()) {
    if (bucket.resetTime < now) {
      tokenStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute

export function rateLimit(options: RateLimitOptions) {
  return {
    /**
     * Check if a request should be rate limited
     * @param limit - Maximum number of requests per interval
     * @param token - Unique identifier (e.g., IP address, user ID)
     * @returns Object with success status and remaining requests
     */
    check: async (limit: number, token: string): Promise<{ success: boolean; remaining: number; reset: number }> => {
      const now = Date.now()
      const key = `${token}`
      
      let bucket = tokenStore.get(key)
      
      // If no bucket exists or it has expired, create a new one
      if (!bucket || bucket.resetTime < now) {
        bucket = {
          count: 0,
          resetTime: now + options.interval,
        }
        tokenStore.set(key, bucket)
        
        // Limit total entries to prevent memory bloat
        if (tokenStore.size > options.uniqueTokenPerInterval) {
          // Remove oldest entry
          const firstKey = tokenStore.keys().next().value
          if (firstKey) tokenStore.delete(firstKey)
        }
      }
      
      bucket.count += 1
      const remaining = Math.max(0, limit - bucket.count)
      
      return {
        success: bucket.count <= limit,
        remaining,
        reset: bucket.resetTime,
      }
    },
  }
}

// Pre-configured rate limiters for different use cases
export const authLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

export const uploadLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200,
})

/**
 * Helper to get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
}

/**
 * Helper to create rate limit response
 */
export function rateLimitResponse(reset: number) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    }
  )
}

