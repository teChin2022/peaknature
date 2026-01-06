import { CurrencyCode, CURRENCIES } from '@/types/database'

/**
 * Format a price with the appropriate currency symbol
 */
export function formatPrice(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const currency = CURRENCIES[currencyCode]
  
  // Format the number with locale-specific formatting
  const formattedNumber = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  
  // Return with symbol
  return `${currency.symbol}${formattedNumber}`
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(currencyCode: CurrencyCode = 'USD'): string {
  return CURRENCIES[currencyCode].symbol
}

/**
 * Get currency display name
 */
export function getCurrencyName(currencyCode: CurrencyCode = 'USD'): string {
  return CURRENCIES[currencyCode].name
}

