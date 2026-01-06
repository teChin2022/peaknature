import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Cookie, CheckCircle2, XCircle, Globe, Monitor, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 20

interface ConsentLog {
  id: string
  user_id: string | null
  session_id: string | null
  consent_status: 'accepted' | 'declined'
  consent_categories: Record<string, boolean>
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  page_url: string | null
  country_code: string | null
  region: string | null
  privacy_policy_version: string
  created_at: string
  profiles?: {
    email: string
    full_name: string | null
  } | null
}

interface ConsentPageProps {
  searchParams: Promise<{ page?: string }>
}

async function getConsentData(page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  // Get total count and stats in parallel
  const [logsResult, totalCountResult, acceptedCountResult, declinedCountResult, todayCountResult] = await Promise.all([
    // Paginated logs with user info
    supabase
      .from('cookie_consent_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1),
    
    // Total count
    supabase
      .from('cookie_consent_logs')
      .select('*', { count: 'exact', head: true }),
    
    // Accepted count
    supabase
      .from('cookie_consent_logs')
      .select('*', { count: 'exact', head: true })
      .eq('consent_status', 'accepted'),
    
    // Declined count
    supabase
      .from('cookie_consent_logs')
      .select('*', { count: 'exact', head: true })
      .eq('consent_status', 'declined'),
    
    // Today's count
    supabase
      .from('cookie_consent_logs')
      .select('consent_status', { count: 'exact' })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  if (logsResult.error) {
    console.error('Error fetching consent logs:', logsResult.error)
    return { logs: [], stats: null, totalCount: 0 }
  }

  const totalLogs = totalCountResult.count || 0
  const acceptedCount = acceptedCountResult.count || 0
  const declinedCount = declinedCountResult.count || 0
  const acceptanceRate = totalLogs > 0 ? ((acceptedCount / totalLogs) * 100).toFixed(1) : '0'

  // Calculate today's stats
  const todayLogs = todayCountResult.data || []
  const todayAccepted = todayLogs.filter((l: { consent_status: string }) => l.consent_status === 'accepted').length
  const todayDeclined = todayLogs.filter((l: { consent_status: string }) => l.consent_status === 'declined').length

  return {
    logs: logsResult.data || [],
    totalCount: totalLogs,
    stats: {
      total: totalLogs,
      accepted: acceptedCount,
      declined: declinedCount,
      acceptanceRate,
      todayTotal: todayLogs.length,
      todayAccepted,
      todayDeclined,
    }
  }
}

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' }
  
  let browser = 'Unknown'
  let os = 'Unknown'

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return { browser, os }
}

export default async function ConsentLogsPage({ searchParams }: ConsentPageProps) {
  const { page: pageParam } = await searchParams
  const currentPage = pageParam ? parseInt(pageParam) : 1
  const { logs, stats, totalCount } = await getConsentData(currentPage)

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const paginatedLogs = logs as ConsentLog[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <Cookie className="h-5 w-5 text-blue-600" />
          Cookie Consent Logs
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          GDPR compliance records - Track user consent decisions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Consents</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Cookie className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Today: {stats.todayTotal}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Accepted</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.accepted}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Today: {stats.todayAccepted}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Declined</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.declined}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Today: {stats.todayDeclined}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Acceptance Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.acceptanceRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Overall rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consent Logs Table */}
      <Card className="bg-white">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Recent Consent Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLogs.map((log) => {
                  const { browser, os } = parseUserAgent(log.user_agent)
                  const pageUrl = log.page_url ? new URL(log.page_url).pathname : '-'
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <Badge className={
                          log.consent_status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }>
                          {log.consent_status === 'accepted' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.consent_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {log.profiles ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.profiles.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{log.profiles.email}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Globe className="h-3.5 w-3.5" />
                            <span className="text-sm">Anonymous</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-mono">
                          {log.ip_address || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{browser}</span>
                          <span className="text-xs text-gray-400">/ {os}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 truncate max-w-[150px] block" title={log.page_url || undefined}>
                          {pageUrl}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            {format(new Date(log.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <Cookie className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No consent records found</p>
                      <p className="text-xs text-gray-400 mt-1">Consent logs will appear here when users interact with the cookie banner</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                baseUrl="/admin/consent"
                variant="light"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Cookie className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">GDPR Compliance</h4>
              <p className="text-xs text-blue-700 mt-1">
                These records are stored for GDPR compliance and audit purposes. They include 
                IP addresses and user agents to demonstrate valid consent collection. Records 
                are retained for the legally required period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

