import pymupdf, re, json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\六级仔细阅读词汇整理2021-20267703188035024158258.pdf"
doc = pymupdf.open(p)

POS = r'(?:n|v|vt|vi|adj|adv|prep|conj|pron|num|aux)\.(?:/[a-z]+\.)?'
entry_re = re.compile(r'(?<![\w\-])(\d{1,3})\s{1,3}([A-Za-z][A-Za-z\-\'’]*(?:\s[A-Za-z][A-Za-z\-\'’]*){0,2})\s{1,4}(' + POS + r')\s+(.{2,120}?)(?=(?:\s{2,}\d{1,3}\s{1,3}[A-Za-z])|$)', re.S)

CJK = re.compile(r'[\u4e00-\u9fa5]')

entries, phrases = [], []
for i, page in enumerate(doc):
    raw = page.get_text("text")
    lines = [l.strip() for l in raw.split("\n") if l.strip()]
    section = ""
    keep = []
    for l in lines:
        if re.fullmatch(r'\d{1,3}', l):
            continue
        if re.search(r'第\s*\d+\s*套|Passage\s*\d|核心单词|重点短语|同义替换|高频|常考', l):
            section = l
            continue
        keep.append(l)
    joined = " ".join(keep)
    joined = re.sub(r'\s+', ' ', joined)
    joined = re.sub(r'(?<=[\u4e00-\u9fa5，。；：、（）])\s+(?=[\u4e00-\u9fa5，。；：、（）])', '', joined)
    for m in entry_re.finditer(joined):
        num, w, pos, mean = m.group(1), m.group(2).strip(), m.group(3), m.group(4).strip()
        if not CJK.search(mean):
            continue
        if len(w.split()) > 3:
            continue
        entries.append({"n": int(num), "w": w, "pos": pos, "meaning": mean, "page": i + 1,
                        "section": section or "核心单词", "raw": m.group(0)[:120]})
    # 短语/句子行（有中文、无词性）留作上下文素材
    for l in keep:
        if CJK.search(l) and not re.search(POS, l) and len(l) > 12:
            phrases.append({"page": i + 1, "text": l, "section": section})

print("entries", len(entries))
print("unique", len({e['w'].lower() for e in entries}))
print("multiword", sum(1 for e in entries if ' ' in e['w']))
print("phrases", len(phrases))
cnt = collections.Counter(e['section'] for e in entries)
print("sections", cnt.most_common(6))
for e in entries[:6]:
    print(" ", e['n'], e['w'], '|', e['pos'], '|', e['meaning'][:60])
print("...")
for e in entries[-6:]:
    print(" ", e['n'], e['w'], '|', e['pos'], '|', e['meaning'][:60])
weird = [e for e in entries if not re.fullmatch(r"[A-Za-z][A-Za-z\-'’ ]*", e['w'])]
print("weird", weird[:5])
json.dump({"entries": entries, "phrases": phrases},
          open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\parsed2.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
