import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState, BookCardSkeleton, SectionError } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { bookService } from '../../services/bookService'
import { getAuthors, getPublishers } from '../../lib/firestore'
import { useState } from 'react'
export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const { t } = useLanguage()
  const [input, setInput] = useState(q)
  const { data, loading, error } = useAsyncData(async () => {
    if (!q) return { results: [], authors: [], publishers: [] }
    const [results, allAuthors, allPublishers] = await Promise.all([bookService.search(q), getAuthors(), getPublishers()])
    const ql = q.toLowerCase()
    return {
      results,
      authors: allAuthors.filter((a) => (a.nameBn || '').includes(q) || (a.name || '').toLowerCase().includes(ql)),
      publishers: allPublishers.filter((p) => (p.nameBn || '').includes(q) || (p.name || '').toLowerCase().includes(ql)),
    }
  }, [q])
  const results = data?.results || []
  const authors = data?.authors || []
  const publishers = data?.publishers || []
  const submit = (e) => { e.preventDefault(); setParams(input.trim() ? { q: input.trim() } : {}) }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={`${t('search')}${q ? `: ${q}` : ''}`} description={`Search results for ${q} — SP Books`} />
      <h1 className="font-display text-3xl font-bold">{t('search')}</h1>
      <form onSubmit={submit} className="mt-4 flex gap-2 max-w-xl" role="search">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} className="flex-1 min-h-[48px] rounded-full border border-[#D8C9B0] bg-white dark:bg-white/5 px-4" />
        <button type="submit" className="min-h-[48px] px-6 rounded-full bg-primary text-white font-semibold inline-flex items-center gap-2"><SearchIcon className="h-4 w-4" /> {t('search')}</button>
      </form>
      {q && (
        <>
          {loading && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6" aria-busy="true">{[1, 2, 3, 4].map((i) => <BookCardSkeleton key={i} />)}</div>}
          {error && <div className="mt-4"><SectionError message={error} /></div>}
          {!loading && !error && (
            <>
              <p className="text-sm text-muted mt-4">“{q}” — {results.length}টি বই পাওয়া গেছে</p>
              {authors.length > 0 && (
                <div className="mt-4"><h2 className="font-semibold mb-2">{t('authors')}</h2><div className="flex flex-wrap gap-2">{authors.map((a) => <Link key={a.id} to={`/authors/${a.slug}`} className="px-4 py-2 rounded-full border bg-white dark:bg-white/5 text-sm font-medium hover:border-primary">{a.nameBn}</Link>)}</div></div>
              )}
              {publishers.length > 0 && (
                <div className="mt-4"><h2 className="font-semibold mb-2">{t('publishers')}</h2><div className="flex flex-wrap gap-2">{publishers.map((p) => <Link key={p.id} to={`/publishers/${p.slug}`} className="px-4 py-2 rounded-full border bg-white dark:bg-white/5 text-sm font-medium hover:border-primary">{p.nameBn}</Link>)}</div></div>
              )}
              <div className="mt-6">
                {results.length === 0 ? <EmptyState icon={SearchIcon} title={t('noBooks')} text={t('noBooksText')} /> : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{results.map((b) => <BookCard key={b.id} book={b} />)}</div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {!q && <p className="text-muted mt-6">বই, লেখক, প্রকাশক, ISBN বা বিষয় দিয়ে খুঁজুন। যেমন: হিমু, রবীন্দ্রনাথ, উপন্যাস।</p>}
    </div>
  )
}
