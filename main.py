# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from rag import ask, ingest_pdfs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ใน production เปลี่ยนเป็น domain จริง
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("recycling_rag")
ingest_pdfs(collection)

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

@app.post("/chat")
async def chat(req: ChatRequest):
    answer = ask(collection, req.message, req.history)
    return {"answer": answer}