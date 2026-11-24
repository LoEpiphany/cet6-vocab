import re, json, sys, io
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\stories.json"
lines = open(p, encoding="utf-8").read().split("\n")
out = []
pat = re.compile(r'^(\s*"(?:id|title|theme|intro|story|recall|t|s)"\s*:\s*")(.*)("\s*,?)\s*$')
for ln in lines:
    m = pat.match(ln)
    if not m:
        out.append(ln); continue
    head, val, tail = m.group(1), m.group(2), m.group(3)
    if '"' in val:
        buf, openq = [], True
        for ch in val:
            if ch == '"':
                buf.append("“" if openq else "”")
                openq = not openq
            else:
                buf.append(ch)
        val = "".join(buf)
    out.append(head + val + tail)
open(p, "w", encoding="utf-8").write("\n".join(out))
d = json.load(open(p, encoding="utf-8"))
print("units", len(d["units"]), "mnemonics", len(d["mnemonics"]))
print([u["title"] for u in d["units"]])
