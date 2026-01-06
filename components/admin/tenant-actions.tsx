'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical, ExternalLink, Edit2, Trash2, EyeOff, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Tenant, CurrencyCode } from '@/types/database'
import { getCurrencySymbol } from '@/lib/currency'
import { logAdminAction, AuditActions } from '@/lib/audit'

interface TenantActionsProps {
  tenant: Tenant
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [editData, setEditData] = useState({
    name: tenant.name,
    slug: tenant.slug,
    primary_color: tenant.primary_color,
    plan: tenant.plan,
  })
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [error, setError] = useState<string | null>(null)

  // Fetch platform currency
  useEffect(() => {
    async function loadCurrency() {
      const { data } = await supabase
        .from('platform_settings')
        .select('default_currency')
        .limit(1)
      if (data?.[0]?.default_currency) {
        setCurrency(data[0].default_currency as CurrencyCode)
      }
    }
    loadCurrency()
  }, [supabase])

  // Toggle active status
  const handleToggleActive = async () => {
    setIsLoading(true)
    const newStatus = !tenant.is_active
    const action = newStatus ? AuditActions.TENANT_ACTIVATE : AuditActions.TENANT_DEACTIVATE
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: newStatus })
        .eq('id', tenant.id)
        .select()

      if (error) {
        // Log failed action
        logAdminAction(action, 
          { type: 'tenant', id: tenant.id, name: tenant.name },
          { success: false, errorMessage: error.message }
        )
        alert(`Error: ${error.message}`)
        throw error
      }
      
      // Log successful action
      logAdminAction(action, 
        { type: 'tenant', id: tenant.id, name: tenant.name },
        { 
          oldValue: { is_active: tenant.is_active },
          newValue: { is_active: newStatus }
        }
      )
      
      router.refresh()
    } catch (error) {
      console.error('Error toggling tenant status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update tenant
  const handleUpdate = async () => {
    setIsLoading(true)
    const oldData = { name: tenant.name, slug: tenant.slug, primary_color: tenant.primary_color, plan: tenant.plan }
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: editData.name,
          slug: editData.slug,
          primary_color: editData.primary_color,
          plan: editData.plan,
        })
        .eq('id', tenant.id)

      if (error) {
        logAdminAction(AuditActions.TENANT_UPDATE, 
          { type: 'tenant', id: tenant.id, name: tenant.name },
          { success: false, errorMessage: error.message }
        )
        throw error
      }
      
      // Log successful update
      logAdminAction(AuditActions.TENANT_UPDATE, 
        { type: 'tenant', id: tenant.id, name: editData.name },
        { oldValue: oldData, newValue: editData }
      )
      
      // Log plan change separately if changed
      if (oldData.plan !== editData.plan) {
        logAdminAction(AuditActions.TENANT_PLAN_CHANGE, 
          { type: 'tenant', id: tenant.id, name: editData.name },
          { 
            oldValue: { plan: oldData.plan },
            newValue: { plan: editData.plan }
          }
        )
      }
      
      setEditDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating tenant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete tenant
  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id)

      if (error) {
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          const errMsg = 'Cannot delete tenant: There are bookings or other data associated with this tenant. Please run the latest database migration to enable cascade deletion.'
          logAdminAction(AuditActions.TENANT_DELETE, 
            { type: 'tenant', id: tenant.id, name: tenant.name },
            { success: false, errorMessage: errMsg }
          )
          throw new Error(errMsg)
        }
        logAdminAction(AuditActions.TENANT_DELETE, 
          { type: 'tenant', id: tenant.id, name: tenant.name },
          { success: false, errorMessage: error.message }
        )
        throw error
      }
      
      // Log successful deletion
      logAdminAction(AuditActions.TENANT_DELETE, 
        { type: 'tenant', id: tenant.id, name: tenant.name },
        { details: { slug: tenant.slug, plan: tenant.plan } }
      )
      
      setDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting tenant:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete tenant. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-gray-200">
          <DropdownMenuItem 
            onClick={() => setEditDialog(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <Link href={`/${tenant.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-100" />
          {!tenant.is_active ? (
            // Pending tenant - show Approve/Reject
            <>
              <DropdownMenuItem 
                onClick={handleToggleActive}
                disabled={isLoading}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => { setError(null); setDeleteDialog(true); }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </>
          ) : (
            // Active tenant - show Deactivate/Delete
            <>
              <DropdownMenuItem 
                onClick={handleToggleActive}
                disabled={isLoading}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => { setError(null); setDeleteDialog(true); }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription className="text-gray-500">
              Update tenant information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Property Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="bg-gray-50 border-gray-200 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">URL Slug</Label>
              <Input
                value={editData.slug}
                onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                className="bg-gray-50 border-gray-200 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Brand Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editData.primary_color}
                    onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                    className="h-10 w-14 rounded border border-gray-200 bg-gray-50 cursor-pointer"
                  />
                  <Input
                    value={editData.primary_color}
                    onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                    className="bg-gray-50 border-gray-200 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Plan</Label>
                <Select 
                  value={editData.plan}
                  onValueChange={(value) => setEditData({ ...editData, plan: value as 'free' | 'pro' })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="free">Free (2 months trial)</SelectItem>
                    <SelectItem value="pro">Pro ({getCurrencySymbol(currency)}699/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Tenant
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete the tenant and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-900">{tenant.name}</div>
                <div className="text-sm text-gray-500">/{tenant.slug}</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            This will delete:
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside space-y-1 mb-4">
            <li>All rooms associated with this tenant</li>
            <li>All bookings and booking history</li>
            <li>All reviews</li>
            <li>All guest data linked to this tenant</li>
          </ul>

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Tenant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

