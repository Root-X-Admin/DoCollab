import mongoose from "mongoose";

const collabRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // link to creator profiles (keep from your original)
    fromProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorProfile",
    },
    toProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatorProfile",
    },

    status: {
      type: String,
      // added "ended" to your existing enum
      enum: ["pending", "accepted", "rejected", "cancelled", "ended"],
      default: "pending",
    },

    title: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },

    // your original "idea" field
    idea: {
      type: String,
      default: "",
    },

    // your original platforms array
    platforms: [
      {
        type: String,
        trim: true,
      },
    ],

    // optional reason for rejection / ending (new, safe to have)
    reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const CollabRequest = mongoose.model("CollabRequest", collabRequestSchema);

export default CollabRequest;
