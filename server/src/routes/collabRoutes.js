import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCollabRequest,
  getMyRequests,
  updateCollabStatus,
  getCollabById,
} from "../controllers/collabRequestController.js";

const router = express.Router();

router.post("/", protect, createCollabRequest);
router.get("/my", protect, getMyRequests);
router.get("/:id", protect, getCollabById);
router.patch("/:id/status", protect, updateCollabStatus);

export default router;
