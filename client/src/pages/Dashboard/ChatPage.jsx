import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";

function ChatPage() {
  const { id } = useParams(); // collabRequest id
  const navigate = useNavigate();

  const [collab, setCollab] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingCollab, setLoadingCollab] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState(null); // quick way to detect "me"

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const loadCollab = async () => {
    try {
      setLoadingCollab(true);
      setError("");

      const [collabRes, meRes] = await Promise.all([
        api.get(`/collab/${id}`),
        api.get("/auth/me"),
      ]);

      setCollab(collabRes.data);
      setUserEmail(meRes.data.email);
    } catch (err) {
      console.error("Load collab error:", err.message);
      setError(
        err.response?.data?.message || "Failed to load collaboration."
      );
      if (err.response?.status === 404 || err.response?.status === 403) {
        // Navigate back to requests if invalid
        navigate("/app/requests");
      }
    } finally {
      setLoadingCollab(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Load messages error:", err.message);
      // Error already handled via collab if needed
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadCollab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!collab) return;
    loadMessages();

    // simple polling every 5s
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSending(true);
    try {
      const res = await api.post(`/chat/${id}`, { text: input });

      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Send message error:", err.message);
      setError(
        err.response?.data?.message || "Failed to send message. Try again."
      );
    } finally {
      setSending(false);
    }
  };

  const isMine = (msg) =>
    userEmail && msg.fromUser?.email && msg.fromUser.email === userEmail;

  if (loadingCollab) {
    return (
      <div className="text-sm text-slate-400">Loading collaboration...</div>
    );
  }

  if (!collab) {
    return (
      <div className="text-sm text-slate-400">
        Collaboration not found or you don’t have access.
      </div>
    );
  }

  const otherUser =
    userEmail && collab.fromUser?.email === userEmail
      ? collab.toUser
      : collab.fromUser;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Chat with {otherUser?.name || "Creator"}
          </p>
          <p className="text-[11px] text-slate-400">
            {otherUser?.email} •{" "}
            {collab.title || "Collaboration via DoCollab"}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/requests")}
          className="text-[11px] text-slate-400 hover:text-slate-100"
        >
          Back to requests
        </button>
      </div>

      {error && (
        <div className="mb-2 text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2 inline-block">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2 text-xs">
          {loadingMessages ? (
            <div className="text-slate-400 text-xs">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-slate-500 text-xs">
              No messages yet. Say hi and share your first collab idea!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  isMine(msg) ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 mb-1 ${
                    isMine(msg)
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-black/50 text-slate-100 border border-white/10 rounded-bl-sm"
                  }`}
                >
                  {!isMine(msg) && (
                    <p className="text-[10px] text-slate-400 mb-0.5">
                      {msg.fromUser?.name || "Creator"}
                    </p>
                  )}
                  <p className="text-[11px] whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="mt-3 flex items-center gap-2 text-xs"
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-[11px] font-medium text-white shadow-lg shadow-brand-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
