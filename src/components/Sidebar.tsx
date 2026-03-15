import React, { useState } from "react";

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
}

const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  activeChatId,
  userName,
  onNewChat,
  onSelectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <aside
      className={`
        flex flex-col h-full transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-64"}
      `}
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.6)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header: Username + Collapse */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6ee7b7, #3b82f6)" }}
            >
              {getInitials(userName)}
            </div>
            <span
              className="font-semibold text-sm truncate max-w-[110px]"
              style={{ color: "#1e293b" }}
            >
              {userName}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "#64748b" }}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 mb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
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

      {/* New Chat Button */}
      <div className="px-3 mb-4">
        <button
          onClick={onNewChat}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-150 active:scale-95
            ${isCollapsed ? "justify-center" : ""}
          `}
          style={{
            background: "rgba(0,0,0,0.07)",
            color: "#334155",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.12)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.07)")
          }
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
            <p className="text-xs font-medium px-2 pb-1" style={{ color: "#94a3b8" }}>
              Recent
            </p>
            {filteredHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl text-sm truncate transition-all duration-150
                  ${activeChatId === chat.id ? "font-medium" : ""}
                `}
                style={{
                  color: activeChatId === chat.id ? "#0f172a" : "#475569",
                  background:
                    activeChatId === chat.id
                      ? "rgba(0,0,0,0.1)"
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                }}
              >
                {chat.title}
              </button>
            ))}
          </>
        )}
        {!isCollapsed && filteredHistory.length === 0 && searchQuery && (
          <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>
            No results found
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
