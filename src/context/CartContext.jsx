import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE } from "../config";

/**
 * The "inquiry cart": products a customer wants to enquire about.
 * Persisted to localStorage so it survives refreshes. Each entry holds a
 * lightweight product snapshot plus a desired quantity for the enquiry note.
 */

const CartContext = createContext(null);

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE.cart);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE.cart, JSON.stringify(items));
  }, [items]);

  const add = (product) => {
    setItems((list) => {
      if (list.some((i) => i.id === product.id)) return list; // already in cart
      return [
        ...list,
        {
          id: product.id,
          itemName: product.itemName,
          imageUrl: product.imageUrl,
          sellPrice: product.sellPrice,
          unit: product.unit,
          quantity: 1,
        },
      ];
    });
  };

  const remove = (id) => setItems((list) => list.filter((i) => i.id !== id));

  const setQuantity = (id, quantity) =>
    setItems((list) =>
      list.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Number(quantity) || 1) } : i))
    );

  const clear = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      add,
      remove,
      setQuantity,
      clear,
      has: (id) => items.some((i) => i.id === id),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
