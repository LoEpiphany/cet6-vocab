const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/index.html');
  await p.waitForTimeout(400);
  const ov = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const views = ['today', 'vocab', 'story', 'plan', 'trans'];
  for (const v of views) {
    await p.evaluate(vv => go(vv), v);
    await p.waitForTimeout(250);
    console.log(v, 'overflow', await ov());
  }
  await p.evaluate(() => { tRenderHome(); });
  await p.waitForTimeout(200);
  console.log('trans home overflow', await ov());
  await p.evaluate(() => { tRenderMod(); });
  await p.waitForTimeout(200);
  console.log('trans mod overflow', await ov());
  await p.screenshot({ path: 'v_final_trans.png' });

  await p.goto('http://localhost:8766/学习手册.html');
  await p.waitForTimeout(400);
  console.log('manual overflow', await ov());
  console.log('manual tables:', await p.$$eval('table', els => els.map(e => Math.round(e.getBoundingClientRect().width))));
  console.log('manual s2:', (await p.textContent('#s2')).replace(/\s+/g, ' ').slice(0, 260));
  await p.screenshot({ path: 'v_manual_mobile.png', fullPage: true });
  console.log('errors:', errs);
  await b.close();
})();
