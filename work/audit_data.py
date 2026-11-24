# -*- coding: utf-8 -*-
import json, re, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(base, "..", "outputs")
V = json.load(open(os.path.join(out, "vocab.json"), encoding="utf-8"))
T = json.load(open(os.path.join(out, "translate.json"), encoding="utf-8"))
words = V["words"]
idx = {w["w"].lower(): w for w in words}

def blank_match(text, word):
    escw = re.escape(word)
    m = re.search(r"\b" + escw + r"[a-z]*\b", text, re.I)
    if not m:
        stem = re.escape(word[:max(4, len(word) - 3)])
        m = re.search(r"\b" + stem + r"[a-z]*\b", text, re.I)
    return m.group(0) if m else None

def forms(w):
    b = w.lower().strip()
    out = [b]
    def add(f):
        if f and f not in out: out.append(f)
    if re.search(r"[^aeiou]y$", b):
        add(b[:-1] + "ies"); add(b[:-1] + "ied"); add(b + "ing")
    elif re.search(r"(s|x|z|ch|sh)$", b):
        add(b + "es"); add(b + "ed"); add(b + "ing")
    elif b.endswith("e"):
        add(b + "d"); add(b[:-1] + "ing"); add(b + "s")
    else:
        add(b + "s"); add(b + "ed"); add(b + "ing")
    add(b + "ly"); add(b + "er"); add(b + "est")
    return out

print("=== 词条基础字段 ===")
for key in ("w", "cn", "pos"):
    bad = [w["w"] for w in words if not str(w.get(key, "")).strip()]
    print(f"空 {key}: {len(bad)} {bad[:8]}")
print("空 col:", sum(1 for w in words if not w.get("col")),
      " 空 ex:", sum(1 for w in words if not w.get("ex")),
      " 有 ex 但空 excn:", sum(1 for w in words if w.get("ex") and not w.get("excn")))
for course in ("c1", "c2"):
    sub = [w for w in words if course in w.get("courses", [])]
    print(f"{course}: {len(sub)} 词 · 空例句 {sum(1 for w in sub if not w.get('ex'))} · 空搭配 {sum(1 for w in sub if not w.get('col'))}")
seen = {}
for w in words: seen.setdefault(w["w"].lower(), []).append(w["id"])
print("重复词:", {k: v for k, v in seen.items() if len(v) > 1})
print("重复 id:", len(words) - len({w["id"] for w in words}))

print("=== 例句挖空匹配 ===")
miss = [w["w"] for w in words if w.get("ex") and not blank_match(w["ex"], w["w"])]
print("例句里找不到目标词:", len(miss), miss[:20])

print("=== 故事高亮覆盖 ===")
units = V.get("stories", {}).get("units", [])
for u in units:
    text = u["story"].lower()
    absent = [w for w in u["words"] if not any(re.search(r"\b" + re.escape(f) + r"\b", text) for f in forms(w))]
    not_in_vocab = [w for w in u["words"] if w.lower() not in idx]
    dup = len(u["words"]) - len(set(u["words"]))
    if absent or not_in_vocab or dup:
        print(u["id"], u["title"], "缺词:", absent, "不在词库:", not_in_vocab, "重复:", dup)

print("=== 翻译条目 ===")
items = T["items"]
print("空 cn:", sum(1 for x in items if not str(x.get("cn", "")).strip()),
      " 空 en:", sum(1 for x in items if not str(x.get("en", "")).strip()))
print("空 alts:", sum(1 for x in items if not x.get("alts")))
for m in T["modules"]:
    sub = [x for x in items if m["id"] in x.get("mods", [])]
    no_cat = [x["id"] for x in sub if not x.get("cats", {}).get(m["id"])]
    print(f"{m['id']}: {len(sub)} 条 · 缺分类 {len(no_cat)} · 有例句 {sum(1 for x in sub if x.get('ex'))}")
noex = [x["id"] for x in items if "freq" in x.get("mods", []) and not x.get("ex")]
print("freq 无例句:", len(noex), noex[:12])
badblank = []
for x in items:
    if x.get("ex"):
        probe = x["en"].split(" / ")[0]
        if not blank_match(x["ex"]["en"], probe):
            badblank.append((x["id"], probe, x["ex"]["en"][:60]))
print("翻译例句挖不到目标:", len(badblank), badblank[:8])
noexcn = [x["id"] for x in items if x.get("ex") and not x["ex"].get("cn")]
print("翻译例句缺中文:", len(noexcn), noexcn[:8])
