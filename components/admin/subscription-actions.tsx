'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MoreVertical, CheckCircle2, XCircle, Eye, RefreshCw, Loader2, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/currency'
import { PRO_PLAN_PRICE } from '@/lib/subscription'
import { format, addMonths, parseISO } from 'date-fns'

interface SubscriptionActionsProps {
  tenant?: {
    id: string
    name: string
    slug: string
    plan: string
    subscription_status: string
    trial_ends_at: string | null
    subscription_ends_at: string | null
  }
  payment?: {
    id: string
    tenant_id: string
    amount: number
    period_start: string
    period_end: string
    payment_proof_url: string | null
    status: string
    tenant?: {
      name: string
      slug: string
      primary_color: string
    }
  }
  currency: string
}

export function SubscriptionActions({ tenant, payment, currency }: SubscriptionActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [viewProofDialog, setViewProofDialog] = useState(false)
  const [extendDialog, setExtendDialog] = useState(false)
  const [upgradeDialog, setUpgradeDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // For payments
  const handleVerifyPayment = async (approve: boolean) => {
    if (!payment) return
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('subscription_payments')
        .update({ 
          status: approve ? 'verified' : 'rejected',
          verified_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      if (updateError) throw updateError

      // If approved, update tenant subscription
      if (approve) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({
            plan: 'pro',
            subscription_status: 'active',
            subscription_started_at: payment.period_start,
            subscription_ends_at: payment.period_end,
          })
          .eq('id', payment.tenant_id)

        if (tenantError) throw tenantError
      }

      router.refresh()
    } catch (err) {
      console.error('Error verifying payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify payment')
    } finally {
      setIsLoading(false)
    }
  }

  // For tenants - extend subscription
  const handleExtendSubscription = async () => {
    if (!tenant) return
    setIsLoading(true)
    setError(null)

    try {
      const currentEnd = tenant.subscription_ends_at 
        ? new Date(tenant.subscription_ends_at) 
        : new Date()
      
      const newEnd = addMonths(currentEnd > new Date() ? currentEnd : new Date(), 1)

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          plan: 'pro',
          subscription_status: 'active',
          subscription_ends_at: newEnd.toISOString(),
        })
        .eq('id', tenant.id)

      if (updateError) throw updateError

      // Create a payment record
      await supabase
        .from('subscription_payments')
        .insert({
          tenant_id: tenant.id,
          amount: PRO_PLAN_PRICE,
          currency: currency,
          payment_method: 'manual',
          period_start: new Date().toISOString().split('T')[0],
          period_end: newEnd.toISOString().split('T')[0],
          status: 'verified',
          verified_at: new Date().toISOString(),
          notes: 'Extended by admin',
        })

      setExtendDialog(false)
      router.refresh()
    } catch (err) {
      console.error('Error extending subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to extend subscription')
    } finally {
      setIsLoading(false)
    }
  }

  // For tenants - upgrade to Pro
  const handleUpgrade = async () => {
    if (!tenant) return
    setIsLoading(true)
    setError(null)

    try {
      const startDate = new Date()
      const endDate = addMonths(startDate, 1)

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          plan: 'pro',
          subscription_status: 'active',
          subscription_started_at: startDate.toISOString(),
          subscription_ends_at: endDate.toISOString(),
        })
        .eq('id', tenant.id)

      if (updateError) throw updateError

      // Create a payment record
      await supabase
        .from('subscription_payments')
        .insert({
          tenant_id: tenant.id,
          amount: PRO_PLAN_PRICE,
          currency: currency,
          payment_method: 'manual',
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          status: 'verified',
          verified_at: new Date().toISOString(),
          notes: 'Upgraded by admin',
        })

      setUpgradeDialog(false)
      router.refresh()
    } catch (err) {
      console.error('Error upgrading:', err)
      setError(err instanceof Error ? err.message : 'Failed to upgrade')
    } finally {
      setIsLoading(false)
    }
  }

  // Payment actions
  if (payment) {
    return (
      <>
        <div className="flex items-center justify-end gap-2">
          {payment.payment_proof_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewProofDialog(true)}
              className="h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              View Proof
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVerifyPayment(false)}
            disabled={isLoading}
            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => handleVerifyPayment(true)}
            disabled={isLoading}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </>
            )}
          </Button>
        </div>

        {/* View Proof Dialog */}
        <Dialog open={viewProofDialog} onOpenChange={setViewProofDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>
                Payment of {formatPrice(payment.amount, currency)} for {payment.tenant?.name}
              </DialogDescription>
            </DialogHeader>
            {payment.payment_proof_url && (
              <div className="mt-4">
                <Image
                  src={payment.payment_proof_url}
                  alt="Payment proof"
                  width={600}
                  height={800}
                  className="w-full rounded-lg border"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Tenant actions
  if (tenant) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-gray-200">
            {tenant.subscription_status !== 'active' && (
              <DropdownMenuItem 
                onClick={() => { setError(null); setUpgradeDialog(true); }}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
            )}
            {tenant.subscription_status === 'active' && (
              <DropdownMenuItem 
                onClick={() => { setError(null); setExtendDialog(true); }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend 1 Month
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem 
              onClick={() => window.open(`/${tenant.slug}`, '_blank')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Site
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Upgrade Dialog */}
        <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <ArrowUpCircle className="h-5 w-5" />
                Upgrade to Pro
              </DialogTitle>
              <DialogDescription>
                Manually upgrade {tenant.name} to Pro plan
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                This will:
              </p>
              <ul className="text-sm text-emerald-700 list-disc list-inside mt-2 space-y-1">
                <li>Upgrade tenant to Pro plan</li>
                <li>Set subscription for 1 month ({formatPrice(PRO_PLAN_PRICE, currency)})</li>
                <li>Create a verified payment record</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUpgradeDialog(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  'Upgrade Now'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-5 w-5" />
                Extend Subscription
              </DialogTitle>
              <DialogDescription>
                Extend {tenant.name}&apos;s subscription by 1 month
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Current end date: {tenant.subscription_ends_at ? format(parseISO(tenant.subscription_ends_at), 'MMM d, yyyy') : 'N/A'}
              </p>
              <p className="text-sm text-blue-800 mt-2">
                New end date: {format(addMonths(tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : new Date(), 1), 'MMM d, yyyy')}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setExtendDialog(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtendSubscription}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extending...
                  </>
                ) : (
                  `Extend (+${formatPrice(PRO_PLAN_PRICE, currency)})`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}

