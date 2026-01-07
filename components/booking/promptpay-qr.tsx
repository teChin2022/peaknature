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
  bankName?: string
  bankAccountNumber?: string
  amount: number
  currency: string
  primaryColor: string
}

export function PromptPayQRCode({
  qrCodeUrl,
  promptpayName,
  promptpayId,
  bankName,
  bankAccountNumber,
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
      {(promptpayName || bankName || bankAccountNumber) && (
        <div className="bg-stone-50 rounded-lg p-3 text-sm space-y-2">
          {promptpayName && (
            <div className="flex justify-between">
              <span className="text-stone-500">{t('payTo')}</span>
              <span className="font-medium text-stone-900">{promptpayName}</span>
            </div>
          )}
          {bankName && (
            <div className="flex justify-between">
              <span className="text-stone-500">{t('bankName')}</span>
              <span className="font-medium text-stone-900">{bankName}</span>
            </div>
          )}
          {bankAccountNumber && (
            <div className="flex justify-between">
              <span className="text-stone-500">{t('accountNumber')}</span>
              <span className="font-mono font-medium text-stone-900">{bankAccountNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* Manual Transfer Section */}
      {promptpayId && (
        <div className="pt-4 border-t border-stone-200">
          {/* Divider with text */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">
              {t('orTransferManually')}
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Compact info grid */}
          <div className="space-y-2">
            {/* PromptPay Number */}
            <button
              onClick={() => handleCopy(promptpayId, 'promptpay')}
              className="w-full group"
            >
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    PP
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide">{t('promptPayNumberLabel')}</p>
                    <p className="text-base font-mono font-semibold text-stone-900">{promptpayId}</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    copiedField === 'promptpay' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-stone-400 group-hover:text-stone-600 group-hover:bg-stone-200'
                  }`}
                >
                  {copiedField === 'promptpay' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('copy')}</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Amount */}
            <button
              onClick={() => handleCopy(amount.toFixed(2), 'amount')}
              className="w-full group"
            >
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  >
                    ฿
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide">{t('amountToPay')}</p>
                    <p className="text-base font-mono font-semibold" style={{ color: primaryColor }}>{formattedAmount}</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    copiedField === 'amount' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-stone-400 group-hover:text-stone-600 group-hover:bg-stone-200'
                  }`}
                >
                  {copiedField === 'amount' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('copy')}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-center text-stone-500">
        {t('scanWithBankingApp')}
      </p>
    </div>
  )
}
