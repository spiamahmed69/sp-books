// Small async-data helper: runs an async loader, tracks loading/error, and
// ignores results from stale loads (e.g. after unmount or a newer request).
import { useEffect, useRef, useState } from 'react'
export function useAsyncData(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    setLoading(true)
    setError('')
    Promise.resolve()
      .then(loader)
      .then((v) => { if (alive.current) { setData(v); setLoading(false) } })
      .catch((e) => { if (alive.current) { setError(e?.message || 'ডেটা লোড করা যায়নি।'); setLoading(false) } })
    return () => { alive.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading, error }
}
