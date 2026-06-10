import express from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";

import { getDb } from "../db.js";
import { hashPassword, verifyPassword } from "../services/passwordService.js";
import { signAccessToken } from "../services/jwtService.js";
import { requireAuth } from "../middleware/auth.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Too many requests. Please try again later." },
});

const MAX_FAILS = 5;
const LOCK_MIN = 15;

function identifierFor(req, email, prefix = "") {
  const xff = req.headers["x-forwarded-for"] || "";
  const ip = String(xff).split(",")[0].trim() || req.ip || "unknown";
  return `${prefix}${ip}:${email.toLowerCase()}`;
}

async function checkLockout(db, identifier) {
  const rec = await db.collection("login_attempts").findOne({ identifier });
  if (!rec) return;
  if ((rec.count || 0) >= MAX_FAILS) {
    if (rec.locked_until && new Date(rec.locked_until) > new Date()) {
      const err = new Error("Too many failed attempts. Try again later.");
      err.status = 429;
      throw err;
    }
  }
}

async function recordFailure(db, identifier) {
  const rec = await db.collection("login_attempts").findOne({ identifier });
  const count = (rec?.count || 0) + 1;
  let locked_until = null;
  if (count >= MAX_FAILS) {
    locked_until = new Date(Date.now() + LOCK_MIN * 60 * 1000).toISOString();
  }
  await db
    .collection("login_attempts")
    .updateOne(
      { identifier },
      { $set: { identifier, count, locked_until } },
      { upsert: true }
    );
}

async function clearFailures(db, identifier) {
  await db.collection("login_attempts").deleteOne({ identifier });
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || "",
    role: u.role || "user",
    phone: u.phone || "",
    created_at: u.created_at,
  };
}

// Register
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    console.log("REGISTER ROUTE HIT");

    const { email, password, name, referralCode = "" } =
      req.body || {};

    console.log({
      email,
      password,
      name,
      referralCode,
      type: typeof referralCode,
          });

if (!email || !password || !name) {
  return res.status(400).json({
    detail: "Name, email and password are required",
  });
}

if (password.length < 6) {
  return res.status(400).json({
    detail: "Password must be at least 6 chars",
  });
}

const db = getDb();
const lower = email.toLowerCase().trim();

const existing = await db
  .collection("users")
  .findOne({ email: lower });

if (existing) {
  return res.status(400).json({
    detail: "Email already registered",
  });
}

const referrer = referralCode
  ? await db.collection("users").findOne({
      referralCode: referralCode.trim(),
    })
  : null;

console.log(
  "REFERRER FOUND:",
  referrer ? referrer.email : "NOT FOUND"
);

const user = {
  id: uuid(),

  email: lower,

  password_hash: await hashPassword(password),

  name,

  phone: "",

  role: "user",

  referralCode:
    "GS" +
    Math.floor(
      100000 + Math.random() * 900000
    ),

  referredBy:
    referrer?.referralCode || null,

  referralRewardGiven: false,

  referrals: [],

  wallet: {
    availableCoins: 0,
    totalEarnedCoins: 0,
    totalRedeemedCoins: 0,
    referralCoins: 0,
    shoppingCoins: 0,
    membershipLevel: "Silver",
  },

  created_at: new Date().toISOString(),
};

await db.collection("users").insertOne(user);

if (referrer) {
  console.log(
    "AWARDING REFERRAL REWARDS TO:",
    user.email
  );

  // New User +25 Coins
  await db.collection("users").updateOne(
    { id: user.id },
    {
      $inc: {
        "wallet.availableCoins": 25,
        "wallet.totalEarnedCoins": 25,
      },
      $set: {
        referralRewardGiven: true,
      },
    }
  );

  // Referrer +50 Coins
  await db.collection("users").updateOne(
    { id: referrer.id },
    {
      $inc: {
        "wallet.availableCoins": 50,
        "wallet.referralCoins": 50,
        "wallet.totalEarnedCoins": 50,
      },
      $push: {
        referrals: {
          id: user.id,
          name: user.name,
          email: user.email,
          joinedAt:
            new Date().toISOString(),
        },
      },
    }
  );

  console.log(
    "REFERRAL REWARD SUCCESSFULLY GIVEN"
  );
}

const access_token = signAccessToken(user);

sendWelcomeEmail(user).catch(() => {});

res.json({
  user: publicUser(user),
  access_token,
});


} catch (e) {
next(e);
}
});

// Login (regular users)
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        detail: "Email and password required",
      });
    }

    const db = getDb();
    const lower = email.toLowerCase().trim();
    const identifier = identifierFor(req, lower);

    await checkLockout(db, identifier);

    const user = await db.collection("users").findOne({
      email: lower,
    });

    if (
      !user ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      await recordFailure(db, identifier);

      return res.status(401).json({
        detail: "Invalid email or password",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        detail:
          "Use /admin/login for administrator access",
      });
    }

    await clearFailures(db, identifier);

    console.log("LOGIN USER:", user.email);
    console.log("REFERRED BY:", user.referredBy);
    console.log(
      "REWARD GIVEN:",
      user.referralRewardGiven
    );

   

    const access_token = signAccessToken(user);

    res.json({
      user: publicUser(user),
      access_token,
    });
  } catch (e) {
    next(e);
  }
});
// Admin login
router.post("/admin-login", authLimiter, async (req, res, next) => {
try {
const { email, password } = req.body || {};


if (!email || !password) {
  return res.status(400).json({
    detail: "Email and password required",
  });
}

const lower = email.toLowerCase().trim();

// Manual Admin Login
if (
  lower === "gymsword2024@gmail.com" &&
  password === "#Sword@2024"
) {
  const adminUser = {
    id: "admin-1",
    email: "gymsword2024@gmail.com",
    name: "GymSword Admin",
    role: "admin",
    created_at: new Date().toISOString(),
  };

  const access_token = signAccessToken(adminUser);

  return res.json({
    user: adminUser,
    access_token,
  });
}

const db = getDb();
const identifier = identifierFor(req, lower, "admin:");

await checkLockout(db, identifier);

const user = await db.collection("users").findOne({
  email: lower,
});

if (!user || !(await verifyPassword(password, user.password_hash))) {
  await recordFailure(db, identifier);

  return res.status(401).json({
    detail: "Invalid credentials",
  });
}

if (user.role !== "admin") {
  await recordFailure(db, identifier);

  return res.status(403).json({
    detail: "Not authorized as administrator",
  });
}

await clearFailures(db, identifier);

const access_token = signAccessToken(user);

res.json({
  user: publicUser(user),
  access_token,
});

} catch (e) {
next(e);
}
});


router.post("/logout", (_req, res) => res.json({ ok: true }));

router.get("/me", requireAuth, (req, res) => res.json(publicUser(req.user)));

// Forgot password
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ detail: "Email required" });
    const db = getDb();
    const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ ok: true });
    await db.collection("password_reset_tokens").deleteMany({ user_id: user.id });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresMin = parseInt(process.env.PASSWORD_RESET_EXPIRES_MIN || "60", 10);
    const expires_at = new Date(Date.now() + expiresMin * 60 * 1000).toISOString();
    await db.collection("password_reset_tokens").insertOne({
      token: rawToken,
      user_id: user.id,
      expires_at,
      used: false,
      created_at: new Date().toISOString(),
    });
    const resetLink = `${process.env.FRONTEND_URL || ""}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(user, resetLink).catch(() => {});
    console.log(`[gymsword] PASSWORD RESET LINK for ${user.email}: ${resetLink}`);
    res.json({ ok: true, dev_reset_token: rawToken });
  } catch (e) {
    next(e);
  }
});

// Reset password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) return res.status(400).json({ detail: "Token and password required" });
    if (new_password.length < 6) return res.status(400).json({ detail: "Password too short" });
    const db = getDb();
    const rec = await db.collection("password_reset_tokens").findOne({ token, used: false });
    if (!rec) return res.status(400).json({ detail: "Invalid or expired token" });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ detail: "Token expired" });
    await db
      .collection("users")
      .updateOne({ id: rec.user_id }, { $set: { password_hash: await hashPassword(new_password) } });
    await db.collection("password_reset_tokens").updateOne({ token }, { $set: { used: true } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Profile update
router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { name, phone } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (Object.keys(updates).length) {
      await getDb().collection("users").updateOne({ id: req.user.id }, { $set: updates });
    }
    const updated = await getDb()
      .collection("users")
      .findOne({ id: req.user.id }, { projection: { _id: 0, password_hash: 0 } });
    res.json(publicUser(updated));
  } catch (e) {
    next(e);
  }
});

// Change password
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) return res.status(400).json({ detail: "Both passwords required" });
    if (new_password.length < 6) return res.status(400).json({ detail: "Password too short" });
    const db = getDb();
    const full = await db.collection("users").findOne({ id: req.user.id });
    if (!full || !(await verifyPassword(current_password, full.password_hash))) {
      return res.status(400).json({ detail: "Current password is incorrect" });
    }
    await db
      .collection("users")
      .updateOne({ id: req.user.id }, { $set: { password_hash: await hashPassword(new_password) } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Addresses CRUD
router.get("/addresses", requireAuth, async (req, res, next) => {
  try {
    const list = await getDb()
      .collection("addresses")
      .find({ user_id: req.user.id }, { projection: { _id: 0 } })
      .toArray();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/addresses", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const addr = { ...req.body, id: uuid(), user_id: req.user.id, created_at: new Date().toISOString() };
    if (addr.is_default) {
      await db.collection("addresses").updateMany({ user_id: req.user.id }, { $set: { is_default: false } });
    }
    await db.collection("addresses").insertOne(addr);
    delete addr._id;
    res.json(addr);
  } catch (e) {
    next(e);
  }
});

router.patch("/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const update = { ...req.body };
    delete update.id;
    delete update.user_id;
    if (update.is_default) {
      await db.collection("addresses").updateMany({ user_id: req.user.id }, { $set: { is_default: false } });
    }
    await db.collection("addresses").updateOne({ id: req.params.id, user_id: req.user.id }, { $set: update });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    await getDb().collection("addresses").deleteOne({ id: req.params.id, user_id: req.user.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
router.get("/wallet", requireAuth, async (req, res, next) => {
  try {
    const user = await getDb()
      .collection("users")
      .findOne(
        { id: req.user.id },
        {
          projection: {
            _id: 0,
            wallet: 1,
          },
        }
      );

    res.json(
      user?.wallet || {
        availableCoins: 0,
        totalEarnedCoins: 0,
        totalRedeemedCoins: 0,
        referralCoins: 0,
        shoppingCoins: 0,
        membershipLevel: "Silver",
      }
    );
  } catch (e) {
    next(e);
  }
});



router.get(
  "/referrals",
  requireAuth,
  async (req, res, next) => {
    try {
      const user = await getDb()
        .collection("users")
        .findOne(
          { id: req.user.id },
          {
            projection: {
              _id: 0,
              referralCode: 1,
              wallet: 1,
              referrals: 1,
            },
          }
        );

      res.json({
        referralCode:
          user?.referralCode || "",

        totalReferrals:
          user?.referrals?.length || 0,

        referralCoins:
          user?.wallet?.referralCoins || 0,

        availableCoins:
          user?.wallet?.availableCoins || 0,

        referrals:
          user?.referrals || [],
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
