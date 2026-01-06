import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoomForm } from '@/components/dashboard/room-form'

interface EditRoomPageProps {
  params: Promise<{ slug: string; roomId: string }>
}

async function getTenantAndRoom(slug: string, roomId: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (!tenant) return null

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('tenant_id', tenant.id)
    .single()

  if (!room) return null

  return { tenant, room }
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { slug, roomId } = await params
  const data = await getTenantAndRoom(slug, roomId)
  
  if (!data) {
    notFound()
  }

  const { tenant, room } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/${slug}/dashboard/rooms`}
          className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Edit Room</h1>
          <p className="text-stone-600">{room.name}</p>
        </div>
      </div>

      {/* Form */}
      <RoomForm tenant={tenant} room={room} mode="edit" />
    </div>
  )
}

