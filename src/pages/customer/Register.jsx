import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
export default function Register() {
  const { register, loading } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return }
    if (form.password !== form.confirm) { setError('পাসওয়ার্ড মিলছে না।'); return }
    setError('')
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      toast.success('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম।')
      navigate('/')
    } catch (err) { setError(err.message) }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <SEO title={t('register')} description="Register — SP Books" />
      <h1 className="font-display text-3xl font-bold text-center">{t('registerTitle')}</h1>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1" htmlFor="name">{t('name')}</label><input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="email">{t('email')}</label><input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="password">{t('password')}</label><input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        <div><label className="block text-sm font-medium mb-1" htmlFor="confirm">{t('confirmPassword')}</label><input id="confirm" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full min-h-[52px] rounded-full bg-primary text-white font-bold disabled:opacity-60">{loading ? '...' : t('register')}</button>
        <p className="text-sm text-center">{t('haveAccount')} <Link to="/login" className="text-primary font-semibold"> {t('login')}</Link></p>
        <p className="text-sm text-center text-muted">সেলার হতে চান? <Link to="/seller/register" className="text-primary font-semibold">{t('sellerRegister')}</Link></p>
      </form>
    </div>
  )
}
