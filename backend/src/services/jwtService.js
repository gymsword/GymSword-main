import jwt from "jsonwebtoken";

const ALGO = "HS256";

export function signAccessToken({ id, email, role }) {
  return jwt.sign(
    { sub: id, email, role, type: "access" },
    process.env.JWT_SECRET,
    { algorithm: ALGO, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d" }
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGO] });
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}
