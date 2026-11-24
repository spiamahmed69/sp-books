import { useMemo } from 'react'
import { bookService } from '../services/bookService'
export function useBooks(opts = {}) {
  return useMemo(() => bookService.list(opts), [JSON.stringify(opts)])
}
export function useBook(slug) {
  return useMemo(() => (slug ? bookService.bySlug(slug) : null), [slug])
}
