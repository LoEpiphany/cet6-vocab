import io, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\app_template.html"
t = open(p, encoding="utf-8").read()
a = t.index("/* ---------- 出题 ---------- */")
b = t.index("/* ---------- 卡片 ---------- */")
new = open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\new_quiz.txt", encoding="utf-8").read()
t = t[:a] + new + "\n" + t[b:]
open(p, "w", encoding="utf-8").write(t)
print("spliced, chars", len(t))
