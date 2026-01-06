'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Globe, Mail, Shield, Bell, Save, Loader2, CheckCircle2, AlertCircle, QrCode, ImageIcon, MessageCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { CURRENCIES, CurrencyCode } from '@/types/database'

interface PlatformSettings {
  id: string
  platform_name: string
  support_email: string
  default_currency: string
  default_timezone: string
  smtp_host: string
  smtp_port: number
  from_email: string
  from_name: string
  promptpay_name: string
  promptpay_qr_url: string
  platform_fee_percent: number
  line_channel_access_token: string
  line_user_id: string
  require_email_verification: boolean
  require_2fa_admin: boolean
  notify_new_tenant: boolean
  notify_daily_summary: boolean
  notify_errors: boolean
}

const defaultSettings: PlatformSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  platform_name: 'Homestay Booking',
  support_email: 'support@homestay.com',
  default_currency: 'THB',
  default_timezone: 'gmt7',
  smtp_host: '',
  smtp_port: 587,
  from_email: '',
  from_name: 'Homestay Booking',
  promptpay_name: '',
  promptpay_qr_url: '',
  platform_fee_percent: 10,
  line_channel_access_token: '',
  line_user_id: '',
  require_email_verification: true,
  require_2fa_admin: false,
  notify_new_tenant: true,
  notify_daily_summary: true,
  notify_errors: true,
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploadingQR, setIsUploadingQR] = useState(false)
  const qrInputRef = useRef<HTMLInputElement>(null)

  // Load settings on mount via API
  useEffect(() => {
    let isMounted = true
    
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          console.error('Invalid response type:', contentType)
          if (isMounted) setIsLoading(false)
          return
        }

        const result = await response.json()

        if (!isMounted) return

        if (response.ok && result.data) {
          setSettings({ ...defaultSettings, ...result.data })
        } else if (!response.ok) {
          console.error('Error loading settings:', result.error)
          setErrorMessage(result.error || 'Failed to load settings')
        }
        // If no data, keep using defaults
      } catch (err) {
        console.error('Error loading settings:', err)
        if (isMounted) {
          setErrorMessage('Failed to load settings. Please refresh the page.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()
    
    // Cleanup to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  // Update a field
  const updateField = <K extends keyof PlatformSettings>(field: K, value: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveStatus('idle')
  }

  // Upload QR code image
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a PNG, JPG, or WebP image')
      setSaveStatus('error')
      return
    }

    // Validate file size (max 2MB for QR codes)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('QR code image must be less than 2MB')
      setSaveStatus('error')
      return
    }

    setIsUploadingQR(true)
    setErrorMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `promptpay-qr-${Date.now()}.${fileExt}`
      const filePath = `platform/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('promptpay-qr')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setErrorMessage(uploadError.message)
        setSaveStatus('error')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('promptpay-qr')
        .getPublicUrl(filePath)

      // Update settings with new URL
      updateField('promptpay_qr_url', publicUrl)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Error uploading QR code:', err)
      setErrorMessage('Failed to upload QR code')
      setSaveStatus('error')
    } finally {
      setIsUploadingQR(false)
      // Reset input
      if (qrInputRef.current) {
        qrInputRef.current.value = ''
      }
    }
  }

  // Remove QR code
  const handleRemoveQR = () => {
    updateField('promptpay_qr_url', '')
  }

  // Save settings via API
  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)

    try {
      const bodyData = {
        platform_name: settings.platform_name,
        support_email: settings.support_email,
        default_currency: settings.default_currency,
        default_timezone: settings.default_timezone,
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        from_email: settings.from_email,
        from_name: settings.from_name,
        promptpay_name: settings.promptpay_name,
        promptpay_qr_url: settings.promptpay_qr_url,
        platform_fee_percent: settings.platform_fee_percent,
        line_channel_access_token: settings.line_channel_access_token || '',
        line_user_id: settings.line_user_id || '',
        require_email_verification: true, // Always required
        require_2fa_admin: settings.require_2fa_admin,
        notify_new_tenant: settings.notify_new_tenant,
        notify_daily_summary: settings.notify_daily_summary,
        notify_errors: settings.notify_errors,
      }

      console.log('Saving settings...', bodyData)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        console.error('Invalid response type:', contentType, 'Status:', response.status)
        setSaveStatus('error')
        setErrorMessage(`Server error (${response.status}). Please try again.`)
        return
      }

      const result = await response.json()
      console.log('Save response:', result)

      if (!response.ok) {
        console.error('Error saving settings:', result.error)
        setSaveStatus('error')
        setErrorMessage(result.error || 'Failed to save settings')
        return
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Network error - please try again')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-24 mb-1.5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Settings Cards Skeleton */}
        <div className="grid gap-5">
          {/* General Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-36 mb-1" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-52 w-52 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div>
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage platform configuration</p>
      </div>

      <div className="grid gap-5">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">General Settings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configure basic platform settings</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Platform Name</Label>
                <Input 
                  value={settings.platform_name}
                  onChange={(e) => updateField('platform_name', e.target.value)}
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Support Email</Label>
                <Input 
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => updateField('support_email', e.target.value)}
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Default Currency</Label>
                <Select 
                  value={settings.default_currency}
                  onValueChange={(value: CurrencyCode) => updateField('default_currency', value)}
                >
                  <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 shadow-lg rounded-lg">
                    {Object.values(CURRENCIES).map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-5">{currency.symbol}</span>
                          <span>{currency.name}</span>
                          <span className="text-gray-400">({currency.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Default Timezone</Label>
                <Select 
                  value={settings.default_timezone}
                  onValueChange={(value) => updateField('default_timezone', value)}
                >
                  <SelectTrigger className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 shadow-lg rounded-lg">
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">EST (US Eastern)</SelectItem>
                    <SelectItem value="pst">PST (US Pacific)</SelectItem>
                    <SelectItem value="gmt7">GMT+7 (Bangkok)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Email Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configure email notifications and templates</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">SMTP Host</Label>
                <Input 
                  value={settings.smtp_host}
                  onChange={(e) => updateField('smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">SMTP Port</Label>
                <Input 
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => updateField('smtp_port', parseInt(e.target.value) || 587)}
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">From Email</Label>
                <Input 
                  type="email"
                  value={settings.from_email}
                  onChange={(e) => updateField('from_email', e.target.value)}
                  placeholder="noreply@example.com"
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">From Name</Label>
                <Input 
                  value={settings.from_name}
                  onChange={(e) => updateField('from_name', e.target.value)}
                  className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings - PromptPay */}
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-5 w-5" />
              PromptPay QR Code
            </CardTitle>
            <CardDescription>
              Upload your PromptPay QR code from your banking app. This QR will be shown to guests at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={qrInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleQRUpload}
              className="hidden"
              id="qr-upload-admin"
            />

            {/* QR Code Upload */}
            <div className="space-y-4">
              <Label>QR Code Image</Label>
              
              {settings.promptpay_qr_url ? (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="flex justify-center">
                    <div className="relative p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                      <Image
                        src={settings.promptpay_qr_url}
                        alt="PromptPay QR Code"
                        width={200}
                        height={200}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* Replace button */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      disabled={isUploadingQR}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingQR ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4" />
                          Replace QR Code
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">QR Code uploaded</span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => qrInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {isUploadingQR ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <QrCode className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">
                        Upload your PromptPay QR Code
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Take a screenshot from your banking app
                      </p>
                      <p className="text-xs text-gray-400">
                        Supports: JPG, PNG, WEBP
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {/* How to get QR Code */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">How to get your QR Code:</p>
                    <ol className="mt-1 list-decimal list-inside text-xs space-y-1">
                      <li>Open your banking app (SCB, KBank, Bangkok Bank, etc.)</li>
                      <li>Go to &quot;Receive Money&quot; or &quot;My QR Code&quot;</li>
                      <li>Select PromptPay</li>
                      <li>Take a screenshot or save the QR image</li>
                      <li>Upload it here</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="promptpay_name">Account Name (optional)</Label>
              <Input
                id="promptpay_name"
                value={settings.promptpay_name}
                onChange={(e) => updateField('promptpay_name', e.target.value)}
                placeholder="Account holder name"
                className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg"
              />
              <p className="text-xs text-gray-400">Name displayed to guests when paying (helps them verify the recipient)</p>
            </div>

            {/* Platform Fee */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="platform_fee">Platform Fee (%)</Label>
              <Input 
                id="platform_fee"
                type="number"
                value={settings.platform_fee_percent}
                onChange={(e) => updateField('platform_fee_percent', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.5"
                className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg w-24"
              />
              <p className="text-xs text-gray-400">Percentage taken from each booking</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Security</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configure security and authentication settings</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Email Verification</div>
                <div className="text-xs text-gray-500 mt-0.5">All users must verify their email before booking</div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Always Required
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-xs text-gray-400 mt-0.5">Require 2FA for admin accounts</div>
              </div>
              <Switch
                checked={settings.require_2fa_admin}
                onCheckedChange={(checked) => updateField('require_2fa_admin', checked)}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configure admin notification preferences</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">New Tenant Registration</div>
                <div className="text-xs text-gray-400 mt-0.5">Get notified when a new tenant signs up</div>
              </div>
              <Switch
                checked={settings.notify_new_tenant}
                onCheckedChange={(checked) => updateField('notify_new_tenant', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Daily Summary</div>
                <div className="text-xs text-gray-400 mt-0.5">Receive daily platform summary email</div>
              </div>
              <Switch
                checked={settings.notify_daily_summary}
                onCheckedChange={(checked) => updateField('notify_daily_summary', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Error Alerts</div>
                <div className="text-xs text-gray-400 mt-0.5">Get notified of critical errors</div>
              </div>
              <Switch
                checked={settings.notify_errors}
                onCheckedChange={(checked) => updateField('notify_errors', checked)}
              />
            </div>
          </div>
        </div>

        {/* LINE Messaging Configuration */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">LINE Notifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">Receive notifications via LINE Messaging API</p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {/* Configuration Status */}
            {settings.line_channel_access_token && settings.line_user_id && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">LINE Messaging is configured</span>
              </div>
            )}

            {/* Channel Access Token */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Channel Access Token</Label>
              <Input 
                type="password"
                value={settings.line_channel_access_token}
                onChange={(e) => updateField('line_channel_access_token', e.target.value)}
                placeholder="Enter your LINE Channel Access Token"
                className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg font-mono"
              />
              <p className="text-xs text-gray-400">
                Get from{' '}
                <a 
                  href="https://developers.line.biz/console/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LINE Developers Console
                </a>
                {' '}→ Messaging API → Channel access token
              </p>
            </div>

            {/* LINE User ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Your LINE User ID</Label>
              <Input 
                value={settings.line_user_id}
                onChange={(e) => updateField('line_user_id', e.target.value)}
                placeholder="U1234567890abcdef..."
                className="h-9 bg-gray-50/50 border-gray-200 text-gray-900 text-sm rounded-lg font-mono"
              />
              <p className="text-xs text-gray-400">
                Your LINE User ID starts with &quot;U&quot; followed by 32 characters
              </p>
            </div>

            {/* When notifications are sent */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">You will receive LINE notifications for:</p>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      New host/tenant registration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      System errors and critical issues
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Monthly subscription payments from tenants
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How to set up LINE Messaging API:</p>
                  <ol className="mt-2 list-decimal list-inside text-xs space-y-1.5">
                    <li>Go to <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="underline">LINE Developers Console</a></li>
                    <li>Create a new provider (or select existing)</li>
                    <li>Create a &quot;Messaging API&quot; channel</li>
                    <li>In the Messaging API tab, issue a &quot;Channel access token&quot;</li>
                    <li>Add the bot as a friend using the QR code</li>
                    <li>Find your User ID in the &quot;Basic settings&quot; tab (under &quot;Your user ID&quot;)</li>
                    <li>Paste both values above and save</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Bottom Left */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
        <Button 
          onClick={handleSave}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        {saveStatus === 'success' && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {errorMessage || 'Failed to save'}
          </div>
        )}
      </div>
    </div>
  )
}
