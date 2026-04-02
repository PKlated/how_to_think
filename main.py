# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from rag import ask, ingest_pdfs
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== MongoDB =====
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["how_to_think"]
users_col = db["User"]

# ChromaDB
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
    if users_col.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    result = users_col.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed
    })
    return {"_id": str(result.inserted_id), "name": user.name, "email": user.email}

# ===== LOGIN =====
@app.post("/api/login")
def login(user: LoginModel):
    found = users_col.find_one({"email": user.email})
    if not found or not bcrypt.checkpw(user.password.encode(), found["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"_id": str(found["_id"]), "name": found["name"], "email": found["email"]}

# ===== SESSION =====
from bson import ObjectId
import datetime

sessions_col = db["Session"]
messages_col = db["Message"]

class CreateSessionModel(BaseModel):
    userId: str
    title: str

class CreateMessageModel(BaseModel):
    sessionId: str
    role: str
    content: str

@app.post("/api/sessions")
def create_session(data: CreateSessionModel):
    result = sessions_col.insert_one({
        "userId": ObjectId(data.userId),
        "title": data.title,
        "createdAt": datetime.datetime.utcnow()
    })
    return {"_id": str(result.inserted_id), "title": data.title}

@app.get("/api/sessions/{user_id}")
def get_sessions(user_id: str):
    docs = list(sessions_col.find({"userId": ObjectId(user_id)}).sort("createdAt", -1))
    return [{"_id": str(d["_id"]), "title": d["title"], "createdAt": str(d["createdAt"])} for d in docs]

# ===== MESSAGE =====
@app.post("/api/messages")
def create_message(data: CreateMessageModel):
    result = messages_col.insert_one({
        "sessionId": ObjectId(data.sessionId),
        "role": data.role,
        "content": data.content,
        "timestamp": datetime.datetime.utcnow()
    })
    return {"_id": str(result.inserted_id)}

@app.get("/api/messages/{session_id}")
def get_messages(session_id: str):
    docs = list(messages_col.find({"sessionId": ObjectId(session_id)}).sort("timestamp", 1))
    return [{"_id": str(d["_id"]), "role": d["role"], "content": d["content"], "timestamp": str(d["timestamp"])} for d in docs]