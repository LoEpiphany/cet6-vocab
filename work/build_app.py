import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")

base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
outdir = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs"

data = json.load(open(os.path.join(outdir, "vocab.json"), encoding="utf-8"))
words, conf, stories = data["words"], data["confusables"], data["stories"]
courses = data["courses"]
trans = json.load(open(os.path.join(outdir, "translate.json"), encoding="utf-8"))
essay = json.load(open(os.path.join(outdir, "essay.json"), encoding="utf-8"))
assert len(courses) == 2, courses
assert sum(1 for w in words if "c1" in w["courses"]) == 419
assert trans["total"] == 1325, trans["total"]
assert essay["meta"]["counts"]["patterns"] >= 100, essay["meta"]["counts"]

tiers = {1: 0, 2: 0, 3: 0}
for w in words:
    tiers[w["tier"]] += 1
print("courses:", [(c["id"], c["name"], len(c["ids"])) for c in courses])
print("tiers:", tiers, "total", len(words), "overlap", len(set(courses[0]["ids"]) & set(courses[1]["ids"])))
print("trans:", [(m["id"], m["count"]) for m in trans["modules"]], "total", trans["total"])
print("essay:", essay["meta"]["counts"])

payload = json.dumps({"words": words, "confusables": conf, "stories": stories, "courses": courses,
                      "trans": trans, "essay": essay}, ensure_ascii=False, separators=(",", ":"))
tpl = open(os.path.join(base, "app_template.html"), encoding="utf-8").read()
assert "__DATA__" in tpl and "__TRANS_JS__" in tpl and "__ESSAY_JS__" in tpl
transjs = open(os.path.join(base, "trans_app.js"), encoding="utf-8").read()
focusjs = open(os.path.join(base, "focus_app.js"), encoding="utf-8").read()
essayjs = open(os.path.join(base, "essay_app.js"), encoding="utf-8").read()
html = (tpl.replace("__DATA__", payload).replace("/*__TRANS_JS__*/", transjs)
           .replace("/*__FOCUS_JS__*/", focusjs).replace("/*__ESSAY_JS__*/", essayjs))
open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(html)
print("index.html bytes:", len(html.encode("utf-8")))
