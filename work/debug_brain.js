const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('today', 1, 6);
    return { vtest: document.getElementById('v-test').className, quiz: document.getElementById('quiz').style.display,
      q: !!Q, done: Q && Q.done, busy: brainBusy() };
  });
  console.log(r);
  await p.evaluate(() => { brainAt = Date.now() - 21 * 60000; brainCheck(); });
  console.log('open', await p.$eval('#brainModal', e => e.classList.contains('on')));
  await b.close();
})();
