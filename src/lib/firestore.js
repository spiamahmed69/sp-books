// Data layer — async in both modes.
// Demo Mode (no Firebase keys): localStorage collections seeded from
// src/data/demo.js (the original demo behaviour, unchanged).
// Real Mode (Firebase configured): Cloud Firestore. All exported functions
// return Promises. Queries are built to satisfy firestore.rules:
//  - public catalogue reads use where('approvalStatus','==','approved')
//  - sellers query only their own books (where('sellerId','==', sid))
//  - sellerOrders are created ONLY by the createOrder Cloud Function
//    (rules forbid client creation), so client createOrder writes the parent
//    order + payment and embeds a per-seller breakdown; stock decrement is
//    also server-side (functions/index.js). See DEPLOYMENT.md.
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, writeBatch,
} from 'firebase/firestore'
import { db, isDemoMode } from './firebase'
import { getSession } from './session'
import { BOOKS, PENDING_BOOK, AUTHORS, PUBLISHERS, CATEGORIES, SELLERS, COUPONS, BANNERS, SETTINGS, DEMO_USERS, DEMO_REVIEWS } from '../data/demo'
import * as demoLookups from '../data/demo'
import { uid, idempotencyKey } from './format'
import { normalizeIsbn } from './isbn'

const LS = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback } }
const LS_SET = (key, val) => localStorage.setItem(key, JSON.stringify(val))
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
const snapTo = (s) => ({ id: s.id, ...s.data() })
const booksCol = () => collection(db, 'books')
const q = (...args) => query(...args)

// ---------------------------------------------------------------------------
// Demo-mode implementations (original localStorage behaviour, unchanged)
// ---------------------------------------------------------------------------
const demoGetSettings = () => ({ ...SETTINGS, ...(LS('spb_settings', {})) })
const demoGetAuthors = () => {
  const books = demoGetBooks(true)
  return AUTHORS.map((a) => ({ ...a, books: books.filter((b) => b.authorId === a.id).length }))
}
const demoGetPublishers = () => {
  const books = demoGetBooks(true)
  return PUBLISHERS.map((p) => ({ ...p, books: books.filter((b) => b.publisherId === p.id).length }))
}
const demoGetCategories = () => {
  const books = demoGetBooks(true)
  return CATEGORIES.map((c) => ({ ...c, count: books.filter((b) => b.category === c.slug).length }))
}
const demoGetBooks = (includePending = false) => {
  const extra = LS('spb_books_extra', [])
  const overrides = LS('spb_books_overrides', {})
  const base = [...BOOKS, PENDING_BOOK].map((b) => ({ ...b, ...(overrides[b.id] || {}) }))
  const all = [...base, ...extra].filter((b) => !b.deleted)
  return includePending ? all : all.filter((b) => b.approvalStatus === 'approved')
}
const demoGetBookBySlug = (slug) => demoGetBooks(true).find((b) => b.slug === slug || b.id === slug)
const demoFindBookByIsbn = (isbn) => {
  const norm = normalizeIsbn(isbn)
  return demoGetBooks(true).find((b) => normalizeIsbn(b.isbn) === norm)
}
const demoSaveBook = (book) => {
  const dup = demoFindBookByIsbn(book.isbn)
  if (dup && dup.id !== book.id) throw new Error('এই ISBN-এর বই ইতিমধ্যে আছে। / A book with this ISBN already exists.')
  const extra = LS('spb_books_extra', [])
  const overrides = LS('spb_books_overrides', {})
  if ([...BOOKS, PENDING_BOOK].some((b) => b.id === book.id)) { overrides[book.id] = book; LS_SET('spb_books_overrides', overrides) }
  else if (extra.some((b) => b.id === book.id)) LS_SET('spb_books_extra', extra.map((b) => (b.id === book.id ? book : b)))
  else LS_SET('spb_books_extra', [...extra, book])
  return book
}
const demoDeleteBook = (id) => {
  LS_SET('spb_books_extra', LS('spb_books_extra', []).filter((b) => b.id !== id))
  const o = LS('spb_books_overrides', {})
  if ([...BOOKS, PENDING_BOOK].some((b) => b.id === id)) { o[id] = { deleted: true }; LS_SET('spb_books_overrides', o) }
  else { delete o[id]; LS_SET('spb_books_overrides', o) }
}
const demoDecrementStock = (bookId, qty) => {
  const b = demoGetBooks(true).find((x) => x.id === bookId)
  if (!b) return
  demoSaveBook({ ...b, stock: Math.max(0, b.stock - qty), sold: (b.sold || 0) + qty })
}
const demoSearchBooks = (queryText) => {
  const str = String(queryText || '').trim().toLowerCase()
  if (!str) return demoGetBooks()
  return demoGetBooks().filter((b) => {
    const author = AUTHORS.find((a) => a.id === b.authorId)
    const publisher = PUBLISHERS.find((p) => p.id === b.publisherId)
    const hay = [b.title, b.titleBn, author?.name, author?.nameBn, publisher?.name, publisher?.nameBn, b.isbn, b.category, (CATEGORIES.find((c) => c.slug === b.category)?.nameBn || '')].join(' ').toLowerCase()
    return hay.includes(str)
  })
}
const demoGetSellers = () => {
  const extra = LS('spb_sellers_extra', [])
  const overrides = LS('spb_sellers_overrides', {})
  return [...SELLERS.map((s) => ({ ...s, ...(overrides[s.id] || {}) })), ...extra]
}
const demoSaveSeller = (seller) => {
  const extra = LS('spb_sellers_extra', [])
  const overrides = LS('spb_sellers_overrides', {})
  if (SELLERS.some((s) => s.id === seller.id)) { overrides[seller.id] = seller; LS_SET('spb_sellers_overrides', overrides) }
  else if (extra.some((s) => s.id === seller.id)) LS_SET('spb_sellers_extra', extra.map((s) => (s.id === seller.id ? seller : s)))
  else LS_SET('spb_sellers_extra', [...extra, seller])
  return seller
}
const demoGetReviews = (bookId, includePending = false) => {
  const all = [...DEMO_REVIEWS, ...LS('spb_reviews', [])]
  return all.filter((r) => (!bookId || r.bookId === bookId) && (includePending || r.status !== 'pending'))
}
const demoCreateOrder = ({ customer, items, address, payment, coupon }) => {
  const settings = demoGetSettings()
  for (const it of items) {
    const b = demoGetBooks(true).find((x) => x.id === it.book.id)
    if (!b || b.deleted) throw new Error(`Book unavailable: ${it.book.titleBn || it.book.title}`)
    if (b.approvalStatus !== 'approved') throw new Error(`Book not approved yet: ${b.titleBn || b.title}`)
    if (b.stock < it.qty) throw new Error(`Only ${b.stock} left in stock: ${b.titleBn || b.title}`)
  }
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
    bySeller[sid].items.push({ bookId: it.book.id, title: it.book.title, titleBn: it.book.titleBn, authorId: it.book.authorId, price: it.book.price, qty: it.qty, coverImage: it.book.coverImage || '', isbn: it.book.isbn })
    bySeller[sid].subtotal += it.book.price * it.qty
  }
  const parent = {
    id: parentId, idempotencyKey: key, customerId: customer?.id || 'guest', customerName: customer?.name || address.name,
    customerEmail: customer?.email || '', address, paymentMethod: payment.method, paymentStatus: payment.method === 'cod' ? 'unpaid' : 'pending_verification',
    txnId: payment.txnId || '', subtotal, discount, shipping, total, couponCode: coupon?.code || '',
    status: 'processing', createdAt: new Date().toISOString(), sellerIds: Object.keys(bySeller),
    items: Object.values(bySeller).flatMap((g) => g.items),
    sellerBreakdown: Object.values(bySeller).map((g) => ({ ...g, commission: Math.round(g.subtotal * settings.commissionRate), sellerEarnings: g.subtotal - Math.round(g.subtotal * settings.commissionRate) })),
  }
  const sellerOrders = Object.values(bySeller).map((g) => {
    const commission = Math.round(g.subtotal * settings.commissionRate)
    return { id: uid('SO'), parentOrderId: parentId, sellerId: g.sellerId, items: g.items, subtotal: g.subtotal, commission, sellerEarnings: g.subtotal - commission, status: 'processing', createdAt: parent.createdAt }
  })
  LS_SET('spb_orders', [parent, ...LS('spb_orders', [])])
  LS_SET('spb_seller_orders', [...sellerOrders, ...LS('spb_seller_orders', [])])
  for (const it of items) demoDecrementStock(it.book.id, it.qty)
  LS_SET('spb_payments', [{ id: uid('PAY'), orderId: parentId, method: payment.method, amount: total, txnId: payment.txnId || '', cardLast4: payment.cardLast4 || '', status: payment.method === 'cod' ? 'cod_pending' : 'awaiting_verification', createdAt: parent.createdAt }, ...LS('spb_payments', [])])
  return { parent, sellerOrders }
}

// ---------------------------------------------------------------------------
// Exported async API — dispatches to Demo (localStorage) or Real (Firestore)
// ---------------------------------------------------------------------------

export async function getSettings() {
  if (isDemoMode) return demoGetSettings()
  try {
    const s = await getDoc(doc(db, 'settings', 'main'))
    return s.exists() ? { ...SETTINGS, ...s.data() } : { ...SETTINGS }
  } catch { return { ...SETTINGS } }
}
export async function saveSettings(patch) {
  if (isDemoMode) { const s = { ...demoGetSettings(), ...patch }; LS_SET('spb_settings', s); return s }
  await setDoc(doc(db, 'settings', 'main'), clean(patch), { merge: true })
  return getSettings()
}

export async function getAuthors() {
  if (isDemoMode) return demoGetAuthors()
  const [authorsSnap, books] = await Promise.all([getDocs(collection(db, 'authors')), getBooks()])
  return authorsSnap.docs.map(snapTo).map((a) => ({ ...a, books: books.filter((b) => b.authorId === a.id).length }))
}
export async function getPublishers() {
  if (isDemoMode) return demoGetPublishers()
  const [pubSnap, books] = await Promise.all([getDocs(collection(db, 'publishers')), getBooks()])
  return pubSnap.docs.map(snapTo).map((p) => ({ ...p, books: books.filter((b) => b.publisherId === p.id).length }))
}
export async function getCategories() {
  if (isDemoMode) return demoGetCategories()
  const [catSnap, books] = await Promise.all([getDocs(collection(db, 'categories')), getBooks()])
  return catSnap.docs.map(snapTo).map((c) => ({ ...c, count: books.filter((b) => b.category === c.slug).length }))
}
export async function getAuthor(id) {
  if (isDemoMode) return demoLookups.getAuthor(id) || null
  const s = await getDoc(doc(db, 'authors', id))
  return s.exists() ? snapTo(s) : null
}
export async function getAuthorBySlug(slug) {
  if (isDemoMode) return AUTHORS.find((a) => a.slug === slug) || null
  const snap = await getDocs(q(collection(db, 'authors'), where('slug', '==', slug)))
  return snap.empty ? null : snapTo(snap.docs[0])
}
export async function getPublisher(id) {
  if (isDemoMode) return demoLookups.getPublisher(id) || null
  const s = await getDoc(doc(db, 'publishers', id))
  return s.exists() ? snapTo(s) : null
}
export async function getPublisherBySlug(slug) {
  if (isDemoMode) return PUBLISHERS.find((p) => p.slug === slug) || null
  const snap = await getDocs(q(collection(db, 'publishers'), where('slug', '==', slug)))
  return snap.empty ? null : snapTo(snap.docs[0])
}
export async function getCategory(slug) {
  if (isDemoMode) return demoLookups.getCategory(slug) || null
  const s = await getDoc(doc(db, 'categories', slug))
  return s.exists() ? snapTo(s) : null
}
export async function getSeller(id) {
  if (isDemoMode) return demoLookups.getSeller(id) || null
  const s = await getDoc(doc(db, 'sellers', id))
  return s.exists() ? snapTo(s) : null
}
export async function getSellerByOwner(ownerId) {
  if (isDemoMode) return SELLERS.find((s) => s.ownerId === ownerId) || null
  const snap = await getDocs(q(collection(db, 'sellers'), where('ownerId', '==', ownerId)))
  return snap.empty ? null : snapTo(snap.docs[0])
}

// includePending=true returns pending books too (seller/admin views). Customer
// site always calls getBooks() — approved only.
export async function getBooks(includePending = false, opts = {}) {
  if (isDemoMode) return demoGetBooks(includePending)
  const s = getSession()
  if (!includePending) {
    const snap = await getDocs(q(booksCol(), where('approvalStatus', '==', 'approved')))
    return snap.docs.map(snapTo)
  }
  if (s.isAdmin || s.isModerator) return (await getDocs(booksCol())).docs.map(snapTo)
  const sid = opts.sellerId || s.sellerId
  if (sid) {
    const snap = await getDocs(q(booksCol(), where('sellerId', '==', sid)))
    return snap.docs.map(snapTo)
  }
  const snap = await getDocs(q(booksCol(), where('approvalStatus', '==', 'approved')))
  return snap.docs.map(snapTo)
}
export async function getBookBySlug(slug) {
  if (isDemoMode) return demoGetBookBySlug(slug) || null
  try {
    const byId = await getDoc(doc(db, 'books', slug))
    if (byId.exists()) return snapTo(byId)
  } catch { /* fall through to slug query */ }
  const snap = await getDocs(q(booksCol(), where('slug', '==', slug)))
  return snap.empty ? null : snapTo(snap.docs[0])
}
export async function getBookById(id) {
  if (isDemoMode) return demoGetBooks(true).find((b) => b.id === id) || null
  try {
    const s = await getDoc(doc(db, 'books', id))
    return s.exists() ? snapTo(s) : null
  } catch { return null }
}
export async function findBookByIsbn(isbn) {
  if (isDemoMode) return demoFindBookByIsbn(isbn) || null
  const norm = normalizeIsbn(isbn)
  // Approved-only query: provable under the public read rule. Uses the
  // (isbn, approvalStatus) composite index in firestore.indexes.json; if the
  // index is not deployed yet, fall back to a client-side scan of the
  // approved catalogue.
  try {
    const snap = await getDocs(q(booksCol(), where('isbn', '==', norm), where('approvalStatus', '==', 'approved')))
    return snap.empty ? null : snapTo(snap.docs[0])
  } catch {
    return (await getBooks()).find((b) => normalizeIsbn(b.isbn) === norm) || null
  }
}
export async function saveBook(book) {
  if (isDemoMode) return demoSaveBook(book)
  const dup = await findBookByIsbn(book.isbn)
  if (dup && dup.id !== book.id) throw new Error('এই ISBN-এর বই ইতিমধ্যে আছে। / A book with this ISBN already exists.')
  const s = getSession()
  const data = clean({ ...book })
  delete data.id
  if (!s.isAdmin && !s.isModerator) {
    // Sellers may only submit books as pending (rules); editing an approved
    // book re-submits it for approval.
    data.approvalStatus = 'pending'
  }
  const id = book.id || uid('b')
  const ref = doc(db, 'books', id)
  if ((await getDoc(ref)).exists()) await updateDoc(ref, data)
  else await setDoc(ref, { ...data, id, createdAt: data.createdAt || new Date().toISOString() })
  return { ...book, id }
}
export async function deleteBook(id) {
  if (isDemoMode) return demoDeleteBook(id)
  await deleteDoc(doc(db, 'books', id))
}
export async function decrementStock(bookId, qty) {
  if (isDemoMode) return demoDecrementStock(bookId, qty)
  // Real mode: stock is decremented server-side by the createOrder Cloud
  // Function (clients cannot update approved books per firestore.rules).
  // Intentionally a no-op here.
}
export async function searchBooks(queryText) {
  const str = String(queryText || '').trim().toLowerCase()
  if (isDemoMode) return demoSearchBooks(queryText)
  if (!str) return getBooks()
  const [books, authors, publishers] = await Promise.all([getBooks(), getDocs(collection(db, 'authors')), getDocs(collection(db, 'publishers'))])
  const authorMap = Object.fromEntries(authors.docs.map((d) => [d.id, snapTo(d)]))
  const pubMap = Object.fromEntries(publishers.docs.map((d) => [d.id, snapTo(d)]))
  const cats = await getCategories()
  return books.filter((b) => {
    const author = authorMap[b.authorId]
    const publisher = pubMap[b.publisherId]
    const hay = [b.title, b.titleBn, author?.name, author?.nameBn, publisher?.name, publisher?.nameBn, b.isbn, b.category, (cats.find((c) => c.slug === b.category)?.nameBn || '')].join(' ').toLowerCase()
    return hay.includes(str)
  })
}

export async function getSellers() {
  if (isDemoMode) return demoGetSellers()
  return (await getDocs(collection(db, 'sellers'))).docs.map(snapTo)
}
export async function saveSeller(seller) {
  if (isDemoMode) return demoSaveSeller(seller)
  const data = clean({ ...seller })
  delete data.id
  await setDoc(doc(db, 'sellers', seller.id), data, { merge: true })
  return seller
}
export async function getCoupons() {
  if (isDemoMode) return [...COUPONS, ...LS('spb_coupons_extra', [])]
  return (await getDocs(collection(db, 'coupons'))).docs.map(snapTo)
}
export async function saveCoupon(c) {
  if (isDemoMode) { LS_SET('spb_coupons_extra', [...LS('spb_coupons_extra', []).filter((x) => x.code !== c.code), c]); return c }
  await setDoc(doc(db, 'coupons', c.code.toUpperCase()), clean(c), { merge: true })
  return c
}
export async function deleteCoupon(code) {
  if (isDemoMode) return LS_SET('spb_coupons_extra', LS('spb_coupons_extra', []).filter((x) => x.code !== code))
  await deleteDoc(doc(db, 'coupons', code))
}
export async function getBanners() {
  if (isDemoMode) return [...BANNERS, ...LS('spb_banners_extra', [])]
  return (await getDocs(collection(db, 'banners'))).docs.map(snapTo)
}
export async function saveBanner(b) {
  if (isDemoMode) { LS_SET('spb_banners_extra', [...LS('spb_banners_extra', []).filter((x) => x.id !== b.id), b]); return b }
  await setDoc(doc(db, 'banners', b.id), clean(b), { merge: true })
  return b
}
export async function deleteBanner(id) {
  if (isDemoMode) return LS_SET('spb_banners_extra', LS('spb_banners_extra', []).filter((x) => x.id !== id))
  await deleteDoc(doc(db, 'banners', id))
}
export async function getUsers() {
  if (isDemoMode) return [...DEMO_USERS.map(({ password, ...u }) => u), ...LS('spb_users_extra', [])]
  try {
    return (await getDocs(collection(db, 'users'))).docs.map(snapTo)
  } catch (e) {
    // Only admins can list users (firestore.rules) — expected before the
    // admin bootstrap; dashboards treat this as an empty list.
    console.warn('getUsers denied (admin only):', e.code || e.message)
    return []
  }
}
export async function getReviews(bookId, includePending = false) {
  if (isDemoMode) return demoGetReviews(bookId, includePending)
  const snap = bookId
    ? await getDocs(q(collection(db, 'reviews'), where('bookId', '==', bookId)))
    : await getDocs(collection(db, 'reviews'))
  const all = snap.docs.map(snapTo).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return all.filter((r) => includePending || r.status !== 'pending')
}
export async function addReview(review) {
  if (isDemoMode) { const all = [review, ...LS('spb_reviews', [])]; LS_SET('spb_reviews', all); return review }
  const s = getSession()
  if (!s.uid) throw new Error('রিভিউ লিখতে লগইন করুন। / Please sign in to write a review.')
  const id = review.id || uid('r')
  // Reviews start as 'pending' in real mode — an admin/moderator approves them.
  await setDoc(doc(db, 'reviews', id), clean({ ...review, id, userId: s.uid, status: 'pending', createdAt: new Date().toISOString() }))
  return { ...review, id, status: 'pending' }
}
export async function updateReviewStatus(id, status) {
  if (isDemoMode) return LS_SET('spb_reviews', LS('spb_reviews', []).map((r) => (r.id === id ? { ...r, status } : r)))
  await updateDoc(doc(db, 'reviews', id), { status })
}

// --- Orders: parent order + one sellerOrder per seller ----------------------
export async function getOrders() {
  if (isDemoMode) return LS('spb_orders', [])
  const s = getSession()
  if (s.isAdmin || s.isModerator) return (await getDocs(collection(db, 'orders'))).docs.map(snapTo)
  if (!s.uid) return []
  const snap = await getDocs(q(collection(db, 'orders'), where('customerId', '==', s.uid)))
  return snap.docs.map(snapTo)
}
export async function getSellerOrders() {
  if (isDemoMode) return LS('spb_seller_orders', [])
  const s = getSession()
  if (s.isAdmin || s.isModerator) return (await getDocs(collection(db, 'sellerOrders'))).docs.map(snapTo)
  if (!s.sellerId) return []
  const snap = await getDocs(q(collection(db, 'sellerOrders'), where('sellerId', '==', s.sellerId)))
  return snap.docs.map(snapTo)
}
export async function getOrderById(id) {
  if (isDemoMode) return LS('spb_orders', []).find((o) => o.id === id) || null
  try {
    const s = await getDoc(doc(db, 'orders', id))
    return s.exists() ? snapTo(s) : null
  } catch { return null }
}
export async function getPayments() {
  if (isDemoMode) return LS('spb_payments', [])
  const s = getSession()
  if (s.isAdmin || s.isModerator) return (await getDocs(collection(db, 'payments'))).docs.map(snapTo)
  if (!s.uid) return []
  const snap = await getDocs(q(collection(db, 'payments'), where('customerId', '==', s.uid)))
  return snap.docs.map(snapTo)
}

export async function createOrder({ customer, items, address, payment, coupon, idempotencyKey: key }) {
  if (isDemoMode) return demoCreateOrder({ customer, items, address, payment, coupon })
  const s = getSession()
  if (!s.uid) throw new Error('অর্ডার করতে লগইন করুন। / Please sign in to place an order.')
  const settings = await getSettings()
  const keyToUse = key || idempotencyKey()
  // Idempotency: the same key can never create a second order.
  const mine = await getDocs(q(collection(db, 'orders'), where('customerId', '==', s.uid)))
  const existing = mine.docs.map(snapTo).find((o) => o.idempotencyKey === keyToUse)
  if (existing) return { parent: existing, sellerOrders: [] }
  // 1) Fresh stock check — prevents overselling.
  const fresh = []
  for (const it of items) {
    const b = await getBookById(it.book.id)
    if (!b) throw new Error(`Book unavailable: ${it.book.titleBn || it.book.title}`)
    if (b.approvalStatus !== 'approved') throw new Error(`Book not approved yet: ${b.titleBn || b.title}`)
    if (b.stock < it.qty) throw new Error(`Only ${b.stock} left in stock: ${b.titleBn || b.title}`)
    fresh.push(b)
  }
  const parentId = uid('SPB')
  const subtotal = items.reduce((sum, it, i) => sum + fresh[i].price * it.qty, 0)
  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0
  const isDhaka = address.district === 'Dhaka'
  const shipping = subtotal - discount >= settings.freeShippingAbove ? 0 : (isDhaka ? settings.shippingDhaka : settings.shippingOutsideDhaka)
  const total = subtotal - discount + shipping
  const bySeller = {}
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const b = fresh[i]
    const sid = b.sellerId
    bySeller[sid] = bySeller[sid] || { sellerId: sid, items: [], subtotal: 0 }
    // Immutable snapshot: copy title/price/cover into the order at creation.
    bySeller[sid].items.push({ bookId: b.id, title: b.title, titleBn: b.titleBn, authorId: b.authorId, price: b.price, qty: it.qty, coverImage: b.coverImage || '', isbn: b.isbn })
    bySeller[sid].subtotal += b.price * it.qty
  }
  const sellerBreakdown = Object.values(bySeller).map((g) => {
    const commission = Math.round(g.subtotal * settings.commissionRate)
    return { ...g, commission, sellerEarnings: g.subtotal - commission }
  })
  const createdAt = new Date().toISOString()
  const parent = {
    id: parentId, idempotencyKey: keyToUse, customerId: s.uid, customerName: customer?.name || address.name,
    customerEmail: customer?.email || '', address, paymentMethod: payment.method, paymentStatus: payment.method === 'cod' ? 'unpaid' : 'pending_verification',
    txnId: payment.txnId || '', subtotal, discount, shipping, total, couponCode: coupon?.code || '',
    status: 'processing', createdAt, sellerIds: Object.keys(bySeller),
    items: Object.values(bySeller).flatMap((g) => g.items),
    sellerBreakdown,
  }
  // 2) One atomic batch: parent order + payment record.
  // sellerOrders docs and stock decrement are server-side only (the
  // createOrder Cloud Function, functions/index.js) — firestore.rules
  // forbids clients from creating sellerOrders or updating approved books.
  const batch = writeBatch(db)
  batch.set(doc(db, 'orders', parentId), clean(parent))
  batch.set(doc(db, 'payments', uid('PAY')), clean({
    id: uid('PAY'), orderId: parentId, customerId: s.uid, method: payment.method, amount: total,
    txnId: payment.txnId || '', cardLast4: payment.cardLast4 || '',
    status: payment.method === 'cod' ? 'cod_pending' : 'awaiting_verification', createdAt,
  }))
  await batch.commit()
  return { parent, sellerOrders: [] }
}

export async function updateOrderStatus(orderId, status, actor) {
  if (isDemoMode) {
    const update = (list) => list.map((o) => (o.id === orderId ? { ...o, status } : o))
    LS_SET('spb_orders', update(LS('spb_orders', [])))
    LS_SET('spb_seller_orders', update(LS('spb_seller_orders', [])))
    await addAudit({ actor: actor?.name || 'system', role: actor?.role || '-', action: `Order ${orderId} → ${status}`, target: orderId })
    return
  }
  const s = getSession()
  if (s.isAdmin || s.isModerator) {
    await updateDoc(doc(db, 'orders', orderId), { status })
    const so = await getDocs(q(collection(db, 'sellerOrders'), where('parentOrderId', '==', orderId)))
    await Promise.all(so.docs.map((d) => updateDoc(d.ref, { status })))
  } else if (s.sellerId) {
    const so = await getDocs(q(collection(db, 'sellerOrders'), where('sellerId', '==', s.sellerId)))
    const mine = so.docs.filter((d) => d.data().parentOrderId === orderId)
    if (mine.length === 0) throw new Error('এই অর্ডারের সেলার রেকর্ড এখনো তৈরি হয়নি — স্ট্যাটাস বদলাতে সার্ভার (Cloud Function) চালু থাকতে হবে।')
    await Promise.all(mine.map((d) => updateDoc(d.ref, { status })))
  } else {
    throw new Error('অর্ডারের স্ট্যাটাস বদলাতে অনুমতি নেই।')
  }
  await addAudit({ actor: actor?.name || 'system', role: actor?.role || '-', action: `Order ${orderId} → ${status}`, target: orderId })
}

// --- Audit log ---------------------------------------------------------------
export async function getAuditLogs() {
  if (isDemoMode) return LS('spb_audit', [])
  try {
    return (await getDocs(collection(db, 'auditLogs'))).docs.map(snapTo)
  } catch { return [] } // admin-only read; expected before the admin bootstrap
}
export async function addAudit(entry) {
  if (isDemoMode) { LS_SET('spb_audit', [{ id: uid('AUD'), createdAt: new Date().toISOString(), ...entry }, ...LS('spb_audit', [])].slice(0, 500)); return }
  try {
    await setDoc(doc(db, 'auditLogs', uid('AUD')), clean({ ...entry, createdAt: new Date().toISOString() }))
  } catch { /* audit is best-effort; never block the action */ }
}

// --- Moderators (claims-managed; there is no moderators collection) ---------
export async function getModerators() {
  if (isDemoMode) return LS('spb_moderators', [
    { id: 'u-mod', name: 'Moderator Tanvir', email: 'moderator@sp.demo', canApproveBooks: true, canManageOrders: true, canManageCategories: true, canManageBanners: false, canManageCoupons: false },
  ])
  // Real mode: moderator rights live in Firebase custom claims, set only by
  // the Admin SDK (setAdminClaim). There is no collection to list.
  return []
}
export async function saveModerator(m) {
  if (isDemoMode) { LS_SET('spb_moderators', [...(await getModerators()).filter((x) => x.id !== m.id), m]); return m }
  throw new Error('মডারেটর পরিচালনা শুধু Admin SDK (setAdminClaim) দিয়ে হয় — দেখুন DEPLOYMENT.md।')
}
export async function deleteModerator(id) {
  if (isDemoMode) { LS_SET('spb_moderators', (await getModerators()).filter((x) => x.id !== id)); return }
  throw new Error('মডারেটর পরিচালনা শুধু Admin SDK (setAdminClaim) দিয়ে হয় — দেখুন DEPLOYMENT.md।')
}

// --- Per-user cart / wishlist / addresses ------------------------------------
export async function getCartItems(userId) {
  if (isDemoMode || !userId) return LS('spb_cart', [])
  try {
    const s = await getDoc(doc(db, 'carts', userId))
    return s.exists() ? (s.data().items || []) : []
  } catch { return [] }
}
export async function saveCartItems(userId, items) {
  if (isDemoMode || !userId) { LS_SET('spb_cart', items); return }
  try { await setDoc(doc(db, 'carts', userId), { items, updatedAt: new Date().toISOString() }) } catch { /* offline — local state still holds the cart */ }
}
export async function getWishlistIds(userId) {
  if (isDemoMode || !userId) return LS('spb_wishlist', [])
  try {
    const s = await getDoc(doc(db, 'wishlists', userId))
    return s.exists() ? (s.data().bookIds || []) : []
  } catch { return [] }
}
export async function saveWishlistIds(userId, ids) {
  if (isDemoMode || !userId) { LS_SET('spb_wishlist', ids); return }
  try { await setDoc(doc(db, 'wishlists', userId), { bookIds: ids, updatedAt: new Date().toISOString() }) } catch { /* offline */ }
}
export async function getAddresses(userId) {
  if (isDemoMode || !userId) return LS('spb_addresses', [])
  try {
    const s = await getDoc(doc(db, 'addresses', userId))
    return s.exists() ? (s.data().list || []) : []
  } catch { return [] }
}
export async function saveAddresses(userId, list) {
  if (isDemoMode || !userId) { LS_SET('spb_addresses', list); return }
  try { await setDoc(doc(db, 'addresses', userId), { list, updatedAt: new Date().toISOString() }) } catch { /* offline */ }
}

// --- Recently viewed (device-local, both modes) ------------------------------
export function getRecentlyViewed() { return LS('spb_recent', []) }
export function pushRecentlyViewed(bookId) {
  const list = [bookId, ...getRecentlyViewed().filter((x) => x !== bookId)].slice(0, 8)
  LS_SET('spb_recent', list)
  return list
}
export { db, isDemoMode }
