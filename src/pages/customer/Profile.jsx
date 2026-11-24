import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Package, Heart, LogOut, Store, ShieldCheck } from 'lucide-react'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { orderService } from '../../services/orderService'
export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const { data } = useAsyncData(() => (user ? orderService.listForCustomer(user.id) : Promise.resolve([])), [user?.id])
  const myOrders = data || []
  const save = async (e) => {
    e.preventDefault()
    try {
      await updateProfile({ name, phone })
      toast.success('প্রোফাইল সংরক্ষণ হয়েছে।')
    } catch (err) { toast.error(err.message || 'সংরক্ষণ হয়নি।') }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SEO title={t('profile')} description="Your profile — SP Books" />
      <div className="flex items-center gap-4">
        <span className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold shrink-0">{user?.name?.[0] || 'U'}</span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold break-words">{user?.name}</h1>
          <p className="text-muted break-all">{user?.email} · {t(user?.role || 'customer')}</p>
          <p className="text-sm text-muted mt-1">{myOrders.length}টি অর্ডার করেছেন</p>
        </div>
      </div>
      <form onSubmit={save} className="mt-6 rounded-2xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> প্রোফাইল সম্পাদনা</h2>
        <div><label className="block text-sm font-medium mb-1" htmlFor="name">{t('name')}</label><input id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="phone">{t('phone')}</label><input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <button type="submit" className="min-h-[48px] px-6 rounded-full bg-primary text-white font-bold">{t('save')}</button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <Link to="/orders" className="rounded-xl border p-5 bg-white dark:bg-[#2A2521] hover:shadow flex items-center gap-3"><Package className="h-6 w-6 text-primary" /><span><span className="font-semibold block">{t('orders')}</span><span className="text-sm text-muted">{myOrders.length}টি অর্ডার</span></span></Link>
        <Link to="/wishlist" className="rounded-xl border p-5 bg-white dark:bg-[#2A2521] hover:shadow flex items-center gap-3"><Heart className="h-6 w-6 text-primary" /><span><span className="font-semibold block">{t('wishlist')}</span><span className="text-sm text-muted">সংরক্ষিত বই</span></span></Link>
        <Link to="/reviews" className="rounded-xl border p-5 bg-white dark:bg-[#2A2521] hover:shadow flex items-center gap-3"><User className="h-6 w-6 text-primary" /><span><span className="font-semibold block">{t('myReviews')}</span><span className="text-sm text-muted">আপনার রিভিউ</span></span></Link>
        {user?.role === 'seller' && <Link to="/seller" className="rounded-xl border p-5 bg-white dark:bg-[#2A2521] hover:shadow flex items-center gap-3"><Store className="h-6 w-6 text-primary" /><span><span className="font-semibold block">{t('sellerDashboard')}</span><span className="text-sm text-muted">আপনার স্টোর</span></span></Link>}
        {(user?.role === 'admin' || user?.role === 'moderator') && <Link to="/admin" className="rounded-xl border p-5 bg-white dark:bg-[#2A2521] hover:shadow flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><span><span className="font-semibold block">{t('adminDashboard')}</span><span className="text-sm text-muted">অ্যাডমিন প্যানেল</span></span></Link>}
      </div>
      <button onClick={logout} className="mt-6 min-h-[48px] px-6 rounded-full border border-red-200 text-red-700 font-semibold inline-flex items-center gap-2"><LogOut className="h-4 w-4" /> {t('logout')}</button>
    </div>
  )
}
