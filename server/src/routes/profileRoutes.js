import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyProfile,
  upsertMyProfile,
  discoverCreators,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, upsertMyProfile);
router.get("/discover", protect, discoverCreators);

export default router;
