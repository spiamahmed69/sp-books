import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import SEO from '../../components/SEO'
import BookCover from '../../components/BookCover'
import BookForm from '../../features/books/BookForm'
import ImageUpload from '../../components/ImageUpload'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { isDemoMode } from '../../lib/firebase'
import { getBooks, saveBook, deleteBook, getSellerOrders, updateOrderStatus, getSellers, saveSeller, getCoupons, saveCoupon, deleteCoupon, getReviews } from '../../lib/firestore'
import { formatTaka } from '../../lib/format'
const TABS = ['overview', 'books', 'add', 'orders', 'earnings', 'coupons', 'reviews', 'settings']
export default function SellerDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const sellerId = user?.sellerId || (isDemoMode ? 's1' : null)
  const [data, setData] = useState({ seller: null, myBooks: [], myOrders: [], myReviews: [], coupons: [] })
  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        if (!sellerId) { if (alive) setData({ seller: null, myBooks: [], myOrders: [], coupons: [], myReviews: [] }); return }
        const [sellers, books, orders, coupons] = await Promise.all([getSellers(), getBooks(true), getSellerOrders(), getCoupons()])
        const seller = sellers.find((s) => s.id === sellerId) || { id: sellerId, storeName: user?.name || 'My Store', status: 'pending', verified: false }
        const myBooks = books.filter((b) => b.sellerId === sellerId)
        const myOrders = orders.filter((o) => o.sellerId === sellerId)
        const allReviews = await getReviews(null, true)
        const myReviews = allReviews.filter((r) => myBooks.some((b) => b.id === r.bookId))
        if (alive) setData({ seller, myBooks, myOrders, coupons, myReviews })
      } catch (e) { if (alive) toast.error(e.message || 'ডেটা লোড হয়নি।') }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [sellerId, refresh])
  const { seller, myBooks, myOrders, myReviews, coupons } = data
  const revenue = myOrders.reduce((s, o) => s + o.subtotal, 0)
  const earnings = myOrders.reduce((s, o) => s + o.sellerEarnings, 0)
  const commission = myOrders.reduce((s, o) => s + o.commission, 0)
  const chartData = useMemo(() => {
    const byDay = {}
    myOrders.forEach((o) => { const d = (o.createdAt || '').slice(0, 10); byDay[d] = (byDay[d] || 0) + o.subtotal })
    return Object.entries(byDay).map(([date, sales]) => ({ date: date.slice(5), sales }))
  }, [myOrders])
  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg) } catch (e) { toast.error(e.message || 'কাজটি হয়নি।') }
  }
  const save = async (book) => {
    await saveBook(book)
    toast.success(book.approvalStatus === 'approved' ? 'বই সংরক্ষণ হয়েছে।' : 'বই জমা হয়েছে — অ্যাডমিন অনুমোদনের অপেক্ষায়।')
    setEditing(null); setTab('books'); setRefresh((r) => r + 1)
  }
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 10, minOrder: 500 })
  if (!sellerId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SEO title={t('sellerDashboard')} description="Seller dashboard — SP Books" />
        <h1 className="font-display text-3xl font-bold">{t('sellerDashboard')}</h1>
        <p className="text-muted mt-4">আপনার কোনো সেলার স্টোর নেই। সেলার হতে নিচের লিংক থেকে রেজিস্টার করুন।</p>
        <Link to="/seller/register" className="mt-4 inline-block min-h-[48px] px-6 rounded-full bg-primary text-white font-bold leading-[48px]">{t('becomeSeller')}</Link>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('sellerDashboard')} description="Seller dashboard — SP Books" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-bold">{seller?.storeNameBn || seller?.storeName || 'My Store'}</h1>
          <p className="text-sm text-muted">স্ট্যাটাস: <span className={`font-semibold ${seller?.status === 'approved' ? 'text-green-700' : 'text-amber-700'}`}>{t(seller?.status || 'pending') || seller?.status}</span> · {seller?.verified ? t('verified') : t('notVerified')}</p>
        </div>
        <button onClick={() => { setEditing(null); setTab('add') }} className="min-h-[48px] px-5 rounded-full bg-primary text-white font-bold">+ {t('addBook')}</button>
      </div>
      {seller?.status !== 'approved' && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">আপনার স্টোরটি এখনো অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদনের পর আপনার বই কাস্টমার সাইটে দেখা যাবে।</p>
      )}
      {loading && <p className="text-muted mt-4">ডেটা লোড হচ্ছে…</p>}
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Seller sections">
        {TABS.map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)} className={`min-h-[44px] px-4 rounded-full text-sm font-semibold whitespace-nowrap ${tab === tb ? 'bg-primary text-white' : 'bg-white dark:bg-white/5 border'}`}>{t(tb === 'books' ? 'myBooks' : tb === 'add' ? 'addBook' : tb === 'orders' ? 'myOrders' : tb === 'earnings' ? 'earnings' : tb === 'coupons' ? 'coupons' : tb === 'reviews' ? 'reviews' : tb === 'settings' ? 'settings' : 'overview')}</button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t('revenue'), value: formatTaka(revenue) },
              { label: t('sellerEarnings'), value: formatTaka(earnings) },
              { label: t('totalOrders'), value: myOrders.length },
              { label: t('myBooks'), value: myBooks.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">{s.label}</p><p className="text-2xl font-bold text-primary mt-1">{s.value}</p></div>
            ))}
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5">
            <h2 className="font-semibold mb-3">{t('analytics')}</h2>
            {chartData.length === 0 ? <p className="text-sm text-muted">এখনো কোনো বিক্রয় ডেটা নেই। ডেমো অর্ডার করলে এখানে চার্ট দেখা যাবে।</p> : (
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => formatTaka(v)} /><Line type="monotone" dataKey="sales" stroke="#6B422E" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
            )}
          </div>
        </div>
      )}
      {tab === 'books' && (
        <div className="mt-6 space-y-3">
          {myBooks.length === 0 && <p className="text-muted">এখনো কোনো বই যোগ করেননি।</p>}
          {myBooks.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white dark:bg-[#2A2521] p-3">
              <BookCover book={b} className="w-14 rounded shrink-0" />
              <div className="flex-1 min-w-[160px]">
                <p className="font-semibold">{b.titleBn}</p>
                <p className="text-sm text-muted">{formatTaka(b.price)} · স্টক {b.stock} · {b.sold} বিক্রি · <span className={b.approvalStatus === 'approved' ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>{t(b.approvalStatus) || b.approvalStatus}</span></p>
              </div>
              <button onClick={() => { setEditing(b); setTab('add') }} className="min-h-[44px] px-4 rounded-lg border font-medium text-sm">{t('edit')}</button>
              <button onClick={() => { if (confirm('বইটি মুছে ফেলবেন?')) run(async () => { await deleteBook(b.id); setRefresh((r) => r + 1) }, 'বই মুছে ফেলা হয়েছে।') }} className="min-h-[44px] px-4 rounded-lg border border-red-200 text-red-700 font-medium text-sm">{t('delete')}</button>
            </div>
          ))}
        </div>
      )}
      {tab === 'add' && (
        <div className="mt-6 max-w-2xl"><BookForm initial={editing} sellerId={sellerId} onSave={save} onCancel={() => { setEditing(null); setTab('books') }} /></div>
      )}
      {tab === 'orders' && (
        <div className="mt-6 space-y-3">
          {!isDemoMode && <p className="rounded-xl border p-4 text-sm text-muted">সেলার অর্ডার Cloud Function চালু হলে এখানে দেখা যাবে — অর্ডারের সময় সার্ভার থেকে sellerOrders তৈরি হয়। বিস্তারিত DEPLOYMENT.md-এ দেখুন।</p>}
          {myOrders.length === 0 && <p className="text-muted">এখনো কোনো অর্ডার নেই।</p>}
          {myOrders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{o.parentOrderId}</span><span className="text-sm text-muted">{t(o.status) || o.status}</span></div>
              <p className="text-sm mt-1">{o.items.map((i) => `${i.titleBn} × ${i.qty}`).join(', ')}</p>
              <p className="text-sm font-bold text-primary mt-1">{formatTaka(o.subtotal)} · আয় {formatTaka(o.sellerEarnings)} (কমিশন {formatTaka(o.commission)})</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['confirmed', 'shipped', 'delivered'].map((st) => (
                  <button key={st} onClick={() => run(async () => { await updateOrderStatus(o.parentOrderId, st, user); setRefresh((r) => r + 1) }, `অর্ডার ${t(st)} হয়েছে।`)} className="min-h-[40px] px-3 rounded-lg border text-sm font-medium">{t(st)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'earnings' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট বিক্রয়</p><p className="text-2xl font-bold text-primary">{formatTaka(revenue)}</p></div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">{t('commission')} (১০%)</p><p className="text-2xl font-bold text-red-700">−{formatTaka(commission)}</p></div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">{t('sellerEarnings')}</p><p className="text-2xl font-bold text-green-700">{formatTaka(earnings)}</p></div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5">
            <h2 className="font-semibold mb-3">কমিশন রিপোর্ট</h2>
            {myOrders.length === 0 ? <p className="text-sm text-muted">কোনো কমিশন রেকর্ড নেই।</p> : (
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={myOrders.map((o) => ({ id: o.parentOrderId.slice(-6), earnings: o.sellerEarnings, commission: o.commission }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="id" /><YAxis /><Tooltip formatter={(v) => formatTaka(v)} /><Bar dataKey="earnings" fill="#6B422E" name="আয়" /><Bar dataKey="commission" fill="#C49A6C" name="কমিশন" /></BarChart></ResponsiveContainer></div>
            )}
          </div>
        </div>
      )}
      {tab === 'coupons' && (
        <div className="mt-6 max-w-2xl space-y-4">
          {!isDemoMode && <p className="rounded-xl border p-4 text-sm text-muted">রিয়েল মোডে কুপন শুধু অ্যাডমিন/মডারেটর তৈরি করতে পারেন — সেলার কুপন তৈরি করতে পারবেন না।</p>}
          <form onSubmit={(e) => { e.preventDefault(); run(async () => { await saveCoupon({ ...couponForm, code: couponForm.code.toUpperCase(), active: true, description: `${couponForm.discountPercent}% off` }); setRefresh((r) => r + 1); setCouponForm({ code: '', discountPercent: 10, minOrder: 500 }) }, 'কুপন তৈরি হয়েছে।') }} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5 grid sm:grid-cols-3 gap-3">
            <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="কুপন কোড" required className="min-h-[48px] rounded-lg border px-3" />
            <input type="number" value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })} placeholder="ছাড় %" className="min-h-[48px] rounded-lg border px-3" />
            <input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })} placeholder="ন্যূনতম অর্ডার ৳" className="min-h-[48px] rounded-lg border px-3" />
            <button type="submit" className="sm:col-span-3 min-h-[48px] rounded-full bg-primary text-white font-bold">কুপন তৈরি করুন</button>
          </form>
          {coupons.map((c) => (
            <div key={c.code} className="flex flex-wrap justify-between items-center gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <span className="min-w-0 break-all"><strong>{c.code}</strong> — {c.discountPercent}% ছাড়, ন্যূনতম {formatTaka(c.minOrder)}</span>
              <button onClick={() => run(async () => { await deleteCoupon(c.code); setRefresh((r) => r + 1) })} className="text-red-700 text-sm font-medium min-h-[40px] px-3 shrink-0">{t('delete')}</button>
            </div>
          ))}
        </div>
      )}
      {tab === 'reviews' && (
        <div className="mt-6 space-y-3">
          {myReviews.length === 0 && <p className="text-muted">আপনার বইয়ে এখনো কোনো রিভিউ নেই।</p>}
          {myReviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <p className="font-semibold text-sm">{r.userName} · {r.rating}/5 · {r.status}</p>
              <p className="text-sm mt-1">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'settings' && (
        <div className="mt-6 max-w-2xl rounded-xl border bg-white dark:bg-[#2A2521] p-5 space-y-4">
          <h2 className="font-semibold text-lg">{t('storeSettings')}</h2>
          <ImageUpload label="স্টোরের লোগো" value={seller?.logo || ''} onChange={(v) => { run(async () => { await saveSeller({ ...seller, logo: v }); setRefresh((r) => r + 1) }) }} />
          <div><label className="block text-sm font-medium mb-1">স্টোরের বিবরণ</label><textarea defaultValue={seller?.description || ''} rows={3} onBlur={(e) => { run(async () => { await saveSeller({ ...seller, description: e.target.value }); }, 'সংরক্ষণ হয়েছে।') }} className="w-full rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 p-3" /></div>
          <p className="text-sm text-muted">যাচাইকরণ অবস্থা: {seller?.verified ? 'যাচাইকৃত' : 'অপেক্ষমাণ — অ্যাডমিন যাচাই করবেন।'}</p>
        </div>
      )}
    </div>
  )
}
