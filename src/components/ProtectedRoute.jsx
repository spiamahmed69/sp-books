import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ShieldAlert } from 'lucide-react'
// Protected route: requires login, and optionally a role.
// NOTE: this is UI routing only. Real enforcement lives in Firestore Security
// Rules + Cloud Functions (custom claims) — see firestore.rules / functions/.
// A freshly registered user has NO claim (role 'customer'): they can use all
// customer parts of the site, but /admin shows the setup-pending message
// below until the one-time admin bootstrap (DEPLOYMENT.md) sets the claim.
export default function ProtectedRoute({ children, roles }) {
  const { user, authReady } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  // Real mode resolves auth asynchronously — wait before redirecting, or a
  // page refresh would bounce a signed-in user to /login.
  if (!authReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16" aria-busy="true">
        <div className="h-8 w-48 rounded bg-[#E9DFCE] dark:bg-white/10 animate-pulse" />
        <p className="text-sm text-muted mt-3">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) {
    // Message follows the required role, not the visitor's role.
    const isAdminRoute = roles.includes('admin') && !roles.includes('seller')
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-primary" />
        <h1 className="mt-4 text-2xl font-bold">{isAdminRoute ? t('onlyAdmin') : t('onlySeller')}</h1>
        <p className="mt-2 text-muted">Logged in as {user.name} ({user.role}).</p>
        {isAdminRoute && <p className="mt-2 text-sm text-muted">{t('adminSetupPending')}</p>}
        <Link to="/" className="mt-6 inline-block min-h-[48px] px-6 rounded-full bg-primary text-white font-bold leading-[48px]">{t('backHome')}</Link>
      </div>
    )
  }
  return children
}
