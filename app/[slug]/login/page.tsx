import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'

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
    <AuthPageLayout 
      tenant={tenant} 
      type="login" 
      error={error}
      redirectTo={redirect}
    >
      <LoginForm tenant={tenant} redirectTo={redirect} />
    </AuthPageLayout>
  )
}
