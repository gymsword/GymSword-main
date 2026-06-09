import express from "express";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";

import { getDb } from "../db.js";
import { sendContactConfirmationEmail, sendContactNotificationEmail } from "../services/emailService.js";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many submissions. Please try again later." },
});

router.post("/", contactLimiter, async (req, res, next) => {
  try {
    const { name = "", email, subject = "", message } = req.body || {};
    if (!email || !message) return res.status(400).json({ detail: "Email and message required" });
    const doc = {
      id: uuid(),
      name: String(name).slice(0, 200),
      email: String(email).toLowerCase().trim().slice(0, 200),
      subject: String(subject).slice(0, 200),
      message: String(message).slice(0, 5000),
      status: "new",
      admin_notes: "",
      created_at: new Date().toISOString(),
    };
    await getDb().collection("contact_messages").insertOne(doc);
    sendContactNotificationEmail(doc).catch(() => {});
    sendContactConfirmationEmail(doc).catch(() => {});
    res.json({ ok: true, id: doc.id });
  } catch (e) {
    next(e);
  }
});

export default router;
