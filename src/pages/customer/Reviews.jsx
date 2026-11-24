import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import SEO from '../../components/SEO'
import RatingStars from '../../components/RatingStars'
import { EmptyState, SectionError } from '../../components/States'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getReviews } from '../../lib/firestore'
import { bookService } from '../../services/bookService'
export default function Reviews() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data, loading, error } = useAsyncData(async () => {
    const [mineAll, all] = await Promise.all([getReviews(null, true), getReviews()])
    const mine = user ? mineAll.filter((r) => (r.userId ? r.userId === user.id : r.userName === user.name)) : []
    const bookIds = [...new Set([...mine, ...all].map((r) => r.bookId))]
    const books = await Promise.all(bookIds.map((id) => bookService.bySlug(id)))
    const byId = Object.fromEntries(books.filter(Boolean).map((b) => [b.id, b]))
    return { mine, all: all.slice(0, 12), byId }
  }, [user?.id])
  const mine = data?.mine || []
  const all = data?.all || []
  const byId = data?.byId || {}
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SEO title={t('myReviews')} description="Reviews — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('myReviews')}</h1>
      {loading && <p className="text-muted mt-6">রিভিউ লোড হচ্ছে…</p>}
      {error && <div className="mt-6"><SectionError message={error} /></div>}
      {!loading && !error && mine.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Star} title="আপনি এখনো কোনো রিভিউ লেখেননি।" text="বই কিনে রিভিউ লিখলে এখানে দেখা যাবে।" action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('books')}</Link>} /></div>
      ) : (
        <div className="space-y-3 mt-6">
          {mine.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex items-center gap-2"><RatingStars rating={r.rating} /><span className="font-semibold text-sm">{byId[r.bookId]?.titleBn}</span><span className="text-xs text-muted">{r.date}</span></div>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold mt-10 mb-4">সাম্প্রতিক রিভিউ</h2>
      <div className="space-y-3">
        {all.map((r) => (
          <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
            <div className="flex items-center gap-2"><RatingStars rating={r.rating} /><span className="font-semibold text-sm">{r.userName}</span><span className="text-xs text-muted">· {byId[r.bookId]?.titleBn}</span></div>
            <p className="mt-1 text-sm">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
