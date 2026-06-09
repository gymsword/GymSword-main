import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { PRODUCT } from "@/constants/testIds";

export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const { settings } = useSite();
  const img = product.images?.[0]?.url ? resolveImage(product.images[0].url) : "";
  const isOnSale = product.compare_at_price && product.compare_at_price > product.price;
  const comingSoon = settings.coming_soon;
  const showPrices = settings.show_prices !== false;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user === false) {
      window.location.href = "/login";
      return;
    }
    toggle(product.id);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block relative"
      data-testid={PRODUCT.card(product.id)}
    >
      <div className="relative overflow-hidden bg-[#F5F5F7] aspect-[4/5]">
        <div className={comingSoon ? "product-blur w-full h-full" : "w-full h-full"}>
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            data-testid={PRODUCT.cardImage(product.id)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        {comingSoon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <path d="M32 4 L40 22 L58 24 L44 36 L48 56 L32 46 L16 56 L20 36 L6 24 L24 22 Z" stroke="#fff" strokeWidth="2.5" fill="none" />
              <path d="M32 14 L32 50" stroke="#fff" strokeWidth="2.5" />
              <path d="M22 30 L42 30" stroke="#fff" strokeWidth="1.5" />
            </svg>
            <div className="mt-2 font-display text-white text-base tracking-luxury">GYMSWORD</div>
            <div className="text-[10px] text-white/80 tracking-luxury uppercase mt-1">Coming Soon</div>
          </div>
        )}

        {isOnSale && !comingSoon && (
          <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-overline z-10">
            Sale
          </div>
        )}

        {product.is_featured && !isOnSale && !comingSoon && (
          <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 text-overline z-10">
            New
          </div>
        )}

        <button
          onClick={handleWishlist}
          className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-md p-2 hover:bg-white transition"
          aria-label="Wishlist"
          data-testid={`wishlist-toggle-${product.id}`}
        >
          <Heart size={16} fill={has(product.id) ? "#000" : "none"} />
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-overline text-black/50 mb-1">{product.category}</div>
          <h3 className="text-sm font-medium text-black leading-snug">{product.name}</h3>
        </div>
        <div className="text-right">
          {showPrices ? (
            <>
              {isOnSale && (
                <div className="text-xs text-black/40 line-through">{formatPrice(product.compare_at_price)}</div>
              )}
              <div className="text-sm font-semibold">{formatPrice(product.price)}</div>
            </>
          ) : (
            <div className="text-overline text-black/40">Price soon</div>
          )}
        </div>
      </div>
    </Link>
  );
}
