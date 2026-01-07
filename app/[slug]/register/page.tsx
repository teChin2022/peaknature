import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RegisterForm } from '@/components/auth/register-form'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'

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
    <AuthPageLayout 
      tenant={tenant} 
      type="register"
      redirectTo={redirect}
    >
      <RegisterForm tenant={tenant} redirectTo={redirect} />
    </AuthPageLayout>
  )
}
