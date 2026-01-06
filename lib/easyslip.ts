/**
 * EasySlip API Integration
 * 
 * Verifies Thai bank payment slips using the EasySlip API
 * Documentation: https://developer.easyslip.com
 */

import { EasySlipVerifyResponse, EasySlipData } from '@/types/database'

const EASYSLIP_API_URL = 'https://developer.easyslip.com/api/v1/verify'

export interface VerifySlipOptions {
  /** Base64 encoded image or image URL */
  image: string
  /** EasySlip API key (Bearer token) */
  apiKey: string
  /** Expected amount to validate (optional) */
  expectedAmount?: number
  /** Tolerance for amount validation in THB (default: 1) */
  amountTolerance?: number
}

export interface VerifySlipResult {
  success: boolean
  verified: boolean
  data?: EasySlipData
  error?: {
    code: string
    message: string
  }
  validation?: {
    amountMatch: boolean
    expectedAmount?: number
    actualAmount?: number
  }
}

/**
 * Verify a payment slip using EasySlip API
 * 
 * @param options - Verification options including image and API key
 * @returns Verification result with slip data if valid
 */
export async function verifySlip(options: VerifySlipOptions): Promise<VerifySlipResult> {
  const { image, apiKey, expectedAmount, amountTolerance = 1 } = options

  try {
    // Prepare the request body
    // EasySlip accepts either base64 image or URL
    const isUrl = image.startsWith('http://') || image.startsWith('https://')
    const body = isUrl ? { url: image } : { data: image }

    // Create AbortController with 15 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(EASYSLIP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const result: EasySlipVerifyResponse = await response.json()

    // Check if API call was successful
    if (result.status !== 200 || !result.data) {
      return {
        success: false,
        verified: false,
        error: result.error || {
          code: 'API_ERROR',
          message: 'Failed to verify slip'
        }
      }
    }

    const slipData = result.data

    // Validate amount if expected amount is provided
    let amountMatch = true
    if (expectedAmount !== undefined) {
      const actualAmount = slipData.amount.amount
      amountMatch = Math.abs(actualAmount - expectedAmount) <= amountTolerance
    }

    return {
      success: true,
      verified: amountMatch,
      data: slipData,
      validation: expectedAmount !== undefined ? {
        amountMatch,
        expectedAmount,
        actualAmount: slipData.amount.amount
      } : undefined
    }

  } catch (error) {
    console.error('EasySlip verification error:', error)
    
    // Check if it was a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        verified: false,
        error: {
          code: 'TIMEOUT',
          message: 'Verification timed out. Please try again.'
        }
      }
    }
    
    return {
      success: false,
      verified: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }
}

/**
 * Check if EasySlip API is available
 * 
 * @param apiKey - EasySlip API key to test
 * @returns True if API is reachable
 */
export async function checkEasySlipStatus(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://developer.easyslip.com/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Extract key payment info from EasySlip data
 */
export function extractPaymentInfo(data: EasySlipData) {
  return {
    transactionRef: data.transRef,
    date: data.date,
    amount: data.amount.amount,
    currency: data.amount.local.currency,
    sender: {
      name: data.sender.account.name.th || data.sender.account.name.en,
      bank: data.sender.bank.name,
      bankShort: data.sender.bank.short
    },
    receiver: {
      name: data.receiver.account.name.th || data.receiver.account.name.en,
      displayName: data.receiver.displayName,
      bank: data.receiver.bank.name,
      bankShort: data.receiver.bank.short
    }
  }
}

/**
 * Error codes from EasySlip API
 */
export const EASYSLIP_ERROR_CODES = {
  INVALID_IMAGE: 'Invalid or unreadable image',
  NOT_A_SLIP: 'Image is not a payment slip',
  SLIP_EXPIRED: 'Payment slip has expired',
  DUPLICATE_SLIP: 'This slip has already been verified',
  RATE_LIMIT: 'API rate limit exceeded',
  INVALID_API_KEY: 'Invalid API key',
  INSUFFICIENT_CREDITS: 'Insufficient API credits',
  TIMEOUT: 'Verification timed out. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.'
} as const

/**
 * Get human-readable error message
 */
export function getEasySlipErrorMessage(code: string): string {
  return EASYSLIP_ERROR_CODES[code as keyof typeof EASYSLIP_ERROR_CODES] || 
    'An error occurred while verifying the slip'
}

