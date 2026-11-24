import { useEffect } from 'react'
// Sets title / meta / OG tags per page and injects Product + Breadcrumb JSON-LD.
export default function SEO({ title, description, book, breadcrumbs, image }) {
  useEffect(() => {
    document.title = title ? `${title} | SP Books` : 'SP Books — বাংলাদেশের অনলাইন বইয়ের দোকান'
    const setMeta = (attr, name, content) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    if (description) { setMeta('name', 'description', description); setMeta('property', 'og:description', description) }
    setMeta('property', 'og:title', document.title)
    if (image) setMeta('property', 'og:image', image)
    let ld = document.getElementById('sp-jsonld')
    const graph = []
    if (book) {
      graph.push({ '@type': 'Book', name: book.titleBn || book.title, author: { '@type': 'Person', name: book.authorName || '' }, isbn: book.isbn, inLanguage: book.language, numberOfPages: book.pages, offers: { '@type': 'Offer', priceCurrency: 'BDT', price: book.price, availability: book.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }, aggregateRating: { '@type': 'AggregateRating', ratingValue: book.rating, reviewCount: book.totalReviews } })
    }
    if (breadcrumbs && breadcrumbs.length) {
      graph.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })) })
    }
    if (graph.length) {
      if (!ld) { ld = document.createElement('script'); ld.id = 'sp-jsonld'; ld.type = 'application/ld+json'; document.head.appendChild(ld) }
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    } else if (ld) ld.remove()
  }, [title, description, book, breadcrumbs, image])
  return null
}
