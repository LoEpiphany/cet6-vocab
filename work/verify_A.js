const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  // A1 标记为记住：当场可见 + 影响队列 + 可撤销
  await p.evaluate(() => { go('card'); setCardScope('today'); });
  await p.waitForTimeout(300);
  const id = await p.evaluate(() => cardList[cardIdx]);
  await p.click('#flipBtn');
  await p.waitForTimeout(200);
  console.log('rate row visible:', await p.$eval('#rateRow', e => getComputedStyle(e).display));
  await p.click('#rateRow .rate-ok');
  await p.waitForTimeout(300);
  const m1 = await p.evaluate(id => ({
    rec: rec(id), inDeck: cardList.indexOf(id), flash: (document.getElementById('cardFlash').innerText || '').replace(/\s+/g, ' '),
    remain: document.getElementById('cardRemain').textContent, today: document.getElementById('cardToday').textContent,
    seenHome: document.getElementById('sumSeen').textContent
  }), id);
  console.log('A1 after known:', JSON.stringify(m1));
  await p.click('#cardFlash .btn');
  await p.waitForTimeout(300);
  const m2 = await p.evaluate(id => ({ rec: rec(id), inDeck: cardList.indexOf(id), flash: document.getElementById('cardFlash').innerText, n: (S.d[today()] || {}).n }), id);
  console.log('A1 undo:', JSON.stringify(m2));

  // A2 导出：真下载
  await p.evaluate(() => go('plan'));
  await p.waitForTimeout(300);
  const [dl] = await Promise.all([
    p.waitForEvent('download', { timeout: 8000 }),
    p.click('text=导出进度')
  ]);
  const outPath = path.join(__dirname, 'export_test.json');
  await dl.saveAs(outPath);
  const exp = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  console.log('A2 export:', dl.suggestedFilename(), 'state keys:', Object.keys(exp.state || {}).join(','));

  // A2 导入：改一份状态再导回
  const st = JSON.parse(JSON.stringify(exp.state));
  st.w['3'] = Object.assign({}, st.w['3'] || {}, { b: 4, seen: 1, due: '2026-12-01', fav: 1, mm: 0 });
  st.quota = 33;
  fs.writeFileSync(path.join(__dirname, 'import_test.json'), JSON.stringify({ app: 'cet6vocab', version: 1, state: st }));
  await p.setInputFiles('#importFile', path.join(__dirname, 'import_test.json'));
  await p.waitForTimeout(800);
  const imp = await p.evaluate(() => ({ quota: S.quota, rec3: S.w['3'], sum: document.getElementById('sumSeen').textContent }));
  console.log('A2 import:', JSON.stringify(imp));

  // A3 卡片续做：翻到第 3 张、翻面后刷新
  await p.evaluate(() => { localStorage.removeItem('cet6vocab_2026_card_v1'); go('card'); setCardScope('all'); cardMove(1); cardMove(1); cardFlip(); });
  await p.waitForTimeout(200);
  const beforeReload = await p.evaluate(() => ({ idx: cardIdx, id: cardList[cardIdx], shown: cardShown, len: cardList.length }));
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('[data-v=card]');
  await p.waitForTimeout(500);
  const afterReload = await p.evaluate(() => ({ idx: cardIdx, id: cardList[cardIdx], shown: cardShown, len: cardList.length, pos: document.getElementById('cardPos').textContent, toast: document.getElementById('toast').textContent }));
  console.log('A3 card resume:', JSON.stringify({ beforeReload, afterReload }));

  // A3 翻译续做
  await p.evaluate(() => {
    go('trans'); tRenderMod(); TUI.len = 2;
    const ids = TITEMS.filter(x => x.mods.indexOf('terms') >= 0).slice(0, 2).map(x => x.id);
    tStartIds(ids);
  });
  await p.waitForTimeout(400);
  await p.click('#tqBody .topt');
  await p.waitForTimeout(300);
  await p.click('#tqAct .btn.primary');
  await p.waitForTimeout(300);
  const tBefore = await p.evaluate(() => ({ i: TQ.i, len: TQ.len, snap: !!localStorage.getItem('cet6vocab_2026_tquiz_v1') }));
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('[data-v=trans]');
  await p.waitForTimeout(400);
  const banner = (await p.textContent('#transHome')).replace(/\s+/g, ' ').slice(0, 120);
  await p.click('text=接着练');
  await p.waitForTimeout(400);
  const tAfter = await p.evaluate(() => ({ i: TQ.i, len: TQ.len, counter: (document.querySelector('#transQuiz .meta > span:last-child') || {}).textContent }));
  console.log('A3 trans resume:', JSON.stringify({ tBefore, banner, tAfter }));

  // 手机布局
  await p.evaluate(() => go('card'));
  await p.waitForTimeout(300);
  const layout = await p.evaluate(() => {
    const bar = document.querySelector('.thumbbar').getBoundingClientRect();
    const btn = document.querySelector('#flipRow .primary').getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      barTop: Math.round(bar.top), btnH: Math.round(btn.height), btnTop: Math.round(btn.top), vh: innerHeight };
  });
  console.log('mobile:', JSON.stringify(layout));
  await p.screenshot({ path: 'v_A_card.png' });
  console.log('errors:', errs);
  await b.close();
})();
