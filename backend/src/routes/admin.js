import express from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";

import { getDb } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import { sendOrderStatusEmail } from "../services/emailService.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* DASHBOARD */
router.get("/stats", async (_req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 86400 * 1000).toISOString();
    const total_orders = await db.collection("orders").countDocuments({});
    const total_users = await db.collection("users").countDocuments({ role: "user" });
    const total_products = await db.collection("products").countDocuments({});
    const recent_orders = await db
      .collection("orders")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    const rev = await db
      .collection("orders")
      .aggregate([
        { $match: { payment_status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ])
      .toArray();
    const total_revenue = rev[0] ? Math.round(rev[0].total * 100) / 100 : 0;
    const revenue_trend = await db
      .collection("orders")
      .aggregate([
        { $match: { created_at: { $gte: last30 } } },
        {
          $group: {
            _id: { $substr: ["$created_at", 0, 10] },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    const top_products = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product_id",
            name: { $first: "$items.name" },
            qty: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 5 },
      ])
      .toArray();
    res.json({ total_orders, total_users, total_products, total_revenue, recent_orders, revenue_trend, top_products });
  } catch (e) {
    next(e);
  }
});

/* PRODUCTS CRUD */
router.get("/products", async (_req, res, next) => {
  try {
    const list = await getDb()
      .collection("products")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/* IMAGE UPLOAD - CLOUDINARY */
router.post("/uploads", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        detail: "No file uploaded",
      });
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "gymsword/products",
      }
    );

    return res.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const update = { ...req.body, updated_at: new Date().toISOString() };
    delete update.id;
    await getDb().collection("products").updateOne({ id: req.params.id }, { $set: update });
    const updated = await getDb().collection("products").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await getDb().collection("products").deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* IMAGE UPLOAD */
router.post("/uploads", upload.single("file"), async (req, res) => {
  try {
    console.log("=== UPLOAD STARTED ===");

    if (!req.file) {
      return res.status(400).json({
        detail: "No file uploaded",
      });
    }

    console.log("File:", req.file.originalname);
    console.log("Type:", req.file.mimetype);
    console.log("Size:", req.file.size);

    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({
        detail: "Only image files allowed",
      });
    }

    const filePath = buildStoragePath(
      req.file.originalname || "image.png",
      "products"
    );

    console.log("Storage Path:", filePath);

    const contentType =
      req.file.mimetype ||
      contentTypeForFile(req.file.originalname);

    const result = await putObject(
      filePath,
      req.file.buffer,
      contentType
    );

    console.log("Storage Result:", result);

    const db = getDb();

    await db.collection("files").insertOne({
      id: uuid(),
      storage_path: result.path || filePath,
      original_filename: req.file.originalname,
      content_type: contentType,
      size: result.size || req.file.size,
      uploaded_by: req.user?.id || "admin",
      is_deleted: false,
      created_at: new Date().toISOString(),
    });

    return res.json({
      path: result.path || filePath,
      url: `/api/files/${result.path || filePath}`,
    });
  } catch (error) {
    console.error("========== UPLOAD ERROR ==========");
    console.error(error);
    console.error("==================================");

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ORDERS */
router.get("/orders", async (_req, res, next) => {
  try {
    const list = await getDb()
      .collection("orders")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ detail: "Status required" });
    const db = getDb();
    const order = await db.collection("orders").findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ detail: "Order not found" });
    const history = [...(order.history || []), { status, at: new Date().toISOString() }];
    await db.collection("orders").updateOne({ id: req.params.id }, { $set: { status, history } });
    const user = await db.collection("users").findOne({ id: order.user_id });
    if (user) sendOrderStatusEmail({ ...order, status }, user).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* CUSTOMERS */
router.get("/customers", async (_req, res, next) => {
  try {
    const db = getDb();
    const users = await db
      .collection("users")
      .find({ role: "user" }, { projection: { _id: 0, password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    for (const u of users) {
      u.order_count = await db.collection("orders").countDocuments({ user_id: u.id });
      const rev = await db
        .collection("orders")
        .aggregate([
          { $match: { user_id: u.id, payment_status: "paid" } },
          { $group: { _id: null, t: { $sum: "$total" } } },
        ])
        .toArray();
      u.total_spent = rev[0] ? Math.round(rev[0].t * 100) / 100 : 0;
    }
    res.json(users);
  } catch (e) {
    next(e);
  }
});

/* COUPONS */
router.get("/coupons", async (_req, res, next) => {
  try {
    const list = await getDb()
      .collection("coupons")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/coupons", async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.code = String(data.code || "").toUpperCase().trim();
    if (!data.code) return res.status(400).json({ detail: "Code required" });
    const db = getDb();
    if (await db.collection("coupons").findOne({ code: data.code })) {
      return res.status(400).json({ detail: "Coupon code already exists" });
    }
    data.id = uuid();
    data.uses = 0;
    data.created_at = new Date().toISOString();
    await db.collection("coupons").insertOne(data);
    delete data._id;
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete("/coupons/:id", async (req, res, next) => {
  try {
    await getDb().collection("coupons").deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* SETTINGS */
router.get("/settings", async (_req, res, next) => {
  try {
    const doc = (await getDb().collection("settings").findOne({ id: "site" }, { projection: { _id: 0 } })) || {
      id: "site",
    };
    doc.coming_soon_env = String(process.env.COMING_SOON || "false").toLowerCase() === "true";
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

router.patch("/settings", async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.id;
    delete updates.coming_soon_env;
    await getDb()
      .collection("settings")
      .updateOne({ id: "site" }, { $set: { id: "site", ...updates } }, { upsert: true });
    const doc = await getDb().collection("settings").findOne({ id: "site" }, { projection: { _id: 0 } });
    doc.coming_soon_env = String(process.env.COMING_SOON || "false").toLowerCase() === "true";
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/* CONTACT MESSAGES */
router.get("/contact-messages", async (_req, res, next) => {
  try {
    const list = await getDb()
      .collection("contact_messages")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch("/contact-messages/:id", async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body || {};
    const updates = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    await getDb().collection("contact_messages").updateOne({ id: req.params.id }, { $set: updates });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/contact-messages/:id", async (req, res, next) => {
  try {
    await getDb().collection("contact_messages").deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
