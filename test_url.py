import trafilatura

urls = [
  "https://buddy-bottle.com/%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%AB%E0%B8%A3%E0%B8%B7%E0%B8%AD%E0%B9%84%E0%B8%A1%E0%B9%88-%E0%B8%AA%E0%B8%B1%E0%B8%8D%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%A9%E0%B8%93%E0%B9%8C%E0%B8%97%E0%B8%B5%E0%B9%88/"
]

for url in urls:
    print(f"\nทดสอบ: {url}")
    downloaded = trafilatura.fetch_url(url)
    
    if not downloaded:
        print("  ❌ ดึงไม่ได้เลย")
        continue
    
    text = trafilatura.extract(downloaded)
    
    if not text:
        print("  ❌ ดึงได้แต่ extract ข้อความไม่ได้")
    else:
        print(f"  ✅ ได้ข้อความ {len(text)} ตัวอักษร")
        print(f"  ตัวอย่าง: {text[:200]}")