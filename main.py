# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from rag import ask, ingest_pdfs
import uuid  # สำหรับจำลอง _id

app = FastAPI()

# CORS สำหรับ React localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ใน production เปลี่ยนเป็น domain จริง
    allow_methods=["*"],
    allow_headers=["*"],
)

# ChromaDB สำหรับ RAG
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("recycling_rag")
ingest_pdfs(collection)

# ===== MODELS =====
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    userId: str | None = None      
    sessionId: str | None = None   

class SignupModel(BaseModel):
    name: str
    email: str
    password: str

class LoginModel(BaseModel):
    email: str
    password: str

# ===== IN-MEMORY USERS =====
# สำหรับทดลองเท่านั้น (production ต้องใช้ DB จริง)
USERS = []

# ===== CHAT =====
@app.post("/chat")
async def chat(req: ChatRequest):
    answer = ask(collection, req.message, req.history)
    isRecyclable = "recycle" in answer.lower()
    confidence = 0.9 if isRecyclable else 0.6

    return {
        "answer": answer,
        "isRecyclable": isRecyclable,
        "confidence": confidence,
        "sessionId": req.sessionId
    }

# ===== SIGNUP =====
@app.post("/api/signup")
def signup(user: SignupModel):
    # ตรวจสอบ email ซ้ำ
    if any(u["email"] == user.email for u in USERS):
        return {"error": "Email already exists"}

    user_id = str(uuid.uuid4())
    USERS.append({"_id": user_id, "name": user.name, "email": user.email, "password": user.password})
    return {"_id": user_id, "name": user.name, "email": user.email}

# ===== LOGIN =====
@app.post("/api/login")
def login(user: LoginModel):
    found = next((u for u in USERS if u["email"] == user.email and u["password"] == user.password), None)
    if not found:
        return {"error": "Invalid credentials"}
    return {"_id": found["_id"], "name": found["name"], "email": found["email"]}