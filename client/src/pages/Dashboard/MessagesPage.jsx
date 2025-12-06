import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import ChatPanel from "./components/ChatPanel";

function MessagesPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // selected collab id
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);

  const load = async () => {
    try {
      const meRes = await api.get("/auth/me");
      setUser(meRes.data);

      const reqRes = await api.get("/collab/my");

      const accepted = [
        ...reqRes.data.sent.filter((c) => c.status === "accepted"),
        ...reqRes.data.received.filter((c) => c.status === "accepted"),
      ];

      // Deduplicate by pair (same two users => single conversation)
      const map = new Map();

      accepted.forEach((c) => {
        const meId = meRes.data._id;
        const otherId =
          String(c.fromUser?._id || c.fromUser) === String(meId)
            ? String(c.toUser?._id || c.toUser)
            : String(c.fromUser?._id || c.fromUser);

        // key is sorted pair of user IDs
        const key =
          String(meId) < otherId
            ? `${meId}_${otherId}`
            : `${otherId}_${meId}`;

        const existing = map.get(key);
        if (!existing) {
          map.set(key, c);
        } else {
          // keep the most recently updated collab (in case old data exists)
          const prevTime = new Date(existing.updatedAt).getTime();
          const curTime = new Date(c.updatedAt).getTime();
          if (curTime > prevTime) {
            map.set(key, c);
          }
        }
      });

      const uniqueConvs = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setConversations(uniqueConvs);
    } catch (err) {
      console.log("Messages load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openChat = (collabId) => {
    navigate(`/app/messages/${collabId}`);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-xs text-slate-400">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* LEFT COLUMN — chat list */}
      <div className="w-72 bg-black/30 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <p className="text-sm font-semibold text-slate-200">Messages</p>
          <p className="text-[11px] text-slate-500">
            Your active collaborators
          </p>
        </div>

        <div className="flex-1 overflow-y-auto text-xs">
          {conversations.length === 0 ? (
            <p className="text-slate-500 p-4">
              No active collaborators yet. Accept a collab request or send one
              from Discover.
            </p>
          ) : (
            conversations.map((c) => {
              const meId = user._id;
              const from = c.fromUser;
              const to = c.toUser;
              const other =
                String(from._id || from) === String(meId) ? to : from;

              return (
                <button
                  key={c._id}
                  onClick={() => openChat(c._id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 ${
                    c._id === id ? "bg-white/10" : ""
                  }`}
                >
                  <p className="text-slate-200 text-sm font-medium">
                    {other.name}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate">
                    {other.email}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">
                    Status: Collaborating
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — chat box */}
      <div className="flex-1 bg-slate-950 p-4">
        {!id ? (
          <div className="text-slate-500 h-full flex items-center justify-center text-sm">
            Select a collaborator to start chatting.
          </div>
        ) : (
          <ChatPanel collabId={id} />
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
