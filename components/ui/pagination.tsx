'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Re-export paginateData from lib for convenience
export { paginateData } from '@/lib/pagination'
export type { PaginationResult } from '@/lib/pagination'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
  variant?: 'light' | 'dark'
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  className,
  variant = 'light'
}: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page URL
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= 7) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  if (totalPages <= 1) {
    return totalItems > 0 ? (
      <div className={cn(
        "text-sm",
        variant === 'dark' ? 'text-slate-400' : 'text-stone-500',
        className
      )}>
        Showing {totalItems} item{totalItems !== 1 ? 's' : ''}
      </div>
    ) : null
  }

  const isDark = variant === 'dark'
  const visiblePages = getVisiblePages()

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      {/* Items info */}
      <div className={cn(
        "text-sm",
        isDark ? 'text-slate-400' : 'text-stone-500'
      )}>
        Showing {startItem} - {endItem} of {totalItems} items
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
          className={cn(
            "h-9 px-2",
            isDark 
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent'
              : 'border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50'
          )}
        >
          {currentPage > 1 ? (
            <Link href={getPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </span>
          )}
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={cn(
                    "flex items-center justify-center h-9 w-9",
                    isDark ? 'text-slate-500' : 'text-stone-400'
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            const isActive = page === currentPage

            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                asChild={!isActive}
                className={cn(
                  "h-9 w-9 p-0",
                  isActive 
                    ? isDark 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-0'
                      : 'bg-stone-900 hover:bg-stone-800 text-white border-0'
                    : isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                )}
              >
                {isActive ? (
                  <span>{page}</span>
                ) : (
                  <Link href={getPageUrl(page)}>{page}</Link>
                )}
              </Button>
            )
          })}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden flex items-center gap-2 px-3">
          <span className={cn(
            "text-sm font-medium",
            isDark ? 'text-white' : 'text-stone-900'
          )}>
            {currentPage}
          </span>
          <span className={cn(
            "text-sm",
            isDark ? 'text-slate-500' : 'text-stone-400'
          )}>
            / {totalPages}
          </span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage < totalPages}
          disabled={currentPage >= totalPages}
          className={cn(
            "h-9 px-2",
            isDark 
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent'
              : 'border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50'
          )}
        >
          {currentPage < totalPages ? (
            <Link href={getPageUrl(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}


