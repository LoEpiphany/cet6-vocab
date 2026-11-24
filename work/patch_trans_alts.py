# -*- coding: utf-8 -*-
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(base, "..", "outputs", "translate.json")
T = json.load(open(out, encoding="utf-8"))
FIX = {
    "x789": ["be situated in / at; stand in / on", "be situated in", "be situated at", "stand in", "stand on"],
    "x790": ["lie at the junction of ... / on the border between and ...", "lie at the junction of", "on the border between"],
    "x1305": ["food waste reduction campaign (\"Clean Plate Campaign\")", "food waste reduction campaign", "Clean Plate Campaign"],
}
n = 0
for it in T["items"]:
    if it["id"] in FIX:
        it["alts"] = FIX[it["id"]]
        n += 1
        print(it["id"], it["en"])
        print("  alts ->", it["alts"])
json.dump(T, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("patched", n)
