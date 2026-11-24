// Seller Add/Edit Book form: ISBN validation (check digit), duplicate-ISBN guard,
// price/discount/stock management, cover upload via ImageUpload.
import { useState } from 'react'
import ImageUpload from '../../components/ImageUpload'
import { useAsyncData } from '../../hooks/useAsyncData'
import { isbnError, normalizeIsbn } from '../../lib/isbn'
import { findBookByIsbn, getAuthors, getPublishers, getCategories } from '../../lib/firestore'
import { slugify, uid } from '../../lib/format'
export default function BookForm({ initial, sellerId, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', titleBn: '', authorId: '', publisherId: '', category: '', isbn: '',
    edition: '1st', language: 'বাংলা', pages: 200, binding: 'পেপারব্যাক',
    price: 200, oldPrice: 250, stock: 20, description: '', descriptionBn: '', coverImage: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: refData } = useAsyncData(async () => {
    const [authors, publishers, categories] = await Promise.all([getAuthors(), getPublishers(), getCategories()])
    return { authors, publishers, categories }
  }, [])
  const authors = refData?.authors || []
  const publishers = refData?.publishers || []
  const categories = refData?.categories || []
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = async (e) => {
    e.preventDefault()
    const err = isbnError(form.isbn)
    if (err) { setError(err); return }
    if (!form.titleBn.trim() || !form.authorId || !form.publisherId || !form.category) { setError('বইয়ের নাম, লেখক, প্রকাশক ও ক্যাটাগরি আবশ্যক।'); return }
    if (Number(form.price) <= 0 || Number(form.stock) < 0) { setError('সঠিক দাম ও স্টক দিন।'); return }
    setSaving(true)
    try {
      const dup = await findBookByIsbn(form.isbn)
      if (dup && dup.id !== form.id) { setError('এই ISBN-এর বই ইতিমধ্যে আছে। / A book with this ISBN already exists.'); return }
      const book = {
        ...form,
        id: form.id || uid('b'),
        slug: form.slug || slugify(form.titleBn || form.title) || uid('b'),
        isbn: normalizeIsbn(form.isbn),
        price: Number(form.price), oldPrice: Number(form.oldPrice) || Number(form.price),
        pages: Number(form.pages), stock: Number(form.stock),
        sellerId, rating: form.rating || 0, totalReviews: form.totalReviews || 0, sold: form.sold || 0,
        publicationDate: form.publicationDate || new Date().toISOString().slice(0, 10),
        featured: !!form.featured, bestseller: !!form.bestseller, isNew: true,
        approvalStatus: form.approvalStatus || 'pending', images: form.coverImage ? [form.coverImage] : [],
      }
      await onSave(book)
    } catch (saveErr) { setError(saveErr.message || 'সংরক্ষণ হয়নি।') }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white dark:bg-[#2A2521] p-5 space-y-4">
      <h3 className="font-semibold text-lg">{initial ? 'বই সম্পাদনা' : 'নতুন বই যোগ করুন'}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Text label="বইয়ের নাম (বাংলা) *" value={form.titleBn} onChange={(v) => set('titleBn', v)} />
        <Text label="Book Title (English)" value={form.title} onChange={(v) => set('title', v)} />
        <Select label="লেখক *" value={form.authorId} onChange={(v) => set('authorId', v)} options={authors.map((a) => ({ id: a.id, label: a.nameBn }))} />
        <Select label="প্রকাশক *" value={form.publisherId} onChange={(v) => set('publisherId', v)} options={publishers.map((p) => ({ id: p.id, label: p.nameBn }))} />
        <Select label="ক্যাটাগরি *" value={form.category} onChange={(v) => set('category', v)} options={categories.map((c) => ({ id: c.slug, label: c.nameBn }))} />
        <Text label="ISBN (১০/১৩ ডিজিট) *" value={form.isbn} onChange={(v) => set('isbn', v)} placeholder="978984..." />
        <Text label="সংস্করণ" value={form.edition} onChange={(v) => set('edition', v)} />
        <Select label="ভাষা" value={form.language} onChange={(v) => set('language', v)} options={[{ id: 'বাংলা', label: 'বাংলা' }, { id: 'English', label: 'English' }]} />
        <Num label="পৃষ্ঠা" value={form.pages} onChange={(v) => set('pages', v)} />
        <Select label="বাঁধাই" value={form.binding} onChange={(v) => set('binding', v)} options={[{ id: 'হার্ডকভার', label: 'হার্ডকভার' }, { id: 'পেপারব্যাক', label: 'পেপারব্যাক' }]} />
        <Num label="দাম (৳) *" value={form.price} onChange={(v) => set('price', v)} />
        <Num label="আগের দাম (৳)" value={form.oldPrice} onChange={(v) => set('oldPrice', v)} />
        <Num label="স্টক *" value={form.stock} onChange={(v) => set('stock', v)} />
      </div>
      <div><label className="block text-sm font-medium mb-1">বিবরণ (বাংলা)</label><textarea value={form.descriptionBn} onChange={(e) => set('descriptionBn', e.target.value)} rows={3} className="w-full rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 p-3" /></div>
      <ImageUpload label="বইয়ের প্রচ্ছদ" value={form.coverImage} onChange={(v) => set('coverImage', v)} />
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <p className="text-xs text-muted">নতুন বই অ্যাডমিন অনুমোদনের পর সাইটে দেখা যাবে (approvalStatus: pending)।</p>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="min-h-[48px] px-6 rounded-full bg-primary text-white font-bold disabled:opacity-60">{saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</button>
        <button type="button" onClick={onCancel} className="min-h-[48px] px-6 rounded-full border border-[#D8C9B0] font-semibold">বাতিল</button>
      </div>
    </form>
  )
}
function Text({ label, value, onChange, placeholder }) {
  return <div><label className="block text-sm font-medium mb-1">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
}
function Num({ label, value, onChange }) {
  return <div><label className="block text-sm font-medium mb-1">{label}</label><input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
}
function Select({ label, value, onChange, options }) {
  return <div><label className="block text-sm font-medium mb-1">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3"><option value="">— বেছে নিন —</option>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
}
