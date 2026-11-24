import json, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\dedup.json", encoding="utf-8"))
c1 = json.load(open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs\vocab.json", encoding="utf-8"))["words"]
s1 = {w["w"].lower() for w in c1}

def split_senses(m):
    parts = re.split(r'[；;]', m)
    out, seen = [], set()
    for p in parts:
        p = p.strip().strip('。')
        if not p:
            continue
        key = re.sub(r'\s+', '', p)
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out

def mine_col(m):
    """从括号里挖搭配：只保留含英文字母的片段"""
    cols = []
    for inner in re.findall(r'[（(]([^（）()]{2,60})[）)]', m):
        for seg in re.split(r'[；;，,、]', inner):
            seg = seg.strip()
            if re.search(r'[A-Za-z]{2,}', seg) and re.search(r'[\u4e00-\u9fa5]', seg) is None:
                cols.append(seg)
    return cols

out = []
for e in d["entries"]:
    k = e["w"].lower()
    if k in s1:
        continue
    m = e["meaning"]
    cols = mine_col(m)
    bare = re.sub(r'[（(][^（）()]{2,60}[）)]', '', m)
    senses = split_senses(bare) or split_senses(m)
    senses = [s for s in senses if re.search(r'[\u4e00-\u9fa5]', s)]
    cn = '；'.join(senses[:4])
    cn = re.sub(r'\s+', '', cn)
    clean_cols = []
    for c in cols:
        c = re.sub(r'^(常接|常与|搭配|固定搭配)[:：]?', '', c).strip()
        if re.search(r'[A-Za-z]{2,}', c):
            clean_cols.append(c)
    tier = 1 if e["freq"] >= 3 else (2 if e["freq"] == 2 else 3)
    out.append({"w": e["w"], "pos": e["pos"], "cn": cn, "freq": e["freq"],
                "tier": tier, "col": clean_cols[:2], "page": e["page"], "src": "c2"})

print("new words", len(out))
print("tiers", collections.Counter(x["tier"] for x in out))
print("with col", sum(1 for x in out if x["col"]))
hi = [x for x in out if x["freq"] >= 3]
print("freq>=3 new:", len(hi))
print(",".join(x["w"] for x in hi))
json.dump(out, open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\new_words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
