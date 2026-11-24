import SEO from '../../components/SEO'
import { BookOpen, Users, Truck, ShieldCheck } from 'lucide-react'
export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <SEO title="আমাদের সম্পর্কে" description="SP Books — বাংলাদেশের মাল্টি-ভেন্ডর অনলাইন বইয়ের দোকান" />
      <h1 className="font-display text-4xl font-bold">আমাদের সম্পর্কে</h1>
      <p className="mt-4 leading-relaxed">এসপি বুকস বাংলাদেশের পাঠকদের জন্য একটি মাল্টি-ভেন্ডর অনলাইন বইয়ের দোকান। এখানে দেশের নামকরা প্রকাশক ও স্বাধীন বিক্রেতারা তাদের বই বিক্রি করেন — উপন্যাস, কবিতা, গল্প, ইতিহাস, বিজ্ঞান, শিশুতোষ, ধর্ম ও আত্মউন্নয়নমূলক বই এক জায়গায়।</p>
      <p className="mt-3 leading-relaxed">আমাদের লক্ষ্য সহজ: সঠিক দামে আসল বই, দ্রুত ডেলিভারি, আর পাঠকের আস্থা। প্রতিটি বিক্রেতা ও বই অ্যাডমিন যাচাইয়ের পরই সাইটে প্রকাশিত হয়।</p>
      <div className="grid sm:grid-cols-2 gap-3 mt-8">
        {[
          { icon: BookOpen, title: '২৮+ বইয়ের কালেকশন', sub: 'নিয়মিত নতুন বই যোগ হচ্ছে' },
          { icon: Users, title: 'যাচাইকৃত বিক্রেতা', sub: 'প্রকাশক ও বই বিক্রেতা' },
          { icon: Truck, title: 'সারাদেশে ডেলিভারি', sub: 'ঢাকায় ২৪-৪৮ ঘণ্টা' },
          { icon: ShieldCheck, title: 'নিরাপদ পেমেন্ট', sub: 'COD, বিকাশ, নগদ, কার্ড' },
        ].map(({ icon: Icon, title, sub }) => (
          <div key={title} className="rounded-xl border bg-white dark:bg-[#2A2521] p-5 flex gap-3"><Icon className="h-7 w-7 text-primary shrink-0" /><div><p className="font-semibold">{title}</p><p className="text-sm text-muted">{sub}</p></div></div>
        ))}
      </div>
    </div>
  )
}
