import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Search, ShoppingCart, Heart, User, Menu, X, Moon, Sun, LogOut, LayoutDashboard, Store, ShieldCheck, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { isDemoMode } from '../lib/firebase'
import { getCategories, searchBooks } from '../lib/firestore'
export default function Navbar() {
  const { count } = useCart()
  const { ids } = useWishlist()
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [suggest, setSuggest] = useState([])
  const suggestSeq = useRef(0)
  const navigate = useNavigate()
  const { data: catData } = useAsyncData(() => getCategories(), [])
  const cats = catData || []
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  const onSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    setSuggest([])
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }
  const onType = async (v) => {
    setQ(v)
    if (v.trim().length >= 2) {
      const seq = ++suggestSeq.current
      const results = await searchBooks(v)
      if (seq === suggestSeq.current) setSuggest(results.slice(0, 5))
    } else setSuggest([])
  }
  const dashboardLink = user?.role === 'admin' || user?.role === 'moderator' ? '/admin' : user?.role === 'seller' ? '/seller' : '/profile'
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#221D19]/95 backdrop-blur border-b border-[#E9DFCE] dark:border-white/10">
      <div className="bg-primary text-white text-center text-xs sm:text-sm py-1.5 px-3">
        {t('freeDelivery')} · SP10 {t('couponApplied').replace('!', '')} — 10% ছাড় (৳১,০০০+ অর্ডারে)
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 sm:gap-3 py-3">
          <button className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-bg" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="SP Books home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"><BookOpen className="h-6 w-6" /></span>
            <span className="leading-none">
              <span className="block font-display font-bold text-xl text-primary dark:text-secondary">SP Books</span>
              <span className="block text-[11px] text-muted hidden sm:block">এসপি বুকস · বইয়ের দোকান</span>
            </span>
          </Link>
          <form onSubmit={onSearch} className="relative hidden md:flex flex-1 max-w-xl mx-auto" role="search">
            <input value={q} onChange={(e) => onType(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} className="w-full min-h-[44px] rounded-full border border-[#D8C9B0] bg-bg dark:bg-white/5 pl-4 pr-12 focus:border-primary" />
            <button type="submit" aria-label={t('search')} className="absolute right-1 top-1 min-h-[36px] min-w-[36px] rounded-full bg-primary text-white flex items-center justify-center"><Search className="h-5 w-5" /></button>
            {suggest.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-white dark:bg-[#2A2521] shadow-lg overflow-hidden z-50">
                {suggest.map((b) => (
                  <Link key={b.id} to={`/books/${b.slug}`} onClick={() => setSuggest([])} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg dark:hover:bg-white/5 text-sm">
                    <span className="font-medium">{b.titleBn || b.title}</span>
                    <span className="text-muted text-xs ml-auto shrink-0">{b.price ? `৳${b.price}` : ''}</span>
                  </Link>
                ))}
              </div>
            )}
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="min-h-[44px] px-2 sm:px-3 rounded-lg text-sm font-semibold hover:bg-bg dark:hover:bg-white/10" aria-label="Switch language">{lang === 'bn' ? 'EN' : 'বাং'}</button>
            <button onClick={() => setDark(!dark)} className="min-h-[44px] min-w-[44px] rounded-lg hidden sm:flex items-center justify-center hover:bg-bg dark:hover:bg-white/10" aria-label={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <Link to="/wishlist" className="relative min-h-[44px] min-w-[44px] rounded-lg hidden sm:flex items-center justify-center hover:bg-bg dark:hover:bg-white/10" aria-label={`${t('wishlist')} (${ids.length})`}>
              <Heart className="h-5 w-5" />
              {ids.length > 0 && <span className="absolute top-0.5 right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">{ids.length}</span>}
            </Link>
            <Link to="/cart" className="relative min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center hover:bg-bg dark:hover:bg-white/10" aria-label={`${t('cart')} (${count})`}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute top-0.5 right-0.5 h-5 min-w-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">{count}</span>}
            </Link>
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1.5 min-h-[44px] px-2 rounded-lg hover:bg-bg dark:hover:bg-white/10" aria-haspopup="true" aria-expanded={menuOpen}>
                  <span className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{user.name?.[0] || 'U'}</span>
                  <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="h-4 w-4 hidden lg:block" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white dark:bg-[#2A2521] shadow-lg py-1 z-50" onMouseLeave={() => setMenuOpen(false)}>
                    <Link to={dashboardLink} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg dark:hover:bg-white/5"><LayoutDashboard className="h-4 w-4" /> {t('dashboard')}</Link>
                    <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg dark:hover:bg-white/5"><BookOpen className="h-4 w-4" /> {t('orders')}</Link>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg dark:hover:bg-white/5"><User className="h-4 w-4" /> {t('profile')}</Link>
                    {user.role === 'seller' && <Link to="/seller" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg dark:hover:bg-white/5"><Store className="h-4 w-4" /> {t('sellerDashboard')}</Link>}
                    {(user.role === 'admin' || user.role === 'moderator') && <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-bg dark:hover:bg-white/5"><ShieldCheck className="h-4 w-4" /> {t('adminDashboard')}</Link>}
                    <button onClick={() => { logout(); setMenuOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4" /> {t('logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="min-h-[44px] px-3 sm:px-4 rounded-full bg-primary text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-primary-dark"><User className="h-4 w-4" /> <span className="hidden sm:inline">{t('login')}</span></Link>
            )}
          </div>
        </div>
        <form onSubmit={onSearch} className="md:hidden pb-3" role="search">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} className="w-full min-h-[44px] rounded-full border border-[#D8C9B0] bg-bg dark:bg-white/5 pl-4 pr-12" />
            <button type="submit" aria-label={t('search')} className="absolute right-1 top-1 min-h-[36px] min-w-[36px] rounded-full bg-primary text-white flex items-center justify-center"><Search className="h-5 w-5" /></button>
          </div>
        </form>
        <nav className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar" aria-label="Categories">
          <NavLink to="/books" className={({ isActive }) => `px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${isActive ? 'bg-primary text-white' : 'hover:bg-bg dark:hover:bg-white/10'}`}>{t('books')}</NavLink>
          {cats.slice(0, 8).map((c) => (
            <NavLink key={c.slug} to={`/categories/${c.slug}`} className={({ isActive }) => `px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${isActive ? 'bg-primary text-white' : 'hover:bg-bg dark:hover:bg-white/10'}`}>{c.nameBn}</NavLink>
          ))}
          <NavLink to="/authors" className="px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-bg dark:hover:bg-white/10">{t('authors')}</NavLink>
          <NavLink to="/publishers" className="px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-bg dark:hover:bg-white/10">{t('publishers')}</NavLink>
          <NavLink to="/bestsellers" className="px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap text-red-700 dark:text-red-400 hover:bg-bg dark:hover:bg-white/10">{t('bestsellers')}</NavLink>
        </nav>
        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-1" aria-label="Mobile menu">
            <Link to="/books" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('books')}</Link>
            {cats.map((c) => <Link key={c.slug} to={`/categories/${c.slug}`} onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg">{c.nameBn}</Link>)}
            <Link to="/authors" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('authors')}</Link>
            <Link to="/publishers" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('publishers')}</Link>
            <Link to="/bestsellers" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('bestsellers')}</Link>
            <Link to="/discounted" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('discounted')}</Link>
            <Link to="/seller/register" onClick={() => setOpen(false)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium">{t('becomeSeller')}</Link>
            <button onClick={() => setDark(!dark)} className="px-3 py-3 rounded-lg hover:bg-bg font-medium text-left flex items-center gap-2">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} {dark ? 'Light mode' : 'Dark mode'}</button>
          </nav>
        )}
      </div>
      {isDemoMode && (
        <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-center text-xs py-1 px-3">{t('demoMode')}</div>
      )}
    </header>
  )
}
