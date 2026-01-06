'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface WaitingQueueProps {
  roomId: string
  checkIn: string
  checkOut: string
  expiresAt: string
  primaryColor: string
  onAvailable?: () => void
}

export function WaitingQueue({ 
  roomId, 
  checkIn, 
  checkOut, 
  expiresAt, 
  primaryColor,
  onAvailable 
}: WaitingQueueProps) {
  const supabase = createClient()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false)
  const [isOnWaitlist, setIsOnWaitlist] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  // Calculate initial time remaining
  useEffect(() => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000))
    setTimeRemaining(remaining)
  }, [expiresAt])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Check if dates are now available
      checkAvailability()
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          checkAvailability()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const checkAvailability = useCallback(async () => {
    try {
      const response = await fetch('/api/payment/check-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, checkIn, checkOut })
      })

      const result = await response.json()
      
      if (!result.isLocked) {
        setIsAvailable(true)
        onAvailable?.()
      } else {
        // Update time remaining if still locked
        if (result.secondsRemaining) {
          setTimeRemaining(result.secondsRemaining)
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    }
  }, [roomId, checkIn, checkOut, onAvailable])

  const joinWaitlist = async () => {
    setIsJoiningWaitlist(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // User needs to sign in first
        return
      }

      const { error } = await supabase
        .from('date_waitlist')
        .insert({
          room_id: roomId,
          user_id: user.id,
          email: user.email || '',
          check_in: checkIn,
          check_out: checkOut
        })

      if (!error) {
        setIsOnWaitlist(true)
      }
    } catch (error) {
      console.error('Error joining waitlist:', error)
    } finally {
      setIsJoiningWaitlist(false)
    }
  }

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Dates are now available
  if (isAvailable) {
    return (
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
    )
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div 
            className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Clock className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            Another Guest is Completing Payment
          </h3>
          <p className="text-stone-600 mb-4">
            These dates are currently held by another guest. Please wait or join the waitlist.
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-stone-500 mb-1">Time remaining</p>
          <p 
            className="text-3xl font-mono font-bold"
            style={{ color: timeRemaining <= 60 ? '#ef4444' : primaryColor }}
          >
            {formatTime(timeRemaining)}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Dates will be released if payment is not completed
          </p>
        </div>

        {/* Waitlist */}
        {!isOnWaitlist ? (
          <div className="text-center">
            <p className="text-sm text-stone-600 mb-3">
              Get notified when these dates become available
            </p>
            <Button
              onClick={joinWaitlist}
              disabled={isJoiningWaitlist}
              variant="outline"
              className="gap-2"
            >
              {isJoiningWaitlist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Notify Me When Available
            </Button>
          </div>
        ) : (
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You&apos;re on the waitlist!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              We&apos;ll notify you by email if these dates become available.
            </p>
          </div>
        )}

        {/* Auto-refresh note */}
        <p className="text-xs text-center text-stone-400 mt-4">
          This page will automatically update when the countdown ends
        </p>
      </CardContent>
    </Card>
  )
}

