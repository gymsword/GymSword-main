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
            GymSword is more than just activewear. We are building a premium lifestyle movement driven by discipline, ambition, confidence, performance, and luxury identity.
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
              <div className="mt-8 space-y-4">

  {/* SUPPORT */}
  <div className="flex items-start gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] transition-all duration-300">

    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm flex-shrink-0">

      @

    </div>

    <div className="min-w-0">

      <p className="uppercase tracking-[3px] text-gray-500 text-[9px] font-bold mb-1">

        Support Email

      </p>

      <a
        href="mailto:support@gymsword.com"
        className="text-white text-sm sm:text-base font-semibold hover:text-gray-300 transition break-all"
      >
        support@gymsword.com
      </a>

    </div>

  </div>

  {/* SPONSORSHIP */}
  <div className="flex items-start gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] transition-all duration-300">

    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm flex-shrink-0">

      ✦

    </div>

    <div className="min-w-0">

      <p className="uppercase tracking-[3px] text-gray-500 text-[9px] font-bold mb-1">

        Sponsorship

      </p>

      <a
        href="mailto:sponsorship@gymsword.com"
        className="text-white text-sm sm:text-base font-semibold hover:text-gray-300 transition break-all"
      >
        sponsorship@gymsword.com
      </a>

    </div>

  </div>

  {/* PHONE */}
  <div className="flex items-start gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] transition-all duration-300">

    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm flex-shrink-0">

      ☎

    </div>

    <div className="min-w-0">

      <p className="uppercase tracking-[3px] text-gray-500 text-[9px] font-bold mb-1">

        Customer Support

      </p>

      <a
        href="tel:+918799756074"
        className="text-white text-sm sm:text-base font-semibold hover:text-gray-300 transition"
      >
        +91 87997 56074
      </a>

    </div>

  </div>

</div>
   <div className="flex items-center gap-5 mt-10">

              {/* INSTAGRAM */}
              <a
                href="https://www.instagram.com/gym_swordofficial?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="group w-16 h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white transition-all duration-300 flex items-center justify-center hover:scale-110"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-white group-hover:text-black transition"
                >
                  <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0 1 20 7.75v8.5A3.75 3.75 0 0 1 16.25 20h-8.5A3.75 3.75 0 0 1 4 16.25v-8.5A3.75 3.75 0 0 1 7.75 4zm8.75 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                </svg>

              </a>

              {/* FACEBOOK */}
              <a
                href="/"
                className="group w-16 h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white transition-all duration-300 flex items-center justify-center hover:scale-110"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-white group-hover:text-black transition"
                >
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/>
                </svg>

              </a>

              {/* WHATSAPP */}
              <a
                href="https://wa.me/918799756074"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-16 h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white transition-all duration-300 flex items-center justify-center hover:scale-110"
              >

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-white group-hover:text-black transition"
                >
                  <path d="M20.52 3.48A11.91 11.91 0 0 0 12.06 0C5.5 0 .15 5.35.15 11.91c0 2.1.55 4.15 1.6 5.95L0 24l6.33-1.66a11.8 11.8 0 0 0 5.73 1.46h.01c6.56 0 11.91-5.35 11.91-11.91 0-3.18-1.24-6.17-3.46-8.41z"/>
                </svg>

              </a>

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
                {/* <li><span className="luxury-link cursor-pointer">Shipping</span></li>
                <li><span className="luxury-link cursor-pointer">Returns</span></li> */}
              </ul>
            </div>
            <div>
              <div className="text-overline text-white/50 mb-8">Brand</div>
              <ul className="space-y-3 text-sm text-white/80">
                <li>
                  <span className="luxury-link cursor-pointer">Our Story</span></li>
               
              </ul>
                     <div className="bg-white/[0.04] border border-white/10 rounded-[35px] p-8">

              <p className="uppercase tracking-[4px] text-gray-500 text-xs font-semibold mb-4">
                Stay Updated
              </p>

              <h3 className="text-3xl font-black leading-tight mb-5">

                Join The
                <span className="block text-gray-500">
                  GymSword Movement
                </span>

              </h3>

              <p className="text-gray-400 leading-8 mb-8">

                Receive updates on premium drops,
                exclusive collections, and special offers.

              </p>

              <div className="space-y-4">

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-black/40 border border-white/10 focus:border-white/30 outline-none px-5 py-4 rounded-2xl text-white placeholder:text-gray-600"
                />

                <button
                  className="w-full bg-white text-black hover:bg-gray-200 transition-all duration-300 py-4 rounded-2xl font-bold text-lg hover:scale-[1.02]"
                >
                  Subscribe
                </button>

              </div>

            </div>

        
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
