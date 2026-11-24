import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Search, Heart, User } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useWishlist } from '../context/WishlistContext'
export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const { ids } = useWishlist()
  const items = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/categories', icon: LayoutGrid, label: t('categories') },
    { to: '/search', icon: Search, label: t('search') },
    { to: '/wishlist', icon: Heart, label: t('wishlist'), badge: ids.length },
    { to: '/profile', icon: User, label: t('profile') },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#221D19] border-t border-[#E9DFCE] dark:border-white/10" aria-label="Bottom navigation">
      <div className="grid grid-cols-5">
        {items.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium min-h-[56px] justify-center ${active ? 'text-primary dark:text-secondary' : 'text-muted'}`}>
              <span className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>}
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
