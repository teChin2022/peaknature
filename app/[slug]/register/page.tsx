import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

interface RegisterPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ redirect?: string }>
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

export default async function RegisterPage({ params, searchParams }: RegisterPageProps) {
  const { slug } = await params
  const { redirect } = await searchParams
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
            Create an account
          </h1>
          <p className="text-stone-600 mt-2">
            Join {tenant.name} to book your perfect stay
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <RegisterForm tenant={tenant} redirectTo={redirect} />
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-stone-600">
          Already have an account?{' '}
          <Link 
            href={`/${tenant.slug}/login${redirect ? `?redirect=${redirect}` : ''}`}
            className="font-medium hover:underline"
            style={{ color: tenant.primary_color }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

