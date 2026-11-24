// Reusable image upload: preview, type + 5 MB validation, progress, error + retry.
// Demo Mode: simulates the upload with progress and stores a data URL.
// Firebase Mode: calls the uploadImage Cloud Function (ImgBB, server-side key).
import { useRef, useState } from 'react'
import { Upload, X, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { isDemoMode } from '../lib/firebase'
import { uid } from '../lib/format'
const MAX_BYTES = 5 * 1024 * 1024
export default function ImageUpload({ value, onChange, label = 'Cover image' }) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const handleFile = async (file) => {
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('শুধু ছবির ফাইল দিন। / Only image files are allowed.'); return }
    if (file.size > MAX_BYTES) { setError('ছবি ৫ MB-এর বেশি হতে পারবে না। / Image must be under 5 MB.'); return }
    setUploading(true)
    setProgress(0)
    try {
      if (isDemoMode) {
        // Simulated upload with progress; stores a local data URL.
        for (const p of [25, 55, 80, 100]) { await new Promise((r) => setTimeout(r, 180)); setProgress(p) }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('Could not read file.'))
          reader.readAsDataURL(file)
        })
        onChange(dataUrl)
      } else {
        // Firebase mode: POST the file to the uploadImage Cloud Function.
        const form = new FormData()
        form.append('image', file)
        form.append('name', uid('img'))
        const res = await fetch('/api/uploadImage', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Upload failed.')
        const data = await res.json()
        onChange(data.url)
        setProgress(100)
      }
    } catch (e) {
      setError('আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন। / Upload failed. Please retry.')
    } finally { setUploading(false) }
  }
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {value ? (
        <div className="relative w-40">
          <img src={value} alt="Uploaded cover preview" className="aspect-[3/4] w-full object-cover rounded-lg border" />
          <button type="button" onClick={() => onChange('')} aria-label="Remove image" className="absolute -top-2 -right-2 min-h-[32px] min-w-[32px] rounded-full bg-white shadow flex items-center justify-center"><X className="h-4 w-4" /></button>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 text-sm text-primary font-medium min-h-[40px]">ছবি বদলান / Replace image</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D8C9B0] bg-white dark:bg-white/5 text-muted hover:border-primary">
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">ছবি আপলোড করুন (JPG/PNG, সর্বোচ্চ ৫ MB)</span>
          <span className="inline-flex items-center gap-1 text-sm text-primary font-medium"><Upload className="h-4 w-4" /> Choose file</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {uploading && (
        <div className="mt-2" role="status" aria-label="Upload progress">
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-muted mt-1">আপলোড হচ্ছে… {progress}%</p>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-700 flex items-center gap-2" role="alert">
          {error}
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1 font-medium underline min-h-[32px]"><RotateCcw className="h-3 w-3" /> Retry</button>
        </p>
      )}
    </div>
  )
}
