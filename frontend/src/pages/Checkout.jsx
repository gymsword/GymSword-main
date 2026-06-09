import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import Layout from "@/components/Layout";
import { CHECKOUT } from "@/constants/testIds";

const empty = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "United States",
  is_default: true,
};

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState(empty);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.subtotal;
  const shipping = subtotal > 4999 ? 0 : 499;
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + shipping + tax;

  const applyCoupon = async () => {
    try {
      const { data } = await api.post("/coupons/apply", { code: coupon, subtotal });
      setDiscount(data.discount);
      setAppliedCode(data.code);
      toast.success(`Coupon ${data.code} applied — saved ${formatPrice(data.discount)}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const placeOrder = async () => {
    if (!addr.full_name || !addr.line1 || !addr.city || !addr.postal_code) {
      toast.error("Please complete the shipping address");
      return;
    }
    setPlacing(true);
    try {
      if (paymentMethod === "card") {
        // Stripe Checkout (hosted page)
        const { data } = await api.post("/orders/checkout-stripe", {
          address: addr,
          coupon_code: appliedCode || null,
        });
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("Stripe session not created");
      }
      const { data } = await api.post("/orders/checkout", {
        address: addr,
        coupon_code: appliedCode || null,
        payment_method: paymentMethod,
      });
      await refresh();
      navigate(`/order/${data.id}`, { state: { success: true } });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-32 text-center">
          <h1 className="font-display uppercase font-black text-4xl mb-6">Checkout</h1>
          <p className="text-black/60 mb-8">Your bag is empty.</p>
          <button onClick={() => navigate("/shop")} className="btn-luxury-primary">Shop Collection</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <h1 className="font-display uppercase font-black text-4xl sm:text-6xl mb-12">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="text-overline mb-6">Shipping Address</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input id={CHECKOUT.fullName} label="Full Name" value={addr.full_name} onChange={(v) => setAddr({ ...addr, full_name: v })} />
                <Input id={CHECKOUT.phone} label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
                <Input id={CHECKOUT.line1} label="Address Line 1" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} className="sm:col-span-2" />
                <Input id={CHECKOUT.line2} label="Apartment, Suite (optional)" value={addr.line2} onChange={(v) => setAddr({ ...addr, line2: v })} className="sm:col-span-2" />
                <Input id={CHECKOUT.city} label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
                <Input id={CHECKOUT.state} label="State / Region" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} />
                <Input id={CHECKOUT.postal} label="Postal Code" value={addr.postal_code} onChange={(v) => setAddr({ ...addr, postal_code: v })} />
                <Input id={CHECKOUT.country} label="Country" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} />
              </div>
            </section>

            <section>
              <div className="text-overline mb-6">Payment Method</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { v: "card", label: "Credit / Debit Card" },
                  { v: "cod", label: "Cash on Delivery" },
                ].map((p) => (
                  <button
                    key={p.v}
                    onClick={() => setPaymentMethod(p.v)}
                    className={`p-5 border text-sm uppercase tracking-luxury text-left ${
                      paymentMethod === p.v ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {paymentMethod === "card" && (
                <div className="mt-4 text-xs text-black/50">
                  Secure payments powered by Stripe. You'll be redirected to Stripe's secure checkout to complete payment.
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#F5F5F7] p-8 sticky top-32">
              <div className="text-overline mb-6">Order</div>
              <div className="space-y-3 max-h-64 overflow-auto pr-1">
                {cart.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{it.product.name}</div>
                      <div className="text-xs text-black/50">
                        Qty {it.qty}{it.size ? ` · ${it.size}` : ""}
                      </div>
                    </div>
                    <div className="font-semibold">{formatPrice(it.line_total)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-black/15">
                <div className="flex gap-2">
                  <input
                    data-testid={CHECKOUT.coupon}
                    className="flex-1 bg-white border border-black/20 px-3 py-3 text-sm focus:outline-none"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <button
                    data-testid={CHECKOUT.applyCoupon}
                    onClick={applyCoupon}
                    className="btn-luxury-secondary !px-4 !py-3"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-black/70"><span>Discount ({appliedCode})</span><span>-{formatPrice(discount)}</span></div>
                )}
                <div className="flex justify-between text-black/60"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "Free"}</span></div>
                <div className="flex justify-between text-black/60"><span>GST (18%)</span><span>{formatPrice(tax)}</span></div>
                <div className="border-t border-black/20 pt-3 flex justify-between font-display text-lg"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              <button
                data-testid={CHECKOUT.placeOrder}
                onClick={placeOrder}
                disabled={placing}
                className="btn-luxury-primary w-full mt-8"
              >
                {placing ? "Placing Order…" : `Place Order — ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Input({ id, label, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-overline text-black/60 mb-2">{label}</div>
      <input
        data-testid={id}
        className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
