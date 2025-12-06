// server/src/routes/collabRoutes.js

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCollabRequest,
  getMyRequests,
  getCollabById,
  updateCollabStatus,
} from "../controllers/collabRequestController.js";

const router = express.Router();

// Send collab request
router.post("/", protect, createCollabRequest);

// Get my collab requests (sent + received)
router.get("/my", protect, getMyRequests);

// Get single collab (used by chat, detail view, etc.)
router.get("/:id", protect, getCollabById);

// Update status: "pending" | "accepted" | "rejected" | "cancelled" | "ended"
router.patch("/:id/status", protect, updateCollabStatus);

export default router;
