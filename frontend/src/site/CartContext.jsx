/**
 * Cart for the public site.
 *
 * Purely client-side and persisted to localStorage — the backend is not wired
 * yet, so "checkout" collects a selection and stops at the payment step. When
 * the API lands, only `checkout()` needs to post somewhere.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'gurukela.cart'

const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage can be unavailable (private windows) — the cart just won't persist */
    }
  }, [items])

  const add = useCallback((item) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const has = useCallback((id) => items.some((i) => i.id === id), [items])

  const total = useMemo(() => items.reduce((sum, i) => sum + (i.amount || 0), 0), [items])

  const value = useMemo(
    () => ({ items, add, remove, clear, has, total, count: items.length }),
    [items, add, remove, clear, has, total]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-LK')}`
