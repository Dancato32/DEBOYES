import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (item) => {
    setCartItems((current) => {
      const existingIndex = current.findIndex((entry) => entry.food_id === item.food_id)
      if (existingIndex >= 0) {
        return current.map((entry, index) =>
          index === existingIndex ? { ...entry, qty: entry.qty + item.qty } : entry
        )
      }
      return [...current, item]
    })
  }

  const updateQty = (food_id, qty) => {
    setCartItems((current) =>
      current
        .map((entry) => (entry.food_id === food_id ? { ...entry, qty } : entry))
        .filter((entry) => entry.qty > 0)
    )
  }

  const removeItem = (food_id) => {
    setCartItems((current) => current.filter((entry) => entry.food_id !== food_id))
  }

  const clearCart = () => setCartItems([])

  const total = useMemo(
    () => cartItems.reduce((sum, entry) => sum + entry.price * entry.qty, 0),
    [cartItems]
  )

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
