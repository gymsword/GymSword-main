import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { HOME } from "@/constants/testIds";
import { Link } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Welcome to the GymSword inner circle");
      setEmail("");
    } catch {
      toast.error("Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-black text-white relative overflow-hidden">
      <div className="grain-overlay absolute inset-0" />
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-20 relative">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <GymSwordLogo variant="light" />
            <p className="mt-6 text-white/70 max-w-md font-light leading-relaxed">
              Forged for the modern athlete. Engineered without compromise. GymSword crafts world-class
              athleisure for those who refuse to be ordinary.
            </p>
            <form onSubmit={subscribe} className="mt-10 flex flex-col gap-3 max-w-md">
              <label className="text-overline text-white/60">Join the Inner Circle</label>
              <div className="flex border border-white/20">
                <input
                  data-testid={HOME.newsletterInput}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-transparent flex-1 px-4 py-4 text-sm focus:outline-none placeholder:text-white/40"
                />
                <button
                  data-testid={HOME.newsletterSubmit}
                  disabled={loading}
                  className="bg-white text-black px-6 text-overline hover:bg-white/90 transition"
                >
                  {loading ? "..." : "Subscribe"}
                </button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <div className="text-overline text-white/50 mb-5">Shop</div>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link to="/shop/men" className="luxury-link">Men</Link></li>
                <li><Link to="/shop/women" className="luxury-link">Women</Link></li>
                <li><Link to="/shop/accessories" className="luxury-link">Accessories</Link></li>
                <li><Link to="/shop/new" className="luxury-link">New Arrivals</Link></li>
                <li><Link to="/shop/sale" className="luxury-link">Sale</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-overline text-white/50 mb-5">Support</div>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link to="/track" className="luxury-link">Track Order</Link></li>
                <li><Link to="/account" className="luxury-link">My Account</Link></li>
                <li><Link to="/contact" className="luxury-link">Contact</Link></li>
                <li><span className="luxury-link cursor-pointer">Shipping</span></li>
                <li><span className="luxury-link cursor-pointer">Returns</span></li>
              </ul>
            </div>
            <div>
              <div className="text-overline text-white/50 mb-5">Brand</div>
              <ul className="space-y-3 text-sm text-white/80">
                <li><span className="luxury-link cursor-pointer">Our Story</span></li>
                <li><span className="luxury-link cursor-pointer">Sustainability</span></li>
                <li><span className="luxury-link cursor-pointer">Athletes</span></li>
                <li><span className="luxury-link cursor-pointer">Press</span></li>
                <li><span className="luxury-link cursor-pointer">Careers</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/50 tracking-luxury uppercase">
          <div>© {new Date().getFullYear()} GymSword. Forged in Steel.</div>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
