import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'

interface ForgotPasswordPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string }>
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

export default async function ForgotPasswordPage({ params, searchParams }: ForgotPasswordPageProps) {
  const { slug } = await params
  const { success } = await searchParams
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

  return (
    <AuthPageLayout 
      tenant={tenant} 
      type="forgot-password"
      success={!!success}
    >
      <ForgotPasswordForm tenant={tenant} />
    </AuthPageLayout>
  )
}
