import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    collab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollabRequest",
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type: text / image / video / file
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },

    // Text content (may be empty for pure media)
    text: {
      type: String,
      default: "",
    },

    // Media / file info
    mediaUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null, // bytes
    },
    mimeType: {
      type: String,
      default: null,
    },

    // Cloudinary public ID so we can delete later
    cloudinaryId: {
      type: String,
      default: null,
    },

    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
