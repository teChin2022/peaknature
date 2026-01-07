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
  /** Check for duplicate slip in EasySlip's system (default: true) */
  checkDuplicate?: boolean
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
  const { image, apiKey, expectedAmount, amountTolerance = 1, checkDuplicate = true } = options

  try {
    // Prepare the request body based on EasySlip API documentation
    // For URL: { "url": "..." }
    // For Base64: { "image": "..." }
    const isUrl = image.startsWith('http://') || image.startsWith('https://')
    const body = isUrl 
      ? { url: image, checkDuplicate } 
      : { image: image, checkDuplicate }
    
    console.log('[easyslip] Sending verification request:', {
      type: isUrl ? 'url' : 'base64',
      checkDuplicate,
      imageLength: isUrl ? image.length : `${image.substring(0, 50)}...`
    })

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
    
    console.log('[easyslip] API Response:', {
      httpStatus: response.status,
      resultStatus: result.status,
      hasData: !!result.data,
      message: result.message,
      errorCode: result.error?.code
    })

    // Check if API call was successful
    if (result.status !== 200 || !result.data) {
      // Handle specific error messages from EasySlip
      const errorCode = result.message || result.error?.code || 'API_ERROR'
      const errorMessage = getEasySlipErrorMessage(errorCode) || result.error?.message || 'Failed to verify slip'
      
      console.log('[easyslip] ❌ Verification failed:', { errorCode, errorMessage })
      
      return {
        success: false,
        verified: false,
        error: {
          code: errorCode,
          message: errorMessage
        },
        // Include data if available (e.g., for duplicate_slip response)
        data: result.data
      }
    }

    const slipData = result.data

    // Validate amount if expected amount is provided
    let amountMatch = true
    if (expectedAmount !== undefined) {
      const actualAmount = slipData.amount.amount
      amountMatch = Math.abs(actualAmount - expectedAmount) <= amountTolerance
    }

    console.log('[easyslip] ✅ Verification successful:', {
      transRef: slipData.transRef,
      amount: slipData.amount.amount,
      expectedAmount,
      amountMatch,
      senderBank: slipData.sender?.bank?.short,
      receiverBank: slipData.receiver?.bank?.short
    })

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
 * Error codes from EasySlip API (based on official documentation)
 * See: https://document.easyslip.com/documents/verify/bank/base64
 */
export const EASYSLIP_ERROR_CODES = {
  // HTTP 400 errors
  invalid_payload: 'Invalid request payload',
  invalid_check_duplicate: 'Invalid checkDuplicate parameter',
  duplicate_slip: 'This slip has already been verified in EasySlip system',
  invalid_image: 'Invalid or unreadable image file',
  image_size_too_large: 'Image file size is too large',
  
  // HTTP 401 errors
  unauthorized: 'Invalid or missing API access token',
  
  // HTTP 403 errors
  access_denied: 'Account does not have API access',
  account_not_verified: 'Account has not completed KYC verification',
  application_expired: 'Application subscription has expired',
  application_deactivated: 'Application has been deactivated',
  quota_exceeded: 'API quota has been exceeded',
  
  // HTTP 404 errors
  slip_not_found: 'Slip data not found in Bank of Thailand system (may be fake)',
  qrcode_not_found: 'QR code not found or invalid',
  
  // HTTP 500 errors
  server_error: 'EasySlip server error. Please try again later.',
  api_server_error: 'EasySlip API server error. Please try again later.',
  
  // Client-side errors
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

