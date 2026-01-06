import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TermsOfServiceClient } from '@/components/legal/terms-of-service-client'

interface TermsPageProps {
  params: Promise<{ slug: string }>
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

export default async function TermsPage({ params }: TermsPageProps) {
  const { slug } = await params
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

  return <TermsOfServiceClient tenant={tenant} />
}

