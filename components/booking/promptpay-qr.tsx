'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import { useTranslations } from 'next-intl'

interface PromptPayQRCodeProps {
  qrCodeUrl: string
  promptpayName?: string
  promptpayId?: string
  amount: number
  currency: string
  primaryColor: string
}

export function PromptPayQRCode({
  qrCodeUrl,
  promptpayName,
  promptpayId,
  amount,
  currency,
  primaryColor
}: PromptPayQRCodeProps) {
  const t = useTranslations('booking')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // Format amount for Thai Baht
  const formattedAmount = currency === 'THB' 
    ? new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    : formatPrice(amount, currency)

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

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
        <p className="text-sm text-stone-500 mb-1">{t('amountToPay')}</p>
        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
          {formattedAmount}
        </p>
      </div>

      {/* Account Info - Always visible */}
      {promptpayName && (
        <div className="bg-stone-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">{t('payTo')}</span>
            <span className="font-medium text-stone-900">{promptpayName}</span>
          </div>
        </div>
      )}

      {/* PromptPay Number - Shown on mobile for manual transfer */}
      {promptpayId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-xs text-blue-700 font-medium text-center">
            {t('orTransferManually')}
          </p>
          
          {/* PromptPay Number with Copy */}
          <button
            onClick={() => handleCopy(promptpayId, 'promptpay')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-left">
              <p className="text-xs text-stone-500">{t('promptPayNumberLabel')}</p>
              <p className="text-lg font-mono font-bold text-stone-900">{promptpayId}</p>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              {copiedField === 'promptpay' ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">{t('tapToCopy')}</span>
                </>
              )}
            </div>
          </button>

          {/* Amount with Copy */}
          <button
            onClick={() => handleCopy(amount.toString(), 'amount')}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-left">
              <p className="text-xs text-stone-500">{t('amountToPay')}</p>
              <p className="text-lg font-mono font-bold" style={{ color: primaryColor }}>{formattedAmount}</p>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              {copiedField === 'amount' ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">{t('tapToCopy')}</span>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-center text-stone-500">
        {t('scanWithBankingApp')}
      </p>
    </div>
  )
}
