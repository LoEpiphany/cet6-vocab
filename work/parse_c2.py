import pymupdf, re, json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\六级仔细阅读词汇整理2021-20267703188035024158258.pdf"
doc = pymupdf.open(p)

POS = r'(?:n|v|vt|vi|adj|adv|prep|conj|pron|num|int|aux|phr)\.?(?:/[a-z]+\.?)?'
entry_re = re.compile(r'^\s*(\d{1,3})\s+([A-Za-z][A-Za-z\-\'\s]{0,45}?)\s{1,4}(' + POS + r')\s*(.*)$')

entries = []
context_lines = []
section = ""
for i, page in enumerate(doc):
    text = page.get_text("text")
    for ln in text.split("\n"):
        s = ln.strip()
        if not s:
            continue
        if re.search(r'第\s*\d+\s*套|Passage\s*\d|核心单词|重点短语|同义替换|高频词|常考搭配', s):
            section = s
            continue
        m = entry_re.match(ln)
        if m:
            num, w, pos, mean = m.groups()
            entries.append({"n": int(num), "w": w.strip(), "pos": pos.strip(), "meaning": mean.strip(),
                            "page": i + 1, "section": section, "raw": s})
        else:
            context_lines.append((i + 1, s, section))

print("entries:", len(entries))
print("unique words:", len({e['w'].lower() for e in entries}))
print("pages with entries:", len({e['page'] for e in entries}))
cnt = collections.Counter(e['section'] for e in entries)
print("sections sample:", list(cnt.items())[:8])

bad = [e for e in entries if len(e['w']) > 30 or not e['w'].strip()]
print("suspicious:", bad[:5])

print("---- first 12 ----")
for e in entries[:12]:
    print(e['n'], '|', e['w'], '|', e['pos'], '|', e['meaning'][:50], '| p', e['page'], '|', e['section'])
print("---- last 6 ----")
for e in entries[-6:]:
    print(e['n'], '|', e['w'], '|', e['pos'], '|', e['meaning'][:50], '| p', e['page'], '|', e['section'])
print("---- context samples ----")
for c in context_lines[:6]:
    print(c[0], '|', c[1][:90])

json.dump({"entries": entries}, open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\parsed.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
