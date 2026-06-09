import express from "express";
import { v4 as uuid } from "uuid";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* ----------------------------- PRODUCTS ----------------------------- */
router.get("/products", async (req, res, next) => {
  try {
    const { category, collection, featured, q, limit } = req.query;
    const query = { is_active: true };
    if (category) query.category = category;
    if (collection) query.collection = collection;
    if (featured !== undefined) query.is_featured = featured === "true";
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }
    const lim = Math.min(parseInt(limit || "60", 10), 200);
    const list = await getDb()
      .collection("products")
      .find(query, { projection: { _id: 0 } })
      .limit(lim)
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const p = await getDb()
      .collection("products")
      .findOne({ id: req.params.id, is_active: true }, { projection: { _id: 0 } });
    if (!p) return res.status(404).json({ detail: "Product not found" });
    res.json(p);
  } catch (e) {
    next(e);
  }
});

router.get("/products/:id/related", async (req, res, next) => {
  try {
    const db = getDb();
    const p = await db.collection("products").findOne({ id: req.params.id });
    if (!p) return res.json([]);
    const list = await db
      .collection("products")
      .find(
        { id: { $ne: req.params.id }, category: p.category, is_active: true },
        { projection: { _id: 0 } }
      )
      .limit(4)
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/* ----------------------------- REVIEWS ----------------------------- */
router.get("/products/:id/reviews", async (req, res, next) => {
  try {
    const list = await getDb()
      .collection("reviews")
      .find({ product_id: req.params.id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/products/:id/reviews", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const product = await db.collection("products").findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ detail: "Product not found" });
    const { rating, title, body } = req.body || {};
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ detail: "Rating 1–5 required" });
    const review = {
      id: uuid(),
      product_id: req.params.id,
      user_id: req.user.id,
      user_name: req.user.name || "Anonymous",
      rating,
      title: title || "",
      body: body || "",
      created_at: new Date().toISOString(),
    };
    await db.collection("reviews").insertOne(review);
    const agg = await db
      .collection("reviews")
      .aggregate([
        { $match: { product_id: req.params.id } },
        { $group: { _id: "$product_id", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ])
      .toArray();
    if (agg[0]) {
      await db
        .collection("products")
        .updateOne(
          { id: req.params.id },
          { $set: { rating: Math.round(agg[0].avg * 100) / 100, review_count: agg[0].count } }
        );
    }
    delete review._id;
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/* ----------------------------- CART ----------------------------- */
async function getCartFor(db, userId) {
  const items = await db
    .collection("cart_items")
    .find({ user_id: userId }, { projection: { _id: 0 } })
    .toArray();
  const enriched = [];
  for (const it of items) {
    const p = await db.collection("products").findOne({ id: it.product_id }, { projection: { _id: 0 } });
    if (p) {
      const line_total = Math.round(p.price * it.qty * 100) / 100;
      enriched.push({ ...it, product: p, line_total });
    }
  }
  const subtotal = Math.round(enriched.reduce((s, e) => s + e.line_total, 0) * 100) / 100;
  const count = enriched.reduce((s, e) => s + e.qty, 0);
  return { items: enriched, subtotal, count };
}

router.get("/cart", requireAuth, async (req, res, next) => {
  try {
    res.json(await getCartFor(getDb(), req.user.id));
  } catch (e) {
    next(e);
  }
});

// Helper: are purchases enabled by admin setting?
async function purchasesEnabled() {
  const db = getDb();
  const s = await db.collection("settings").findOne({ id: "site" });
  return s?.enable_purchases === undefined ? true : !!s.enable_purchases;
}

router.post("/cart", requireAuth, async (req, res, next) => {
  try {
    if (!(await purchasesEnabled())) return res.status(423).json({ detail: "Purchases are currently disabled" });
    const { product_id, qty = 1, size = null, color = null } = req.body || {};
    const db = getDb();
    const product = await db.collection("products").findOne({ id: product_id });
    if (!product) return res.status(404).json({ detail: "Product not found" });
    const existing = await db
      .collection("cart_items")
      .findOne({ user_id: req.user.id, product_id, size, color });
    if (existing) {
      await db.collection("cart_items").updateOne({ id: existing.id }, { $set: { qty: existing.qty + qty } });
    } else {
      await db.collection("cart_items").insertOne({
        id: uuid(),
        user_id: req.user.id,
        product_id,
        qty,
        size,
        color,
        added_at: new Date().toISOString(),
      });
    }
    res.json(await getCartFor(db, req.user.id));
  } catch (e) {
    next(e);
  }
});

router.patch("/cart/:id", requireAuth, async (req, res, next) => {
  try {
    const { qty } = req.body || {};
    const db = getDb();
    if (qty <= 0) {
      await db.collection("cart_items").deleteOne({ id: req.params.id, user_id: req.user.id });
    } else {
      await db.collection("cart_items").updateOne({ id: req.params.id, user_id: req.user.id }, { $set: { qty } });
    }
    res.json(await getCartFor(db, req.user.id));
  } catch (e) {
    next(e);
  }
});

router.delete("/cart/:id", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    await db.collection("cart_items").deleteOne({ id: req.params.id, user_id: req.user.id });
    res.json(await getCartFor(db, req.user.id));
  } catch (e) {
    next(e);
  }
});

router.delete("/cart", requireAuth, async (req, res, next) => {
  try {
    await getDb().collection("cart_items").deleteMany({ user_id: req.user.id });
    res.json({ items: [], subtotal: 0, count: 0 });
  } catch (e) {
    next(e);
  }
});

/* ----------------------------- WISHLIST ----------------------------- */
router.get("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const items = await db
      .collection("wishlist")
      .find({ user_id: req.user.id }, { projection: { _id: 0 } })
      .toArray();
    const enriched = [];
    for (const it of items) {
      const p = await db.collection("products").findOne({ id: it.product_id }, { projection: { _id: 0 } });
      if (p) enriched.push({ ...it, product: p });
    }
    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

router.post("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const { product_id } = req.body || {};
    const db = getDb();
    const exists = await db.collection("products").findOne({ id: product_id });
    if (!exists) return res.status(404).json({ detail: "Product not found" });
    const dupe = await db.collection("wishlist").findOne({ user_id: req.user.id, product_id });
    if (dupe) return res.json({ ok: true, already: true });
    await db.collection("wishlist").insertOne({
      id: uuid(),
      user_id: req.user.id,
      product_id,
      added_at: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/wishlist/:product_id", requireAuth, async (req, res, next) => {
  try {
    await getDb().collection("wishlist").deleteOne({ user_id: req.user.id, product_id: req.params.product_id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* ----------------------------- COUPONS APPLY ----------------------------- */
router.post("/coupons/apply", async (req, res, next) => {
  try {
    const { code, subtotal } = req.body || {};
    if (!code || subtotal === undefined) return res.status(400).json({ detail: "Code and subtotal required" });
    const upper = String(code).toUpperCase().trim();
    const c = await getDb().collection("coupons").findOne({ code: upper, is_active: true }, { projection: { _id: 0 } });
    if (!c) return res.status(404).json({ detail: "Invalid coupon" });
    if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ detail: "Coupon expired" });
    if (subtotal < (c.min_subtotal || 0))
      return res.status(400).json({ detail: `Minimum subtotal $${c.min_subtotal} required` });
    if (c.max_uses && (c.uses || 0) >= c.max_uses) return res.status(400).json({ detail: "Coupon usage limit reached" });
    let discount;
    if (c.discount_type === "percent") {
      discount = Math.round(subtotal * (c.discount_value / 100) * 100) / 100;
    } else {
      discount = Math.min(subtotal, c.discount_value);
    }
    res.json({ code: upper, discount, discount_type: c.discount_type, discount_value: c.discount_value });
  } catch (e) {
    next(e);
  }
});

/* ----------------------------- NEWSLETTER ----------------------------- */
router.post("/newsletter", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ detail: "Email required" });
    await getDb()
      .collection("newsletter")
      .updateOne(
        { email: email.toLowerCase().trim() },
        { $set: { email: email.toLowerCase().trim(), subscribed_at: new Date().toISOString() } },
        { upsert: true }
      );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
