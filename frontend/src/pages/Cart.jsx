import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { CART } from "@/constants/testIds";

export default function Cart() {
  const { cart, update, remove } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();

  if (!user || user === false) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-32 text-center">
          <h1 className="font-display uppercase font-black text-4xl mb-6">Your Bag</h1>
          <p className="text-black/60 mb-8">Sign in to view your bag.</p>
          <Link to="/login" className="btn-luxury-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid={CART.page} className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <h1 className="font-display uppercase font-black text-4xl sm:text-6xl mb-12">Your Bag</h1>
        {cart.items.length === 0 ? (
          <div data-testid={CART.empty} className="py-20 text-center">
            <div className="text-overline text-black/50 mb-4">The bag is empty</div>
            <p className="text-black/60 mb-8">Discover pieces engineered for the relentless.</p>
            <Link to="/shop" className="btn-luxury-primary">Shop Collection</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((it) => (
                <div key={it.id} data-testid={CART.item(it.id)} className="flex gap-4 md:gap-6 border-b border-black/10 pb-6">
                  <Link to={`/product/${it.product_id}`} className="w-24 md:w-32 aspect-[4/5] bg-[#F5F5F7] flex-shrink-0 overflow-hidden">
                    <img src={resolveImage(it.product.images?.[0]?.url)} alt={it.product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link to={`/product/${it.product_id}`} className="font-medium hover:underline">{it.product.name}</Link>
                      <div className="text-xs text-black/50 mt-1 space-x-2">
                        {it.size && <span>Size {it.size}</span>}
                        {it.color && <span>· {it.color}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-black/20">
                        <button
                          onClick={() => update(it.id, it.qty - 1)}
                          data-testid={CART.qtyDec(it.id)}
                          className="p-2 hover:bg-black hover:text-white transition"
                          disabled={it.qty <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 text-sm font-medium">{it.qty}</span>
                        <button
                          onClick={() => update(it.id, it.qty + 1)}
                          data-testid={CART.qtyInc(it.id)}
                          className="p-2 hover:bg-black hover:text-white transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-semibold">{formatPrice(it.line_total)}</div>
                        <button
                          onClick={() => remove(it.id)}
                          data-testid={CART.remove(it.id)}
                          className="p-2 hover:opacity-60"
                          aria-label="Remove"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#F5F5F7] p-8 sticky top-32">
                <div className="text-overline mb-6">Order Summary</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid={CART.subtotal} className="font-semibold">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>Shipping</span>
                    <span>{cart.subtotal > 4999 ? "Free" : formatPrice(499)}</span>
                  </div>
                  <div className="flex justify-between text-black/60">
                    <span>Estimated GST (18%)</span>
                    <span>{formatPrice(cart.subtotal * 0.18)}</span>
                  </div>
                  <div className="border-t border-black/20 pt-3 flex justify-between font-display text-lg">
                    <span>Total</span>
                    <span>
                      {formatPrice(cart.subtotal + (cart.subtotal > 4999 ? 0 : 499) + cart.subtotal * 0.18)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/checkout")}
                  data-testid={CART.checkoutBtn}
                  disabled={settings.enable_purchases === false}
                  className="btn-luxury-primary w-full mt-8 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {settings.enable_purchases === false ? "Purchases Disabled" : "Checkout"}
                </button>
                <Link to="/shop" className="block text-center mt-4 luxury-link text-overline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
