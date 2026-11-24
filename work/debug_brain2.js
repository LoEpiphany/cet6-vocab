const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(300);
  const cls = () => p.evaluate(() => document.getElementById('brainModal').className + ' pending=' + brainPending + ' at=' + Math.round((Date.now() - brainAt) / 1000));
  await p.evaluate(() => openBrain(true));
  await p.waitForTimeout(200);
  console.log('opened', await cls());
  await p.evaluate(() => closeBrain());
  await p.waitForTimeout(100);
  console.log('closed', await cls());
  const st = await p.evaluate(() => {
    startSession('today', 1, 6);
    const before = { busy: brainBusy(), modal: document.getElementById('brainModal').className, q: !!Q, quiz: document.getElementById('quiz').style.display };
    brainAt = Date.now() - 21 * 60 * 1000;
    const b2 = brainBusy();
    brainCheck();
    const after = { busy: brainBusy(), modal: document.getElementById('brainModal').className, pending: brainPending };
    return { before, b2, after };
  });
  console.log(st);
  await b.close();
})();
