# -*- coding: utf-8 -*-
"""
从 ECDICT（MIT）抽取全站查词所需的子集，生成 outputs/dict.js。
只收录：全站正文出现过的词 + 四六级/考研常见词 + 常见度高的词。
不生成释义，全部释义/音标来自 ECDICT。
"""
import csv, json, os, re, sys, html, datetime
sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "..", "outputs")
CSV = os.path.join(BASE, "ecdict.csv")
DICT_JS = os.path.join(OUT, "dict.js")
META_JSON = os.path.join(BASE, "dict_meta.json")

V = json.load(open(os.path.join(OUT, "vocab.json"), encoding="utf-8"))
T = json.load(open(os.path.join(OUT, "translate.json"), encoding="utf-8"))

WORD_RE = re.compile(r"[A-Za-z][A-Za-z'’\-]*")
COMMON_TAGS = {"cet4", "cet6", "ky"}

def visible_text(s):
    s = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", s)
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return html.unescape(s)

def add_text(bucket, s):
    if isinstance(s, (list, tuple)):
        for x in s:
            add_text(bucket, x)
        return
    if isinstance(s, dict):
        for x in s.values():
            add_text(bucket, x)
        return
    if isinstance(s, str) and s:
        bucket.append(s)

corpus = []
for w in V["words"]:
    for k in ("w", "col", "ex", "excn", "cn", "pos"):
        add_text(corpus, w.get(k))
for u in V.get("stories", {}).get("units", []):
    for k in ("title", "theme", "intro", "story", "recall"):
        add_text(corpus, u.get(k))
for m in V.get("stories", {}).get("mnemonics", []):
    for k in ("t", "s"):
        add_text(corpus, m.get(k))
for x in T.get("items", []):
    for k in ("en", "cn", "note"):
        add_text(corpus, x.get(k))
    add_text(corpus, x.get("alts"))
    ex = x.get("ex")
    if isinstance(ex, dict):
        add_text(corpus, ex.get("en")); add_text(corpus, ex.get("cn"))
for x in T.get("examples", []):
    add_text(corpus, x.get("en")); add_text(corpus, x.get("cn"))

for fn in ("manual_template.html",):
    p = os.path.join(BASE, fn)
    if os.path.exists(p):
        corpus.append(visible_text(open(p, encoding="utf-8").read()))
p = os.path.join(OUT, "学习手册.html")
if os.path.exists(p):
    corpus.append(visible_text(open(p, encoding="utf-8").read()))
p = os.path.join(BASE, "app_template.html")
if os.path.exists(p):
    corpus.append(visible_text(open(p, encoding="utf-8").read()))

all_text = "\n".join(corpus)
tokens = set()
for m in WORD_RE.finditer(all_text):
    t = m.group(0).lower().replace("’", "'").strip("'-")
    if len(t) < 2:
        continue
    tokens.add(t)
    if "-" in t:
        for part in t.split("-"):
            if len(part) >= 2:
                tokens.add(part)

# 名词短语：翻译条目、搭配里出现的完整短语
phrases = set()
def norm_phrase(s):
    s = re.sub(r"\([^)]*\)", " ", s)
    s = s.replace("...", " ").replace("…", " ")
    s = re.sub(r"\s+", " ", s).strip(" ,;./")
    return s.lower()

for x in T.get("items", []):
    for s in [x.get("en", "")] + list(x.get("alts") or []):
        for part in re.split(r"\s*/\s*|\s*;\s*|\s+or\s+", s or ""):
            p = norm_phrase(part)
            if 2 <= len(p.split()) <= 5 and re.fullmatch(r"[a-z][a-z' \-]*", p):
                phrases.add(p)
for w in V["words"]:
    col = w.get("col")
    if isinstance(col, list):
        for c in col:
            p = norm_phrase(str(c))
            if 2 <= len(p.split()) <= 5 and re.fullmatch(r"[a-z][a-z' \-]*", p):
                phrases.add(p)

def clean_trans(tr):
    if not tr:
        return ""
    lines = tr.replace("\\n", "\n").split("\n")
    out = []
    for line in lines:
        line = re.sub(r"\s+", " ", line).strip()
        if not line:
            continue
        if line.startswith("[网络]") or line.startswith("[人名]") or line.startswith("[地名]"):
            continue
        line = re.sub(r"^\[[^\]]{1,8}\]\s*", "", line)
        if not line:
            continue
        if len(line) > 180:
            line = line[:178] + "…"
        out.append(line)
        if len(out) >= 2:
            break
    return "\n".join(out)

def parse_forms(ex):
    forms = []
    for part in (ex or "").split("/"):
        if ":" not in part:
            continue
        k, v = part.split(":", 1)
        if k in ("p", "d", "i", "3", "r", "t", "s"):
            for f in v.split(","):
                f = f.strip().lower()
                if f and f != "0":
                    forms.append(f)
    return forms

def is_common(row):
    tags = set((row.get("tag") or "").split())
    if tags & COMMON_TAGS:
        return True
    c = (row.get("collins") or "").strip()
    if c.isdigit() and int(c) >= 1:
        return True
    if (row.get("oxford") or "").strip() == "1":
        return True
    return False

selected = {}
selected_forms = {}
form_to_word = {}
rows = 0
with open(CSV, encoding="utf-8", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows += 1
        word = (row.get("word") or "").strip()
        if not word:
            continue
        low = word.lower()
        forms = parse_forms(row.get("exchange"))
        hit = low in tokens or is_common(row) or ((" " in low) and low in phrases) or bool(set(forms) & tokens)
        if not hit:
            continue
        trans = clean_trans(row.get("translation"))
        if not trans:
            continue
        # 同一个词可能有多条；优先释义更长、有音标的
        old = selected.get(low)
        if old and len(old[1]) >= len(trans):
            pass
        else:
            selected[low] = [(row.get("phonetic") or "").strip(), trans]
        for f in forms:
            if f != low and f not in form_to_word:
                form_to_word[f] = low
        if " " in low:
            # 短语条只保留带空格的写法，运行时优先整条查
            pass

# forms_out 保留所有变形映射（即使这个词形本身也收了条目，运行时仍可提示原形）
forms_out = {f: w for f, w in form_to_word.items() if f != w and w in selected}

phrases_out = {}
for p in sorted(phrases):
    if p in selected:
        phrases_out[p] = selected[p][1]

missing = sorted(t for t in tokens if t not in selected and t not in forms_out)

def runtime_cands(t):
    out = []
    def add(x):
        x = (x or "").strip()
        if x and x not in out:
            out.append(x)
    add(t)
    add(t.replace("'s", ""))
    add(re.sub(r"s'$", "", t))
    if "-" in t:
        add(t.replace("-", " "))
        add(t.replace("-", ""))
        for x in t.split("-"):
            add(x)
    b = re.sub(r"'s$", "", t)
    for x in [b, re.sub("ies$", "y", b), re.sub("ied$", "y", b), re.sub("es$", "", b),
              re.sub("s$", "", b), re.sub("ed$", "", b), re.sub("ed$", "e", b),
              re.sub("ing$", "", b), re.sub("ing$", "e", b), re.sub("ly$", "", b),
              re.sub("er$", "", b), re.sub("est$", "", b), re.sub("ally$", "al", b)]:
        add(x)
    # 英式拼写 -> 美式；non- 前缀
    for x in list(out):
        add(x.replace("isation", "ization").replace("ise", "ize").replace("ised", "ized").replace("ising", "izing"))
    for x in list(out):
        if x.startswith("non") and len(x) > 5:
            add(x[3:])
    return out

def runtime_find(t):
    cs = runtime_cands(t)
    for c in cs:
        if c in selected: return c
    for c in cs:
        if c in forms_out and forms_out[c] in selected: return forms_out[c]
    return None

unresolved = sorted(t for t in tokens if not runtime_find(t))
resolved_n = len(tokens) - len(unresolved)

meta = {
    "source": "ECDICT",
    "source_url": "https://github.com/skywind3000/ECDICT",
    "license": "MIT License",
    "author": "Linwei (skywind3000)",
    "count": len(selected),
    "forms": len(forms_out),
    "phrases": len(phrases_out),
    "corpus_tokens": len(tokens),
    "resolved_tokens": resolved_n,
    "coverage_pct": round(resolved_n / len(tokens) * 100, 1) if tokens else 0,
    "missing_tokens": len(unresolved),
    "missing_sample": unresolved[:30],
    "built": datetime.date.today().isoformat(),
}
payload = {"meta": meta, "w": selected, "f": forms_out, "p": phrases_out}
js = "window.__DICT_DATA__=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(DICT_JS, "w", encoding="utf-8").write(js)
json.dump(meta, open(META_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("rows", rows)
print("tokens", len(tokens), "phrases", len(phrases))
print("dict entries", len(selected), "forms", len(forms_out), "phrases_out", len(phrases_out))
print("missing tokens", len(missing), missing[:60])
print("dict.js bytes", os.path.getsize(DICT_JS))
