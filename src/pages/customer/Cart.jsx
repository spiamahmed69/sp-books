import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCover from '../../components/BookCover'
import { EmptyState, BookCardSkeleton } from '../../components/States'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { bookService } from '../../services/bookService'
import { formatTaka } from '../../lib/format'
import { getSettings } from '../../lib/firestore'
export default function Cart() {
  const { items, setQty, remove, clear } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const itemsKey = JSON.stringify(items)
  const { data, loading } = useAsyncData(async () => {
    const list = JSON.parse(itemsKey)
    const settings = await getSettings()
    const books = await Promise.all(list.map((i) => bookService.bySlug(i.bookId)))
    return {
      settings,
      detailed: list.map((i, idx) => ({ ...i, book: books[idx] })).filter((i) => i.book),
    }
  }, [itemsKey])
  const settings = data?.settings || { freeShippingAbove: 1500, shippingDhaka: 60 }
  const detailed = data?.detailed || []
  const subtotal = detailed.reduce((s, i) => s + i.book.price * i.qty, 0)
  const shipping = subtotal === 0 ? 0 : subtotal >= settings.freeShippingAbove ? 0 : settings.shippingDhaka
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('cart')} description="Your cart — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('cart')}</h1>
      {loading ? (
        <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6 items-start" aria-busy="true">
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
          <div className="skeleton h-56 rounded-xl" />
        </div>
      ) : detailed.length === 0 ? (
        <div className="mt-6"><EmptyState icon={ShoppingCart} title={t('emptyCart')} text={t('emptyCartText')} action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('continueShopping')}</Link>} /></div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-3">
            {detailed.map((i) => (
              <div key={i.bookId} className="flex gap-3 rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-3">
                <Link to={`/books/${i.book.slug}`} className="w-20 shrink-0"><BookCover book={i.book} className="rounded-lg" /></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${i.book.slug}`} className="font-semibold hover:text-primary line-clamp-2">{i.book.titleBn}</Link>
                  <p className="text-sm text-muted">{formatTaka(i.book.price)} × {i.qty} = <span className="font-bold text-primary">{formatTaka(i.book.price * i.qty)}</span></p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center border rounded-lg overflow-hidden">
                      <button aria-label="Decrease quantity" onClick={() => setQty(i.bookId, i.qty - 1)} className="min-h-[40px] min-w-[40px] hover:bg-bg"><Minus className="h-4 w-4 mx-auto" /></button>
                      <span className="min-w-[36px] text-center font-bold">{i.qty}</span>
                      <button aria-label="Increase quantity" onClick={() => setQty(i.bookId, Math.min(i.book.stock, i.qty + 1))} className="min-h-[40px] min-w-[40px] hover:bg-bg"><Plus className="h-4 w-4 mx-auto" /></button>
                    </span>
                    <button onClick={() => remove(i.bookId)} aria-label="Remove item" className="min-h-[40px] min-w-[40px] rounded-lg hover:bg-red-50 text-red-700 flex items-center justify-center"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={clear} className="text-sm text-red-700 font-medium min-h-[40px]">কার্ট খালি করুন / Clear cart</button>
          </div>
          <aside className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 md:sticky md:top-36">
            <h2 className="font-semibold text-lg">{t('orderSummary')}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>{t('subtotal')}</dt><dd className="font-semibold">{formatTaka(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>{t('shipping')}</dt><dd className="font-semibold">{shipping === 0 ? 'ফ্রি' : formatTaka(shipping)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">{t('total')}</dt><dd className="font-bold text-primary">{formatTaka(subtotal + shipping)}</dd></div>
            </dl>
            <p className="text-xs text-muted mt-2">ঢাকায় ডেলিভারি ৳৬০, বাইরে ৳১২০। ৳১,৫০০+ অর্ডারে ফ্রি। চেকআউটে জেলা অনুযায়ী চার্জ নির্ধারিত হয়।</p>
            <button onClick={() => navigate('/checkout')} className="mt-4 w-full min-h-[48px] rounded-full bg-primary text-white font-bold hover:bg-primary-dark">{t('checkout')}</button>
            <Link to="/books" className="mt-2 block text-center text-sm text-primary font-medium min-h-[40px] leading-[40px]">{t('continueShopping')}</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
