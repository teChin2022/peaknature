import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

interface LoginPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ redirect?: string; error?: string }>
}

async function getTenant(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  return data
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { slug } = await params
  const { redirect, error } = await searchParams
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-2xl mb-4"
            style={{ backgroundColor: tenant.primary_color }}
          >
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back
          </h1>
          <p className="text-stone-600 mt-2">
            Sign in to your account to continue booking at {tenant.name}
          </p>
        </div>

        {/* Error Messages */}
        {error === 'blocked' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Account Blocked</strong> — Your account has been blocked. Please contact the property owner for assistance.
          </div>
        )}
        
        {error === 'account_deleted' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <strong>Account Not Found</strong> — Your account may have been deleted. Please contact the property owner if you believe this is an error, or register for a new account.
          </div>
        )}
        
        {error === 'wrong_tenant' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <strong>Access Denied</strong> — Your account is registered with a different property. Please login at the correct property&apos;s website.
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <LoginForm tenant={tenant} redirectTo={redirect} />
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-stone-600">
          Don&apos;t have an account?{' '}
          <Link 
            href={`/${tenant.slug}/register${redirect ? `?redirect=${redirect}` : ''}`}
            className="font-medium hover:underline"
            style={{ color: tenant.primary_color }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

