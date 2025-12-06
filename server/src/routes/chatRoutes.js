import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMessagesForCollab,
  sendMessageInCollab,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/:collabId", protect, getMessagesForCollab);
router.post("/:collabId", protect, sendMessageInCollab);

export default router;
