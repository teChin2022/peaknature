// Server-side pagination helper function
// This can be used in both server and client components

export interface PaginationResult<T> {
  items: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function paginateData<T>(
  data: T[], 
  page: number, 
  itemsPerPage: number
): PaginationResult<T> {
  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (currentPage - 1) * itemsPerPage
  const items = data.slice(startIndex, startIndex + itemsPerPage)

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage
  }
}

