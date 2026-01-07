import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { AuthPageLayout } from '@/components/auth/auth-page-layout'

interface ResetPasswordPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; error?: string }>
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

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { slug } = await params
  const { success, error } = await searchParams
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

  // Check if user has a valid session (from recovery token)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If no session and not showing success, redirect to forgot password
  if (!session && !success) {
    redirect(`/${slug}/forgot-password`)
  }

  return (
    <AuthPageLayout 
      tenant={tenant} 
      type="reset-password"
      error={error}
      success={!!success}
    >
      <ResetPasswordForm tenant={tenant} />
    </AuthPageLayout>
  )
}
