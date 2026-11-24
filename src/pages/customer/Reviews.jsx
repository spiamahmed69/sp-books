import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import SEO from '../../components/SEO'
import RatingStars from '../../components/RatingStars'
import { EmptyState } from '../../components/States'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getReviews } from '../../lib/firestore'
import { bookService } from '../../services/bookService'
export default function Reviews() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const mine = user ? getReviews(null, true).filter((r) => r.userName === user.name) : []
  const all = getReviews().slice(0, 12)
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SEO title={t('myReviews')} description="Reviews — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('myReviews')}</h1>
      {mine.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Star} title="আপনি এখনো কোনো রিভিউ লেখেননি।" text="বই কিনে রিভিউ লিখলে এখানে দেখা যাবে।" action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('books')}</Link>} /></div>
      ) : (
        <div className="space-y-3 mt-6">
          {mine.map((r) => {
            const book = bookService.bySlug(r.bookId)
            return (
              <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
                <div className="flex items-center gap-2"><RatingStars rating={r.rating} /><span className="font-semibold text-sm">{book?.titleBn}</span><span className="text-xs text-muted">{r.date}</span></div>
                <p className="mt-1 text-sm">{r.comment}</p>
              </div>
            )
          })}
        </div>
      )}
      <h2 className="font-display text-2xl font-bold mt-10 mb-4">সাম্প্রতিক রিভিউ</h2>
      <div className="space-y-3">
        {all.map((r) => {
          const book = bookService.bySlug(r.bookId)
          return (
            <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex items-center gap-2"><RatingStars rating={r.rating} /><span className="font-semibold text-sm">{r.userName}</span><span className="text-xs text-muted">· {book?.titleBn}</span></div>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
