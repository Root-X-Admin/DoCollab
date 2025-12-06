import React, { useEffect, useState } from "react";
import api from "../../lib/api";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    bio: "",
    niches: "",
    primaryPlatform: "",
    mainHandle: "",
    location: "",
    languages: "",
    audienceRange: "",
    collabGoals: "",
    openToCollab: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const platforms = [
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitch",
    "Twitter/X",
    "LinkedIn",
    "Podcast",
    "Other",
  ];

  const audienceRanges = [
    "0 - 1K",
    "1K - 10K",
    "10K - 50K",
    "50K - 100K",
    "100K+",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        const { user: userData, profile } = res.data;
        setUser(userData);

        if (profile) {
          setForm({
            bio: profile.bio || "",
            niches: (profile.niches || []).join(", "),
            primaryPlatform: profile.primaryPlatform || "",
            mainHandle: profile.mainHandle || "",
            location: profile.location || "",
            languages: (profile.languages || []).join(", "),
            audienceRange: profile.audienceRange || "",
            collabGoals: (profile.collabGoals || []).join(", "),
            openToCollab:
              typeof profile.openToCollab === "boolean"
                ? profile.openToCollab
                : true,
          });
        }
      } catch (err) {
        console.error("Profile fetch error:", err.message);
        setError("Failed to load profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const splitToArray = (value) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        bio: form.bio,
        niches: splitToArray(form.niches),
        primaryPlatform: form.primaryPlatform,
        mainHandle: form.mainHandle,
        location: form.location,
        languages: splitToArray(form.languages),
        audienceRange: form.audienceRange,
        collabGoals: splitToArray(form.collabGoals),
        openToCollab: form.openToCollab,
      };

      await api.put("/profile/me", payload);
      setMessage("Profile saved successfully.");
    } catch (err) {
      console.error("Profile save error:", err.message);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-400">Loading your profile...</div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-2">My creator profile</h1>
      <p className="text-sm text-slate-400 mb-6">
        This profile helps DoCollab match you with creators who share your
        niche, audience, and collaboration goals.
      </p>

      {user && (
        <div className="mb-4 text-xs text-slate-300">
          Logged in as{" "}
          <span className="font-medium">
            {user.name} ({user.email})
          </span>
        </div>
      )}

      {message && (
        <div className="mb-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs text-slate-300 mb-1">
            Short bio
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Tell collaborators who you are, what you create, and what kind of collabs you’re looking for."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Primary niche(s)
            </label>
            <input
              type="text"
              name="niches"
              value={form.niches}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Web Dev, Cybersecurity, Productivity"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Separate multiple niches with commas.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Primary platform
            </label>
            <select
              name="primaryPlatform"
              value={form.primaryPlatform}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Main handle / channel name
            </label>
            <input
              type="text"
              name="mainHandle"
              value={form.mainHandle}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="@terminalord / TechWithAyush"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Audience size range
            </label>
            <select
              name="audienceRange"
              value={form.audienceRange}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Prefer not to say</option>
              {audienceRanges.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="City, Country"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Languages you create in
            </label>
            <input
              type="text"
              name="languages"
              value={form.languages}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. English, Hindi"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Separate multiple languages with commas.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-300 mb-1">
            Collaboration goals
          </label>
          <input
            type="text"
            name="collabGoals"
            value={form.collabGoals}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="e.g. Cross-promo, series collab, audience swap, joint live"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Separate multiple goals with commas.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              name="openToCollab"
              checked={form.openToCollab}
              onChange={handleChange}
              className="h-4 w-4 rounded border border-white/20 bg-black/40"
            />
            Open to new collaborations
          </label>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-medium text-white shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
