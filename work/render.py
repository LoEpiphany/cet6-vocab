import pymupdf, sys, os

sys.stdout.reconfigure(encoding="utf-8")
path = r"c:\Users\Lenovo\Desktop\关于六级\英语六级阅读单词汇总20172026.pdf"
out = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\pages"
os.makedirs(out, exist_ok=True)
doc = pymupdf.open(path)
for i, page in enumerate(doc):
    print(i, page.rect, page.rotation)
    pix = page.get_pixmap(dpi=200)
    pix.save(os.path.join(out, f"p{i+1:02d}.png"))
print("done")
