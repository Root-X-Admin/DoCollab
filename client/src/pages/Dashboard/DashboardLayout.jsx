import React, { useEffect, useState } from "react";
import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import DiscoverPage from "./DiscoverPage";
import ProfilePage from "./ProfilePage";
import RequestsPage from "./RequestsPage";
import ChatPage from "./ChatPage";
import api from "../../lib/api";
import MessagesPage from "./MessagesPage";

const navItems = [
  { path: "/app/discover", label: "Discover" },
  { path: "/app/requests", label: "Collab Requests" },
  { path: "/app/messages", label: "Messages" },   // ← NEW
  { path: "/app/profile", label: "My Profile" },
];


function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      navigate("/login");
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-sm text-slate-400">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 border-r border-white/10 bg-black/40">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-brand-500/30 flex items-center justify-center text-xs font-semibold">
              DC
            </div>
            <div>
              <p className="text-sm font-semibold">DoCollab</p>
              <p className="text-[11px] text-slate-400">Creator dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl transition ${
                  isActive
                    ? "bg-brand-500/20 text-brand-200 border border-brand-500/40"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 text-[11px] text-slate-500 border-t border-white/10">
          {user ? (
            <>
              Logged in as{" "}
              <span className="text-slate-300">
                {user.name || user.email}
              </span>
            </>
          ) : (
            "Not logged in"
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-black/30 backdrop-blur">
          <p className="text-xs md:text-sm text-slate-300">
            Welcome to your collaboration hub
          </p>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:inline text-xs text-slate-400">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:id" element={<MessagesPage />} />


            <Route
              path="*"
              element={
                <div className="text-sm text-slate-400">
                  Select a section from the sidebar.
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
