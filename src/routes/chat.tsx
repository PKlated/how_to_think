import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from "react"
import Sidebar from "../components/Sidebar"
import type { ChatHistory } from "../components/Sidebar"
import ChatArea from "../components/ChatArea"
import type { Message } from "../components/ChatArea"

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

const uid = () => Math.random().toString(36).slice(2, 10)
const generateTitle = (msg: string) => msg.length > 36 ? msg.slice(0, 36) + "…" : msg

const mockAIResponse = async (userMessage: string): Promise<string> => {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800))
  const replies: Record<string, string> = {
    สวัสดี: "สวัสดีครับ! มีอะไรให้ช่วยได้บ้าง?",
    hello: "Hello! How can I help you today?",
    โค้ด: "แน่นอนครับ! บอกได้เลยว่าต้องการให้เขียนโค้ดอะไรครับ",
  }
  for (const [k, v] of Object.entries(replies)) {
    if (userMessage.toLowerCase().includes(k)) return v
  }
  return `ได้รับข้อความของคุณแล้วครับ: "${userMessage}"`
}

function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  const chatHistory: ChatHistory[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    timestamp: s.createdAt,
  }))

  const handleNewChat = useCallback(() => setActiveSessionId(null), [])
  const handleSelectChat = useCallback((id: string) => setActiveSessionId(id), [])

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: Message = { id: uid(), role: "user", content, timestamp: new Date() }
    let sessionId = activeSessionId

    if (!sessionId) {
      const newSession: ChatSession = {
        id: uid(), title: generateTitle(content),
        messages: [userMsg], createdAt: new Date(),
      }
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      sessionId = newSession.id
    } else {
      setSessions((prev) => prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, userMsg] } : s
      ))
    }

    setIsLoading(true)
    try {
      const responseText = await mockAIResponse(content)
      const aiMsg: Message = { id: uid(), role: "assistant", content: responseText, timestamp: new Date() }
      setSessions((prev) => prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ))
    } catch {
      const errMsg: Message = { id: uid(), role: "assistant", content: "เกิดข้อผิดพลาด กรุณาลองใหม่ครับ", timestamp: new Date() }
      setSessions((prev) => prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, errMsg] } : s
      ))
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId])

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)" }}>
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={activeSessionId}
        userName="Asia k."
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
      <ChatArea
        messages={activeSession?.messages ?? []}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})
