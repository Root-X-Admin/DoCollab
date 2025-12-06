import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import SlideOver from "../../components/ui/SlideOver";

function RequestsPage() {
  const navigate = useNavigate();

  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [detailType, setDetailType] = useState(null); // "sent" | "received"

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.get("/collab/my");
      setSent(res.data.sent || []);
      setReceived(res.data.received || []);
    } catch (err) {
      console.error("Load collab requests error:", err.message);
      setError("Failed to load collab requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      await api.patch(`/collab/${id}/status`, { status });
      setMessage("Request updated.");
      await loadRequests();
    } catch (err) {
      console.error("Update collab status error:", err.message);
      setError(
        err.response?.data?.message || "Failed to update request status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const openDetail = (req, type) => {
    setDetailRequest(req);
    setDetailType(type);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailRequest(null);
    setDetailType(null);
  };

  const handleDetailAction = async (status) => {
    if (!detailRequest) return;
    await updateStatus(detailRequest._id, status);
    setDetailOpen(false);
  };

  const goToChat = (id) => {
    navigate(`/app/chat/${id}`);
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString();
  };

  const statusBadgeClass = (status) => {
    const base = "px-2 py-0.5 rounded-full text-[10px] border";
    switch (status) {
      case "accepted":
        return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/40`;
      case "rejected":
        return `${base} bg-red-500/10 text-red-300 border-red-500/40`;
      case "cancelled":
        return `${base} bg-slate-600/20 text-slate-300 border-slate-500/40`;
      default:
        return `${base} bg-brand-500/10 text-brand-300 border-brand-500/40`;
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Collab requests</h1>
      <p className="text-sm text-slate-400 mb-4">
        Keep track of collaborations you’ve sent and received. Accept, reject,
        or cancel requests as needed. Once accepted, you can chat with the
        creator directly.
      </p>

      {message && (
        <div className="mb-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2 inline-block">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2 inline-block">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading requests...</div>
      ) : (
        <>
          {/* Received */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Received requests
              </h2>
              <span className="text-[11px] text-slate-500">
                {received.length} total
              </span>
            </div>

            {received.length === 0 ? (
              <div className="text-xs text-slate-500">
                No one has requested a collab yet.
              </div>
            ) : (
              <div className="space-y-3">
                {received.map((req) => (
                  <div
                    key={req._id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 text-xs flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-slate-200 font-medium">
                          {req.fromUser?.name || "Creator"}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {req.fromUser?.email}
                        </p>
                      </div>
                      <span className={statusBadgeClass(req.status)}>
                        {req.status}
                      </span>
                    </div>

                    {req.title && (
                      <p className="text-slate-200 text-[11px] mt-1">
                        {req.title}
                      </p>
                    )}

                    {req.message && (
                      <p className="text-slate-300 line-clamp-2">
                        <span className="text-slate-400">Intro:</span>{" "}
                        {req.message}
                      </p>
                    )}

                    {req.idea && (
                      <p className="text-slate-300 line-clamp-2">
                        <span className="text-slate-400">Idea:</span>{" "}
                        {req.idea}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-slate-500">
                        Received: {formatDate(req.createdAt)}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(req, "received")}
                          className="px-3 py-1 rounded-xl bg-white/5 text-[11px] text-slate-100 border border-white/15"
                        >
                          View details
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              disabled={updatingId === req._id}
                              onClick={() =>
                                updateStatus(req._id, "accepted")
                              }
                              className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              disabled={updatingId === req._id}
                              onClick={() =>
                                updateStatus(req._id, "rejected")
                              }
                              className="px-3 py-1 rounded-xl bg-red-500/10 text-red-200 border border-red-500/40 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {req.status === "accepted" && (
                          <button
                            onClick={() => goToChat(req._id)}
                            className="px-3 py-1 rounded-xl bg-brand-500/20 text-brand-200 border border-brand-500/40 text-[11px]"
                          >
                            Open chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sent */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-200">
                Sent requests
              </h2>
              <span className="text-[11px] text-slate-500">
                {sent.length} total
              </span>
            </div>

            {sent.length === 0 ? (
              <div className="text-xs text-slate-500">
                You haven’t sent any collab requests yet. Try discovering
                creators and sending your first one.
              </div>
            ) : (
              <div className="space-y-3">
                {sent.map((req) => (
                  <div
                    key={req._id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-4 text-xs flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-slate-200 font-medium">
                          {req.toUser?.name || "Creator"}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {req.toUser?.email}
                        </p>
                      </div>
                      <span className={statusBadgeClass(req.status)}>
                        {req.status}
                      </span>
                    </div>

                    {req.title && (
                      <p className="text-slate-200 text-[11px] mt-1">
                        {req.title}
                      </p>
                    )}

                    {req.message && (
                      <p className="text-slate-300 line-clamp-2">
                        <span className="text-slate-400">Intro:</span>{" "}
                        {req.message}
                      </p>
                    )}

                    {req.idea && (
                      <p className="text-slate-300 line-clamp-2">
                        <span className="text-slate-400">Idea:</span>{" "}
                        {req.idea}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-slate-500">
                        Sent: {formatDate(req.createdAt)}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(req, "sent")}
                          className="px-3 py-1 rounded-xl bg-white/5 text-[11px] text-slate-100 border border-white/15"
                        >
                          View details
                        </button>

                        {req.status === "pending" && (
                          <button
                            disabled={updatingId === req._id}
                            onClick={() =>
                              updateStatus(req._id, "cancelled")
                            }
                            className="px-3 py-1 rounded-xl bg-slate-600/30 text-slate-100 border border-slate-500/50 disabled:opacity-50"
                          >
                            Cancel request
                          </button>
                        )}

                        {req.status === "accepted" && (
                          <button
                            onClick={() => goToChat(req._id)}
                            className="px-3 py-1 rounded-xl bg-brand-500/20 text-brand-200 border border-brand-500/40 text-[11px]"
                          >
                            Open chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Slide-over for request details */}
      <SlideOver
        open={detailOpen}
        onClose={closeDetail}
        title={
          detailType === "received"
            ? "Received collaboration request"
            : "Sent collaboration request"
        }
      >
        {!detailRequest ? (
          <div className="text-xs text-slate-400">
            No request selected.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {detailType === "received"
                    ? detailRequest.fromUser?.name || "Creator"
                    : detailRequest.toUser?.name || "Creator"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {detailType === "received"
                    ? detailRequest.fromUser?.email
                    : detailRequest.toUser?.email}
                </p>
              </div>
              <span className={statusBadgeClass(detailRequest.status)}>
                {detailRequest.status}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {detailRequest.title && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Title
                  </p>
                  <p className="text-slate-100">
                    {detailRequest.title}
                  </p>
                </div>
              )}

              {detailRequest.message && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Intro message
                  </p>
                  <p>{detailRequest.message}</p>
                </div>
              )}

              {detailRequest.idea && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Collab idea
                  </p>
                  <p>{detailRequest.idea}</p>
                </div>
              )}

              {detailRequest.platforms &&
                detailRequest.platforms.length > 0 && (
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">
                      Platforms
                    </p>
                    <p>{detailRequest.platforms.join(", ")}</p>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  <p className="mb-0.5">Created</p>
                  <p className="text-slate-200">
                    {formatDate(detailRequest.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5">Last updated</p>
                  <p className="text-slate-200">
                    {formatDate(detailRequest.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Manage this request
              </p>

              {detailRequest.status === "pending" && (
                <div className="flex gap-2">
                  {detailType === "received" ? (
                    <>
                      <button
                        disabled={updatingId === detailRequest._id}
                        onClick={() => handleDetailAction("accepted")}
                        className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[11px] disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        disabled={updatingId === detailRequest._id}
                        onClick={() => handleDetailAction("rejected")}
                        className="px-3 py-1 rounded-xl bg-red-500/10 text-red-200 border border-red-500/40 text-[11px] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={updatingId === detailRequest._id}
                      onClick={() => handleDetailAction("cancelled")}
                      className="px-3 py-1 rounded-xl bg-slate-600/30 text-slate-100 border border-slate-500/50 text-[11px] disabled:opacity-50"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              )}

              {detailRequest.status === "accepted" && (
                <button
                  onClick={() => {
                    closeDetail();
                    goToChat(detailRequest._id);
                  }}
                  className="px-3 py-1 rounded-xl bg-brand-500/20 text-brand-200 border border-brand-500/40 text-[11px]"
                >
                  Open chat
                </button>
              )}
            </div>
          </>
        )}
      </SlideOver>
    </div>
  );
}

export default RequestsPage;
