import CollabRequest from "../models/CollabRequest.js";
import CreatorProfile from "../models/CreatorProfile.js";
import User from "../models/User.js";

// @desc    Create collab request
// @route   POST /api/collab
// @access  Private
export const createCollabRequest = async (req, res) => {
  try {
    const { toUserId, title, message, idea, platforms } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "toUserId is required" });
    }

    if (toUserId === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot send a collab request to yourself" });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const fromProfile = await CreatorProfile.findOne({ user: req.user._id });
    const toProfile = await CreatorProfile.findOne({ user: toUserId });

    const request = await CollabRequest.create({
      fromUser: req.user._id,
      toUser: toUserId,
      fromProfile: fromProfile?._id,
      toProfile: toProfile?._id,
      title: title || "",
      message: message || "",
      idea: idea || "",
      platforms:
        Array.isArray(platforms) && platforms.length > 0 ? platforms : [],
    });

    await request.populate([
      { path: "fromUser", select: "name email" },
      { path: "toUser", select: "name email" },
    ]);

    return res.status(201).json(request);
  } catch (err) {
    console.error("Create collab request error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get my collab requests (sent & received)
// @route   GET /api/collab/my
// @access  Private
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const sent = await CollabRequest.find({ fromUser: userId })
      .populate("toUser", "name email")
      .sort({ createdAt: -1 });

    const received = await CollabRequest.find({ toUser: userId })
      .populate("fromUser", "name email")
      .sort({ createdAt: -1 });

    return res.json({ sent, received });
  } catch (err) {
    console.error("Get my collab requests error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single collab request (for chat, etc.)
// @route   GET /api/collab/:id
// @access  Private
export const getCollabById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const request = await CollabRequest.findById(id)
      .populate("fromUser", "name email")
      .populate("toUser", "name email");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isFromUser = String(request.fromUser._id) === String(userId);
    const isToUser = String(request.toUser._id) === String(userId);

    if (!isFromUser && !isToUser) {
      return res
        .status(403)
        .json({ message: "You are not allowed to view this request" });
    }

    return res.json(request);
  } catch (err) {
    console.error("Get collab by id error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update collab request status
// @route   PATCH /api/collab/:id/status
// @access  Private
export const updateCollabStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "accepted", "rejected", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await CollabRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isFromUser = String(request.fromUser) === String(userId);
    const isToUser = String(request.toUser) === String(userId);

    if (!isFromUser && !isToUser) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this request" });
    }

    if (status === "accepted" || status === "rejected") {
      if (!isToUser) {
        return res
          .status(403)
          .json({ message: "Only the recipient can accept or reject" });
      }
    }

    if (status === "cancelled") {
      if (!isFromUser) {
        return res
          .status(403)
          .json({ message: "Only the sender can cancel" });
      }
    }

    request.status = status;
    await request.save();

    await request.populate([
      { path: "fromUser", select: "name email" },
      { path: "toUser", select: "name email" },
    ]);

    return res.json(request);
  } catch (err) {
    console.error("Update collab status error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
