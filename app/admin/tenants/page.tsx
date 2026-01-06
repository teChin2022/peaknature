import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Filter, Building2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddTenantDialog } from '@/components/admin/add-tenant-dialog'
import { TenantActions } from '@/components/admin/tenant-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { Pagination } from '@/components/ui/pagination'
import { paginateData } from '@/lib/pagination'

const ITEMS_PER_PAGE = 10

interface TenantsPageProps {
  searchParams: Promise<{ status?: string; plan?: string; search?: string; page?: string }>
}

async function getTenants(filters: { status?: string; plan?: string; search?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'inactive' || filters.status === 'pending') {
    query = query.eq('is_active', false)
  }

  if (filters.plan && filters.plan !== 'all') {
    query = query.eq('plan', filters.plan)
  }

  const { data: tenants } = await query

  // Filter by search if provided
  let filteredTenants = tenants || []
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filteredTenants = filteredTenants.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.slug.toLowerCase().includes(searchLower)
    )
  }

  return filteredTenants
}

async function getPendingCount() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', false)
  
  return count || 0
}

const planColors = {
  free: 'bg-gray-400',
  pro: 'bg-indigo-500',
}

export default async function AdminTenantsPage({ searchParams }: TenantsPageProps) {
  const { status, plan, search, page: pageParam } = await searchParams
  const tenants = await getTenants({ status, plan, search })
  const pendingCount = await getPendingCount()

  // Pagination
  const page = pageParam ? parseInt(pageParam) : 1
  const { items: paginatedTenants, currentPage, totalPages, totalItems, itemsPerPage } = paginateData(tenants, page, ITEMS_PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all homestay properties on the platform</p>
        </div>
        <AddTenantDialog />
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && !status && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-amber-50/80 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">
                {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600">
                New property registrations waiting for review
              </p>
            </div>
          </div>
          <Link href="/admin/tenants?status=pending">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs h-8">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="search"
              placeholder="Search tenants..."
              defaultValue={search || ''}
              className="pl-9 h-9 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-lg"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select name="status" defaultValue={status || 'all'}>
              <SelectTrigger className="w-[120px] h-9 bg-gray-50/50 border-gray-200 text-gray-700 text-sm rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-lg rounded-lg">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select name="plan" defaultValue={plan || 'all'}>
              <SelectTrigger className="w-[120px] h-9 bg-gray-50/50 border-gray-200 text-gray-700 text-sm rounded-lg">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-lg rounded-lg">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" className="h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg shadow-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Tenants - Mobile Cards / Desktop Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {tenants.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-50">
              {paginatedTenants.map((tenant) => (
                <div key={tenant.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm"
                        style={{ backgroundColor: tenant.primary_color }}
                      >
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <code className="text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                          /{tenant.slug}
                        </code>
                      </div>
                    </div>
                    <TenantActions tenant={tenant} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${planColors[tenant.plan as keyof typeof planColors]} text-white`}>
                      {tenant.plan}
                    </span>
                    {tenant.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                        <XCircle className="h-2.5 w-2.5" />
                        Inactive
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {format(parseISO(tenant.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-50 bg-gray-50/50">
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</TableHead>
                    <TableHead className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenants.map((tenant) => (
                    <TableRow key={tenant.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm"
                            style={{ backgroundColor: tenant.primary_color }}
                          >
                            {tenant.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          /{tenant.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${planColors[tenant.plan as keyof typeof planColors]} text-white`}>
                          {tenant.plan}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tenant.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                            <XCircle className="h-2.5 w-2.5" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(parseISO(tenant.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <TenantActions tenant={tenant} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                variant="light"
              />
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No tenants found</h3>
            <p className="text-sm text-gray-500">
              {search || status || plan ? 'Try adjusting your filters' : 'No properties registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

