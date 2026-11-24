import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { isDemoMode } from '../lib/firebase'
import { getWishlistIds, saveWishlistIds } from '../lib/firestore'
const WishlistContext = createContext()
const KEY = 'spb_wishlist'
export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } })
  const loadedFor = useRef(null)
  // Real mode + signed in: the wishlist lives in Firestore (wishlists/{uid}).
  // Guests and Demo Mode keep the localStorage wishlist.
  useEffect(() => {
    if (isDemoMode) { loadedFor.current = 'demo'; return }
    if (!user) {
      loadedFor.current = null
      try { setIds(JSON.parse(localStorage.getItem(KEY)) || []) } catch { setIds([]) }
      return
    }
    let live = true
    getWishlistIds(user.id).then((remote) => {
      if (!live) return
      setIds((prev) => {
        if (remote.length > 0) return remote
        if (prev.length > 0) { saveWishlistIds(user.id, prev); return prev }
        return []
      })
      loadedFor.current = user.id
    })
    return () => { live = false }
  }, [user?.id])
  useEffect(() => {
    if (isDemoMode || !user) { localStorage.setItem(KEY, JSON.stringify(ids)); return }
    if (loadedFor.current !== user.id) return // don't overwrite before the remote load
    saveWishlistIds(user.id, ids)
  }, [ids, user?.id])
  const toggle = (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const has = (id) => ids.includes(id)
  const clear = () => setIds([])
  return <WishlistContext.Provider value={{ ids, toggle, has, clear }}>{children}</WishlistContext.Provider>
}
export const useWishlist = () => useContext(WishlistContext)
