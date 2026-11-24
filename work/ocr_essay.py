# -*- coding: utf-8 -*-
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocrlibs310"))
sys.stdout.reconfigure(encoding="utf-8")
import pymupdf
from rapidocr_onnxruntime import RapidOCR

PDF = r"c:\Users\Lenovo\Desktop\关于六级\作文\四六级作文套句总结7711290989042806553.pdf"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "essay_raw", "四六级作文套句总结_ocr.txt")
engine = RapidOCR()
doc = pymupdf.open(PDF)
parts = []
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=180)
    img = f"essay_tmp_p{i+1}.png"
    pix.save(img)
    t0 = time.time()
    result, _ = engine(img)
    lines = []
    if result:
        # 按 y 再按 x 排序，保留原始阅读顺序
        items = []
        for box, text, score in result:
            ys = [p[1] for p in box]; xs = [p[0] for p in box]
            items.append((sum(ys) / 4, sum(xs) / 4, text, score))
        items.sort(key=lambda x: (round(x[0] / 10), x[1]))
        lines = [x[2] for x in items]
    parts.append(f"\n===== PAGE {i+1} =====\n" + "\n".join(lines))
    print(f"page {i+1}: {len(lines)} lines, {time.time()-t0:.1f}s", flush=True)
    os.remove(img)
open(OUT, "w", encoding="utf-8").write("".join(parts))
print("saved", OUT, os.path.getsize(OUT))
