'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/currency'

interface PromptPayQRCodeProps {
  qrCodeUrl: string
  promptpayName?: string
  amount: number
  currency: string
  primaryColor: string
}

export function PromptPayQRCode({
  qrCodeUrl,
  promptpayName,
  amount,
  currency,
  primaryColor
}: PromptPayQRCodeProps) {
  // Format amount for Thai Baht
  const formattedAmount = currency === 'THB' 
    ? new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    : formatPrice(amount, currency)

  return (
    <div className="space-y-4">
      {/* QR Code Image */}
      <div className="flex justify-center p-4 bg-white border-2 border-stone-200 rounded-xl">
        <div className="relative w-48 h-48">
          <Image
            src={qrCodeUrl}
            alt="PromptPay QR Code"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="text-center">
        <p className="text-sm text-stone-500 mb-1">Amount to pay</p>
        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
          {formattedAmount}
        </p>
      </div>

      {/* Account Info */}
      {promptpayName && (
        <div className="bg-stone-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Pay to</span>
            <span className="font-medium text-stone-900">{promptpayName}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-center text-stone-500">
        Scan with your banking app to pay
      </p>
    </div>
  )
}
