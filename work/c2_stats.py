import json, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\parsed3.json", encoding="utf-8"))
E = d["entries"]
c1 = json.load(open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs\vocab.json", encoding="utf-8"))["words"]
s1 = {w["w"].lower() for w in c1}

def clean(m):
    m = re.sub(r'(固定搭配|重点短语|同义替换|高频词|常考搭配)+$', '', m).strip()
    m = re.sub(r'([a-z])to\s?(sth|do|sb)', lambda x: x.group(1) + ' to ' + x.group(2), m)
    return m

cnt = collections.Counter()
first = {}
for e in E:
    k = e["w"].lower()
    cnt[k] += 1
    if k not in first:
        first[k] = e
    else:
        if e["meaning"] and e["meaning"] not in first[k]["meaning"]:
            first[k]["meaning"] += "；" + e["meaning"]

for k, e in first.items():
    e["meaning"] = clean(e["meaning"])
    e["freq"] = cnt[k]

print("unique", len(first))
print("overlap with c1", len(set(first) & s1))
print("new", len(set(first) - s1))
dist = collections.Counter(cnt.values())
print("freq dist", sorted(dist.items())[:12], "max", max(cnt.values()))
for th in (2, 3, 4, 5, 6):
    print("freq>=%d: %d words (new only %d)" % (th, sum(1 for k, v in cnt.items() if v >= th),
          sum(1 for k, v in cnt.items() if v >= th and k not in s1)))
top = sorted(first.values(), key=lambda x: (-x["freq"], x["w"]))[:15]
for e in top: print("  ", e["freq"], e["w"], e["pos"], e["meaning"][:50])
json.dump({"entries": list(first.values()), "phrases": d["phrases"]},
          open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\c2\dedup.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
