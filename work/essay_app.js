/* ============================================================
   六级写作专项（独立模块）
   - 进度单独存 cet6vocab_2026_essay_v1，不跟阅读/翻译混
   - 练法：句型卡 → 速配 → 填空 → 拼句 → 排序 → 归类 → 审题 → 写作 → 限时
   ============================================================ */
const ED = (typeof DATA !== 'undefined' && DATA.essay) ? DATA.essay : {
  templates: [], structures: [], patterns: [], phrases: [], materials: [], topics: [],
  meta: { counts: {} }
};
const EPAT = (ED.patterns || []).map(x => Object.assign({ type: 'pattern' }, x));
const EPHR = (ED.phrases || []).map(x => Object.assign({ type: 'phrase' }, x));
const EMAT = (ED.materials || []).map(x => Object.assign({ type: 'material' }, x));
const ETPL = ED.templates || [];
const ESTR = ED.structures || [];
const ETOP = ED.topics || [];
const EALL = EPAT.concat(EPHR, EMAT);
const EBY = {};
EALL.forEach(x => { EBY[x.id] = x; });
const ECOUNT = { pattern: EPAT.length, phrase: EPHR.length, material: EMAT.length,
  template: ETPL.length, structure: ESTR.length, topic: ETOP.length };

const EKEY = 'cet6vocab_2026_essay_v1';
const EDEF = { v: 1, items: {}, days: {}, combo: 0, best: 0, badges: {}, fav: {},
  drafts: {}, essays: {}, tplSeen: {}, goal: 40, challengeBest: 0 };
let ES = eLoad();
let eView = 'home';
let eCtx = {};
let eTimer = null;

function eLoad() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(EKEY) || 'null'); } catch (e) { o = null; }
  const d = JSON.parse(JSON.stringify(EDEF));
  if (o && typeof o === 'object') {
    Object.keys(d).forEach(k => { if (o[k] != null) d[k] = o[k]; });
  }
  ['items', 'days', 'badges', 'fav', 'drafts', 'essays', 'tplSeen'].forEach(k => {
    if (!d[k] || typeof d[k] !== 'object') d[k] = {};
  });
  Object.keys(d.items).forEach(id => {
    const r = d.items[id];
    if (!r || typeof r !== 'object') { delete d.items[id]; return; }
    ['b', 'seen', 'right', 'wrong'].forEach(k => { if (r[k] == null) r[k] = 0; });
    if (typeof r.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.due)) r.due = today();
  });
  if (!d.goal || d.goal < 10) d.goal = 40;
  return d;
}
function eSave() { try { localStorage.setItem(EKEY, JSON.stringify(ES)); return true; } catch (e) { return false; } }
function eEnsure(id) {
  if (!ES.items[id]) ES.items[id] = { b: 0, seen: 0, right: 0, wrong: 0, due: today(), last: 0 };
  return ES.items[id];
}
function eItem(id) { return EBY[id] || null; }
function eDay() {
  const d = today();
  if (!ES.days[d]) ES.days[d] = { xp: 0, q: 0, right: 0, cards: 0, match: 0, build: 0, write: 0, topic: 0 };
  const r = ES.days[d];
  ['xp', 'q', 'right', 'cards', 'match', 'build', 'write', 'topic'].forEach(k => { if (r[k] == null) r[k] = 0; });
  return r;
}
const EINT = [0, 1, 2, 4, 7, 15, 30];
function eMark(id, ok, bonus) {
  if (!id || !EBY[id]) return;
  const r = eEnsure(id);
  r.seen++; r.last = Date.now();
  if (ok) {
    r.right++; r.b = Math.min(6, (r.b || 0) + 1);
    r.due = addDays(today(), EINT[r.b] || 30);
  } else {
    r.wrong++; r.b = Math.max(0, (r.b || 0) - 1);
    r.due = today();
  }
  const d = eDay();
  d.q++; if (ok) d.right++;
  if (ok) {
    ES.combo = (ES.combo || 0) + 1;
    if (ES.combo > (ES.best || 0)) ES.best = ES.combo;
    d.xp += 8 + Math.min(14, (ES.combo - 1) * 2) + (bonus || 0);
  } else {
    ES.combo = 0;
  }
  eBadges();
  eSave();
}
function eTouch(kind) { const d = eDay(); if (kind) d[kind] = (d[kind] || 0) + 1; }
function eAddXp(n) { eDay().xp += n; }

/* ---------- 徽章 ---------- */
const EBADGES = [
  { id: 'first', name: '开笔', desc: '练过 10 条语料', ic: '✎', check: () => eTotal().seen >= 10 },
  { id: 'combo', name: '连击手', desc: '一次连对 10 题', ic: '⚡', check: () => (ES.best || 0) >= 10 },
  { id: 'pat20', name: '句型匠', desc: '掌握 20 个句型', ic: '✧', check: () => eMaster('pattern') >= 20 },
  { id: 'ph50', name: '搭配王', desc: '掌握 50 组搭配', ic: '⇄', check: () => eMaster('phrase') >= 50 },
  { id: 'alltpl', name: '骨架通', desc: '看完 6 个段落模板', ic: '▤', check: () => Object.keys(ES.tplSeen || {}).length >= ETPL.length },
  { id: 'essay1', name: '第一稿', desc: '完成 1 篇作文', ic: '✍', check: () => Object.keys(ES.essays || {}).length >= 1 },
  { id: 'essay3', name: '笔耕不辍', desc: '完成 3 篇作文', ic: '▣', check: () => Object.keys(ES.essays || {}).length >= 3 },
  { id: 'challenge', name: '60 秒', desc: '限时挑战答对 15 题', ic: '◷', check: () => (ES.challengeBest || 0) >= 15 },
  { id: 'week', name: '三日不辍', desc: '连续 3 天练习', ic: '★', check: () => eStreak() >= 3 },
];
function eBadges() {
  EBADGES.forEach(b => {
    if (!ES.badges[b.id] && b.check()) {
      ES.badges[b.id] = Date.now();
      setTimeout(() => toast('解锁徽章 · ' + b.name), 80);
    }
  });
}
function eStreak() {
  let n = 0, ds = today();
  for (let i = 0; i < 400; i++) {
    const d = ES.days[ds];
    if (d && d.q > 0) n++;
    else if (i > 0) break;
    ds = addDays(ds, -1);
  }
  return n;
}
function eTotal() {
  let seen = 0, master = 0, wrong = 0, due = 0, fav = 0;
  EALL.forEach(x => {
    const r = ES.items[x.id];
    if (r && r.seen) {
      seen++;
      if (r.b >= 4) master++;
      if (r.wrong > 0) wrong++;
      if (r.due <= today() && r.b < 6) due++;
    }
    if (ES.fav[x.id]) fav++;
  });
  return { seen, master, wrong, due, fav, pool: EALL.length };
}
function eMaster(type) {
  let n = 0;
  EALL.forEach(x => {
    if (x.type !== type) return;
    const r = ES.items[x.id];
    if (r && r.seen && r.b >= 4) n++;
  });
  return n;
}
function ePool(type) { return type === 'pattern' ? EPAT : type === 'phrase' ? EPHR : type === 'material' ? EMAT : EALL; }

/* ---------- 自适应选题 ---------- */
function eRank(x) {
  const r = ES.items[x.id];
  if (!r || !r.seen) return 3 + Math.random();
  if (r.due <= today()) return 0 + Math.random();
  if (r.wrong > 0) return 1 + Math.random();
  return 2 + Math.random();
}
function ePick(type, n, filter) {
  let pool = ePool(type);
  if (filter) pool = pool.filter(filter);
  const scored = pool.map(x => ({ x, s: eRank(x) })).sort((a, b) => a.s - b.s);
  return scored.slice(0, n).map(o => o.x);
}
function eWrongList(limit) {
  return EALL.filter(x => { const r = ES.items[x.id]; return r && r.wrong > 0; })
    .sort((a, b) => (ES.items[b.id].wrong - ES.items[a.id].wrong)).slice(0, limit || 20);
}
function eRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- 头部 / 导航 ---------- */
function eHead() {
  const brand = document.querySelector('.brand');
  if (brand) { brand.classList.remove('trans'); brand.classList.add('essay'); brand.textContent = '六级写作专项 · ' + EPAT.length + ' 句型 + ' + EPHR.length + ' 搭配'; }
  const st = eTotal(), d = eDay();
  const sub = document.getElementById('subline');
  if (sub) sub.innerHTML = '写作区 · 已练 ' + st.seen + '/' + st.pool + ' · 今日 <b>' + d.xp + '</b> XP · 连击 ' + (ES.combo || 0) + ' · 独立进度';
}
function eNav() {
  eHead();
  eRender();
}
function eGo(v, ctx) {
  eStop();
  eView = v;
  eCtx = ctx || {};
  eHead();
  eRender();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function eStop() { if (eTimer) { clearInterval(eTimer); eTimer = null; } }
function eRender() {
  const box = document.getElementById('essayBody');
  if (!box) return;
  document.getElementById('v-essay').classList.add('on');
  if (eView === 'home') eHome(box);
  else if (eView === 'cards') eCards(box);
  else if (eView === 'match') eMatch(box);
  else if (eView === 'cloze') eCloze(box);
  else if (eView === 'build') eBuild(box);
  else if (eView === 'order') eOrder(box);
  else if (eView === 'sort') eSort(box);
  else if (eView === 'topics') eTopics(box);
  else if (eView === 'topic') eTopic(box);
  else if (eView === 'write') eWrite(box);
  else if (eView === 'writeResult') eWriteResult(box);
  else if (eView === 'challenge') eChallenge(box);
  else if (eView === 'tpl') eTpl(box);
  else if (eView === 'lib') eLib(box);
  else eHome(box);
}
function eBack(label, v) {
  return '<div style="margin:8px 0 10px"><button class="btn sm" onclick="eGo(\'' + (v || 'home') + '\')">← ' + (label || '写作首页') + '</button></div>';
}
function ePct(a, b) { return b ? Math.round(a / b * 100) : 0; }

/* ---------- 首页 ---------- */
function eHome(box) {
  const st = eTotal(), d = eDay(), streak = eStreak();
  const pct = ePct(d.xp, ES.goal);
  const goalDone = d.xp >= ES.goal;
  const tasks = [
    { done: d.cards >= 5, t: '翻 5 张语料卡', s: '把句型和搭配过一遍，先混脸熟', v: 'cards' },
    { done: d.match >= 1, t: '做 1 轮搭配速配', s: '中英对应，手比眼快', v: 'match' },
    { done: (d.build >= 1 || d.write >= 1 || d.topic >= 1), t: '造 1 次句 / 审 1 道题', s: '从看懂到写出来，跨过这一步', v: 'build' }
  ];
  const taskHtml = tasks.map(x =>
    '<div class="etask ' + (x.done ? 'on' : '') + '"><span class="edot">' + (x.done ? '✓' : '') + '</span>' +
    '<div style="flex:1"><b>' + x.t + '</b><div class="mini">' + x.s + '</div></div>' +
    '<button class="btn sm ' + (x.done ? '' : 'primary') + '" onclick="eGo(\'' + x.v + '\')">' + (x.done ? '再来' : '开始') + '</button></div>'
  ).join('');

  const tplDone = Object.keys(ES.tplSeen || {}).length;
  const essayDone = Object.keys(ES.essays || {}).length;
  const path = [
    { n: '1', name: '骨架', desc: '6 个段落模板 + 3 类文章结构', p: ePct(tplDone, ETPL.length), v: 'tpl', go: '骨架' },
    { n: '2', name: '语料', desc: EPAT.length + ' 个句型 · ' + EPHR.length + ' 组搭配 · ' + EMAT.length + ' 条素材', p: ePct(st.seen, st.pool), v: 'lib', go: '语料库' },
    { n: '3', name: '造句', desc: '中译英拼句，把词块变成自己的', p: ePct(eMaster('phrase'), EPHR.length), v: 'build', go: '造句' },
    { n: '4', name: '成文', desc: '15 道预测题，计时写作 + 范文对照', p: ePct(essayDone, Math.max(1, ETOP.length)), v: 'topics', go: '写作台' }
  ].map(x =>
    '<button class="epath" onclick="eGo(\'' + x.v + '\')"><span class="enum">' + x.n + '</span>' +
    '<span class="ebody"><b>' + x.name + '</b><span class="mini">' + x.desc + '</span>' +
    '<span class="ebar"><i style="width:' + x.p + '%"></i></span></span>' +
    '<span class="ego">' + x.go + ' ›</span></button>'
  ).join('');

  const modes = [
    ['cards', '▤', '句型卡', '翻卡 + 自评'],
    ['match', '⇄', '搭配速配', '中英配对'],
    ['cloze', '▭', '句型填空', '挖空四选一'],
    ['build', '✎', '中译英', '词块拼句'],
    ['order', '⇅', '段落排序', '理清逻辑链'],
    ['sort', '◧', '语料归类', '个人/社会/国家/家庭'],
    ['challenge', '◷', '60 秒挑战', '手速 + 连击'],
    ['topics', '✍', '写作台', '15 道预测题']
  ].map(m => '<button class="emode" onclick="eGo(\'' + m[0] + '\')"><span class="mi">' + m[1] + '</span><b>' + m[2] + '</b><span class="mini">' + m[3] + '</span></button>').join('');

  const weak = eWrongList(4);
  const weakHtml = weak.length ? weak.map(x =>
    '<div class="erow" onclick="eGo(\'cards\',{ids:[\'' + x.id + '\']})"><div style="flex:1"><div class="een">' + esc(eFront(x)) + '</div>' +
    '<div class="mini">错 ' + ES.items[x.id].wrong + ' 次 · 点开重练</div></div><span class="ego">›</span></div>'
  ).join('') : '<div class="empty">还没有错题。练几轮，错的地方会自己浮出来。</div>';

  const badgeHtml = EBADGES.map(b => {
    const on = !!ES.badges[b.id];
    return '<div class="ebadge ' + (on ? 'on' : '') + '" title="' + esc(b.desc) + '"><span class="bi">' + b.ic + '</span><span class="bn">' + b.name + '</span></div>';
  }).join('');

  box.innerHTML =
    '<div class="ecard ehero">' +
      '<div class="flexline"><div><div class="etitle">写作不是玄学</div>' +
      '<div class="note" style="margin-top:4px">骨架 → 语料 → 造句 → 成文。每天 ' + ES.goal + ' XP，先把手感练出来。</div></div>' +
      '<span class="spacer"></span><div class="ering" style="--p:' + Math.min(100, pct) + '"><b>' + pct + '%</b><span>今日</span></div></div>' +
      '<div class="ebar big"><i style="width:' + Math.min(100, pct) + '%"></i></div>' +
      '<div class="egrid3">' +
        '<div class="estat"><b>' + d.xp + '</b><span>今日 XP</span></div>' +
        '<div class="estat"><b>' + (ES.combo || 0) + '</b><span>当前连击</span></div>' +
        '<div class="estat"><b>' + streak + '</b><span>连续天数</span></div>' +
      '</div>' +
      (goalDone ? '<div class="efinish">今日目标已达成，想多练就继续，不想练就收工。</div>' : '') +
    '</div>' +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">今日三件事</h2><span class="spacer"></span><span class="mini">' + (tasks.filter(t => t.done).length) + '/3</span></div>' + taskHtml + '</div>' +
    '<div class="ecard"><h2>四步进阶 <span class="thin">每一步都能单独练</span></h2>' + path + '</div>' +
    '<div class="ecard"><h2>想练哪块</h2><div class="emodes">' + modes + '</div></div>' +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">该回炉的</h2><span class="spacer"></span>' +
      (weak.length ? '<button class="btn sm" onclick="eGo(\'cards\',{wrong:1})">全部错题</button>' : '') + '</div>' + weakHtml + '</div>' +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">徽章墙</h2><span class="spacer"></span><span class="mini">' +
      Object.keys(ES.badges || {}).length + '/' + EBADGES.length + '</span></div><div class="ebadges">' + badgeHtml + '</div></div>' +
    '<div class="ecard"><h2>这份写作区怎么来的</h2>' +
      '<div class="note">语料全部来自你新加的 7 份资料：套句总结（图片 PDF 已 OCR）、模板与分论点、万能素材库、100 组搭配、加分句式、十页纸补充、15 道预测题。英文原句不改写，只做分类和清洗；进度单独存，不跟阅读、翻译混。</div>' +
      '<div class="mini" style="margin-top:8px">句型 ' + EPAT.length + ' · 搭配 ' + EPHR.length + ' · 素材 ' + EMAT.length + ' · 模板 ' + ETPL.length + ' · 结构 ' + ESTR.length + ' · 预测题 ' + ETOP.length + '</div>' +
    '</div>';
}
function eFront(x) {
  if (x.type === 'pattern') return x.cn || x.en;
  if (x.type === 'phrase') return x.cn;
  if (x.group === '替换') return x.en;
  return x.cn || x.en;
}

/* ---------- 通用：结果页 ---------- */
function eResult(box, title, right, total, extra) {
  const pct = total ? Math.round(right / total * 100) : 0;
  box.innerHTML = eBack() +
    '<div class="ecard ecenter">' +
      '<div class="ebig">' + pct + '%</div>' +
      '<div class="etitle">' + title + '</div>' +
      '<div class="note">答对 ' + right + ' / ' + total + ' · 连击 ' + (ES.combo || 0) + ' · 今日 ' + eDay().xp + ' XP</div>' +
      (extra || '') +
      '<div class="btnrow" style="margin-top:16px">' +
        '<button class="btn primary" onclick="eGo(\'' + eCtx.mode + '\')">再来一轮</button>' +
        '<button class="btn" onclick="eGo(\'home\')">回首页</button>' +
      '</div>' +
    '</div>';
}

/* ---------- 句型卡 ---------- */
function eCards(box) {
  if (!eCtx.ids) {
    const ids = eCtx.wrong ? eWrongList(20).map(x => x.id) : ePick(null, 10).map(x => x.id);
    eCtx = { mode: 'cards', ids, i: 0, flip: false, right: 0, wrong: 0 };
  } else if (eCtx.i == null) {
    eCtx = { mode: 'cards', ids: eCtx.ids, i: 0, flip: false, right: 0, wrong: 0 };
  }
  if (!eCtx.ids.length) {
    box.innerHTML = eBack() + '<div class="ecard ecenter"><div class="etitle">没有可练的卡片</div><button class="btn primary" style="margin-top:12px" onclick="eGo(\'home\')">回首页</button></div>';
    return;
  }
  if (eCtx.i >= eCtx.ids.length) {
    eResult(box, '这一轮翻完了', eCtx.right, eCtx.ids.length,
      '<div class="note" style="margin-top:8px">记得慢一点没关系，关键是翻过去之前先自己想一遍。</div>');
    return;
  }
  const x = eItem(eCtx.ids[eCtx.i]);
  if (!x) { eCtx.i++; eRender(); return; }
  const r = ES.items[x.id] || {};
  const front = eFront(x);
  const tag = x.type === 'pattern' ? (x.fn || '句型') : x.type === 'phrase' ? '高频搭配' : (x.group === '替换' ? '高级替换' : x.group);
  const back = '<div class="ebacks">' +
    '<div class="een">' + esc(x.en) + '</div>' +
    (x.type === 'pattern' ? '<div class="ecn">' + esc(x.cn) + '</div>' : '') +
    (x.tip ? '<div class="etip">' + esc(x.tip) + '</div>' : '') +
    '<div class="mini" style="margin-top:8px">' + esc(x.src || '') + '</div>' +
    '<button class="btn sm" style="margin-top:10px" onclick="event.stopPropagation();eSpeak(\'' + x.id + '\')">朗读</button>' +
  '</div>';
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="meta"><span class="pill">' + esc(tag) + '</span>' +
      '<span class="mini">' + (eCtx.i + 1) + ' / ' + eCtx.ids.length + ' · 第 ' + ((r.b || 0) + 1) + ' 阶</span></div>' +
      '<button class="eflash ' + (eCtx.flip ? 'flip' : '') + '" onclick="eCardFlip()">' +
        '<span class="effront"><span class="efront-tag">' + esc(tag) + '</span><span class="efront-t">' + esc(front) + '</span>' +
          '<span class="efront-h">点一下翻面</span></span>' +
        '<span class="eback">' + back + '</span>' +
      '</button>' +
      (eCtx.flip ? '<div class="erates">' +
        '<button class="btn" onclick="eCardRate(0)">忘了</button>' +
        '<button class="btn" onclick="eCardRate(1)">模糊</button>' +
        '<button class="btn" onclick="eCardRate(2)">记得</button>' +
        '<button class="btn primary" onclick="eCardRate(3)">秒懂</button>' +
      '</div>' : '<div class="note" style="margin-top:12px;text-align:center">先自己回忆英文怎么说，再翻面。想不起来就翻，别耗。</div>') +
    '</div>';
}
function eCardFlip() { eCtx.flip = !eCtx.flip; eRender(); }
function eCardRate(q) {
  const id = eCtx.ids[eCtx.i];
  const x = eItem(id);
  const ok = q >= 2;
  eMark(id, ok, q === 3 ? 4 : 0);
  const r = ES.items[id];
  if (q === 1 && r) { r.due = today(); r.b = Math.max(0, r.b - 1); }
  if (q === 0) eCtx.wrong++; else eCtx.right++;
  eCtx.i++; eCtx.flip = false;
  eSave();
  eRender();
}
function eSpeak(id) { const x = eItem(id); if (x) speak(x.en); }

/* ---------- 搭配速配 ---------- */
function eMatch(box) {
  if (!eCtx.pairs) {
    const items = ePick('phrase', 6);
    eCtx = { mode: 'match', pairs: items.map(x => ({ id: x.id, cn: x.cn, en: x.en })),
      sel: null, done: 0, right: 0, wrong: 0, t0: Date.now(), orderL: [], orderR: [] };
    eCtx.orderL = shuffle(eCtx.pairs.map((p, i) => i));
    eCtx.orderR = shuffle(eCtx.pairs.map((p, i) => i));
  }
  if (eCtx.done >= eCtx.pairs.length) {
    const sec = Math.max(1, Math.round((Date.now() - eCtx.t0) / 1000));
    eResult(box, '6 组全配上了', eCtx.right, eCtx.right + eCtx.wrong,
      '<div class="note" style="margin-top:8px">用时 ' + sec + ' 秒 · 错 ' + eCtx.wrong + ' 次。错的那几组已经进了回炉名单。</div>');
    return;
  }
  const L = eCtx.orderL.map((idx, pos) => {
    const p = eCtx.pairs[idx];
    const solved = eCtx.solved && eCtx.solved[idx];
    return '<button class="emitem ' + (solved ? 'done' : '') + (eCtx.sel === idx ? ' sel' : '') + '" onclick="eMatchSel(' + idx + ')">' + esc(p.cn) + '</button>';
  }).join('');
  const R = eCtx.orderR.map((idx, pos) => {
    const p = eCtx.pairs[idx];
    const solved = eCtx.solved && eCtx.solved[idx];
    return '<button class="emitem ' + (solved ? 'done' : '') + '" onclick="eMatchPick(' + idx + ')">' + esc(p.en) + '</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">搭配速配 <span class="thin">先点中文，再点英文</span></h2><span class="spacer"></span>' +
      '<span class="pill">' + eCtx.done + '/6</span></div>' +
      '<div class="ematch"><div class="emcol">' + L + '</div><div class="emcol">' + R + '</div></div>' +
      '<div class="note" style="margin-top:12px">不确定就先排除：把明显不搭的先划掉。错了会抖动，连击会断。</div>' +
    '</div>';
}
function eMatchSel(idx) {
  if (eCtx.solved && eCtx.solved[idx]) return;
  eCtx.sel = idx; eRender();
}
function eMatchPick(idx) {
  if (eCtx.solved && eCtx.solved[idx]) return;
  if (eCtx.sel == null) { toast('先点左边中文'); return; }
  const a = eCtx.sel;
  eCtx.solved = eCtx.solved || {};
  if (a === idx) {
    eCtx.solved[idx] = 1; eCtx.done++; eCtx.right++; eCtx.sel = null;
    eMark(eCtx.pairs[idx].id, true, 4);
    eTouch('match');
  } else {
    eCtx.wrong++;
    eMark(eCtx.pairs[idx].id, false);
    toast('不搭，再想想');
    eCtx.sel = null;
  }
  eSave();
  eRender();
}

/* ---------- 句型填空 ---------- */
const ESTOP = ('about above after again against almost along already although always among another answer around because before begin being below between both bring build cannot could doing during each other either enough every first found great having however important itself known large large last least less little many might more most much must never often other others people place point quite rather really right same should since small some something still such take taken than that their them then there these they thing think this those though through thus time under until upon very want were what when where which while will with within without would write year your').split(' ');
function eBlank(s) {
  const words = s.match(/[A-Za-z][A-Za-z'-]{4,}/g) || [];
  const cand = words.filter(w => !ESTOP.includes(w.toLowerCase()));
  if (!cand.length) return null;
  const w = cand.slice().sort((a, b) => b.length - a.length)[0];
  const i = s.indexOf(w);
  if (i < 0) return null;
  return { q: s.slice(0, i) + '______' + s.slice(i + w.length), a: w };
}
function eCloze(box) {
  if (!eCtx.qs) {
    const pats = ePick('pattern', 10);
    const bank = [];
    EPAT.forEach(p => { const b = eBlank(p.en || ''); if (b) bank.push(b.a); });
    const qs = [];
    pats.forEach(p => {
      const b = eBlank(p.en || '');
      if (!b) return;
      const opts = [b.a];
      const seen = { };
      seen[b.a.toLowerCase()] = 1;
      const others = shuffle(bank.filter(w => w.toLowerCase() !== b.a.toLowerCase()));
      others.forEach(w => {
        if (opts.length < 4 && !seen[w.toLowerCase()]) { opts.push(w); seen[w.toLowerCase()] = 1; }
      });
      while (opts.length < 4) opts.push('thinking');
      qs.push({ id: p.id, q: b.q, a: b.a, opts: shuffle(opts), fn: p.fn, cn: p.cn, en: p.en });
    });
    eCtx = { mode: 'cloze', qs, i: 0, right: 0, wrong: 0, pick: null };
  }
  if (eCtx.i >= eCtx.qs.length) {
    eResult(box, '填空做完', eCtx.right, eCtx.qs.length);
    return;
  }
  const q = eCtx.qs[eCtx.i];
  const opts = q.opts.map(o => {
    let cls = '';
    if (eCtx.pick != null) {
      if (o.toLowerCase() === q.a.toLowerCase()) cls = ' correct';
      else if (o === eCtx.pick) cls = ' wrong';
    }
    return '<button class="opt' + cls + '" onclick="eClozePick(\'' + esc(o).replace(/'/g, "\\'") + '\')">' + esc(o) + '</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="meta"><span class="pill">' + esc(q.fn || '句型') + '</span><span class="mini">' + (eCtx.i + 1) + ' / ' + eCtx.qs.length + '</span></div>' +
      '<div class="qtext" style="margin:6px 0 14px">' + esc(q.q) + '</div>' + opts +
      (eCtx.pick != null ? '<div class="fb ' + (eCtx.pick.toLowerCase() === q.a.toLowerCase() ? 'ok' : 'no') + '">' +
        (eCtx.pick.toLowerCase() === q.a.toLowerCase() ? '对了。' : '答案是 ' + esc(q.a) + '。') +
        '<div class="ecn" style="margin-top:6px">' + esc(q.cn) + '</div>' +
        '<button class="btn sm" style="margin-top:8px" onclick="speakText(this)" data-t="' + esc(q.en).replace(/"/g, '&quot;') + '">朗读整句</button>' +
        '</div><button class="btn primary block" style="margin-top:12px" onclick="eClozeNext()">下一题</button>' : '') +
    '</div>';
}
function eClozePick(o) {
  if (eCtx.pick != null) return;
  const q = eCtx.qs[eCtx.i];
  eCtx.pick = o;
  const ok = o.toLowerCase() === q.a.toLowerCase();
  if (ok) eCtx.right++; else eCtx.wrong++;
  eMark(q.id, ok);
  eSave();
  eRender();
}
function eClozeNext() { eCtx.i++; eCtx.pick = null; eRender(); }
function speakText(btn) { speak(btn.getAttribute('data-t')); }

/* ---------- 中译英拼句 ---------- */
function eBuildPool() {
  return EPHR.filter(p => {
    const w = p.en.split(/\s+/);
    return w.length >= 3 && w.length <= 10 && !/[\/…]/.test(p.en) && !/\d/.test(p.en) && !/[.;:]/.test(p.en.replace(/[.!?]$/, ''));
  });
}
function eBuild(box) {
  if (!eCtx.qs) {
    const items = ePick('phrase', 10, p => eBuildPool().some(b => b.id === p.id));
    const qs = items.map(p => {
      const words = p.en.replace(/[.,;:!?]+$/g, '').split(/\s+/);
      const poolWords = [];
      EPHR.forEach(o => { if (o.id !== p.id) o.en.split(/\s+/).forEach(w => { const c = w.replace(/[^A-Za-z'-]/g, ''); if (c && !words.map(x => x.toLowerCase()).includes(c.toLowerCase())) poolWords.push(c); }); });
      const dis = shuffle([...new Set(poolWords)]).slice(0, 2);
      return { id: p.id, cn: p.cn, en: p.en, ans: words, toks: shuffle(words.concat(dis)), picked: [] };
    });
    eCtx = { mode: 'build', qs, i: 0, right: 0, wrong: 0, checked: false, ok: false };
  }
  if (eCtx.i >= eCtx.qs.length) { eResult(box, '拼句练完', eCtx.right, eCtx.qs.length); return; }
  const q = eCtx.qs[eCtx.i];
  const ans = q.picked.map((k, pos) => '<button class="etok on" onclick="eBuildUndo(' + pos + ')">' + esc(q.toks[k]) + '</button>').join('') ||
    '<span class="mini" style="padding:8px">点下面的词，按顺序拼</span>';
  const bank = q.toks.map((t, k) => {
    const used = q.picked.indexOf(k) >= 0;
    return '<button class="etok ' + (used ? 'used' : '') + '" onclick="eBuildAdd(' + k + ')">' + esc(t) + '</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="meta"><span class="pill">中译英</span><span class="mini">' + (eCtx.i + 1) + ' / ' + eCtx.qs.length + '</span></div>' +
      '<div class="ecn" style="font-size:16px;margin:6px 0 12px">' + esc(q.cn) + '</div>' +
      '<div class="ebuild">' + ans + '</div>' +
      '<div class="ebuildpool">' + bank + '</div>' +
      (eCtx.checked ? '<div class="fb ' + (eCtx.ok ? 'ok' : 'no') + '" style="margin-top:12px">' +
        (eCtx.ok ? '顺序对了。' : '标准答案：' + esc(q.en)) +
        '<button class="btn sm" style="margin-top:8px" onclick="speakText(this)" data-t="' + esc(q.en).replace(/"/g, '&quot;') + '">朗读</button>' +
        '</div><button class="btn primary block" style="margin-top:12px" onclick="eBuildNext()">下一句</button>' :
        '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="eBuildCheck()">检查</button>' +
        '<button class="btn" onclick="eBuildHint()">看答案</button></div>') +
    '</div>';
}
function eBuildAdd(k) {
  const q = eCtx.qs[eCtx.i];
  if (q.picked.indexOf(k) >= 0) return;
  q.picked.push(k);
  eRender();
}
function eBuildUndo(k) { const q = eCtx.qs[eCtx.i]; q.picked.splice(k, 1); eRender(); }
function eBuildCheck() {
  const q = eCtx.qs[eCtx.i];
  if (!q.picked.length) { toast('先拼一句'); return; }
  const norm = a => a.join(' ').toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim();
  const ok = norm(q.picked.map(k => q.toks[k])) === norm(q.ans);
  eCtx.checked = true; eCtx.ok = ok;
  if (ok) eCtx.right++; else eCtx.wrong++;
  eMark(q.id, ok, ok ? 3 : 0);
  eTouch('build');
  eSave();
  eRender();
}
function eBuildHint() {
  const q = eCtx.qs[eCtx.i];
  eCtx.checked = true; eCtx.ok = false; eCtx.wrong++;
  eMark(q.id, false);
  eSave(); eRender();
}
function eBuildNext() { eCtx.i++; eCtx.checked = false; eCtx.ok = false; eRender(); }

/* ---------- 段落排序 ---------- */
function eOrder(box) {
  if (!eCtx.ans) {
    const top = eRand(ETOP);
    const sents = (top.model || '').split(/(?<=[.!?])\s+(?=[A-Z“"])/).map(s => s.trim()).filter(Boolean);
    const use = sents.slice(0, 7);
    if (use.length < 4) { box.innerHTML = eBack() + '<div class="ecard ecenter">段落数据不足</div>'; return; }
    eCtx = { mode: 'order', topic: top, ans: use, pool: shuffle(use.map((s, i) => ({ s, i }))), picked: [], checked: false, ok: false };
  }
  const q = eCtx;
  if (q.checked) {
    const ok = q.ok;
    const correct = q.ans.map((s, i) => '<div class="erow"><span class="enum">' + (i + 1) + '</span><div style="flex:1">' + esc(s) + '</div></div>').join('');
    box.innerHTML = eBack() +
      '<div class="ecard"><div class="etitle">' + (ok ? '逻辑链条理顺了' : '顺序还差一点') + '</div>' +
        '<div class="note">' + esc(q.topic.title) + '</div>' +
        '<div class="hr"></div>' + correct +
        '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="eGo(\'order\')">换一段</button>' +
        '<button class="btn" onclick="eGo(\'home\')">回首页</button></div></div>';
    return;
  }
  const picked = q.picked.map((s, k) => '<div class="esent on" onclick="eOrderUndo(' + k + ')">' + esc(s) + '</div>').join('') || '<div class="empty">按你认为的顺序点下面的句子</div>';
  const pool = q.pool.map((o, k) => {
    const used = q.picked.indexOf(o.s) >= 0;
    return '<button class="esent ' + (used ? 'used' : '') + '" onclick="eOrderAdd(' + k + ')">' + esc(o.s) + '</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="meta"><span class="pill">段落排序</span><span class="mini">' + esc(q.topic.tag || '范文') + '</span></div>' +
      '<div class="note">把打乱的句子排回原文顺序。找连接词：Admittedly / Nevertheless / Therefore / Only in this way。</div>' +
      '<div class="hr"></div><div class="esents">' + picked + '</div>' +
      '<div class="hr"></div><div class="esents">' + pool + '</div>' +
      '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="eOrderCheck()">检查顺序</button>' +
      '<button class="btn" onclick="eGo(\'order\')">换一段</button></div></div>';
}
function eOrderAdd(k) {
  const o = eCtx.pool[k];
  if (eCtx.picked.indexOf(o.s) >= 0) return;
  eCtx.picked.push(o.s);
  eRender();
}
function eOrderUndo(k) { eCtx.picked.splice(k, 1); eRender(); }
function eOrderCheck() {
  if (eCtx.picked.length !== eCtx.ans.length) { toast('还没排完'); return; }
  const ok = eCtx.picked.every((s, i) => s === eCtx.ans[i]);
  eCtx.checked = true; eCtx.ok = ok;
  if (ok) { eAddXp(20); toast('顺序对了 +20 XP'); } else { ES.combo = 0; }
  eSave(); eRender();
}

/* ---------- 语料归类 ---------- */
const EDIMS = ['个人', '社会', '国家', '家庭'];
function eSort(box) {
  if (!eCtx.qs) {
    const pool = ePick('material', 12, m => EDIMS.includes(m.group));
    eCtx = { mode: 'sort', qs: pool, i: 0, right: 0, wrong: 0, pick: null };
  }
  if (eCtx.i >= eCtx.qs.length) { eResult(box, '归类做完', eCtx.right, eCtx.qs.length); return; }
  const q = eCtx.qs[eCtx.i];
  const opts = EDIMS.map(d => {
    let cls = '';
    if (eCtx.pick != null) {
      if (d === q.group) cls = ' correct';
      else if (d === eCtx.pick) cls = ' wrong';
    }
    return '<button class="opt' + cls + '" onclick="eSortPick(\'' + d + '\')">' + d + '层面</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="meta"><span class="pill">语料归类</span><span class="mini">' + (eCtx.i + 1) + ' / ' + eCtx.qs.length + '</span></div>' +
      '<div class="een" style="font-size:18px;margin:8px 0">' + esc(q.en) + '</div>' +
      '<div class="mini" style="margin-bottom:14px">这条素材最适合放在哪个层面？</div>' + opts +
      (eCtx.pick != null ? '<div class="fb ' + (eCtx.pick === q.group ? 'ok' : 'no') + '">' +
        (eCtx.pick === q.group ? '对，' : '它属于') + q.group + '层面：' + esc(q.cn) +
        '</div><button class="btn primary block" style="margin-top:12px" onclick="eSortNext()">下一条</button>' : '') +
    '</div>';
}
function eSortPick(d) {
  if (eCtx.pick != null) return;
  const q = eCtx.qs[eCtx.i];
  eCtx.pick = d;
  const ok = d === q.group;
  if (ok) eCtx.right++; else eCtx.wrong++;
  eMark(q.id, ok);
  eSave(); eRender();
}
function eSortNext() { eCtx.i++; eCtx.pick = null; eRender(); }

/* ---------- 模板 / 结构 ---------- */
function eTpl(box) {
  const rows = ETPL.map(t => {
    const seen = !!(ES.tplSeen || {})[t.id];
    return '<div class="ecard"><div class="flexline"><span class="pill">' + esc(t.part) + '</span><span class="spacer"></span>' +
      '<button class="btn sm ' + (seen ? '' : 'primary') + '" onclick="eTplSeen(\'' + t.id + '\')">' + (seen ? '已读' : '标记已读') + '</button></div>' +
      '<h2 style="margin:8px 0 4px">' + esc(t.name) + '</h2>' +
      '<div class="een">' + esc(t.en) + '</div><div class="ecn">' + esc(t.cn) + '</div>' +
      (t.use ? '<div class="etip">' + esc(t.use) + '</div>' : '') +
      '<div class="mini" style="margin-top:6px">' + esc(t.src) + '</div></div>';
  }).join('');
  const st = ESTR.map(s =>
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">' + esc(s.name) + '</h2><span class="spacer"></span><span class="pill">' + esc(s.tag) + '</span></div>' +
    '<div class="note">' + esc(s.desc) + '</div>' +
    '<div class="esteps">' + s.steps.map((x, i) => '<div class="erow"><span class="enum">' + (i + 1) + '</span><div style="flex:1">' + esc(x) + '</div></div>').join('') + '</div>' +
    '<details style="margin-top:10px"><summary class="mini" style="cursor:pointer">展开整篇骨架</summary><div class="eframe">' + esc(s.frame) + '</div></details>' +
    '<div class="mini" style="margin-top:6px">' + esc(s.src) + '</div></div>'
  ).join('');
  const done = Object.keys(ES.tplSeen || {}).length;
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">骨架课</h2><span class="spacer"></span><span class="pill">' + done + '/' + ETPL.length + '</span></div>' +
      '<div class="note">先看开头、主体、结尾怎么搭，再看三类文章的整体骨架。模板是脚手架，最后要拆掉。</div>' +
      '<div class="ebar" style="margin-top:10px"><i style="width:' + ePct(done, ETPL.length) + '%"></i></div></div>' +
    rows + '<div class="hr"></div>' + st;
}
function eTplSeen(id) {
  if (!ES.tplSeen) ES.tplSeen = {};
  if (!ES.tplSeen[id]) {
    ES.tplSeen[id] = Date.now();
    eAddXp(8);
    eBadges();
    eSave();
    toast('已读 +8 XP');
  }
  eRender();
}

/* ---------- 预测题列表 / 详情 ---------- */
function eTopics(box) {
  const cards = ETOP.map((t, i) => {
    const es = (ES.essays || {})[t.id];
    const draft = (ES.drafts || {})[t.id];
    const st = es ? '<span class="tag">已完成 ' + es.words + ' 词</span>' : draft ? '<span class="tag warn">有草稿</span>' : '<span class="tag gray">未写</span>';
    return '<button class="etopic" onclick="eGo(\'topic\',{id:\'' + t.id + '\'})">' +
      '<span class="tn">' + (i + 1) + '. ' + esc(t.title) + '</span>' +
      '<span class="mini">' + esc(t.type) + (t.tag ? ' · ' + esc(t.tag) : '') + '</span>' +
      '<span class="trow">' + st + '<span class="ego">›</span></span></button>';
  }).join('');
  const done = Object.keys(ES.essays || {}).length;
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">15 道写作预测</h2><span class="spacer"></span><span class="pill">' + done + '/' + ETOP.length + '</span></div>' +
      '<div class="note">每题都有题干、审题提纲、范文和中文对照。先审题，再写，最后对照。写不完也先写一段。</div></div>' +
    '<div class="ecard">' + cards + '</div>';
}
function eTopic(box) {
  const t = ETOP.find(x => x.id === eCtx.id);
  if (!t) { eGo('topics'); return; }
  const es = (ES.essays || {})[t.id];
  box.innerHTML = eBack('写作台', 'topics') +
    '<div class="ecard"><div class="meta"><span class="pill">' + esc(t.type) + '</span><span class="mini">' + esc(t.tag || '') + '</span></div>' +
      '<h2 style="font-size:18px;margin:6px 0 10px">' + esc(t.title) + '</h2>' +
      '<div class="eprompt">' + esc(t.prompt) + '</div>' +
      '<div class="mini" style="margin-top:8px">题干要求：至少 150 词，不超过 200 词；开头抄写题干首句。</div></div>' +
    '<div class="ecard"><h2>审题三步 <span class="thin">先想清楚再动笔</span></h2>' +
      '<div class="note">1. 核心概念是什么？　2. 我的立场是什么？　3. 两个分论点 + 一个例子。</div>' +
      '<details style="margin-top:10px"><summary class="btn sm" style="display:inline-flex;cursor:pointer">看参考提纲</summary>' +
        '<div class="esteps" style="margin-top:10px">' + t.points.map((p, i) => '<div class="erow"><span class="enum">' + (i + 1) + '</span><div style="flex:1">' + esc(p) + '</div></div>').join('') + '</div></details>' +
      '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="eGo(\'write\',{id:\'' + t.id + '\'})">去写这篇</button>' +
      '<button class="btn" onclick="eGo(\'cards\',{ids:eTopicIds(\'' + t.id + '\')})">先背相关句</button></div></div>' +
    '<div class="ecard"><h2>参考范文 <span class="thin">写完再看</span></h2>' +
      '<div class="een" style="white-space:pre-wrap">' + esc(t.model) + '</div>' +
      '<details style="margin-top:12px"><summary class="mini" style="cursor:pointer">展开中文对照</summary><div class="ecn" style="margin-top:8px">' + esc(t.cn) + '</div></details>' +
      '<div class="mini" style="margin-top:8px">' + esc(t.src) + '</div></div>' +
    (es ? '<div class="ecard"><h2>我的这篇</h2><div class="note">' + new Date(es.at).toLocaleString() + ' · ' + es.words + ' 词</div>' +
      '<button class="btn block" style="margin-top:10px" onclick="eGo(\'write\',{id:\'' + t.id + '\'})">打开重写 / 修改</button></div>' : '');
}
function eTopicIds(id) {
  const t = ETOP.find(x => x.id === id);
  if (!t) return [];
  const kws = (t.tag || '').split(/[·、/]/).filter(Boolean);
  const hit = EPAT.filter(p => kws.some(k => (p.cn + p.en).includes(k))).slice(0, 5).map(p => p.id);
  return hit.length ? hit : EPAT.slice(0, 5).map(p => p.id);
}

/* ---------- 写作台 ---------- */
function eWrite(box) {
  const t = ETOP.find(x => x.id === eCtx.id);
  if (!t) { eGo('topics'); return; }
  if (eCtx.text == null) eCtx.text = (ES.drafts || {})[t.id] || '';
  if (!eCtx.start) eCtx.start = Date.now();
  if (!eCtx.checks) eCtx.checks = {};
  const words = eWordCount(eCtx.text);
  const checks = [
    '抄了题干首句，且没有抄错',
    '每段有主题句，段间有连接词',
    '主体段两个分论点，各配例子或因果',
    '用了至少 3 个高级替换词或加分句型',
    '结尾回扣主题，没有引入新观点',
    '检查过主谓一致、单复数、时态'
  ];
  box.innerHTML = eBack('写作台', 'topics') +
    '<div class="ecard"><div class="meta"><span class="pill">限时写作</span><span class="mini" id="ewTimer">00:00</span></div>' +
      '<div class="etitle" style="font-size:16px">' + esc(t.title) + '</div>' +
      '<div class="eprompt" style="margin-top:8px;font-size:13px">' + esc(t.prompt) + '</div></div>' +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">我的作文</h2><span class="spacer"></span>' +
      '<span class="pill" id="ewCount">' + words + ' 词</span></div>' +
      '<textarea id="ewText" class="ewrite" placeholder="从这里开始写。先抄题干首句，再写主体段……" oninput="eWriteInput(this.value)">' + esc(eCtx.text) + '</textarea>' +
      '<div class="mini" style="margin-top:6px">目标 150–200 词。草稿自动存在本机。</div>' +
      '<div class="btnrow" style="margin-top:12px"><button class="btn" onclick="eWriteSave()">保存草稿</button>' +
      '<button class="btn primary" onclick="eWriteSubmit()">交卷</button></div></div>' +
    '<div class="ecard"><h2>交卷前自检 <span class="thin">点一下打勾</span></h2>' +
      checks.map((c, i) => '<label class="echeck"><input type="checkbox" ' + (eCtx.checks[i] ? 'checked' : '') + ' onchange="eWriteCheck(' + i + ',this.checked)"> <span>' + c + '</span></label>').join('') +
      '<div class="mini" style="margin-top:8px">自检不是形式。每次只盯一项，改完再下一项。</div></div>' +
    '<div class="ecard"><h2>可复用句块 <span class="thin">从范文里挑</span></h2>' +
      '<div class="note">范文首句、转折句、结尾句可以直接学结构，不要整段照抄。</div>' +
      eReuse(t) + '</div>';
  if (eTimer) clearInterval(eTimer);
  eTimer = setInterval(() => {
    const el = document.getElementById('ewTimer');
    if (!el) { clearInterval(eTimer); eTimer = null; return; }
    const s = Math.floor((Date.now() - eCtx.start) / 1000);
    el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }, 1000);
}
function eReuse(t) {
  const sents = (t.model || '').split(/(?<=[.!?])\s+(?=[A-Z“"])/).filter(Boolean);
  const picks = [sents[0], sents.find(s => /^(Admittedly|Nevertheless|However)/.test(s)), sents[sents.length - 1]].filter(Boolean);
  return picks.map(s => '<div class="erow"><div style="flex:1">' + esc(s) + '</div>' +
    '<button class="btn sm" onclick="speakText(this)" data-t="' + esc(s).replace(/"/g, '&quot;') + '">读</button></div>').join('');
}
function eWordCount(s) { return (String(s || '').trim().match(/[A-Za-z][A-Za-z'-]*/g) || []).length; }
function eWriteInput(v) {
  eCtx.text = v;
  const w = eWordCount(v);
  const c = document.getElementById('ewCount');
  if (c) c.textContent = w + ' 词';
  (ES.drafts || (ES.drafts = {}))[eCtx.id] = v;
  eSave();
}
function eWriteSave() { eWriteInput(eCtx.text); if (!ES.drafts[eCtx.id]) ES.drafts[eCtx.id] = eCtx.text; eSave(); toast('草稿已存'); }
function eWriteCheck(i, on) { eCtx.checks[i] = on; }
function eWriteSubmit() {
  const words = eWordCount(eCtx.text);
  if (words < 40) { toast('至少写 40 词再交'); return; }
  eStop();
  eCtx.id && (ES.drafts[eCtx.id] = eCtx.text);
  ES.essays[eCtx.id] = { at: Date.now(), words, checks: eCtx.checks, text: eCtx.text };
  const d = eDay(); d.write = (d.write || 0) + 1;
  eAddXp(40 + Math.min(60, Math.floor(words / 2)));
  eBadges(); eSave();
  eView = 'writeResult';
  eRender();
}
function eWriteResult(box) {
  const t = ETOP.find(x => x.id === eCtx.id);
  const es = ES.essays[eCtx.id] || { words: eWordCount(eCtx.text) };
  const checked = Object.keys(eCtx.checks || {}).filter(k => eCtx.checks[k]).length;
  box.innerHTML = eBack('写作台', 'topics') +
    '<div class="ecard ecenter"><div class="ebig">✓</div><div class="etitle">这篇交掉了</div>' +
      '<div class="note">' + es.words + ' 词 · 自检 ' + checked + '/6 · 今日 ' + eDay().xp + ' XP</div>' +
      '<div class="btnrow" style="margin-top:16px"><button class="btn primary" onclick="eGo(\'topic\',{id:\'' + eCtx.id + '\'})">对照范文</button>' +
      '<button class="btn" onclick="eGo(\'topics\')">换一题</button></div></div>' +
    '<div class="ecard"><h2>我的原文</h2><div class="ewritten">' + esc(es.text || eCtx.text) + '</div></div>' +
    '<div class="ecard"><h2>范文对照</h2><div class="een" style="white-space:pre-wrap">' + esc(t.model) + '</div>' +
      '<details style="margin-top:10px"><summary class="mini" style="cursor:pointer">中文对照</summary><div class="ecn">' + esc(t.cn) + '</div></details></div>';
}

/* ---------- 60 秒挑战 ---------- */
function eQuick() {
  if (Math.random() < 0.58) {
    const pats = EPAT.filter(p => eBlank(p.en || ''));
    const p = eRand(pats);
    const b = eBlank(p.en);
    const bank = EPAT.map(o => { const z = eBlank(o.en || ''); return z ? z.a : ''; }).filter(Boolean);
    const opts = [b.a];
    const seen = {}; seen[b.a.toLowerCase()] = 1;
    shuffle(bank.filter(w => w.toLowerCase() !== b.a.toLowerCase())).forEach(w => {
      if (opts.length < 4 && !seen[w.toLowerCase()]) { opts.push(w); seen[w.toLowerCase()] = 1; }
    });
    return { id: p.id, q: b.q, ans: b.a, opts: shuffle(opts), sub: p.fn || '句型填空', type: 'pattern' };
  }
  const p = eRand(EPHR);
  const opts = [p.en];
  const seen = {}; seen[p.en] = 1;
  shuffle(EPHR.filter(o => o.id !== p.id)).forEach(o => {
    if (opts.length < 4 && !seen[o.en]) { opts.push(o.en); seen[o.en] = 1; }
  });
  return { id: p.id, q: p.cn, ans: p.en, opts: shuffle(opts), sub: '选出正确英文搭配', type: 'phrase' };
}
function eChallenge(box) {
  if (!eCtx.q) {
    eCtx = { mode: 'challenge', q: eQuick(), score: 0, wrong: 0, endAt: Date.now() + 60000, pick: null, locked: false, ended: false };
  }
  const q = eCtx.q;
  const left = Math.max(0, Math.ceil((eCtx.endAt - Date.now()) / 1000));
  if (left <= 0) { eChallengeEnd(box); return; }
  const opts = q.opts.map(o => {
    let cls = '';
    if (eCtx.pick != null) {
      if (o === q.ans) cls = ' correct';
      else if (o === eCtx.pick) cls = ' wrong';
    }
    return '<button class="opt' + cls + '" onclick="eChallengePick(this)" data-o="' + esc(o).replace(/"/g, '&quot;') + '">' + esc(o) + '</button>';
  }).join('');
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">60 秒挑战</h2><span class="spacer"></span>' +
      '<span class="pill" id="echTime">' + left + 's</span><span class="pill">得分 ' + eCtx.score + '</span></div>' +
      '<div class="ebar" style="margin-top:8px"><i id="echBar" style="width:' + (left / 60 * 100) + '%"></i></div>' +
      '<div class="mini" style="margin-top:6px">' + esc(q.sub) + ' · 连击 ' + (ES.combo || 0) + '</div>' +
      '<div class="qtext" style="margin:10px 0 14px">' + esc(q.q) + '</div>' + opts + '</div>';
  if (eTimer) clearInterval(eTimer);
  eTimer = setInterval(() => {
    const el = document.getElementById('echTime');
    if (!el) { clearInterval(eTimer); eTimer = null; return; }
    const l = Math.max(0, Math.ceil((eCtx.endAt - Date.now()) / 1000));
    el.textContent = l + 's';
    const b = document.getElementById('echBar');
    if (b) b.style.width = (l / 60 * 100) + '%';
    if (l <= 0) { clearInterval(eTimer); eTimer = null; eChallengeEnd(document.getElementById('essayBody')); }
  }, 250);
}
function eChallengePick(btn) {
  if (eCtx.pick != null || eCtx.ended) return;
  const q = eCtx.q;
  const o = btn.getAttribute('data-o');
  eCtx.pick = o;
  const ok = o === q.ans;
  if (ok) eCtx.score++; else eCtx.wrong++;
  eMark(q.id, ok, ok ? 3 : 0);
  eSave();
  const body = document.getElementById('essayBody');
  if (body) eRender();
  setTimeout(() => {
    if (eView !== 'challenge' || eCtx.ended) return;
    const left = eCtx.endAt - Date.now();
    if (left <= 0) { eChallengeEnd(document.getElementById('essayBody')); return; }
    eCtx.q = eQuick(); eCtx.pick = null; eRender();
  }, ok ? 260 : 700);
}
function eChallengeEnd(box) {
  eStop();
  if (!box || eCtx.ended) return;
  eCtx.ended = true;
  if (eCtx.score > (ES.challengeBest || 0)) ES.challengeBest = eCtx.score;
  eBadges(); eSave();
  eResult(box, '时间到', eCtx.score, eCtx.score + eCtx.wrong,
    '<div class="note" style="margin-top:8px">最高纪录 ' + (ES.challengeBest || 0) + ' 题 / 60 秒。错 ' + eCtx.wrong + ' 题。</div>');
}

/* ---------- 语料库 ---------- */
let eLibTab = 'pattern', eLibQ = '';
function eLib(box) {
  box.innerHTML = eBack() +
    '<div class="ecard"><div class="flexline"><h2 style="margin:0">语料库</h2><span class="spacer"></span>' +
      '<span class="mini">' + EALL.length + ' 条</span></div>' +
      '<input type="text" id="elibSearch" placeholder="搜中文或英文，如 开头 / benefit / 感恩" value="' + esc(eLibQ) + '" oninput="eLibSet(this.value)">' +
      '<div class="chips" id="elibTabs">' +
        eLibTabBtn('pattern', '句型 ' + EPAT.length) + eLibTabBtn('phrase', '搭配 ' + EPHR.length) +
        eLibTabBtn('material', '素材 ' + EMAT.length) + eLibTabBtn('template', '模板 ' + ETPL.length) +
        eLibTabBtn('topic', '范文 ' + ETOP.length) +
      '</div></div>' +
    '<div id="elibList"></div>';
  eLibList();
}
function eLibTabBtn(v, label) { return '<button class="chip ' + (eLibTab === v ? 'on' : '') + '" onclick="eLibTabTo(\'' + v + '\')">' + label + '</button>'; }
function eLibTabTo(v) { eLibTab = v; const b = document.getElementById('essayBody'); if (b) eLib(b); }
function eLibSet(v) { eLibQ = v; eLibList(); }
function eLibList() {
  const box = document.getElementById('elibList');
  if (!box) return;
  const q = eLibQ.trim().toLowerCase();
  const hit = s => !q || String(s).toLowerCase().indexOf(q) >= 0;
  let html = '';
  if (eLibTab === 'pattern') {
    const rows = EPAT.filter(x => hit(x.en + x.cn + (x.fn || '')));
    html = rows.map(x => eLibRow(x, x.fn, x.en, x.cn, x.tip)).join('');
  } else if (eLibTab === 'phrase') {
    const rows = EPHR.filter(x => hit(x.en + x.cn));
    html = rows.map(x => eLibRow(x, '搭配', x.en, x.cn, '')).join('');
  } else if (eLibTab === 'material') {
    const rows = EMAT.filter(x => hit(x.en + x.cn + (x.group || '')));
    html = rows.map(x => eLibRow(x, x.group, x.en, x.cn, '')).join('');
  } else if (eLibTab === 'template') {
    html = ETPL.filter(x => hit(x.en + x.cn + x.name)).map(x =>
      '<div class="ecard"><div class="meta"><span class="pill">' + esc(x.part) + '</span><span class="mini">' + esc(x.name) + '</span></div>' +
      '<div class="een">' + esc(x.en) + '</div><div class="ecn">' + esc(x.cn) + '</div></div>').join('');
  } else {
    html = ETOP.filter(x => hit(x.title + x.model + x.cn)).map(x =>
      '<div class="ecard"><div class="meta"><span class="pill">' + esc(x.type) + '</span><span class="mini">' + esc(x.tag || '') + '</span></div>' +
      '<h2 style="margin:6px 0">' + esc(x.title) + '</h2><div class="een" style="white-space:pre-wrap">' + esc(x.model) + '</div></div>').join('');
  }
  box.innerHTML = html || '<div class="empty">没有匹配的条目</div>';
}
function eLibRow(x, tag, en, cn, tip) {
  const fav = !!(ES.fav || {})[x.id];
  return '<div class="ecard elibrow"><div class="flexline"><span class="pill">' + esc(tag || '') + '</span><span class="spacer"></span>' +
    '<button class="btn sm" onclick="eFav(\'' + x.id + '\',this)">' + (fav ? '★' : '☆') + '</button>' +
    '<button class="btn sm" onclick="eSpeak(\'' + x.id + '\')">读</button></div>' +
    '<div class="een">' + esc(en) + '</div>' + (cn ? '<div class="ecn">' + esc(cn) + '</div>' : '') +
    (tip ? '<div class="etip">' + esc(tip) + '</div>' : '') + '</div>';
}
function eFav(id, btn) {
  if (!ES.fav) ES.fav = {};
  if (ES.fav[id]) { delete ES.fav[id]; if (btn) btn.textContent = '☆'; }
  else { ES.fav[id] = 1; if (btn) btn.textContent = '★'; toast('已收藏'); }
  eSave();
}

/* ---------- 导出 / 导入 / 清空 钩子 ---------- */
function eExportState() { return { v: ES.v, items: ES.items, days: ES.days, combo: ES.combo, best: ES.best,
  badges: ES.badges, fav: ES.fav, drafts: ES.drafts, essays: ES.essays, tplSeen: ES.tplSeen,
  goal: ES.goal, challengeBest: ES.challengeBest }; }
function eImportState(o) {
  if (!o || typeof o !== 'object') return;
  try { localStorage.setItem(EKEY, JSON.stringify(Object.assign(JSON.parse(JSON.stringify(EDEF)), o))); } catch (e) {}
  ES = eLoad();
}
function eResetAll() { ES = JSON.parse(JSON.stringify(EDEF)); eSave(); eView = 'home'; eCtx = {}; }

/* ---------- 样式 ---------- */
(function eStyle() {
  const css = `
  .ecard{background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px;margin-bottom:11px;
    box-shadow:0 1px 2px rgba(30,42,36,.03),0 8px 24px -20px rgba(30,42,36,.25)}
  .ecard+.ecard{margin-top:0}
  .ehero{background:linear-gradient(160deg,#f2f8f3 0%,#fff 60%);border-color:#d6e6db}
  .etitle{font-size:20px;font-weight:650;letter-spacing:.2px}
  .egrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}
  .estat{background:#fff;border:1px solid #e7ece7;border-radius:11px;padding:9px;text-align:center}
  .estat b{display:block;font-size:20px;font-variant-numeric:tabular-nums;color:var(--accent)}
  .estat span{font-size:11px;color:var(--sub)}
  .ering{width:68px;height:68px;border-radius:50%;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:conic-gradient(var(--accent) calc(var(--p)*1%),#e6ebe6 0);position:relative}
  .ering::after{content:'';position:absolute;inset:6px;background:#fff;border-radius:50%}
  .ering b,.ering span{position:relative;z-index:1}
  .ering b{font-size:16px;color:var(--accent)}
  .ering span{font-size:9px;color:var(--sub)}
  .ebar{height:8px;background:#e8ece8;border-radius:6px;overflow:hidden}
  .ebar>i{display:block;height:100%;background:linear-gradient(90deg,#4d8f74,#2f6b58);border-radius:6px;transition:width .35s}
  .ebar.big{height:10px;margin-top:12px}
  .efinish{margin-top:10px;font-size:12.5px;color:var(--accent);background:var(--accent-soft);border-radius:9px;padding:8px 10px}
  .etask{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px dashed #eef0ed}
  .etask:last-child{border-bottom:0}
  .etask .edot{width:22px;height:22px;border-radius:50%;border:1.5px solid #d5ddd5;flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff}
  .etask.on .edot{background:var(--accent);border-color:var(--accent)}
  .etask.on b{color:var(--sub);text-decoration:line-through}
  .epath{display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:#fbfcfb;border:1px solid #e8ece7;
    border-radius:12px;padding:11px;margin-bottom:8px;font-family:inherit;cursor:pointer;color:var(--ink);transition:.12s}
  .epath:hover{border-color:#c9d7cd;transform:translateY(-1px)}
  .epath .enum,.erow .enum{width:22px;height:22px;border-radius:7px;background:var(--accent-soft);color:var(--accent);
    font-size:12px;font-weight:650;display:flex;align-items:center;justify-content:center;flex:none}
  .epath .ebody{flex:1;display:flex;flex-direction:column;min-width:0}
  .epath .ebody b{font-size:14px}
  .epath .ebar{margin-top:5px;height:5px}
  .epath .ego{font-size:12px;color:var(--accent);flex:none}
  .emodes{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
  .emode{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:#fbfcfb;border:1px solid #e8ece7;
    border-radius:12px;padding:12px;font-family:inherit;cursor:pointer;text-align:left;color:var(--ink);transition:.12s;min-height:84px}
  .emode:hover{border-color:#b9cbbf;transform:translateY(-1px);box-shadow:0 8px 18px -16px rgba(30,42,36,.5)}
  .emode .mi{font-size:19px;color:var(--accent);line-height:1}
  .emode b{font-size:14px;margin-top:3px}
  .emode .mini{font-size:11px}
  .erow{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-bottom:1px dashed #eef0ed;cursor:pointer}
  .erow:last-child{border-bottom:0}
  .een{font-size:14.5px;line-height:1.6;color:#232a26}
  .ecn{font-size:13px;color:var(--sub);margin-top:4px;line-height:1.6}
  .etip{font-size:12.5px;color:#5a6b60;background:#f4f7f3;border-radius:8px;padding:7px 9px;margin-top:8px;line-height:1.6}
  .ebig{font-size:42px;font-weight:700;color:var(--accent);line-height:1.1;margin-bottom:6px}
  .ecenter{text-align:center}
  .eflash{display:block;width:100%;background:transparent;border:0;padding:0;font-family:inherit;text-align:left;cursor:pointer}
  .effront,.eback{display:block;border-radius:13px;padding:20px 16px;min-height:210px;transition:.2s}
  .effront{background:linear-gradient(160deg,#f4f8f4,#fff);border:1px dashed #cfdcd3}
  .eflash.flip .effront{display:none}
  .eback{display:none;background:#fbfcfb;border:1px solid #e4e9e3}
  .eflash.flip .eback{display:block}
  .efront-tag{font-size:11px;color:var(--accent);background:var(--accent-soft);border-radius:20px;padding:2px 9px;display:inline-block}
  .efront-t{display:block;font-size:20px;line-height:1.65;margin-top:14px;font-weight:500}
  .efront-h{display:block;font-size:11px;color:var(--sub);margin-top:22px}
  .ebacks .een{font-size:17px;line-height:1.75}
  .erates{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}
  .erates .btn{padding:8px 2px;font-size:12.5px;min-height:40px}
  .ematch{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
  .emcol{display:flex;flex-direction:column;gap:8px}
  .emitem{font-family:inherit;font-size:13px;line-height:1.45;text-align:left;background:#fff;border:1px solid var(--line);
    border-radius:10px;padding:10px;cursor:pointer;color:var(--ink);transition:.12s;min-height:54px}
  .emitem:hover{border-color:#c3d3c8}
  .emitem.sel{border-color:var(--accent);background:var(--accent-soft)}
  .emitem.done{border-color:#a9cdb9;background:#eef6f1;color:#3f7a5f;pointer-events:none}
  .ebuild{min-height:58px;border:1px dashed #cfdad2;border-radius:11px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;background:#fafbfa}
  .ebuildpool{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
  .etok{font-family:inherit;font-size:13.5px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px 10px;cursor:pointer;color:var(--ink)}
  .etok.on{background:var(--accent-soft);border-color:#c3d8cb;color:var(--accent);font-weight:600}
  .etok.used{opacity:.28;pointer-events:none}
  .esents{display:flex;flex-direction:column;gap:7px}
  .esent{font-family:inherit;font-size:13.5px;line-height:1.55;text-align:left;background:#fff;border:1px solid var(--line);
    border-radius:10px;padding:10px;cursor:pointer;color:var(--ink)}
  .esent.on{background:var(--accent-soft);border-color:#c3d8cb}
  .esent.used{opacity:.3;pointer-events:none}
  .eprompt{font-size:14px;line-height:1.7;background:#f7f9f6;border-left:3px solid #bcd3c3;border-radius:0 9px 9px 0;padding:10px 12px}
  .esteps{margin-top:10px}
  .etopic{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;background:#fff;border:1px solid #e8ece7;
    border-radius:12px;padding:12px;margin-bottom:8px;font-family:inherit;text-align:left;cursor:pointer;color:var(--ink);transition:.12s}
  .etopic:hover{border-color:#c3d3c8;background:#fbfcfb}
  .etopic .tn{font-size:14.5px;font-weight:600;line-height:1.5}
  .etopic .trow{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:4px}
  .ewrite{min-height:300px;font-size:15px;line-height:1.85;background:#fff}
  .ewritten{font-size:14px;line-height:1.85;white-space:pre-wrap;background:#fbfcfb;border:1px solid #eef0ed;border-radius:10px;padding:11px}
  .echeck{display:flex;gap:9px;align-items:flex-start;padding:8px 0;font-size:13.5px;line-height:1.5;border-bottom:1px dashed #eef0ed;cursor:pointer}
  .echeck:last-child{border-bottom:0}
  .echeck input{width:18px;height:18px;margin-top:1px;accent-color:var(--accent);flex:none}
  .ebadges{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
  .ebadge{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid #e9ece8;border-radius:11px;padding:9px 4px;background:#fbfcfb;opacity:.45}
  .ebadge.on{opacity:1;background:linear-gradient(160deg,#f2f8f3,#fff);border-color:#cfe0d6}
  .ebadge .bi{font-size:19px;color:#9aa89f}
  .ebadge.on .bi{color:var(--accent)}
  .ebadge .bn{font-size:10.5px;color:var(--sub)}
  .eframe{font-size:13px;line-height:1.8;color:#3d4a43;background:#fbfcfb;border:1px dashed #d8e2da;border-radius:10px;padding:10px;margin-top:8px;white-space:pre-wrap}
  .elibrow{padding:12px}
  @media(max-width:420px){
    .efront-t{font-size:18px}
    .egrid3{gap:7px}
    .estat b{font-size:18px}
    .ebadges{grid-template-columns:repeat(3,1fr)}
  }`;
  const st = document.createElement('style');
  st.id = 'essayStyle';
  st.textContent = css;
  document.head.appendChild(st);
})();
