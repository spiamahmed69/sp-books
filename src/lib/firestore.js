// Data layer. Demo Mode: localStorage collections (seeded from src/data/demo.js).
// Production (Firebase configured): Firestore — see DEPLOYMENT.md.
// Order creation follows the parent-child architecture: one parent order +
// one sellerOrder per seller, per-seller subtotal, shipping, 10% commission,
// separate seller earnings. Stock is checked at checkout to prevent overselling;
// the Cloud Function (functions/index.js) repeats the check in a transaction.
import { db, isDemoMode } from './firebase'
import { BOOKS, PENDING_BOOK, AUTHORS, PUBLISHERS, CATEGORIES, SELLERS, COUPONS, BANNERS, SETTINGS, DEMO_USERS, DEMO_REVIEWS } from '../data/demo'
export { getAuthor, getPublisher, getCategory, getSeller } from '../data/demo'
import { uid, idempotencyKey } from './format'
import { normalizeIsbn } from './isbn'

const LS = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback } }
const LS_SET = (key, val) => localStorage.setItem(key, JSON.stringify(val))

export const getSettings = () => ({ ...SETTINGS, ...(LS('spb_settings', {})) })
export const saveSettings = (patch) => { const s = { ...getSettings(), ...patch }; LS_SET('spb_settings', s); return s }

export const getAuthors = () => {
  const books = getBooks(true)
  return AUTHORS.map((a) => ({ ...a, books: books.filter((b) => b.authorId === a.id).length }))
}
export const getPublishers = () => {
  const books = getBooks(true)
  return PUBLISHERS.map((p) => ({ ...p, books: books.filter((b) => b.publisherId === p.id).length }))
}
export const getCategories = () => {
  const books = getBooks(true)
  return CATEGORIES.map((c) => ({ ...c, count: books.filter((b) => b.category === c.slug).length }))
}

// includePending=true returns pending books too (seller/admin views). Customer
// site always calls getBooks() — approved only.
export const getBooks = (includePending = false) => {
  const extra = LS('spb_books_extra', [])
  const overrides = LS('spb_books_overrides', {})
  const base = [...BOOKS, PENDING_BOOK].map((b) => ({ ...b, ...(overrides[b.id] || {}) }))
  const all = [...base, ...extra].filter((b) => !b.deleted)
  return includePending ? all : all.filter((b) => b.approvalStatus === 'approved')
}
export const getBookBySlug = (slug) => getBooks(true).find((b) => b.slug === slug || b.id === slug)
export const getBookById = (id) => getBooks(true).find((b) => b.id === id)
export const findBookByIsbn = (isbn) => {
  const norm = normalizeIsbn(isbn)
  return getBooks(true).find((b) => normalizeIsbn(b.isbn) === norm)
}
export const saveBook = (book) => {
  // Duplicate-ISBN guard: no two different books may share an ISBN.
  const dup = findBookByIsbn(book.isbn)
  if (dup && dup.id !== book.id) throw new Error('এই ISBN-এর বই ইতিমধ্যে আছে। / A book with this ISBN already exists.')
  const extra = LS('spb_books_extra', [])
  const overrides = LS('spb_books_overrides', {})
  if ([...BOOKS, PENDING_BOOK].some((b) => b.id === book.id)) { overrides[book.id] = book; LS_SET('spb_books_overrides', overrides) }
  else if (extra.some((b) => b.id === book.id)) LS_SET('spb_books_extra', extra.map((b) => (b.id === book.id ? book : b)))
  else LS_SET('spb_books_extra', [...extra, book])
  return book
}
export const deleteBook = (id) => {
  LS_SET('spb_books_extra', LS('spb_books_extra', []).filter((b) => b.id !== id))
  const o = LS('spb_books_overrides', {})
  if ([...BOOKS, PENDING_BOOK].some((b) => b.id === id)) { o[id] = { deleted: true }; LS_SET('spb_books_overrides', o) }
  else { delete o[id]; LS_SET('spb_books_overrides', o) }
}
export const decrementStock = (bookId, qty) => {
  const b = getBooks(true).find((x) => x.id === bookId)
  if (!b) return
  saveBook({ ...b, stock: Math.max(0, b.stock - qty), sold: (b.sold || 0) + qty })
}
export const searchBooks = (query) => {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return getBooks()
  return getBooks().filter((b) => {
    const author = AUTHORS.find((a) => a.id === b.authorId)
    const publisher = PUBLISHERS.find((p) => p.id === b.publisherId)
    const hay = [b.title, b.titleBn, author?.name, author?.nameBn, publisher?.name, publisher?.nameBn, b.isbn, b.category, (CATEGORIES.find((c) => c.slug === b.category)?.nameBn || '')].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export const getSellers = () => {
  const extra = LS('spb_sellers_extra', [])
  const overrides = LS('spb_sellers_overrides', {})
  return [...SELLERS.map((s) => ({ ...s, ...(overrides[s.id] || {}) })), ...extra]
}
export const saveSeller = (seller) => {
  const extra = LS('spb_sellers_extra', [])
  const overrides = LS('spb_sellers_overrides', {})
  if (SELLERS.some((s) => s.id === seller.id)) { overrides[seller.id] = seller; LS_SET('spb_sellers_overrides', overrides) }
  else if (extra.some((s) => s.id === seller.id)) LS_SET('spb_sellers_extra', extra.map((s) => (s.id === seller.id ? seller : s)))
  else LS_SET('spb_sellers_extra', [...extra, seller])
  return seller
}
export const getCoupons = () => [...COUPONS, ...LS('spb_coupons_extra', [])]
export const saveCoupon = (c) => { LS_SET('spb_coupons_extra', [...LS('spb_coupons_extra', []).filter((x) => x.code !== c.code), c]); return c }
export const deleteCoupon = (code) => LS_SET('spb_coupons_extra', LS('spb_coupons_extra', []).filter((x) => x.code !== code))
export const getBanners = () => [...BANNERS, ...LS('spb_banners_extra', [])]
export const saveBanner = (b) => { LS_SET('spb_banners_extra', [...LS('spb_banners_extra', []).filter((x) => x.id !== b.id), b]); return b }
export const deleteBanner = (id) => LS_SET('spb_banners_extra', LS('spb_banners_extra', []).filter((x) => x.id !== id))
export const getUsers = () => [...DEMO_USERS.map(({ password, ...u }) => u), ...LS('spb_users_extra', [])]
export const getReviews = (bookId, includePending = false) => {
  const all = [...DEMO_REVIEWS, ...LS('spb_reviews', [])]
  return all.filter((r) => (!bookId || r.bookId === bookId) && (includePending || r.status !== 'pending'))
}
export const addReview = (review) => { const all = [review, ...LS('spb_reviews', [])]; LS_SET('spb_reviews', all); return review }
export const updateReviewStatus = (id, status) => {
  LS_SET('spb_reviews', LS('spb_reviews', []).map((r) => (r.id === id ? { ...r, status } : r)))
}

// --- Orders: parent order + one sellerOrder per seller ----------------------
export const getOrders = () => LS('spb_orders', [])
export const getSellerOrders = () => LS('spb_seller_orders', [])
export const getOrderById = (id) => getOrders().find((o) => o.id === id)
export const getPayments = () => LS('spb_payments', [])

export function createOrder({ customer, items, address, payment, coupon }) {
  // items: [{ book, qty }]
  const settings = getSettings()
  // 1) Stock check — prevents overselling. Throws if any item is short.
  for (const it of items) {
    const b = getBooks(true).find((x) => x.id === it.book.id)
    if (!b || b.deleted) throw new Error(`Book unavailable: ${it.book.titleBn || it.book.title}`)
    if (b.approvalStatus !== 'approved') throw new Error(`Book not approved yet: ${b.titleBn || b.title}`)
    if (b.stock < it.qty) throw new Error(`Only ${b.stock} left in stock: ${b.titleBn || b.title}`)
  }
  // 2) Idempotency: same key can never create a second order.
  const key = idempotencyKey()
  const parentId = uid('SPB')
  const subtotal = items.reduce((s, it) => s + it.book.price * it.qty, 0)
  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0
  const isDhaka = address.district === 'Dhaka'
  const shipping = subtotal - discount >= settings.freeShippingAbove ? 0 : (isDhaka ? settings.shippingDhaka : settings.shippingOutsideDhaka)
  const total = subtotal - discount + shipping
  const bySeller = {}
  for (const it of items) {
    const sid = it.book.sellerId
    bySeller[sid] = bySeller[sid] || { sellerId: sid, items: [], subtotal: 0 }
    // Immutable snapshot: copy title/price/cover into the order at creation.
    bySeller[sid].items.push({ bookId: it.book.id, title: it.book.title, titleBn: it.book.titleBn, authorId: it.book.authorId, price: it.book.price, qty: it.qty, coverImage: it.book.coverImage || '', isbn: it.book.isbn })
    bySeller[sid].subtotal += it.book.price * it.qty
  }
  const parent = {
    id: parentId, idempotencyKey: key, customerId: customer?.id || 'guest', customerName: customer?.name || address.name,
    customerEmail: customer?.email || '', address, paymentMethod: payment.method, paymentStatus: payment.method === 'cod' ? 'unpaid' : 'pending_verification',
    txnId: payment.txnId || '', subtotal, discount, shipping, total, couponCode: coupon?.code || '',
    status: 'processing', createdAt: new Date().toISOString(), sellerIds: Object.keys(bySeller),
    items: Object.values(bySeller).flatMap((g) => g.items),
  }
  const sellerOrders = Object.values(bySeller).map((g) => {
    const commission = Math.round(g.subtotal * settings.commissionRate)
    return { id: uid('SO'), parentOrderId: parentId, sellerId: g.sellerId, items: g.items, subtotal: g.subtotal, commission, sellerEarnings: g.subtotal - commission, status: 'processing', createdAt: parent.createdAt }
  })
  LS_SET('spb_orders', [parent, ...getOrders()])
  LS_SET('spb_seller_orders', [...sellerOrders, ...getSellerOrders()])
  for (const it of items) decrementStock(it.book.id, it.qty)
  LS_SET('spb_payments', [{ id: uid('PAY'), orderId: parentId, method: payment.method, amount: total, txnId: payment.txnId || '', cardLast4: payment.cardLast4 || '', status: payment.method === 'cod' ? 'cod_pending' : 'awaiting_verification', createdAt: parent.createdAt }, ...getPayments()])
  return { parent, sellerOrders }
}

export const updateOrderStatus = (orderId, status, actor) => {
  const update = (list) => list.map((o) => (o.id === orderId ? { ...o, status } : o))
  LS_SET('spb_orders', update(getOrders()))
  LS_SET('spb_seller_orders', update(getSellerOrders()))
  addAudit({ actor: actor?.name || 'system', role: actor?.role || '-', action: `Order ${orderId} → ${status}`, target: orderId })
}

// --- Audit log ---------------------------------------------------------------
export const getAuditLogs = () => LS('spb_audit', [])
export const addAudit = (entry) => { LS_SET('spb_audit', [{ id: uid('AUD'), createdAt: new Date().toISOString(), ...entry }, ...getAuditLogs()].slice(0, 500)) }

// --- Moderators (configurable limited permissions; only Super Admin grants) ---
export const getModerators = () => LS('spb_moderators', [
  { id: 'u-mod', name: 'Moderator Tanvir', email: 'moderator@sp.demo', canApproveBooks: true, canManageOrders: true, canManageCategories: true, canManageBanners: false, canManageCoupons: false },
])
export const saveModerator = (m) => { LS_SET('spb_moderators', [...getModerators().filter((x) => x.id !== m.id), m]); return m }
export const deleteModerator = (id) => LS_SET('spb_moderators', getModerators().filter((x) => x.id !== id))

// --- Recently viewed (local) --------------------------------------------------
export const getRecentlyViewed = () => LS('spb_recent', [])
export const pushRecentlyViewed = (bookId) => {
  const list = [bookId, ...getRecentlyViewed().filter((x) => x !== bookId)].slice(0, 8)
  LS_SET('spb_recent', list)
  return list
}
export { db, isDemoMode }
