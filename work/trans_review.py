# -*- coding: utf-8 -*-
import json, re, collections
d=json.load(open("trans/parsed.json",encoding="utf-8"))
items=d["items"]
def has_cjk(s): return bool(re.search(r"[\u4e00-\u9fff]",s))
def has_lat(s): return bool(re.search(r"[A-Za-z]",s))
for m in ("terms","themes","freq"):
    arr=[x for x in items if m in x["mods"]]
    print("\n=====",m,len(arr),"=====")
    print("cat counts:",collections.Counter(x["cats"].get(m,"?") for x in arr))
    bad=[x for x in arr if has_lat(x["cn"]) or has_cjk(x["en"]) or len(x["cn"])>26 or len(x["en"])>70 or not x["en"] or not x["cn"]]
    print("anomalies",len(bad))
    for x in bad[:40]: print("  ",repr(x["cn"]),"|",repr(x["en"]),"|",x["cats"].get(m))
with open("trans/review_themes.txt","w",encoding="utf-8") as f:
    for x in items:
        if "themes" in x["mods"]:
            f.write(x["cats"]["themes"]+"\t"+x["cn"]+"\t"+x["en"]+"\t"+x["note"]+"\n")
with open("trans/review_freq.txt","w",encoding="utf-8") as f:
    for x in items:
        if "freq" in x["mods"]:
            f.write(str(x["cats"].get("freq",""))+"\t"+x["cn"]+"\t"+x["en"]+"\t"+x["note"]+"\n")
with open("trans/review_terms.txt","w",encoding="utf-8") as f:
    for x in items:
        if "terms" in x["mods"]:
            f.write(str(x["cats"].get("terms",""))+"\t"+x["cn"]+"\t"+x["en"]+"\n")
