'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Timer, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

interface ReservationLockCheckerProps {
  roomId: string
  checkIn: string
  checkOut: string
  tenantId: string
  tenantSlug: string
  primaryColor: string
  timeoutMinutes: number
  user: User | null
  children: React.ReactNode
}

export function ReservationLockChecker({
  roomId,
  checkIn,
  checkOut,
  tenantId,
  tenantSlug,
  primaryColor,
  timeoutMinutes,
  user,
  children
}: ReservationLockCheckerProps) {
  const router = useRouter()
  
  const [isChecking, setIsChecking] = useState(true)
  const [isLockedByOther, setIsLockedByOther] = useState(false)
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  
  // Start countdown immediately when page loads
  const [pageLoadTime] = useState<Date>(() => new Date())
  const [myTimeRemaining, setMyTimeRemaining] = useState<number>(timeoutMinutes * 60)
  
  const [isAvailable, setIsAvailable] = useState(false)
  const [hasCreatedLock, setHasCreatedLock] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  // Check for existing locks on mount
  useEffect(() => {
    async function checkLock() {
      try {
        const response = await fetch('/api/payment/check-lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, checkIn, checkOut })
        })

        const result = await response.json()

        if (result.success && result.isLocked) {
          // Dates are locked by another user
          setIsLockedByOther(true)
          if (result.expiresAt) {
            setLockExpiresAt(new Date(result.expiresAt))
          }
        } else {
          // Dates are available - if user is logged in, create a lock for them
          if (user) {
            await createMyLock()
          }
        }
      } catch {
        // Silent fail
      } finally {
        setIsChecking(false)
      }
    }

    checkLock()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, checkIn, checkOut])

  // Create lock for current user
  const createMyLock = async () => {
    if (hasCreatedLock) {
      return
    }

    try {
      const response = await fetch('/api/payment/create-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          tenantId
        })
      })

      const result = await response.json()

      if (result.success) {
        setHasCreatedLock(true)
      }
    } catch {
      // Silent fail
    }
  }

  // Countdown timer for other user's lock
  useEffect(() => {
    if (!lockExpiresAt || !isLockedByOther) return

    const interval = setInterval(() => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((lockExpiresAt.getTime() - now.getTime()) / 1000))
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        // Lock expired, check availability
        setIsLockedByOther(false)
        setIsAvailable(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockExpiresAt, isLockedByOther])

  // Countdown timer for current user - starts immediately when page loads
  useEffect(() => {
    if (isLockedByOther) return // Don't countdown if waiting for another user

    const expiresAt = new Date(pageLoadTime.getTime() + timeoutMinutes * 60 * 1000)

    const interval = setInterval(() => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      setMyTimeRemaining(remaining)

      if (remaining <= 0) {
        // Time expired
        setIsExpired(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [pageLoadTime, timeoutMinutes, isLockedByOther])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    )
  }

  // Time expired for current user
  if (isExpired && !isLockedByOther) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Time Expired
            </h3>
            <p className="text-red-700 mb-4">
              Your reservation time has expired. Please try again.
            </p>
            <Button 
              onClick={() => router.push(`/${tenantSlug}/rooms/${roomId}`)} 
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Back to Room
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dates became available after waiting
  if (isAvailable) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Dates Available!
            </h3>
            <p className="text-green-700 mb-4">
              The previous guest didn&apos;t complete payment. You can now proceed with your booking!
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Continue Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dates are locked by another user
  if (isLockedByOther) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div 
                className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Clock className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Another Guest is Completing Payment
              </h3>
              <p className="text-stone-600">
                These dates are currently held by another guest. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show countdown timer - always visible when not locked by another user
  return (
    <div className="space-y-6">
      {/* Countdown Timer - Always show */}
      <Card className={`${myTimeRemaining <= 60 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: myTimeRemaining <= 60 ? '#fef2f2' : `${primaryColor}15` }}
              >
                <Timer className="h-5 w-5" style={{ color: myTimeRemaining <= 60 ? '#ef4444' : primaryColor }} />
              </div>
              <div>
                <p className="font-medium text-stone-900">Complete your booking</p>
                <p className="text-sm text-stone-600">
                  {myTimeRemaining <= 60 
                    ? 'Hurry! Time is running out' 
                    : 'Complete payment before time expires'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Time remaining</p>
              <p 
                className="text-2xl font-mono font-bold"
                style={{ color: myTimeRemaining <= 60 ? '#ef4444' : primaryColor }}
              >
                {formatTime(myTimeRemaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  )
}
