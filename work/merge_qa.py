import os, re, json, sys, glob
sys.stdout.reconfigure(encoding="utf-8")

base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
raw = os.path.join(base, "raw")
rows = []
for p in sorted(glob.glob(os.path.join(raw, "p*.tsv"))):
    page = int(re.search(r"p(\d+)", os.path.basename(p)).group(1))
    for line in open(p, encoding="utf-8"):
        line = line.rstrip("\n")
        if not line.strip():
            continue
        f = line.split("\t")
        assert len(f) == 4, (p, line, len(f))
        rows.append({"id": int(f[0]), "word": f[1].strip(), "pos": f[2].strip(), "mean": f[3].strip(), "page": page})

print("rows", len(rows))
ids = [r["id"] for r in rows]
missing = [i for i in range(1, 420) if i not in set(ids)]
dups = [i for i in set(ids) if ids.count(i) > 1]
print("missing ids", missing)
print("dup ids", dups)

from collections import Counter
c = Counter(r["word"].lower() for r in rows)
print("dup words", [w for w, n in c.items() if n > 1])

# 词语长度/paren 检查
odd = [r for r in rows if not re.fullmatch(r"[A-Za-z][A-Za-z\- ]*", r["word"])]
print("odd words", odd)

HI = {
 1: [7,9,10,11,13,15,24,27,28,30,34,39,40],
 2: [42,47,48,51,58,61,64,67,69,70,77,78,80,81,82],
 3: [86,89,93,95,99,100,103,104,105,107,112,114],
 4: [127,128,130,133,137,138,139,140,154,157,160,166],
 5: [172,189,196],
 6: [211,218,220,224,225,236,238,242,243,244,246,250],
 7: [259,260,261,270,273,278,281,283,285,292],
 8: [294,296,297,306,308,314,322,326,329,332],
 9: [338,341,343,345,346,352,357,358,359],
 10: [],
}
hi_ids = set()
for p, lst in HI.items():
    for i in lst:
        hi_ids.add(i)
        assert rows[i-1]["page"] == p, (i, p, rows[i-1]["page"])
print("highlight count", len(hi_ids))

for r in rows:
    r["hl"] = 1 if r["id"] in hi_ids else 0

json.dump(rows, open(os.path.join(base, "words_raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok")
