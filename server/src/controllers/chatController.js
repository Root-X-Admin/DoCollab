// server/src/controllers/chatController.js

import https from "https";
import ChatMessage from "../models/ChatMessage.js";
import CollabRequest from "../models/CollabRequest.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

// ==========================
// Helper: ensure collab access
// ==========================
const ensureCollabAccess = async (collabId, userId) => {
  const collab = await CollabRequest.findById(collabId)
    .populate("fromUser", "name email")
    .populate("toUser", "name email");

  if (!collab) {
    throw new Error("NOT_FOUND");
  }

  const isFromUser = String(collab.fromUser._id) === String(userId);
  const isToUser = String(collab.toUser._id) === String(userId);

  if (!isFromUser && !isToUser) {
    throw new Error("FORBIDDEN");
  }

  if (collab.status !== "accepted") {
    throw new Error("NOT_ACCEPTED");
  }

  return collab;
};

// ==========================
// Get messages for a collab
// @route   GET /api/chat/:id
// @access  Private
// ==========================
export const getMessages = async (req, res) => {
  try {
    const { id: collabId } = req.params;
    const userId = req.user._id;

    // Ensure user is part of collab + collab accepted
    await ensureCollabAccess(collabId, userId);

    const messages = await ChatMessage.find({ collab: collabId })
      .populate("fromUser", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("Get messages error:", err.message);

    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Collaboration not found" });
    }
    if (err.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not part of this collaboration" });
    }
    if (err.message === "NOT_ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Collab must be accepted to chat" });
    }

    return res.status(500).json({ message: "Failed to load messages" });
  }
};

// ==========================
// Send a message (text / media / file)
// @route   POST /api/chat/:id
// @access  Private
// ==========================
export const sendMessage = async (req, res) => {
  try {
    const { id: collabId } = req.params;
    const userId = req.user._id;

    let {
      type,
      text,
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      cloudinaryId, // store public_id for cleanup
    } = req.body;

    // Ensure user is part of collab + collab accepted
    const collab = await ensureCollabAccess(collabId, userId);

    // Normalize values
    text = text || "";
    mediaUrl = mediaUrl || null;
    fileName = fileName || null;
    fileSize = fileSize ? Number(fileSize) : null;
    mimeType = mimeType || null;
    cloudinaryId = cloudinaryId || null;

    // Default type logic:
    // - if explicit type given, use it
    // - else if we have mediaUrl, assume "file"
    // - else "text"
    if (!type) {
      type = mediaUrl ? "file" : "text";
    }

    // Validate file size (if provided)
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return res
        .status(400)
        .json({ message: "Files up to 100MB are allowed" });
    }

    // For pure text messages, require non-empty text
    if (type === "text" && !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await ChatMessage.create({
      collab: collab._id,
      fromUser: userId,
      type,
      text: text.trim(),
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      cloudinaryId,
    });

    const populated = await message.populate("fromUser", "name email");

    return res.status(201).json(populated);
  } catch (err) {
    console.error("Send message error:", err.message);

    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Collaboration not found" });
    }
    if (err.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not part of this collaboration" });
    }
    if (err.message === "NOT_ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Collab must be accepted to chat" });
    }

    return res.status(500).json({ message: "Failed to send message" });
  }
};

// ==========================
// Download attachment via backend (proxy)
// @route   GET /api/chat/download/:messageId
// @access  Private
// ==========================
export const downloadAttachment = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const msg = await ChatMessage.findById(messageId);
    if (!msg || !msg.mediaUrl) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Ensure user has access to the collab this message belongs to
    await ensureCollabAccess(msg.collab, userId);

    const url = msg.mediaUrl;
    const fileName = msg.fileName || "attachment";
    const mimeType = msg.mimeType || "application/octet-stream";

    // Set headers so browser uses right filename + extension
    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    https
      .get(url, (fileRes) => {
        fileRes.pipe(res);
      })
      .on("error", (err) => {
        console.error("Download proxy error:", err.message);
        if (!res.headersSent) {
          res.status(500).end("Failed to download file");
        } else {
          res.end();
        }
      });
  } catch (err) {
    console.error("Download attachment error:", err.message);

    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Collaboration not found" });
    }
    if (err.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not part of this collaboration" });
    }
    if (err.message === "NOT_ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Collab must be accepted to chat" });
    }

    return res.status(500).json({ message: "Failed to download attachment" });
  }
};
