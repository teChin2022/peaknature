'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { logSecurityEvent, AuditActions } from '@/lib/audit'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'super_admin') {
          router.push('/admin')
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        // Log failed login attempt
        logSecurityEvent(AuditActions.LOGIN_FAILED, 'warning', {
          email: data.email,
          error: signInError.message,
          context: 'admin_login'
        })
        setError(signInError.message)
        return
      }

      if (authData.user) {
        // Check user role - must be super_admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profile?.role !== 'super_admin') {
          // Log unauthorized access attempt
          logSecurityEvent(AuditActions.UNAUTHORIZED_ACCESS, 'error', {
            email: data.email,
            attemptedRole: 'super_admin',
            actualRole: profile?.role,
            context: 'admin_login'
          })
          await supabase.auth.signOut()
          setError('Access denied. This login is for platform administrators only.')
          return
        }

        router.push('/admin')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gray-900 mb-4 shadow-lg">
            <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform administrator access only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="h-10 pl-10 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-lg"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-gray-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-10 pl-10 pr-10 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-lg"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-5 p-3.5 bg-white rounded-lg border border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Are you a property host?{' '}
            <Link href="/host/login" className="text-gray-900 hover:text-gray-700 font-medium underline underline-offset-2">
              Go to Host Portal
            </Link>
          </p>
        </div>

        {/* Back Link */}
        <p className="text-center mt-5 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  )
}
