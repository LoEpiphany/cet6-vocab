import pymupdf, sys, os
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\六级仔细阅读词汇整理2021-20267703188035024158258.pdf"
doc = pymupdf.open(p)
print("pages", doc.page_count)
print("meta", doc.metadata)
for i in range(min(2, doc.page_count)):
    t = doc[i].get_text()
    print("page", i, "chars", len(t), "images", len(doc[i].get_images()))
    print(t[:300])
os.makedirs(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\pages", exist_ok=True)
for i, page in enumerate(doc):
    page.get_pixmap(dpi=200).save(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\pages\p%02d.png" % (i+1))
print("rendered")
