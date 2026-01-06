import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoomForm } from '@/components/dashboard/room-form'

interface NewRoomPageProps {
  params: Promise<{ slug: string }>
}

async function getTenant(slug: string) {
  const supabase = await createClient()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  return tenant
}

export default async function NewRoomPage({ params }: NewRoomPageProps) {
  const { slug } = await params
  const tenant = await getTenant(slug)
  
  if (!tenant) {
    notFound()
  }

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
          <h1 className="text-2xl font-bold text-stone-900">Add New Room</h1>
          <p className="text-stone-600">Create a new room for your property</p>
        </div>
      </div>

      {/* Form */}
      <RoomForm tenant={tenant} mode="create" />
    </div>
  )
}

