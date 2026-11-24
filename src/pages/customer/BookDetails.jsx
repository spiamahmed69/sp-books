import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, ShoppingCart, Zap, Share2, Star, Truck, RotateCcw, ShieldCheck, BookOpen } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCover from '../../components/BookCover'
import BookCard from '../../components/BookCard'
import RatingStars from '../../components/RatingStars'
import { EmptyState, BookCardSkeleton, SectionError } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useBook } from '../../hooks/useBooks'
import { bookService } from '../../services/bookService'
import { getReviews, addReview, pushRecentlyViewed, getRecentlyViewed, getAuthor, getPublisher, getCategory, getSeller } from '../../lib/firestore'
import { formatTaka, discountPercent, uid } from '../../lib/format'
export default function BookDetails() {
  const { slug } = useParams()
  const { book, loading: bookLoading, error: bookError } = useBook(slug)
  const { t } = useLanguage()
  const { add } = useCart()
  const { toggle, has } = useWishlist()
  const toast = useToast()
  const { user } = useAuth()
  const [qty, setQty] = useState(1)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewDone, setReviewDone] = useState(false)
  const [recentIds, setRecentIds] = useState([])
  useEffect(() => {
    if (book) { pushRecentlyViewed(book.id); setRecentIds(getRecentlyViewed().filter((id) => id !== book.id)) }
  }, [slug, book?.id])
  const { data: meta } = useAsyncData(async () => {
    if (!book) return null
    const [author, publisher, category, seller] = await Promise.all([
      getAuthor(book.authorId), getPublisher(book.publisherId), getCategory(book.category), getSeller(book.sellerId),
    ])
    return { author, publisher, category, seller }
  }, [book?.id])
  const { data: lists } = useAsyncData(async () => {
    if (!book) return null
    const [related, byAuthor, byPublisher, boughtTogether, recent] = await Promise.all([
      bookService.list({ category: book.category }),
      bookService.list({ authorId: book.authorId }),
      bookService.list({ publisherId: book.publisherId }),
      bookService.list({ sort: 'bestselling' }),
      Promise.all(recentIds.map((id) => bookService.bySlug(id))),
    ])
    return {
      related: related.filter((b) => b.id !== book.id).slice(0, 4),
      byAuthor: byAuthor.filter((b) => b.id !== book.id).slice(0, 4),
      byPublisher: byPublisher.filter((b) => b.id !== book.id).slice(0, 4),
      boughtTogether: boughtTogether.filter((b) => b.id !== book.id).slice(0, 3),
      recent: recent.filter(Boolean).slice(0, 4),
    }
  }, [book?.id, recentIds.join(',')])
  const { data: reviewsData, loading: reviewsLoading } = useAsyncData(() => (book ? getReviews(book.id) : Promise.resolve([])), [book?.id, reviewDone])
  const reviews = reviewsData || []
  const author = meta?.author
  const publisher = meta?.publisher
  const category = meta?.category
  const seller = meta?.seller
  const related = lists?.related || []
  const byAuthor = lists?.byAuthor || []
  const byPublisher = lists?.byPublisher || []
  const boughtTogether = lists?.boughtTogether || []
  const recent = lists?.recent || []
  const share = async () => {
    const url = window.location.href
    if (navigator.share) { try { await navigator.share({ title: book.titleBn, url }) } catch { /* dismissed */ } }
    else { await navigator.clipboard.writeText(url); toast.success('লিংক কপি হয়েছে। / Link copied.') }
  }
  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.error(t('loginRequired')); return }
    if (!reviewText.trim()) { toast.error('রিভিউ লিখুন।'); return }
    try {
      const saved = await addReview({ id: uid('r'), bookId: book.id, userName: user.name, rating: reviewRating, comment: reviewText.trim(), date: new Date().toISOString().slice(0, 10), status: 'approved' })
      setReviewText(''); setReviewDone(true)
      toast.success(saved.status === 'pending' ? 'রিভিউ জমা হয়েছে। অনুমোদনের পর দেখা যাবে।' : 'রিভিউ জমা হয়েছে। ধন্যবাদ!')
    } catch (err) { toast.error(err.message || 'রিভিউ জমা হয়নি।') }
  }
  if (bookLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
        <div className="grid md:grid-cols-[320px_1fr] gap-8"><div className="skeleton aspect-[3/4] rounded-2xl" /><div className="space-y-3"><div className="skeleton h-10 w-2/3 rounded" /><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-24 w-full rounded" /></div></div>
      </div>
    )
  }
  if (bookError) return <div className="mx-auto max-w-7xl px-4 py-16"><SectionError message={bookError} /></div>
  if (!book) {
    return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyState icon={BookOpen} title={t('noBooks')} text={t('noBooksText')} action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('books')}</Link>} /></div>
  }
  const off = discountPercent(book.price, book.oldPrice)
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={book.titleBn || book.title} description={book.descriptionBn || book.description} book={{ ...book, authorName: author?.name }} breadcrumbs={[{ name: 'হোম', url: '/' }, { name: category?.nameBn || '', url: `/categories/${book.category}` }, { name: book.titleBn || book.title, url: `/books/${book.slug}` }]} />
      <nav className="text-sm text-muted mb-4" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">হোম</Link> {' / '}
        <Link to={`/categories/${book.category}`} className="hover:text-primary">{category?.nameBn}</Link> {' / '}
        <span className="text-ink dark:text-white">{book.titleBn}</span>
      </nav>
      <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
        <div className="md:sticky md:top-36">
          <BookCover book={book} className="rounded-2xl shadow-xl" />
          <div className="flex gap-2 mt-3">
            <button onClick={share} className="flex-1 min-h-[44px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 font-medium text-sm inline-flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /> শেয়ার</button>
            <button onClick={() => { toggle(book.id); toast.success(has(book.id) ? t('removedFromWishlist') : t('addedToWishlist')) }} aria-pressed={has(book.id)} className={`flex-1 min-h-[44px] rounded-lg border font-medium text-sm inline-flex items-center justify-center gap-2 ${has(book.id) ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#D8C9B0] bg-white dark:bg-white/5'}`}><Heart className={`h-4 w-4 ${has(book.id) ? 'fill-red-600 text-red-600' : ''}`} /> {t('wishlist')}</button>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">{category?.nameBn} · {publisher?.nameBn}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{book.titleBn || book.title}</h1>
          <p className="text-lg text-muted mt-1">{book.title}</p>
          <p className="mt-2">লেখক: <Link to={`/authors/${author?.slug}`} className="text-primary font-semibold hover:underline">{author?.nameBn}</Link> · প্রকাশক: <Link to={`/publishers/${publisher?.slug}`} className="text-primary font-semibold hover:underline">{publisher?.nameBn}</Link></p>
          <div className="mt-2 flex items-center gap-2"><RatingStars rating={book.rating} size={18} /><span className="text-sm text-muted">({book.totalReviews} {t('reviews')}) · {book.sold} {t('sold')}</span></div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatTaka(book.price)}</span>
            {book.oldPrice > book.price && <><span className="text-lg text-muted line-through">{formatTaka(book.oldPrice)}</span><span className="rounded-full bg-red-100 text-red-700 text-xs font-bold px-2 py-1">-{off}% ছাড়</span></>}
          </div>
          <p className="mt-2 text-sm">{book.stock > 0 ? <span className="text-green-700 dark:text-green-400 font-medium">{t('inStock')} — {book.stock} {t('stockLeft')}</span> : <span className="text-red-700 font-medium">{t('outOfStock')}</span>}{book.stock > 0 && book.stock <= 5 && <span className="text-amber-700 ml-2">{t('hurry')}</span>}</p>
          <p className="mt-4 leading-relaxed text-[15px]">{book.descriptionBn || book.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium" htmlFor="qty">পরিমাণ
              <span className="inline-flex items-center border rounded-lg overflow-hidden">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="min-h-[44px] min-w-[44px] hover:bg-bg">−</button>
                <span id="qty" className="min-w-[40px] text-center font-bold">{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(book.stock, qty + 1))} className="min-h-[44px] min-w-[44px] hover:bg-bg">+</button>
              </span>
            </label>
            <button disabled={book.stock <= 0} onClick={() => { if (add(book, qty)) toast.success(t('addedToCart')) }} className="min-h-[48px] px-6 rounded-full bg-primary text-white font-bold inline-flex items-center gap-2 hover:bg-primary-dark disabled:opacity-50"><ShoppingCart className="h-5 w-5" /> {t('addToCart')}</button>
            <Link to="/cart" onClick={() => add(book, qty)} className="min-h-[48px] px-6 rounded-full bg-secondary text-[#221D19] font-bold inline-flex items-center gap-2 hover:brightness-110"><Zap className="h-5 w-5" /> {t('buyNow')}</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border p-3 flex gap-2 items-center"><Truck className="h-5 w-5 text-primary shrink-0" /><span>ঢাকায় ৳৬০, বাইরে ৳১২০<br /><span className="text-muted text-xs">৳১,৫০০+ অর্ডারে ফ্রি</span></span></div>
            <div className="rounded-xl border p-3 flex gap-2 items-center"><RotateCcw className="h-5 w-5 text-primary shrink-0" /><span>৭ দিনে রিটার্ন<br /><span className="text-muted text-xs">ত্রুটিপূর্ণ বইয়ে</span></span></div>
            <div className="rounded-xl border p-3 flex gap-2 items-center"><ShieldCheck className="h-5 w-5 text-primary shrink-0" /><span>বিক্রেতা: {seller?.storeNameBn}<br /><span className="text-muted text-xs">{seller?.verified ? 'যাচাইকৃত' : 'যাচাই হয়নি'}</span></span></div>
          </div>
          <dl className="mt-6 rounded-xl border divide-y text-sm">
            {[['ISBN', book.isbn], ['সংস্করণ', book.edition], ['ভাষা', book.language], ['পৃষ্ঠা', book.pages], ['বাঁধাই', book.binding], ['প্রকাশের তারিখ', book.publicationDate]].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
      <DetailSection title={t('frequentlyBought')}>
        <div className="flex flex-wrap items-center gap-3">
          {[book, ...boughtTogether].map((b) => (
            <Link key={b.id} to={`/books/${b.slug}`} className="flex items-center gap-2 rounded-xl border p-2 pr-4 hover:shadow">
              <BookCover book={b} className="w-12 rounded" />
              <span className="text-sm font-medium max-w-[140px] line-clamp-2">{b.titleBn}</span>
              <span className="text-sm font-bold text-primary">{formatTaka(b.price)}</span>
            </Link>
          ))}
          <button onClick={() => { boughtTogether.forEach((b) => add(b)); if (add(book)) toast.success(t('addedToCart')) }} className="min-h-[44px] px-5 rounded-full bg-primary text-white text-sm font-bold">সবগুলো কার্টে নিন</button>
        </div>
      </DetailSection>
      <DetailSection title={t('customerReviews')}>
        <div className="space-y-3">
          {reviewsLoading && <p className="text-muted text-sm">রিভিউ লোড হচ্ছে…</p>}
          {!reviewsLoading && reviews.length === 0 && <p className="text-muted text-sm">এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনিই লিখুন।</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="flex items-center gap-2"><RatingStars rating={r.rating} /><span className="font-semibold text-sm">{r.userName}</span><span className="text-xs text-muted">{r.date}</span></div>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitReview} className="mt-4 rounded-xl border p-4">
          <h3 className="font-semibold">{t('writeReview')}</h3>
          <label className="block text-sm mt-3 mb-1">রেটিং</label>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={reviewRating === n} className="min-h-[44px] min-w-[44px]"><Star className={`h-6 w-6 ${n <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} /></button>
            ))}
          </div>
          <label className="block text-sm mt-2 mb-1" htmlFor="review-text">আপনার রিভিউ</label>
          <textarea id="review-text" value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} className="w-full rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 p-3" placeholder="বইটি কেমন লাগলো?" />
          <button type="submit" className="mt-3 min-h-[44px] px-6 rounded-full bg-primary text-white font-semibold">{t('submit')}</button>
          {!user && <p className="text-xs text-muted mt-2">রিভিউ লিখতে <Link to="/login" className="text-primary font-medium">লগইন</Link> করুন।</p>}
        </form>
      </DetailSection>
      {related.length > 0 && <DetailSection title={t('relatedBooks')}><Grid books={related} /></DetailSection>}
      {byAuthor.length > 0 && <DetailSection title={t('moreByAuthor')}><Grid books={byAuthor} /></DetailSection>}
      {byPublisher.length > 0 && <DetailSection title={t('moreByPublisher')}><Grid books={byPublisher} /></DetailSection>}
      {recent.length > 0 && <DetailSection title={t('recentlyViewed')}><Grid books={recent} /></DetailSection>}
    </div>
  )
}
function DetailSection({ title, children }) {
  return <section className="mt-10"><h2 className="font-display text-2xl font-bold mb-4">{title}</h2>{children}</section>
}
function Grid({ books }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{books.map((b) => <BookCard key={b.id} book={b} />)}</div>
}
