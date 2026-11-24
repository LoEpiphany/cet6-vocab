# -*- coding: utf-8 -*-
"""分块、可续传下载 ECDICT（GitHub raw 对 Range 友好）"""
import os, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ecdict.csv")
TOTAL = 66009548
CHUNK = 4 * 1024 * 1024

def size():
    return os.path.getsize(OUT) if os.path.exists(OUT) else 0

for attempt in range(40):
    have = size()
    if have >= TOTAL:
        print("done", have)
        break
    end = min(TOTAL - 1, have + CHUNK - 1)
    req = urllib.request.Request(URL, headers={
        "Range": f"bytes={have}-{end}",
        "User-Agent": "Mozilla/5.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            data = r.read()
        if not data:
            raise RuntimeError("empty chunk")
        with open(OUT, "ab") as f:
            f.write(data)
        print(f"chunk {have}-{end} +{len(data)} -> {size()}", flush=True)
    except Exception as e:
        print("retry", attempt, type(e).__name__, str(e)[:80], "at", size(), flush=True)
        time.sleep(2 + attempt % 5)
else:
    raise SystemExit("download failed")

print("final", size(), "expected", TOTAL)
