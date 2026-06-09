import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";

const CATEGORY_LABELS = {
  men: "Men",
  women: "Women",
  accessories: "Accessories",
  new: "New Arrivals",
  sale: "Sale",
};

const HEROS = {
  men: "https://images.unsplash.com/photo-1579758682665-53a1a614eea6?crop=entropy&cs=srgb&fm=jpg&q=85",
  women: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?crop=entropy&cs=srgb&fm=jpg&q=85",
  accessories: "https://images.unsplash.com/photo-1595909315417-2edd382a56dc?crop=entropy&cs=srgb&fm=jpg&q=85",
  new: "https://images.pexels.com/photos/17924381/pexels-photo-17924381.jpeg",
  sale: "https://images.unsplash.com/photo-1548606703-580672e56c26?crop=entropy&cs=srgb&fm=jpg&q=85",
  all: "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg",
};

export default function Shop() {
  const { category } = useParams();
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");

  const cat = category || "all";
  const label = CATEGORY_LABELS[cat] || "Shop All";
  const hero = HEROS[cat] || HEROS.all;

  useEffect(() => {
    setLoading(true);
    const q = {};
    if (cat === "new" || cat === "sale") {
      q.collection = cat;
    } else if (cat !== "all") {
      q.category = cat;
    }
    const search = params.get("q");
    if (search) q.q = search;
    api.get("/products", { params: q }).then(({ data }) => {
      let list = data;
      if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
      if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
      if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
      setProducts(list);
      setLoading(false);
    });
  }, [cat, params, sort]);

  return (
    <Layout>
      <section className="relative h-[40vh] min-h-[280px] overflow-hidden bg-black">
        <img src={hero} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
        <div className="relative h-full max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col justify-end pb-12 text-white">
          <div className="text-overline text-white/70 mb-3">Collection</div>
          <h1 className="font-display uppercase font-black text-5xl sm:text-7xl tracking-tight">{label}</h1>
        </div>
      </section>
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10 pb-6 border-b border-black/10">
          <div className="text-sm text-black/60">{products.length} pieces</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            data-testid="shop-sort"
            className="text-overline bg-transparent border border-black/20 px-4 py-2 focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
        {loading ? (
          <div className="text-overline text-center py-20">Loading…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20" data-testid="shop-empty">
            <div className="font-display text-3xl uppercase">Nothing here yet</div>
            <div className="text-black/60 mt-2">Check back soon.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
