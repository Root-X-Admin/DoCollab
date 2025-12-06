// server/src/controllers/authController.js

import dotenv from "dotenv";
dotenv.config();   // ← ADD THIS HERE. REQUIRED IN ESM PROJECTS.

import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from env");
}

const jwtSecret = process.env.JWT_SECRET;

const googleClientId = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(googleClientId);

const generateToken = (id) =>
  jwt.sign({ id }, jwtSecret, { expiresIn: "7d" });

// ====================
// Register (local)
// POST /api/auth/register
// body: { name, email, username?, password }
// ====================
export const registerUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "User with this email exists" });
    }

    // derive username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      const base = email.split("@")[0];
      finalUsername = base;
      let counter = 1;
      // ensure unique username
      // eslint-disable-next-line no-await-in-loop
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${base}${counter}`;
        counter += 1;
      }
    } else {
      const existingUsername = await User.findOne({ username: finalUsername });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const user = await User.create({
      name,
      email,
      username: finalUsername,
      password,
      authProvider: "local",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================
// Login (local)
// POST /api/auth/login
// body: { email, password }
// ====================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // if account is Google-only
    if (user.authProvider === "google" && !user.password) {
      return res
        .status(400)
        .json({ message: "This account uses Google login. Use Google instead." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================
// Google auth
// POST /api/auth/google
// body: { idToken }
// ====================
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google account has no email associated" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // create username from email
      const baseUsername = email.split("@")[0];
      let username = baseUsername;
      let counter = 1;
      // ensure username unique
      // eslint-disable-next-line no-await-in-loop
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter += 1;
      }

      user = await User.create({
        name: name || baseUsername,
        email,
        username,
        avatar: picture || "",
        authProvider: "google",
        googleId,
      });
    } else {
      // link Google info if not already
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      if (user.authProvider !== "google") {
        user.authProvider = "google";
      }
      await user.save();
    }

    const token = generateToken(user._id);

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    return res.status(500).json({ message: "Failed to login with Google" });
  }
};

// ====================
// Get current user
// GET /api/auth/me
// @access Private
// ====================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name username email avatar authProvider"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    console.error("Get me error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================
// Forgot password – send OTP
// POST /api/auth/forgot-password
// body: { email }
// ====================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists
      return res.json({
        message: "If that email exists, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const text = `Your DoCollab password reset OTP is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can ignore this email.`;

    await sendEmail({
      to: user.email,
      subject: "DoCollab Password Reset OTP",
      text,
    });

    return res.json({
      message:
        "If that email exists, an OTP has been sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================
// Reset password with OTP
// POST /api/auth/reset-password
// body: { email, otp, newPassword }
// ====================
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const now = new Date();
    if (
      user.resetOtp !== otp ||
      user.resetOtpExpires.getTime() < now.getTime()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ====================
// Logout
// POST /api/auth/logout
// (Optional; front-end also clears localStorage)
// ====================
export const logoutUser = async (req, res) => {
  return res.json({ message: "Logged out" });
};
