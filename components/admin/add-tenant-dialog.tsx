'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getCurrencySymbol } from '@/lib/currency'
import { CurrencyCode } from '@/types/database'

const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  plan: z.enum(['free', 'pro']),
  host_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  host_name: z.string().optional().or(z.literal('')),
})

type TenantFormData = z.infer<typeof tenantSchema>

export function AddTenantDialog() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      primary_color: '#3B82F6',
      plan: 'free',
      host_email: '',
      host_name: '',
    },
  })

  const watchName = watch('name')
  const watchColor = watch('primary_color')

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const onSubmit = async (data: TenantFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if slug already exists
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (existing) {
        setError('A tenant with this slug already exists')
        setIsLoading(false)
        return
      }

      // Create tenant (admin-created tenants are immediately active)
      const { data: tenant, error: insertError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          slug: data.slug,
          primary_color: data.primary_color,
          plan: data.plan,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      // If host email provided, update the existing profile or note for manual setup
      if (data.host_email) {
        // Check if user already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', data.host_email)
          .single()

        if (existingProfile) {
          // User exists - update their profile to be host of this tenant
          if (existingProfile.role === 'guest' || !existingProfile.role) {
            await supabase
              .from('profiles')
              .update({
                role: 'host',
                tenant_id: tenant.id,
                full_name: data.host_name || undefined,
              })
              .eq('id', existingProfile.id)
          } else {
            setError('This email is already registered as a host or admin. Tenant created but host not assigned.')
          }
        }
        // Note: If user doesn't exist, they'll need to register themselves
        // The admin can communicate the tenant slug to the host
      }

      // Send LINE notification to admin (don't await, fire and forget)
      fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_tenant',
          data: {
            tenantName: data.name,
            tenantEmail: data.host_email || 'N/A',
            tenantSlug: data.slug,
          }
        })
      }).catch(err => console.error('Failed to send notification:', err))

      // Success
      reset()
      setOpen(false)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Tenant
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Create a new homestay property on the platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-700">Property Name</Label>
            <Input
              placeholder="Cozy Mountain Lodge"
              className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
              {...register('name', {
                onChange: (e) => {
                  const slug = generateSlug(e.target.value)
                  setValue('slug', slug)
                }
              })}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">homestay.com/</span>
              <Input
                placeholder="cozy-mountain-lodge"
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                {...register('slug')}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 rounded border border-gray-200 bg-gray-50 cursor-pointer"
                  {...register('primary_color')}
                />
                <Input
                  className="bg-gray-50 border-gray-200 text-gray-900 font-mono"
                  {...register('primary_color')}
                />
              </div>
              {errors.primary_color && (
                <p className="text-sm text-red-600">{errors.primary_color.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Plan</Label>
              <Select 
                defaultValue="free"
                onValueChange={(value) => setValue('plan', value as 'free' | 'pro')}
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

          {/* Host Information (Optional) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <Label className="text-gray-500 text-xs uppercase tracking-wider">Host Information (Optional)</Label>
            <p className="text-xs text-gray-400 -mt-2">
              If provided, will assign an existing user as host of this property
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Host Email</Label>
                <Input
                  type="email"
                  placeholder="host@example.com"
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                  {...register('host_email')}
                />
                {errors.host_email && (
                  <p className="text-sm text-red-600">{errors.host_email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Host Name</Label>
                <Input
                  placeholder="John Doe"
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                  {...register('host_name')}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-gray-500 text-xs uppercase tracking-wider">Preview</Label>
            <div className="flex items-center gap-3 mt-3">
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: watchColor || '#3B82F6' }}
              >
                {(watchName || 'T').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{watchName || 'Tenant Name'}</div>
                <div className="text-sm text-gray-500">/{watch('slug') || 'tenant-slug'}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tenant'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

