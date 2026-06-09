import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!user || user === false) {
      setItems([]);
      return;
    }
    try {
      const { data } = await api.get("/wishlist");
      setItems(data || []);
    } catch {}
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (productId) => {
    const exists = items.find((i) => i.product_id === productId);
    if (exists) {
      await api.delete(`/wishlist/${productId}`);
    } else {
      await api.post("/wishlist", { product_id: productId });
    }
    await refresh();
  };

  const has = (productId) => !!items.find((i) => i.product_id === productId);

  return (
    <WishlistContext.Provider value={{ items, toggle, has, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
