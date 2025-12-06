// server/src/routes/profileRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyProfile,
  updateMyProfile,
  discoverCreators,
  getProfileByUserId,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

router.get("/discover", protect, discoverCreators);

// view another creator’s profile by userId
router.get("/user/:userId", protect, getProfileByUserId);

export default router;
