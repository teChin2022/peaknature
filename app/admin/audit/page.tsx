import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, User, Building2, Settings, CreditCard, AlertTriangle,
  CheckCircle, XCircle, Clock, Activity, Filter
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Pagination } from '@/components/ui/pagination'
import { AuditLogFilters } from '@/components/admin/audit-log-filters'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 25

interface AuditLog {
  id: string
  created_at: string
  action: string
  category: string
  severity: string
  actor_id: string | null
  actor_email: string | null
  actor_role: string | null
  actor_ip: string | null
  target_type: string | null
  target_id: string | null
  target_name: string | null
  tenant_id: string | null
  details: Record<string, unknown> | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  success: boolean
  error_message: string | null
}

interface PageProps {
  searchParams: Promise<{ 
    page?: string
    category?: string
    severity?: string
    action?: string
  }>
}

const categoryIcons: Record<string, React.ElementType> = {
  admin: Shield,
  security: AlertTriangle,
  user: User,
  system: Settings,
}

const categoryColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  security: 'bg-red-100 text-red-700 border-red-200',
  user: 'bg-blue-100 text-blue-700 border-blue-200',
  system: 'bg-gray-100 text-gray-700 border-gray-200',
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
}

const targetIcons: Record<string, React.ElementType> = {
  tenant: Building2,
  user: User,
  booking: CreditCard,
  settings: Settings,
}

async function getAuditLogs(page: number, filters: { category?: string; severity?: string; action?: string }) {
  const supabase = await createClient()
  
  // Verify super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'super_admin') return null
  
  // Build query
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)
  
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters.severity && filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }
  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`)
  }
  
  const { data: logs, count, error } = await query
  
  if (error) {
    console.error('Error fetching audit logs:', error)
    return { logs: [], total: 0, page, totalPages: 0 }
  }
  
  // Get stats
  const [
    { count: totalCount },
    { count: adminCount },
    { count: securityCount },
    { count: todayCount }
  ] = await Promise.all([
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('category', 'admin'),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('category', 'security'),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
  ])
  
  return {
    logs: logs || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    stats: {
      total: totalCount || 0,
      admin: adminCount || 0,
      security: securityCount || 0,
      today: todayCount || 0,
    }
  }
}

function formatAction(action: string): string {
  // Convert action.name to "Action Name"
  return action
    .split('.')
    .map(part => part.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
    .join(' → ')
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const filters = {
    category: params.category,
    severity: params.severity,
    action: params.action,
  }
  
  const data = await getAuditLogs(page, filters)
  
  if (!data) {
    redirect('/admin/login')
  }
  
  const { logs, total, totalPages, stats } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track all admin actions and security events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admin Actions</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.admin.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Security Events</p>
                <p className="text-2xl font-bold text-red-600">{stats?.security.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.today.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AuditLogFilters currentFilters={filters} />

      {/* Logs List */}
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium text-gray-900">Event History</CardTitle>
              <CardDescription className="text-gray-500">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} of {total} events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              <p className="text-sm text-gray-400 mt-1">Audit events will appear here as they occur</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log: AuditLog) => {
                const CategoryIcon = categoryIcons[log.category] || Activity
                const TargetIcon = targetIcons[log.target_type || ''] || Activity
                
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatAction(log.action)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={`${categoryColors[log.category]} border text-xs`}>
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {log.category}
                              </Badge>
                              <Badge className={`${severityColors[log.severity]} text-xs`}>
                                {log.severity}
                              </Badge>
                              {log.target_type && (
                                <Badge variant="outline" className="text-xs text-gray-600">
                                  <TargetIcon className="h-3 w-3 mr-1" />
                                  {log.target_name || log.target_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <time className="text-xs text-gray-500 whitespace-nowrap">
                            {format(parseISO(log.created_at), 'MMM d, yyyy h:mm a')}
                          </time>
                        </div>

                        {/* Details */}
                        <div className="mt-2 text-sm text-gray-500">
                          {log.actor_email && (
                            <span className="mr-4">
                              <span className="font-medium">By:</span> {log.actor_email}
                            </span>
                          )}
                          {log.actor_ip && (
                            <span className="mr-4">
                              <span className="font-medium">IP:</span> {log.actor_ip}
                            </span>
                          )}
                        </div>

                        {/* Error message */}
                        {log.error_message && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            {log.error_message}
                          </div>
                        )}

                        {/* Changes */}
                        {(log.old_value || log.new_value) && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              View changes
                            </summary>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              {log.old_value && (
                                <div className="p-2 bg-red-50 rounded">
                                  <span className="font-medium text-red-700">Before:</span>
                                  <pre className="mt-1 text-red-600 overflow-x-auto">
                                    {JSON.stringify(log.old_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div className="p-2 bg-green-50 rounded">
                                  <span className="font-medium text-green-700">After:</span>
                                  <pre className="mt-1 text-green-600 overflow-x-auto">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
          baseUrl="/admin/audit"
          variant="light"
        />
      )}
    </div>
  )
}

