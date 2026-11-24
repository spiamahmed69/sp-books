import { useParams } from 'react-router-dom'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { bookService } from '../../services/bookService'
import { getPublishers } from '../../lib/firestore'
import { BookOpen } from 'lucide-react'
export default function PublisherDetails() {
  const { slug } = useParams()
  const { t } = useLanguage()
  const publisher = getPublishers().find((p) => p.slug === slug)
  const books = publisher ? bookService.list({ publisherId: publisher.id }) : []
  if (!publisher) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyState icon={BookOpen} title={t('noBooks')} text={t('noBooksText')} /></div>
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={publisher.nameBn} description={`${publisher.nameBn} — প্রকাশিত বই`} />
      <h1 className="font-display text-3xl font-bold">{publisher.nameBn}</h1>
      <p className="text-muted mt-1">{publisher.name} · {publisher.founded} সালে প্রতিষ্ঠিত · {books.length} টি বই</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
    </div>
  )
}
