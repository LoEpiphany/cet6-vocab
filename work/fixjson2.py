import re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\stories.json"
lines = open(p, encoding="utf-8").read().split("\n")
out = []

def fix(val):
    if '"' not in val:
        return val
    buf, openq = [], True
    for ch in val:
        if ch == '"':
            buf.append("“" if openq else "”")
            openq = not openq
        else:
            buf.append(ch)
    return "".join(buf)

pat_m = re.compile(r'^(\s*\{\s*"id"\s*:\s*\d+,\s*"t"\s*:\s*"[^"]*"\s*,\s*"s"\s*:\s*")(.*)("\s*\}?,?)\s*$')
pat_s = re.compile(r'^(\s*"(?:id|title|theme|intro|story|recall|t|s)"\s*:\s*")(.*)("\s*,?)\s*$')
for ln in lines:
    m = pat_m.match(ln) or pat_s.match(ln)
    if not m:
        out.append(ln); continue
    out.append(m.group(1) + fix(m.group(2)) + m.group(3))
open(p, "w", encoding="utf-8").write("\n".join(out))
d = json.load(open(p, encoding="utf-8"))
print("units", len(d["units"]), "mnemonics", len(d["mnemonics"]))
