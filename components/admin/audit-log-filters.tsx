'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

interface AuditLogFiltersProps {
  currentFilters: {
    category?: string
    severity?: string
    action?: string
  }
}

export function AuditLogFilters({ currentFilters }: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [action, setAction] = useState(currentFilters.action || '')

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to page 1 when filtering
    router.push(`/admin/audit?${params.toString()}`)
  }

  const handleActionSearch = () => {
    updateFilter('action', action)
  }

  const clearFilters = () => {
    router.push('/admin/audit')
    setAction('')
  }

  const hasFilters = currentFilters.category || currentFilters.severity || currentFilters.action

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
      {/* Category Filter */}
      <Select
        value={currentFilters.category || 'all'}
        onValueChange={(value) => updateFilter('category', value)}
      >
        <SelectTrigger className="w-[140px] bg-white border-gray-200">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="security">Security</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>

      {/* Severity Filter */}
      <Select
        value={currentFilters.severity || 'all'}
        onValueChange={(value) => updateFilter('severity', value)}
      >
        <SelectTrigger className="w-[140px] bg-white border-gray-200">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severity</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      {/* Action Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search action..."
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleActionSearch()}
          className="w-[200px] bg-white border-gray-200"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleActionSearch}
          className="border-gray-200"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  )
}

