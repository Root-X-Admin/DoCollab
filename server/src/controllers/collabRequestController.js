import CollabRequest from "../models/CollabRequest.js";
import CreatorProfile from "../models/CreatorProfile.js";
import User from "../models/User.js";

// Active states that block duplicates
const ACTIVE_STATUSES = ["pending", "accepted"];

// @desc    Create collab request
// @route   POST /api/collab
// @access  Private
export const createCollabRequest = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { toUserId, title, message, idea, platforms } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "toUserId is required" });
    }

    if (String(toUserId) === String(fromUserId)) {
      return res
        .status(400)
        .json({ message: "You cannot send a collab request to yourself" });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // 🔒 Check for existing active collab between these two users
    const existing = await CollabRequest.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId },
      ],
      status: { $in: ACTIVE_STATUSES }, // pending or accepted
    });

    if (existing) {
      if (existing.status === "pending") {
        const iAmSender = String(existing.fromUser) === String(fromUserId);

        if (iAmSender) {
          return res.status(400).json({
            message:
              "You already have a pending collab request with this creator.",
            existing,
          });
        } else {
          return res.status(400).json({
            message:
              "This creator has already requested a collab. Check your Collab Requests tab.",
            existing,
          });
        }
      }

      if (existing.status === "accepted") {
        return res.status(400).json({
          message:
            "You are already collaborators. You can chat from the Messages tab.",
          existing,
        });
      }
    }

    const fromProfile = await CreatorProfile.findOne({ user: fromUserId });
    const toProfile = await CreatorProfile.findOne({ user: toUserId });

    const request = await CollabRequest.create({
      fromUser: fromUserId,
      toUser: toUserId,
      fromProfile: fromProfile?._id,
      toProfile: toProfile?._id,
      title: title || "",
      message: message || "",
      idea: idea || "",
      platforms:
        Array.isArray(platforms) && platforms.length > 0 ? platforms : [],
      status: "pending",
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
      .sort({ updatedAt: -1 });

    const received = await CollabRequest.find({ toUser: userId })
      .populate("fromUser", "name email")
      .sort({ updatedAt: -1 });

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

// @desc    Update collab request status (accept / reject / cancel / end)
// @route   PATCH /api/collab/:id/status
// @access  Private
export const updateCollabStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status, reason } = req.body;

    // NOTE: we added "ended" to support removing collaborators
    const allowedStatuses = [
      "pending",
      "accepted",
      "rejected",
      "cancelled",
      "ended",
    ];
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

    // Accept / reject → only receiver, and only if currently pending
    if (status === "accepted" || status === "rejected") {
      if (!isToUser) {
        return res
          .status(403)
          .json({ message: "Only the recipient can accept or reject" });
      }
      if (request.status !== "pending") {
        return res
          .status(400)
          .json({ message: "This collab request is no longer pending" });
      }
    }

    // Cancel → only sender, and only while pending
    if (status === "cancelled") {
      if (!isFromUser) {
        return res
          .status(403)
          .json({ message: "Only the sender can cancel" });
      }
      if (request.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Only pending requests can be cancelled" });
      }
    }

    // End collaboration → either side, but only if currently accepted
    if (status === "ended") {
      if (request.status !== "accepted") {
        return res.status(400).json({
          message: "Only active collaborators can be ended",
        });
      }
      // isFromUser or isToUser is already true here
    }

    request.status = status;
    if (typeof reason === "string" && reason.trim()) {
      request.reason = reason.trim();
    }

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
