import json, os, re, sys, csv, glob
sys.stdout.reconfigure(encoding="utf-8")

base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
outdir = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs"

words = json.load(open(os.path.join(base, "words_raw.json"), encoding="utf-8"))
by_id = {w["id"]: w for w in words}

enr = {}
for p in sorted(glob.glob(os.path.join(base, "enrich", "e*.txt"))):
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        f = line.split("|")
        assert len(f) == 5, (p, line, len(f))
        i = int(f[0])
        assert i not in enr, i
        enr[i] = {"tier": int(f[1]), "col": [c.strip() for c in f[2].split("；") if c.strip()],
                  "en": f[3].strip(), "cn": f[4].strip()}

missing = [i for i in range(1, 420) if i not in enr]
print("enrich missing:", missing)
assert not missing

bad_sentence = []
for i, e in enr.items():
    w = by_id[i]["word"].lower()
    stem = w[:max(4, len(w) - 3)]
    if stem not in e["en"].lower():
        bad_sentence.append((i, by_id[i]["word"], e["en"]))
print("sentences not containing headword:", bad_sentence)

conf = []
names = {w["word"].lower() for w in words}
for line in open(os.path.join(base, "confusables.txt"), encoding="utf-8"):
    line = line.strip()
    if not line:
        continue
    left, note = line.split("::")
    ws = [x.strip() for x in left.split("/")]
    notfound = [x for x in ws if x.lower() not in names]
    if notfound:
        print("CONF MISMATCH", ws, notfound)
        continue
    conf.append({"w": ws, "note": note.strip()})
print("confusable groups:", len(conf))

data = []
for w in words:
    e = enr[w["id"]]
    data.append({
        "id": w["id"], "w": w["word"], "pos": w["pos"], "cn": w["mean"],
        "hl": w["hl"], "page": w["page"], "tier": e["tier"],
        "col": e["col"], "ex": e["en"], "excn": e["cn"],
    })

tiers = {1: 0, 2: 0, 3: 0}
for d in data:
    tiers[d["tier"]] += 1
print("tiers", tiers)

json.dump({"words": data, "confusables": conf},
          open(os.path.join(outdir, "vocab.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

with open(os.path.join(outdir, "vocab.csv"), "w", encoding="utf-8-sig", newline="") as f:
    wr = csv.writer(f)
    wr.writerow(["序号", "单词", "词性", "释义", "分层", "原文重点", "原页", "常用搭配", "例句", "例句译文"])
    for d in data:
        wr.writerow([d["id"], d["w"], d["pos"], d["cn"], d["tier"], d["hl"], d["page"], "；".join(d["col"]), d["ex"], d["excn"]])
print("wrote vocab.json / vocab.csv")
