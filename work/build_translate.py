# -*- coding: utf-8 -*-
"""把 parsed.json 整理成前端用的 translate.json"""
import json, re, os, collections

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, '..', 'outputs')
T = os.path.join(BASE, 'trans')

TCAT = {
    '通用翻译表达与数据统计': '通用表达',
    '国家发展、经济贸易与乡村振兴': '国家发展',
    '社会民生、教育医疗与公共治理': '社会民生',
    '历史文化、传统艺术与节日民俗': '历史文化',
    '科技创新、数字生活与航空航天': '科技创新',
    '地理生态、环境保护与旅游资源': '地理生态',
    '城市建设、交通运输与重大工程': '城市建设',
}
HCAT = {
    '一、历史文化类': '历史文化', '二、自然风光类': '自然风光',
    '三、饮食文化＆传统佳节': '饮食佳节', '四、社会发展': '社会发展',
    '五、科技教育': '科技教育', '六、医疗健康': '医疗健康',
}
ORDER = {
    'terms': ['通用表达', '国家发展', '社会民生', '历史文化', '科技创新', '地理生态', '城市建设'],
    'themes': ['历史文化', '自然风光', '饮食佳节', '社会发展', '科技教育', '医疗健康'],
    'freq': ['科技与工程', '传统文化', '社会发展', '地理与区域', '环保与生态', '基础设施与工程', '专有名词', '高频句型'],
}

def main():
    d = json.load(open(os.path.join(T, 'parsed.json'), encoding='utf-8'))
    items = d['items']
    for it in items:
        c = it['cats']
        for m in list(c):
            if m == 'terms': c[m] = TCAT.get(c[m], c[m])
            elif m == 'themes': c[m] = HCAT.get(c[m], c[m])
    mods = [
        {'id': 'terms', 'name': '术语分类', 'full': '六级翻译术语分类整理',
         'tag': '按 7 大类把术语放回位置，英汉双向对上',
         'goal': '认得、分得清、英汉能对上；不要求默写整句',
         'method': ['英→中认读', '中→英选词', '类别归位', '易混辨析'],
         'tip': '这一份是"零件库"。先知道它在哪一类，再保证看到中文能挑出英文，不追求默写长短语。'},
        {'id': 'themes', 'name': '六大主题', 'full': '六级翻译六大主题常考词',
         'tag': '给一个场景，把这一簇词调出来',
         'goal': '看到主题和中文提示，能立刻想到该用哪一簇表达',
         'method': ['场景选词', '主题归堆', '中→英对接'],
         'tip': '这一份是"场景包"。不孤立背词，练的是看到历史文化 / 自然风光这样的题目时，手边能调出哪些说法。'},
        {'id': 'freq', 'name': '高频重复', 'full': '近五年翻译高频重复词与重点词',
         'tag': '提笔能写、能拼、能放进句子',
         'goal': '看到中文能拼对；有真题例句的词，能在句子里填对；知道它常出现在哪类篇章',
         'method': ['看中文拼写', '听写', '真题例句填空', '句型补全'],
         'tip': '这一份是"上场词"。拼错一个字母都算没会；有真题例句的词，再把它填回句子里过一遍。'},
    ]
    exs = d.get('examples', [])
    for it in items:
        for e in exs:
            en = e['en']
            probe = it['en'].split(' / ')[0]
            probe = re.sub(r'\s+', ' ', probe).strip()
            if len(probe) >= 4 and probe.lower() in en.lower():
                it['ex'] = e
                break
    mn_path = os.path.join(T, 'mnemonics.json')
    mn = json.load(open(mn_path, encoding='utf-8')) if os.path.exists(mn_path) else {}
    for it in items:
        if it['en'] in mn:
            it['mn'] = mn[it['en']]
    for m in mods:
        arr = [x for x in items if m['id'] in x['mods']]
        m['count'] = len(arr)
        m['overlap'] = sum(1 for x in arr if len(x['mods']) > 1)
        cats = collections.Counter(x['cats'][m['id']] for x in arr if m['id'] in x['cats'])
        m['cats'] = [{'name': c, 'count': cats[c]} for c in ORDER[m['id']] if cats[c]]
    out = {'total': len(items), 'modules': mods, 'items': items, 'examples': exs}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'translate.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print('total', len(items), 'size', os.path.getsize(os.path.join(OUT, 'translate.json')))
    for m in mods:
        print(m['id'], m['count'], 'overlap', m['overlap'], [(c['name'], c['count']) for c in m['cats']])
    print('with example', sum(1 for x in items if 'ex' in x))
    print('with mnemonic', sum(1 for x in items if x.get('mn')), '/', len(mn))
    miss = [k for k in mn if not any(x['en'] == k for x in items)]
    print('mnemonic keys not matched', len(miss), miss[:8])
    print('modules per item', collections.Counter(tuple(x['mods']) for x in items).most_common(6))

if __name__ == '__main__':
    main()
