import { Link } from 'react-router-dom'
import SEO from '../../components/SEO'
import { useLanguage } from '../../context/LanguageContext'
import { getPublishers } from '../../lib/firestore'
export default function Publishers() {
  const { t } = useLanguage()
  const publishers = getPublishers().filter((p) => p.books > 0)
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('publishers')} description="SP Books — প্রকাশক পরিচিতি" />
      <h1 className="font-display text-3xl font-bold">{t('publishers')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
        {publishers.map((p) => (
          <Link key={p.id} to={`/publishers/${p.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 hover:shadow-md transition">
            <span className="h-14 w-14 rounded-xl bg-secondary-light dark:bg-white/10 text-primary dark:text-secondary flex items-center justify-center font-display text-xl font-bold">{p.nameBn?.[0]}</span>
            <p className="font-semibold mt-3 text-lg">{p.nameBn}</p>
            <p className="text-sm text-muted">{p.name} · {p.founded} সালে প্রতিষ্ঠিত</p>
            <p className="text-xs mt-2 text-primary font-medium">{p.books} টি বই</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
