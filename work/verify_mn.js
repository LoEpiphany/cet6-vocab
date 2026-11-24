const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    const w = WORDS.find(x => x.w === 'absurd');
    openWord(w.id);
    return { total: Object.keys(MN).length, id: w.id, text: MN[w.id], sheet: document.getElementById('sheetBox').innerText.replace(/\s+/g, ' ').slice(0, 160) };
  });
  console.log(info);
  await p.screenshot({ path: 'v_mnemonic.png' });
  console.log('errors', errs);
  await b.close();
})();
