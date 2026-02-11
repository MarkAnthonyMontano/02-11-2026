const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { db } = require("../database/database");

const router = express.Router();

// Create uploads directory if it doesn't exist
const signatureDir = path.join(__dirname, "uploads", "signature");
if (!fs.existsSync(signatureDir)) fs.mkdirSync(signatureDir, { recursive: true });

// Multer storage setup
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, signatureDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `signature_${Date.now()}${ext}`);
  },
});
const uploadSignature = multer({ storage: signatureStorage });

// ================= GET LATEST SIGNATURE =================
router.get("/latest", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT full_name, signature_image
       FROM signature_table
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (!rows.length) return res.json({ success: false });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= GET BY FULL NAME =================
router.get("/:fullName", async (req, res) => {
  try {
    const { fullName } = req.params;

    const [rows] = await db.query(
      `SELECT full_name, signature_image
       FROM signature_table
       WHERE full_name = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [fullName]
    );

    if (!rows.length) return res.json({ success: false });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= POST NEW SIGNATURE =================
router.post(
  "/",
  uploadSignature.single("signature"),
  async (req, res) => {
    try {
      const { full_name } = req.body;

      if (!full_name || !req.file) {
        return res.json({ success: false });
      }

      const signaturePath = `signature/${req.file.filename}`;

      await db.query(
        "INSERT INTO signature_table (full_name, signature_image) VALUES (?, ?)",
        [full_name, signaturePath]
      );

      res.json({
        success: true,
        data: {
          full_name,
          signature_image: signaturePath,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  }
);

module.exports = router;
