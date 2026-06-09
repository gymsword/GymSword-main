import express from "express";
import { v4 as uuid } from "uuid";

import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getStripe } from "../services/stripeService.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";

const router = express.Router();

async function purchasesEnabled() {
  const db = getDb();
  const s = await db.collection("settings").findOne({ id: "site" });
  return s?.enable_purchases === undefined ? true : !!s.enable_purchases;
}

function orderNumber() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "GS-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function buildOrderFromCart(db, user, address, couponCode, paymentMethod) {
  const cart = await db
    .collection("cart_items")
    .find({ user_id: user.id }, { projection: { _id: 0 } })
    .toArray();
  if (!cart.length) throw Object.assign(new Error("Cart is empty"), { status: 400 });
  const items = [];
  let subtotal = 0;
  for (const c of cart) {
    const p = await db.collection("products").findOne({ id: c.product_id });
    if (!p) continue;
    const lineTotal = p.price * c.qty;
    subtotal += lineTotal;
    items.push({
      product_id: p.id,
      name: p.name,
      image: p.images?.[0]?.url || "",
      price: p.price,
      qty: c.qty,
      size: c.size || "",
      color: c.color || "",
    });
  }
  let discount = 0;
  let coupon_code = null;
  if (couponCode) {
    const coupon = await db.collection("coupons").findOne({ code: couponCode.toUpperCase().trim(), is_active: true });
    if (coupon) {
      if (coupon.discount_type === "percent") discount = Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100;
      else discount = Math.min(subtotal, coupon.discount_value);
      coupon_code = coupon.code;
    }
  }
  const shipping = subtotal > 4999 ? 0 : 499;
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
  const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;
  return {
    id: uuid(),
    order_number: orderNumber(),
    user_id: user.id,
    user_email: user.email,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    coupon_code,
    shipping,
    tax,
    total,
    address,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "stripe" ? "pending" : "paid",
    status: paymentMethod === "stripe" ? "pending_payment" : "confirmed",
    history: [
      {
        status: paymentMethod === "stripe" ? "pending_payment" : "confirmed",
        at: new Date().toISOString(),
      },
    ],
    notes: "",
    created_at: new Date().toISOString(),
  };
}

// Standard checkout (mock-paid)
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    if (!(await purchasesEnabled())) return res.status(423).json({ detail: "Purchases are currently disabled" });
    const db = getDb();
    const { address, coupon_code, payment_method = "card", notes = "" } = req.body || {};
    if (!address || !address.full_name || !address.line1) {
      return res.status(400).json({ detail: "Shipping address required" });
    }
    const order = await buildOrderFromCart(db, req.user, address, coupon_code, payment_method);
    order.notes = notes || "";
    await db.collection("orders").insertOne(order);
    if (order.coupon_code) {
      await db.collection("coupons").updateOne({ code: order.coupon_code }, { $inc: { uses: 1 } });
    }
    await db.collection("cart_items").deleteMany({ user_id: req.user.id });
    sendOrderConfirmationEmail(order, req.user).catch(() => {});
    delete order._id;
    res.json(order);
  } catch (e) {
    next(e);
  }
});

// Stripe Checkout (hosted page)
router.post("/checkout-stripe", requireAuth, async (req, res, next) => {
  try {
    if (!(await purchasesEnabled())) return res.status(423).json({ detail: "Purchases are currently disabled" });
    const db = getDb();
    const { address, coupon_code, notes = "" } = req.body || {};
    if (!address || !address.full_name || !address.line1) {
      return res.status(400).json({ detail: "Shipping address required" });
    }
    const order = await buildOrderFromCart(db, req.user, address, coupon_code, "stripe");
    order.notes = notes || "";

    const stripe = getStripe();
    const lineItems = order.items.map((it) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: it.name,
          ...(it.size || it.color ? { description: [it.size, it.color].filter(Boolean).join(" · ") } : {}),
        },
        unit_amount: Math.round(it.price * 100),
      },
      quantity: it.qty,
    }));

    const extras = [];
    if (order.shipping > 0) {
      extras.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(order.shipping * 100),
        },
        quantity: 1,
      });
    }
    if (order.tax > 0) {
      extras.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax (8%)" },
          unit_amount: Math.round(order.tax * 100),
        },
        quantity: 1,
      });
    }
    const allLines = [...lineItems, ...extras];
    const sessionParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: allLines.map((li) => ({
        ...li,
        price_data: { ...li.price_data, currency: process.env.STRIPE_CURRENCY || "inr" },
      })),
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/order/${order.id}?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?stripe=cancelled`,
      metadata: { order_id: order.id, user_id: req.user.id, order_number: order.order_number },
    };

    if (order.discount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(order.discount * 100),
        currency: process.env.STRIPE_CURRENCY || "inr",
        duration: "once",
        name: order.coupon_code || "Discount",
      });
      sessionParams.discounts = [{ coupon: stripeCoupon.id }];
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (err) {
      // Stripe failure: do NOT persist the order. Surface upstream error as 502.
      const e = new Error(`Payment provider error: ${err.message}`);
      e.status = 502;
      throw e;
    }

    order.stripe_session_id = session.id;
    order.stripe_url = session.url;
    await db.collection("orders").insertOne(order);

    res.json({ order_id: order.id, session_id: session.id, url: session.url });
  } catch (e) {
    next(e);
  }
});

// Verify Stripe payment (called by order page after redirect)
router.get("/verify-stripe/:orderId", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const order = await db
      .collection("orders")
      .findOne({ id: req.params.orderId, user_id: req.user.id }, { projection: { _id: 0 } });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    if (order.payment_method !== "stripe" || !order.stripe_session_id) return res.json(order);
    if (order.payment_status === "paid") return res.json(order);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (session.payment_status === "paid") {
      const update = {
        payment_status: "paid",
        status: "confirmed",
        history: [...(order.history || []), { status: "confirmed", at: new Date().toISOString() }],
        stripe_payment_intent: session.payment_intent || null,
      };
      await db.collection("orders").updateOne({ id: order.id }, { $set: update });
      if (order.coupon_code)
        await db.collection("coupons").updateOne({ code: order.coupon_code }, { $inc: { uses: 1 } });
      await db.collection("cart_items").deleteMany({ user_id: req.user.id });
      sendOrderConfirmationEmail({ ...order, ...update }, req.user).catch(() => {});
    }
    const updated = await db
      .collection("orders")
      .findOne({ id: req.params.orderId, user_id: req.user.id }, { projection: { _id: 0 } });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const list = await getDb()
      .collection("orders")
      .find({ user_id: req.user.id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/track/:order_number", async (req, res, next) => {
  try {
    const order = await getDb()
      .collection("orders")
      .findOne({ order_number: req.params.order_number }, { projection: { _id: 0, user_id: 0, user_email: 0 } });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await getDb()
      .collection("orders")
      .findOne({ id: req.params.id, user_id: req.user.id }, { projection: { _id: 0 } });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;
