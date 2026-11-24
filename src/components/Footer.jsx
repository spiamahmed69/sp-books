import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone, MapPin, Facebook, Youtube, Instagram } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { useToast } from '../context/ToastContext'
export default function Footer() {
  const { t } = useLanguage()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const subscribe = (e) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast.error('সঠিক ইমেইল দিন। / Please enter a valid email.'); return }
    setDone(true)
    toast.success(t('subscribed'))
  }
  return (
    <footer className="bg-[#221D19] text-[#EDE6DA] mt-12">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[#221D19]"><BookOpen className="h-6 w-6" /></span>
            <span className="font-display font-bold text-xl">SP Books</span>
          </div>
          <p className="text-sm text-[#C9BFAE] mt-3">{t('footerAbout')}</p>
          <div className="flex gap-2 mt-4">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Facebook className="h-5 w-5" /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Youtube className="h-5 w-5" /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Instagram className="h-5 w-5" /></a>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t('quickLinks')}</h3>
          <ul className="space-y-2 text-sm text-[#C9BFAE]">
            <li><Link to="/books" className="hover:text-white">{t('books')}</Link></li>
            <li><Link to="/bestsellers" className="hover:text-white">{t('bestsellers')}</Link></li>
            <li><Link to="/new-arrivals" className="hover:text-white">{t('newArrivals')}</Link></li>
            <li><Link to="/discounted" className="hover:text-white">{t('discounted')}</Link></li>
            <li><Link to="/authors" className="hover:text-white">{t('authors')}</Link></li>
            <li><Link to="/publishers" className="hover:text-white">{t('publishers')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t('customerService')}</h3>
          <ul className="space-y-2 text-sm text-[#C9BFAE]">
            <li><Link to="/about" className="hover:text-white">{t('aboutUs')}</Link></li>
            <li><Link to="/contact" className="hover:text-white">{t('contactUs')}</Link></li>
            <li><Link to="/faq" className="hover:text-white">{t('faq')}</Link></li>
            <li><Link to="/privacy" className="hover:text-white">{t('privacy')}</Link></li>
            <li><Link to="/terms" className="hover:text-white">{t('terms')}</Link></li>
            <li><Link to="/returns" className="hover:text-white">{t('returns')}</Link></li>
            <li><Link to="/seller/register" className="hover:text-white">{t('becomeSeller')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t('newsletterTitle')}</h3>
          <p className="text-sm text-[#C9BFAE]">{t('newsletterText')}</p>
          {done ? (
            <p className="mt-3 rounded-lg bg-green-900/60 px-4 py-3 text-sm" role="status">{t('subscribed')}</p>
          ) : (
            <form onSubmit={subscribe} className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="nl-email">Email</label>
              <input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-h-[44px] flex-1 rounded-lg bg-white/10 border border-white/20 px-3 text-sm placeholder:text-[#9a8f7d] min-w-0" />
              <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-secondary text-[#221D19] font-semibold text-sm hover:brightness-110">{t('subscribe')}</button>
            </form>
          )}
          <ul className="mt-4 space-y-1.5 text-sm text-[#C9BFAE]">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +880 1XXX-XXXXXX</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@spbooks.example</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#9a8f7d]">© {new Date().getFullYear()} SP Books · {t('allRights')}</div>
    </footer>
  )
}
