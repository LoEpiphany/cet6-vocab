const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);
  await p.click('[data-v=plan]');
  await p.waitForTimeout(150);
  await p.click('text=现在来一发（30 秒）');
  await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) {
    const ans = await p.evaluate(() => brainQ && brainQ.answer);
    await p.click('.brain-opt[data-k=' + ans + ']');
    await p.waitForTimeout(520);
  }
  await p.click('text=回去继续');
  await p.waitForTimeout(200);
  await p.evaluate(() => { enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('today', 1, 6); brainAt = Date.now() - 21 * 60 * 1000; brainCheck(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { Q.i = Q.ids.length; finish(); brainCheck(); });
  await p.waitForTimeout(300);
  console.log('modal:', await p.$eval('#brainModal', e => e.className));
  console.log('at point:', await p.evaluate(() => {
    const r = document.querySelector('#brainModal .x').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { tag: el && el.tagName, cls: el && el.className, html: el && el.outerHTML.slice(0, 100) };
  }));
  console.log('brainTimer:', await p.evaluate(() => !!brainTimer));
  await p.click('#brainModal .x');
  await p.waitForTimeout(300);
  console.log('after click:', await p.$eval('#brainModal', e => e.className));
  await b.close();
})();
