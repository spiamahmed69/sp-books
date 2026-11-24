import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import SEO from '../../components/SEO'
import ImageUpload from '../../components/ImageUpload'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
export default function SellerRegister() {
  const { registerSeller, loading } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '', description: '' })
  const [logo, setLogo] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return }
    try {
      await registerSeller({ name: form.name, email: form.email, password: form.password, storeName: form.storeName })
      toast.success('সেলার আবেদন জমা হয়েছে! অ্যাডমিন অনুমোদনের পর আপনার স্টোর চালু হবে।')
      navigate('/seller')
    } catch (err) { setError(err.message) }
  }
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <SEO title={t('sellerRegister')} description="Become a seller — SP Books" />
      <h1 className="font-display text-3xl font-bold text-center">{t('sellerRegister')}</h1>
      <p className="text-center text-muted text-sm mt-2">আপনার বই বিক্রি করুন SP Books-এ। অ্যাডমিন অনুমোদনের পর স্টোর ও বই প্রকাশিত হবে।</p>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1" htmlFor="name">{t('name')}</label><input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="email">{t('email')}</label><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="password">{t('password')}</label><input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="store">{t('storeName')}</label><input id="store" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="desc">স্টোরের বিবরণ</label><textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 p-3" /></div>
        <ImageUpload label="স্টোরের লোগো" value={logo} onChange={setLogo} />
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full min-h-[52px] rounded-full bg-primary text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"><Store className="h-5 w-5" /> {loading ? '...' : t('becomeSeller')}</button>
      </form>
    </div>
  )
}
