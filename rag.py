# ── ติดตั้ง packages ────────────────────────────────────
# pip install chromadb ollama pypdf nltk deep-translator langdetect

import ollama
import chromadb
import os
import re
import json
import hashlib
import nltk

from pypdf import PdfReader
from nltk.stem import WordNetLemmatizer
from deep_translator import GoogleTranslator
from langdetect import detect

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


# ── Translation Helpers ─────────────────────────────────

def detect_language(text: str) -> str:
    """
    ตรวจจับภาษาของข้อความ
    คืนค่า 'th' ถ้าเป็นภาษาไทย, 'en' หรือภาษาอื่น
    """
    try:
        lang = detect(text)
        return lang
    except Exception:
        return "en"  # ถ้าตรวจไม่ได้ให้ถือว่าเป็นภาษาอังกฤษ


def translate_th_to_en(text: str) -> str:
    """
    แปลภาษาไทย → ภาษาอังกฤษ
    ใช้ GoogleTranslator จาก deep-translator (ฟรี ไม่ต้อง API key)
    """
    try:
        translated = GoogleTranslator(source="th", target="en").translate(text)
        print(f"  [แปล TH→EN]: {text!r} → {translated!r}")
        return translated
    except Exception as e:
        print(f"  [แปล TH→EN ล้มเหลว]: {e}")
        return text  # คืนค่าเดิมถ้าแปลไม่ได้


def translate_en_to_th(text: str) -> str:
    """
    แปลภาษาอังกฤษ → ภาษาไทย
    จัดการข้อความยาวโดยแบ่งเป็นท่อนๆ (GoogleTranslator รองรับสูงสุด ~5000 ตัวอักษร)
    """
    try:
        # แบ่งข้อความที่ยาวเกินออกเป็นท่อน
        max_chunk = 4500
        if len(text) <= max_chunk:
            return GoogleTranslator(source="en", target="th").translate(text)

        # ถ้ายาวเกิน ให้แบ่งแปลทีละท่อน
        parts = []
        sentences = text.split(". ")
        current   = ""

        for sentence in sentences:
            if len(current) + len(sentence) < max_chunk:
                current += sentence + ". "
            else:
                if current:
                    translated_part = GoogleTranslator(
                        source="en", target="th"
                    ).translate(current.strip())
                    parts.append(translated_part)
                current = sentence + ". "

        # แปลส่วนที่เหลือ
        if current.strip():
            translated_part = GoogleTranslator(
                source="en", target="th"
            ).translate(current.strip())
            parts.append(translated_part)

        return " ".join(parts)

    except Exception as e:
        print(f"  [แปล EN→TH ล้มเหลว]: {e}")
        return text  # คืนค่าเดิมถ้าแปลไม่ได้


# ── Preprocess ──────────────────────────────────────────

def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"source:\s*", "", text)
    text = re.sub(r"\bpage\s*\d+\b", "", text)
    text = re.sub(r"[^a-z0-9\s\.\,]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    words = [lemmatizer.lemmatize(word) for word in words]
    return " ".join(words)


# ── Chunking ────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    words  = text.split()
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
    """
    เช็ค keyword ทั้งภาษาอังกฤษและภาษาไทย
    """
    keywords_en = [
        "recycle", "recycling", "waste", "trash", "garbage",
        "plastic", "metal", "organic", "electronic", "battery",
        "compost", "dispose", "hazardous", "leather", "textile",
        "aluminum", "copper", "iron", "chemical", "wood", "paper",
    ]
    # คำภาษาไทยที่เกี่ยวข้องกับการรีไซเคิล
    keywords_th = [
        "รีไซเคิล", "ขยะ", "เศษ", "พลาสติก", "โลหะ", "กระดาษ",
        "แก้ว", "แบตเตอรี่", "อิเล็กทรอนิกส์", "ปุ๋ยหมัก", "กำจัด",
        "อันตราย", "อลูมิเนียม", "ทองแดง", "เหล็ก", "สารเคมี", "ไม้",
        "หนัง", "ผ้า", "วัสดุ", "นำกลับ", "ทิ้ง", "คัดแยก",
    ]
    q = question.lower()
    return any(kw in q for kw in keywords_en + keywords_th)


def is_relevant(distances: list[float]) -> bool:
    if not distances:
        return False
    return distances[0] <= 300


# ── ถามคำถาม (รองรับภาษาไทย) ────────────────────────────

def ask(collection, question: str, history: list) -> str:
    """
    Flow:
    1. ตรวจสอบภาษาของคำถาม
    2. ถ้าเป็นภาษาไทย → แปลเป็นอังกฤษก่อน
    3. เช็ค keyword และ relevance
    4. ค้นหาใน ChromaDB ด้วยคำถามภาษาอังกฤษ
    5. ได้คำตอบจาก LLM เป็นภาษาอังกฤษ
    6. ถ้าคำถามต้นฉบับเป็นภาษาไทย → แปลคำตอบกลับเป็นภาษาไทย
    """

    # ── Step 1: ตรวจสอบภาษา ─────────────────────────────
    lang            = detect_language(question)
    is_thai         = (lang == "th")
    question_for_rag = question  # คำถามที่จะใช้ค้นหาใน RAG

    if is_thai:
        print(f"  [ตรวจพบภาษาไทย] กำลังแปลคำถาม...")
        question_for_rag = translate_th_to_en(question)

    # ── Step 2: เช็ค keyword (ใช้คำถามต้นฉบับ เพื่อให้จับคำไทยได้ด้วย) ──
    if not has_recycling_keyword(question) and not has_recycling_keyword(question_for_rag):
        not_relevant_msg = "I can only help with recycling-related questions."
        if is_thai:
            return "ขอโทษครับ ฉันช่วยตอบได้เฉพาะคำถามเกี่ยวกับการรีไซเคิลและการจัดการขยะเท่านั้น"
        return not_relevant_msg

    # ── Step 3: สร้าง embedding จากคำถามภาษาอังกฤษ ────────
    clean_question = preprocess(question_for_rag)

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
    print(f"  DEBUG score: {1 - distances[0]:.3f}")

    # ── Step 4: เช็ค relevance score ────────────────────
    if not is_relevant(distances):
        if is_thai:
            return "ขอโทษครับ ฉันช่วยตอบได้เฉพาะคำถามเกี่ยวกับการรีไซเคิลและการจัดการขยะเท่านั้น"
        return "I can only help with recycling-related questions."

    context = "\n".join(results["documents"][0])

    # ── Step 5: ส่งคำถามภาษาอังกฤษไปยัง LLM ─────────────
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {
            "role": "user",
            "content": f"""
Use this context to answer the question.

Context:
{context}

Question: {question_for_rag}
"""
        }
    ]

    response = ollama.chat(
        model="gemma3:4b",
        messages=messages
    )

    answer_en = response["message"]["content"]

    # ── Step 6: แปลคำตอบกลับเป็นภาษาไทย (ถ้าคำถามเป็นไทย) ──
    if is_thai:
        print("  [กำลังแปลคำตอบเป็นภาษาไทย...]")
        return translate_en_to_th(answer_en)

    return answer_en


# ── Main ──────────────────────────────────────────────────

def main():
    print("=== Recycling AI Assistant (รองรับภาษาไทย) ===\n")

    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection    = chroma_client.get_or_create_collection("recycling_rag")

    ingest_pdfs(collection)

    history = []
    print("พิมพ์ 'quit' หรือ 'ออก' เพื่อออกจากโปรแกรม\n")
    print("สามารถถามเป็นภาษาไทยหรือภาษาอังกฤษก็ได้\n")

    while True:
        question = input("คุณ: ").strip()

        if question.lower() in ("quit", "ออก"):
            print("ออกจากโปรแกรม")
            break

        if not question:
            continue

        answer = ask(collection, question, history)
        print(f"\nAI: {answer}\n")

        # เก็บ history เป็นภาษาอังกฤษเพื่อให้ LLM ทำงานได้ดีขึ้น
        lang = detect_language(question)
        if lang == "th":
            history.append({"role": "user",      "content": translate_th_to_en(question)})
        else:
            history.append({"role": "user",      "content": question})
        history.append({"role": "assistant", "content": answer})

        if len(history) > 6:
            history = history[-6:]


if __name__ == "__main__":
    main()