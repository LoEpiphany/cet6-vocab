const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);

  // 手动入口
  await p.click('[data-v=plan]');
  await p.waitForTimeout(150);
  await p.click('text=现在来一发（30 秒）');
  await p.waitForTimeout(300);
  console.log('modal open:', await p.$eval('#brainModal', e => e.classList.contains('on')));
  console.log('round:', (await p.textContent('#brainBody')).replace(/\s+/g, ' ').slice(0, 50), 'opts:', await p.$$eval('.brain-opt', e => e.length));
  // 连答 6 题（用当前答案）
  for (let i = 0; i < 6; i++) {
    const ans = await p.evaluate(() => brainQ && brainQ.answer);
    await p.click('.brain-opt[data-k=' + ans + ']');
    await p.waitForTimeout(520);
  }
  console.log('result:', (await p.textContent('#brainBody')).replace(/\s+/g, ' ').slice(0, 60));
  await p.screenshot({ path: 'v_brain.png' });
  await p.click('text=回去继续');
  await p.waitForTimeout(200);
  console.log('closed:', await p.$eval('#brainModal', e => e.classList.contains('on')), 'timer gap(s):', await p.evaluate(() => Math.round((Date.now() - brainAt) / 1000)));

  // 到期但正在做题 -> 延迟
  const st = await p.evaluate(() => { enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('today', 1, 6); brainAt = Date.now() - 21 * 60 * 1000; brainCheck(); return { view: document.getElementById('v-test').className, quiz: document.getElementById('quiz').style.display, q: !!Q, busy: brainBusy(), pending: brainPending, modal: document.getElementById('brainModal').className }; });
  console.log('quiz state:', st);
  await p.waitForTimeout(200);
  console.log('deferred while quiz:', await p.$eval('#brainModal', e => e.classList.contains('on')), 'pending:', await p.evaluate(() => brainPending));
  console.log('debug modal:', await p.evaluate(() => ({ cls: document.getElementById('brainModal').className, count: document.querySelectorAll('#brainModal').length, busy: brainBusy(), pending: brainPending, at: Math.round((Date.now() - brainAt) / 1000) })));
  // 离开做题后触发
  await p.evaluate(() => { Q.i = Q.ids.length; finish(); brainCheck(); });
  await p.waitForTimeout(300);
  console.log('opens after quiz:', await p.$eval('#brainModal', e => e.classList.contains('on')));
  console.log('at x:', await p.evaluate(() => {
    const r = document.querySelector('#brainModal .x').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { cls: document.getElementById('brainModal').className, hit: el && el.tagName + '.' + el.className, brainQ: !!brainQ };
  }));
  await p.click('#brainModal .x');
  await p.waitForTimeout(300);
  console.log('after X:', await p.evaluate(() => ({ cls: document.getElementById('brainModal').className, brainQ: !!brainQ, gap: Math.round((Date.now() - brainAt) / 1000) })));
  console.log('X closes:', await p.$eval('#brainModal', e => e.classList.contains('on')), 'errors:', errs);
  await b.close();
})();
