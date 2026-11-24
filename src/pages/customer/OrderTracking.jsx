import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Package, CheckCircle2, Truck, Home, Search, XCircle } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCover from '../../components/BookCover'
import { SectionError } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getOrderById } from '../../lib/firestore'
import { bookService } from '../../services/bookService'
import { formatTaka } from '../../lib/format'
const STEPS = [
  { id: 'processing', label: 'অর্ডার গ্রহণ', icon: Package },
  { id: 'confirmed', label: 'নিশ্চিত হয়েছে', icon: CheckCircle2 },
  { id: 'shipped', label: 'পাঠানো হয়েছে', icon: Truck },
  { id: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: Home },
]
const ORDER = ['processing', 'confirmed', 'shipped', 'delivered']
export default function OrderTracking() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [input, setInput] = useState(id || '')
  const [lookup, setLookup] = useState(id || '')
  const { data: order, loading, error } = useAsyncData(() => (lookup ? getOrderById(lookup) : Promise.resolve(null)), [lookup])
  const { data: itemBooks } = useAsyncData(async () => {
    if (!order) return {}
    const entries = await Promise.all((order.items || []).map(async (it) => [it.bookId, await bookService.bySlug(it.bookId)]))
    return Object.fromEntries(entries)
  }, [order?.id])
  const current = order ? ORDER.indexOf(order.status) : -1
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SEO title={t('tracking')} description="Track your order — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('tracking')}</h1>
      <form onSubmit={(e) => { e.preventDefault(); setLookup(input.trim()) }} className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="অর্ডার আইডি (যেমন: SPB_…)" aria-label="Order ID" className="flex-1 min-h-[48px] rounded-full border border-[#D8C9B0] bg-white dark:bg-white/5 px-4 min-w-0" />
        <button type="submit" className="min-h-[48px] px-5 rounded-full bg-primary text-white font-semibold inline-flex items-center gap-2"><Search className="h-4 w-4" /> খুঁজুন</button>
      </form>
      {loading && <p className="text-muted mt-6">অর্ডার খোঁজা হচ্ছে…</p>}
      {error && <div className="mt-6"><SectionError message="অর্ডার দেখা যায়নি — নিজের অর্ডার দেখতে লগইন করুন।" /></div>}
      {!loading && !error && lookup && !order && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2" role="alert"><XCircle className="h-5 w-5 shrink-0" /> এই আইডির কোনো অর্ডার পাওয়া যায়নি। আইডিটি ঠিক আছে কি না দেখুন।</p>
      )}
      {order && (
        <div className="mt-6 rounded-2xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-6">
          <div className="flex flex-wrap justify-between gap-2">
            <div><p className="font-semibold">{order.id}</p><p className="text-sm text-muted">{order.customerName} · {order.address?.district}, {order.address?.upazila}</p></div>
            <span className="rounded-full bg-primary-light dark:bg-white/10 text-primary dark:text-secondary text-xs font-bold px-3 py-1 h-fit">{t(order.status) || order.status}</span>
          </div>
          {order.status === 'cancelled' ? (
            <p className="mt-6 text-red-700 font-medium">এই অর্ডারটি বাতিল করা হয়েছে।</p>
          ) : (
            <ol className="mt-8 space-y-0">
              {STEPS.map((s, i) => {
                const done = i <= current
                const Icon = s.icon
                return (
                  <li key={s.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < STEPS.length - 1 && <span className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${i < current ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`} aria-hidden="true" />}
                    <span className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10 text-muted'}`}><Icon className="h-5 w-5" /></span>
                    <div><p className={`font-semibold ${done ? '' : 'text-muted'}`}>{s.label}</p><p className="text-xs text-muted">{done ? 'সম্পন্ন হয়েছে' : 'অপেক্ষমাণ'}</p></div>
                  </li>
                )
              })}
            </ol>
          )}
          <div className="mt-6 border-t pt-4 space-y-2">
            {(order.items || []).map((it, i) => {
              const book = itemBooks?.[it.bookId]
              return (
                <div key={i} className="flex gap-3 items-center text-sm">
                  {book && <BookCover book={book} className="w-10 rounded shrink-0" />}
                  <span className="flex-1">{it.titleBn || it.title} × {it.qty}</span>
                  <span className="font-semibold">{formatTaka(it.price * it.qty)}</span>
                </div>
              )
            })}
            <div className="flex justify-between border-t pt-2 font-bold"><span>{t('total')}</span><span className="text-primary">{formatTaka(order.total)}</span></div>
            <p className="text-xs text-muted">পেমেন্ট: {order.paymentMethod} · {order.paymentStatus} · ডেলিভারি চার্জ {formatTaka(order.shipping)}</p>
          </div>
          <Link to="/orders" className="mt-4 inline-block text-primary font-semibold text-sm min-h-[40px] leading-[40px]">← {t('orders')}</Link>
        </div>
      )}
    </div>
  )
}
