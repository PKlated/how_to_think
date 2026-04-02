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
}