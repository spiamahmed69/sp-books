import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { isDemoMode } from '../lib/firebase'
import { getCartItems, saveCartItems } from '../lib/firestore'
const CartContext = createContext()
const KEY = 'spb_cart'
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } })
  const loadedFor = useRef(null)
  // Real mode + signed in: the cart lives in Firestore (carts/{uid}).
  // Guests and Demo Mode keep the localStorage cart.
  useEffect(() => {
    if (isDemoMode) { loadedFor.current = 'demo'; return }
    if (!user) {
      loadedFor.current = null
      try { setItems(JSON.parse(localStorage.getItem(KEY)) || []) } catch { setItems([]) }
      return
    }
    let live = true
    getCartItems(user.id).then((remote) => {
      if (!live) return
      setItems((prev) => {
        if (remote.length > 0) return remote
        // First sign-in with a guest cart: carry it into Firestore.
        if (prev.length > 0) { saveCartItems(user.id, prev); return prev }
        return []
      })
      loadedFor.current = user.id
    })
    return () => { live = false }
  }, [user?.id])
  useEffect(() => {
    if (isDemoMode || !user) { localStorage.setItem(KEY, JSON.stringify(items)); return }
    if (loadedFor.current !== user.id) return // don't overwrite before the remote load
    saveCartItems(user.id, items)
  }, [items, user?.id])
  const add = (book, qty = 1) => {
    if (book.stock <= 0) return false
    setItems((prev) => {
      const found = prev.find((i) => i.bookId === book.id)
      if (found) {
        const nextQty = Math.min(book.stock, found.qty + qty)
        return prev.map((i) => (i.bookId === book.id ? { ...i, qty: nextQty } : i))
      }
      return [...prev, { bookId: book.id, qty: Math.min(book.stock, qty) }]
    })
    return true
  }
  const setQty = (bookId, qty) => setItems((prev) => qty <= 0 ? prev.filter((i) => i.bookId !== bookId) : prev.map((i) => (i.bookId === bookId ? { ...i, qty } : i)))
  const remove = (bookId) => setItems((prev) => prev.filter((i) => i.bookId !== bookId))
  const clear = () => setItems([])
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  return <CartContext.Provider value={{ items, add, setQty, remove, clear, count }}>{children}</CartContext.Provider>
}
export const useCart = () => useContext(CartContext)
