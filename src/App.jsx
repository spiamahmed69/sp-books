import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileBottomNav from './components/MobileBottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import { BookCardSkeleton } from './components/States'

const Home = lazy(() => import('./pages/customer/Home'))
const Books = lazy(() => import('./pages/customer/Books'))
const BookDetails = lazy(() => import('./pages/customer/BookDetails'))
const Categories = lazy(() => import('./pages/customer/Categories'))
const CategoryDetails = lazy(() => import('./pages/customer/CategoryDetails'))
const Search = lazy(() => import('./pages/customer/Search'))
const Authors = lazy(() => import('./pages/customer/Authors'))
const AuthorDetails = lazy(() => import('./pages/customer/AuthorDetails'))
const Publishers = lazy(() => import('./pages/customer/Publishers'))
const PublisherDetails = lazy(() => import('./pages/customer/PublisherDetails'))
const Cart = lazy(() => import('./pages/customer/Cart'))
const Checkout = lazy(() => import('./pages/customer/Checkout'))
const Wishlist = lazy(() => import('./pages/customer/Wishlist'))
const Login = lazy(() => import('./pages/customer/Login'))
const Register = lazy(() => import('./pages/customer/Register'))
const Profile = lazy(() => import('./pages/customer/Profile'))
const Orders = lazy(() => import('./pages/customer/Orders'))
const OrderTracking = lazy(() => import('./pages/customer/OrderTracking'))
const Reviews = lazy(() => import('./pages/customer/Reviews'))
const Contact = lazy(() => import('./pages/customer/Contact'))
const About = lazy(() => import('./pages/customer/About'))
const FAQ = lazy(() => import('./pages/customer/FAQ'))
const Privacy = lazy(() => import('./pages/customer/Privacy'))
const Terms = lazy(() => import('./pages/customer/Terms'))
const ReturnPolicy = lazy(() => import('./pages/customer/ReturnPolicy'))
const NotFound = lazy(() => import('./pages/customer/NotFound'))
const SellerRegister = lazy(() => import('./pages/customer/SellerRegister'))
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((i) => <BookCardSkeleton key={i} />)}</div>
    </div>
  )
}

// Every route change starts the new page at the very top (instant, no scroll
// animation). Hash-only changes are left alone so anchor links still work.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <BrowserRouter>
                <ScrollToTop />
                <div className="flex min-h-screen flex-col pb-16 md:pb-0 bg-bg text-ink dark:bg-[#1C1917] dark:text-[#F5F0E8]">
                  <Navbar />
                  <main className="flex-1">
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/books" element={<Books mode="all" />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/categories/:slug" element={<CategoryDetails />} />
                        <Route path="/books/:slug" element={<BookDetails />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/authors" element={<Authors />} />
                        <Route path="/authors/:slug" element={<AuthorDetails />} />
                        <Route path="/publishers" element={<Publishers />} />
                        <Route path="/publishers/:slug" element={<PublisherDetails />} />
                        <Route path="/bestsellers" element={<Books mode="bestseller" />} />
                        <Route path="/new-arrivals" element={<Books mode="new" />} />
                        <Route path="/discounted" element={<Books mode="discounted" />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/seller/register" element={<SellerRegister />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/track/:id" element={<OrderTracking />} />
                        <Route path="/track" element={<OrderTracking />} />
                        <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/returns" element={<ReturnPolicy />} />
                        <Route path="/seller" element={<ProtectedRoute roles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute roles={['admin', 'moderator']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <MobileBottomNav />
                </div>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
