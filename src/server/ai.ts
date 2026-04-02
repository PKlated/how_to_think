export interface HistoryItem {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  answer: string
  isRecyclable: boolean
  confidence: number
  sessionId?: string | null
}
export interface User {
  _id: string
  name: string
  email: string
}

// ================= CHAT =================
export async function sendMessage(
  message: string,
  history: HistoryItem[],
  sessionId?: string
): Promise<ChatResponse> {

  const userId = localStorage.getItem("userId")

  const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      userId,      
      sessionId    
    }),
  })

  if (!res.ok) throw new Error("Backend error")

  const data = await res.json()
  return data
}

// ================= SIGNUP =================
export async function signup(name: string, email: string, password: string) {
  const res = await fetch("http://localhost:8000/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message);
  localStorage.setItem("userId", data._id);
  return data;
}

// ================= LOGIN =================
export async function login(email: string, password: string) {
  const res = await fetch("http://localhost:8000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message);
  localStorage.setItem("userId", data._id);
  return data;
}

// ================= LOGOUT =================
export function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
}

// ================= SESSIONS =================
export async function createSession(userId: string, title: string) {
  const res = await fetch("http://localhost:8000/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail)
  return data
}

export async function getSessions(userId: string) {
  const res = await fetch(`http://localhost:8000/api/sessions/${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail)
  return data
}

// ================= MESSAGES =================
export async function createMessage(sessionId: string, role: string, content: string) {
  const res = await fetch("http://localhost:8000/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, role, content }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail)
  return data
}

export async function getMessages(sessionId: string) {
  const res = await fetch(`http://localhost:8000/api/messages/${sessionId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail)
  return data
}