const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  // B4 手动标熟 + 词库筛选 + 撤销
  await p.evaluate(() => { go('card'); setCardScope('all'); });
  await p.waitForTimeout(300);
  const id = await p.evaluate(() => cardList[0]);
  await p.click('.cardtools .circlebtn');
  await p.waitForTimeout(300);
  const man = await p.evaluate(id => ({ mm: rec(id).mm, inPool: poolOf('all').some(w => w.id === id), label: bandLabel(rec(id)), flash: document.getElementById('cardFlash').innerText.replace(/\s+/g, ' ') }), id);
  await p.evaluate(() => { go('vocab'); renderLib(); });
  await p.waitForTimeout(300);
  const hasManualChip = await p.evaluate(() => [...document.querySelectorAll('#libChips button')].some(b => b.textContent.indexOf('手动熟') >= 0));
  await p.evaluate(id => { markManual(id, 0); }, id);
  const unman = await p.evaluate(id => ({ mm: rec(id).mm, inPool: poolOf('all').some(w => w.id === id) }), id);
  console.log('B4 manual:', JSON.stringify({ man, hasManualChip, unman }));

  // B5 收藏 + 收藏单独成轮
  await p.evaluate(() => closeSheet());
  await p.evaluate(id => { toggleFav(id, 0); ensure(id).mm = 0; save(); }, id);
  const fav = await p.evaluate(id => ({ fav: rec(id).fav, inFavPool: poolOf('fav').some(w => w.id === id) }), id);
  await p.evaluate(id => { enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('fav', 1, 1); }, id);
  await p.waitForTimeout(400);
  const favQ = await p.evaluate(id => ({ ids: Q.ids, cur: Q.cur && Q.cur.w && Q.cur.w.id }), id);
  // 手动熟答错：不静默复活，给出拉回提示
  const prompt = await p.evaluate(id => {
    const w = BY[id]; const r = ensure(id); r.mm = 1; r.fav = 1; save();
    Q = { ids: [id], i: 0, len: 1, right: 0, wrong: 0, wrongIds: [], t0: Date.now(), cur: null, locked: false,
      retry: {}, scope: 'x', types: ['e2c'], qn: 0, perWord: {}, prod: 0, rested: false };
    Q.cur = { w: w, type: 'e2c', answer: w.cn, lang: 'cn', mode: 'x', alt: null };
    resolveAnswer(false, '', null, '');
    const el = document.getElementById('manualPrompt');
    return el ? el.innerText.replace(/\s+/g, ' ') : '';
  }, id);
  const revived = await p.evaluate(id => {
    reviveManual(id);
    return { mm: rec(id).mm, f: rec(id).f, due: rec(id).due };
  }, id);
  console.log('B5 fav + manual wrong:', JSON.stringify({ fav, favQ, prompt, revived }));

  // B6 拼写大小写
  await p.evaluate(() => { go('test'); enabledTypes.length = 0; enabledTypes.push('spell'); startSession('all', 1, 1); });
  await p.waitForTimeout(400);
  const spellInfo = await p.evaluate(() => ({ type: Q.cur.type, ans: Q.cur.answer, hasInput: !!document.getElementById('typed') }));
  await p.fill('#typed', spellInfo.ans.toUpperCase());
  await p.click('#qBody button.primary');
  await p.waitForTimeout(300);
  const spellOk = await p.evaluate(() => ({ ok: !!document.querySelector('#qFeedback .fb.ok'), txt: document.getElementById('qFeedback').innerText.replace(/\s+/g, ' ').slice(0, 80) }));
  console.log('B6 case:', JSON.stringify({ spellInfo, spellOk }));

  // B7 所有选项释义
  await p.evaluate(() => { enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('all', 1, 1); });
  await p.waitForTimeout(400);
  await p.click('#qBody .opt');
  await p.waitForTimeout(300);
  const optGloss = await p.evaluate(() => {
    const t = document.getElementById('qFeedback').innerText;
    const block = [...document.querySelectorAll('#qFeedback .note')].find(e => e.innerText.indexOf('每个选项的意思') >= 0);
    return { hasBlock: !!block, lines: block ? block.innerText.split('\n').length : 0, sample: block ? block.innerText.replace(/\s+/g, ' ').slice(0, 140) : '' };
  });
  console.log('B7 opt gloss:', JSON.stringify(optGloss));

  // B8 正文点词
  await p.evaluate(() => { go('story'); openStory(0); });
  await p.waitForTimeout(500);
  const tap = await p.evaluate(() => {
    const root = document.querySelector('#storyReader .storytext');
    if (!root) return { err: 'no storytext' };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement.closest('b.hl')) continue;
      const words = [...n.textContent.matchAll(/[A-Za-z]{5,}/g)];
      for (const m of words) {
        const low = m[0].toLowerCase();
        if (BASIC_WORDS.has(low)) continue;
        if (!lookupWord(m[0])) continue;
        const r = document.createRange();
        r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rect = r.getBoundingClientRect();
        return { word: m[0], x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, hit: lookupWord(m[0]).w };
      }
    }
    return { err: 'not found' };
  });
  if (!tap.err) {
    await p.mouse.click(tap.x, tap.y);
    await p.waitForTimeout(300);
  }
  const tapRes = await p.evaluate(() => ({ open: document.getElementById('sheet').classList.contains('on'), txt: document.getElementById('sheetBox').innerText.replace(/\s+/g, ' ').slice(0, 90) }));
  console.log('B8 tap word:', JSON.stringify({ tap, tapRes }));

  // B9 翻译助记
  await p.evaluate(() => { closeSheet(); go('trans'); tRenderMod(); });
  await p.waitForTimeout(300);
  const mnInfo = await p.evaluate(() => {
    const x = TITEMS.find(y => y.mn && y.mods.indexOf('freq') >= 0);
    tOpen(x.id);
    return { en: x.en, mn: x.mn, sheet: document.getElementById('sheetBox').innerText.indexOf('助记') >= 0 };
  });
  console.log('B9 trans mn:', JSON.stringify(mnInfo));

  // C10 五种脑力游戏
  const games = await p.evaluate(async () => {
    closeSheet(); openBrain(true); brainClearTimers();
    const out = [];
    // 字色
    brainClearTimers(); brainQ.type = 'stroop'; brainStroop();
    out.push({ t: 'stroop', opts: document.querySelectorAll('#brainBody .brain-opt').length });
    // 序列
    brainClearTimers(); brainQ.type = 'seq'; brainSeq();
    out.push({ t: 'seq', cells: document.querySelectorAll('#brainBody .brain-cell').length, seq: brainQ.seq.slice() });
    // 数字
    brainClearTimers(); brainQ.type = 'digit'; brainDigit();
    out.push({ t: 'digit', digits: brainQ.digit });
    // 找不同
    brainClearTimers(); brainQ.type = 'spot'; brainSpot();
    out.push({ t: 'spot', cells: document.querySelectorAll('#brainBody .brain-grid button').length, odd: brainQ.odd });
    // 接龙
    brainClearTimers(); brainQ.type = 'chain'; brainChain();
    out.push({ t: 'chain', opts: document.querySelectorAll('#brainBody .brain-opt').length, ans: brainQ.answer });
    return out;
  });
  console.log('C10 games:', JSON.stringify(games));
  // 实际玩一轮找不同
  const spotPlay = await p.evaluate(() => { brainClearTimers(); brainQ.type = 'spot'; brainQ.i = 0; brainQ.right = 0; brainQ.locked = false; brainSpot(); return brainQ.odd; });
  await p.click('#brainBody .brain-grid button >> nth=' + spotPlay);
  await p.waitForTimeout(200);
  console.log('C10 spot right:', await p.evaluate(() => brainQ && brainQ.right));
  await p.evaluate(() => closeBrain());
  console.log('errors:', errs);
  await b.close();
})();
