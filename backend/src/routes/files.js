import express from "express";
import { getDb } from "../db.js";
import { getObject } from "../services/storageService.js";

const router = express.Router();

router.get("/:path(*)", async (req, res, next) => {
  try {
    const path = req.params.path;
    const record = await getDb().collection("files").findOne({ storage_path: path, is_deleted: false });
    if (!record) return res.status(404).json({ detail: "File not found" });
    const { buffer, contentType } = await getObject(path);
    res.setHeader("Content-Type", record.content_type || contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

export default router;
