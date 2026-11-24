# -*- coding: utf-8 -*-
"""用 PDF 坐标把 freq 的三类表格按列还原，避免文本流把换行拆错"""
import re, glob, json, os
import pymupdf

BASE = os.path.dirname(os.path.abspath(__file__))
PDF = glob.glob(r'c:\Users\Lenovo\Desktop\关于六级\翻译\近五年*.pdf')[0]
CJK = re.compile(r'[\u4e00-\u9fff]')

LAYOUT = {
    'hf':      {'bounds': [200, 305, 415], 'anchor': 3},
    'core':    {'bounds': [300], 'anchor': 1},
    'pattern': {'bounds': [230, 370], 'anchor': 1},
    'proper':  {'bounds': [300], 'anchor': 1},
}

def col_of(x, bounds):
    for i, b in enumerate(bounds):
        if x < b: return i
    return len(bounds)

def clean(txt):
    return re.sub(r'\s+', ' ', txt).strip()

HEAD = re.compile(r'^(英文词汇|中文释义|出现篇章|备注|句型|适用主题|英文表达|示例|英文|中文)$')

def parse_section(lines, typ):
    lay = LAYOUT[typ]
    anchors, loose = [], []
    for y, parts in lines:
        if not parts: continue
        if lay['anchor'] in parts:
            row = {'y': y, 'cols': [''] * (len(lay['bounds']) + 1)}
            for c, v in parts.items(): row['cols'][c] = v
            anchors.append(row)
        else:
            loose.append((y, parts))
    for y, parts in sorted(loose, key=lambda x: x[0]):
        if not anchors: continue
        near = min(anchors, key=lambda r: abs(r['y'] - y))
        if abs(near['y'] - y) <= 42:
            for c, v in parts.items():
                near['cols'][c] = (near['cols'][c] + ' ' + v).strip() if c == 0 else (near['cols'][c] + v).strip()
    return anchors

def main():
    doc = pymupdf.open(PDF)
    sections, cur = [], None
    for pno in range(len(doc)):
        page = doc[pno]
        for blk in page.get_text('dict')['blocks']:
            if blk.get('type') != 0: continue
            for ln in blk['lines']:
                text = ''.join(s['text'] for s in ln['spans']).strip()
                if not text: continue
                m = re.match(r'^([234])\.(\d)\s*(.*)$', text)
                if m and m.group(3):
                    typ = {'2': 'hf', '3': 'core', '4': 'pattern'}[m.group(1)]
                    cur = {'typ': typ, 'cat': m.group(3).strip(), 'lines': []}
                    sections.append(cur)
                    continue
                if text == '真题例句：' or text.startswith('- ') or text.startswith('→'):
                    if text == '真题例句：': cur = None
                    continue
                if text == '核心词汇：': continue
                if text.startswith('五、专有名词'):
                    cur = {'typ': 'proper', 'cat': '专有名词', 'lines': []}
                    sections.append(cur)
                    continue
                if re.match(r'^[一二三四五六]、', text):
                    cur = None
                    continue
                if cur is None: continue
                bounds = LAYOUT[cur['typ']]['bounds']
                parts = {}
                for s in ln['spans']:
                    t = s['text'].strip()
                    if not t or HEAD.match(t): continue
                    c = col_of(s['bbox'][0], bounds)
                    sep = ' ' if c == 0 else ''
                    parts[c] = (parts.get(c, '') + sep + t).strip()
                if not parts: continue
                y = pno * 10000 + (ln['bbox'][1] + ln['bbox'][3]) / 2
                cur['lines'].append((y, parts))
    out = []
    for sec in sections:
        out.append({'typ': sec['typ'], 'cat': sec['cat'], 'rows': parse_section(sec['lines'], sec['typ'])})
    json.dump(out, open(os.path.join(BASE, 'trans', 'freq_rows.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for sec in out:
        print('==', sec['typ'], sec['cat'], len(sec['rows']))
        for r in sec['rows']:
            print('   ', r['cols'])

if __name__ == '__main__':
    main()
