export function errorHandler(err, _req, res, _next) {
  console.error("[gymsword] error:", err);
  const status = err.status || err.statusCode || 500;
  const detail = err.detail || err.message || "Internal server error";
  res.status(status).json({ detail });
}

export function httpError(status, detail) {
  const e = new Error(detail);
  e.status = status;
  e.detail = detail;
  return e;
}
