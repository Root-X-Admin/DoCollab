import mongoose from "mongoose";

const creatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: "",
    },
    niches: [
      {
        type: String,
        trim: true,
      },
    ],
    primaryPlatform: {
      type: String,
      default: "",
    },
    mainHandle: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    audienceRange: {
      type: String,
      default: "",
    },
    collabGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    openToCollab: {
      type: Boolean,
      default: true,
    },
    trustScore: {
      type: Number,
      default: 4.5,
    },
  },
  { timestamps: true }
);

const CreatorProfile = mongoose.model("CreatorProfile", creatorProfileSchema);

export default CreatorProfile;
