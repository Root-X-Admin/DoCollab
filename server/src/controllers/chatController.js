import ChatMessage from "../models/ChatMessage.js";
import CollabRequest from "../models/CollabRequest.js";

// Helper: ensure user belongs to collab and collab is accepted
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

// @desc    Get messages for a collab request
// @route   GET /api/chat/:collabId
// @access  Private
export const getMessagesForCollab = async (req, res) => {
  try {
    const { collabId } = req.params;
    const userId = req.user._id;

    await ensureCollabAccess(collabId, userId);

    const messages = await ChatMessage.find({ collabRequest: collabId })
      .populate("fromUser", "name email")
      .sort({ createdAt: 1 });

    return res.json({ messages });
  } catch (err) {
    console.error("Get chat messages error:", err.message);

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

    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Send message in collab chat
// @route   POST /api/chat/:collabId
// @access  Private
export const sendMessageInCollab = async (req, res) => {
  try {
    const { collabId } = req.params;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const collab = await ensureCollabAccess(collabId, userId);

    const isFromUser = String(collab.fromUser._id) === String(userId);
    const toUserId = isFromUser ? collab.toUser._id : collab.fromUser._id;

    const message = await ChatMessage.create({
      collabRequest: collabId,
      fromUser: userId,
      toUser: toUserId,
      text: text.trim(),
    });

    await message.populate({ path: "fromUser", select: "name email" });

    return res.status(201).json(message);
  } catch (err) {
    console.error("Send chat message error:", err.message);

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

    return res.status(500).json({ message: "Server error" });
  }
};
