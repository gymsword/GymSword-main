import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user === false) {
      setCart({ items: [], subtotal: 0, count: 0 });
      return;
    }
    try {
      const { data } = await api.get("/cart");
      setCart(data);
    } catch {}
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (productId, qty = 1, size = null, color = null) => {
    setLoading(true);
    try {
      const { data } = await api.post("/cart", { product_id: productId, qty, size, color });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const update = async (itemId, qty) => {
    const { data } = await api.patch(`/cart/${itemId}`, { qty });
    setCart(data);
  };

  const remove = async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data);
  };

  const clear = async () => {
    const { data } = await api.delete("/cart");
    setCart(data);
  };

  return (
    <CartContext.Provider value={{ cart, loading, add, update, remove, clear, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
