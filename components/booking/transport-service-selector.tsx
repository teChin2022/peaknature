'use client'

import { useState, useEffect } from 'react'
import { Car, MapPin, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TenantSettings, CurrencyCode } from '@/types/database'
import { formatPrice } from '@/lib/currency'

export interface TransportSelections {
  pickupRequested: boolean
  pickupLocation: string
  pickupTime: string
  pickupPrice: number
  dropoffRequested: boolean
  dropoffLocation: string
  dropoffTime: string
  dropoffPrice: number
  // Formatted text for notes field
  formattedNote: string
}

interface TransportServiceSelectorProps {
  settings: TenantSettings
  currency: CurrencyCode
  primaryColor: string
  onChange: (selections: TransportSelections) => void
}

export function TransportServiceSelector({
  settings,
  currency,
  primaryColor,
  onChange,
}: TransportServiceSelectorProps) {
  const transport = settings.transport || {
    pickup_enabled: false,
    pickup_price: 0,
    pickup_description: '',
    dropoff_enabled: false,
    dropoff_price: 0,
    dropoff_description: '',
  }

  const [pickupRequested, setPickupRequested] = useState(false)
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [dropoffRequested, setDropoffRequested] = useState(false)
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [dropoffTime, setDropoffTime] = useState('')

  // Generate formatted note for transport requests
  const generateFormattedNote = (): string => {
    if (!pickupRequested && !dropoffRequested) return ''
    
    let note = '🚗 TRANSPORT SERVICES REQUESTED:\n'
    
    if (pickupRequested) {
      const location = pickupLocation || 'Location to be confirmed'
      const time = pickupTime || 'Time to be confirmed'
      note += `• Pickup: ${location} at ${time} (+${formatPrice(transport.pickup_price, currency)})\n`
    }
    
    if (dropoffRequested) {
      const location = dropoffLocation || 'Location to be confirmed'
      const time = dropoffTime || 'Time to be confirmed'
      note += `• Drop-off: ${location} at ${time} (+${formatPrice(transport.dropoff_price, currency)})\n`
    }
    
    return note
  }

  // Notify parent of changes
  useEffect(() => {
    onChange({
      pickupRequested,
      pickupLocation,
      pickupTime,
      pickupPrice: pickupRequested ? transport.pickup_price : 0,
      dropoffRequested,
      dropoffLocation,
      dropoffTime,
      dropoffPrice: dropoffRequested ? transport.dropoff_price : 0,
      formattedNote: generateFormattedNote(),
    })
  }, [pickupRequested, pickupLocation, pickupTime, dropoffRequested, dropoffLocation, dropoffTime, transport.pickup_price, transport.dropoff_price, currency, onChange])

  // If neither service is enabled, don't render anything
  if (!transport.pickup_enabled && !transport.dropoff_enabled) {
    return null
  }

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Car className="h-5 w-5" style={{ color: primaryColor }} />
          Transport Services
          <span className="text-xs font-normal text-stone-500">(Optional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pickup Service */}
        {transport.pickup_enabled && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="pickup"
                checked={pickupRequested}
                onCheckedChange={(checked) => setPickupRequested(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="pickup" 
                  className="text-sm font-medium cursor-pointer flex items-center justify-between"
                >
                  <span>Pickup Service</span>
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    +{formatPrice(transport.pickup_price, currency)}
                  </span>
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  {transport.pickup_description || 'From airport/train station'}
                </p>
              </div>
            </div>

            {pickupRequested && (
              <div className="ml-6 space-y-3 p-3 bg-stone-50 rounded-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="pickup_location" className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Pickup Location
                  </Label>
                  <Input
                    id="pickup_location"
                    placeholder="e.g., Suvarnabhumi Airport, Gate 3"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pickup_time" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Arrival Time
                  </Label>
                  <Input
                    id="pickup_time"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Divider if both enabled */}
        {transport.pickup_enabled && transport.dropoff_enabled && (
          <div className="border-t border-stone-200" />
        )}

        {/* Dropoff Service */}
        {transport.dropoff_enabled && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="dropoff"
                checked={dropoffRequested}
                onCheckedChange={(checked) => setDropoffRequested(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="dropoff" 
                  className="text-sm font-medium cursor-pointer flex items-center justify-between"
                >
                  <span>Drop-off Service</span>
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    +{formatPrice(transport.dropoff_price, currency)}
                  </span>
                </Label>
                <p className="text-xs text-stone-500 mt-0.5">
                  {transport.dropoff_description || 'To airport/train station'}
                </p>
              </div>
            </div>

            {dropoffRequested && (
              <div className="ml-6 space-y-3 p-3 bg-stone-50 rounded-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="dropoff_location" className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Drop-off Location
                  </Label>
                  <Input
                    id="dropoff_location"
                    placeholder="e.g., Don Mueang Airport, Terminal 2"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dropoff_time" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Departure Time
                  </Label>
                  <Input
                    id="dropoff_time"
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {(pickupRequested || dropoffRequested) && (
          <div className="pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Transport Total</span>
              <span className="font-semibold" style={{ color: primaryColor }}>
                +{formatPrice(
                  (pickupRequested ? transport.pickup_price : 0) + 
                  (dropoffRequested ? transport.dropoff_price : 0),
                  currency
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

