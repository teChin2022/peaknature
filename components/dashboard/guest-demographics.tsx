'use client'

import { useEffect, useState } from 'react'
import { MapPin, Users, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/currency'
import { CurrencyCode } from '@/types/database'

interface GuestDemographicsProps {
  tenantId: string
  currency: CurrencyCode
  primaryColor: string
}

interface DemographicData {
  province: string
  guest_count: number
  booking_count: number
  total_revenue: number
}

export function GuestDemographics({ tenantId, currency, primaryColor }: GuestDemographicsProps) {
  const [data, setData] = useState<DemographicData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDemographics() {
      try {
        // Query profiles with bookings to get demographics
        const { data: profiles } = await supabase
          .from('profiles')
          .select('province')
          .eq('tenant_id', tenantId)
          .eq('role', 'guest')
          .not('province', 'is', null)

        if (!profiles) {
          setIsLoading(false)
          return
        }

        // Group by province
        const provinceMap = new Map<string, number>()
        profiles.forEach(p => {
          if (p.province) {
            provinceMap.set(p.province, (provinceMap.get(p.province) || 0) + 1)
          }
        })

        // Convert to array and sort
        const demographics: DemographicData[] = Array.from(provinceMap.entries())
          .map(([province, count]) => ({
            province,
            guest_count: count,
            booking_count: 0,
            total_revenue: 0
          }))
          .sort((a, b) => b.guest_count - a.guest_count)
          .slice(0, 10) // Top 10

        setData(demographics)
      } catch (err) {
        console.error('Error loading demographics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDemographics()
  }, [tenantId, supabase])

  const totalGuests = data.reduce((sum, d) => sum + d.guest_count, 0)

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Guest Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Guest Demographics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No location data yet</p>
            <p className="text-xs mt-1">Guest demographics will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
          Guest Demographics
        </CardTitle>
        <p className="text-xs text-gray-500">Where your guests are from</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = totalGuests > 0 
              ? Math.round((item.guest_count / totalGuests) * 100) 
              : 0

            return (
              <div key={item.province} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: index < 3 ? primaryColor : '#9ca3af' }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-700">{item.province}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>{item.guest_count}</span>
                    <span className="text-xs">({percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: index < 3 ? primaryColor : '#d1d5db'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total guests with location</span>
            <span className="font-semibold" style={{ color: primaryColor }}>
              {totalGuests}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

