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
  await p.evaluate(() => { openBrain(true); brainQ.i = 0; brainQ.right = 0; brainQ.n = 6; brainClearTimers(); brainQ.type = 'seq'; brainQ.locked = true; brainSeq(); });
  await p.waitForTimeout(2900);
  const seq = await p.evaluate(() => brainQ.seq.slice());
  for (const i of seq) { await p.click('#brainBody .brain-cell >> nth=' + i); await p.waitForTimeout(80); }
  await p.waitForTimeout(600);
  console.log('seq:', JSON.stringify({ seq, right: await p.evaluate(() => brainQ && brainQ.right) }));

  await p.evaluate(() => { brainQ.i = 0; brainQ.right = 0; brainClearTimers(); brainQ.type = 'digit'; brainQ.locked = true; brainDigit(); });
  await p.waitForTimeout(2000);
  const d = await p.evaluate(() => brainQ.digit);
  await p.fill('#brainDigitIn', d);
  await p.click('#brainBody .brain-opt');
  await p.waitForTimeout(600);
  console.log('digit:', JSON.stringify({ d, right: await p.evaluate(() => brainQ && brainQ.right) }));

  await p.evaluate(() => { brainQ.i = 0; brainQ.right = 0; brainQ.locked = false; brainClearTimers(); brainQ.type = 'chain'; brainChain(); });
  const ans = await p.evaluate(() => brainQ.answer);
  await p.click('.brain-opt[data-k="' + ans + '"]');
  await p.waitForTimeout(600);
  console.log('chain:', JSON.stringify({ ans, right: await p.evaluate(() => brainQ && brainQ.right) }));

  await p.evaluate(() => { brainQ.i = 0; brainQ.right = 0; brainQ.locked = false; brainClearTimers(); brainQ.type = 'stroop'; brainStroop(); });
  const ca = await p.evaluate(() => brainQ.answer);
  await p.click('.brain-opt[data-k="' + ca + '"]');
  await p.waitForTimeout(600);
  console.log('stroop:', JSON.stringify({ ca, right: await p.evaluate(() => brainQ && brainQ.right) }));

  const rot = await p.evaluate(() => { const a = []; for (let i = 0; i < 20; i++) a.push(brainNextType()); return { types: [...new Set(a)], dup: a.some((x, i) => i && x === a[i - 1]) }; });
  console.log('rotation:', JSON.stringify(rot));
  await p.evaluate(() => closeBrain());
  console.log('brainAt reset:', await p.evaluate(() => Math.round((Date.now() - brainAt) / 1000)) + 's');

  // 翻译收藏（非手动熟）
  const tf = await p.evaluate(() => {
    go('trans'); tRenderMod();
    const x = TITEMS.find(y => y.mods.indexOf('freq') >= 0 && !tRec(y.id));
    tToggleFav(x.id);
    TUI.scope = 'fav';
    return { id: x.id, fav: tRec(x.id).fav, inFav: tPool().some(y => y.id === x.id) };
  });
  console.log('trans fav:', JSON.stringify(tf));
  console.log('errors:', errs);
  await b.close();
})();
