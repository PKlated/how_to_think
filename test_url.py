import trafilatura

urls = [
  "https://www.milo.co.th/all-blog/activity/recycled-crafts-for-kids"
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