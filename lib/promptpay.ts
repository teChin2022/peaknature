/**
 * PromptPay QR Code Generator
 * 
 * Generates QR code payload for PromptPay payments in Thailand
 * Based on EMVCo QR Code Specification for Payment Systems
 */

// CRC16-CCITT calculation for checksum
function crc16(data: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
    crc &= 0xFFFF
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Format TLV (Tag-Length-Value)
function tlv(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${tag}${length}${value}`
}

// Format amount to 2 decimal places
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

// Sanitize PromptPay ID (phone or national ID)
function sanitizePromptPayId(id: string): string {
  // Remove all non-digits
  const digits = id.replace(/\D/g, '')
  
  // If it's a phone number starting with 0, convert to international format
  if (digits.length === 10 && digits.startsWith('0')) {
    return '66' + digits.substring(1) // Convert 08x to 668x
  }
  
  // If it's already in international format (66...)
  if (digits.length === 11 && digits.startsWith('66')) {
    return digits
  }
  
  // If it's a 13-digit national ID
  if (digits.length === 13) {
    return digits
  }
  
  return digits
}

// Get account type based on ID length
function getAccountType(id: string): string {
  const sanitized = sanitizePromptPayId(id)
  // Phone number (11 digits with country code)
  if (sanitized.length === 11) {
    return '01' // Mobile phone
  }
  // National ID (13 digits)
  if (sanitized.length === 13) {
    return '02' // National ID
  }
  // E-Wallet ID
  return '03'
}

export interface PromptPayQROptions {
  amount?: number        // Amount in THB (optional for static QR)
  oneTime?: boolean      // Is this a one-time payment QR?
}

/**
 * Generate PromptPay QR code payload string
 * 
 * @param promptPayId - Phone number (08x-xxx-xxxx or 66xxxxxxxxx) or National ID (13 digits)
 * @param options - Optional amount and one-time flag
 * @returns QR code payload string
 */
export function generatePromptPayPayload(
  promptPayId: string, 
  options: PromptPayQROptions = {}
): string {
  const { amount, oneTime = true } = options
  const sanitizedId = sanitizePromptPayId(promptPayId)
  const accountType = getAccountType(promptPayId)
  
  // Merchant Account Information (ID 29 for PromptPay)
  const aidPromptPay = tlv('00', 'A000000677010111') // PromptPay AID
  const mobileOrId = tlv(accountType, sanitizedId)
  const merchantAccount = tlv('29', aidPromptPay + mobileOrId)
  
  // Build payload
  let payload = ''
  
  // Payload Format Indicator (ID 00)
  payload += tlv('00', '01')
  
  // Point of Initiation Method (ID 01)
  // 11 = Static QR (reusable), 12 = Dynamic QR (one-time)
  payload += tlv('01', oneTime ? '12' : '11')
  
  // Merchant Account Information (ID 29)
  payload += merchantAccount
  
  // Transaction Currency (ID 53) - THB = 764
  payload += tlv('53', '764')
  
  // Transaction Amount (ID 54) - optional
  if (amount && amount > 0) {
    payload += tlv('54', formatAmount(amount))
  }
  
  // Country Code (ID 58)
  payload += tlv('58', 'TH')
  
  // CRC (ID 63) - must be last
  // Add CRC placeholder for calculation
  const payloadForCrc = payload + '6304'
  const checksum = crc16(payloadForCrc)
  payload += tlv('63', checksum)
  
  return payload
}

/**
 * Validate PromptPay ID format
 * 
 * @param id - Phone number or National ID
 * @returns Object with isValid flag and sanitized ID
 */
export function validatePromptPayId(id: string): { 
  isValid: boolean
  sanitizedId: string
  type: 'phone' | 'national_id' | 'unknown'
  displayFormat: string
} {
  const sanitized = sanitizePromptPayId(id)
  
  // Phone number (11 digits starting with 66)
  if (sanitized.length === 11 && sanitized.startsWith('66')) {
    const localNumber = '0' + sanitized.substring(2)
    return {
      isValid: true,
      sanitizedId: sanitized,
      type: 'phone',
      displayFormat: localNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
  }
  
  // 10-digit phone starting with 0
  if (sanitized.length === 10 && sanitized.startsWith('0')) {
    return {
      isValid: true,
      sanitizedId: '66' + sanitized.substring(1),
      type: 'phone',
      displayFormat: sanitized.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
  }
  
  // National ID (13 digits)
  if (sanitized.length === 13) {
    return {
      isValid: true,
      sanitizedId: sanitized,
      type: 'national_id',
      displayFormat: sanitized.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')
    }
  }
  
  return {
    isValid: false,
    sanitizedId: sanitized,
    type: 'unknown',
    displayFormat: id
  }
}

/**
 * Format amount in Thai Baht
 */
export function formatThaiAmount(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

