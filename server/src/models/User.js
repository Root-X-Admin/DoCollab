import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // optional username (we enforce requirement in controllers / frontend)
    username: {
      type: String,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      // required only for local accounts, not for pure Google accounts
      required: [
        function () {
          return this.authProvider === "local";
        },
        "Password is required",
      ],
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "",
    },

    // auth provider info
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null,
    },

    // OTP-based password reset
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before save (your original style, extended)
userSchema.pre("save", async function () {
  // only hash if password was modified or new AND exists
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // for google-only accounts
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
