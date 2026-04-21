import { useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from "react";
import { updateProfile, logout, deleteSession } from "../server/ai";

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  chatHistory: ChatHistory[];
  activeChatId: string | null;
  userName: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  activeChatId,
  userName,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = () => {
      const data = sessionStorage.getItem("user");
      setUser(data ? JSON.parse(data) : null);
    };
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("user-changed", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-changed", loadUser);
    };
  }, []);

  const handleSave = async (data: { username: string; password: string }) => {
    try {
      const updated = await updateProfile(data.username, data.password);
      sessionStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("user-changed"));
      setUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(id);
    onDeleteChat(id);
    if (activeChatId === id) onNewChat();
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <aside
        className={`flex flex-col h-full transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          {!isCollapsed && (
            <>
              {user ? (
                <div
                  onClick={() => { setEditName(user.name); setEditPassword(""); setIsProfileOpen(true); }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-green-300 to-blue-500">
                    {getInitials(user.name)}
                  </div>
                  <span className="font-semibold text-sm truncate text-slate-800">
                    {user.name}
                  </span>
                </div>
              ) : (
                <button onClick={() => navigate({ to: "/login" })}>Login</button>
              )}
            </>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors text-slate-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.06)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400"
                style={{ color: "#1e293b" }}
              />
            </div>
          </div>
        )}

        {/* New Chat */}
        <div className="px-3 mb-4">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${isCollapsed ? "justify-center" : ""}`}
            style={{ background: "rgba(0,0,0,0.07)", color: "#334155" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.12)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.07)")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5" style={{ scrollbarWidth: "none" }}>
          {!isCollapsed && filteredHistory.length > 0 && (
            <>
              <p className="text-xs font-medium px-2 pb-1" style={{ color: "#94a3b8" }}>Recent</p>
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative flex items-center rounded-xl transition-all duration-150"
                  style={{ background: activeChatId === chat.id ? "rgba(0,0,0,0.1)" : "transparent" }}
                  onMouseEnter={(e) => {
                    if (activeChatId !== chat.id)
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.05)"
                  }}
                  onMouseLeave={(e) => {
                    if (activeChatId !== chat.id)
                      (e.currentTarget as HTMLDivElement).style.background = "transparent"
                  }}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className="flex-1 text-left px-3 py-2.5 text-sm truncate"
                    style={{ color: activeChatId === chat.id ? "#0f172a" : "#475569" }}
                  >
                    {chat.title}
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="flex-shrink-0 mr-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#ef4444" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
          {!isCollapsed && filteredHistory.length === 0 && searchQuery && (
            <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No results found</p>
          )}
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/40">
          {user ? (
            <button
              onClick={() => {
                logout()
                window.dispatchEvent(new Event("user-changed"))
                navigate({ to: "/login" })
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${isCollapsed ? "justify-center" : ""}`}
              style={{ color: "#ef4444" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!isCollapsed && <span>Logout</span>}
            </button>
          ) : null}
        </div>
      </aside>

      {/* Profile Modal */}
      {isProfileOpen && user && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
            onClick={() => setIsProfileOpen(false)}
          />
          <div
            className="relative p-6 rounded-3xl w-[340px]"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Edit Profile</h2>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)" }}
              placeholder="Username"
            />
            <input
              value={user.email}
              disabled
              className="w-full mb-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#94a3b8" }}
            />
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)" }}
              placeholder="New Password"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.3)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { handleSave({ username: editName, password: editPassword }); setIsProfileOpen(false); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;