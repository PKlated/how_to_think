# ── ติดตั้ง packages ────────────────────────────────────
# pip install chromadb ollama pypdf nltk

import ollama
import chromadb
import os
import re
import json
import hashlib
import nltk

from pypdf import PdfReader
from nltk.stem import WordNetLemmatizer
# ดาวน์โหลดข้อมูลภาษา
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

# ── Settings ────────────────────────────────────────────
PDF_FOLDER    = "dataset/pdfs"
INGESTED_FILE = "dataset/ingested.json"
CHUNK_SIZE    = 150
CHUNK_OVERLAP = 30
TOP_RESULTS   = 3


# ── System Prompt ───────────────────────────────────────
SYSTEM_PROMPT = """
You are a recycling expert assistant.
Your job is to help users understand:
- What type of waste something is
- How to recycle it at home step by step
- The pros and cons of recycling

Always answer in English.
Be clear and practical.
If the question is not about recycling or waste management,
reply exactly: "I can only help with recycling-related questions."
"""

lemmatizer = WordNetLemmatizer()


# ── Preprocess ──────────────────────────────────────────

def preprocess(text: str) -> str:
    #แปลงทุกตัวอักษรเป็นพิมพ์เล็ก
    text = text.lower()
    #ลบ URL ออก
    text = re.sub(r"https?://\S+", "", text)
    #ลบคำว่า "source
    text = re.sub(r"source:\s*", "", text)
    #ลบเลขหน้า
    text = re.sub(r"\bpage\s*\d+\b", "", text)
    #ลบอักขระพิเศษทิ้ง
    text = re.sub(r"[^a-z0-9\s\.\,]", " ", text)
    #ลบช่องว่างซ้ำซ้อนและตัดหัวท้าย
    text = re.sub(r"\s+", " ", text).strip()
    #วนทุกคำแล้วทำ Lemmatization
    words = text.split()
    words = [lemmatizer.lemmatize(word) for word in words]
     #ต่อคำกลับเป็นประโยค
    return " ".join(words)


# ── Chunking ────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    words  = text.split() #แยกข้อความออกเป็นคำๆ
    chunks = []
    start  = 0

    while start < len(words):
        end   = start + CHUNK_SIZE
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


# ── Hash ─────────────────────────────────────────────────

def get_file_hash(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


# ── ingested.json ────────────────────────────────────────

def load_ingested() -> dict:
    if not os.path.exists(INGESTED_FILE):
        return {}
    with open(INGESTED_FILE, "r") as f:
        return json.load(f)

def save_ingested(ingested: dict):
    os.makedirs(os.path.dirname(INGESTED_FILE), exist_ok=True)
    with open(INGESTED_FILE, "w") as f:
        json.dump(ingested, f, indent=2)


# ── ลบ chunks เก่า ───────────────────────────────────────

def remove_old_chunks(collection, filename: str):
    try:
        results = collection.get(where={"source": filename})
        if results["ids"]:
            collection.delete(ids=results["ids"])
            print(f"  ลบข้อมูลเก่าของ {filename} แล้ว")
    except Exception as e:
        print(f"  ลบไม่สำเร็จ: {e}")


# ── Ingest PDF ───────────────────────────────────────────

def ingest_pdfs(collection):
    ingested = load_ingested()
    updated  = False

    if not os.path.exists(PDF_FOLDER):
        print(f"ไม่พบโฟลเดอร์: {PDF_FOLDER}")
        return

    for file in os.listdir(PDF_FOLDER):
        if not file.endswith(".pdf"):
            continue

        pdf_path  = os.path.join(PDF_FOLDER, file)
        file_hash = get_file_hash(pdf_path)

        if ingested.get(file) == file_hash:
            print(f"ข้าม (มีอยู่แล้ว): {file}")
            continue

        if file in ingested:
            print(f"ไฟล์เปลี่ยนแปลง: {file} → ingest ใหม่")
            remove_old_chunks(collection, file)
        else:
            print(f"ไฟล์ใหม่: {file} → ingest")

        reader   = PdfReader(pdf_path)
        raw_text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                raw_text += extracted + " "

        clean_text = preprocess(raw_text)
        chunks     = chunk_text(clean_text)

        print(f"  สร้าง embeddings {len(chunks)} chunks...")

        for i, chunk in enumerate(chunks):
            try:
                embedding = ollama.embeddings(
                    # โมเดลแปลงข้อความเป็น vector
                    model="nomic-embed-text",
                    prompt=chunk
                )["embedding"]

                collection.add(
                    ids=[f"{file}_{i}"],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{"source": file, "chunk_index": i}]
                )

                if (i + 1) % 20 == 0:
                    print(f"    เสร็จแล้ว {i + 1}/{len(chunks)}")

            except Exception as e:
                print(f"  ข้าม chunk {i}: {e}")

        ingested[file] = file_hash
        updated = True
        print(f"  ingest เสร็จแล้ว: {file}\n")

    if updated:
        save_ingested(ingested)
        print("บันทึก ingested.json แล้ว\n")
    else:
        print("ไม่มีไฟล์ใหม่ที่ต้อง ingest\n")


# ── เช็คคำถาม ────────────────────────────────────────────

def has_recycling_keyword(question: str) -> bool:
    keywords = [
        "recycle", "recycling", "waste", "trash", "garbage",
        "plastic", "metal", "organic", "electronic", "battery",
        "compost", "dispose", "hazardous", "leather", "textile",
        "aluminum", "copper", "iron", "chemical", "wood", "paper",
    ]
    q = question.lower()
    return any(kw in q for kw in keywords)

def is_relevant(distances: list[float]) -> bool:
    if not distances:
        return False
    return distances[0] <= 300
# distance น้อย = ใกล้เคียงมาก = เกี่ยวข้อง
# distance มาก = ห่างมาก = ไม่เกี่ยวข้อง

# ── ถามคำถาม ─────────────────────────────────────────────

def ask(collection, question: str, history: list) -> str:

    # ชั้นที่ 1: เช็ค keyword
    if not has_recycling_keyword(question):
        return "I can only help with recycling-related questions."

    clean_question = preprocess(question)

    query_embedding = ollama.embeddings(
        model="nomic-embed-text",
        prompt=clean_question
    )["embedding"]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_RESULTS,
        include=["documents", "distances"]
    )

    distances = results["distances"][0]

    # debug — ดู score ที่ได้
    print(f"  DEBUG score: {1 - distances[0]:.3f}")

    # ชั้นที่ 2: เช็ค relevance score
    if not is_relevant(distances):
        return "I can only help with recycling-related questions."

    context = "\n".join(results["documents"][0])

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {
            "role": "user",
            "content": f"""
Use this context to answer the question.

Context:
{context}

Question: {question}
"""
        }
    ]

    response = ollama.chat(
        model="gemma3:4b",
        messages=messages
    )

    return response["message"]["content"]


# ── Main ──────────────────────────────────────────────────

def main():
    print("=== Recycling AI Assistant ===\n")

    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection    = chroma_client.get_or_create_collection("recycling_rag")

    ingest_pdfs(collection)

    history = []
    print("พิมพ์ 'quit' เพื่อออก\n")

    while True:
        question = input("You: ").strip()

        if question.lower() == "quit":
            print("ออกจากโปรแกรม")
            break

        if not question:
            continue

        answer = ask(collection, question, history)
        print(f"\nAI: {answer}\n")

        history.append({"role": "user",      "content": question})
        history.append({"role": "assistant", "content": answer})

        if len(history) > 6:
            history = history[-6:]


if __name__ == "__main__":
    main()