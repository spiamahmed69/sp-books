import { createContext, useContext, useEffect, useMemo, useState } from 'react'
const CartContext = createContext()
const KEY = 'spb_cart'
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)) }, [items])
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
