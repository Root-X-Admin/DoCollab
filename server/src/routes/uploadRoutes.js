import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { uploadMedia } from "../controllers/uploadController.js";

const router = express.Router();

// Multer in-memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // allow all file types
    cb(null, true);
  },
});

// Custom middleware to catch multer errors
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);

      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File upto 100MB are allowed." });
      }

      return res.status(500).json({
        message: "Upload failed",
        error: err.message || "Unknown upload error",
      });
    }
    next();
  });
};

// POST /api/upload/media
router.post("/media", protect, handleUpload, uploadMedia);

export default router;
