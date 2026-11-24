import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line } from 'recharts'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { isDemoMode } from '../../lib/firebase'
import { getBooks, saveBook, deleteBook, getSellers, saveSeller, getOrders, getSellerOrders, getPayments, getUsers, getCoupons, saveCoupon, deleteCoupon, getBanners, saveBanner, deleteBanner, getReviews, updateReviewStatus, getModerators, saveModerator, deleteModerator, getAuditLogs, addAudit, getSettings, saveSettings, updateOrderStatus } from '../../lib/firestore'
import { formatTaka } from '../../lib/format'
const TABS = ['overview', 'sellers', 'books', 'orders', 'customers', 'payments', 'commissions', 'coupons', 'banners', 'reviews', 'moderators', 'reports', 'settings', 'audit']
const COLORS = ['#6B422E', '#C49A6C', '#8A5A2B', '#B08D3E', '#4E2E1F']
export default function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const isAdmin = user?.role === 'admin'
  const [data, setData] = useState({ books: [], sellers: [], orders: [], sellerOrders: [], payments: [], users: [], coupons: [], banners: [], reviews: [], moderators: [], audit: [], settings: null })
  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const [books, sellers, orders, sellerOrders, payments, users, coupons, banners, reviews, moderators, audit, settings] = await Promise.all([
          getBooks(true), getSellers(), getOrders(), getSellerOrders(), getPayments(), getUsers(), getCoupons(), getBanners(), getReviews(null, true), getModerators(), getAuditLogs(), getSettings(),
        ])
        if (alive) setData({ books, sellers, orders, sellerOrders, payments, users, coupons, banners, reviews, moderators, audit, settings })
      } catch (e) { if (alive) toast.error(e.message || 'ডেটা লোড হয়নি।') }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [refresh])
  const { books, sellers, orders, sellerOrders, payments, users, coupons, banners, reviews, moderators, audit } = data
  const settings = data.settings || { shippingDhaka: 60, shippingOutsideDhaka: 120, freeShippingAbove: 1500, commissionRate: 0.1, bkashMerchant: '', nagadMerchant: '' }
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const commissionTotal = sellerOrders.reduce((s, o) => s + o.commission, 0)
  const catData = useMemo(() => {
    const m = {}
    books.forEach((b) => { m[b.category] = (m[b.category] || 0) + (b.sold || 0) })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [books])
  const salesByDay = useMemo(() => {
    const m = {}
    orders.forEach((o) => { const d = (o.createdAt || '').slice(0, 10); m[d] = (m[d] || 0) + o.total })
    return Object.entries(m).map(([date, sales]) => ({ date: date.slice(5), sales }))
  }, [orders])
  const act = (action, target) => { addAudit({ actor: user?.name, role: user?.role, action, target }).catch(() => {}); setRefresh((r) => r + 1) }
  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg) } catch (e) { toast.error(e.message || 'কাজটি হয়নি।') }
  }
  const [bannerForm, setBannerForm] = useState({ title: '', titleEn: '', subtitle: '', link: '/books' })
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 10, minOrder: 1000 })
  const [modForm, setModForm] = useState({ name: '', email: '' })
  const [settingsForm, setSettingsForm] = useState({ shippingDhaka: 60, shippingOutsideDhaka: 120, freeShippingAbove: 1500, commissionRate: 10 })
  useEffect(() => {
    if (data.settings) setSettingsForm({ shippingDhaka: data.settings.shippingDhaka, shippingOutsideDhaka: data.settings.shippingOutsideDhaka, freeShippingAbove: data.settings.freeShippingAbove, commissionRate: data.settings.commissionRate * 100 })
  }, [data.settings])
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('adminDashboard')} description="Admin dashboard — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('adminDashboard')}</h1>
      <p className="text-sm text-muted mt-1">লগইন: {user?.name} ({t(user?.role || 'admin')}) {!isAdmin && '· মডারেটর হিসেবে সীমিত অনুমতি'}</p>
      {loading && <p className="text-muted mt-4">ডেটা লোড হচ্ছে…</p>}
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Admin sections">
        {TABS.map((tb) => (
          <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)} className={`min-h-[44px] px-4 rounded-full text-sm font-semibold whitespace-nowrap ${tab === tb ? 'bg-primary text-white' : 'bg-white dark:bg-white/5 border'}`}>
            {t(tb === 'sellers' ? 'sellerApproval' : tb === 'books' ? 'bookApproval' : tb === 'orders' ? 'orderManagement' : tb === 'customers' ? 'customerManagement' : tb === 'payments' ? 'payments' : tb === 'commissions' ? 'commissions' : tb === 'coupons' ? 'coupons' : tb === 'banners' ? 'bannerManagement' : tb === 'reviews' ? 'reviews' : tb === 'moderators' ? 'moderatorManagement' : tb === 'reports' ? 'reports' : tb === 'settings' ? 'websiteSettings' : tb === 'audit' ? 'auditLogs' : 'overview')}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: t('revenue'), value: formatTaka(revenue) },
              { label: t('totalOrders'), value: orders.length },
              { label: t('totalCustomers'), value: users.filter((u) => u.role === 'customer').length },
              { label: t('totalSellers'), value: sellers.length },
              { label: t('commissions'), value: formatTaka(commissionTotal) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">{s.label}</p><p className="text-2xl font-bold text-primary mt-1">{s.value}</p></div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5">
              <h2 className="font-semibold mb-3">দৈনিক বিক্রয়</h2>
              {salesByDay.length === 0 ? <p className="text-sm text-muted">এখনো কোনো অর্ডার নেই — ডেমো চেকআউট করলে চার্ট দেখা যাবে।</p> : (
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={salesByDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => formatTaka(v)} /><Line type="monotone" dataKey="sales" stroke="#6B422E" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
              )}
            </div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5">
              <h2 className="font-semibold mb-3">ক্যাটাগরি অনুযায়ী বিক্রয়</h2>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={catData} dataKey="value" nameKey="name" outerRadius={90} label>{catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </div>
          </div>
        </div>
      )}
      {tab === 'sellers' && (
        <div className="mt-6 space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex-1 min-w-[180px]"><p className="font-semibold">{s.storeNameBn || s.storeName}</p><p className="text-sm text-muted">{s.owner} · {s.status} · {s.verified ? 'যাচাইকৃত' : 'যাচাই হয়নি'}</p></div>
              {s.status !== 'approved' && <button onClick={() => run(async () => { await saveSeller({ ...s, status: 'approved', verified: true }); act(`Seller approved: ${s.storeName}`, s.id) }, 'সেলার অনুমোদিত হয়েছে।')} className="min-h-[44px] px-4 rounded-lg bg-green-700 text-white text-sm font-semibold">{t('approve')}</button>}
              {s.status === 'approved' && <button onClick={() => run(async () => { await saveSeller({ ...s, status: 'rejected' }); act(`Seller rejected: ${s.storeName}`, s.id) }, 'সেলার বাতিল করা হয়েছে।')} className="min-h-[44px] px-4 rounded-lg border border-red-200 text-red-700 text-sm font-semibold">{t('reject')}</button>}
            </div>
          ))}
        </div>
      )}
      {tab === 'books' && (
        <div className="mt-6 space-y-3">
          {books.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex-1 min-w-[180px]"><p className="font-semibold">{b.titleBn} <span className="text-xs text-muted">({b.isbn})</span></p><p className="text-sm text-muted">{formatTaka(b.price)} · স্টক {b.stock} · <span className={b.approvalStatus === 'approved' ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>{t(b.approvalStatus) || b.approvalStatus}</span></p></div>
              {b.approvalStatus !== 'approved' && <button onClick={() => run(async () => { await saveBook({ ...b, approvalStatus: 'approved' }); act(`Book approved: ${b.titleBn}`, b.id) }, 'বই অনুমোদিত হয়েছে।')} className="min-h-[44px] px-4 rounded-lg bg-green-700 text-white text-sm font-semibold">{t('approve')}</button>}
              {b.approvalStatus === 'approved' && <button onClick={() => run(async () => { await saveBook({ ...b, approvalStatus: 'rejected' }); act(`Book rejected: ${b.titleBn}`, b.id) }, 'বই বাতিল করা হয়েছে।')} className="min-h-[44px] px-4 rounded-lg border border-red-200 text-red-700 text-sm font-semibold">{t('reject')}</button>}
              <button onClick={() => { if (confirm('বইটি মুছে ফেলবেন?')) run(async () => { await deleteBook(b.id); act(`Book deleted: ${b.titleBn}`, b.id) }) }} className="min-h-[44px] px-4 rounded-lg border text-sm">{t('delete')}</button>
            </div>
          ))}
        </div>
      )}
      {tab === 'orders' && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="text-muted">এখনো কোনো অর্ডার নেই।</p>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{o.id}</span><span className="text-sm">{t(o.status) || o.status} · {o.paymentStatus}</span></div>
              <p className="text-sm text-muted mt-1">{o.customerName} · {formatTaka(o.total)} · {o.address?.district}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['confirmed', 'shipped', 'delivered', 'cancelled'].map((st) => (
                  <button key={st} onClick={() => run(async () => { await updateOrderStatus(o.id, st, user); setRefresh((r) => r + 1) }, `অর্ডার ${t(st)} হয়েছে।`)} className="min-h-[40px] px-3 rounded-lg border text-sm font-medium">{t(st)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'customers' && (
        <div className="mt-6 space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap justify-between items-center gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4"><span className="min-w-0 break-all"><strong>{u.name}</strong> · {u.email} · {t(u.role) || u.role}</span><span className="text-sm text-muted break-all">{u.id}</span></div>
          ))}
        </div>
      )}
      {tab === 'payments' && (
        <div className="mt-6 space-y-3">
          {payments.length === 0 && <p className="text-muted">এখনো কোনো পেমেন্ট রেকর্ড নেই।</p>}
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap justify-between gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <span className="min-w-0 break-all"><strong>{p.orderId}</strong> · {p.method} · {formatTaka(p.amount)} · {p.status} {p.txnId && `· TrxID ${p.txnId}`}</span>
              {p.status === 'awaiting_verification' && <button onClick={() => { act(`Payment verified: ${p.orderId}`, p.orderId); toast.success('পেমেন্ট যাচাই হয়েছে।') }} className="min-h-[40px] px-3 rounded-lg bg-green-700 text-white text-sm font-semibold">যাচাই করুন</button>}
            </div>
          ))}
        </div>
      )}
      {tab === 'commissions' && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট কমিশন (১০%)</p><p className="text-2xl font-bold text-primary">{formatTaka(commissionTotal)}</p></div>
          {sellerOrders.map((o) => (
            <div key={o.id} className="flex flex-wrap justify-between gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <span className="min-w-0 break-all">{o.parentOrderId} · সেলার {o.sellerId}</span>
              <span className="min-w-0 break-all">বিক্রয় {formatTaka(o.subtotal)} · কমিশন {formatTaka(o.commission)} · সেলার আয় {formatTaka(o.sellerEarnings)}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'coupons' && (
        <div className="mt-6 max-w-2xl space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); run(async () => { await saveCoupon({ ...couponForm, code: couponForm.code.toUpperCase(), active: true, description: `${couponForm.discountPercent}% off` }); act(`Coupon created: ${couponForm.code}`, couponForm.code); setCouponForm({ code: '', discountPercent: 10, minOrder: 1000 }) }, 'কুপন তৈরি হয়েছে।') }} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5 grid sm:grid-cols-3 gap-3">
            <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="কুপন কোড" required className="min-h-[48px] rounded-lg border px-3" />
            <input type="number" value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })} className="min-h-[48px] rounded-lg border px-3" />
            <input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })} className="min-h-[48px] rounded-lg border px-3" />
            <button type="submit" className="sm:col-span-3 min-h-[48px] rounded-full bg-primary text-white font-bold">কুপন তৈরি করুন</button>
          </form>
          {coupons.map((c) => (
            <div key={c.code} className="flex flex-wrap justify-between items-center gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4"><span className="min-w-0 break-all"><strong>{c.code}</strong> — {c.discountPercent}% ছাড়, ন্যূনতম {formatTaka(c.minOrder)}</span><button onClick={() => run(async () => { await deleteCoupon(c.code); setRefresh((r) => r + 1) })} className="text-red-700 text-sm font-medium min-h-[40px] px-3 shrink-0">{t('delete')}</button></div>
          ))}
        </div>
      )}
      {tab === 'banners' && (
        <div className="mt-6 max-w-2xl space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); run(async () => { await saveBanner({ id: 'b' + Date.now(), ...bannerForm, active: true }); act(`Banner created: ${bannerForm.title}`, bannerForm.title); setBannerForm({ title: '', titleEn: '', subtitle: '', link: '/books' }) }, 'ব্যানার যোগ হয়েছে।') }} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5 space-y-3">
            <input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} placeholder="ব্যানার শিরোনাম (বাংলা)" required className="w-full min-h-[48px] rounded-lg border px-3" />
            <input value={bannerForm.titleEn} onChange={(e) => setBannerForm({ ...bannerForm, titleEn: e.target.value })} placeholder="Banner title (English)" className="w-full min-h-[48px] rounded-lg border px-3" />
            <input value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} placeholder="সাবটাইটেল" className="w-full min-h-[48px] rounded-lg border px-3" />
            <input value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} placeholder="লিংক (যেমন: /discounted)" className="w-full min-h-[48px] rounded-lg border px-3" />
            <button type="submit" className="w-full min-h-[48px] rounded-full bg-primary text-white font-bold">ব্যানার যোগ করুন</button>
          </form>
          {banners.map((b) => (
            <div key={b.id} className="flex flex-wrap justify-between items-center gap-2 rounded-xl border bg-white dark:bg-[#2A2521] p-4"><span className="min-w-0 break-all"><strong>{b.title}</strong> — {b.link}</span><button onClick={() => run(async () => { await deleteBanner(b.id); setRefresh((r) => r + 1) })} className="text-red-700 text-sm font-medium min-h-[40px] px-3 shrink-0">{t('delete')}</button></div>
          ))}
        </div>
      )}
      {tab === 'reviews' && (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <p className="font-semibold text-sm">{r.userName} · {r.rating}/5 · {r.status}</p>
              <p className="text-sm mt-1">{r.comment}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => run(async () => { await updateReviewStatus(r.id, 'approved'); setRefresh((r2) => r2 + 1) })} className="min-h-[40px] px-3 rounded-lg border text-sm">{t('approve')}</button>
                <button onClick={() => run(async () => { await updateReviewStatus(r.id, 'rejected'); setRefresh((r2) => r2 + 1) })} className="min-h-[40px] px-3 rounded-lg border border-red-200 text-red-700 text-sm">{t('reject')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'moderators' && (
        <div className="mt-6 max-w-2xl space-y-4">
          {!isDemoMode && <p className="rounded-xl border p-4 text-sm text-muted">রিয়েল মোডে মডারেটর Firebase কাস্টম ক্লেইম দিয়ে পরিচালিত হয় — এখান থেকে যোগ/বাদ দেওয়া যায় না। সেটআপের বিস্তারিত DEPLOYMENT.md-এ দেখুন।</p>}
          {!isAdmin && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">শুধু সুপার অ্যাডমিনই মডারেটর যোগ/বাদ দিতে পারেন।</p>}
          {isAdmin && isDemoMode && (
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await saveModerator({ id: 'u-mod-' + Date.now(), name: modForm.name, email: modForm.email, canApproveBooks: true, canManageOrders: true, canManageCategories: true, canManageBanners: false, canManageCoupons: false }); act(`Moderator added: ${modForm.email}`, modForm.email); setModForm({ name: '', email: '' }) }, 'মডারেটর যোগ হয়েছে।') }} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5 grid sm:grid-cols-2 gap-3">
              <input value={modForm.name} onChange={(e) => setModForm({ ...modForm, name: e.target.value })} placeholder="মডারেটরের নাম" required className="min-h-[48px] rounded-lg border px-3" />
              <input type="email" value={modForm.email} onChange={(e) => setModForm({ ...modForm, email: e.target.value })} placeholder="ইমেইল" required className="min-h-[48px] rounded-lg border px-3" />
              <button type="submit" className="sm:col-span-2 min-h-[48px] rounded-full bg-primary text-white font-bold">মডারেটর যোগ করুন</button>
            </form>
          )}
          {moderators.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-4">
              <div className="flex flex-wrap justify-between items-center gap-2"><span className="min-w-0 break-all"><strong>{m.name}</strong> · {m.email}</span>
                {isAdmin && <button onClick={() => run(async () => { await deleteModerator(m.id); act(`Moderator removed: ${m.email}`, m.email) })} className="text-red-700 text-sm font-medium min-h-[40px] px-3 shrink-0">{t('delete')}</button>}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                {['canApproveBooks', 'canManageOrders', 'canManageCategories', 'canManageBanners', 'canManageCoupons'].map((perm) => (
                  <label key={perm} className="inline-flex items-center gap-1.5 min-h-[32px]"><input type="checkbox" checked={!!m[perm]} disabled={!isAdmin} onChange={(e) => { run(async () => { await saveModerator({ ...m, [perm]: e.target.checked }); setRefresh((r) => r + 1) }) }} className="h-4 w-4 accent-[#6B422E]" /> {perm.replace('can', '').replace(/([A-Z])/g, ' $1')}</label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'reports' && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট অর্ডার</p><p className="text-2xl font-bold">{orders.length}</p></div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট আয়</p><p className="text-2xl font-bold text-primary">{formatTaka(revenue)}</p></div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট কমিশন</p><p className="text-2xl font-bold">{formatTaka(commissionTotal)}</p></div>
            <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5"><p className="text-sm text-muted">মোট বই বিক্রি</p><p className="text-2xl font-bold">{books.reduce((s, b) => s + (b.sold || 0), 0)}</p></div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#2A2521] p-5">
            <h2 className="font-semibold mb-3">ক্যাটাগরি অনুযায়ী বিক্রয়</h2>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={catData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#6B422E" /></BarChart></ResponsiveContainer></div>
          </div>
        </div>
      )}
      {tab === 'settings' && (
        <div className="mt-6 max-w-2xl rounded-xl border bg-white dark:bg-[#2A2521] p-5 space-y-4">
          <h2 className="font-semibold text-lg">{t('websiteSettings')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm">ঢাকা ডেলিভারি (৳)<input type="number" value={settingsForm.shippingDhaka} onChange={(e) => setSettingsForm({ ...settingsForm, shippingDhaka: Number(e.target.value) })} className="w-full min-h-[48px] rounded-lg border px-3 mt-1" /></label>
            <label className="block text-sm">ঢাকার বাইরে (৳)<input type="number" value={settingsForm.shippingOutsideDhaka} onChange={(e) => setSettingsForm({ ...settingsForm, shippingOutsideDhaka: Number(e.target.value) })} className="w-full min-h-[48px] rounded-lg border px-3 mt-1" /></label>
            <label className="block text-sm">ফ্রি ডেলিভারি সীমা (৳)<input type="number" value={settingsForm.freeShippingAbove} onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingAbove: Number(e.target.value) })} className="w-full min-h-[48px] rounded-lg border px-3 mt-1" /></label>
            <label className="block text-sm">কমিশন (%)<input type="number" value={settingsForm.commissionRate} onChange={(e) => setSettingsForm({ ...settingsForm, commissionRate: Number(e.target.value) })} className="w-full min-h-[48px] rounded-lg border px-3 mt-1" /></label>
          </div>
          <button onClick={() => run(async () => { await saveSettings({ shippingDhaka: settingsForm.shippingDhaka, shippingOutsideDhaka: settingsForm.shippingOutsideDhaka, freeShippingAbove: settingsForm.freeShippingAbove, commissionRate: settingsForm.commissionRate / 100 }); act('Website settings updated', 'settings') }, 'সেটিংস সংরক্ষণ হয়েছে।')} className="min-h-[48px] px-6 rounded-full bg-primary text-white font-bold">{t('save')}</button>
        </div>
      )}
      {tab === 'audit' && (
        <div className="mt-6 space-y-2">
          {audit.length === 0 && <p className="text-muted">এখনো কোনো অ্যাডমিন কার্যক্রম রেকর্ড হয়নি।</p>}
          {audit.slice(0, 50).map((a) => (
            <div key={a.id} className="rounded-xl border bg-white dark:bg-[#2A2521] p-3 text-sm flex flex-wrap justify-between gap-2">
              <span><strong>{a.actor}</strong> ({a.role}) — {a.action}</span>
              <span className="text-muted">{new Date(a.createdAt).toLocaleString('en-GB')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
