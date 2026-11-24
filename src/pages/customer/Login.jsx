import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Chrome } from 'lucide-react'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { DEMO_USERS } from '../../data/demo'
import { isDemoMode } from '../../lib/firebase'
export default function Login() {
  const { login, loading, googleSignInNote } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const u = await login(email, password)
      toast.success(`স্বাগতম, ${u.name}!`)
      navigate(u.role === 'admin' || u.role === 'moderator' ? '/admin' : u.role === 'seller' ? '/seller' : (location.state?.from || '/'))
    } catch (err) { setError(err.message) }
  }
  const fill = (u) => { setEmail(u.email); setPassword(u.password) }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <SEO title={t('login')} description="Login — SP Books" />
      <h1 className="font-display text-3xl font-bold text-center">{t('loginTitle')}</h1>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">{t('email')}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">{t('password')}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" />
        </div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full min-h-[52px] rounded-full bg-primary text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"><LogIn className="h-5 w-5" /> {loading ? '...' : t('login')}</button>
        <button type="button" onClick={() => toast.info(googleSignInNote())} className="w-full min-h-[52px] rounded-full border border-[#D8C9B0] font-semibold inline-flex items-center justify-center gap-2">
          <Chrome className="h-5 w-5" /> Google দিয়ে লগইন
        </button>
        {isDemoMode && <p className="text-xs text-muted text-center">ডেমো মোডে Google সাইন-ইন বন্ধ — Firebase কনফিগ করলে চালু হবে।</p>}
        <p className="text-sm text-center">{t('dontHaveAccount')} <Link to="/register" className="text-primary font-semibold"> {t('register')}</Link></p>
      </form>
      {isDemoMode && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-semibold">{t('demoAccounts')}</p>
          <div className="mt-2 space-y-2">
            {DEMO_USERS.map((u) => (
              <button key={u.email} onClick={() => fill(u)} className="w-full text-left rounded-lg bg-white dark:bg-white/5 border px-3 py-2.5 text-sm hover:border-primary min-h-[44px]">
                <span className="font-semibold">{u.name}</span> · {u.email} · <span className="text-muted">{u.role}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">ডেমো কুপন: <strong>SP10</strong> (১০% ছাড়, ৳১,০০০+ অর্ডারে)</p>
        </div>
      )}
    </div>
  )
}
