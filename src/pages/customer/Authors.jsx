import { Link } from 'react-router-dom'
import SEO from '../../components/SEO'
import { useLanguage } from '../../context/LanguageContext'
import { getAuthors } from '../../lib/firestore'
export default function Authors() {
  const { t } = useLanguage()
  const authors = getAuthors().filter((a) => a.books > 0)
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('authors')} description="SP Books — লেখক পরিচিতি" />
      <h1 className="font-display text-3xl font-bold">{t('authors')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
        {authors.map((a) => (
          <Link key={a.id} to={`/authors/${a.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 hover:shadow-md transition">
            <span className="h-16 w-16 rounded-full bg-primary-light dark:bg-white/10 text-primary dark:text-secondary flex items-center justify-center font-display text-2xl font-bold">{a.nameBn?.[0]}</span>
            <p className="font-semibold mt-3 text-lg">{a.nameBn}</p>
            <p className="text-sm text-muted">{a.name}</p>
            <p className="text-xs mt-2 leading-relaxed line-clamp-2">{a.bioBn}</p>
            <p className="text-xs mt-2 text-primary font-medium">{a.books} টি বই</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
