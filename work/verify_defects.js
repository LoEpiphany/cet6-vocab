const { chromium } = require('playwright-core');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'http://localhost:8766/index.html';

(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [], dialogs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(350);

  console.log('=== 1. 故事高亮：短词不误伤 ===');
  console.log(await p.evaluate(() => {
    const html = hiStory('Art and care are here. A car is far. Cars artful.', ['art', 'car']);
    const d = document.createElement('div'); d.innerHTML = html;
    return { html: html, hits: [...d.querySelectorAll('b.hl')].map(b => b.textContent + '→' + b.dataset.w) };
  }));
  console.log('--- 全部故事覆盖 ---');
  console.log(await p.evaluate(() => STORIES.map(u => {
    const d = document.createElement('div'); d.innerHTML = hiStory(u.story, u.words);
    const hls = [...d.querySelectorAll('b.hl')];
    const dw = new Set(hls.map(b => b.dataset.w));
    const miss = u.words.filter(w => !dw.has(w));
    return { id: u.id, words: u.words.length, hl: hls.length, miss: miss.length, missWords: miss.slice(0, 6), bad: hls.filter(b => !u.words.includes(b.dataset.w)).length };
  })));

  console.log('=== 2. 手动熟/撤销不改原档位（阅读） ===');
  console.log(await p.evaluate(() => {
    const w = WORDS[0];
    const r = ensure(w.id);
    r.seen = 1; r.b = 4; r.due = '2030-01-01'; r.retired = 0; r.mm = 0; r.last = 0;
    save();
    markManual(w.id, true);
    const a = { mm: r.mm, b: r.b, due: r.due };
    markManual(w.id, true);
    const c = { mm: r.mm, b: r.b, due: r.due };
    const w2 = WORDS[7];
    const r2 = ensure(w2.id);
    r2.seen = 0; r2.fs = 0; r2.mm = 0; r2.last = 0;
    const n0 = S.d[today()] ? S.d[today()].n : 0;
    markManual(w2.id, true);
    const seenWhenMarked = { seen: r2.seen, fs: r2.fs, n: S.d[today()].n };
    markManual(w2.id, true);
    const afterUndo = { seen: r2.seen, fs: r2.fs, n: S.d[today()].n, n0 };
    return { marked: a, unmarked: c, seenWhenMarked, afterUndo };
  }));

  console.log('=== 2b. 卡片标记后撤销：刷新仍回原档 ===');
  const uw = await p.evaluate(() => {
    const w = WORDS[400];
    const r = ensure(w.id);
    r.seen = 1; r.b = 2; r.due = '2027-01-01'; r.retired = 0; r.mm = 0; r.last = 0;
    save();
    cardList = [w.id]; cardIdx = 0; cardShown = true; cardScope = 'all';
    markCur('known');
    const marked = { b: r.b, due: r.due };
    undoCardMark();
    return { id: w.id, marked, undone: { b: r.b, due: r.due }, persisted: readDisk().w[w.id].b };
  });
  console.log(uw);

  console.log('=== 2c. 继续键双击只前进一题 ===');
  console.log(await p.evaluate(() => {
    enabledTypes.length = 0; enabledTypes.push('e2c');
    startSession('today', 1, 8);
    Q.awaitNext = true;
    const i0 = Q.i;
    nextAfter(); nextAfter();
    return { i0, i1: Q.i, advanced: Q.i - i0, awaitNext: Q.awaitNext };
  }));

  console.log('=== 2d. 翻译多个说法不误判短碎片 ===');
  console.log(await p.evaluate(() => {
    const x = TBY['x789'];
    TQ = { cur: { x: x, answer: x.en, lang: 'en' } };
    const out = { at: tMatch('at'), on: tMatch('on'), full: tMatch('be situated at') };
    TQ = null;
    return out;
  }));
  console.log('=== 2e. 重复释义的选项注释 ===');
  console.log(await p.evaluate(() => ({ heritage: tOptGloss('cultural heritage'), cn: tOptGloss('文化遗产') })));
  console.log('=== 2f. 七选项类别题的字母不越界 ===');
  console.log(await p.evaluate(() => {
    TQ = { qd: {}, cur: null };
    const h = tRenderQ(TITEMS[0], 'cat').html;
    TQ = null;
    const ks = [...h.matchAll(/class="k">([^<]+)</g)].map(m => m[1]);
    return { n: ks.length, letters: ks.join(''), bad: /undefined/.test(h) };
  }));

  console.log('=== 3. 今日新词按首次学习日统计 ===');
  console.log(await p.evaluate(() => {
    const t = today(), y = addDays(t, -1);
    const w2 = WORDS[1];
    const r = ensure(w2.id); r.seen = 1; r.fs = y; r.mm = 0; r.mm = 0; r.last = 0;
    const before = newTodayCount();
    const r3 = ensure(WORDS[2].id); r3.seen = 1; r3.fs = t; r3.last = 0;
    const after = newTodayCount();
    return { today: t, before, after, hasFs: r.fs };
  }));

  console.log('=== 4. 答题中途切课程：中断且已答词保留 ===');
  await p.evaluate(() => { enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('today', 1, 8); });
  await p.waitForTimeout(250);
  await p.click('#qBody .opt');
  await p.waitForTimeout(250);
  const beforeSwitch = await p.evaluate(() => ({ answered: Object.keys(S.w).filter(k => S.w[k].seen).length, q: !!Q }));
  await p.evaluate(() => setCourse('c2'));
  await p.waitForTimeout(300);
  console.log({ beforeSwitch, after: await p.evaluate(() => ({
    qNull: Q === null,
    setupShown: document.getElementById('testSetup').style.display,
    quizShown: document.getElementById('quiz').style.display,
    resume: localStorage.getItem('cet6vocab_2026_quiz_v1'),
    course: S.course,
    seen: Object.keys(S.w).filter(k => S.w[k].seen).length
  })) });

  console.log('=== 5. 导入：坏 JSON / 非本工具 / 高版本 ===');
  fs.writeFileSync('tmp_bad.json', '{not json');
  fs.writeFileSync('tmp_other.json', JSON.stringify({ hello: 1 }));
  fs.writeFileSync('tmp_v2.json', JSON.stringify({ app: 'cet6vocab', version: 2, state: { w: {}, d: {} } }));
  for (const f of ['tmp_bad.json', 'tmp_other.json', 'tmp_v2.json']) {
    dialogs.length = 0;
    await p.setInputFiles('#importFile', f);
    await p.waitForTimeout(350);
    console.log(f, '→', dialogs.join(' | '));
  }

  console.log('=== 6. localStorage 写满兜底 ===');
  console.log(await p.evaluate(() => {
    const raw = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new Error('quota'); };
    const ok = save();
    Storage.prototype.setItem = raw;
    return { ok, toast: document.getElementById('toast').textContent, saveWarned };
  }));

  console.log('=== 7. 翻译：标熟/撤销不改档位 ===');
  console.log(await p.evaluate(() => {
    const x = TITEMS[0];
    const r = tEnsure(x.id);
    r.seen = 1; r.b = 3; r.due = '2030-02-02'; r.retired = 0; r.mm = 0; r.last = 0;
    tMarkManual(x.id);
    const a = { mm: r.mm, b: r.b, due: r.due };
    tMarkManual(x.id);
    const c = { mm: r.mm, b: r.b, due: r.due };
    return { marked: a, unmarked: c };
  }));

  console.log('=== 8. 双标签页同步 ===');
  const p2 = await ctx.newPage();
  const errs2 = [];
  p2.on('pageerror', e => errs2.push(String(e)));
  await p2.goto(URL);
  await p2.waitForTimeout(300);
  const wId = await p.evaluate(() => WORDS[3].id);
  await p.evaluate(id => { const r = ensure(id); r.seen = 1; r.b = 2; r.due = today(); r.last = Date.now(); save(); renderHome(); }, wId);
  await p2.waitForTimeout(600);
  console.log(await p2.evaluate(id => ({ synced: !!(S.w[id] && S.w[id].seen), toast: document.getElementById('toast').textContent }), wId));
  console.log('tab2 errors:', errs2);

  console.log('=== 9. 全部词标熟后的空队列 ===');
  console.log(await p.evaluate(() => {
    setCourse('c1');
    courseWords().forEach(w => { const r = ensure(w.id); r.seen = 1; r.mm = 1; r.last = Date.now(); });
    save(true);
    renderHome();
    const st = stats();
    startSession('today', 1, 12);
    renderHome();
    const dueBreak = document.getElementById('dueBreak').textContent;
    return { total: st.pool.length, seen: st.seen.length, due: st.due.length, queue: buildQueue('today', 1).length,
      qNull: Q === null, toast: document.getElementById('toast').textContent,
      t1: document.getElementById('t1pc').textContent, t2: document.getElementById('t2pc').textContent, t3: document.getElementById('t3pc').textContent,
      dueBreak };
  }));

  console.log('=== 10. 状态不变量 ===');
  console.log(await p.evaluate(() => {
    const st = stats();
    const tiers = { 1: 0, 2: 0, 3: 0 };
    let bad = 0, seenSum = 0, manualSeen = 0;
    courseWords().forEach(w => {
      const r = S.w[w.id]; if (!r || !r.seen) return;
      seenSum++;
      if (r.mm) { manualSeen++; return; }
      if (r.b >= 1 && r.b <= 3) tiers[r.b]++;
      else if (r.retired || r.b >= 4) tiers[3]++;
      else bad++;
    });
    return { total: st.pool.length, seen: st.seen.length, seenSum, due: st.due.length, tierSum: tiers[1] + tiers[2] + tiers[3],
      manualSeen, retired: st.retired.length, badTier: bad };
  }));

  await p.reload();
  await p.waitForTimeout(350);
  console.log('=== 2b 刷新后复核 ===');
  console.log(await p.evaluate(id => ({ b: S.w[id].b, due: S.w[id].due, card: !!cardLoad() }), uw.id));

  console.log('page errors:', errs);
  await p.screenshot({ path: 'v_defects.png' });
  await b.close();
  fs.unlinkSync('tmp_bad.json'); fs.unlinkSync('tmp_other.json'); fs.unlinkSync('tmp_v2.json');
})();
