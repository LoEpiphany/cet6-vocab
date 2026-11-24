/* ================= 20 分钟脑力小游戏 ================= */
const BRAIN_COLORS = [
  { k: 'red', n: '红', c: '#c94f45' },
  { k: 'blue', n: '蓝', c: '#3c74b8' },
  { k: 'green', n: '绿', c: '#4a8a62' },
  { k: 'yellow', n: '黄', c: '#c08a1e' }
];
const BRAIN_TYPES = ['stroop', 'seq', 'digit', 'spot', 'chain'];
const CHAIN_WORDS = ('apple egg green night table elephant tiger river rose eagle yellow water red dog grape orange king queen pen nest tree sun moon star car rain nose fish hat clock key yard door kite eye ear ant tea ocean lemon mango ice cream').split(' ');
let brainAt = Date.now(), brainPending = false, brainTimer = null, brainQ = null, brainLastType = '', brainTimers = [];

function brainInit() {
  brainAt = Date.now();
  if (brainTimer) clearInterval(brainTimer);
  brainTimer = setInterval(brainCheck, 20000);
}
function brainBusy() {
  const on = id => { const el = document.getElementById(id); return !!(el && el.classList.contains('on')); };
  if (on('sheet')) return true;
  const quiz = document.getElementById('quiz');
  if (document.getElementById('v-test').classList.contains('on') && quiz && quiz.style.display !== 'none' &&
      typeof Q !== 'undefined' && Q && !Q.done) return true;
  const tq = document.getElementById('transQuiz');
  if (document.getElementById('v-trans').classList.contains('on') && tq && tq.style.display !== 'none' &&
      typeof TQ !== 'undefined' && TQ && !TQ.done) return true;
  return false;
}
function brainCheck() {
  const modal = document.getElementById('brainModal');
  if (!modal || modal.classList.contains('on')) return;
  if (!brainPending && Date.now() - brainAt < 20 * 60 * 1000) return;
  if (brainBusy()) { brainPending = true; return; }
  openBrain(false);
}
function openBrain(manual) {
  const modal = document.getElementById('brainModal');
  if (!modal || modal.classList.contains('on')) return;
  if (!manual && brainBusy()) { brainPending = true; return; }
  brainQ = { i: 0, right: 0, n: 6, locked: false, type: '' };
  modal.classList.add('on');
  brainRound();
}
function brainClearTimers() { brainTimers.forEach(t => clearTimeout(t)); brainTimers = []; }
function brainLater(fn, ms) { const t = setTimeout(fn, ms); brainTimers.push(t); return t; }
function brainNextType() {
  let t = BRAIN_TYPES[Math.floor(Math.random() * BRAIN_TYPES.length)];
  if (t === brainLastType) t = BRAIN_TYPES[(BRAIN_TYPES.indexOf(t) + 1) % BRAIN_TYPES.length];
  brainLastType = t;
  return t;
}
function brainShell(inner, tip) {
  return '<div class="mini" style="text-align:right;margin-top:6px">' + (brainQ.i + 1) + ' / ' + brainQ.n + ' · ' + brainTypeName(brainQ.type) + '</div>' +
    inner + (tip ? '<div class="mini" style="text-align:center;margin-top:2px">' + tip + '</div>' : '');
}
function brainTypeName(t) {
  return { stroop: '字色', seq: '记忆序列', digit: '数字广度', spot: '找不同', chain: '词语接龙' }[t] || '脑力';
}
function brainRound() {
  const body = document.getElementById('brainBody');
  if (!body || !brainQ) return;
  brainClearTimers();
  brainQ.locked = false;
  brainQ.type = brainNextType();
  if (brainQ.type === 'stroop') brainStroop();
  else if (brainQ.type === 'seq') brainSeq();
  else if (brainQ.type === 'digit') brainDigit();
  else if (brainQ.type === 'spot') brainSpot();
  else brainChain();
}
function brainDone(ok) {
  if (!brainQ) return;
  if (ok) brainQ.right++;
  brainQ.i++;
  brainQ.locked = true;
  brainLater(() => {
    if (!brainQ) return;
    if (brainQ.i >= brainQ.n) brainResult();
    else brainRound();
  }, 480);
}
function brainStroop() {
  const body = document.getElementById('brainBody');
  const w = BRAIN_COLORS[Math.floor(Math.random() * 4)];
  let ink = BRAIN_COLORS[Math.floor(Math.random() * 4)];
  while (ink.k === w.k) ink = BRAIN_COLORS[Math.floor(Math.random() * 4)];
  brainQ.answer = ink.k;
  body.innerHTML = brainShell(
    '<div class="brain-word" style="color:' + ink.c + '">' + w.n + '</div>' +
    '<div class="brain-opts">' + BRAIN_COLORS.map(c =>
      '<button class="brain-opt" data-k="' + c.k + '"><i style="background:' + c.c + '"></i>' + c.n + '</button>').join('') + '</div>',
    '这个字是什么颜色？');
  body.querySelectorAll('.brain-opt').forEach(b => b.onclick = () => brainPick(b.dataset.k, b));
}
function brainPick(k, btn) {
  if (!brainQ || brainQ.locked) return;
  const ok = k === brainQ.answer;
  document.querySelectorAll('#brainBody .brain-opt').forEach(b => {
    if (b.dataset.k === brainQ.answer) b.classList.add('ok');
    else if (b === btn) b.classList.add('no');
  });
  brainDone(ok);
}
function brainSeq() {
  const body = document.getElementById('brainBody');
  const len = 4;
  const seq = [];
  for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * 4));
  brainQ.seq = seq; brainQ.input = [];
  body.innerHTML = brainShell(
    '<div class="brain-seq" id="brainSeq">' + seq.map((_, i) =>
      '<button class="brain-cell" data-i="' + i + '"><i></i></button>').join('') + '</div>',
    '看清闪的顺序，再按同样的顺序点一遍');
  const cells = [...body.querySelectorAll('.brain-cell')];
  cells.forEach((c, i) => { c.style.background = '#eef1ed'; });
  cells.forEach(c => c.onclick = () => brainSeqClick(c));
  // 依次闪
  let step = 0;
  const flash = () => {
    if (!brainQ || brainQ.type !== 'seq') return;
    if (step >= seq.length) { brainQ.locked = false; return; }
    const c = cells[seq[step]];
    c.classList.add('lit');
    c.style.background = BRAIN_COLORS[seq[step]].c;
    brainLater(() => {
      c.classList.remove('lit');
      c.style.background = '#eef1ed';
      step++;
      brainLater(flash, 180);
    }, 380);
  };
  brainQ.locked = true;
  brainLater(flash, 350);
}
function brainSeqClick(c) {
  if (!brainQ || brainQ.type !== 'seq' || brainQ.locked) return;
  const i = Number(c.dataset.i);
  const want = brainQ.seq[brainQ.input.length];
  if (i !== want) {
    c.style.background = '#e7b4a8';
    brainQ.locked = true;
    brainDone(false);
    return;
  }
  c.style.background = BRAIN_COLORS[i].c;
  c.classList.add('ok');
  brainQ.input.push(i);
  if (brainQ.input.length === brainQ.seq.length) {
    brainQ.locked = true;
    brainDone(true);
  }
}
function brainDigit() {
  const body = document.getElementById('brainBody');
  const len = 5 + Math.floor(Math.random() * 2);
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  brainQ.digit = s;
  brainQ.locked = true;
  body.innerHTML = brainShell(
    '<div class="brain-digits" id="brainDigits">' + s + '</div>' +
    '<div class="mini" style="text-align:center">记住这串数字</div>',
    '');
  brainLater(() => {
    if (!brainQ || brainQ.type !== 'digit') return;
    body.innerHTML = brainShell(
      '<div class="brain-digits">' + '· '.repeat(len).trim() + '</div>' +
      '<input class="brain-input" id="brainDigitIn" inputmode="numeric" autocomplete="off" placeholder="按顺序输入">' +
      '<div class="brain-opts" style="margin-top:12px"><button class="brain-opt" onclick="brainDigitSubmit()">提交</button></div>',
      '刚才那串数字是？');
    const inp = document.getElementById('brainDigitIn');
    brainQ.locked = false;
    if (inp) { inp.focus(); inp.onkeydown = e => { if (e.key === 'Enter') brainDigitSubmit(); }; }
  }, 1700);
}
function brainDigitSubmit() {
  if (!brainQ || brainQ.type !== 'digit' || brainQ.locked) return;
  const inp = document.getElementById('brainDigitIn');
  const val = inp ? inp.value.replace(/\D/g, '') : '';
  brainQ.locked = true;
  const ok = val === brainQ.digit;
  const body = document.getElementById('brainBody');
  body.innerHTML = brainShell(
    '<div class="brain-digits" style="font-size:28px">' + brainQ.digit + '</div>' +
    '<div class="mini" style="text-align:center;color:' + (ok ? 'var(--ok)' : 'var(--err)') + '">' +
    (ok ? '对，就是这串' : '你写的是 ' + (val || '空') + '，差了一点') + '</div>',
    '');
  brainDone(ok);
}
function brainSpot() {
  const body = document.getElementById('brainBody');
  const n = 12, odd = Math.floor(Math.random() * n);
  brainQ.odd = odd;
  const chars = ['◆', '●', '▲', '■'];
  const ch = chars[Math.floor(Math.random() * chars.length)];
  body.innerHTML = brainShell(
    '<div class="brain-grid" id="brainGrid">' + Array.from({ length: n }, (_, i) =>
      '<button data-i="' + i + '" style="' + (i === odd ? 'transform:rotate(18deg);color:#8a6a2f' : '') + '">' + ch + '</button>').join('') + '</div>',
    '哪一个和其他的不一样？');
  body.querySelectorAll('#brainGrid button').forEach(b => b.onclick = () => {
    if (!brainQ || brainQ.type !== 'spot' || brainQ.locked) return;
    const ok = Number(b.dataset.i) === odd;
    b.style.outline = '2px solid ' + (ok ? 'var(--ok)' : 'var(--err)');
    if (!ok) body.querySelector('#brainGrid button[data-i="' + odd + '"]').style.outline = '2px solid var(--ok)';
    brainDone(ok);
  });
}
function brainChain() {
  const body = document.getElementById('brainBody');
  const start = CHAIN_WORDS[Math.floor(Math.random() * CHAIN_WORDS.length)];
  const last = start.slice(-1).toLowerCase();
  const corrects = CHAIN_WORDS.filter(w => w[0].toLowerCase() === last);
  if (!corrects.length) { brainStroop(); return; }
  const correct = corrects[Math.floor(Math.random() * corrects.length)];
  const others = CHAIN_WORDS.filter(w => w[0].toLowerCase() !== last && w !== correct);
  const opts = [correct];
  while (opts.length < 4 && others.length) {
    const i = Math.floor(Math.random() * others.length);
    opts.push(others.splice(i, 1)[0]);
  }
  opts.sort(() => Math.random() - 0.5);
  brainQ.answer = correct;
  brainQ.odd = -1;
  body.innerHTML = brainShell(
    '<div class="brain-word" style="font-size:30px;letter-spacing:1px">' + start + ' → ?</div>' +
    '<div class="brain-opts">' + opts.map(w => '<button class="brain-opt" data-k="' + w + '">' + w + '</button>').join('') + '</div>',
    '下一个词，首字母要接住上一个词的尾字母「' + last + '」');
  body.querySelectorAll('.brain-opt').forEach(b => b.onclick = () => {
    if (!brainQ || brainQ.type !== 'chain' || brainQ.locked) return;
    const ok = b.dataset.k === brainQ.answer;
    document.querySelectorAll('#brainBody .brain-opt').forEach(x => {
      if (x.dataset.k === brainQ.answer) x.classList.add('ok');
      else if (x === b) x.classList.add('no');
    });
    brainDone(ok);
  });
}
function brainResult() {
  const body = document.getElementById('brainBody');
  if (!body) return;
  const r = brainQ.right;
  body.innerHTML =
    '<div style="text-align:center;padding:18px 0 6px"><div class="big" style="font-size:40px">' + r + ' / ' + brainQ.n + '</div>' +
    '<div class="note" style="margin-top:6px">' + (r >= 5 ? '脑子还在线，回去继续。' : r >= 3 ? '有点绕，正常；换回单词正好。' : '被绕进去了，正好醒一醒。') + '</div></div>' +
    '<div class="btnrow" style="margin-top:8px"><button class="btn primary" onclick="brainAgain()">再来一发</button>' +
    '<button class="btn" onclick="closeBrain()">回去继续</button></div>';
}
function brainAgain() {
  brainQ = { i: 0, right: 0, n: 6, locked: false, type: '' };
  brainRound();
}
function closeBrain() {
  const modal = document.getElementById('brainModal');
  if (modal) modal.classList.remove('on');
  brainClearTimers();
  brainQ = null;
  brainPending = false;
  brainAt = Date.now();
  toast('计时重置，20 分钟后再来');
}
function brainGuard() {
  const modal = document.getElementById('brainModal');
  if (modal && modal.classList.contains('on')) modal.classList.remove('on');
  brainClearTimers();
  brainQ = null;
  brainPending = false;
  brainAt = Date.now();
}
brainInit();
