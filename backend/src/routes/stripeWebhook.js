import express from "express";
import { getStripe } from "../services/stripeService.js";
import { getDb } from "../db.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";

const router = express.Router();

// IMPORTANT: this router is mounted before express.json() in server.js so we
// have access to the raw body required for Stripe signature verification.
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // If no webhook secret configured, accept-but-warn (used for env without webhook)
    console.warn("[stripe] webhook received but STRIPE_WEBHOOK_SECRET not set; skipping verification");
    return res.json({ received: true, verified: false });
  }
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("[stripe] signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        const db = getDb();
        const order = await db.collection("orders").findOne({ id: orderId });
        if (order && order.payment_status !== "paid") {
          const update = {
            payment_status: "paid",
            status: "confirmed",
            history: [...(order.history || []), { status: "confirmed", at: new Date().toISOString() }],
            stripe_payment_intent: session.payment_intent || null,
          };
          await db.collection("orders").updateOne({ id: orderId }, { $set: update });
          if (order.coupon_code) {
            await db.collection("coupons").updateOne({ code: order.coupon_code }, { $inc: { uses: 1 } });
          }
          await db.collection("cart_items").deleteMany({ user_id: order.user_id });
          const user = await db.collection("users").findOne({ id: order.user_id });
          if (user) sendOrderConfirmationEmail({ ...order, ...update }, user).catch(() => {});
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[stripe] webhook handling failed:", err);
    res.status(500).json({ received: false });
  }
});

export default router;
