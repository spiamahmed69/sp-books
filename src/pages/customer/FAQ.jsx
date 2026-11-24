import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SEO from '../../components/SEO'
import { useLanguage } from '../../context/LanguageContext'
const QA = [
  { q: 'ডেলিভারি চার্জ কত?', a: 'ঢাকার ভেতরে ৳৬০, ঢাকার বাইরে ৳১২০। ৳১,৫০০ বা তার বেশি অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি।' },
  { q: 'ডেলিভারি পেতে কতদিন লাগে?', a: 'ঢাকায় সাধারণত ২৪–৪৮ ঘণ্টা, ঢাকার বাইরে ২–৪ কর্মদিবস।' },
  { q: 'কীভাবে পেমেন্ট করব?', a: 'ক্যাশ অন ডেলিভারি (COD), বিকাশ, নগদ অথবা কার্ড — যেকোনো একটিতে পেমেন্ট করতে পারবেন। কার্ড নম্বর আমাদের সার্ভারে কখনো সংরক্ষণ করা হয় না।' },
  { q: 'বই ফেরত দেওয়া যায় কি?', a: 'হ্যাঁ। ত্রুটিপূর্ণ বা ভুল বই পেলে ৭ দিনের মধ্যে ফেরত বা বদলি করা যায়। বিস্তারিত Return & Refund Policy পাতায় দেখুন।' },
  { q: 'অর্ডার কীভাবে ট্র্যাক করব?', a: 'অর্ডারের পর পাওয়া অর্ডার আইডি দিয়ে Track Order পাতায় খুঁজলেই বর্তমান অবস্থা দেখা যাবে। লগইন থাকলে My Orders থেকেও দেখা যায়।' },
  { q: 'সেলার হতে চাইলে কী করব?', a: 'Seller Registration পাতা থেকে স্টোরের নাম ও তথ্য দিয়ে আবেদন করুন। অ্যাডমিন যাচাইয়ের পর আপনার স্টোর অনুমোদিত হবে, তারপর বই যোগ করতে পারবেন।' },
]
export default function FAQ() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(0)
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SEO title={t('faq')} description="Frequently asked questions — SP Books" />
      <h1 className="font-display text-3xl font-bold">{t('faq')}</h1>
      <div className="space-y-3 mt-6">
        {QA.map((item, i) => (
          <div key={i} className="rounded-xl border bg-white dark:bg-[#2A2521] overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-semibold min-h-[56px]">
              {item.q}
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
