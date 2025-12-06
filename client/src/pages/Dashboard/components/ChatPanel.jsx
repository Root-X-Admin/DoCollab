import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import { uploadMedia } from "../../../lib/uploadMedia";

const EMOJIS = ["😀", "😁", "😂", "🤣", "😊", "😍", "😎", "🤝", "🔥", "💻", "📈", "🎬"];

// Same base URL as api.js
const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function ChatPanel({ collabId }) {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [collab, setCollab] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const isMine = (msg) => me && msg.fromUser?.email === me.email;

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [meRes, collabRes, msgsRes] = await Promise.all([
        api.get("/auth/me"),
        api.get(`/collab/${collabId}`),
        api.get(`/chat/${collabId}`),
      ]);

      setMe(meRes.data);
      setCollab(collabRes.data);
      setMessages(msgsRes.data.messages || []);
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err) {
      console.error("Chat load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    try {
      const res = await api.get(`/chat/${collabId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Polling messages error:", err.message);
    }
  };

  useEffect(() => {
    loadInitial();

    pollRef.current = setInterval(() => {
      refreshMessages();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabId]);

  const handleSendText = async () => {
    if (!input.trim()) return;
    setSending(true);
    setEmojiOpen(false);

    const textToSend = input.trim();
    setInput("");

    try {
      const res = await api.post(`/chat/${collabId}`, {
        type: "text",
        text: textToSend,
      });

      setMessages((prev) => [...prev, res.data]);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Send text error:", err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && input.trim()) {
        handleSendText();
      }
    }
  };

  const handleFilePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadError("");

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File upto 100MB are allowed.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      fromUser: me,
      type: "file",
      text: "",
      mediaUrl: null,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      uploading: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const uploaded = await uploadMedia(file);

      let finalType = "file";
      if (uploaded.kind === "image") finalType = "image";
      else if (uploaded.kind === "video") finalType = "video";

      const payload = {
        type: finalType,
        text: "",
        mediaUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        cloudinaryId: uploaded.cloudinaryId,
      };

      const res = await api.post(`/chat/${collabId}`, payload);

      setMessages((prev) =>
        prev
          .filter((m) => m._id !== tempId)
          .concat(res.data)
      );
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Upload/send media error:", err.message);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setUploadError(
        err.response?.data?.message ||
          "Failed to upload file. Please try again."
      );
    }
  };

  const handleInputFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const addEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
  };

  if (loading || !me || !collab) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-400">
        Loading chat...
      </div>
    );
  }

  const other =
    collab.fromUser?.email === me.email ? collab.toUser : collab.fromUser;

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderMessageContent = (msg) => {
    if (msg.type === "image" && msg.mediaUrl) {
      return (
        <div className="space-y-1">
          <img
            src={msg.mediaUrl}
            alt={msg.fileName || "Image"}
            className="rounded-xl max-h-64 object-cover"
          />
          {msg.fileName && (
            <p className="text-[10px] text-slate-200 mt-1">{msg.fileName}</p>
          )}
        </div>
      );
    }

    if (msg.type === "video" && msg.mediaUrl) {
      return (
        <div className="space-y-1">
          <video src={msg.mediaUrl} controls className="rounded-xl max-h-64" />
          {msg.fileName && (
            <p className="text-[10px] text-slate-200 mt-1">{msg.fileName}</p>
          )}
        </div>
      );
    }

    if (msg.type === "file" && msg.mediaUrl) {
      const sizeMB =
        msg.fileSize ? (msg.fileSize / (1024 * 1024)).toFixed(1) : null;

      // Use backend download proxy so filename + extension are correct
      const downloadUrl = `${API_BASE}/chat/download/${msg._id}`;

      return (
        <div className="space-y-1">
          <a
            href={downloadUrl}
            className="block px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs hover:bg-black/60"
          >
            <p className="font-medium text-slate-50 truncate">
              {msg.fileName || "File"}
            </p>
            <p className="text-[10px] text-slate-400">
              {msg.mimeType || "file"} {sizeMB ? `• ${sizeMB} MB` : ""}
            </p>
          </a>
          {msg.text && (
            <p className="text-[11px] text-slate-100 whitespace-pre-wrap mt-1">
              {msg.text}
            </p>
          )}
        </div>
      );
    }

    return (
      <p className="text-[11px] text-slate-100 whitespace-pre-wrap">
        {msg.text}
      </p>
    );
  };

  return (
    <div
      className={`flex flex-col h-full rounded-2xl bg-white/5 border border-white/10 p-3 relative ${
        dragActive ? "ring-2 ring-brand-500/60" : ""
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl">
          <div className="px-4 py-3 rounded-xl border border-dashed border-brand-400 bg-black/60 text-xs text-slate-100">
            Drop file here to send (max 100MB)
          </div>
        </div>
      )}

      {/* Header with remove collaborator */}
      <div className="pb-3 border-b border-white/10 mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {other?.name || "Creator"}
          </p>
          <p className="text-[11px] text-slate-400">
            {other?.email} • {collab.title || "Collaboration via DoCollab"}
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const ok = window.confirm(
              "Remove this collaborator? You both will lose chat access until a new collab request is accepted."
            );
            if (!ok) return;

            try {
              await api.patch(`/collab/${collab._id}/status`, {
                status: "ended",
              });
              navigate("/app/messages");
            } catch (err) {
              console.error("Remove collaborator error:", err.message);
              alert(
                err.response?.data?.message ||
                  "Failed to remove collaborator. Please try again."
              );
            }
          }}
          className="text-[10px] px-3 py-1 rounded-full bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20"
        >
          Remove collaborator
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-slate-500">
            No messages yet. Say hi and plan your first collab!
          </div>
        ) : (
          messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <div
                key={msg._id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-2xl mb-1 ${
                    mine
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-black/70 text-slate-100 border border:white/10 rounded-bl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-[10px] text-slate-400 mb-0.5">
                      {msg.fromUser?.name || "Creator"}
                    </p>
                  )}

                  {msg.uploading ? (
                    <p className="text-[11px] italic text-slate-200">
                      Uploading...
                    </p>
                  ) : (
                    renderMessageContent(msg)
                  )}

                  {!msg.uploading && (
                    <p className="mt-1 text-[9px] text-right text-slate-300/80">
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-1">
          {uploadError}
        </div>
      )}

      {/* 7-day warning */}
      <p className="mt-2 text-[10px] text-slate-500">
        Attachments are stored for <span className="font-semibold">7 days</span>{" "}
        and then auto-deleted to save space. Please download anything you need
        to keep.
      </p>

      {/* Input area */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items:end gap-2 text-xs relative">
        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
          >
            <span className="text-lg">😊</span>
          </button>
          {emojiOpen && (
            <div className="absolute bottom-10 left-0 z-20 w-44 rounded-2xl bg-black/80 border border-white/15 p-2 grid grid-cols-6 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="text-lg hover:bg-white/10 rounded-md"
                  onClick={() => addEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File input hidden */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleInputFileChange}
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={handleFilePick}
          className="h-8 px-3 rounded-full bg-white/5 border border-white/10 text-[11px] hover:bg-white/10"
        >
          Attach
        </button>

        {/* Textarea */}
        <div className="flex-1">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl bg-black/60 border border-white/15 px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          disabled={sending || !input.trim()}
          onClick={handleSendText}
          className="h-8 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-[11px] font-medium text-white shadow-lg shadow-brand-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
