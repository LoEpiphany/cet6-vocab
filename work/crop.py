import pymupdf, sys, os

sys.stdout.reconfigure(encoding="utf-8")
path = r"c:\Users\Lenovo\Desktop\关于六级\英语六级阅读单词汇总20172026.pdf"
out = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\crops"
os.makedirs(out, exist_ok=True)
doc = pymupdf.open(path)
bands = [(0.00, 0.40), (0.34, 0.74), (0.68, 1.00)]
for i, page in enumerate(doc):
    r = page.rect
    for b, (a, c) in enumerate(bands):
        clip = pymupdf.Rect(r.x0, r.y0 + r.height * a, r.x1, r.y0 + r.height * c)
        pix = page.get_pixmap(dpi=300, clip=clip)
        pix.save(os.path.join(out, f"p{i+1:02d}_b{b+1}.png"))
print("crops:", len(os.listdir(out)))
