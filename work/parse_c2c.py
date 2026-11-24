import pymupdf, re, json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\六级仔细阅读词汇整理2021-20267703188035024158258.pdf"
doc = pymupdf.open(p)

POS = r'(?:n|v|vt|vi|adj|adv|prep|conj|pron|num|aux)\.(?:/[a-z]+\.)?'
head_re = re.compile(r'^(\d{1,3})\s+([A-Za-z][A-Za-z\-\'’]*(?:\s[A-Za-z][A-Za-z\-\'’]*){0,2})\s+(' + POS + r')\s*(.*)$')
num_re = re.compile(r'^(\d{1,3})\s+(.*)$')
CJK = re.compile(r'[\u4e00-\u9fa5]')

entries, phrases = [], []
cur = None
section = ""
for i, page in enumerate(doc):
    lines = [l.strip() for l in page.get_text("text").split("\n") if l.strip()]
    for l in lines:
        if re.fullmatch(r'\d{1,3}', l):
            continue
        if re.search(r'第\s*\d+\s*套|Passage\s*\d|核心单词|重点短语|同义替换|高频词|常考搭配', l):
            section = l
            if cur: entries.append(cur); cur = None
            continue
        m = head_re.match(l)
        if m and len(m.group(2)) <= 30:
            if cur: entries.append(cur)
            cur = {"n": int(m.group(1)), "w": m.group(2).strip(), "pos": m.group(3),
                   "meaning": m.group(4).strip(), "page": i + 1, "section": section or "核心单词"}
            continue
        m2 = num_re.match(l)
        if m2 and cur:
            entries.append(cur); cur = None
            phrases.append({"n": int(m2.group(1)), "text": m2.group(2).strip(), "page": i + 1, "section": section})
            continue
        if cur and not re.fullmatch(r'[A-Za-z]{1,10}', l):
            cur["meaning"] += l
            continue
        if cur:
            entries.append(cur); cur = None
if cur: entries.append(cur)

for e in entries:
    e["meaning"] = re.sub(r'\s+', ' ', e["meaning"]).strip()

entries = [e for e in entries if CJK.search(e["meaning"])]
print("entries", len(entries), "unique", len({e['w'].lower() for e in entries}))
print("phrases", len(phrases))
print("sections", collections.Counter(e['section'] for e in entries).most_common(5))
for e in entries[:8]: print("  ", e['n'], e['w'], '|', e['pos'], '|', e['meaning'][:60], '| p', e['page'], '|', e['section'])
print("  ...")
for e in entries[-5:]: print("  ", e['n'], e['w'], '|', e['pos'], '|', e['meaning'][:60], '| p', e['page'])
print("weird:", [e['w'] for e in entries if not re.fullmatch(r"[A-Za-z][A-Za-z\-'’ ]*", e['w'])][:8])
print("long meaning:", sum(1 for e in entries if len(e['meaning']) > 90))
print("phrase samples:")
for x in phrases[:5]: print("  ", x['n'], x['text'][:80])
json.dump({"entries": entries, "phrases": phrases},
          open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\parsed3.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
