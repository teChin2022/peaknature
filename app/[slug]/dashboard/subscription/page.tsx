import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantSettings, defaultTenantSettings } from '@/types/database'
import { SubscriptionContent } from '@/components/dashboard/subscription-content'
import { getSubscriptionInfo } from '@/lib/subscription-server'
import { PRO_PLAN_PRICE } from '@/lib/subscription'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface SubscriptionPageProps {
  params: Promise<{ slug: string }>
}

async function getSubscriptionData(slug: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  // Get subscription info
  const subscriptionInfo = await getSubscriptionInfo(tenant.id)

  // Convert subscription info to plain data (no functions) for client component
  const subscriptionData = subscriptionInfo ? {
    plan: subscriptionInfo.plan,
    status: subscriptionInfo.status,
    trialStartedAt: subscriptionInfo.trialStartedAt?.toISOString() || null,
    trialEndsAt: subscriptionInfo.trialEndsAt?.toISOString() || null,
    subscriptionStartedAt: subscriptionInfo.subscriptionStartedAt?.toISOString() || null,
    subscriptionEndsAt: subscriptionInfo.subscriptionEndsAt?.toISOString() || null,
    daysRemaining: subscriptionInfo.daysRemaining,
    isTrialActive: subscriptionInfo.isTrialActive,
    isSubscriptionActive: subscriptionInfo.isSubscriptionActive,
  } : null

  // Get payment history
  const { data: payments } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get tenant settings for currency
  const settings = (tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = settings.currency || 'THB'

  return { 
    tenant, 
    subscriptionData, 
    payments: payments || [],
    currency,
    proPlanPrice: PRO_PLAN_PRICE,
  }
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { slug } = await params
  const data = await getSubscriptionData(slug)
  
  if (!data) {
    notFound()
  }

  return (
    <SubscriptionContent
      slug={slug}
      tenant={data.tenant}
      subscriptionData={data.subscriptionData}
      payments={data.payments}
      currency={data.currency}
      proPlanPrice={data.proPlanPrice}
    />
  )
}

