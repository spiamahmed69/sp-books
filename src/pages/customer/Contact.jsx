import { useState } from 'react'
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import SEO from '../../components/SEO'
import { useLanguage } from '../../context/LanguageContext'
export default function Contact() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [done, setDone] = useState(false)
  const submit = (e) => { e.preventDefault(); setDone(true) }
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SEO title={t('contactUs')} description="Contact SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('contactUs')}</h1>
      <div className="grid md:grid-cols-2 gap-6 mt-6 items-start">
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> +880 1XXX-XXXXXX (সকাল ৯টা — রাত ৯টা)</p>
          <p className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> support@spbooks.example</p>
          <p className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Dhaka, Bangladesh</p>
          <p className="text-muted leading-relaxed">অর্ডার, ডেলিভারি বা বইয়ের বিষয়ে যেকোনো প্রশ্নে আমাদের লিখুন — সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।</p>
        </div>
        {done ? (
          <p className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800 flex items-center gap-2" role="status"><CheckCircle2 className="h-6 w-6 shrink-0" /> {t('messageSent')}</p>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border bg-white dark:bg-[#2A2521] p-6 space-y-4">
            <div><label className="block text-sm font-medium mb-1" htmlFor="name">{t('name')}</label><input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
            <div><label className="block text-sm font-medium mb-1" htmlFor="email">{t('email')}</label><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
            <div><label className="block text-sm font-medium mb-1" htmlFor="subject">{t('subject')}</label><input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full min-h-[48px] rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 px-3" /></div>
            <div><label className="block text-sm font-medium mb-1" htmlFor="message">{t('message')}</label><textarea id="message" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-[#D8C9B0] bg-white dark:bg-white/5 p-3" /></div>
            <button type="submit" className="w-full min-h-[52px] rounded-full bg-primary text-white font-bold">{t('sendMessage')}</button>
          </form>
        )}
      </div>
    </div>
  )
}
