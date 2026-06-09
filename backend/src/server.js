import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDb, getDb, closeDb } from "./db.js";
import { ensureIndexes, seedAdmin, seedProducts } from "./seed.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRouter from "./routes/auth.js";
import shopRouter from "./routes/shop.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import filesRouter from "./routes/files.js";
import contactRouter from "./routes/contact.js";
import settingsRouter from "./routes/settings.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || "8001", 10);
const app = express();

// Stripe webhook MUST receive raw body BEFORE express.json() touches it
app.use("/api/stripe/webhook", stripeWebhookRouter);

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // permissive (ingress also adds *)
    },
    credentials: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health + public settings
app.get("/api/", (_req, res) => res.json({ app: "GymSword", status: "online" }));

app.use("/api/auth", authRouter);
app.use("/api", shopRouter); // /api/products, /api/cart, /api/wishlist, /api/coupons, /api/newsletter
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/files", filesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/settings", settingsRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(errorHandler);

async function bootstrap() {
  await connectDb();
  const db = getDb();
  await ensureIndexes(db);
  await seedAdmin(db);
  await seedProducts(db);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[gymsword] backend listening on 0.0.0.0:${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error("[gymsword] fatal startup error:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("[gymsword] SIGTERM received");
  await closeDb();
  process.exit(0);
});
