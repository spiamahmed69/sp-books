import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import BookCover from './BookCover'
import RatingStars from './RatingStars'
import { formatTaka, discountPercent } from '../lib/format'
import { getAuthor, getPublisher } from '../data/demo'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
export default function BookCard({ book }) {
  const { add } = useCart()
  const { toggle, has } = useWishlist()
  const toast = useToast()
  const { t } = useLanguage()
  const author = getAuthor(book.authorId)
  const publisher = getPublisher(book.publisherId)
  const off = discountPercent(book.price, book.oldPrice)
  const wished = has(book.id)
  return (
    <article className="group relative flex flex-col rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <Link to={`/books/${book.slug}`} className="block" aria-label={book.titleBn || book.title}>
        <BookCover book={book} className="group-hover:scale-[1.02] transition-transform duration-300" />
      </Link>
      {off > 0 && <span className="absolute top-2 left-2 rounded-full bg-[#B91C1C] text-white text-xs font-bold px-2 py-1">-{off}%</span>}
      <button onClick={() => { toggle(book.id); toast.success(wished ? t('removedFromWishlist') : t('addedToWishlist')) }} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished} className="absolute top-2 right-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-white/95 shadow hover:bg-white">
        <Heart className={`h-5 w-5 ${wished ? 'text-red-600 fill-red-600' : 'text-gray-500'}`} />
      </button>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-muted truncate">{author?.nameBn || ''} · {publisher?.nameBn || ''}</p>
        <Link to={`/books/${book.slug}`} className="font-semibold leading-snug mt-1 line-clamp-2 hover:text-primary">{book.titleBn || book.title}</Link>
        <div className="mt-1"><RatingStars rating={book.rating} /> <span className="text-xs text-muted">({book.totalReviews})</span></div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-bold text-primary text-lg">{formatTaka(book.price)}</span>
          {book.oldPrice > book.price && <span className="text-sm text-muted line-through">{formatTaka(book.oldPrice)}</span>}
        </div>
        <p className="text-xs mt-1">{book.stock > 0 ? <span className="text-green-700 dark:text-green-400">{t('inStock')} · {book.stock} {t('stockLeft')}</span> : <span className="text-red-700">{t('outOfStock')}</span>}</p>
        <button disabled={book.stock <= 0} onClick={() => { if (add(book)) toast.success(t('addedToCart')) }} className="mt-3 min-h-[44px] w-full rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4" /> {t('addToCart')}
        </button>
      </div>
    </article>
  )
}
