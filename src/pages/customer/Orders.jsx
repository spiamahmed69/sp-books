import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import SEO from '../../components/SEO'
import { EmptyState, SectionError } from '../../components/States'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { orderService } from '../../services/orderService'
import { formatTaka, timeAgo } from '../../lib/format'
export default function Orders() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data, loading, error } = useAsyncData(() => (user ? orderService.listForCustomer(user.id) : Promise.resolve([])), [user?.id])
  const orders = data || []
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SEO title={t('orders')} description="My orders — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('orders')}</h1>
      {loading && <div className="mt-6 space-y-3" aria-busy="true">{[1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>}
      {error && <div className="mt-6"><SectionError message={error} /></div>}
      {!loading && !error && orders.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Package} title="এখনো কোনো অর্ডার নেই।" text="বই কিনলে এখানে আপনার অর্ডার দেখা যাবে।" action={<Link to="/books" className="min-h-[44px] px-5 rounded-lg bg-primary text-white font-semibold inline-flex items-center">{t('books')}</Link>} /></div>
      ) : (
        <div className="space-y-3 mt-6">
          {orders.map((o) => (
            <Link key={o.id} to={`/track/${o.id}`} className="block rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-4 hover:shadow">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold break-all">{o.id}</span>
                <span className="rounded-full bg-primary-light dark:bg-white/10 text-primary dark:text-secondary text-xs font-bold px-3 py-1">{t(o.status) || o.status}</span>
              </div>
              <p className="text-sm text-muted mt-1">{timeAgo(o.createdAt)} · {o.items?.length || 0}টি বই · {o.address?.district}</p>
              <p className="font-bold text-primary mt-1">{formatTaka(o.total)} <span className="text-xs text-muted font-normal">({o.paymentMethod} · {o.paymentStatus})</span></p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
