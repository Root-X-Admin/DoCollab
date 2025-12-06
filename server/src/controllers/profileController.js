import CreatorProfile from "../models/CreatorProfile.js";

// @desc    Get my profile + user info
// @route   GET /api/profile/me
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    const profile = await CreatorProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );

    if (!profile) {
      return res.json({
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        profile: null,
      });
    }

    return res.json({
      user: profile.user,
      profile,
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create or update my profile
// @route   PUT /api/profile/me
// @access  Private
export const upsertMyProfile = async (req, res) => {
  try {
    const {
      bio,
      niches,
      primaryPlatform,
      mainHandle,
      location,
      languages,
      audienceRange,
      collabGoals,
      openToCollab,
    } = req.body;

    const payload = {
      user: req.user._id,
      bio: bio || "",
      niches: Array.isArray(niches) ? niches : [],
      primaryPlatform: primaryPlatform || "",
      mainHandle: mainHandle || "",
      location: location || "",
      languages: Array.isArray(languages) ? languages : [],
      audienceRange: audienceRange || "",
      collabGoals: Array.isArray(collabGoals) ? collabGoals : [],
      openToCollab: typeof openToCollab === "boolean" ? openToCollab : true,
    };

    const profile = await CreatorProfile.findOneAndUpdate(
      { user: req.user._id },
      payload,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email");

    return res.json({
      user: profile.user,
      profile,
    });
  } catch (err) {
    console.error("Upsert profile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper: compute overlap ratio
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

// @desc    Discover creators with compatibility scoring
// @route   GET /api/profile/discover
// @access  Private
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
      .populate("user", "name email")
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

      // Normalize arrays
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

      // 3) Audience range similarity (distance -> similarity)
      const dist = audienceDistance(me.audienceRange, other.audienceRange); // 0–1
      const audienceSim = 1 - dist;
      score += audienceSim * WEIGHTS.audience;

      // 4) Same location (rough match)
      if (
        me.location &&
        other.location &&
        me.location.toLowerCase() === other.location.toLowerCase()
      ) {
        score += WEIGHTS.location;
      }

      // 5) Collab goals overlap
      score += overlapScore(meGoals, otherGoals) * WEIGHTS.goals;

      // Clamp and round
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
