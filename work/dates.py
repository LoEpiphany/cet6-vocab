import json, os, sys, datetime
sys.stdout.reconfigure(encoding="utf-8")
base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
d = json.load(open(os.path.join(base, "words_raw.json"), encoding="utf-8"))
for s in ["2026-11-23", "2026-12-12", "2026-12-13"]:
    print(s, datetime.date.fromisoformat(s).strftime("%A"))
print("days to 12-12:", (datetime.date(2026,12,12) - datetime.date(2026,11,23)).days)
