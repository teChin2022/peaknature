'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Loader2, Plus, X,
  Wifi, Car, Coffee, Tv, Wind, Utensils, Bath,
  DoorOpen, Waves, Dumbbell, Leaf, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Room, Tenant } from '@/types/database'
import { RoomImageUpload } from './room-image-upload'
import { useTranslations } from 'next-intl'

// Common amenities with icons - labels will be translated
const COMMON_AMENITIES = [
  { id: 'wifi', labelKey: 'amenityWifi', icon: Wifi },
  { id: 'parking', labelKey: 'amenityParking', icon: Car },
  { id: 'breakfast', labelKey: 'amenityBreakfast', icon: Coffee },
  { id: 'tv', labelKey: 'amenityTv', icon: Tv },
  { id: 'ac', labelKey: 'amenityAc', icon: Wind },
  { id: 'kitchen', labelKey: 'amenityKitchen', icon: Utensils },
  { id: 'private_bathroom', labelKey: 'amenityBathroom', icon: Bath },
  { id: 'balcony', labelKey: 'amenityBalcony', icon: DoorOpen },
  { id: 'pool', labelKey: 'amenityPool', icon: Waves },
  { id: 'gym', labelKey: 'amenityGym', icon: Dumbbell },
  { id: 'garden', labelKey: 'amenityGarden', icon: Leaf },
  { id: 'safe', labelKey: 'amenitySafe', icon: Shield },
]

const roomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  description: z.string().optional(),
  base_price: z.coerce.number().min(1, 'Price must be at least $1'),
  max_guests: z.coerce.number().min(1, 'Must allow at least 1 guest').max(20, 'Maximum 20 guests'),
  min_nights: z.coerce.number().min(1, 'Minimum 1 night'),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  is_active: z.boolean(),
})

type RoomFormData = z.infer<typeof roomSchema>

interface RoomFormProps {
  tenant: Tenant
  room?: Room
  mode: 'create' | 'edit'
}

export function RoomForm({ tenant, room, mode }: RoomFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('dashboard.roomForm')
  const tCommon = useTranslations('common')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Images state
  const [images, setImages] = useState<string[]>(room?.images || [])
  
  // Amenities state
  const [amenities, setAmenities] = useState<string[]>(room?.amenities || [])
  
  // Rules state
  const [rules, setRules] = useState<string[]>(room?.rules || [])
  const [newRule, setNewRule] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name || '',
      description: room?.description || '',
      base_price: room?.base_price || 100,
      max_guests: room?.max_guests || 2,
      min_nights: room?.min_nights || 1,
      check_in_time: room?.check_in_time || '14:00',
      check_out_time: room?.check_out_time || '11:00',
      is_active: room?.is_active ?? true,
    },
  })

  const toggleAmenity = (amenityId: string) => {
    if (amenities.includes(amenityId)) {
      setAmenities(amenities.filter(a => a !== amenityId))
    } else {
      setAmenities([...amenities, amenityId])
    }
  }

  const addRule = () => {
    if (newRule.trim() && !rules.includes(newRule.trim())) {
      setRules([...rules, newRule.trim()])
      setNewRule('')
    }
  }

  const removeRule = (rule: string) => {
    setRules(rules.filter(r => r !== rule))
  }

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const roomData = {
        ...data,
        tenant_id: tenant.id,
        images,
        amenities,
        rules,
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('rooms')
          .insert(roomData)

        if (insertError) throw insertError
      } else if (room) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', room.id)

        if (updateError) throw updateError
      }

      router.push(`/${tenant.slug}/dashboard/rooms`)
      router.refresh()
    } catch (err) {
      console.error('Error saving room:', err)
      setError(t('failedToSave'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('basicInfo')}</CardTitle>
          <CardDescription>
            {t('basicInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('roomName')} *</Label>
              <Input
                id="name"
                placeholder={t('roomNamePlaceholder')}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">{t('pricePerNight')} *</Label>
              <Input
                id="base_price"
                type="number"
                min="1"
                step="0.01"
                {...register('base_price')}
              />
              {errors.base_price && (
                <p className="text-sm text-red-500">{errors.base_price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('descriptionPlaceholder')}
              rows={4}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_guests">{t('maxGuests')} *</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                max="20"
                {...register('max_guests')}
              />
              {errors.max_guests && (
                <p className="text-sm text-red-500">{errors.max_guests.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_nights">{t('minNights')} *</Label>
              <Input
                id="min_nights"
                type="number"
                min="1"
                {...register('min_nights')}
              />
              {errors.min_nights && (
                <p className="text-sm text-red-500">{errors.min_nights.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="text-base">{t('activeLabel')}</Label>
                <p className="text-sm text-stone-500">{t('showOnPublicSite')}</p>
              </div>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in/Check-out Times */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkInCheckOut')}</CardTitle>
          <CardDescription>
            {t('checkInCheckOutDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_time">{t('checkInTime')}</Label>
              <Input
                id="check_in_time"
                type="time"
                {...register('check_in_time')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_time">{t('checkOutTime')}</Label>
              <Input
                id="check_out_time"
                type="time"
                {...register('check_out_time')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>{t('images')}</CardTitle>
          <CardDescription>
            {t('imagesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomImageUpload
            tenantId={tenant.id}
            roomId={room?.id}
            images={images}
            onImagesChange={setImages}
            primaryColor={tenant.primary_color}
          />
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>{t('amenities')}</CardTitle>
          <CardDescription>
            {t('amenitiesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COMMON_AMENITIES.map((amenity) => {
              const isSelected = amenities.includes(amenity.id)
              const Icon = amenity.icon
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 hover:border-stone-300 text-stone-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{t(amenity.labelKey as keyof typeof t)}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* House Rules */}
      <Card>
        <CardHeader>
          <CardTitle>{t('houseRules')}</CardTitle>
          <CardDescription>
            {t('houseRulesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rules List */}
          {rules.length > 0 && (
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                >
                  <span className="text-sm">{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeRule(rule)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add Rule */}
          <div className="flex gap-2">
            <Input
              placeholder={t('rulePlaceholder')}
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            />
            <Button type="button" variant="outline" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              {t('add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="text-white min-w-[120px]"
          style={{ backgroundColor: tenant.primary_color }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : mode === 'create' ? (
            t('createRoom')
          ) : (
            t('saveChanges')
          )}
        </Button>
      </div>
    </form>
  )
}

