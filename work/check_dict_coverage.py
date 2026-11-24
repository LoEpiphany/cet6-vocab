# -*- coding: utf-8 -*-
import json, re, html, sys
sys.stdout.reconfigure(encoding="utf-8")
s = open('../outputs/dict.js', encoding='utf-8').read()
D = json.loads(s[s.index('=') + 1:s.rstrip().rstrip(';').rfind('}') + 1])

def vis(x):
    x = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', x)
    x = re.sub(r'(?s)<[^>]+>', ' ', x)
    return html.unescape(x)

texts = []
def add(s):
    if isinstance(s, list):
        for x in s: add(x)
    elif isinstance(s, dict):
        for x in s.values(): add(x)
    elif isinstance(s, str):
        texts.append(s)

v = json.load(open('../outputs/vocab.json', encoding='utf-8'))
for w in v['words']:
    for k in ('w', 'col', 'ex', 'excn', 'cn', 'pos'): add(w.get(k))
for u in v['stories']['units']:
    for k in ('title', 'theme', 'intro', 'story', 'recall'): add(u.get(k))
for m in v['stories']['mnemonics']:
    for k in ('t', 's'): add(m.get(k))
t = json.load(open('../outputs/translate.json', encoding='utf-8'))
for x in t['items']:
    for k in ('en', 'cn', 'note'): add(x.get(k))
    add(x.get('alts')); add((x.get('ex') or {}).get('en')); add((x.get('ex') or {}).get('cn'))
for x in t.get('examples', []):
    add(x.get('en')); add(x.get('cn'))
for fn in ('manual_template.html', '../outputs/学习手册.html', 'app_template.html'):
    try: texts.append(vis(open(fn, encoding='utf-8').read()))
    except Exception: pass

toks = set()
for s in texts:
    for m in re.finditer(r"[A-Za-z][A-Za-z'’\-]*", s):
        q = m.group(0).lower().replace('’', "'").strip("'-")
        if len(q) >= 2: toks.add(q)

def cands(t):
    out = []
    def add(x):
        x = x.strip()
        if x and x not in out: out.append(x)
    add(t)
    add(t.replace("'s", ''))
    add(re.sub(r"s'$", '', t))
    if '-' in t:
        add(t.replace('-', ' ')); add(t.replace('-', ''))
        for x in t.split('-'): add(x)
    b = re.sub(r"'s$", '', t)
    for x in [b, re.sub('ies$', 'y', b), re.sub('ied$', 'y', b), re.sub('es$', '', b),
              re.sub('s$', '', b), re.sub('ed$', '', b), re.sub('ed$', 'e', b),
              re.sub('ing$', '', b), re.sub('ing$', 'e', b), re.sub('ly$', '', b),
              re.sub('er$', '', b), re.sub('est$', '', b), re.sub('ally$', 'al', b)]:
        add(x)
    return out

def find(t):
    cs = cands(t)
    for c in cs:
        if c in D['w']: return c
    for c in cs:
        if c in D['f'] and D['f'][c] in D['w']: return D['f'][c]
    return None

miss = sorted(t for t in toks if not find(t))
print('tokens', len(toks), 'resolved', len(toks) - len(miss), 'missing', len(miss),
      'coverage', round((len(toks) - len(miss)) / len(toks) * 100, 2))
print(miss)
