'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday,
  parseISO, addDays
} from 'date-fns'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, 
  BedDouble, Loader2, Ban, Check, X, Users, ArrowRight, ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Booking, Room } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

interface BookingWithRoom extends Booking {
  room?: Room
  user?: { full_name?: string; email?: string }
}

interface BlockedDate {
  id: string
  room_id: string
  date: string
  is_blocked: boolean
  price_override?: number
}

export default function CalendarPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  const t = useTranslations('dashboard.calendar')
  const tCommon = useTranslations('common')
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('agenda')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<BookingWithRoom[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [blockingDate, setBlockingDate] = useState<Date | null>(null)
  const [blockingRoom, setBlockingRoom] = useState<string>('')
  const [isBlocking, setIsBlocking] = useState(false)
  
  const primaryColor = '#3B82F6' // Will be updated from tenant

  // Cache tenant ID to avoid refetching
  const [cachedTenantId, setCachedTenantId] = useState<string | null>(null)

  // Fetch tenant once on mount
  useEffect(() => {
    async function fetchTenant() {
      if (cachedTenantId) return // Already have tenant
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, primary_color')
        .eq('slug', slug)
        .single()
      
      if (tenant) {
        setTenantId(tenant.id)
        setCachedTenantId(tenant.id)
      }
    }
    
    fetchTenant()
  }, [slug, cachedTenantId]) // Remove supabase from deps - it's stable

  // Fetch calendar data when tenant is ready or month changes
  useEffect(() => {
    if (!cachedTenantId) return
    
    async function fetchCalendarData() {
      setIsLoading(true)
      
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const monthStartStr = monthStart.toISOString().split('T')[0]
      const monthEndStr = monthEnd.toISOString().split('T')[0]
      
      // Fetch ALL data in parallel - including blocked dates
      // We fetch rooms first to get IDs, but we can optimize by fetching bookings at the same time
      const [roomsResult, bookingsResult] = await Promise.all([
        supabase
          .from('rooms')
          .select('id, name, base_price') // Only select needed columns
          .eq('tenant_id', cachedTenantId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('bookings')
          .select(`
            id, room_id, check_in, check_out, guests, status, tenant_id,
            room:rooms!inner(id, name),
            user:profiles(full_name, email)
          `)
          .eq('tenant_id', cachedTenantId)
          .gte('check_out', monthStartStr)
          .lte('check_in', monthEndStr)
          .in('status', ['confirmed', 'pending'])
          .order('check_in')
      ])
      
      const roomsData = (roomsResult.data || []) as Room[]
      setRooms(roomsData)
      setBookings(bookingsResult.data || [])
      
      // Now fetch blocked dates with room IDs
      if (roomsData.length > 0) {
        const { data: blockedData } = await supabase
          .from('room_availability')
          .select('id, room_id, date, is_blocked, price_override')
          .in('room_id', roomsData.map(r => r.id))
          .eq('is_blocked', true)
          .gte('date', monthStartStr)
          .lte('date', monthEndStr)
        
        setBlockedDates(blockedData || [])
      } else {
        setBlockedDates([])
      }
      
      setIsLoading(false)
    }
    
    fetchCalendarData()
  }, [cachedTenantId, currentDate]) // Remove supabase - it's stable

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  // Filter bookings by room
  const filteredBookings = useMemo(() => {
    if (selectedRoom === 'all') return bookings
    return bookings.filter(b => b.room_id === selectedRoom)
  }, [bookings, selectedRoom])

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return filteredBookings.filter(booking => {
      const checkIn = booking.check_in
      const checkOut = booking.check_out
      return dateStr >= checkIn && dateStr < checkOut
    })
  }

  // Get blocked dates for a specific date
  const getBlockedForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return blockedDates.filter(b => b.date === dateStr && (selectedRoom === 'all' || b.room_id === selectedRoom))
  }

  // Check if date has any activity
  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dateBookings = getBookingsForDate(date)
    const dateBlocked = getBlockedForDate(date)
    
    // Check-out needs to look at all filtered bookings, not just dateBookings
    // because getBookingsForDate excludes the checkout date
    const checkOutBookings = filteredBookings.filter(b => b.check_out === dateStr)
    
    return {
      hasBookings: dateBookings.length > 0 || checkOutBookings.length > 0,
      hasBlocked: dateBlocked.length > 0,
      bookings: dateBookings,
      blocked: dateBlocked,
      isCheckIn: dateBookings.some(b => b.check_in === dateStr),
      isCheckOut: checkOutBookings.length > 0,
      checkOutBookings: checkOutBookings
    }
  }

  // Handle block/unblock date
  const handleBlockDate = async () => {
    if (!blockingDate || !blockingRoom || !tenantId) return
    
    setIsBlocking(true)
    const dateStr = format(blockingDate, 'yyyy-MM-dd')
    
    // Check if already blocked
    const existingBlock = blockedDates.find(
      b => b.date === dateStr && b.room_id === blockingRoom
    )
    
    try {
      if (existingBlock) {
        // Unblock
        const { error } = await supabase
          .from('room_availability')
          .delete()
          .eq('id', existingBlock.id)
        
        if (error) {
          console.error('Error unblocking date:', error)
          alert(`Failed to unblock date: ${error.message}`)
        } else {
          setBlockedDates(prev => prev.filter(b => b.id !== existingBlock.id))
        }
      } else {
        // Block - first check if it already exists (might be from another session)
        const { data: existing } = await supabase
          .from('room_availability')
          .select('*')
          .eq('room_id', blockingRoom)
          .eq('date', dateStr)
          .single()
        
        if (existing) {
          // Already exists, update it
          const { data, error } = await supabase
            .from('room_availability')
            .update({ is_blocked: true })
            .eq('id', existing.id)
            .select()
            .single()
          
          if (error) {
            console.error('Error updating block:', error)
            alert(`Failed to block date: ${error.message}`)
          } else if (data) {
            setBlockedDates(prev => [...prev.filter(b => b.id !== existing.id), data])
          }
        } else {
          // Create new
          const { data, error } = await supabase
            .from('room_availability')
            .insert({
              room_id: blockingRoom,
              date: dateStr,
              is_blocked: true
            })
            .select()
            .single()
          
          if (error) {
            console.error('Error blocking date:', error)
            alert(`Failed to block date: ${error.message}`)
          } else if (data) {
            setBlockedDates(prev => [...prev, data])
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred')
    }
    
    setIsBlocking(false)
    setShowBlockDialog(false)
    setBlockingDate(null)
    setBlockingRoom('')
  }

  // Open block dialog
  const openBlockDialog = (date: Date, roomId?: string) => {
    setBlockingDate(date)
    setBlockingRoom(roomId || (rooms[0]?.id || ''))
    setShowBlockDialog(true)
  }

  // Navigate months
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Group bookings by date for agenda view
  const agendaItems = useMemo(() => {
    const items: { date: Date; checkIns: BookingWithRoom[]; checkOuts: BookingWithRoom[]; staying: BookingWithRoom[] }[] = []
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const checkIns = filteredBookings.filter(b => b.check_in === dateStr)
      const checkOuts = filteredBookings.filter(b => b.check_out === dateStr)
      const staying = filteredBookings.filter(b => {
        return dateStr > b.check_in && dateStr < b.check_out
      })
      
      if (checkIns.length > 0 || checkOuts.length > 0 || (isToday(day) && staying.length > 0)) {
        items.push({ date: day, checkIns, checkOuts, staying })
      }
    })
    
    return items
  }, [filteredBookings, currentDate])

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-56" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Calendar Skeleton */}
          <Card className="lg:col-span-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Skeleton */}
          <div className="space-y-4 md:space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitleFull')}</p>
        </div>
        
        {/* View Toggle - Mobile */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-white p-1">
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'agenda' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('agenda')}</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('title')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
            {t('today')}
          </Button>
        </div>
        
        {/* Room Filter */}
        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white">
            <BedDouble className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder={t('allRooms')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRooms')}</SelectItem>
            {rooms.map(room => (
              <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {agendaItems.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">{t('noBookingsThisMonth')}</p>
              </CardContent>
            </Card>
          ) : (
            agendaItems.map(({ date, checkIns, checkOuts, staying }) => (
              <Card key={date.toISOString()} className="bg-white overflow-hidden">
                <CardHeader className={`py-3 px-4 ${isToday(date) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                        {isToday(date) ? 'Today' : format(date, 'EEEE')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(date, 'MMM d')}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openBlockDialog(date)}
                      className="text-xs"
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      {t('block')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-2">
                  {/* Check-ins */}
                  {checkIns.map(booking => (
                    <div key={`in-${booking.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-100">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.user?.full_name || booking.user?.email || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {booking.room?.name || 'Room'}
                          <span className="mx-1">•</span>
                          <Users className="h-3 w-3" />
                          {booking.guests}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        {t('checkIn')}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Check-outs */}
                  {checkOuts.map(booking => (
                    <div key={`out-${booking.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100">
                        <ArrowLeft className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.user?.full_name || booking.user?.email || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {booking.room?.name || 'Room'}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                        {t('checkOut')}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Currently staying (only show on today) */}
                  {isToday(date) && staying.map(booking => (
                    <div key={`stay-${booking.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                        <BedDouble className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.user?.full_name || booking.user?.email || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Until {format(parseISO(booking.check_out), 'MMM d')}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        {t('staying')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Calendar Grid View */}
      {viewMode === 'calendar' && (
        <Card className="bg-white overflow-hidden">
          <CardContent className="p-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((day, index) => (
                <div key={index} className="py-2 text-center text-xs font-medium text-gray-500">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const status = getDateStatus(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(day)
                      // Always open block dialog - it handles both blocking and unblocking
                      openBlockDialog(day)
                    }}
                    className={`
                      relative min-h-[60px] sm:min-h-[80px] md:min-h-[100px] p-1 border-b border-r text-left
                      transition-colors hover:bg-gray-50
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                      ${isToday(day) ? 'bg-blue-50' : ''}
                    `}
                  >
                    {/* Date Number */}
                    <span className={`
                      inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-xs sm:text-sm
                      ${isToday(day) ? 'bg-blue-600 text-white font-bold' : ''}
                      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Status Indicators */}
                    <div className="mt-1 space-y-0.5">
                      {status.hasBlocked && (
                        <div className="flex items-center gap-0.5">
                          <Ban className="h-3 w-3 text-red-500" />
                          <span className="text-[10px] text-red-500 hidden sm:inline">{t('blocked')}</span>
                        </div>
                      )}
                      
                      {status.isCheckIn && (
                        <div className="flex items-center gap-0.5">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-[10px] text-green-600 hidden sm:inline truncate">
                            {status.bookings.filter(b => b.check_in === format(day, 'yyyy-MM-dd')).length} in
                          </span>
                        </div>
                      )}
                      
                      {status.isCheckOut && (
                        <div className="flex items-center gap-0.5">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <span className="text-[10px] text-orange-600 hidden sm:inline truncate">
                            {status.checkOutBookings?.length || 0} out
                          </span>
                        </div>
                      )}
                      
                      {status.hasBookings && !status.isCheckIn && !status.isCheckOut && (
                        <div className="flex items-center gap-0.5">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-[10px] text-blue-600 hidden sm:inline">{t('occupied')}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>{t('checkIn')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span>{t('checkOut')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>{t('occupied')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ban className="h-3 w-3 text-red-500" />
          <span>{t('blocked')}</span>
        </div>
      </div>

      {/* Block Date Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('blockDate')}</DialogTitle>
            <DialogDescription>
              {t('blockDateFor', { date: blockingDate ? format(blockingDate, 'MMMM d, yyyy') : '' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('selectRoom')}</label>
              <Select value={blockingRoom} onValueChange={setBlockingRoom}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRoom')} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => {
                    const isBlocked = blockingDate && blockedDates.some(
                      b => b.room_id === room.id && b.date === format(blockingDate, 'yyyy-MM-dd')
                    )
                    return (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          {room.name}
                          {isBlocked && <Badge variant="destructive" className="text-[10px] h-4">Blocked</Badge>}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {blockingDate && blockingRoom && blockedDates.some(
              b => b.room_id === blockingRoom && b.date === format(blockingDate, 'yyyy-MM-dd')
            ) && (
              <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                {t('roomAlreadyBlocked')}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleBlockDate}
              disabled={isBlocking || !blockingRoom}
              className={
                blockingDate && blockingRoom && blockedDates.some(
                  b => b.room_id === blockingRoom && b.date === format(blockingDate, 'yyyy-MM-dd')
                ) ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isBlocking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : blockingDate && blockingRoom && blockedDates.some(
                b => b.room_id === blockingRoom && b.date === format(blockingDate, 'yyyy-MM-dd')
              ) ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('unblock')}
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  {t('blockDate')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

