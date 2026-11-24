import { useParams } from 'react-router-dom'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { bookService } from '../../services/bookService'
import { getAuthors } from '../../lib/firestore'
import { BookOpen } from 'lucide-react'
export default function AuthorDetails() {
  const { slug } = useParams()
  const { t } = useLanguage()
  const author = getAuthors().find((a) => a.slug === slug)
  const books = author ? bookService.list({ authorId: author.id }) : []
  if (!author) return <div className="mx-auto max-w-7xl px-4 py-16"><EmptyState icon={BookOpen} title={t('noBooks')} text={t('noBooksText')} /></div>
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <SEO title={author.nameBn} description={author.bioBn} />
      <div className="flex items-start gap-4">
        <span className="h-20 w-20 rounded-full bg-primary-light dark:bg-white/10 text-primary dark:text-secondary flex items-center justify-center font-display text-3xl font-bold shrink-0">{author.nameBn?.[0]}</span>
        <div>
          <h1 className="font-display text-3xl font-bold">{author.nameBn}</h1>
          <p className="text-muted">{author.name}</p>
          <p className="mt-2 max-w-2xl leading-relaxed text-sm">{author.bioBn}</p>
          <p className="text-sm text-primary font-medium mt-2">{books.length} টি বই</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
    </div>
  )
}
