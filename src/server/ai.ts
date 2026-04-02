export interface HistoryItem {
  role: "user" | "assistant"
  content: string
}

export async function sendMessage(
  message: string,
  history: HistoryItem[]
): Promise<string> {
  const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  })

  if (!res.ok) throw new Error("Backend error")
  const data = await res.json()
  return data.answer
}