# -*- coding: utf-8 -*-
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(base, "..", "outputs", "translate.json")
T = json.load(open(out, encoding="utf-8"))
FIX = {
    "x788": ["be located in / at / on", "be located in", "be located at", "be located on"],
    "x990": ["be originated from/in;derive from", "be originated from", "be originated in", "derive from"],
    "x1035": ["be located in/at", "be located in", "be located at"],
}
for it in T["items"]:
    if it["id"] in FIX:
        it["alts"] = FIX[it["id"]]
        print(it["id"], "->", it["alts"])
json.dump(T, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("done")
