import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, Headphones, BookOpen, Star, ArrowRight } from 'lucide-react'
import SEO from '../../components/SEO'
import BookCard from '../../components/BookCard'
import BookCover from '../../components/BookCover'
import RatingStars from '../../components/RatingStars'
import { BookCardSkeleton, SectionError } from '../../components/States'
import { useLanguage } from '../../context/LanguageContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { bookService } from '../../services/bookService'
import { getBanners, getAuthors, getPublishers, getCategories, getReviews } from '../../lib/firestore'
export default function Home() {
  const { t, lang } = useLanguage()
  const [slide, setSlide] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [banners, bestsellers, newArrivals, featured, discounted, recommended, authors, publishers, categories, reviews, all] = await Promise.all([
      getBanners(),
      bookService.list({ bestseller: true }),
      bookService.list({ isNew: true, sort: 'newest' }),
      bookService.list({ featured: true }),
      bookService.list({ discounted: true }),
      bookService.list({ sort: 'rating' }),
      getAuthors(),
      getPublishers(),
      getCategories(),
      getReviews(),
      bookService.list({}),
    ])
    const byId = Object.fromEntries(all.map((b) => [b.id, b]))
    return {
      banners: banners.filter((b) => b.active),
      bestsellers: bestsellers.slice(0, 8),
      newArrivals: newArrivals.slice(0, 8),
      featured: featured.slice(0, 8),
      discounted: discounted.slice(0, 8),
      recommended: recommended.slice(0, 4),
      authors: authors.filter((a) => a.featured && a.books > 0).slice(0, 4),
      publishers: publishers.filter((p) => p.featured).slice(0, 4),
      categories,
      reviews: reviews.slice(0, 3).map((r) => ({ ...r, book: byId[r.bookId] })),
    }
  }, [])
  const banners = data?.banners || []
  const bestsellers = data?.bestsellers || []
  const newArrivals = data?.newArrivals || []
  const featured = data?.featured || []
  const discounted = data?.discounted || []
  const recommended = data?.recommended || []
  const authors = data?.authors || []
  const publishers = data?.publishers || []
  const categories = data?.categories || []
  const reviews = data?.reviews || []
  useEffect(() => {
    if (!banners.length) return
    const id = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000)
    return () => clearInterval(id)
  }, [banners.length])
  const banner = banners[slide % Math.max(1, banners.length)]
  return (
    <div>
      <SEO title={lang === 'bn' ? 'হোম' : 'Home'} description="SP Books — বাংলাদেশের মাল্টি-ভেন্ডর অনলাইন বইয়ের দোকান।" />
      {error && <div className="mx-auto max-w-7xl px-4 mt-4"><SectionError message={error} /></div>}
      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((i) => <BookCardSkeleton key={i} />)}</div>
        </div>
      )}
      {!loading && banner && (
        <section className="relative bg-gradient-to-br from-primary via-[#7A4E33] to-[#3D2C1E] text-white overflow-hidden" aria-label="Featured offer">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 fade-up">
              <p className="text-secondary-light text-sm font-semibold tracking-widest uppercase">SP Books · বইমেলা</p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mt-2">{lang === 'bn' ? banner.title : banner.titleEn}</h1>
              <p className="mt-3 text-white/80">{banner.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={banner.link} className="min-h-[48px] px-6 rounded-full bg-secondary text-[#221D19] font-bold inline-flex items-center gap-2 hover:brightness-110">{t('shopNow')} <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/bestsellers" className="min-h-[48px] px-6 rounded-full border border-white/40 font-semibold inline-flex items-center hover:bg-white/10">{t('bestsellers')}</Link>
              </div>
              <div className="flex gap-2 mt-6">
                {banners.map((b, i) => (
                  <button key={b.id} onClick={() => setSlide(i)} aria-label={`Go to slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-secondary' : 'w-2 bg-white/40'}`} />
                ))}
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-3 w-72 shrink-0">
              {featured.slice(0, 3).map((b) => <BookCover key={b.id} book={b} className="rounded-lg shadow-2xl rotate-1" />)}
            </div>
          </div>
          <button onClick={() => setSlide((slide - 1 + banners.length) % banners.length)} aria-label="Previous slide" className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/30 hidden md:flex items-center justify-center"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => setSlide((slide + 1) % banners.length)} aria-label="Next slide" className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/30 hidden md:flex items-center justify-center"><ChevronRight className="h-5 w-5" /></button>
        </section>
      )}
      <section className="mx-auto max-w-7xl px-4 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Truck, title: 'দ্রুত ডেলিভারি', sub: 'ঢাকায় ২৪-৪৮ ঘণ্টা' },
          { icon: ShieldCheck, title: 'আসল বইয়ের নিশ্চয়তা', sub: 'যাচাইকৃত প্রকাশক' },
          { icon: RotateCcw, title: 'সহজ রিটার্ন', sub: '৭ দিনের মধ্যে' },
          { icon: Headphones, title: 'সাপোর্ট', sub: 'সকাল ৯টা — রাত ৯টা' },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-4 flex gap-3 items-center">
            <Icon className="h-7 w-7 text-primary shrink-0" />
            <div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-muted">{sub}</p></div>
          </div>
        ))}
      </section>
      <Section title={t('categories')} link="/categories" linkLabel={t('categories')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((c) => (
            <Link key={c.slug} to={`/categories/${c.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-4 hover:shadow-md hover:border-primary transition group">
              <BookOpen className="h-7 w-7 text-primary group-hover:scale-110 transition" />
              <p className="font-semibold mt-2">{c.nameBn}</p>
              <p className="text-xs text-muted">{c.name} · {c.count} {lang === 'bn' ? 'টি বই' : 'books'}</p>
            </Link>
          ))}
        </div>
      </Section>
      <Section title={t('bestsellers')} link="/bestsellers" linkLabel={t('bestsellers')}>
        <BookGrid books={bestsellers} />
      </Section>
      <Section title={t('newArrivals')} link="/new-arrivals" linkLabel={t('newArrivals')}>
        <BookGrid books={newArrivals} />
      </Section>
      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="rounded-2xl bg-primary text-white p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">সপ্তাহের সেরা বই — সর্বোচ্চ ৩০% ছাড়</h2>
            <p className="text-white/80 mt-2">বাছাই করা বেস্টসেলার এখন বিশেষ দামে। স্টক শেষ হওয়ার আগেই অর্ডার করুন।</p>
            <Link to="/discounted" className="inline-flex mt-4 min-h-[48px] px-6 rounded-full bg-white text-primary font-bold items-center gap-2">{t('specialOffers')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full md:w-80">
            {discounted.slice(0, 3).map((b) => <BookCover key={b.id} book={b} className="rounded-lg shadow-xl" />)}
          </div>
        </div>
      </section>
      <Section title={t('featuredAuthors')} link="/authors" linkLabel={t('authors')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {authors.map((a) => (
            <Link key={a.id} to={`/authors/${a.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 text-center hover:shadow-md transition">
              <span className="mx-auto h-16 w-16 rounded-full bg-primary-light dark:bg-white/10 text-primary dark:text-secondary flex items-center justify-center font-display text-2xl font-bold">{a.nameBn?.[0]}</span>
              <p className="font-semibold mt-3">{a.nameBn}</p>
              <p className="text-xs text-muted">{a.name}</p>
              <p className="text-xs mt-1 text-primary font-medium">{a.books} {lang === 'bn' ? 'টি বই' : 'books'}</p>
            </Link>
          ))}
        </div>
      </Section>
      <Section title={t('featuredPublishers')} link="/publishers" linkLabel={t('publishers')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {publishers.map((p) => (
            <Link key={p.id} to={`/publishers/${p.slug}`} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5 text-center hover:shadow-md transition">
              <span className="mx-auto h-14 w-14 rounded-xl bg-secondary-light dark:bg-white/10 text-primary dark:text-secondary flex items-center justify-center font-display text-xl font-bold">{p.nameBn?.[0]}</span>
              <p className="font-semibold mt-3">{p.nameBn}</p>
              <p className="text-xs text-muted">{p.name} · {p.founded} {lang === 'bn' ? 'সালে প্রতিষ্ঠিত' : 'est.'}</p>
            </Link>
          ))}
        </div>
      </Section>
      <Section title={t('recommended')} link="/books" linkLabel={t('books')}>
        <BookGrid books={recommended} />
      </Section>
      <Section title={t('collections')} link="/books" linkLabel={t('books')}>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { title: 'ক্লাসিক বাংলা সাহিত্য', sub: 'রবীন্দ্রনাথ, নজরুল, জীবনানন্দ', link: '/categories/poetry', img: featured[3] },
            { title: 'হুমায়ূন আহমেদ সংগ্রহ', sub: 'হিমু, মিসির আলি ও আরও', link: '/authors/humayun-ahmed', img: featured[0] },
            { title: 'শিশুদের প্রিয় বই', sub: 'গল্প, ছড়া ও অ্যাডভেঞ্চার', link: '/categories/children', img: newArrivals[0] },
          ].map((c) => (
            <Link key={c.title} to={c.link} className="relative rounded-2xl overflow-hidden h-48 group block">
              {c.img && <BookCover book={c.img} className="absolute inset-0 h-full w-full opacity-40 group-hover:scale-105 transition-transform duration-500" ratio="aspect-auto" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white"><h3 className="font-display text-xl font-bold">{c.title}</h3><p className="text-sm text-white/80">{c.sub}</p></div>
            </Link>
          ))}
        </div>
      </Section>
      <Section title={t('customerReviews')} link="/reviews" linkLabel={t('reviews')}>
        <div className="grid md:grid-cols-3 gap-3">
          {reviews.map((r) => (
            <figure key={r.id} className="rounded-xl border border-[#E9DFCE] dark:border-white/10 bg-white dark:bg-[#2A2521] p-5">
              <RatingStars rating={r.rating} />
              <blockquote className="mt-2 text-sm leading-relaxed">“{r.comment}”</blockquote>
              <figcaption className="mt-3 text-sm"><span className="font-semibold">{r.userName}</span> <span className="text-muted">· {r.book?.titleBn || ''}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </div>
  )
}
function Section({ title, link, linkLabel, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{title}</h2>
        {link && <Link to={link} className="text-primary font-semibold text-sm inline-flex items-center gap-1 min-h-[40px]">{linkLabel} <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
    </section>
  )
}
function BookGrid({ books }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {books.map((b) => <BookCard key={b.id} book={b} />)}
    </div>
  )
}
