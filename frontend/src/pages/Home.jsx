import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { HOME } from "@/constants/testIds";
import HeroSlider from "@/components/HeroSlider";
import TopCollections from "@/components/TopCollections";
const HERO_IMG = "https://images.pexels.com/photos/17924381/pexels-photo-17924381.jpeg";
const LOOKBOOK_1 = "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?crop=entropy&cs=srgb&fm=jpg&q=85";
const LOOKBOOK_2 = "https://images.unsplash.com/photo-1579758682665-53a1a614eea6?crop=entropy&cs=srgb&fm=jpg&q=85";
const ABOUT_BG = "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newDrops, setNewDrops] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true, limit: 8 } }).then(({ data }) => setFeatured(data));
    api.get("/products", { params: { collection: "new", limit: 6 } }).then(({ data }) => setNewDrops(data));
  }, []);

  return (
    <Layout>
      {/* HERO */}
   <div className="-mt-46">
    <HeroSlider />
  </div>

      {/* MARQUEE */}
      <div className="bg-black text-white py-5 border-y border-white/10 overflow-hidden">
        <div className="flex scroll-marquee whitespace-nowrap text-overline text-2xl md:text-3xl gap-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12">
              <span>Forge Your Strength</span>
              <span className="opacity-30">✦</span>
              <span>Engineered Without Compromise</span>
              <span className="opacity-30">✦</span>
              <span>Luxury Athleisure</span>
              <span className="opacity-30">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED COLLECTION */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div>
            <div className="text-overline mb-3">The Edit</div>
            <h2 className="font-display uppercase font-black text-4xl sm:text-5xl tracking-tight">
              Featured Pieces
            </h2>
          </div>
          <Link to="/shop" className="luxury-link text-overline">View All Products →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* SPLIT EDITORIAL */}
      <section className="grid lg:grid-cols-2 gap-0 bg-[#F5F5F7]">
        <div className="relative aspect-[4/5] lg:aspect-auto overflow-hidden">
          <img src={LOOKBOOK_1} alt="Lookbook Women" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="text-overline mb-2 text-white/70">For Her</div>
            <h3 className="font-display uppercase font-black text-3xl sm:text-4xl mb-6">Strength in Form</h3>
            <Link to="/shop/women" className="btn-luxury-light">Shop Women</Link>
          </div>
        </div>
      
        <div className="relative aspect-[4/5] lg:aspect-auto overflow-hidden">
          <img src={LOOKBOOK_2} alt="Lookbook Men" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="text-overline mb-2 text-white/70">For Him</div>
            <h3 className="font-display uppercase font-black text-3xl sm:text-4xl mb-6">Built for Battle</h3>
            <Link to="/shop/men" className="btn-luxury-light">Shop Men</Link>
          </div>
        </div>
      </section>
  <TopCollections/>
      {/* NEW DROPS */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="flex justify-between items-end mb-16">
          <div>
            <div className="text-overline mb-3">Just Landed</div>
            <h2 className="font-display uppercase font-black text-4xl sm:text-5xl tracking-tight">New Arrivals</h2>
          </div>
          <Link to="/shop/new" className="luxury-link text-overline">View New →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {newDrops.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="relative bg-black text-white overflow-hidden">
        <img src={ABOUT_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="grain-overlay absolute inset-0" />
        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-40 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="text-overline text-white/60 mb-3">Manifesto</div>
            <h2 className="font-display uppercase font-black text-4xl sm:text-5xl tracking-tight">
              We forge<br />the unbroken.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6 space-y-6 text-white/80 font-light leading-relaxed text-lg">
            <p>
              GymSword is not just apparel. It is armor for the relentless. Every seam, every fiber,
              every cut is engineered for athletes who demand more from themselves — and from the gear
              they trust to perform.
            </p>
            <p>
              We source from heritage Italian mills, partner with elite athletes, and obsess over the
              one-degree details that separate good from world-class. This is athleisure, refined to
              the standard of luxury.
            </p>
            <div className="pt-6 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="font-display text-4xl">100K+</div>
                <div className="text-overline text-white/50 mt-2">Athletes</div>
              </div>
              <div>
                <div className="font-display text-4xl">42</div>
                <div className="text-overline text-white/50 mt-2">Countries</div>
              </div>
              <div>
                <div className="font-display text-4xl">4.9</div>
                <div className="text-overline text-white/50 mt-2">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
