import pymupdf, sys, io, json

sys.stdout.reconfigure(encoding="utf-8")

path = r"c:\Users\Lenovo\Desktop\关于六级\英语六级阅读单词汇总20172026.pdf"
doc = pymupdf.open(path)
print("PAGES:", doc.page_count)
print("META:", doc.metadata)
total_chars = 0
for i in range(min(doc.page_count, 3)):
    page = doc[i]
    t = page.get_text()
    total_chars += len(t)
    print("=" * 30, "PAGE", i, "chars", len(t), "images", len(page.get_images()))
    print(t[:1500])
print("first3_total_chars", total_chars)
