// Thin service layer over the data layer (books/authors/publishers).
import { getBooks, getBookBySlug, searchBooks, getAuthors, getPublishers, getCategories, getReviews } from '../lib/firestore'
export const bookService = {
  list: (opts = {}) => {
    let list = getBooks()
    if (opts.category) list = list.filter((b) => b.category === opts.category)
    if (opts.authorId) list = list.filter((b) => b.authorId === opts.authorId)
    if (opts.publisherId) list = list.filter((b) => b.publisherId === opts.publisherId)
    if (opts.language) list = list.filter((b) => b.language === opts.language)
    if (opts.binding) list = list.filter((b) => b.binding === opts.binding)
    if (opts.minPrice != null) list = list.filter((b) => b.price >= opts.minPrice)
    if (opts.maxPrice != null) list = list.filter((b) => b.price <= opts.maxPrice)
    if (opts.discounted) list = list.filter((b) => b.oldPrice > b.price)
    if (opts.bestseller) list = list.filter((b) => b.bestseller)
    if (opts.isNew) list = list.filter((b) => b.isNew)
    if (opts.featured) list = list.filter((b) => b.featured)
    switch (opts.sort) {
      case 'price-low': list = [...list].sort((a, b) => a.price - b.price); break
      case 'price-high': list = [...list].sort((a, b) => b.price - a.price); break
      case 'newest': list = [...list].sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate)); break
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break
      case 'bestselling': list = [...list].sort((a, b) => b.sold - a.sold); break
      default: list = [...list].sort((a, b) => b.sold - a.sold)
    }
    return list
  },
  bySlug: getBookBySlug,
  search: searchBooks,
  authors: getAuthors,
  publishers: getPublishers,
  categories: getCategories,
  reviews: getReviews,
}
export default bookService
