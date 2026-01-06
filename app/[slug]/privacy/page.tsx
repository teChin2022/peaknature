import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PrivacyPolicyClient } from '@/components/legal/privacy-policy-client'

interface PrivacyPageProps {
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

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { slug } = await params
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

  return <PrivacyPolicyClient tenant={tenant} />
}

