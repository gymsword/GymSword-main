import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSite } from "@/context/SiteContext";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { PRODUCT } from "@/constants/testIds";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });

  const { user } = useAuth();
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const { settings } = useSite();

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => {
      setProduct(data);
      setColor(data.colors?.[0] || "");
      setSize(data.sizes?.[0] || "");
      setActiveImg(0);
    });
    api.get(`/products/${id}/reviews`).then(({ data }) => setReviews(data));
    api.get(`/products/${id}/related`).then(({ data }) => setRelated(data));
  }, [id]);

  const handleAddCart = async () => {
    if (!user || user === false) {
      toast.info("Sign in to add to bag");
      return navigate("/login");
    }
    try {
      await add(product.id, 1, size, color);
      toast.success("Added to your bag");
    } catch {
      toast.error("Could not add to bag");
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user || user === false) {
      toast.info("Sign in to leave a review");
      return navigate("/login");
    }
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      const { data } = await api.get(`/products/${id}/reviews`);
      setReviews(data);
      setReviewForm({ rating: 5, title: "", body: "" });
      toast.success("Review submitted");
    } catch {
      toast.error("Could not submit review");
    }
  };

  if (!product) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center text-overline">Loading…</div>
      </Layout>
    );
  }

  const isOnSale = product.compare_at_price && product.compare_at_price > product.price;
  const images = product.images?.length ? product.images : [{ url: "" }];
  const showPrices = settings.show_prices !== false;
  const purchasesEnabled = settings.enable_purchases !== false;

  return (
    <Layout>
      <div data-testid={PRODUCT.detail} className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative bg-[#F5F5F7] aspect-[4/5] overflow-hidden">
              <div className={settings.coming_soon ? "product-blur w-full h-full" : "w-full h-full"}>
                <img
                  src={resolveImage(images[activeImg]?.url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {settings.coming_soon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
                    <path d="M32 4 L40 22 L58 24 L44 36 L48 56 L32 46 L16 56 L20 36 L6 24 L24 22 Z" stroke="#fff" strokeWidth="2.5" fill="none" />
                    <path d="M32 14 L32 50" stroke="#fff" strokeWidth="2.5" />
                    <path d="M22 30 L42 30" stroke="#fff" strokeWidth="1.5" />
                  </svg>
                  <div className="mt-3 font-display text-white text-2xl tracking-luxury">GYMSWORD</div>
                  <div className="text-overline text-white/80 mt-1">Coming Soon</div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((im, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    data-testid={PRODUCT.thumb(i)}
                    className={`aspect-square overflow-hidden bg-[#F5F5F7] border ${
                      i === activeImg ? "border-black" : "border-transparent"
                    }`}
                  >
                    <img src={resolveImage(im.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="text-overline text-black/50 mb-3">{product.category}</div>
            <h1 className="font-display uppercase font-black text-3xl sm:text-5xl leading-tight">{product.name}</h1>
            <div className="mt-6 flex items-baseline gap-3">
              {showPrices ? (
                <>
                  {isOnSale && (
                    <span className="text-lg text-black/40 line-through">{formatPrice(product.compare_at_price)}</span>
                  )}
                  <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
                  {isOnSale && (
                    <span className="text-overline bg-black text-white px-2 py-1">
                      Save {formatPrice(product.compare_at_price - product.price)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-overline text-black/60">Pricing announced at launch</span>
              )}
            </div>
            {product.rating > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-black/70">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      fill={n <= Math.round(product.rating) ? "#000" : "none"}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span>{product.rating.toFixed(1)} · {product.review_count} reviews</span>
              </div>
            )}

            <p className="mt-8 text-black/70 font-light leading-relaxed">{product.description}</p>

            {/* Color */}
            {product.colors?.length > 0 && (
              <div className="mt-10">
                <div className="text-overline mb-4">Color · {color}</div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      data-testid={PRODUCT.colorBtn(c)}
                      onClick={() => setColor(c)}
                      className={`px-4 py-2 border text-xs uppercase tracking-luxury ${
                        c === color ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mt-8">
                <div className="text-overline mb-4 flex justify-between">
                  <span>Size · {size}</span>
                  <span className="text-black/50 luxury-link cursor-pointer">Size Guide</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      data-testid={PRODUCT.sizeBtn(s)}
                      onClick={() => setSize(s)}
                      className={`py-3 border text-sm font-medium ${
                        s === size ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3">
              <button
                onClick={handleAddCart}
                data-testid={PRODUCT.addToCart}
                disabled={!purchasesEnabled}
                className="btn-luxury-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={14} className="mr-3" />
                {!purchasesEnabled ? "Available at Launch" : showPrices ? `Add to Bag — ${formatPrice(product.price)}` : "Add to Bag"}
              </button>
              <button
                onClick={() => (user ? toggle(product.id) : navigate("/login"))}
                data-testid={PRODUCT.addToWishlist}
                className="btn-luxury-secondary w-full"
              >
                <Heart size={14} className="mr-3" fill={has(product.id) ? "#000" : "none"} />
                {has(product.id) ? "Saved" : "Save for Later"}
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 text-center border-t border-black/10 pt-8">
              <div>
                <Truck size={20} className="mx-auto mb-2" />
                <div className="text-overline">Free Shipping</div>
                <div className="text-xs text-black/50 mt-1">Orders ₹5,000+</div>
              </div>
              <div>
                <RotateCcw size={20} className="mx-auto mb-2" />
                <div className="text-overline">Free Returns</div>
                <div className="text-xs text-black/50 mt-1">30 days</div>
              </div>
              <div>
                <ShieldCheck size={20} className="mx-auto mb-2" />
                <div className="text-overline">Quality</div>
                <div className="text-xs text-black/50 mt-1">Guaranteed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-32 border-t border-black/10 pt-16">
          <h2 className="font-display uppercase font-black text-3xl sm:text-4xl mb-10">Reviews</h2>
          <div className="grid lg:grid-cols-3 gap-12">
            <form onSubmit={handleReview} className="lg:col-span-1 space-y-4 border border-black/10 p-6">
              <div className="text-overline">Write a Review</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className="p-1"
                  >
                    <Star size={20} fill={n <= reviewForm.rating ? "#000" : "none"} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <input
                className="w-full border border-black/20 px-3 py-3 text-sm"
                placeholder="Headline"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              />
              <textarea
                className="w-full border border-black/20 px-3 py-3 text-sm min-h-[100px]"
                placeholder="Tell us about it"
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              />
              <button data-testid={PRODUCT.reviewSubmit} className="btn-luxury-primary w-full">
                Submit Review
              </button>
            </form>
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="text-black/50">No reviews yet. Be the first.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-black/10 pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={12} fill={n <= r.rating ? "#000" : "none"} strokeWidth={1.5} />
                          ))}
                        </div>
                        <div className="font-medium text-sm">{r.title || "Verified Athlete"}</div>
                      </div>
                      <div className="text-xs text-black/40">{r.user_name}</div>
                    </div>
                    <p className="mt-3 text-sm text-black/70 leading-relaxed">{r.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-32">
            <h2 className="font-display uppercase font-black text-3xl sm:text-4xl mb-10">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
