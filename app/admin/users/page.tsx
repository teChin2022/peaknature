import { createClient } from '@/lib/supabase/server'
import { Search, Filter, Shield, User, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserActions } from '@/components/admin/user-actions'
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

const ITEMS_PER_PAGE = 15

interface UsersPageProps {
  searchParams: Promise<{ role?: string; search?: string; page?: string }>
}

async function getUsers(filters: { role?: string; search?: string }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('profiles')
    .select(`
      *,
      tenant:tenants(name, slug)
    `)
    .order('created_at', { ascending: false })

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  const { data: users } = await query

  // Filter by search if provided
  let filteredUsers = users || []
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filteredUsers = filteredUsers.filter((u: { email?: string; full_name?: string | null }) => 
      u.email?.toLowerCase().includes(searchLower) ||
      u.full_name?.toLowerCase().includes(searchLower)
    )
  }

  return filteredUsers
}

const roleColors = {
  super_admin: 'bg-violet-500',
  host: 'bg-indigo-500',
  guest: 'bg-gray-400',
}

const roleIcons = {
  super_admin: Shield,
  host: Building2,
  guest: User,
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const { role, search, page: pageParam } = await searchParams
  const users = await getUsers({ role, search })

  // Pagination
  const page = pageParam ? parseInt(pageParam) : 1
  const { items: paginatedUsers, currentPage, totalPages, totalItems, itemsPerPage } = paginateData(users, page, ITEMS_PER_PAGE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all users across the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              name="search"
              placeholder="Search users..."
              defaultValue={search || ''}
              className="pl-9 h-9 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Select name="role" defaultValue={role || 'all'}>
              <SelectTrigger className="w-[130px] h-9 bg-gray-50/50 border-gray-200 text-gray-700 text-sm rounded-lg">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-lg rounded-lg">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" className="h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg shadow-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {users.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-50 bg-gray-50/50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</TableHead>
                  <TableHead className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: { id: string; email: string; full_name?: string | null; role: string; is_blocked: boolean; created_at: string; tenant?: { name?: string } | null }) => {
                  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User
                  return (
                    <TableRow key={user.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${roleColors[user.role as keyof typeof roleColors]} text-white`}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {user.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.tenant ? (
                          <span className="text-sm text-gray-700">{user.tenant.name}</span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_blocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(parseISO(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions user={user} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
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
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-sm text-gray-500">
              {search || role ? 'Try adjusting your filters' : 'No users registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

