import { Link } from 'react-router-dom'
import { BookX } from 'lucide-react'
import SEO from '../../components/SEO'
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <SEO title="পাতা পাওয়া যায়নি" description="Page not found — SP Books" />
      <BookX className="h-16 w-16 mx-auto text-primary" />
      <h1 className="font-display text-4xl font-bold mt-4">৪০৪ — পাতাটি পাওয়া যায়নি</h1>
      <p className="text-muted mt-2">আপনি যে পাতাটি খুঁজছেন সেটি নেই বা সরানো হয়েছে।</p>
      <Link to="/" className="inline-flex mt-6 min-h-[48px] px-6 rounded-full bg-primary text-white font-bold items-center">হোমে ফিরে যান</Link>
    </div>
  )
}
