# -*- coding: utf-8 -*-
"""解析三份翻译讲义文本 -> work/trans/parsed.json"""
import re, json, os

BASE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(BASE, 'trans')

CJK = re.compile(r'[\u4e00-\u9fff]')
LAT = re.compile(r'[A-Za-z]')

def read(fn):
    with open(os.path.join(T, fn), encoding='utf-8') as f:
        return [l.rstrip('\n') for l in f]

def clean_en(s):
    """把英文表达里的中文注释剥出来，返回 (en, note)"""
    note = []
    s = s.replace('／', '/').replace('（', '(').replace('）', ')')
    s = s.replace('，', ';').replace('；', ';').replace('、', ',')
    s = re.sub(r'(\w)-\s+(\w)', r'\1-\2', s)
    for m in re.findall(r'\(([^()]*[\u4e00-\u9fff][^()]*)\)', s):
        note.append(m.strip())
    s = re.sub(r'\([^()]*[\u4e00-\u9fff][^()]*\)', '', s)
    # 括号里纯英文的，去掉括号
    s = re.sub(r'\(([A-Za-z0-9 .,\'/&-]+)\)', r'\1', s)
    s = re.sub(r'[\u4e00-\u9fff]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,;.')
    return s, ' / '.join(note)

def variants(en):
    out = [en]
    for part in re.split(r'\s*/\s*|\s*;\s*|\s+or\s+', en):
        part = part.strip(' ,;.')
        # 压缩写法会切出 at / on 这类碎片，不能当成可判对的完整答案
        if len(part.split()) == 1 and len(part) <= 4:
            continue
        if part and part.lower() not in [x.lower() for x in out]:
            out.append(part)
    return out

# ---------------- terms ----------------
def parse_terms():
    lines = read('terms.txt')
    big, sub, group = '', '', 0
    items = []
    last = None
    for raw in lines:
        s = raw.strip()
        if not s: continue
        if re.match(r'^第\s*\d+\s*页\s*共\s*\d+\s*页$', s): continue
        if s in ('编号', '中文术语 英文表达'): continue
        if re.match(r'^\d+\.\s*$', s):
            group = int(s.split('.')[0]); last = None; continue
        m = re.match(r'^([1-7])\.\s+(.+)$', s)
        if m and not LAT.search(m.group(2)):
            big = m.group(2).strip(); sub = ''; last = None; continue
        if not LAT.search(s):
            if 2 <= len(s) <= 40: sub = s
            last = None
            continue
        # 拆中英
        L = None
        for i, ch in enumerate(s):
            if ch.isascii() and ch.isalpha():
                L = i; break
        if L is None: continue
        prefix = s[:L]
        if prefix.count('（') > prefix.count('）'):
            j = s.find('）', L)
            if j != -1: L = j + 1
        cn, en = s[:L].strip(), s[L:].strip()
        m2 = re.search(r'\s+([\d][\d.,]*)\s*$', cn)
        if m2 and en:
            en = m2.group(1) + ' ' + en
            cn = cn[:m2.start()].strip()
        if not cn:
            # 英文续行，接到上一条
            if last is not None:
                last['en'] += ' ' + en
                last['alts'] = variants(last['en'])
            continue
        en, note = clean_en(en)
        if not en: continue
        it = {'m': 'terms', 'cat': big, 'sub': sub, 'group': group,
              'cn': cn, 'en': en, 'alts': variants(en), 'note': note}
        items.append(it); last = it
    return items

# ---------------- themes ----------------
WATER = re.compile(r'^(邹老师四六级|邹老师|邹老|六级|抢自评|驰创)+$')
NOTE_HINT = ('注意', '一般', '这三个词', '简写', '都主动', '无被动', '这三个')

def split_theme_line(s):
    """返回 (cn, en_raw) 或 None"""
    s = s.replace('，', ';').replace('；', ';').replace('／', '/').replace(' 或', ';')
    cl = CJK.search(s)
    ll = LAT.search(s)
    if not cl or not ll: return None
    if ll.start() < cl.start():
        return s[cl.start():], s[:cl.start()], ''
    idx = ll.start()
    if s[:idx].count('(') > s[:idx].count(')') or s[:idx].count('（') > s[:idx].count('）'):
        p = max(s.rfind('(', 0, idx), s.rfind('（', 0, idx))
        j = max(s.find(')', idx), s.find('）', idx))
        if j != -1:
            idx = j + 1
            if p != -1: cn_end = p
            else: cn_end = idx
        else:
            cn_end = idx
    else:
        cn_end = idx
    cn, en_raw = s[:cn_end], s[idx:]
    # 在括号外遇到中文：若前面有中文标点，就在标点处截断，后半段当注释
    depth, cut = 0, None
    for i, ch in enumerate(en_raw):
        if ch in '(（': depth += 1
        elif ch in ')）': depth = max(0, depth - 1)
        elif depth == 0 and CJK.match(ch):
            for k in range(i - 1, -1, -1):
                if en_raw[k] in ';，。、':
                    cut = k; break
            break
    note = ''
    if cut is not None:
        note = en_raw[cut + 1:]; en_raw = en_raw[:cut]
    cn = cn.strip(' 　:：-—').strip()
    return cn, en_raw, note

def parse_themes():
    lines = read('themes.txt')
    cat, items, last = '', [], None
    for raw in lines:
        s = raw.strip()
        if not s or WATER.match(s): continue
        if re.match(r'^[一二三四五六]、', s):
            cat = s; last = None; continue
        if s.endswith('类') and len(s) <= 12 and not LAT.search(s):
            cat = s; continue
        if not LAT.search(s):
            if CJK.search(s) and len(s) <= 30 and last is not None:
                last['note'] = (last['note'] + '；' + s).strip('；')
            continue
        sp = split_theme_line(s)
        if not sp: continue
        cn, en_raw, extra = sp
        en, note = clean_en(en_raw)
        note = '；'.join(x for x in [note, extra.strip()] if x)
        if not en: continue
        if not cn or len(cn) > 14 or any(h in cn for h in NOTE_HINT):
            if last is not None:
                add = (cn + ('（' + note + '）' if note else '')).strip()
                if add: last['note'] = (last['note'] + '；' + add).strip('；')
            continue
        it = {'m': 'themes', 'cat': cat, 'sub': '', 'group': 0,
              'cn': cn, 'en': en, 'alts': variants(en), 'note': note}
        items.append(it); last = it
    return items

# ---------------- freq ----------------
CHAPTERS = ['北斗', '洋山港', '航天', '天宫', '南水北调', '大湾区', '黄土高原', '云贵高原',
            '养老', '人口老龄化', '赵州桥', '卢沟桥', '南京长江大桥', '环保', '城市设施',
            '自强自立', '节俭', '尊老', '竹子', '婚礼', '扇子', '桥梁']

FCAT = {
    '科技与工程类': '科技与工程', '科技成就主题': '科技与工程',
    '传统文化类': '传统文化', '传统文化主题': '传统文化',
    '社会发展类': '社会发展', '社会发展与民生主题': '社会发展',
    '地理与区域类': '地理与区域', '地理区域主题': '地理与区域',
    '环保与生态类': '环保与生态', '环境保护主题': '环保与生态',
    '基础设施与工程主题': '基础设施与工程', '专有名词': '专有名词',
}

def fix_chapter(s):
    s = re.sub(r'\s+', '', s)
    hit = [s.find(c) for c in CHAPTERS if c in s]
    if hit and min(hit) > 0: s = s[min(hit):]
    if s.endswith('、'): s = s[:-1]
    if s.endswith('人口老'): s += '龄化'
    return s

def parse_freq():
    rows = json.load(open(os.path.join(T, 'freq_rows.json'), encoding='utf-8'))
    items = []
    for sec in rows:
        if sec['typ'] == 'pattern': continue
        cat = FCAT.get(sec['cat'], sec['cat'])
        for r in sec['rows']:
            c = r['cols']
            if sec['typ'] == 'hf':
                en_raw, cn, ch, note = c[0], c[1], c[2], c[3]
                star = note.count('★')
                tag = note.replace('★', '').strip()
                note_txt = (('出现：' + fix_chapter(ch) + '　') if ch else '') + tag
            else:
                en_raw, cn = c[0], c[1]
                star, note_txt = 0, ''
            en, note2 = clean_en(en_raw)
            cn = re.sub(r'\s+', '', cn).replace('体现/embody', '体现')
            if not en or not cn: continue
            items.append({'m': 'freq', 'cat': cat, 'sub': {'hf': 'high', 'core': 'core', 'proper': 'proper'}[sec['typ']],
                          'group': 0, 'cn': cn, 'en': en, 'alts': variants(en),
                          'star': star, 'note': '；'.join(x for x in [note2, note_txt] if x)})
    return items

def parse_patterns():
    patterns = [
        ('...is a traditional virtue of the Chinese nation', '……是中华民族的传统美德', '尊老、节俭、竹子', '开头引入', ''),
        ('With the rapid development of...', '随着……的快速发展', '几乎所有主题', '开头引入', ''),
        ('In recent years, ... has made remarkable progress', '近年来，……取得了显著进展', '科技、环保、社会', '开头引入', ''),
        ('... has played an increasingly important role', '……发挥了越来越重要的作用', '科技、文化', '开头引入', ''),
        ('It is widely acknowledged that...', '人们普遍认为……', '通用', '开头引入', ''),
        ('not only... but also...', '不仅……而且……', '几乎所有主题', '递进补充', ''),
        ("What's more / Moreover / Furthermore", '此外 / 而且', '通用', '递进补充', ''),
        ('In addition to...', '除了……之外', '通用', '递进补充', ''),
        ('... as well as ...', '……以及……', '通用', '递进补充', ''),
        ('... is of great significance', '……具有重要意义', '几乎所有主题', '总结评价', ''),
        ('... has made significant contributions to...', '为……做出了重要贡献', '科技、文化', '总结评价', ''),
        ('... marks a milestone in...', '……标志着……的里程碑', '科技、工程', '总结评价', ''),
        ('... paves the way for...', '为……铺平了道路', '发展类', '总结评价', ''),
        ('It is no exaggeration to say that...', '说……毫不夸张', '评价类', '总结评价', ''),
        ('be widely recognized / appreciated', '被广泛认可', '通用', '被动语态', 'The Beidou system is widely recognized internationally.'),
        ('be regarded as / be considered as', '被认为是', '通用', '被动语态', 'The bridge is regarded as a milestone in bridge construction.'),
        ('be known for', '以……闻名', '通用', '被动语态', 'Lugou Bridge is known for its aesthetic features.'),
        ('be equipped with', '配备有', '通用', '被动语态', 'The port is equipped with advanced systems.'),
        ('be subjected to', '经受', '通用', '被动语态', 'The bridge has been subjected to multiple floods.'),
        ('be committed to', '致力于', '通用', '被动语态', 'The government is committed to improving...'),
    ]
    return [{'cn': cn, 'en': en, 'alts': variants(en), 'note': t + '｜' + g + ('｜例：' + ex if ex else '')}
            for en, cn, g, t, ex in patterns]

def parse_examples():
    lines = read('freq.txt')
    blocks, cur = [], None
    for raw in lines:
        s = raw.strip()
        if s.startswith('- '):
            if cur: blocks.append(cur)
            cur = s[2:]
        elif cur is not None:
            if re.match(r'^[234]\.\d', s) or s.startswith(('五、', '六、', '真题例句', '核心词汇')):
                blocks.append(cur); cur = None
            else:
                cur += ' ' + s
    if cur: blocks.append(cur)
    out = []
    for b in blocks:
        if '→' not in b: continue
        cn, en = b.split('→', 1)
        cn = re.sub(r'\s+', '', cn).strip()
        en = re.sub(r'\s+', ' ', en).strip()
        if cn and en: out.append({'cn': cn, 'en': en})
    return out

def norm_key(cn, en):
    c = re.sub(r'[\s；;，,。.、:：()（）…·\-—/]', '', cn)
    e = en.lower().strip()
    e = re.sub(r'[^a-z0-9 ]', ' ', e)
    e = re.sub(r'\s+', ' ', e).strip()
    e = re.sub(r'^the ', '', e)
    if e.endswith('s'): e = e[:-1]
    return c + '|' + e

def main():
    terms = parse_terms()
    themes = parse_themes()
    freq = parse_freq()
    patterns = parse_patterns()
    for p in patterns:
        freq.append({'m': 'freq', 'cat': '高频句型', 'sub': 'pattern', 'group': 0,
                     'cn': p['cn'], 'en': p['en'], 'alts': p['alts'], 'note': p['note']})
    all_items = terms + themes + freq
    # 去重 & 跨模块合并
    idx = {}
    merged = []
    for it in all_items:
        k = norm_key(it['cn'], it['en'])
        if k in idx:
            t = idx[k]
            if it['m'] not in t['mods']: t['mods'].append(it['m'])
            t['cats'].setdefault(it['m'], it['cat'])
            continue
        it['mods'] = [it['m']]; it['cats'] = {it['m']: it['cat']}
        idx[k] = it; merged.append(it)
    for n, it in enumerate(merged, 1):
        it['id'] = 'x%03d' % n
    stats = {}
    for m in ('terms', 'themes', 'freq'):
        stats[m] = {
            'items': sum(1 for it in merged if m in it['mods']),
            'cats': sorted({it['cats'][m] for it in merged if m in it['mods'] and m in it['cats']}),
        }
    out = {'stats': stats, 'total': len(merged), 'items': merged,
           'examples': parse_examples(), 'patterns': patterns}
    with open(os.path.join(T, 'parsed.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print('terms raw', len(terms), 'themes raw', len(themes), 'freq raw', len(freq))
    print('unique total', len(merged))
    for m, s in stats.items():
        print(m, s['items'], s['cats'])
    print('multi-module', sum(1 for it in merged if len(it['mods']) > 1))
    for m in ('terms', 'themes', 'freq'):
        print('\n--- sample', m)
        for it in [x for x in merged if m in x['mods']][:6]:
            print(it['cats'].get(m), '|', it['cn'], '=>', it['en'], '| alts', it['alts'], '| note', it['note'], '| mods', it['mods'])

if __name__ == '__main__':
    main()
