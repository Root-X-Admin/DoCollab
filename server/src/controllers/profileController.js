// server/src/controllers/profileController.js

import CreatorProfile from "../models/CreatorProfile.js";
import User from "../models/User.js";

// ============================
// GET /api/profile/me
// Return: { user, profile }
// ============================
export const getMyProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email username avatar authProvider"
    );

    if (!profile) {
      // no profile yet – still return user info
      return res.json({
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          username: req.user.username,
          avatar: req.user.avatar,
          authProvider: req.user.authProvider,
        },
        profile: null,
      });
    }

    return res.json({
      user: profile.user,
      profile,
    });
  } catch (err) {
    console.error("Get my profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// PUT /api/profile/me
// Create or update my profile
// Body: profile fields
// Return: { user, profile }
// ============================
export const updateMyProfile = async (req, res) => {
  try {
    const {
      headline,
      bio,
      niches,
      primaryPlatform,
      mainHandle,
      location,
      languages,
      audienceRange,
      collabGoals,
      openToCollab,
      // 🔹 new fields
      bannerUrl,
      avatarUrl,
      links,
      tags,
    } = req.body;

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };

    const safeLinks = {
      youtube: links?.youtube || "",
      instagram: links?.instagram || "",
      tiktok: links?.tiktok || "",
      twitter: links?.twitter || "",
      website: links?.website || "",
    };

    const payload = {
      user: req.user._id,
      headline: headline || "",
      bio: bio || "",
      niches: toArray(niches),
      primaryPlatform: primaryPlatform || "",
      mainHandle: mainHandle || "",
      location: location || "",
      languages: toArray(languages),
      audienceRange: audienceRange || "",
      collabGoals: toArray(collabGoals),
      openToCollab:
        typeof openToCollab === "boolean" ? openToCollab : true,
      openToCollabs:
        typeof openToCollab === "boolean" ? openToCollab : true,
      bannerUrl: bannerUrl || "",
      links: safeLinks,
      tags: toArray(tags),
    };

    const profile = await CreatorProfile.findOneAndUpdate(
      { user: req.user._id },
      payload,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email username avatar authProvider");

    // 🔹 If a new avatarUrl came from the client, sync it to the User model
    if (avatarUrl) {
      await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
      profile.user.avatar = avatarUrl;
    }

    return res.json({
      user: profile.user,
      profile,
    });
  } catch (err) {
    console.error("Update (upsert) profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// Helper: similarity scoring
// ============================
const overlapScore = (arr1 = [], arr2 = []) => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2) || !arr1.length || !arr2.length)
    return 0;

  const set2 = new Set(arr2.map((v) => String(v).toLowerCase()));
  let common = 0;
  arr1.forEach((v) => {
    if (set2.has(String(v).toLowerCase())) common += 1;
  });

  const maxLen = Math.max(arr1.length, arr2.length);
  return maxLen === 0 ? 0 : common / maxLen; // 0–1
};

const audienceDistance = (a, b) => {
  if (!a || !b) return 1; // far
  if (a === b) return 0; // perfect
  const order = ["0 - 1K", "1K - 10K", "10K - 50K", "50K - 100K", "100K+"];
  const idxA = order.indexOf(a);
  const idxB = order.indexOf(b);
  if (idxA === -1 || idxB === -1) return 1;
  return Math.min(1, Math.abs(idxA - idxB) / (order.length - 1));
};

// ============================
// GET /api/profile/discover
// Query: ?limit=20&niche=...&language=...&location=...
// Return: { creators: [CreatorProfileWithScore] }
// ============================
export const discoverCreators = async (req, res) => {
  try {
    const meProfile = await CreatorProfile.findOne({ user: req.user._id });

    if (!meProfile) {
      return res.status(400).json({
        message:
          "Please complete your creator profile first so we can match you accurately.",
      });
    }

    const { niche, language, location, limit = 20 } = req.query;

    const query = {
      openToCollab: true,
      user: { $ne: req.user._id },
    };

    if (niche) {
      query.niches = niche;
    }
    if (language) {
      query.languages = language;
    }
    if (location) {
      query.location = location;
    }

    const candidates = await CreatorProfile.find(query)
      .populate("user", "name email username avatar")
      .limit(Number(limit));

    // Weights for scoring (sum = 100)
    const WEIGHTS = {
      niches: 40,
      languages: 20,
      audience: 20,
      location: 10,
      goals: 10,
    };

    const computeCompatibility = (me, other) => {
      let score = 0;

      const meNiches = me.niches || [];
      const otherNiches = other.niches || [];
      const meLangs = me.languages || [];
      const otherLangs = other.languages || [];
      const meGoals = me.collabGoals || [];
      const otherGoals = other.collabGoals || [];

      // 1) Niche overlap
      score += overlapScore(meNiches, otherNiches) * WEIGHTS.niches;

      // 2) Language overlap
      score += overlapScore(meLangs, otherLangs) * WEIGHTS.languages;

      // 3) Audience range similarity
      const dist = audienceDistance(me.audienceRange, other.audienceRange); // 0–1
      const audienceSim = 1 - dist;
      score += audienceSim * WEIGHTS.audience;

      // 4) Same location
      if (
        me.location &&
        other.location &&
        me.location.toLowerCase() === other.location.toLowerCase()
      ) {
        score += WEIGHTS.location;
      }

      // 5) Collab goals overlap
      score += overlapScore(meGoals, otherGoals) * WEIGHTS.goals;

      if (score < 0) score = 0;
      if (score > 100) score = 100;

      return Math.round(score);
    };

    const creatorsWithScore = candidates
      .map((doc) => {
        const obj = doc.toObject();
        obj.compatibilityScore = computeCompatibility(meProfile, doc);
        return obj;
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({ creators: creatorsWithScore });
  } catch (err) {
    console.error("Discover creators error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET /api/profile/user/:userId
// View another creator's profile
// Return: { user, profile }
// ============================
export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "_id name username email avatar"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile = await CreatorProfile.findOne({ user: userId });
    if (!profile) {
      // allow empty profile view (new user)
      profile = await CreatorProfile.create({ user: userId });
    }

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
      },
      profile,
    });
  } catch (err) {
    console.error("Get profile by userId error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
