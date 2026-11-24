// Generated book-cover art — no external images are copied.
// A deterministic palette is derived from the book title so each book keeps
// the same cover everywhere. Real uploaded image URLs (ImgBB) take precedence.
import { getAuthor } from '../data/demo'
const PALETTES = [
  { bg: '#6B422E', band: '#C49A6C', text: '#F7F3EC' },
  { bg: '#1F3D2B', band: '#C49A6C', text: '#F7F3EC' },
  { bg: '#28324E', band: '#D9A441', text: '#F7F3EC' },
  { bg: '#7A2E2E', band: '#E8C97A', text: '#FBF6EC' },
  { bg: '#3D2C4E', band: '#C49A6C', text: '#F7F3EC' },
  { bg: '#14532D', band: '#E8C97A', text: '#F7F3EC' },
  { bg: '#8A5A2B', band: '#F7F3EC', text: '#FFF8EA' },
  { bg: '#2E4A5A', band: '#C49A6C', text: '#F7F3EC' },
]
function hash(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0; return h }
export default function BookCover({ book, className = '', ratio = 'aspect-[3/4]' }) {
  const author = getAuthor(book.authorId)
  const p = PALETTES[hash(book.titleBn || book.title) % PALETTES.length]
  if (book.coverImage) {
    return <img src={book.coverImage} alt={`Cover of ${book.titleBn || book.title}`} loading="lazy" className={`${ratio} w-full object-cover ${className}`} />
  }
  return (
    <div className={`${ratio} w-full relative overflow-hidden flex flex-col ${className}`} style={{ background: `linear-gradient(160deg, ${p.bg} 0%, ${p.bg} 70%, #1c1512 100%)` }} role="img" aria-label={`Cover of ${book.titleBn || book.title}`}>
      <div className="absolute inset-y-0 left-0 w-[7px] bg-black/30" aria-hidden="true" />
      <div className="absolute inset-y-0 left-[7px] w-px bg-white/25" aria-hidden="true" />
      <div className="flex-1 flex flex-col justify-between p-4 pl-5" style={{ color: p.text }}>
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase opacity-80 font-semibold">{author?.nameBn || ''}</p>
          <h3 className="font-display font-bold leading-snug mt-2 text-[clamp(15px,2.4vw,22px)]">{book.titleBn || book.title}</h3>
          <p className="text-xs opacity-80 mt-1">{book.title}</p>
        </div>
        <div>
          <div className="h-[3px] w-10 rounded-full mb-2" style={{ background: p.band }} aria-hidden="true" />
          <p className="text-[10px] tracking-widest uppercase opacity-80">SP Books</p>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-10 h-28 w-28 rounded-full border-[10px] opacity-15" style={{ borderColor: p.band }} aria-hidden="true" />
    </div>
  )
}
