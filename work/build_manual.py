import json, os, re, sys, datetime
sys.stdout.reconfigure(encoding="utf-8")

base = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\work"
outdir = r"c:\Users\Lenovo\Desktop\关于六级\2026-11-23\cet6-vocab\outputs"

wj = json.load(open(os.path.join(outdir, "vocab.json"), encoding="utf-8"))
words = wj["words"]
by = {w["id"]: w for w in words}
byname = {w["w"].lower(): w for w in words}
st = json.load(open(os.path.join(base, "stories.json"), encoding="utf-8"))

def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def hi(text, words_):
    def forms(w):
        b = w.lower().strip()
        out = [b]
        def add(f):
            if f and f not in out: out.append(f)
        if re.search(r"[^aeiou]y$", b):
            add(b[:-1] + "ies"); add(b[:-1] + "ied"); add(b + "ing")
        elif re.search(r"(s|x|z|ch|sh)$", b):
            add(b + "es"); add(b + "ed"); add(b + "ing")
        elif b.endswith("e"):
            add(b + "d"); add(b[:-1] + "ing"); add(b + "s")
        else:
            add(b + "s"); add(b + "ed"); add(b + "ing")
        add(b + "ly"); add(b + "er"); add(b + "est")
        return out
    mapping = {}
    for w in words_:
        for f in forms(w):
            mapping.setdefault(f, w)
    pats = sorted(mapping, key=len, reverse=True)
    if not pats:
        return esc(text)
    rex = re.compile(r"\b(" + "|".join(re.escape(x) for x in pats) + r")\b", re.I)
    return rex.sub(lambda m: "<b>" + m.group(0) + "</b>", esc(text))

# ---------- 故事（手册放 4 组示范） ----------
picks = [1, 3, 6, 8]
blocks = []
for uid in picks:
    u = next(x for x in st["units"] if x["id"] == uid)
    wl = []
    for x in u["words"]:
        w = byname.get(x.lower())
        wl.append("<b>%s</b> %s %s" % (esc(w["w"]), esc(w["pos"]), esc(w["cn"].split("；")[0])))
    blocks.append(
        '<div class="card">'
        '<div><span class="tag">%s</span><span class="tag sand">第 %d 组 · 10 词</span></div>'
        '<h3>%s</h3>'
        '<p class="small">%s</p>'
        '<div class="story">%s</div>'
        '<div class="words">%s</div>'
        '<div class="recall"><b>中文串记（合上英文再看）：</b>%s</div>'
        '</div>' % (esc(u["theme"]), uid, esc(u["title"]), esc(u["intro"]),
                    hi(u["story"], u["words"]), "<br>".join(wl), esc(u["recall"]))
    )

# ---------- 助记表 ----------
mrows = []
for m in st["mnemonics"]:
    w = by.get(m["id"])
    if not w:
        continue
    mrows.append('<tr><td><b>%s</b><br><span class="small">%s %s</span></td><td>%s</td><td>%s</td></tr>'
                 % (esc(w["w"]), esc(w["pos"]), esc(w["cn"].split("；")[0]), esc(m["t"]), esc(m["s"])))

# ---------- 计划 ----------
start = datetime.date(2026, 11, 23)
exam = datetime.date(2026, 12, 12)
c1words = [w for w in words if "c1" in w.get("courses", [])]
L1 = [w for w in c1words if w["tier"] == 1]
L2 = [w for w in c1words if w["tier"] == 2]
L3 = [w for w in c1words if w["tier"] == 3]
days = (exam - start).days  # 19
# 分配：L1 前4天，L2 8天，L3 5天，最后2天不学新词
alloc = []
for i in range(4):
    alloc.append(("L1 高频必拿", L1[i * len(L1) // 4:(i + 1) * len(L1) // 4]))
for i in range(8):
    alloc.append(("L2 核心进阶", L2[i * len(L2) // 8:(i + 1) * len(L2) // 8]))
for i in range(5):
    alloc.append(("L3 扩展巩固", L3[i * len(L3) // 5:(i + 1) * len(L3) // 5]))
alloc.append(("补漏 + 真题", []))
alloc.append(("只复习，不学新词", []))

newcounts = [len(x[1]) for x in alloc]
print("new per day:", newcounts, "sum", sum(newcounts))

rows = []
for i in range(days + 1):
    d = start + datetime.timedelta(days=i)
    if i < len(alloc):
        theme, batch = alloc[i]
        n = len(batch)
    else:
        theme, n = "考试", 0
    # 复习估算：+1天全部、+3天85%、+7天70%、+15天60%
    rev = 0
    for back, rate in ((1, 1.0), (3, .85), (7, .7), (15, .6)):
        j = i - back
        if 0 <= j < len(newcounts):
            rev += newcounts[j] * rate
    rev = int(round(rev))
    if d == exam:
        rows.append('<tr class="today"><td>%s（周六）</td><td>0</td><td>0</td><td>考试日：早上只过错词卡，进考场</td></tr>' % d.strftime("%m-%d"))
    else:
        note = theme
        if i == len(alloc):
            note = "考前一天：错题本 + 加强队列，两轮；下午限时一套真题阅读"
        rows.append('<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td></tr>' % (d.strftime("%m-%d"), n, rev, esc(note)))

phases = (
    '<div class="card"><table>'
    '<tr><th style="width:26%">阶段</th><th style="width:22%">日期</th><th style="width:14%">词量</th><th>重点</th></tr>'
    f'<tr><td><b>一 · 拿必得分</b></td><td>11/23 – 11/26</td><td>L1 {len(L1)}</td><td>第一册原文标注重点词，每天约 24 个，优先吃透</td></tr>'
    f'<tr><td><b>二 · 扩核心</b></td><td>11/27 – 12/04</td><td>L2 {len(L2)}</td><td>每天约 25 个，同时回刷 L1 错词</td></tr>'
    f'<tr><td><b>三 · 扫扩展</b></td><td>12/05 – 12/09</td><td>L3 {len(L3)}</td><td>每天约 26 个，重心转向错题与加强队列</td></tr>'
    '<tr><td><b>四 · 收口</b></td><td>12/10 – 12/11</td><td>0</td><td>不学新词：错词、加强队列、限时真题</td></tr>'
    '</table>'
    f'<p class="small">以上是第一册主线：L1 用 4 天、L2 用 8 天、L3 用 5 天，共 17 天推完 {len(c1words)} 词，剩下 2 天专门补漏。第二册另开一门课推进：先过 L1+L2 共 484 词，每天 20–30 个；L3 只求认得。每天新词量可在工具「计划」页调整。</p>'
    '</div>'
)

tpl = open(os.path.join(base, "manual_template.html"), encoding="utf-8").read()
dmeta = json.load(open(os.path.join(base, "dict_meta.json"), encoding="utf-8"))
dsize = os.path.getsize(os.path.join(outdir, "dict.js")) / 1024 / 1024
dict_info = (
    '<ul>'
    f'<li>收录 <b>{dmeta["count"]:,}</b> 个词条、{dmeta["forms"]:,} 个词形、{dmeta["phrases"]} 条短语。</li>'
    f'<li>覆盖全站正文 {dmeta["corpus_tokens"]:,} 个英文词形中的 {dmeta["resolved_tokens"]:,} 个'
    f'（{dmeta["coverage_pct"]}%）；未覆盖的 {dmeta["missing_tokens"]} 个主要是人名、缩写、专名和少量新词。</li>'
    '<li>来源：<a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">ECDICT</a>'
    f'（作者 {dmeta["author"]}），<b>{dmeta["license"]}</b>；释义、音标均取自该开源词典，未自行编写。</li>'
    '<li>许可证全文：<a href="ECDICT-LICENSE.txt">ECDICT-LICENSE.txt</a>（MIT，Copyright (c) 2025 Linwei）。</li>'
    f'<li>文件：<code>dict.js</code>，{dsize:.1f} MB；首次点词才加载，不参与首屏。</li>'
    '</ul>'
)
vocab_keys = json.dumps([w["w"].lower() for w in words], ensure_ascii=False, separators=(",", ":"))
html = (tpl.replace("__STORIES__", "\n".join(blocks))
           .replace("__MNEMONICS__", "\n".join(mrows))
           .replace("__PHASES__", phases)
           .replace("__PLANTABLE__", "\n".join(rows))
           .replace("__DICT_INFO__", dict_info)
           .replace("__VOCAB_KEYS__", vocab_keys))
open(os.path.join(outdir, "学习手册.html"), "w", encoding="utf-8").write(html)
print("manual bytes:", len(html.encode("utf-8")))
