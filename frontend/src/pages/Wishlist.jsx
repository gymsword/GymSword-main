import { Link } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

export default function Wishlist() {
  const { user } = useAuth();
  const { items, toggle } = useWishlist();
  const { add } = useCart();

  if (!user || user === false) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-32 text-center">
          <h1 className="font-display uppercase font-black text-4xl mb-6">Wishlist</h1>
          <p className="text-black/60 mb-8">Sign in to view your saved pieces.</p>
          <Link to="/login" className="btn-luxury-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  const moveToBag = async (p) => {
    await add(p.id, 1, p.sizes?.[0], p.colors?.[0]);
    await toggle(p.id);
    toast.success("Moved to bag");
  };

  return (
 
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <h1 className="font-display uppercase font-black text-4xl sm:text-6xl mb-12">Wishlist</h1>
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-black/60 mb-8">No saved pieces yet.</p>
            <Link to="/shop" className="btn-luxury-primary">Discover the Collection</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (
              <div key={it.id} className="border border-black/10 p-4 flex gap-4">
                <Link to={`/product/${it.product_id}`} className="w-28 aspect-[4/5] bg-[#F5F5F7] overflow-hidden">
                  <img src={resolveImage(it.product.images?.[0]?.url)} alt={it.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${it.product_id}`} className="font-medium hover:underline text-sm">{it.product.name}</Link>
                    <div className="text-sm font-semibold mt-2">{formatPrice(it.product.price)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => moveToBag(it.product)} className="btn-luxury-primary !px-3 !py-2 text-[10px]">
                      <ShoppingBag size={12} className="mr-2" /> To Bag
                    </button>
                    <button onClick={() => toggle(it.product_id)} className="p-2 border border-black/20 hover:bg-black hover:text-white">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
  );
}
