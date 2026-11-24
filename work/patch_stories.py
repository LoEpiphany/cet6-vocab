# -*- coding: utf-8 -*-
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(base, "..", "outputs")

PATCH = {
    3: [("her job is to cultivate curiosity rather than to fill notebooks",
         "her job is to cultivate curiosity and nurture independent thinking rather than fill notebooks")],
    9: [("The council tried a restriction on disposable cups in public buildings, then a small penalty for shops that ignored it.",
         "The council tried a restriction that would prohibit disposable cups in public buildings, then a small penalty for shops that ignored it."),
        ("others said it would hurt sales", "others said the charge was excessive and would hurt sales")],
    10: [("a clearer account of what each side would accept as proof",
          "a clearer account of the justification each side would accept as proof")],
}

def patch_units(units):
    changed = 0
    for u in units:
        for old, new in PATCH.get(u["id"], []):
            if old not in u["story"]:
                raise SystemExit(f"unit {u['id']} 找不到原文: {old[:40]}")
            u["story"] = u["story"].replace(old, new)
            changed += 1
    return changed

sp = os.path.join(base, "stories.json")
sj = json.load(open(sp, encoding="utf-8"))
units = sj["units"] if isinstance(sj, dict) and "units" in sj else sj
print("stories.json 修改处:", patch_units(units))
json.dump(sj, open(sp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

vp = os.path.join(out, "vocab.json")
vj = json.load(open(vp, encoding="utf-8"))
print("vocab.json 修改处:", patch_units(vj["stories"]["units"]))
json.dump(vj, open(vp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# 复核：每个故事的目标词都能在正文里找到
import re
def forms(w):
    b = w.lower()
    o = [b]
    def add(f):
        if f not in o: o.append(f)
    if re.search(r"[^aeiou]y$", b): add(b[:-1] + "ies"); add(b[:-1] + "ied"); add(b + "ing")
    elif re.search(r"(s|x|z|ch|sh)$", b): add(b + "es"); add(b + "ed"); add(b + "ing")
    elif b.endswith("e"): add(b + "d"); add(b[:-1] + "ing"); add(b + "s")
    else: add(b + "s"); add(b + "ed"); add(b + "ing")
    add(b + "ly"); add(b + "er"); add(b + "est")
    return o
for u in vj["stories"]["units"]:
    text = u["story"].lower()
    miss = [w for w in u["words"] if not any(re.search(r"\b" + re.escape(f) + r"\b", text) for f in forms(w))]
    if miss: print("仍缺:", u["id"], miss)
print("复核完成")
