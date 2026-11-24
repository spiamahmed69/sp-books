import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState } from '../../components/States'
import { useWishlist } from '../../context/WishlistContext'
import { useLanguage } from '../../context/LanguageContext'
import { bookService } from '../../services/bookService'
export default function Wishlist() {
  const { ids } = useWishlist()
  const { t } = useLanguage()
  const books = ids.map((id) => bookService.bySlug(id)).filter(Boolean)
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('wishlist')} description="Your wishlist — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('wishlist')}</h1>
      {books.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Heart} title={t('emptyWishlist')} text={t('emptyWishlistText')} action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('books')}</Link>} /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">{books.map((b) => <BookCard key={b.id} book={b} />)}</div>
      )}
    </div>
  )
}
