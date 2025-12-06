// server/src/models/CreatorProfile.js
import mongoose from "mongoose";

const creatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // 🔹 Top-of-profile (like LinkedIn)
    headline: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Niche / content type
    // New single-niche field used by new APIs / UI
    niche: {
      type: String,
      default: "",
      trim: true,
    },
    // Your original multiple niches (kept for compatibility)
    niches: [
      {
        type: String,
        trim: true,
      },
    ],
    // New flexible content types (e.g. Shorts, Live streams, Long-form)
    contentTypes: [
      {
        type: String,
        trim: true,
      },
    ],

    // 🔹 Platforms / handles
    primaryPlatform: {
      type: String,
      default: "",
      trim: true,
    },
    mainHandle: {
      type: String,
      default: "",
      trim: true,
    },
    // New list of platforms (e.g. ["YouTube", "Instagram"])
    platforms: [
      {
        type: String,
        trim: true,
      },
    ],

    // 🔹 Location & language
    location: {
      type: String,
      default: "",
      trim: true,
    },
    // New single language field (used by discover)
    language: {
      type: String,
      default: "",
      trim: true,
    },
    // Your original languages array (kept)
    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    // 🔹 Audience
    // New numeric range for more structured filters
    audienceMin: {
      type: Number,
      default: 0,
    },
    audienceMax: {
      type: Number,
      default: 0,
    },
    // Your original string-based range (kept)
    audienceRange: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Collab goals / preferences
    // Your original collab goals list
    collabGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    // New free-text field used in LinkedIn-style "Collaboration" section
    collabPreferences: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Collab availability
    // New field used by new UI
    openToCollabs: {
      type: Boolean,
      default: true,
    },
    // Original field (kept & defaulted the same)
    openToCollab: {
      type: Boolean,
      default: true,
    },

    // 🔹 Trust / meta
    trustScore: {
      type: Number,
      default: 4.5,
    },

    // 🔹 Visuals
    bannerUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Links / socials
    links: {
      youtube: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      tiktok: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
      website: { type: String, default: "", trim: true },
    },

    // 🔹 Tags / skills / topics
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// ✅ Modern pre-save hook: NO `next` argument, NO `next()` call
creatorProfileSchema.pre("save", function () {
  if (this.openToCollabs === undefined && this.openToCollab !== undefined) {
    this.openToCollabs = this.openToCollab;
  }
  if (this.openToCollab === undefined && this.openToCollabs !== undefined) {
    this.openToCollab = this.openToCollabs;
  }
});

const CreatorProfile = mongoose.model("CreatorProfile", creatorProfileSchema);

export default CreatorProfile;
