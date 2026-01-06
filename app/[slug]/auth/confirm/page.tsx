'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface ConfirmPageProps {
  params: Promise<{ slug: string }>
}

export default function AuthConfirmPage({ params }: ConfirmPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [slug, setSlug] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function handleConfirm() {
      try {
        const resolvedParams = await params
        setSlug(resolvedParams.slug)
        const next = searchParams.get('next') || `/${resolvedParams.slug}`
        
        // Get parameters from both query string and hash fragment
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const code = searchParams.get('code')
        const error_param = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        
        // Handle error from Supabase redirect
        if (error_param) {
          console.error('Auth error:', error_param, error_description)
          setStatus('error')
          
          // Provide helpful message based on error type
          if (error_description?.includes('expired') || error_description?.includes('invalid')) {
            setMessage('This verification link has expired or already been used. Please request a new one by signing up again or use the login page if you already verified.')
          } else {
            setMessage(error_description || 'Authentication failed. Please try again.')
          }
          return
        }
        
        // Also check URL hash for access_token (some Supabase configs use this)
        let hashParams: URLSearchParams | null = null
        if (typeof window !== 'undefined' && window.location.hash) {
          hashParams = new URLSearchParams(window.location.hash.substring(1))
        }
        
        const access_token = hashParams?.get('access_token')
        const refresh_token = hashParams?.get('refresh_token')

        // FIRST: Check if user is already logged in (verification might have happened via Supabase hosted page)
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (existingSession?.user) {
          // User is already logged in - skip verification, go straight to profile check
          setStatus('success')
          setMessage('Welcome! Setting up your account...')
          
          // Check if profile is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, province, district, sub_district')
            .eq('id', existingSession.user.id)
            .single()

          await new Promise(resolve => setTimeout(resolve, 1000))

          const needsPhone = !profile?.phone
          const needsLocation = !profile?.province || !profile?.district || !profile?.sub_district
          
          if (needsPhone || needsLocation) {
            router.push(`/${resolvedParams.slug}/complete-profile?next=${encodeURIComponent(next)}`)
            return
          }

          router.push(next)
          return
        }

        // Method 1: Handle token_hash verification (PKCE email)
        if (token_hash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink',
          })

          if (verifyError) {
            console.error('Verification error:', verifyError)
            setStatus('error')
            setMessage('Email verification failed. The link may have expired.')
            return
          }
        }
        // Method 2: Handle code exchange (OAuth-style)
        else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setStatus('error')
            setMessage('Verification failed. Please try again.')
            return
          }
        }
        // Method 3: Handle hash fragment tokens (implicit flow)
        else if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('Verification failed. Please try again.')
            return
          }
        }
        // Method 4: No tokens and no session - invalid link
        else {
          // Debug: Log what parameters we received
          console.log('Auth confirm received params:', {
            token_hash,
            type,
            code,
            access_token: !!access_token,
            refresh_token: !!refresh_token,
            fullUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
            search: typeof window !== 'undefined' ? window.location.search : 'N/A',
            hash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
          })
          
          setStatus('error')
          setMessage('Invalid verification link. The link may have expired or already been used. Please try logging in or request a new verification email.')
          return
        }

        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500))

        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setStatus('success')
          setMessage('Email verified successfully!')
          
          // Check if profile is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, province')
            .eq('id', session.user.id)
            .single()

          // Wait a moment to show success message
          await new Promise(resolve => setTimeout(resolve, 1500))

          // Check if profile is complete (phone and province required)
          const needsPhone = !profile?.phone
          const needsProvince = !profile?.province
          
          if (needsPhone || needsProvince) {
            router.push(`/${resolvedParams.slug}/complete-profile?next=${encodeURIComponent(next)}`)
            return
          }

          // Profile complete, redirect to destination
          router.push(next)
        } else {
          // No session but verification might have succeeded
          setStatus('success')
          setMessage('Email verified! Please login to continue.')
          await new Promise(resolve => setTimeout(resolve, 2000))
          router.push(`/${resolvedParams.slug}/login`)
        }
      } catch (err) {
        console.error('Confirm error:', err)
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    handleConfirm()
  }, [params, searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center max-w-md px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-stone-400 mx-auto mb-4" />
            <p className="text-stone-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Success!</h2>
            <p className="text-stone-600">{message}</p>
            <p className="text-sm text-stone-400 mt-2">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Verification Failed</h2>
            <p className="text-stone-600 mb-4">{message}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push(`/${slug}/login`)}
                className="w-full"
              >
                Try Logging In
              </Button>
              <Button 
                onClick={() => router.push(`/${slug}/register`)}
                variant="outline"
                className="w-full"
              >
                Register Again
              </Button>
            </div>
            <p className="text-xs text-stone-400 mt-4">
              If you already verified your email, try logging in directly.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

