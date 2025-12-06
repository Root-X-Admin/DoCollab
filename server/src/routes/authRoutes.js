import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  googleAuth,
  forgotPassword,
  resetPasswordWithOtp,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

router.get("/me", protect, getMe);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithOtp);

router.post("/logout", logoutUser);

export default router;
