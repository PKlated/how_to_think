import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useEffect } from "react"
import Sidebar from "../components/Sidebar"
import type { ChatHistory } from "../components/Sidebar"
import ChatArea from "../components/ChatArea"
import type { Message } from "../components/ChatArea"
import { sendMessage, createSession, getSessions, createMessage, getMessages } from "../server/ai"

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
  const [guestMessages, setGuestMessages] = useState<Message[]>([]) // สำหรับ guest
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null

  // sync userId จาก sessionStorage
  useEffect(() => {
    const syncUser = () => {
      const id = sessionStorage.getItem("userId")
      setUserId(id)
      if (!id) {
        // logout → clear sessions แต่ไม่ redirect
        setSessions([])
        setActiveSessionId(null)
        setGuestMessages([])
      }
    }
    syncUser()
    window.addEventListener("user-changed", syncUser)
    return () => window.removeEventListener("user-changed", syncUser)
  }, [])

  // โหลด sessions ถ้าล็อกอินแล้ว
  useEffect(() => {
    if (!userId) return
    getSessions(userId).then((data) => {
      setSessions(data.map((s: any) => ({
        id: s._id,
        title: s.title,
        messages: [],
        createdAt: new Date(s.createdAt),
      })))
    })
  }, [userId])

  // โหลด messages ของ session ที่เลือก
  useEffect(() => {
    if (!activeSessionId) return
    const session = sessions.find((s) => s.id === activeSessionId)
    if (session && session.messages.length > 0) return

    getMessages(activeSessionId).then((data) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: data.map((m: any) => ({
                  id: m._id,
                  role: m.role,
                  content: m.content,
                  timestamp: new Date(m.timestamp),
                })),
              }
            : s
        )
      )
    })
  }, [activeSessionId])

  const chatHistory: ChatHistory[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    timestamp: s.createdAt,
  }))

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setGuestMessages([]) // clear guest chat ด้วย
  }, [])

  const handleSelectChat = useCallback((id: string) => setActiveSessionId(id), [])

  const handleDeleteChat = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) setActiveSessionId(null)
  }, [activeSessionId])

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: Message = { id: uid(), role: "user", content, timestamp: new Date() }

    // ===== GUEST MODE (ไม่ล็อกอิน) =====
    if (!userId) {
      setGuestMessages(prev => [...prev, userMsg])
      setIsLoading(true)
      try {
        const history = guestMessages.map((m) => ({ role: m.role, content: m.content }))
        const res = await sendMessage(content, history, undefined)
        const aiMsg: Message = {
          id: uid(),
          role: "assistant",
          content: res.answer,
          timestamp: new Date(),
        }
        setGuestMessages(prev => [...prev, aiMsg])
      } catch {
        setGuestMessages(prev => [...prev, {
          id: uid(),
          role: "assistant",
          content: "เกิดข้อผิดพลาด กรุณาลองใหม่ครับ",
          timestamp: new Date(),
        }])
      } finally {
        setIsLoading(false)
      }
      return
    }

    // ===== LOGGED IN MODE =====
    let sessionId = activeSessionId
    let currentSession: ChatSession | undefined

    if (!sessionId) {
      const title = generateTitle(content)
      const newSessionDB = await createSession(userId, title)
      const newSession: ChatSession = {
        id: newSessionDB._id,
        title,
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
          s.id === sessionId ? { ...s, messages: [...s.messages, userMsg] } : s
        )
      )
      currentSession = sessions.find((s) => s.id === sessionId)
    }

    await createMessage(sessionId!, "user", content)
    setIsLoading(true)

    try {
      const history = (currentSession?.messages ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const res = await sendMessage(content, history, sessionId!)
      const aiMsg: Message = {
        id: uid(),
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
      }
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
        )
      )
      await createMessage(sessionId!, "assistant", res.answer)
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? {
            ...s,
            messages: [...s.messages, {
              id: uid(),
              role: "assistant",
              content: "เกิดข้อผิดพลาด กรุณาลองใหม่ครับ",
              timestamp: new Date(),
            }]
          } : s
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId, sessions, userId, guestMessages])

  // messages ที่แสดงผล: guest ใช้ guestMessages, logged in ใช้ session
  const displayMessages = userId
    ? (activeSession?.messages ?? [])
    : guestMessages

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #a8d5b5 0%, #c5e8d0 35%, #d6eedf 60%, #deeaf5 100%)" }}>
      <Sidebar
        chatHistory={userId ? chatHistory : []} // guest ไม่มี history
        activeChatId={activeSessionId}
        userName=""
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isGuest={!userId} // บอก Sidebar ว่าเป็น guest
      />
      <ChatArea
        messages={displayMessages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

export const Route = createFileRoute('/chat')({
  // ลบ beforeLoad guard ออก → ทุกคนเข้าได้
  component: ChatPage,
})