import re, sys, os
sys.stdout.reconfigure(encoding="utf-8")
html = open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs\index.html", encoding="utf-8").read()
m = re.search(r"<script>(.*?)</script>", html, re.S)
js = m.group(1)
open(r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work\check.js", "w", encoding="utf-8").write(js)
print("js chars", len(js))
