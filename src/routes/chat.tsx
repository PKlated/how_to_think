import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from "react"
import Sidebar from "../components/Sidebar"
import type { ChatHistory } from "../components/Sidebar"
import ChatArea from "../components/ChatArea"
import type { Message } from "../components/ChatArea"
import { sendMessage } from "../server/ai"

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

const uid = () => Math.random().toString(36).slice(2, 10)
const generateTitle = (msg: string) => msg.length > 36 ? msg.slice(0, 36) + "…" : msg

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
  let currentSession: ChatSession | undefined

  if (!sessionId) {
    const newSession: ChatSession = {
      id: uid(),
      title: generateTitle(content),
      messages: [userMsg],
      createdAt: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)

    sessionId = newSession.id
    currentSession = newSession
  } else {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      )
    )
    currentSession = sessions.find((s) => s.id === sessionId)
  }

  setIsLoading(true)

  try {
    const history = (currentSession?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const res = await sendMessage(content, history, sessionId)

    const aiMsg: Message = {
      id: uid(),
      role: "assistant",
      content: res.answer,   
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, aiMsg] }
          : s
      )
    )

    if (res.sessionId) {
      setActiveSessionId(res.sessionId)
    }

  } catch {
    const errMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "เกิดข้อผิดพลาด กรุณาลองใหม่ครับ",
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, errMsg] }
          : s
      )
    )
  } finally {
    setIsLoading(false)
  }
}, [activeSessionId, sessions])

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #a8d5b5 0%, #c5e8d0 35%, #d6eedf 60%, #deeaf5 100%)" }}>
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={activeSessionId}
        userName=""
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