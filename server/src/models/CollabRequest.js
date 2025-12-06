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
      enum: ["pending", "accepted", "rejected", "cancelled"],
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
    idea: {
      type: String,
      default: "",
    },
    platforms: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

const CollabRequest = mongoose.model("CollabRequest", collabRequestSchema);

export default CollabRequest;
