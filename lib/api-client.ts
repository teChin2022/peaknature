/**
 * API Client Utilities
 * Handles common patterns for API calls including rate limiting
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  retryAfter?: number // Seconds until rate limit resets
}

/**
 * Parse API response and handle rate limiting
 */
export async function parseApiResponse<T = unknown>(response: Response): Promise<ApiResponse<T>> {
  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const result = await response.json().catch(() => ({}))
    return {
      success: false,
      error: result.error || 'Too many requests. Please wait a moment and try again.',
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
    }
  }

  // Handle other errors
  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    return {
      success: false,
      error: result.error || `Request failed with status ${response.status}`,
    }
  }

  // Parse success response
  try {
    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch {
    return {
      success: true,
    }
  }
}

/**
 * Format rate limit error message with countdown
 */
export function formatRateLimitError(retryAfter: number): string {
  if (retryAfter <= 60) {
    return `Too many requests. Please try again in ${retryAfter} seconds.`
  }
  const minutes = Math.ceil(retryAfter / 60)
  return `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
}

/**
 * Wrapper for fetch with rate limit handling
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return parseApiResponse<T>(response)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
    }
  }
}

/**
 * POST request with automatic JSON serialization
 */
export async function apiPost<T = unknown, D = unknown>(
  url: string,
  data: D
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * GET request
 */
export async function apiGet<T = unknown>(
  url: string
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    method: 'GET',
  })
}

