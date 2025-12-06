// server/src/routes/chatRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMessages,
  sendMessage,
  downloadAttachment,
} from "../controllers/chatController.js";

const router = express.Router();

// Download attachment with nice filename
router.get("/download/:messageId", protect, downloadAttachment);

// Get messages for a collab
router.get("/:id", protect, getMessages);

// Send message
router.post("/:id", protect, sendMessage);

export default router;
