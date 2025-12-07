// client/src/pages/Dashboard/ProfilePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";

const TOKEN_KEY = "docollab_token";

function initialsFromName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function ProfilePage() {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [data, setData] = useState({ user: null, profile: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    headline: "",
    bio: "",
    niche: "",
    location: "",
    language: "",
    audienceMin: "",
    audienceMax: "",
    platforms: "",
    tags: "",
    bannerUrl: "",
    avatarUrl: "",
    youtube: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    website: "",
    openToCollabs: true,
    collabPreferences: "",
  });

  const isSelfProfile = useMemo(() => {
    if (!routeUserId) return true; // /app/profile
    if (!me) return false;
    return String(me._id) === String(routeUserId);
  }, [routeUserId, me]);

  // Load /auth/me once
  useEffect(() => {
    const loadMe = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          navigate("/login");
          return;
        }
        const res = await api.get("/auth/me");
        setMe(res.data);
      } catch (err) {
        console.error("Get me error:", err);
        localStorage.removeItem(TOKEN_KEY);
        navigate("/login");
      }
    };

    loadMe();
  }, [navigate]);

  // Load profile (mine or other user)
  useEffect(() => {
    const loadProfile = async () => {
      if (!me && !routeUserId) return; // wait until we know who we are
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        let endpoint;
        if (!routeUserId || (me && String(routeUserId) === String(me._id))) {
          endpoint = "/profile/me";
        } else {
          endpoint = `/profile/user/${routeUserId}`;
        }

        const res = await api.get(endpoint);
        const { user, profile } = res.data || {};

        setData({ user, profile });

        const links = profile?.links || {};

        setForm({
          headline: profile?.headline || "",
          bio: profile?.bio || "",
          niche: profile?.niche || "",
          location: profile?.location || "",
          language: profile?.language || "",
          audienceMin: profile?.audienceMin || "",
          audienceMax: profile?.audienceMax || "",
          platforms: Array.isArray(profile?.platforms)
            ? profile.platforms.join(", ")
            : "",
          tags: Array.isArray(profile?.tags) ? profile.tags.join(", ") : "",
          bannerUrl: profile?.bannerUrl || "",
          avatarUrl: user?.avatar || "",
          youtube: links.youtube || "",
          instagram: links.instagram || "",
          tiktok: links.tiktok || "",
          twitter: links.twitter || "",
          website: links.website || "",
          openToCollabs:
            typeof profile?.openToCollabs === "boolean"
              ? profile.openToCollabs
              : typeof profile?.openToCollab === "boolean"
              ? profile.openToCollab
              : true,
          collabPreferences: profile?.collabPreferences || "",
        });
      } catch (err) {
        console.error("Load profile error:", err);
        setError(
          err.response?.data?.message || "Failed to load creator profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [me, routeUserId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBannerUpload = async (e) => {
    if (!isSelfProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url || res.data?.secure_url;
      if (!url) throw new Error("No URL returned from upload");

      setForm((prev) => ({ ...prev, bannerUrl: url }));
      setSuccess("Banner uploaded. Remember to save your profile.");
    } catch (err) {
      console.error("Banner upload error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to upload banner. Please try again."
      );
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleAvatarUpload = async (e) => {
    if (!isSelfProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url || res.data?.secure_url;
      if (!url) throw new Error("No URL returned from upload");

      setForm((prev) => ({ ...prev, avatarUrl: url }));
      setSuccess("Profile picture uploaded. Remember to save your profile.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to upload profile picture. Please try again."
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!isSelfProfile) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        headline: form.headline,
        bio: form.bio,
        niche: form.niche,
        location: form.location,
        language: form.language,
        audienceMin: form.audienceMin ? Number(form.audienceMin) : 0,
        audienceMax: form.audienceMax ? Number(form.audienceMax) : 0,
        platforms: form.platforms
          ? form.platforms
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        bannerUrl: form.bannerUrl || "",
        avatarUrl: form.avatarUrl || "",
        links: {
          youtube: form.youtube,
          instagram: form.instagram,
          tiktok: form.tiktok,
          twitter: form.twitter,
          website: form.website,
        },
        openToCollabs: !!form.openToCollabs,
        collabPreferences: form.collabPreferences,
      };

      const res = await api.put("/profile/me", payload);
      const { user, profile } = res.data || {};
      setData({ user, profile });
      setSuccess("Profile updated successfully.");
      setEditMode(false);
    } catch (err) {
      console.error("Save profile error:", err);
      setError(
        err.response?.data?.message || "Failed to save profile. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const { user, profile } = data;

  // ✅ allow profile to be null (new users)
  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="text-sm text-slate-400 animate-pulse">
          Loading profile…
        </div>
      </div>
    );
  }

  // ✅ safe fallback so UI doesn't crash when profile is null
  const profileSafe = profile || {};

  const userInitials = initialsFromName(user.name || user.username || "");
  const audienceText =
    profileSafe.audienceMin || profileSafe.audienceMax
      ? `${profileSafe.audienceMin || 0} – ${profileSafe.audienceMax || 0}`
      : "Not specified";

  const avatarToShow = form.avatarUrl || user.avatar || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Top: back nav for other profiles */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Back
          </button>
          {isSelfProfile && (
            <span className="text-[11px] text-slate-500">
              This is your public creator profile
            </span>
          )}
        </div>

        {/* Banner + main card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-32 md:h-40 bg-gradient-to-r from-brand-500/40 via-emerald-500/20 to-sky-500/30">
            {form.bannerUrl && (
              <img
                src={form.bannerUrl}
                alt=""
                className="w-full h-full object-cover opacity-80"
              />
            )}

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/40" />

            {isSelfProfile && (
              <div className="absolute top-3 right-3 flex gap-2">
                <label className="text-[11px] px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-slate-100 cursor-pointer hover:bg-black/60 transition">
                  {uploadingBanner ? "Uploading..." : "Change cover"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Avatar + basic info */}
          <div className="px-5 md:px-8 pb-6 md:pb-8 -mt-9 md:-mt-10 relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex gap-4">
                <div className="relative">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-xl font-semibold shadow-lg shadow-black/40 overflow-hidden">
                    {avatarToShow ? (
                      <img
                        src={avatarToShow}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>

                  {isSelfProfile && (
                    <label className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-brand-500 border border-black flex items-center justify-center text-[10px] cursor-pointer hover:bg-brand-600 transition">
                      ⬆
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  )}
                </div>

                <div className="pt-3">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                    {user.name}
                  </h1>
                  {user.username && (
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  )}
                  <p className="mt-1 text-xs md:text-sm text-slate-300">
                    {profileSafe.headline ||
                      profileSafe.niche ||
                      "Creator on DoCollab"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    {profileSafe.location && <span>{profileSafe.location}</span>}
                    {profileSafe.language && (
                      <>
                        <span>•</span>
                        <span>{profileSafe.language}</span>
                      </>
                    )}
                    {profileSafe.niche && (
                      <>
                        <span>•</span>
                        <span>{profileSafe.niche}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pb-1">
                {isSelfProfile ? (
                  <>
                    <button
                      onClick={() => setEditMode((v) => !v)}
                      className="px-4 py-2 rounded-full border border-brand-400/70 bg-brand-500/10 hover:bg-brand-500/20 text-xs md:text-sm font-medium text-brand-100 transition"
                    >
                      {editMode ? "Cancel edit" : "Edit profile"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigate("/app/requests");
                      }}
                      className="px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-xs md:text-sm font-medium text-white shadow-md shadow-brand-500/40 transition"
                    >
                      Request collaboration
                    </button>
                    <button
                      onClick={() => {
                        navigate("/app/messages");
                      }}
                      className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-xs md:text-sm text-slate-100 transition"
                    >
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error / success display */}
        {error && (
          <div className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
            {success}
          </div>
        )}

        {/* Grid: About + Sidebar */}
        <div className="mt-6 grid md:grid-cols-[2fr_1fr] gap-5 md:gap-6">
          {/* Left column */}
          <div className="space-y-5 md:space-y-6">
            {/* About */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <h2 className="text-sm font-semibold mb-2">About</h2>
              {profileSafe.bio ? (
                <p className="text-xs md:text-sm text-slate-200 whitespace-pre-line">
                  {profileSafe.bio}
                </p>
              ) : isSelfProfile ? (
                <p className="text-xs text-slate-400">
                  Add a short bio about who you are, what you create, and what
                  kind of collaborations you’re looking for.
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  This creator hasn’t added a bio yet.
                </p>
              )}
            </section>

            {/* Collaboration preferences */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Collaboration</h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] border ${
                    profileSafe.openToCollabs || profileSafe.openToCollab
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-700/40 text-slate-300 border-slate-500/40"
                  }`}
                >
                  {profileSafe.openToCollabs || profileSafe.openToCollab
                    ? "Open to collaborations"
                    : "Not currently open"}
                </span>
              </div>

              {profileSafe.collabPreferences ? (
                <p className="text-xs md:text-sm text-slate-200 whitespace-pre-line">
                  {profileSafe.collabPreferences}
                </p>
              ) : isSelfProfile ? (
                <p className="text-xs text-slate-400">
                  Describe what kind of collaborations you’re interested in
                  (formats, frequency, platforms, audience match, etc.).
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  This creator hasn’t added specific collaboration preferences
                  yet.
                </p>
              )}
            </section>

            {/* Platforms & links */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
              <h2 className="text-sm font-semibold">Platforms & Links</h2>

              <div className="flex flex-wrap gap-2 text-[11px]">
                {Array.isArray(profileSafe.platforms) &&
                profileSafe.platforms.length > 0 ? (
                  profileSafe.platforms.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200"
                    >
                      {p}
                    </span>
                  ))
                ) : isSelfProfile ? (
                  <span className="text-xs text-slate-400">
                    Add the platforms where you create (YouTube, Instagram,
                    etc.).
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    No platforms listed yet.
                  </span>
                )}
              </div>

              <div className="h-px bg-white/10 my-2" />

              <div className="flex flex-col gap-1 text-xs">
                {profileSafe.links?.youtube && (
                  <a
                    href={profileSafe.links.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:text-brand-200"
                  >
                    YouTube
                  </a>
                )}
                {profileSafe.links?.instagram && (
                  <a
                    href={profileSafe.links.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:text-brand-200"
                  >
                    Instagram
                  </a>
                )}
                {profileSafe.links?.tiktok && (
                  <a
                    href={profileSafe.links.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:text-brand-200"
                  >
                    TikTok
                  </a>
                )}
                {profileSafe.links?.twitter && (
                  <a
                    href={profileSafe.links.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:text-brand-200"
                  >
                    Twitter / X
                  </a>
                )}
                {profileSafe.links?.website && (
                  <a
                    href={profileSafe.links.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:text-brand-200"
                  >
                    Website / Portfolio
                  </a>
                )}

                {!profileSafe.links ||
                  (Object.values(profileSafe.links || {}).every((v) => !v) &&
                    isSelfProfile && (
                      <p className="text-xs text-slate-400">
                        Add links to your main channels so collaborators can
                        quickly check your work.
                      </p>
                    ))}
              </div>
            </section>
          </div>

          {/* Right column – stats + tags + edit entry point */}
          <div className="space-y-5 md:space-y-6">
            {/* Audience & basics */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
              <h2 className="text-sm font-semibold">Creator snapshot</h2>
              <div className="space-y-2 text-[11px] md:text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Audience range</span>
                  <span>{audienceText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary niche</span>
                  <span>{profileSafe.niche || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Language</span>
                  <span>{profileSafe.language || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span>{profileSafe.location || "Not set"}</span>
                </div>
              </div>
            </section>

            {/* Tags / specialties */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
              <h2 className="text-sm font-semibold">Topics & specialties</h2>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(profileSafe.tags) &&
                profileSafe.tags.length > 0 ? (
                  profileSafe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[11px] text-emerald-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : isSelfProfile ? (
                  <p className="text-xs text-slate-400">
                    Add a few keywords that describe your content (e.g. “Web
                    dev”, “Cybersecurity”, “Short-form”, “Live coding”).
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    No specialties listed yet.
                  </p>
                )}
              </div>
            </section>

            {/* Small edit card (only button) */}
            {isSelfProfile && (
              <section className="rounded-2xl border border-brand-500/40 bg-brand-500/5 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Edit profile</h2>
                  <span className="text-[10px] text-slate-400">
                    Open the full editor to update your details
                  </span>
                </div>

                <button
                  onClick={() => setEditMode(true)}
                  className="w-full text-xs py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-md shadow-brand-500/30 transition"
                >
                  Start editing
                </button>
              </section>
            )}
          </div>
        </div>

        {/* WIDE CENTERED EDIT CARD */}
        {isSelfProfile && editMode && (
          <section className="mt-6 max-w-3xl mx-auto rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Edit your creator profile
              </h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mb-3 text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-[12px]">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    name="headline"
                    value={form.headline}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. Cybersecurity educator & bug bounty hunter"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Describe who you are, what you create, and who you want to collaborate with."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Niche
                  </label>
                  <input
                    type="text"
                    name="niche"
                    value={form.niche}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. Cybersecurity, Devrel"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. English, Hindi"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Audience min
                  </label>
                  <input
                    type="number"
                    name="audienceMin"
                    value={form.audienceMin}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Audience max
                  </label>
                  <input
                    type="number"
                    name="audienceMax"
                    value={form.audienceMax}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Platforms (comma-separated)
                </label>
                <input
                  type="text"
                  name="platforms"
                  value={form.platforms}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="YouTube, Instagram, Twitch"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Topics / specialties (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Web dev, Bug bounty, Linux, OSINT"
                />
              </div>

              {/* Links */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    name="youtube"
                    value={form.youtube}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    name="tiktok"
                    value={form.tiktok}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="https://www.tiktok.com/@yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={form.twitter}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Website / portfolio
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="https://your-site.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Collaboration preferences
                </label>
                <textarea
                  name="collabPreferences"
                  value={form.collabPreferences}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none text-xs text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Prefer long-term series, cross-posting on YT + IG, audience 5k–100k, English/Hindi only."
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <label className="flex items-center gap-2 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    id="openToCollabs"
                    name="openToCollabs"
                    checked={form.openToCollabs}
                    onChange={handleChange}
                    className="h-3 w-3 rounded border border-white/20 bg-black/40"
                  />
                  I&apos;m open to collaboration requests
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-1.5 rounded-full text-[11px] bg-white/5 border border-white/15 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-full text-[11px] bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
