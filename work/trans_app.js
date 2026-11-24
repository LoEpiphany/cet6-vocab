/* ================= 翻译专项 ================= */
const TR = (typeof DATA !== 'undefined' && DATA.trans) ? DATA.trans : { modules: [], items: [], examples: [] };
const TMODS = TR.modules || [];
const TITEMS = TR.items || [];
const TEXS = TR.examples || [];
const TBY = {};
TITEMS.forEach(x => TBY[x.id] = x);
const TMODBY = {};
TMODS.forEach(m => TMODBY[m.id] = m);
const TTYPE_NAME = {
  e2c: '英→中', c2e: '中→英', cat: '类别归位', near: '易混辨析',
  scene: '场景选词', odd: '找不同类', spell: '拼写', dictation: '听写',
  cloze: '例句填空', pattern: '句型'
};
const TMOD_TYPES = {
  terms: ['e2c', 'c2e', 'cat', 'near'],
  themes: ['scene', 'odd', 'c2e'],
  freq: ['spell', 'dictation', 'cloze', 'c2e']
};
const TSCENE = {
  '通用表达': '写开头、结尾或数据表述时',
  '国家发展': '写经济、乡村振兴、对外开放时',
  '社会民生': '写教育、医疗、社区生活时',
  '历史文化': '介绍一座古城、一项传统技艺或一个节日时',
  '科技创新': '写航天、数字生活、新技术时',
  '地理生态': '写山川、景区、自然保护时',
  '城市建设': '写交通、工程、城市空间时',
  '自然风光': '描写一处山水或景区时',
  '饮食佳节': '介绍中国菜、节日习俗时',
  '社会发展': '写近些年的变化、生活水平时',
  '科技教育': '写手机、网络、教育方式时',
  '医疗健康': '写养老、医疗、锻炼时',
  '科技与工程': '写航天、港口、工程技术时',
  '传统文化': '写传统美德、文化遗产时',
  '地理与区域': '写高原、河流、区域位置时',
  '环保与生态': '写污染治理、清洁能源时',
  '基础设施与工程': '写桥梁、水利、港口时',
  '专有名词': '写中国特有的地名、工程名时',
  '高频句型': '组织开头、递进或总结句时'
};
let TQ = null, tView = 'home', TUI = null;
const TRESUME_KEY = 'cet6vocab_2026_tquiz_v1';
function tResumeData() { try { return JSON.parse(localStorage.getItem(TRESUME_KEY) || 'null'); } catch (e) { return null; } }
function tSaveResume(advance) {
  if (!TQ || TQ.done || !TQ.ids || !TQ.ids.length) return;
  try {
    localStorage.setItem(TRESUME_KEY, JSON.stringify({
      ids: TQ.ids, i: Math.min(TQ.ids.length, TQ.i + (advance ? 1 : 0)), len: TQ.len,
      right: TQ.right, wrong: TQ.wrong, per: TQ.per, retry: TQ.retry, types: TQ.types,
      m: tState().m, t0: TQ.t0, qn: TQ.qn, at: Date.now()
    }));
  } catch (e) {}
}
function tClearResume() { try { localStorage.removeItem(TRESUME_KEY); } catch (e) {} }
function tResumeQuiz() {
  const s = tResumeData();
  const ids = (s && s.ids ? s.ids : []).filter(id => TBY[id]);
  if (!s || !ids.length || s.i >= ids.length) { tClearResume(); tRenderHome(); return; }
  tState().m = s.m || 'terms';
  TQ = { ids: ids, i: Math.min(s.i, ids.length - 1), len: ids.length, right: s.right || 0, wrong: s.wrong || 0,
    per: s.per || {}, retry: s.retry || {}, types: s.types || (TMOD_TYPES[s.m] || ['e2c']).slice(),
    cur: null, locked: false, t0: s.t0 || Date.now(), qn: s.qn || 0, lastType: '', done: false, qd: {} };
  tView = 'quiz';
  tShowOnly('transQuiz');
  tHead();
  tNext();
  toast('接着上次，第 ' + (TQ.i + 1) + ' 条');
}
function tDiscardResume() { tClearResume(); tRenderHome(); toast('这轮先放下，随时能重开'); }

function tState() { if (!S.t) S.t = { m: 'terms', w: {}, d: {} }; return S.t; }
function tItemsOf(mod) { return TITEMS.filter(x => x.mods.indexOf(mod) >= 0); }
function tRec(id) { return tState().w[id] || null; }
function tEnsure(id) {
  const st = tState();
  if (!st.w[id]) st.w[id] = { b: 0, due: today(), seen: 0, r: 0, x: 0, f: 0, last: 0, rc: 0, retired: 0, mm: 0, fav: 0 };
  if (st.w[id].rc == null) st.w[id].rc = 0;
  if (st.w[id].retired == null) st.w[id].retired = 0;
  if (st.w[id].mm == null) st.w[id].mm = 0;
  if (st.w[id].fav == null) st.w[id].fav = 0;
  return st.w[id];
}
function tDayRec(ds) {
  const st = tState();
  if (!st.d[ds]) st.d[ds] = { q: 0, c: 0, n: 0 };
  return st.d[ds];
}
function tSeen(x) { const r = tRec(x.id); return !!(r && r.seen); }
function tCat(x) { return (x.cats && x.cats[tState().m]) || ''; }

function tStats(modId) {
  const all = modId ? tItemsOf(modId) : TITEMS;
  const td = today();
  let seen = 0, due = 0, wrong = 0, master = 0, retired = 0, manual = 0, fav = 0;
  all.forEach(x => {
    const r = tRec(x.id);
    if (r && r.fav) fav++;
    if (r && r.mm) manual++;
    if (!r || !r.seen) return;
    seen++;
    if (r.mm) { master++; return; }
    if (r.retired) { retired++; master++; return; }
    if (r.due <= td) due++;
    if (r.x > 0) wrong++;
    if (r.b >= 3) master++;
  });
  return { arr: all, total: all.length, seen: seen, due: due, wrong: wrong, master: master, retired: retired, manual: manual, fav: fav,
    pct: all.length ? Math.round(seen / all.length * 100) : 0 };
}
function tShowOnly(which) {
  ['transHome', 'transMod', 'transQuiz', 'transSum'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === which ? 'block' : 'none';
  });
}
function tHead() {
  const brand = document.querySelector('.brand');
  if (brand) { brand.classList.add('trans'); brand.textContent = '六级翻译专项 · ' + TITEMS.length + ' 条'; }
  const st = tStats(null), d = tState().d[today()] || {};
  const sub = document.getElementById('subline');
  if (sub) sub.innerHTML = '翻译区 · 已练 ' + st.seen + '/' + TITEMS.length + ' · 今日 ' + (d.q || 0) + ' 题 · 三份讲义分开算';
}
function tNav() {
  tHead();
  if (!TMODS.length) { tRenderHome(); return; }
  if (tView === 'quiz' && TQ && !TQ.done) tShowOnly('transQuiz');
  else if (tView === 'mod') tRenderMod();
  else if (tView === 'sum' && TQ && TQ.done) tShowOnly('transSum');
  else tRenderHome();
}

/* ---------- 首页 ---------- */
function tRenderHome() {
  tView = 'home';
  tShowOnly('transHome');
  tHead();
  const st = tStats(null);
  const first = st.seen === 0;
  const rs = tResumeData();
  const resume = rs && rs.ids && rs.i < rs.ids.length && Date.now() - rs.at < 30 * 60 * 1000
    ? '<div class="card" style="border-color:#cfe0d6"><div class="flexline"><h2 style="margin:0">接着上次</h2>' +
      '<span class="spacer"></span><span class="mini">' + Math.min(rs.i + 1, rs.len) + ' / ' + rs.len + '</span></div>' +
      '<div class="note" style="margin-top:6px">上次停在「' + esc((TMODBY[rs.m] || {}).name || '翻译') + '」第 ' +
      (rs.i + 1) + ' 条，已经答过 ' + Object.keys(rs.per || {}).length + ' 条。不用重头来。</div>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn primary" onclick="tResumeQuiz()">接着练</button>' +
      '<button class="btn" onclick="tDiscardResume()">这轮不练了</button></div></div>' : '';
  const modRows = TMODS.map(m => {
    const s = tStats(m.id);
    return '<button class="tmod" onclick="tEnter(\'' + m.id + '\')">' +
      '<span class="th"><span class="tn">' + esc(m.name) + '</span>' +
      '<span class="tc">' + s.total + ' 条</span><span class="spacer"></span>' +
      '<span class="tc">已练 ' + s.seen + ' · ' + s.pct + '%</span></span>' +
      '<span class="tg">' + esc(m.goal) + '</span>' +
      '<span class="cbar"><i style="width:' + s.pct + '%"></i></span>' +
      '<span class="mt">' + m.method.map(x => '<i>' + esc(x) + '</i>').join('') + '</span>' +
      (s.due ? '<span class="mini" style="display:block;margin-top:5px;color:var(--accent)">有 ' + s.due + ' 条到期，先回它们</span>' : '') +
      '</button>';
  }).join('');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const ds = addDays(today(), -i);
    const d = tState().d[ds];
    const q = d ? d.q : 0;
    const lv = q >= 40 ? 4 : q >= 25 ? 3 : q >= 12 ? 2 : q ? 1 : 0;
    const col = ['#edefeb', '#dbe7de', '#bcd5c3', '#8fbca2', '#5c9a7c'][lv];
    days.push('<i title="' + ds + ' · ' + q + ' 题" style="height:12px;border-radius:4px;background:' + col + ';display:block"></i>');
  }
  const box = document.getElementById('transHome');
  box.innerHTML =
    (first ? '<div class="card"><h2>第一次来翻译区，先选一门</h2>' +
      '<div class="note" style="line-height:2"><b>1 · 术语</b>　先认零件：看英文选中文，再反过来，最后做类别归位。<br>' +
      '<b>2 · 主题</b>　进场景：给一个题目方向，把这组词调出来。<br>' +
      '<b>3 · 高频</b>　真过手：看中文拼出来、听写、往真题句子里填。<br>' +
      '一轮 8–12 条，三分钟就能开个头。</div></div>' : '') +
    resume +
    '<div class="card">' +
      '<div class="flexline"><h2 style="margin:0">翻译专项 <span class="thin">' + (TR.total || TITEMS.length) + ' 条 · 三份讲义</span></h2>' +
      '<span class="spacer"></span><span class="pill">独立进度</span></div>' +
      '<div class="note" style="margin-top:8px">这三份材料不是一回事：术语是零件，主题是场景，高频词是上场要写出来的。所以练法分开，进度也分开，不跟阅读两册混在一起。</div>' +
      '<div class="grid3" style="margin-top:12px">' +
        '<div class="tstat"><div class="n">' + st.seen + '</div><div class="l">已练</div></div>' +
        '<div class="tstat"><div class="n" style="color:var(--accent)">' + st.master + '</div><div class="l">已掌握</div></div>' +
        '<div class="tstat"><div class="n" style="color:var(--err)">' + st.wrong + '</div><div class="l">错题</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px">' + days.join('') + '</div>' +
      '<div class="mini" style="margin-top:5px">近 7 天翻译练习量 · 今天 ' + ((tState().d[today()] || {}).q || 0) + ' 题</div>' +
    '</div>' +
    '<div class="card"><h2>选一门 <span class="thin">各自的进度互不影响</span></h2>' +
      '<div class="coursegrid">' + modRows + '</div>' +
      '<div class="mini" style="margin-top:8px">三份材料之间有重合（共 47 处），总进度只算一次；进了哪一门，就按那一门的条目单独算。</div></div>' +
    '<div class="card"><h2>三份材料分别练到什么程度</h2>' +
      TMODS.map(m => '<div style="padding:9px 0;border-bottom:1px dashed #ecefea">' +
        '<b>' + esc(m.name) + '</b>　<span class="mini">' + esc(m.tag) + '</span>' +
        '<div class="note" style="margin-top:3px">' + esc(m.tip) + '</div></div>').join('') +
    '</div>';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ---------- 模块页 ---------- */
function tEnter(id) {
  const st = tState();
  st.m = id; save();
  TUI = { scope: 'all', cat: '', len: 12, types: (TMOD_TYPES[id] || ['e2c']).slice() };
  tRenderMod();
}
function tRenderMod() {
  tView = 'mod';
  tShowOnly('transMod');
  tHead();
  const st = tState(), m = TMODBY[st.m];
  if (!m) { tRenderHome(); return; }
  if (!TUI) TUI = { scope: 'all', cat: '', len: 12, types: (TMOD_TYPES[st.m] || ['e2c']).slice() };
  const s = tStats(st.m);
  const typeChips = (TMOD_TYPES[st.m] || []).map(t =>
    '<button class="chip ' + (TUI.types.indexOf(t) >= 0 ? 'on' : '') + '" data-t="' + t + '">' + TTYPE_NAME[t] + '</button>').join('');
  const catOpts = '<option value="">全部分类</option>' +
    m.cats.map(c => '<option value="' + esc(c.name) + '"' + (TUI.cat === c.name ? ' selected' : '') + '>' + esc(c.name) + '（' + c.count + '）</option>').join('');
  const box = document.getElementById('transMod');
  box.innerHTML =
    '<div style="margin:10px 0 8px"><button class="btn sm" onclick="tRenderHome()">← 翻译首页</button></div>' +
    '<div class="card">' +
      '<div class="meta"><span class="pill">' + esc(m.full) + '</span><span class="mini">' + s.total + ' 条</span></div>' +
      '<h2 style="font-size:17px">' + esc(m.name) + '</h2>' +
      '<div class="note">' + esc(m.goal) + '</div>' +
      '<div class="bar" style="margin-top:10px"><i style="width:' + s.pct + '%"></i></div>' +
      '<div class="mini" style="margin-top:5px">已练 ' + s.seen + ' / ' + s.total + ' · 已掌握 ' + s.master + (s.retired ? ' · 退休 ' + s.retired : '') + (s.manual ? ' · 手动熟 ' + s.manual : '') + (s.fav ? ' · 收藏 ' + s.fav : '') + (s.due ? ' · 待复习 ' + s.due : '') + (s.wrong ? ' · 错题 ' + s.wrong : '') + '</div>' +
      '<div class="note" style="margin-top:10px;background:#f7f7f4;padding:9px 11px;border-radius:8px">' + esc(m.tip) + '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>练什么 <span class="thin">可以只留一两种</span></h2>' +
      '<div class="chips" id="tTypes">' + typeChips + '</div>' +
      '<label class="f">范围</label>' +
      '<div class="chips" id="tScope">' +
        '<button class="chip ' + (TUI.scope === 'all' ? 'on' : '') + '" data-s="all">全部</button>' +
        '<button class="chip ' + (TUI.scope === 'new' ? 'on' : '') + '" data-s="new">没练过</button>' +
        '<button class="chip ' + (TUI.scope === 'due' ? 'on' : '') + '" data-s="due">到期复习</button>' +
        '<button class="chip ' + (TUI.scope === 'wrong' ? 'on' : '') + '" data-s="wrong">错题</button>' +
        '<button class="chip ' + (TUI.scope === 'fav' ? 'on' : '') + '" data-s="fav">收藏</button>' +
      '</div>' +
      '<label class="f">分类</label>' +
      '<select id="tCat">' + catOpts + '</select>' +
      '<label class="f">这一轮多少条</label>' +
      '<div class="seg" id="tLen">' +
        [8, 12, 20].map(n => '<button data-len="' + n + '" class="' + (TUI.len === n ? 'on' : '') + '">' + n + ' 条</button>').join('') +
      '</div>' +
      '<button class="btn primary block" style="margin-top:16px" onclick="tStart()">开始这一轮</button>' +
      '<div class="mini" style="margin-top:8px">术语 / 主题每条约 15–25 秒；高频拼写会停下来等你写完，不自动跳。</div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>速查表 <span class="thin">按分类看全量</span></h2>' +
      '<input type="text" id="tSearch" placeholder="搜中文或英文…" oninput="tRenderList()">' +
      '<div id="tList" style="margin-top:8px"></div>' +
    '</div>';
  document.querySelectorAll('#tTypes .chip').forEach(b => b.onclick = () => {
    const t = b.dataset.t;
    if (TUI.types.indexOf(t) >= 0) {
      if (TUI.types.length === 1) { toast('至少留一种练法'); return; }
      TUI.types = TUI.types.filter(x => x !== t);
    } else TUI.types.push(t);
    b.classList.toggle('on');
  });
  document.querySelectorAll('#tScope .chip').forEach(b => b.onclick = () => {
    TUI.scope = b.dataset.s;
    document.querySelectorAll('#tScope .chip').forEach(x => x.classList.toggle('on', x === b));
  });
  document.getElementById('tCat').onchange = e => { TUI.cat = e.target.value; };
  document.querySelectorAll('#tLen button').forEach(b => b.onclick = () => {
    TUI.len = Number(b.dataset.len);
    document.querySelectorAll('#tLen button').forEach(x => x.classList.toggle('on', x === b));
  });
  tRenderList();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function tRenderList() {
  const st = tState();
  const el = document.getElementById('tList');
  if (!el) return;
  const q = ((document.getElementById('tSearch') || {}).value || '').trim().toLowerCase();
  let arr = tItemsOf(st.m);
  if (TUI && TUI.cat) arr = arr.filter(x => x.cats[st.m] === TUI.cat);
  if (q) arr = arr.filter(x => x.cn.toLowerCase().indexOf(q) >= 0 || x.en.toLowerCase().indexOf(q) >= 0);
  const total = arr.length;
  el.innerHTML = arr.slice(0, 60).map(x => {
    const r = tRec(x.id);
    return '<div class="list-item" onclick="tOpen(\'' + x.id + '\')">' +
      '<div style="min-width:0"><div class="lw">' + esc(x.en) + '</div>' +
      '<div class="lc">' + esc(x.cn) + ' · ' + esc(tCat(x)) + '</div></div>' +
      '<div class="rt"><div class="mini">' + (!r || !r.seen ? '未练' : r.mm ? '手动熟' : r.retired ? '已退休' : r.b >= 3 ? '已掌握' : '第' + r.b + '阶') + '</div>' +
      (r && r.x ? '<div class="mini" style="color:var(--err)">错 ' + r.x + '</div>' : '') + '</div></div>';
  }).join('') || '<div class="empty">没找到</div>';
  if (total > 60) el.innerHTML += '<div class="mini" style="margin-top:6px">只显示前 60 条，用搜索缩小范围。</div>';
}
function tOpen(id) {
  const x = TBY[id];
  if (!x) return;
  const mods = x.mods.map(m => (TMODBY[m] || {}).name || m).join(' / ');
  const r = tRec(id);
  document.getElementById('sheetBox').innerHTML =
    '<div class="flexline"><div class="tbig">' + esc(x.en) + '</div><span class="spacer"></span>' +
    '<button class="circlebtn' + (r && r.mm ? ' on' : '') + '" onclick="tMarkManual(' + "'" + id + "'" + ')" title="' + (r && r.mm ? '取消标熟' : '标熟：不再出现在日常练习') + '">熟</button>' +
    '<button class="circlebtn fav' + (r && r.fav ? ' on' : '') + '" onclick="tToggleFav(' + "'" + id + "'" + ')" title="' + (r && r.fav ? '取消收藏' : '收藏') + '">' + (r && r.fav ? '★' : '☆') + '</button>' +
    '<button class="btn sm" onclick="speak(\'' + esc(x.en.split(' / ')[0]).replace(/'/g, "\\'") + '\')">发音</button></div>' +
    '<div class="mean" style="margin-top:8px">' + esc(x.cn) + '</div>' +
    '<div class="mini" style="margin-top:6px">' + esc(tCat(x)) + ' · 出自 ' + esc(mods) + (x.star ? ' · ' + '★'.repeat(x.star) : '') + '</div>' +
    (x.mn ? '<div class="mnem">助记：' + esc(x.mn) + '</div>' : '') +
    (x.note ? '<div class="note" style="margin-top:10px">' + esc(x.note) + '</div>' : '') +
    (x.ex ? '<div class="ex"><div class="en">' + esc(x.ex.en) + '</div><div class="cn">' + esc(x.ex.cn) + '</div></div>' : '') +
    '<div class="mini" style="margin-top:10px">' + (tRec(id) ? '已练 ' + tRec(id).r + ' 次 · 错 ' + tRec(id).x + ' 次 · ' + (tRec(id).mm ? '手动熟' : tRec(id).retired ? '已退休' : '第 ' + tRec(id).b + ' 阶') : '还没练过') + '</div>' +
    '<div class="btnrow" style="margin-top:14px"><button class="btn primary" onclick="closeSheet()">关闭</button></div>';
  document.getElementById('sheet').classList.add('on');
}
function tMarkManual(id) {
  const r = tEnsure(id);
  if (r.mm) {
    r.mm = 0; r.last = Date.now();
    if (r.mnw) { r.seen = 0; r.mnw = 0; }
    toast('已取消标熟，回到原来的复习档位');
  } else {
    r.mnw = r.seen ? 0 : 1;
    r.seen = 1; r.mm = 1; r.last = Date.now();
    toast('标熟了：不再进日常练习，速查表「手动熟」里能找回');
  }
  save(); tOpen(id);
  if (document.getElementById('v-trans').classList.contains('on')) tHead();
}
function tToggleFav(id) {
  const r = tEnsure(id);
  r.fav = r.fav ? 0 : 1; r.last = Date.now();
  save(); tOpen(id);
  toast(r.fav ? '已收藏，可在「收藏」范围单独练' : '已取消收藏');
}
function tReviveManual(id) {
  const r = tEnsure(id);
  r.mm = 0; r.retired = 0; r.f = 1; r.due = today(); r.last = Date.now();
  save();
  const el = document.getElementById('tManualPrompt');
  if (el) el.innerHTML = '<div style="color:var(--accent)">已拉回：从今天起重新排复习。</div>';
  toast('已拉回复习');
}
function tKeepManual(id) {
  const el = document.getElementById('tManualPrompt');
  if (el) el.innerHTML = '<div style="color:var(--sub)">继续搁置，进度不变。</div>';
  toast('先搁置');
}

/* ---------- 出题 ---------- */
function tPool() {
  const st = tState();
  let arr = tItemsOf(st.m).filter(x => { const r = tRec(x.id); return !(r && (r.retired || r.mm)); });
  if (TUI.cat) arr = arr.filter(x => x.cats[st.m] === TUI.cat);
  if (TUI.scope === 'new') arr = arr.filter(x => !tSeen(x));
  else if (TUI.scope === 'fav') arr = arr.filter(x => { const r = tRec(x.id); return r && r.fav; });
  else if (TUI.scope === 'manual') arr = tItemsOf(st.m).filter(x => { const r = tRec(x.id); return r && r.mm; });
  else if (TUI.scope === 'wrong') arr = arr.filter(x => { const r = tRec(x.id); return r && r.x > 0; });
  else if (TUI.scope === 'due') arr = arr.filter(x => { const r = tRec(x.id); return r && r.seen && r.due <= today(); });
  return arr;
}
function tUniq(arr) {
  const out = [];
  arr.forEach(v => { if (v && out.map(x => String(x).toLowerCase()).indexOf(String(v).toLowerCase()) < 0) out.push(v); });
  return out;
}
function tDistract(x, n, field) {
  const st = tState();
  let same = tItemsOf(st.m).filter(y => y.id !== x.id && y.cats[st.m] === x.cats[st.m]);
  let out = [];
  const used = {};
  used[String(x[field]).toLowerCase()] = 1;
  shuffle(same).forEach(y => {
    const v = y[field];
    if (out.length < n && v && !used[String(v).toLowerCase()]) { used[String(v).toLowerCase()] = 1; out.push(v); }
  });
  if (out.length < n) {
    shuffle(tItemsOf(st.m)).forEach(y => {
      const v = y[field];
      if (out.length < n && y.id !== x.id && v && !used[String(v).toLowerCase()]) { used[String(v).toLowerCase()] = 1; out.push(v); }
    });
  }
  return out;
}
function tSim(a, b) {
  const A = a.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const B = b.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let s = A.filter(w => B.indexOf(w) >= 0).length;
  if (A[0] && A[0] === B[0]) s += 2;
  return s;
}
function tNear(x, n) {
  const st = tState();
  const same = tItemsOf(st.m).filter(y => y.id !== x.id && y.cats[st.m] === x.cats[st.m]);
  same.sort((a, b) => tSim(b.en, x.en) - tSim(a.en, x.en));
  return tUniq(same.slice(0, n + 2).map(y => y.en)).slice(0, n);
}
function tBlank(x) {
  if (!x.ex) return null;
  const probe = x.en.split(' / ')[0];
  const bf = blankForm(x.ex.en, probe, false);
  if (bf.html.indexOf('class="blank"') < 0) return null;
  return { html: bf.html, surface: bf.surface, cn: x.ex.cn };
}
function tChoices(arr, lang) {
  TQ.qd.opts = arr;
  return '<div style="margin-top:16px">' + arr.map((o, k) =>
    '<button class="topt" data-v="' + esc(o) + '" data-k="' + k + '"><span class="k">' + String.fromCharCode(65 + k) + '</span>' + esc(o) + '</button>').join('') + '</div>';
}
function tRenderQ(x, type) {
  const lang = 'en';
  let html = '', answer = x.en, mode = 'choice';
  TQ.qd = {};
  if (type === 'e2c') {
    const opts = tUniq([x.cn].concat(tDistract(x, 3, 'cn')));
    html = '<div class="tbig">' + esc(x.en) + '</div><div class="phon">' + esc(tCat(x)) + ' · 先认一眼，选出最贴近的释义</div>' + tChoices(opts, 'cn');
    answer = x.cn;
  } else if (type === 'c2e' || type === 'pattern') {
    const opts = tUniq([x.en].concat(tDistract(x, 3, 'en')));
    html = '<div class="tbig">' + esc(x.cn) + '</div><div class="phon">' + esc(tCat(x)) + ' · ' + (type === 'pattern' ? '这个句型该怎么说' : '选出对应的英文') + '</div>' + tChoices(opts, 'en');
  } else if (type === 'cat') {
    const m = TMODBY[tState().m];
    const opts = shuffle(m.cats.map(c => c.name));
    html = '<div class="qtext"><b>' + esc(x.cn) + '</b><br><span class="phon">' + esc(x.en) + '</span></div>' +
      '<div class="mini" style="margin-top:6px">它属于哪一类？</div>' + tChoices(opts, 'cn');
    answer = tCat(x);
  } else if (type === 'near') {
    const opts = tUniq([x.en].concat(tNear(x, 3)));
    html = '<div class="tbig">' + esc(x.cn) + '</div><div class="phon">' + esc(tCat(x)) + ' · 这几个长得很像，挑对的那一个</div>' + tChoices(opts, 'en');
  } else if (type === 'scene') {
    const cat = tCat(x);
    const opts = tUniq([x.en].concat(tDistract(x, 3, 'en')));
    html = '<div class="tscene"><span class="pill">场景</span> <b>' + esc(cat) + '</b> · ' + esc(TSCENE[cat] || '在翻译题里') + '</div>' +
      '<div class="qtext" style="margin-top:10px">要表达「<b>' + esc(x.cn) + '</b>」，用哪一句？</div>' + tChoices(opts, 'en');
  } else if (type === 'odd') {
    const st = tState();
    const cat = tCat(x);
    const same = tItemsOf(st.m).filter(y => y.id !== x.id && y.cats[st.m] === cat);
    const other = tItemsOf(st.m).filter(y => y.cats[st.m] !== cat);
    const cluster = shuffle(same).slice(0, 2);
    const odd = shuffle(other)[0] || { en: '—', cn: '', cats: {} };
    const opts = tUniq([x.en, cluster[0] ? cluster[0].en : '', cluster[1] ? cluster[1].en : '', odd.en]);
    TQ.qd.cluster = [x].concat(cluster);
    TQ.qd.odd = odd;
    html = '<div class="tscene"><span class="pill">场景</span> <b>' + esc(cat) + '</b> · 这组词里混进了一个别的场景</div>' +
      '<div class="qtext" style="margin-top:10px">哪个不属于「' + esc(cat) + '」？</div>' + tChoices(opts, 'en');
    answer = odd.en;
  } else if (type === 'spell') {
    const first = x.en.split(' / ')[0];
    const letters = first.replace(/[^A-Za-z]/g, '').length;
    const words = first.split(/\s+/).length;
    html = '<div class="tbig">' + esc(x.cn) + '</div>' +
      '<div class="phon">' + esc(tCat(x)) + ' · ' + first[0].toUpperCase() + '… · ' + letters + ' 个字母' + (words > 1 ? ' · ' + words + ' 个词' : '') + '</div>' +
      '<div style="margin-top:14px"><input type="text" id="tTyped" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="把它完整拼出来"></div>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn primary" onclick="tSubmitTyped()">提交</button></div>' +
      '<div class="mini" style="margin-top:6px">有多种说法时，写其中一种即可。</div>';
    mode = 'type';
  } else if (type === 'dictation') {
    const first = x.en.split(' / ')[0];
    html = '<div class="qtext">听发音，把短语写出来</div><div class="phon">' + esc(tCat(x)) + '</div>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn" onclick="tSpeak()">播放</button>' +
      '<button class="btn" onclick="document.getElementById(\'tHint\').style.display=\'block\'">看提示</button></div>' +
      '<div id="tHint" class="mini" style="display:none;margin-top:6px">' + esc(x.cn) + ' · 首字母 ' + first[0].toUpperCase() + '</div>' +
      '<div style="margin-top:12px"><input type="text" id="tTyped" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="写出你听到的英文"></div>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn primary" onclick="tSubmitTyped()">提交</button></div>';
    mode = 'type';
  } else if (type === 'cloze') {
    const b = tBlank(x);
    if (!b) return tRenderQ(x, 'c2e');
    const first = b.surface;
    html = '<div class="qtext">' + b.html + '</div><div class="phon" style="margin-top:8px">' + esc(b.cn) + '</div>' +
      '<div class="mini" style="margin-top:6px">把空补上（首字母 ' + first[0].toUpperCase() + '，' + first.replace(/[^A-Za-z]/g, '').length + ' 个字母）</div>' +
      '<div style="margin-top:10px"><input type="text" id="tTyped" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="填出原句里的表达"></div>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn primary" onclick="tSubmitTyped()">提交</button></div>';
    answer = b.surface;
    mode = 'type';
  }
  return { html: html, answer: answer, mode: mode, lang: lang, type: type };
}
function tPickType(x) {
  const st = tState();
  let cap = TQ.types.filter(t => {
    if (t === 'cloze') return !!tBlank(x);
    if (t === 'spell' || t === 'dictation') return x.en.replace(/[^A-Za-z]/g, '').length <= 42;
    if (t === 'odd') return !!x.cats[st.m];
    return true;
  });
  if (!cap.length) cap = ['e2c'];
  const fresh = !tSeen(x);
  if (fresh) {
    if (st.m === 'themes' && cap.indexOf('scene') >= 0) return 'scene';
    if (cap.indexOf('e2c') >= 0) return 'e2c';
    if (cap.indexOf('c2e') >= 0) return 'c2e';
  }
  let t = cap[Math.floor(Math.random() * cap.length)];
  if (TQ.lastType === t && cap.length > 1) t = cap[(cap.indexOf(t) + 1) % cap.length];
  TQ.lastType = t;
  return t;
}
function tStart() {
  const arr0 = tPool();
  if (!arr0.length) { toast('这个范围暂时没条目，换一个范围'); return; }
  let arr = shuffle(arr0);
  if (TUI.scope === 'all') arr.sort((a, b) => (tSeen(a) ? 1 : 0) - (tSeen(b) ? 1 : 0));
  const want = Math.min(TUI.len, arr.length);
  if (arr.length < TUI.len) toast('这个范围只剩 ' + arr.length + ' 条，先过这些');
  tStartIds(arr.slice(0, want).map(x => x.id));
}
function tStartIds(ids) {
  if (typeof closeSheet === 'function') closeSheet();
  if (!ids.length) { toast('没找到可练的条目'); return; }
  TQ = { ids: ids.slice(), i: 0, len: ids.length, right: 0, wrong: 0, per: {}, retry: {},
    types: TUI.types.slice(), cur: null, locked: false, t0: Date.now(), qn: 0, lastType: '', done: false, qd: {} };
  if (typeof brainGuard === 'function') brainGuard();
  tView = 'quiz';
  tShowOnly('transQuiz');
  tSaveResume();
  tNext();
}
function tNext() {
  if (!TQ) return;
  if (TQ.i >= TQ.ids.length) return tFinish();
  const x = TBY[TQ.ids[TQ.i]];
  if (!x) { TQ.i++; return tNext(); }
  const type = tPickType(x);
  const q = tRenderQ(x, type);
  TQ.cur = { x: x, type: type, answer: q.answer, mode: q.mode, lang: q.lang, locked: false };
  TQ.awaitNext = false;
  tHead();
  document.getElementById('transQuiz').innerHTML =
    '<div class="card">' +
      '<div class="meta"><span><span class="pill">' + TTYPE_NAME[type] + '</span> <span class="mini">' + esc(tCat(x)) + '</span></span>' +
      '<span class="mini">' + Math.min(TQ.i + 1, TQ.len) + ' / ' + TQ.len + '</span></div>' +
      '<div class="bar" style="margin-bottom:16px"><i style="width:' + Math.round(TQ.i / TQ.len * 100) + '%"></i></div>' +
      '<div id="tqBody">' + q.html + '</div>' +
      '<div id="tqFb" style="margin-top:12px"></div>' +
      '<div id="tqAct" class="btnrow" style="margin-top:14px"></div>' +
    '</div>';
  document.querySelectorAll('#tqBody .topt').forEach(b => b.onclick = () => tAnswerChoice(b));
  if (q.mode === 'type') {
    const el = document.getElementById('tTyped');
    if (el) { el.focus(); el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); tSubmitTyped(); } }; }
    if (type === 'dictation') setTimeout(tSpeak, 260);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function tSpeak() { if (TQ && TQ.cur) speak(TQ.cur.x.en.split(' / ')[0]); }
function tMatch(v) {
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim();
  const got = norm(v);
  const list = [TQ.cur.answer].concat((TQ.cur.x.alts || []).filter(a => String(a).replace(/[^A-Za-z0-9]/g, '').length >= 3));
  return list.some(a => norm(a) === got);
}
function tSubmitTyped() {
  if (!TQ || !TQ.cur || TQ.cur.locked) return;
  const el = document.getElementById('tTyped');
  const v = el ? el.value.trim() : '';
  if (!v) { toast('先写点什么'); return; }
  const ok = tMatch(v);
  let note = '';
  if (!ok) {
    const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
    let best = 99;
    [TQ.cur.answer].concat(TQ.cur.x.alts || []).forEach(a => { best = Math.min(best, editDistance(norm(v), norm(a))); });
    note = best <= 2 ? '就差 ' + best + ' 个字母，手比脑子快了半拍。' : '';
  }
  tResolve(ok, v, null, note);
}
function tAnswerChoice(btn) {
  if (!TQ || !TQ.cur || TQ.cur.locked) return;
  tResolve(btn.dataset.v === TQ.cur.answer, btn.dataset.v, btn);
}
function tPraise(ok) {
  const A = ok
    ? ['对。这个说法现在归你了。', '稳，下一题再见到它也得认得。', '对了，顺手念一遍，别只停在眼睛里。']
    : ['这个先记下，等会儿还会再问你。', '没中。看清正确写法，比蒙对强。', '错一次不要紧，下一轮它还会出现。'];
  return A[Math.floor(Math.random() * A.length)];
}
function tExHtml(x) {
  if (!x.ex) return '';
  const probe = x.en.split(' / ')[0];
  return '<div class="ex"><div class="en">' + blankForm(x.ex.en, probe, true).html + '</div><div class="cn">' + esc(x.ex.cn) + '</div></div>';
}
function tOptGloss(v) {
  const s = String(v);
  if (/[\u4e00-\u9fa5]/.test(s)) {
    const hits = TITEMS.filter(y => y.cn === s).map(y => y.en);
    return hits.length ? '对应 ' + [...new Set(hits)].slice(0, 3).join(' / ') : '';
  }
  const low = s.toLowerCase();
  const hits = TITEMS.filter(y => y.en.toLowerCase() === low).map(y => y.cn);
  return [...new Set(hits)].slice(0, 3).join('；');
}
function tAllOptGlossHtml() {
  const opts = [...document.querySelectorAll('#tqBody .topt')];
  if (!opts.length || !TQ || !TQ.cur) return '';
  const letters = ['A', 'B', 'C', 'D'];
  return '<div class="note" style="margin-top:10px;background:#fafbfa;padding:9px 11px;border-radius:9px">' +
    '<div class="mini" style="margin-bottom:3px">每个选项的意思</div>' +
    opts.map((b, i) => {
      const v = b.dataset.v;
      const ok = String(v) === String(TQ.cur.answer);
      const g = tOptGloss(v);
      return '<div style="padding:2px 0' + (ok ? ';color:var(--ok)' : '') + '">' +
        (letters[i] || String.fromCharCode(65 + i)) + '. ' + esc(v) + (ok ? ' ✓' : '') + (g ? ' <span class="mini">' + esc(g) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
}
function tPickedGloss(val) {
  const y = TITEMS.find(z => z.en === val || z.cn === val);
  if (!y) return '';
  return '<div class="note" style="margin-top:6px">你选的是「' + esc(y.en) + '」（' + esc(y.cn) + '），属于 ' + esc((y.cats && y.cats[tState().m]) || '—') + '。</div>';
}
function tResolve(ok, picked, btn, note) {
  const x = TQ.cur.x, td = today();
  TQ.cur.locked = true;
  TQ.awaitNext = true;
  TQ.answeredAt = Date.now();
  const r = tEnsure(x.id);
  const wasSeen = !!r.seen;
  const d = tDayRec(td);
  d.q++; if (ok) d.c++;
  r.last = Date.now();
  if (!wasSeen) { r.seen = 1; d.n++; }
  const pw = TQ.per[x.id] || (TQ.per[x.id] = { ok: 0, bad: 0 });
  let retiredNow = false;
  if (ok) {
    r.r++; r.rc = (r.rc || 0) + 1; r.b = Math.min(4, (r.b || 0) + 1);
    if (r.x > 0 && r.rc >= 2) r.x = 0;
    if (r.b >= 4 && r.rc >= 2) {
      r.retired = 1; r.due = addDays(td, 365); retiredNow = true;
    } else {
      r.due = addDays(td, [0, 1, 2, 4, 8][r.b]);
    }
    pw.ok++; TQ.right++;
  } else {
    r.x++; r.b = Math.max(0, (r.b || 0) - 1); r.due = td; r.rc = 0; r.retired = 0;
    pw.bad++; TQ.wrong++;
    const at = Math.min(TQ.ids.length, TQ.i + 3);
    if (!TQ.retry[x.id]) { TQ.ids.splice(at, 0, x.id); TQ.retry[x.id] = 1; }
  }
  save();
  tSaveResume(true);
  document.querySelectorAll('#tqBody .topt').forEach(b => {
    const right = String(b.dataset.v) === String(TQ.cur.answer);
    if (right) b.classList.add('correct');
    else if (btn && b === btn) b.classList.add('wrong');
    b.disabled = true;
  });
  document.querySelectorAll('#tqBody button.primary').forEach(b => b.disabled = true);
  const cat = tCat(x);
  const otherMods = x.mods.filter(m => m !== tState().m).map(m => (TMODBY[m] || {}).name || m);
  let fb = '<div class="fb ' + (ok ? 'ok' : 'no') + '">' + tPraise(ok);
  if (!ok) fb += '<div style="margin-top:4px">正确：<b>' + esc(TQ.cur.answer) + '</b>' + (note ? '　' + esc(note) : '') + '</div>';
  else if (note) fb += '<div style="margin-top:4px">' + esc(note) + '</div>';
  if (!ok && btn) fb += tPickedGloss(btn.dataset.v);
  fb += '</div>' + tAllOptGlossHtml();
  if (retiredNow) fb += '<div class="mini" style="margin-top:6px;color:var(--ok)">这一条已经连着答稳，退休了——不再进日常练习，速查表里还能查。</div>';
  if (!ok && r.mm) fb += '<div class="note" id="tManualPrompt" style="margin-top:8px;background:var(--warn-soft);border:1px solid #e2d0ab;padding:9px 11px;border-radius:9px">' +
    '这一条你手动标过熟，先不自动拉回。要放回日常复习吗？' +
    '<div class="btnrow" style="margin-top:8px"><button class="btn sm" onclick="tReviveManual(' + "'" + x.id + "'" + ')">拉回复习</button>' +
    '<button class="btn sm" onclick="tKeepManual(' + "'" + x.id + "'" + ')">先放着</button></div></div>';
  if (TQ.cur.type === 'odd' && TQ.qd.odd) {
    fb += '<div class="note" style="margin-top:8px">这一组属于「' + esc(cat) + '」：' + TQ.qd.cluster.map(y => esc(y.en)).join('、') +
      '。混进来的是「' + esc(TQ.qd.odd.en) + '」（' + esc(TQ.qd.odd.cn) + '），它属于 ' +
      esc((TQ.qd.odd.cats && TQ.qd.odd.cats[tState().m]) || '别的场景') + '。</div>';
  } else {
    fb += '<div style="margin-top:10px"><div class="tbig" style="font-size:22px">' + esc(x.en) + '</div>' +
      '<div class="mean" style="margin-top:4px">' + esc(x.cn) + '</div>' +
      '<div class="mini" style="margin-top:4px">' + esc(cat) + (x.star ? ' · ' + '★'.repeat(x.star) : '') +
      (otherMods.length ? ' · 也出现在 ' + esc(otherMods.join(' / ')) : '') + '</div></div>' +
      (x.mn ? '<div class="mnem">助记：' + esc(x.mn) + '</div>' : '') +
      (x.note ? '<div class="note" style="margin-top:8px">' + esc(x.note) + '</div>' : '') + tExHtml(x);
  }
  if (!ok && (TQ.cur.type === 'spell' || TQ.cur.type === 'dictation' || TQ.cur.type === 'cloze')) {
    fb += '<div class="repair" id="tRepair"><input id="tRepairIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="照着正确拼写再写一遍">' +
      '<button class="btn primary" onclick="tCheckRepair()">检查</button></div>';
  }
  document.getElementById('tqFb').innerHTML = fb;
  document.getElementById('tqAct').innerHTML =
    '<button class="btn" onclick="tSpeak()">发音</button>' +
    (ok ? '' : '<button class="btn" onclick="tFuzzy(' + "'" + x.id + "'" + ')">眼熟想不起</button>') +
    '<button class="btn primary" onclick="tNextAfter()">继续</button>' +
    (TQ.cur.mode === 'type' ? '<div class="mini" style="width:100%;margin-top:4px">看清正确拼写，再点继续。</div>' : '');
  const el = document.getElementById('tTyped');
  if (el) { el.disabled = true; el.blur(); }
  const ri = document.getElementById('tRepairIn');
  if (ri) { ri.focus(); ri.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); tCheckRepair(); } }; }
}
function tFuzzy(id) {
  const r = tEnsure(id);
  r.f = 1; r.due = today(); r.b = Math.max(0, (r.b || 0) - 1); r.last = Date.now(); save();
  toast('加进翻译加强队列，会再问你');
}
function tCheckRepair() {
  if (!TQ || !TQ.cur) return;
  const el = document.getElementById('tRepairIn');
  if (!el) return;
  const ok = tMatch(el.value.trim());
  if (ok) {
    el.disabled = true;
    el.parentNode.innerHTML = '<span class="mini" style="color:var(--ok)">写对了：' + esc(TQ.cur.answer) + '。这一笔比看三遍强。</span>';
    toast('记住了');
  } else {
    el.style.borderColor = '#dda795';
    toast('再看一眼正确拼写');
  }
}
function tNextAfter() {
  if (!TQ || !TQ.awaitNext) return;
  TQ.awaitNext = false;
  TQ.i++;
  tSaveResume();
  tNext();
}
function tFinish() {
  TQ.done = true;
  tClearResume();
  tView = 'sum';
  tHead();
  const ids = Object.keys(TQ.per);
  const total = TQ.right + TQ.wrong;
  const acc = total ? Math.round(TQ.right / total * 100) : 0;
  const shaky = ids.filter(id => TQ.per[id].bad > 0)
    .sort((a, b) => TQ.per[b].bad - TQ.per[a].bad)
    .slice(0, 6).map(id => TBY[id]).filter(Boolean);
  const solid = ids.filter(id => TQ.per[id].bad === 0 && TQ.per[id].ok > 0).length;
  const sec = Math.round((Date.now() - TQ.t0) / 1000);
  const box = document.getElementById('transSum');
  box.innerHTML =
    '<div class="card"><h2>这一轮收工 <span class="thin">' + esc((TMODBY[tState().m] || {}).name || '') + '</span></h2>' +
    '<div class="grid3">' +
      '<div class="tstat"><div class="n">' + ids.length + '</div><div class="l">过手条目</div></div>' +
      '<div class="tstat"><div class="n" style="color:var(--accent)">' + acc + '%</div><div class="l">答对率</div></div>' +
      '<div class="tstat"><div class="n">' + solid + '</div><div class="l">一次没错</div></div>' +
    '</div>' +
    '<div class="note" style="margin-top:12px">' +
      (shaky.length ? '还虚的：<b style="color:var(--err)">' + shaky.map(x => esc(x.en)).join('、') + '</b>——现在就再问一遍，别等明天。' : '这轮没有反复错的条目，节奏可以。') +
    '</div>' +
    (shaky.length ? '<button class="btn block" style="margin-top:10px" onclick="tRetry([' + shaky.map(x => "'" + x.id + "'").join(',') + '])">把这几个再问一遍</button>' : '') +
    '<div class="hr"></div>' +
    '<div class="btnrow">' +
      '<button class="btn primary" onclick="tAgain()">再来一轮</button>' +
      '<button class="btn" onclick="tRenderMod()">换范围</button>' +
      '<button class="btn" onclick="tRenderHome()">回翻译首页</button>' +
    '</div>' +
    '<div class="note" style="margin-top:10px">用时 ' + Math.floor(sec / 60) + ' 分 ' + (sec % 60) + ' 秒。' +
      (sec > 25 * 60 ? ' 这一轮偏长，下一轮拆成两段。' : '') + '</div></div>';
  tShowOnly('transSum');
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function tAgain() { tStart(); }
function tRetry(ids) { tStartIds(ids); }
