import { v4 as uuid } from "uuid";
import { hashPassword, verifyPassword } from "./services/passwordService.js";

export async function ensureIndexes(db) {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ id: 1 }, { unique: true });
  await db.collection("products").createIndex({ id: 1 }, { unique: true });
  await db.collection("products").createIndex({ slug: 1 });
  await db.collection("products").createIndex({ category: 1 });
  await db.collection("cart_items").createIndex({ user_id: 1, product_id: 1 });
  await db.collection("wishlist").createIndex({ user_id: 1, product_id: 1 });
  await db.collection("orders").createIndex({ order_number: 1 }, { unique: true });
  await db.collection("orders").createIndex({ user_id: 1 });
  await db.collection("coupons").createIndex({ code: 1 }, { unique: true });
  await db.collection("reviews").createIndex({ product_id: 1 });
  await db.collection("files").createIndex({ storage_path: 1 });
  await db.collection("login_attempts").createIndex({ identifier: 1 });
  await db.collection("password_reset_tokens").createIndex({ token: 1 });
  await db.collection("password_reset_tokens").createIndex({ expires_at: 1 });
  await db.collection("newsletter").createIndex({ email: 1 }, { unique: true });
  await db.collection("contact_messages").createIndex({ created_at: -1 });
  console.log("[gymsword] indexes ensured");
}

export async function seedAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[gymsword] ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }
  const existing = await db.collection("users").findOne({ email });
  if (!existing) {
    await db.collection("users").insertOne({
      id: uuid(),
      email,
      password_hash: await hashPassword(password),
      name: "GymSword Owner",
      phone: "",
      role: "admin",
      created_at: new Date().toISOString(),
    });
    console.log(`[gymsword] admin seeded: ${email}`);
  } else {
    const updates = {};
    if (existing.role !== "admin") updates.role = "admin";
    if (!(await verifyPassword(password, existing.password_hash))) {
      updates.password_hash = await hashPassword(password);
    }
    if (Object.keys(updates).length) {
      await db.collection("users").updateOne({ email }, { $set: updates });
      console.log(`[gymsword] admin updated: ${email}`);
    }
  }
  const testEmail = "customer@gymsword.com";
  if (!(await db.collection("users").findOne({ email: testEmail }))) {
    await db.collection("users").insertOne({
      id: uuid(),
      email: testEmail,
      password_hash: await hashPassword("Customer@2024"),
      name: "Demo Customer",
      phone: "",
      role: "user",
      created_at: new Date().toISOString(),
    });
    console.log(`[gymsword] test customer seeded: ${testEmail}`);
  }
}

const SAMPLE_PRODUCTS = [
  {
    name: "Sword Sculpt Compression Tee",
    category: "men",
    collection: "essentials",
    price: 68,
    compare_at_price: 85,
    short_description: "Engineered for power. Sculpted for performance.",
    description:
      "A flagship compression tee crafted from Italian-spun technical jersey. Four-way stretch, sweat-wicking, and tailored to the athlete's silhouette. Forge every rep with armor-grade comfort.",
    images: [
      { url: "https://images.unsplash.com/photo-1586274955628-91d013206230?crop=entropy&cs=srgb&fm=jpg&q=85", alt: "Sword Sculpt Tee" },
      { url: "https://images.unsplash.com/photo-1579758682665-53a1a614eea6?crop=entropy&cs=srgb&fm=jpg&q=85", alt: "Sword Sculpt Tee back" },
    ],
    colors: ["Black", "Charcoal", "White"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    tags: ["mens", "compression", "training"],
    is_featured: true,
  },
  {
    name: "Forge Tech Joggers", category: "men", collection: "essentials", price: 118,
    short_description: "Tapered tech joggers built for the modern warrior.",
    description: "Premium technical knit joggers with a sculpted taper, hidden zip pockets, and adjustable waist.",
    images: [{ url: "https://images.unsplash.com/photo-1548606703-580672e56c26?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "Charcoal"], sizes: ["S", "M", "L", "XL"], tags: ["mens", "joggers"], is_featured: true,
  },
  {
    name: "Valor Sculpt Sports Bra", category: "women", collection: "essentials", price: 64,
    short_description: "Sculpted support. Uncompromising luxury.",
    description: "Medium-impact sports bra with bonded seams and a buttery-soft inner lining.",
    images: [{ url: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "White", "Silver"], sizes: ["XS", "S", "M", "L", "XL"], tags: ["womens"], is_featured: true,
  },
  {
    name: "Oversized T-Shirt", category: "women", collection: "new", price: 98, compare_at_price: 120,
    short_description: "Architectural high-rise leggings with second-skin compression.",
    description: "Our hero high-rise legging. Sculpting compression, contour seaming, and a wide brushed waistband.",
    images: [{ url: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "Charcoal"], sizes: ["XS", "S", "M", "L", "XL"], tags: ["womens"], is_featured: true,
  },
  {
    name: "Onyx Performance Hoodie", category: "unisex", collection: "new", price: 148,
    short_description: "A luxe technical hoodie engineered for cold-weather training.",
    description: "Heavyweight technical fleece with thermo-regulating yarn, kangaroo pocket, brushed interior.",
    images: [{ url: "https://images.pexels.com/photos/17924381/pexels-photo-17924381.jpeg" }],
    colors: ["Black", "Charcoal", "Silver"], sizes: ["S", "M", "L", "XL", "XXL"], tags: ["unisex"], is_featured: true,
  },
  {
    name: "Blade Training Shorts 7\"", category: "men", collection: "essentials", price: 58,
    short_description: "Featherlight training shorts. Razor-sharp tailoring.",
    description: "Lightweight ripstop training short with an inner brief, zipped pocket, reflective branding.",
    images: [{ url: "https://images.unsplash.com/photo-1632833315181-3be7b2c085bd?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "Charcoal", "White"], sizes: ["S", "M", "L", "XL"], tags: ["mens"], is_featured: false,
  },
  {
    name: "Silver Knit Crop Top", category: "women", collection: "sale", price: 48, compare_at_price: 72,
    short_description: "Featherweight rib-knit crop for studio days.",
    description: "Ultra-soft rib-knit crop top with a tailored cropped hem.",
    images: [{ url: "https://images.unsplash.com/photo-1595909315417-2edd382a56dc?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["White", "Silver", "Black"], sizes: ["XS", "S", "M", "L"], tags: ["womens", "sale"], is_featured: false,
  },
  {
    name: "Vanta Lifting Belt", category: "accessories", collection: "essentials", price: 88,
    short_description: "Premium leather lifting belt with brushed steel buckle.",
    description: "Hand-finished Italian leather lifting belt with double-prong brushed steel buckle.",
    images: [{ url: "https://images.unsplash.com/photo-1595909315417-2edd382a56dc?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black"], sizes: ["S", "M", "L"], tags: ["accessories"], is_featured: false,
  },
  {
    name: "Shadow Performance Cap", category: "accessories", collection: "essentials", price: 38,
    short_description: "Sweat-wicking 5-panel cap with embroidered crest.",
    description: "Lightweight technical cap with mesh ventilation and an embroidered GymSword crest.",
    images: [{ url: "https://images.unsplash.com/photo-1586274955628-91d013206230?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "White"], sizes: ["One Size"], tags: ["accessories"], is_featured: false,
  },
  {
    name: "Titan Sculpt Tank", category: "men", collection: "new", price: 54,
    short_description: "Cut-away muscle tank engineered for hypertrophy.",
    description: "Deep-cut muscle tank with engineered armholes and dropped sides.",
    images: [{ url: "https://images.unsplash.com/photo-1579758682665-53a1a614eea6?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "White", "Charcoal"], sizes: ["S", "M", "L", "XL"], tags: ["mens"], is_featured: true,
  },
  {
    name: "Halo Seamless Long Sleeve", category: "women", collection: "new", price: 78,
    short_description: "Seamless ribbed long sleeve. Pure architectural form.",
    description: "Seamlessly knit ribbed long sleeve with thumb holes and contour seams.",
    images: [{ url: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "Silver", "White"], sizes: ["XS", "S", "M", "L"], tags: ["womens"], is_featured: true,
  },
  {
    name: "Forge Recovery Slides", category: "accessories", collection: "new", price: 48,
    short_description: "Cloud-soft recovery slides for post-training comfort.",
    description: "Ultra-cushioned slides with a contoured footbed and embossed branding.",
    images: [{ url: "https://images.unsplash.com/photo-1632833315181-3be7b2c085bd?crop=entropy&cs=srgb&fm=jpg&q=85" }],
    colors: ["Black", "White"], sizes: ["7", "8", "9", "10", "11", "12"], tags: ["accessories"], is_featured: false,
  },
];

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function seedProducts(db) {
  // INR migration: convert any USD-priced products to INR pricing
  const usdToInr = 83;
  await db
    .collection("products")
    .updateMany(
      { currency: { $ne: "INR" } },
      [
        {
          $set: {
            price: {
              $cond: [
                { $eq: ["$currency", "INR"] },
                "$price",
                { $round: [{ $multiply: ["$price", usdToInr] }, 0] },
              ],
            },
            compare_at_price: {
              $cond: [
                { $eq: [{ $ifNull: ["$compare_at_price", null] }, null] },
                null,
                {
                  $cond: [
                    { $eq: ["$currency", "INR"] },
                    "$compare_at_price",
                    { $round: [{ $multiply: ["$compare_at_price", usdToInr] }, 0] },
                  ],
                },
              ],
            },
            currency: "INR",
          },
        },
      ]
    );

  if ((await db.collection("products").countDocuments({})) > 0) return;
  const now = new Date().toISOString();
  const docs = SAMPLE_PRODUCTS.map((p) => ({
    id: uuid(),
    slug: slugify(p.name),
    is_active: true,
    variants: [],
    created_at: now,
    updated_at: now,
    rating: 0,
    review_count: 0,
    currency: "INR",
    ...p,
    price: Math.round(p.price * usdToInr),
    compare_at_price: p.compare_at_price ? Math.round(p.compare_at_price * usdToInr) : null,
  }));
  await db.collection("products").insertMany(docs);
  console.log(`[gymsword] seeded ${docs.length} products (INR pricing)`);

  if ((await db.collection("coupons").countDocuments({})) === 0) {
    await db.collection("coupons").insertMany([
      {
        id: uuid(), code: "WELCOME10", discount_type: "percent", discount_value: 10,
        min_subtotal: 0, max_uses: null, uses: 0, expires_at: null, is_active: true, created_at: now,
      },
      {
        id: uuid(), code: "FORGE20", discount_type: "percent", discount_value: 20,
        min_subtotal: 12000, max_uses: null, uses: 0, expires_at: null, is_active: true, created_at: now,
      },
    ]);
    console.log("[gymsword] seeded coupons");
  }
}
