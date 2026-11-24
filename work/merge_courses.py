import json, os, re, sys, csv
sys.stdout.reconfigure(encoding="utf-8")
base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
outdir = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs"

c1 = json.load(open(os.path.join(outdir, "vocab.json"), encoding="utf-8"))
words, conf = c1["words"], c1["confusables"]
stories = json.load(open(os.path.join(base, "stories.json"), encoding="utf-8"))
assert len(words) == 419, len(words)
new = json.load(open(os.path.join(base, "c2", "new_words.json"), encoding="utf-8"))

# 例句
ex = {}
for line in open(os.path.join(base, "c2", "examples.txt"), encoding="utf-8"):
    line = line.strip()
    if not line:
        continue
    f = line.split("|")
    assert len(f) == 4, line
    ex[f[0].lower()] = {"col": [x.strip() for x in f[1].split("；") if x.strip()], "en": f[2], "cn": f[3]}

c2names = {x["w"].lower() for x in json.load(open(os.path.join(base, "c2", "dedup.json"), encoding="utf-8"))["entries"]}
for w in words:
    w["courses"] = ["c1"] + (["c2"] if w["w"].lower() in c2names else [])

maxid = max(w["id"] for w in words)
added, missing_ex = [], []
for x in new:
    k = x["w"].lower()
    maxid += 1
    e = ex.get(k)
    if not e and x["tier"] == 1:
        missing_ex.append(x["w"])
    col = e["col"] if e else x["col"]
    added.append({
        "id": maxid, "w": x["w"], "pos": x["pos"], "cn": x["cn"],
        "hl": 0, "page": 0, "tier": x["tier"], "col": col or [],
        "ex": e["en"] if e else "", "excn": e["cn"] if e else "",
        "courses": ["c2"], "freq": x["freq"], "src": "2021–2026 仔细阅读",
    })
print("added", len(added), "tier1 without example:", missing_ex)
print("with ex:", sum(1 for x in added if x["ex"]))

allw = words + added
c1ids = [w["id"] for w in allw if "c1" in w["courses"]]
c2ids = [w["id"] for w in allw if "c2" in w["courses"]]
print("c1", len(c1ids), "c2", len(c2ids), "total unique", len(allw), "overlap", len(set(c1ids) & set(c2ids)))

courses = [
    {"id": "c1", "name": "阅读词汇 2017–2026", "short": "第一册", "ids": c1ids},
    {"id": "c2", "name": "仔细阅读 2021–2026", "short": "第二册", "ids": c2ids},
]
payload = {"words": allw, "confusables": conf, "stories": stories, "courses": courses}
json.dump(payload, open(os.path.join(outdir, "vocab.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

with open(os.path.join(outdir, "vocab.csv"), "w", encoding="utf-8-sig", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["序号", "单词", "词性", "释义", "分层", "原文重点", "课程", "出现次数", "常用搭配", "例句", "例句译文"])
    for d in allw:
        wr.writerow([d["id"], d["w"], d["pos"], d["cn"], d["tier"], d["hl"],
                     "+".join(d["courses"]), d.get("freq", ""), "；".join(d["col"]), d["ex"], d["excn"]])
print("wrote vocab.json/csv")
