import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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

// ===== Typing Indicator =====
const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-3 mb-6 animate-fadeIn">
    <img src="/images.png" className="w-7 h-7 rounded-full" />
    <div className="px-4 py-3 rounded-2xl bg-white border border-[#74c69d] shadow-sm">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-[#74c69d] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ===== Message Bubble =====
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-3 mb-4 ${
        isUser ? "flex-row-reverse" : ""
      } animate-slideUp`}
    >
      {!isUser && <img src="/images.png" className="w-7 h-7 rounded-full" />}

      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm transition-all duration-200 ${
          isUser
            ? "bg-[#b7e4c7] text-[#1a3d2b] rounded-br-sm shadow-md"
            : "bg-white text-slate-800 rounded-bl-sm shadow-sm"
        } border border-[#74c69d]`}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>

        <p className="text-xs mt-1 opacity-50">
          {message.timestamp.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

// ===== Main =====
const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
}) => {
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
  "ขวดพลาสติกรีไซเคิลยังไงให้ถูกวิธี?",
  "ขยะประเภทไหนบ้างที่สามารถรีไซเคิลได้?",
  "รีไซเคิลคืออะไร และสำคัญยังไง?",
  "มีไอเดีย DIY อะไรบ้างจากของเหลือใช้?",
  "เริ่มต้นรีไซเคิลที่บ้านยังไงดี?",
  "มีข้อผิดพลาดอะไรที่ควรเลี่ยงในการรีไซเคิล?",
];

  return (
    <main className="relative flex-1 flex flex-col h-full overflow-hidden font-sans">

      {/* ===== 🌿 BACKGROUND ===== */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-white" />

        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* blobs */}
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />

        {/* floating circles */}
        <div className="circle small" />
        <div className="circle medium" />
        <div className="circle large" />
        <div className="circle outline-1" />
        <div className="circle outline-2" />

        {/* center glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-[#74c69d]/10 rounded-full blur-[140px]" />
        </div>

        {/* noise */}
        <div className="noise-overlay" />
      </div>

      {/* ===== Messages ===== */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fadeIn">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-800">
                What are you working on?
              </h1>
              <p className="text-sm text-slate-400">
                เริ่มต้นบทสนทนาใหม่ได้เลย
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md w-full">
              {suggestions.map((text) => (
                <button
                  key={text}
                  onClick={() => {
                    setInput(text);
                    textareaRef.current?.focus();
                  }}
                  className="px-4 py-3 rounded-2xl text-sm text-left backdrop-blur-md bg-white/60 border border-[#74c69d]
                  transition-all duration-200 hover:scale-[1.02] hover:bg-white/80 active:scale-95"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto backdrop-blur-sm bg-white/40 rounded-2xl px-4 py-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ===== Input ===== */}
      <div className="px-6 pb-6 pt-2">
        <div className="max-w-2xl mx-auto flex items-end gap-3 px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-[#74c69d] shadow-lg focus-within:shadow-xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
              ${
                input.trim() && !isLoading
                  ? "bg-gradient-to-br from-[#52b788] to-[#74c69d] text-white shadow-md hover:scale-105 active:scale-90"
                  : "bg-gray-200 text-gray-400"
              }`}
          >
            ↑
          </button>
        </div>

        <p className="text-center text-xs mt-2 text-gray-400">
          Enter = send · Shift+Enter = new line
        </p>
      </div>
    </main>
  );
};

export default ChatArea;