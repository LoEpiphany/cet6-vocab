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
  const box = sel => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width), shown: getComputedStyle(e).display !== 'none' && r.height > 0 }; });
  const ov = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  console.log('home thumb:', JSON.stringify(await box('#v-home .thumbbar .btn.primary')), 'overflow', await ov());
  await p.click('[data-v=card]');
  await p.waitForTimeout(300);
  console.log('card flip:', JSON.stringify(await box('#flipRow .primary')), 'tools:', JSON.stringify(await box('.cardtools .circlebtn')));
  await p.click('#flipBtn');
  await p.waitForTimeout(200);
  console.log('card rate:', JSON.stringify(await box('#rateRow .rate-ok')), 'overflow', await ov());
  await p.evaluate(() => { go('test'); enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('all', 1, 2); });
  await p.waitForTimeout(400);
  await p.click('#qBody .opt');
  await p.waitForTimeout(300);
  console.log('quiz continue:', JSON.stringify(await box('#qActions .primary')), 'scrollY', await p.evaluate(() => scrollY), 'overflow', await ov());

  // 翻译手动熟/收藏
  const tm = await p.evaluate(() => {
    go('trans'); tRenderMod();
    const x = TITEMS.find(y => y.mods.indexOf('freq') >= 0);
    tOpen(x.id);
    tMarkManual(x.id);
    const after = { mm: tRec(x.id).mm, inPool: tPool().some(y => y.id === x.id), label: document.getElementById('sheetBox').innerText.indexOf('手动熟') >= 0 };
    tToggleFav(x.id);
    const fav = { fav: tRec(x.id).fav, inFav: tPool().some(y => y.id === x.id) };
    tRenderMod(); tOpen(x.id);
    tMarkManual(x.id);
    tToggleFav(x.id);
    return { after, fav };
  });
  console.log('trans manual/fav:', JSON.stringify(tm));
  // 翻译答题底部操作
  await p.evaluate(() => { tView = 'home'; tState().m = 'terms'; tRenderMod(); TUI.len = 1; TUI.types = ['e2c']; const x = TITEMS.find(y => y.mods.indexOf('terms') >= 0); tStartIds([x.id]); });
  await p.waitForTimeout(400);
  await p.click('#tqBody .topt');
  await p.waitForTimeout(300);
  console.log('trans continue:', JSON.stringify(await box('#tqAct .primary')), 'scrollY', await p.evaluate(() => scrollY), 'overflow', await ov());
  await p.screenshot({ path: 'v_UX_trans.png' });

  // 全页横向溢出
  for (const v of ['today', 'card', 'test', 'vocab', 'story', 'plan', 'trans']) {
    await p.evaluate(vv => go(vv), v);
    await p.waitForTimeout(200);
    console.log('overflow', v, await ov());
  }
  console.log('errors:', errs);
  await b.close();
})();
