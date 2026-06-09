/**
 * Emergent object storage wrapper for Node.js.
 * Mirrors the Python wrapper used previously.
 */
import { v4 as uuid } from "uuid";

const STORAGE_BASE = "https://integrations.emergentagent.com/objstore/api/v1/storage";
const APP_NAME = "gymsword";

let storageKey = null;

async function initStorage() {
  if (storageKey) return storageKey;
  const key = process.env.EMERGENT_LLM_KEY;
  if (!key) throw new Error("EMERGENT_LLM_KEY missing - storage cannot be initialized");
  const resp = await fetch(`${STORAGE_BASE}/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emergent_key: key }),
  });
  if (!resp.ok) throw new Error(`storage init failed: ${resp.status}`);
  const data = await resp.json();
  storageKey = data.storage_key;
  return storageKey;
}

export async function putObject(path, buffer, contentType) {
  let key = await initStorage();
  let resp = await fetch(`${STORAGE_BASE}/objects/${path}`, {
    method: "PUT",
    headers: { "X-Storage-Key": key, "Content-Type": contentType },
    body: buffer,
  });
  if (resp.status === 403) {
    storageKey = null;
    key = await initStorage();
    resp = await fetch(`${STORAGE_BASE}/objects/${path}`, {
      method: "PUT",
      headers: { "X-Storage-Key": key, "Content-Type": contentType },
      body: buffer,
    });
  }
  if (!resp.ok) throw new Error(`storage put failed: ${resp.status}`);
  return resp.json();
}

export async function getObject(path) {
  let key = await initStorage();
  let resp = await fetch(`${STORAGE_BASE}/objects/${path}`, {
    headers: { "X-Storage-Key": key },
  });
  if (resp.status === 403) {
    storageKey = null;
    key = await initStorage();
    resp = await fetch(`${STORAGE_BASE}/objects/${path}`, {
      headers: { "X-Storage-Key": key },
    });
  }
  if (!resp.ok) throw new Error(`storage get failed: ${resp.status}`);
  const contentType = resp.headers.get("content-type") || "application/octet-stream";
  const buf = Buffer.from(await resp.arrayBuffer());
  return { buffer: buf, contentType };
}

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", gif: "image/gif", webp: "image/webp",
};

export function buildStoragePath(filename, scope = "products") {
  const ext = filename && filename.includes(".") ? filename.split(".").pop().toLowerCase() : "bin";
  return `${APP_NAME}/${scope}/${uuid()}.${ext}`;
}

export function contentTypeForFile(filename) {
  if (!filename) return "application/octet-stream";
  const ext = filename.split(".").pop().toLowerCase();
  return MIME[ext] || "application/octet-stream";
}
