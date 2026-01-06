'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react'
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

export default function HostLoginPage() {
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
          .select('role, tenant_id')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'host' && profile?.tenant_id) {
          // Get tenant slug and redirect to dashboard
          const { data: tenant } = await supabase
            .from('tenants')
            .select('slug, is_active')
            .eq('id', profile.tenant_id)
            .single()
          
          if (tenant?.is_active) {
            router.push(`/${tenant.slug}/dashboard`)
          }
        } else if (profile?.role === 'super_admin') {
          // Redirect super admin to admin login
          router.push('/admin/login')
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
          context: 'host_login'
        })
        setError(signInError.message)
        return
      }

      if (authData.user) {
        // Check user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', authData.user.id)
          .single()

        if (profile?.role === 'super_admin') {
          await supabase.auth.signOut()
          setError('Super admins should use the admin portal.')
          return
        }

        if (profile?.role !== 'host') {
          // Log unauthorized access attempt
          logSecurityEvent(AuditActions.UNAUTHORIZED_ACCESS, 'warning', {
            email: data.email,
            attemptedRole: 'host',
            actualRole: profile?.role,
            context: 'host_login'
          })
          await supabase.auth.signOut()
          setError('This login is for property hosts only. Guests should login at the property page.')
          return
        }

        // Check email verification
        if (!authData.user.email_confirmed_at) {
          await supabase.auth.signOut()
          setError('Please verify your email address first. Check your inbox for the verification link.')
          return
        }

        // Get tenant and check status
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug, is_active')
          .eq('id', profile.tenant_id)
          .single()
        
        if (!tenant) {
          await supabase.auth.signOut()
          setError('Property not found. Please contact support.')
          return
        }

        if (!tenant.is_active) {
          await supabase.auth.signOut()
          setError('Your property is pending approval. You will receive an email once approved.')
          return
        }

        router.push(`/${tenant.slug}/dashboard`)
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            Host Portal
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-2">
            Sign in to manage your property
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 border-stone-300 text-sm sm:text-base"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-stone-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 border-stone-300 text-sm sm:text-base"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm sm:text-base"
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

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-600">
              Don&apos;t have an account?{' '}
              <Link href="/host/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Register your property
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <p className="text-center mt-6 text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-700 transition-colors">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  )
}

