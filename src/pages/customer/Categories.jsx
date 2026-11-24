import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import SEO from '../../components/SEO'
import { useLanguage } from '../../context/LanguageContext'
import { getCategories } from '../../lib/firestore'
export default function Categories() {
  const { t } = useLanguage()
  const categories = getCategories()
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={t('categories')} description="SP Books — সব ক্যাটাগরি" />
      <h1 className="font-display text-3xl font-bold">{t('categories')}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
        {categories.map((c) => (
          <Link key={c.slug} to={`/categories/${c.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 hover:shadow-md hover:border-primary transition group">
            <BookOpen className="h-8 w-8 text-primary group-hover:scale-110 transition" />
            <p className="font-semibold mt-3 text-lg">{c.nameBn}</p>
            <p className="text-sm text-muted">{c.name}</p>
            <p className="text-xs mt-1 text-primary font-medium">{c.count} টি বই</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
