import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown"
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-3 mb-6">
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #6ee7b7, #3b82f6)" }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    </div>
    <div
      className="px-4 py-3 rounded-2xl rounded-bl-sm"
      style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}
    >
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#94a3b8",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}
      style={{ animation: "fadeSlideIn 0.25s ease-out" }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6ee7b7, #3b82f6)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
        </div>
      )}

      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{
          background: isUser
            ? "linear-gradient(135deg, #3b82f6, #6366f1)"
            : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(10px)",
          color: isUser ? "#fff" : "#1e293b",
          boxShadow: isUser
            ? "0 4px 15px rgba(99,102,241,0.25)"
            : "0 2px 10px rgba(0,0,0,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.8)",
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          }}
        >
          {message.content}
        </ReactMarkdown>
        <p
          className="text-xs mt-1.5"
          style={{ opacity: 0.55 }}
        >
          {message.timestamp.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, onSendMessage }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEmpty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    {text: "How to recycle plastic bottles?" },
    {text: "How to dispose of old batteries?" },
    {text: "Pros & cons of recycling paper" },
    {text: "How to compost organic waste?" },
  ];

  return (
    <main
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Messages or Empty state */}
      <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.1) transparent" }}>
        {isEmpty ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-6"
            style={{ animation: "fadeSlideIn 0.4s ease-out" }}
          >
            <div>
              <h1
                className="text-2xl font-semibold text-center mb-1"
                style={{ color: "#1e293b" }}
              >
                What are you working on?
              </h1>
              <p className="text-sm text-center" style={{ color: "#94a3b8" }}>
                เริ่มต้นบทสนทนาใหม่ได้เลย
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md w-full">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  onClick={() => {
                    setInput(s.text);
                    textareaRef.current?.focus();
                  }}
                  className="flex flex-col items-start gap-1 px-4 py-3 rounded-2xl text-sm transition-all duration-150 active:scale-95 text-left"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    color: "#475569",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.85)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.6)")
                  }
                >
                  <span className="text-xl"></span>
                  <span className="leading-snug" style={{ color: "#334155", fontWeight: 500 }}>
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 pb-6 pt-2">
        <div
          className="max-w-2xl mx-auto flex items-end gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          {/* Attach button */}
          <button
            className="flex-shrink-0 p-1.5 rounded-xl transition-all hover:bg-black/5"
            style={{ color: "#94a3b8" }}
            aria-label="Attach file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
            style={{
              color: "#1e293b",
              maxHeight: "160px",
              scrollbarWidth: "none",
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{
              background:
                input.trim() && !isLoading
                  ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                  : "rgba(0,0,0,0.08)",
              color: input.trim() && !isLoading ? "#fff" : "#cbd5e1",
              boxShadow:
                input.trim() && !isLoading
                  ? "0 4px 12px rgba(99,102,241,0.35)"
                  : "none",
            }}
            aria-label="Send message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "#b0bec5" }}>
          กด Enter เพื่อส่ง · Shift+Enter เพื่อขึ้นบรรทัดใหม่
        </p>
      </div>
    </main>
  );
};

export default ChatArea;
