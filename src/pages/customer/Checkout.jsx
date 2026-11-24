import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Truck, CreditCard, Banknote, Wallet } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCover from '../../components/BookCover'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { bookService } from '../../services/bookService'
import { createOrder, getCoupons, getSettings } from '../../lib/firestore'
import { isDemoMode } from '../../lib/firebase'
import { DISTRICTS } from '../../data/demo'
import { formatTaka, idempotencyKey } from '../../lib/format'
import { initiatePayment, validatePaymentInput, PAYMENT_METHODS } from '../../services/payment'
export default function Checkout() {
  const { items, clear } = useCart()
  const { user } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const navigate = useNavigate()
  // One idempotency key per checkout session: a retry or double-submit can
  // never create a second order with the same key.
  const orderKeyRef = useRef(null)
  if (!orderKeyRef.current) orderKeyRef.current = idempotencyKey()
  const itemsKey = JSON.stringify(items)
  const { data } = useAsyncData(async () => {
    const list = JSON.parse(itemsKey)
    const [settings, books] = await Promise.all([
      getSettings(),
      Promise.all(list.map((i) => bookService.bySlug(i.bookId))),
    ])
    return { settings, detailed: list.map((i, idx) => ({ ...i, book: books[idx] })).filter((i) => i.book) }
  }, [itemsKey])
  const settings = data?.settings || { freeShippingAbove: 1500, shippingDhaka: 60, shippingOutsideDhaka: 120 }
  const detailed = data?.detailed || []
  const [form, setForm] = useState({ name: user?.name || '', phone: '', address: '', district: 'Dhaka', upazila: '' })
  const [method, setMethod] = useState('cod')
  const [txnId, setTxnId] = useState('')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [done, setDone] = useState(null)
  const subtotal = detailed.reduce((s, i) => s + i.book.price * i.qty, 0)
  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0
  const isDhaka = form.district === 'Dhaka'
  const shipping = subtotal === 0 ? 0 : subtotal - discount >= settings.freeShippingAbove ? 0 : (isDhaka ? settings.shippingDhaka : settings.shippingOutsideDhaka)
  const total = subtotal - discount + shipping
  const applyCoupon = async () => {
    const coupons = await getCoupons()
    const found = coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active)
    if (!found || subtotal < found.minOrder) { toast.error(t('invalidCoupon')); setCoupon(null); return }
    setCoupon(found); toast.success(t('couponApplied'))
  }
  const placeOrder = async (e) => {
    e.preventDefault()
    if (detailed.length === 0) { toast.error(t('emptyCart')); return }
    if (!isDemoMode && !user) { toast.error('অর্ডার করতে লগইন করুন। / Please sign in to place an order.'); navigate('/login', { state: { from: '/checkout' } }); return }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.upazila.trim()) { toast.error('ঠিকানার সব ঘর পূরণ করুন। / Please fill in all address fields.'); return }
    const payErr = validatePaymentInput(method, { txnId, cardNumber: card.number, expiry: card.expiry, cvc: card.cvc })
    if (payErr) { toast.error(payErr); return }
    setPlacing(true)
    try {
      const pay = await initiatePayment({ method, amount: total, txnId, cardLast4: method === 'card' ? card.number.replace(/\D/g, '').slice(-4) : '' })
      if (!pay.ok) { toast.error(pay.message); return }
      const { parent } = await createOrder({
        customer: user,
        items: detailed,
        address: { ...form, division: isDhaka ? 'dhaka' : 'outside' },
        payment: { method, txnId, cardLast4: method === 'card' ? card.number.replace(/\D/g, '').slice(-4) : '' },
        coupon,
        idempotencyKey: orderKeyRef.current,
      })
      clear()
      setDone(parent)
      toast.success(t('orderPlaced'))
    } catch (err) {
      toast.error(err.message || 'অর্ডার করা যায়নি। আবার চেষ্টা করুন।')
    } finally { setPlacing(false) }
  }
  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <SEO title={t('orderPlaced')} description="Order placed — SP Books" />
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
        <h1 className="font-display text-3xl font-bold mt-4">{t('orderPlaced')}</h1>
        <p className="text-muted mt-2">{t('thankYou')}</p>
        <p className="mt-4 rounded-xl border bg-white dark:bg-white/5 p-4 text-left text-sm space-y-1">
          <span className="block break-all"><strong>{t('orderId')}:</strong> {done.id}</span>
          <span className="block"><strong>{t('total')}:</strong> {formatTaka(done.total)}</span>
          <span className="block"><strong>{t('paymentMethod')}:</strong> {PAYMENT_METHODS.find((m) => m.id === done.paymentMethod)?.labelBn}</span>
          <span className="block"><strong>{t('deliveryAddress')}:</strong> {done.address.address}, {done.address.upazila}, {done.address.district}</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate(`/track/${done.id}`)} className="min-h-[48px] px-6 rounded-full bg-primary text-white font-bold">{t('trackOrder')}</button>
          <button onClick={() => navigate('/orders')} className="min-h-[48px] px-6 rounded-full border border-[#D8C9B0] font-semibold">{t('orders')}</button>
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('checkout')} description="Checkout — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('checkout')}</h1>
      {!isDemoMode && !user && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">অর্ডার করতে প্রথমে <button onClick={() => navigate('/login', { state: { from: '/checkout' } })} className="font-semibold underline">লগইন</button> করুন।</p>
      )}
      {detailed.length === 0 ? (
        <p className="text-muted mt-6">কার্ট খালি। <button onClick={() => navigate('/books')} className="text-primary font-medium">বই দেখুন</button></p>
      ) : (
        <form onSubmit={placeOrder} className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> {t('deliveryAddress')}</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <Field label={t('name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label={t('phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required placeholder="01XXXXXXXXX" />
                <div className="sm:col-span-2"><Field label={t('address')} value={form.address} onChange={(v) => setForm({ ...form, address: v })} required placeholder="বাসা/হোল্ডিং, রোড, এলাকা" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="district">{t('district')}</label>
                  <select id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3">
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Field label={t('upazila')} value={form.upazila} onChange={(v) => setForm({ ...form, upazila: v })} required placeholder="যেমন: কটিয়াদী" />
              </div>
              <p className="text-xs text-muted mt-3">ডেলিভারি চার্জ: ঢাকা ৳৬০, ঢাকার বাইরে ৳১২০, ৳১,৫০০+ অর্ডারে ফ্রি।</p>
            </section>
            <section className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5">
              <h2 className="font-semibold text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> {t('paymentMethod')}</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-4" role="radiogroup" aria-label={t('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)} aria-pressed={method === m.id} className={`min-h-[56px] rounded-xl border-2 px-4 text-left flex items-center gap-3 font-semibold ${method === m.id ? 'border-primary bg-primary-light/40 dark:bg-white/10' : 'border-[#E9DFCE] dark:border-white/10'}`}>
                    {m.id === 'cod' ? <Banknote className="h-5 w-5" /> : m.id === 'card' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                    {m.labelBn} <span className="text-xs text-muted font-normal ml-auto">{m.label}</span>
                  </button>
                ))}
              </div>
              {(method === 'bkash' || method === 'nagad') && (
                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                  <p>{t('txnHelp')}</p>
                  <p className="mt-1 font-semibold">মার্চেন্ট নম্বর: {method === 'bkash' ? settings.bkashMerchant : settings.nagadMerchant}</p>
                  <label className="block text-sm font-medium mt-3 mb-1" htmlFor="txn">{t('txnId')}</label>
                  <input id="txn" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="যেমন: 9HX7K2LMN1" className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" />
                </div>
              )}
              {method === 'card' && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted">{t('cardNote')}</p>
                  <Field label="কার্ড নম্বর" value={card.number} onChange={(v) => setCard({ ...card, number: v })} placeholder="4242 4242 4242 4242" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="মেয়াদ (MM/YY)" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v })} placeholder="12/28" />
                    <Field label="CVC" value={card.cvc} onChange={(v) => setCard({ ...card, cvc: v })} placeholder="123" />
                  </div>
                </div>
              )}
            </section>
          </div>
          <aside className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 md:sticky md:top-36">
            <h2 className="font-semibold text-lg">{t('orderSummary')}</h2>
            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
              {detailed.map((i) => (
                <div key={i.bookId} className="flex gap-2 items-center text-sm">
                  <BookCover book={i.book} className="w-10 rounded shrink-0" />
                  <span className="flex-1 line-clamp-1">{i.book.titleBn} × {i.qty}</span>
                  <span className="font-semibold">{formatTaka(i.book.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="কুপন কোড (যেমন: SP10)" aria-label="Coupon code" className="flex-1 min-h-[44px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3 text-sm min-w-0" />
              <button type="button" onClick={applyCoupon} className="min-h-[44px] px-4 rounded-lg bg-primary text-white text-sm font-semibold">{t('applyCoupon')}</button>
            </div>
            {coupon && <p className="text-sm text-green-700 mt-2">{t('couponApplied')} — {coupon.code} ({coupon.discountPercent}%)</p>}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>{t('subtotal')}</dt><dd className="font-semibold">{formatTaka(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-green-700"><dt>{t('discount')}</dt><dd className="font-semibold">−{formatTaka(discount)}</dd></div>}
              <div className="flex justify-between"><dt>{t('shipping')} ({isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'})</dt><dd className="font-semibold">{shipping === 0 ? 'ফ্রি' : formatTaka(shipping)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">{t('total')}</dt><dd className="font-bold text-primary">{formatTaka(total)}</dd></div>
            </dl>
            <button type="submit" disabled={placing} className="mt-4 w-full min-h-[52px] rounded-full bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-60">{placing ? t('placingOrder') : `${t('placeOrder')} · ${formatTaka(total)}`}</button>
          </aside>
        </form>
      )}
    </div>
  )
}
function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}{required && ' *'}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" />
    </div>
  )
}
