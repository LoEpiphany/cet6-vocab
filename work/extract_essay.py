# -*- coding: utf-8 -*-
import os, sys, json, re, zipfile
sys.stdout.reconfigure(encoding="utf-8")
import pymupdf
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

def docx_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    body = root.find(W + "body")
    out = []
    def ptext(p):
        return "".join(t.text or "" for t in p.iter(W + "t"))
    for child in body:
        tag = child.tag.replace(W, "")
        if tag == "p":
            s = ptext(child).strip()
            if s: out.append(s)
        elif tag == "tbl":
            out.append("[TABLE]")
            for tr in child.findall(W + "tr"):
                cells = [ptext(tc).strip() for tc in tr.findall(W + "tc")]
                out.append(" | ".join(cells))
    return "\n".join(out)

SRC = r"c:\Users\Lenovo\Desktop\关于六级\作文"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "essay_raw")
os.makedirs(OUT, exist_ok=True)

for name in os.listdir(SRC):
    p = os.path.join(SRC, name)
    base, ext = os.path.splitext(name)
    out = os.path.join(OUT, base + ".txt")
    if ext.lower() == ".pdf":
        doc = pymupdf.open(p)
        parts = []
        for i, page in enumerate(doc):
            t = page.get_text("text")
            parts.append(f"\n\n===== PAGE {i+1} =====\n" + t)
        txt = "".join(parts)
        info = f"pages={len(doc)} chars={len(txt)}"
    elif ext.lower() == ".docx":
        txt = docx_text(p)
        info = f"chars={len(txt)}"
    else:
        continue
    open(out, "w", encoding="utf-8").write(txt)
    print(name, "->", info, "->", os.path.basename(out))
