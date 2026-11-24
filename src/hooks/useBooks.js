import { useAsyncData } from './useAsyncData'
import { bookService } from '../services/bookService'
// Returns { books, loading, error } — empty list while loading.
export function useBooks(opts = {}) {
  const key = JSON.stringify(opts)
  const { data, loading, error } = useAsyncData(() => bookService.list(JSON.parse(key)), [key])
  return { books: data || [], loading, error }
}
// Returns { book, loading, error } — null while loading or when not found.
export function useBook(slug) {
  const { data, loading, error } = useAsyncData(() => (slug ? bookService.bySlug(slug) : Promise.resolve(null)), [slug])
  return { book: data || null, loading, error }
}
