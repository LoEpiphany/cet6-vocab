# -*- coding: utf-8 -*-
import json,re,random,collections
d=json.load(open("trans/parsed.json",encoding="utf-8"))
items=d["items"]
def has_cjk(s): return bool(re.search(r"[\u4e00-\u9fff]",s))
def has_lat(s): return bool(re.search(r"[A-Za-z]",s))
terms=[x for x in items if "terms" in x["mods"]]
print("dup pairs:",[k for k,v in collections.Counter((x["cn"],x["en"]) for x in terms).items() if v>1][:10])
odd=[x for x in terms if x["cn"].endswith(("（",")","(")) or len(x["en"])<2 or x["en"].startswith(("and ","or ")) or "  " in x["en"] or "编号" in x["cn"]]
print("odd",len(odd)); [print("  ",x["cn"],"|",x["en"]) for x in odd[:20]]
random.seed(3)
for x in random.sample(terms,25): print("  ",x["cats"]["terms"][:6],"|",x["cn"],"=>",x["en"])
print("examples",len(d["examples"]))
for e in d["examples"][:5]: print("  ",e["cn"],"=>",e["en"][:80])
