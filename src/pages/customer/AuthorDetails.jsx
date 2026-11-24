import { useParams } from 'react-router-dom'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import { EmptyState, BookCardSkeleton, SectionError } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { bookService } from '../../services/bookService'
import { getAuthorBySlug } from '../../lib/firestore'
import { BookOpen } from 'lucide-react'
export default function AuthorDetails() {
  const { slug } = useParams()
  const { t } = useLanguage()
  const { data: author, loading, error } = useAsyncData(() => getAuthorBySlug(slug), [slug])
  const { data: booksData, loading: booksLoading } = useAsyncData(() => (author ? bookService.list({ authorId: author.id }) : Promise.resolve([])), [author?.id])
  const books = booksData || []
  if (loading || booksLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">{[1, 2, 3, 4].map((i) => <BookCardSkeleton key={i} />)}</div>
      </div>
    )
  }
  if (error) return <div className="mx-auto max-w-7xl px-4 py-16"><SectionError message={error} /></div>
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
