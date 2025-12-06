import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

function DiscoverPage() {
  const [filters, setFilters] = useState({
    niche: "",
    language: "",
    location: "",
  });
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [profileWarning, setProfileWarning] = useState("");

  const [requestingFor, setRequestingFor] = useState(null);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestIdea, setRequestIdea] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState("");

  const fetchCreators = async (options = {}) => {
    const params = new URLSearchParams();

    if (options.niche) params.append("niche", options.niche);
    if (options.language) params.append("language", options.language);
    if (options.location) params.append("location", options.location);
    params.append("limit", "20");

    try {
      setError("");
      setProfileWarning("");
      const res = await api.get(`/profile/discover?${params.toString()}`);
      setCreators(res.data.creators || []);
    } catch (err) {
      console.error("Discover error:", err.message);

      if (err.response?.status === 400) {
        setProfileWarning(
          err.response.data?.message ||
            "Please complete your creator profile first to get matches."
        );
        setCreators([]);
      } else {
        setError("Failed to load creators. Please try again.");
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchCreators({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearching(true);
    fetchCreators(filters);
  };

  const openRequestForm = (profileId, creatorName) => {
    setRequestingFor(profileId);
    setRequestTitle(`Collab idea with ${creatorName}`);
    setRequestMessage("Hey! I’d love to collaborate with you via DoCollab.");
    setRequestIdea(
      "Quick idea: we could create a small series / joint video and cross-promote across our channels."
    );
    setRequestFeedback("");
  };

  const sendRequest = async (e, profile) => {
    e.preventDefault();
    if (!profile?.user?._id) return;

    setRequestLoading(true);
    setRequestFeedback("");

    try {
      await api.post("/collab", {
        toUserId: profile.user._id,
        title: requestTitle,
        message: requestMessage,
        idea: requestIdea,
        platforms: profile.primaryPlatform ? [profile.primaryPlatform] : [],
      });

      setRequestFeedback("Collab request sent! 🎉");
      setRequestingFor(null);
      setRequestTitle("");
      setRequestMessage("");
      setRequestIdea("");
    } catch (err) {
      console.error("Send collab error:", err.message);
      setRequestFeedback(
        err.response?.data?.message ||
          "Failed to send request. Please try again."
      );
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Discover creators</h1>
      <p className="text-sm text-slate-400 mb-4">
        These are creators who are open to collaboration. We rank them by how
        well they match your niche, languages, audience range, and goals.
      </p>

      {profileWarning && (
        <div className="mb-4 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/40 rounded-xl px-3 py-2">
          {profileWarning}{" "}
          <Link
            to="/app/profile"
            className="underline text-amber-100 font-medium"
          >
            Go to My Profile
          </Link>
          .
        </div>
      )}

      <form
        className="mb-5 grid md:grid-cols-[1.2fr,1.2fr,1.2fr,auto] gap-3 items-end"
        onSubmit={handleSearch}
      >
        <div>
          <label className="block text-[11px] text-slate-300 mb-1">
            Niche
          </label>
          <input
            type="text"
            name="niche"
            value={filters.niche}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="e.g. Cybersecurity"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-300 mb-1">
            Language
          </label>
          <input
            type="text"
            name="language"
            value={filters.language}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="e.g. English"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-300 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="City, Country"
          />
        </div>

        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-medium text-white shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {requestFeedback && (
        <div className="mb-4 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2 inline-block">
          {requestFeedback}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading creators...</div>
      ) : error ? (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2 inline-block">
          {error}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-sm text-slate-400">
          No creators found yet. Try adjusting your filters or updating your
          profile.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {creators.map((profile) => {
            const user = profile.user || {};
            const isActive = requestingFor === profile._id;
            const score =
              typeof profile.compatibilityScore === "number"
                ? profile.compatibilityScore
                : null;

            return (
              <div
                key={profile._id}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {user.name || "Creator"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {profile.primaryPlatform || "Creator"} •{" "}
                        {profile.mainHandle || user.email}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {score !== null && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-brand-500/15 text-brand-200 border border-brand-500/40">
                          {score}% match
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                        Open to collab
                      </span>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-xs text-slate-300 mb-2 line-clamp-3">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    {profile.niches?.slice(0, 3).map((niche) => (
                      <span
                        key={niche}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-200"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{profile.location || "Location not set"}</span>
                    <span>{profile.audienceRange || "Audience: N/A"}</span>
                  </div>

                  {profile.collabGoals?.length > 0 && (
                    <p className="mt-2 text-[11px] text-slate-400">
                      Goals: {profile.collabGoals.join(" • ")}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  {!isActive ? (
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          openRequestForm(profile._id, user.name || "creator")
                        }
                        className="text-[11px] px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition"
                      >
                        Send collab request
                      </button>
                    </div>
                  ) : (
                    <form
                      className="mt-2 space-y-2 text-[11px]"
                      onSubmit={(e) => sendRequest(e, profile)}
                    >
                      <input
                        type="text"
                        value={requestTitle}
                        onChange={(e) => setRequestTitle(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/15 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        placeholder="Short collab title"
                      />
                      <input
                        type="text"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/15 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        placeholder="Short intro message"
                      />
                      <textarea
                        rows={3}
                        value={requestIdea}
                        onChange={(e) => setRequestIdea(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/15 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                        placeholder="Briefly describe your collab idea, content type, and how you'd cross-promote."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRequestingFor(null)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={requestLoading}
                          className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-[11px] font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {requestLoading ? "Sending..." : "Send request"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DiscoverPage;
