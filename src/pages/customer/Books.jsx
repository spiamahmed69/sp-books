import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, BookOpen } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { bookService } from '../../services/bookService'
import { getAuthors, getPublishers, getCategories } from '../../lib/firestore'
const SORTS = [
  { id: 'popularity', label: 'জনপ্রিয়তা' }, { id: 'price-low', label: 'দাম: কম থেকে বেশি' },
  { id: 'price-high', label: 'দাম: বেশি থেকে কম' }, { id: 'newest', label: 'নতুন' },
  { id: 'rating', label: 'সেরা রেটিং' }, { id: 'bestselling', label: 'বেস্টসেলার' },
]
export default function Books({ mode = 'all' }) {
  const { t } = useLanguage()
  const { slug } = useParams()
  const [params] = useSearchParams()
  const [sort, setSort] = useState('popularity')
  const [cat, setCat] = useState(mode === 'category' ? slug : '')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [language, setLanguage] = useState('')
  const [binding, setBinding] = useState('')
  const [maxPrice, setMaxPrice] = useState(1000)
  const [showFilters, setShowFilters] = useState(false)
  const authors = getAuthors()
  const publishers = getPublishers()
  const categories = getCategories()
  const books = useMemo(() => {
    let opts = { sort }
    if (mode === 'category') opts.category = slug
    if (mode === 'bestseller') opts.bestseller = true
    if (mode === 'new') opts.isNew = true
    if (mode === 'discounted') opts.discounted = true
    if (cat) opts.category = cat
    if (author) opts.authorId = author
    if (publisher) opts.publisherId = publisher
    if (language) opts.language = language
    if (binding) opts.binding = binding
    if (maxPrice < 1000) opts.maxPrice = maxPrice
    let list = bookService.list(opts)
    const q = params.get('q')
    if (q) list = list.filter((b) => bookService.search(q).some((x) => x.id === b.id))
    return list
  }, [mode, slug, sort, cat, author, publisher, language, binding, maxPrice, params])
  const title = mode === 'category' ? (categories.find((c) => c.slug === slug)?.nameBn || t('books'))
    : mode === 'bestseller' ? t('bestsellers') : mode === 'new' ? t('newArrivals') : mode === 'discounted' ? t('discounted') : t('books')
  const clearAll = () => { setCat(''); setAuthor(''); setPublisher(''); setLanguage(''); setBinding(''); setMaxPrice(1000) }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={title} description={`${title} — SP Books`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted" htmlFor="sort">{t('sortBy')}</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-[44px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden min-h-[44px] px-4 rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 inline-flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="h-4 w-4" /> {t('filter')}</button>
        </div>
      </div>
      <p className="text-sm text-muted mt-1">{books.length} {t('books')} পাওয়া গেছে</p>
      <div className="mt-6 grid md:grid-cols-[240px_1fr] gap-6 items-start">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-4 space-y-5 md:sticky md:top-36`}>
          <div className="flex items-center justify-between"><h2 className="font-semibold">{t('filter')}</h2><button onClick={clearAll} className="text-sm text-primary font-medium min-h-[32px]">{t('clearFilters')}</button></div>
          <Filter label={t('categories')} value={cat} onChange={setCat} options={[{ id: '', label: 'সব' }, ...categories.map((c) => ({ id: c.slug, label: `${c.nameBn} (${c.count})` }))]} />
          <Filter label={t('authors')} value={author} onChange={setAuthor} options={[{ id: '', label: 'সব' }, ...authors.filter((a) => a.books > 0).map((a) => ({ id: a.id, label: `${a.nameBn} (${a.books})` }))]} />
          <Filter label={t('publishers')} value={publisher} onChange={setPublisher} options={[{ id: '', label: 'সব' }, ...publishers.filter((p) => p.books > 0).map((p) => ({ id: p.id, label: `${p.nameBn} (${p.books})` }))]} />
          <Filter label="ভাষা / Language" value={language} onChange={setLanguage} options={[{ id: '', label: 'সব' }, { id: 'বাংলা', label: 'বাংলা' }, { id: 'English', label: 'English' }]} />
          <Filter label={t('binding')} value={binding} onChange={setBinding} options={[{ id: '', label: 'সব' }, { id: 'হার্ডকভার', label: 'হার্ডকভার' }, { id: 'পেপারব্যাক', label: 'পেপারব্যাক' }]} />
          <div>
            <label htmlFor="maxprice" className="text-sm font-medium">সর্বোচ্চ দাম: ৳{maxPrice}</label>
            <input id="maxprice" type="range" min={100} max={1000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#6B422E]" />
          </div>
        </aside>
        <div>
          {books.length === 0 ? (
            <EmptyState icon={BookOpen} title={t('noBooks')} text={t('noBooksText')} action={<button onClick={clearAll} className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold">{t('clearFilters')}</button>} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {books.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
function Filter({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[44px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3 text-sm">
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  )
}
