'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, AlertTriangle, Smartphone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { differenceInHours, parseISO } from 'date-fns'
import { useTranslations } from 'next-intl'

interface CancelBookingButtonProps {
  bookingId: string
  createdAt: string
  status: string
  guestPhone?: string | null
}

export function CancelBookingButton({ bookingId, createdAt, status, guestPhone }: CancelBookingButtonProps) {
  const router = useRouter()
  const t = useTranslations('cancelBooking')
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<'promptpay' | 'bank'>('promptpay')
  const [bankAccount, setBankAccount] = useState('')

  // Can only cancel within 24 hours AFTER booking was created
  const hoursSinceBooking = differenceInHours(new Date(), parseISO(createdAt))
  const canCancel = hoursSinceBooking <= 24 && !['cancelled', 'completed'].includes(status)

  if (!canCancel) return null

  const isValid = () => {
    if (!reason.trim()) return false
    if (refundMethod === 'bank' && !bankAccount.trim()) return false
    return true
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError(t('pleaseProvideReason'))
      return
    }
    if (refundMethod === 'bank' && !bankAccount.trim()) {
      setError(t('pleaseProvideBankDetails'))
      return
    }

    setIsLoading(true)
    setError(null)

    // Build full reason with refund info
    let fullReason = reason.trim()
    if (refundMethod === 'promptpay') {
      fullReason += `\n\n📱 Refund via PromptPay: ${guestPhone || 'N/A'}`
    } else {
      fullReason += `\n\n🏦 Refund via Bank Transfer:\n${bankAccount.trim()}`
    }

    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId, 
          reason: fullReason,
          refundMethod,
          refundDetails: refundMethod === 'promptpay' ? guestPhone : bankAccount.trim()
        }),
      })
      
      // Handle rate limiting
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After') || '60'
        setError(t('tooManyRequests', { seconds: retryAfter }))
        return
      }
      
      const data = await res.json()

      if (!data.success) {
        setError(data.error || t('failedToCancel'))
        return
      }

      setShowDialog(false)
      setReason('')
      setBankAccount('')
      router.refresh()
    } catch {
      setError(t('somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      setReason('')
      setBankAccount('')
      setRefundMethod('promptpay')
      setError(null)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
        onClick={() => setShowDialog(true)}
      >
        <X className="h-4 w-4" />
        {t('cancel')}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('cancelBooking')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                {t('reasonLabel')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder={t('reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            {/* Refund Method */}
            <div className="space-y-3">
              <Label>{t('refundMethod')} <span className="text-red-500">*</span></Label>
              <RadioGroup 
                value={refundMethod} 
                onValueChange={(v) => setRefundMethod(v as 'promptpay' | 'bank')}
                disabled={isLoading}
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="promptpay" id="promptpay" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="promptpay" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      {t('promptPay')}
                    </Label>
                    <p className="text-xs text-stone-500 mt-1">
                      {t('refundTo')}: {guestPhone || t('phoneNotProvided')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-stone-50">
                  <RadioGroupItem value="bank" id="bank" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-green-600" />
                      {t('bankTransfer')}
                    </Label>
                    <p className="text-xs text-stone-500 mt-1">
                      {t('bankDetailsHint')}
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {refundMethod === 'bank' && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="bank-account">
                    {t('bankAccountDetails')} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="bank-account"
                    placeholder={t('bankAccountPlaceholder')}
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="min-h-[80px] text-sm"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('keepBooking')}</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={isLoading || !isValid()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('cancelAndRefund')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

