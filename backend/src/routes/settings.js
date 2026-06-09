import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

/**
 * Public site settings — merges env defaults with admin-saved DB overrides.
 * Admin toggle for coming_soon takes precedence; if no DB value, falls back to env.
 */
router.get("/public", async (_req, res, next) => {
  try {
    const settings = await getDb().collection("settings").findOne({ id: "site" }, { projection: { _id: 0 } });
    const envFlag = String(process.env.COMING_SOON || "false").toLowerCase() === "true";
    const coming_soon =
      settings && settings.coming_soon !== undefined && settings.coming_soon !== null
        ? !!settings.coming_soon
        : envFlag;
    const show_prices = settings?.show_prices !== undefined ? !!settings.show_prices : true;
    const enable_purchases = settings?.enable_purchases !== undefined ? !!settings.enable_purchases : true;
    res.json({
      coming_soon,
      show_prices,
      enable_purchases,
      brand: process.env.BRAND_NAME || "GymSword",
      tagline: settings?.hero_subheadline || "Forge Your Strength.",
      announcement: settings?.announcement_bar || "",
      currency: process.env.CURRENCY_CODE || "INR",
      currency_symbol: process.env.CURRENCY_SYMBOL || "₹",
      support_email: process.env.SUPPORT_EMAIL || "support@gymsword.com",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
