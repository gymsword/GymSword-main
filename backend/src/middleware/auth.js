import { verifyAccessToken } from "../services/jwtService.js";
import { getDb } from "../db.js";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ detail: "Not authenticated" });
    const payload = verifyAccessToken(token);
    const db = getDb();
    const user = await db
      .collection("users")
      .findOne({ id: payload.sub }, { projection: { _id: 0, password_hash: 0 } });
    if (!user) return res.status(401).json({ detail: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const db = getDb();
    const user = await db
      .collection("users")
      .findOne({ id: payload.sub }, { projection: { _id: 0, password_hash: 0 } });
    if (user) req.user = user;
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ detail: "Admin privileges required" });
  }
  next();
}
