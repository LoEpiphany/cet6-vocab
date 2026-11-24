const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);
  await p.evaluate(() => { go('card'); setCardScope('today'); });
  await p.waitForTimeout(300);
  const before = await p.evaluate(() => {
    const id = cardList[cardIdx];
    const r = rec(id);
    return { id, idx: cardIdx, len: cardList.length, pos: document.getElementById('cardPos').textContent,
      rec: r && { b: r.b, due: r.due, seen: r.seen }, n: (S.d[today()] || {}).n, seenTotal: stats().seen.length };
  });
  console.log('before', before);
  await p.click('text=记住了');
  await p.waitForTimeout(400);
  const after = await p.evaluate(id => {
    const r = rec(id);
    return { idx: cardIdx, pos: document.getElementById('cardPos').textContent, toast: document.getElementById('toast').textContent,
      rec: r && { b: r.b, due: r.due, seen: r.seen, rc: r.rc }, n: (S.d[today()] || {}).n, seenTotal: stats().seen.length,
      inToday: buildQueue('today', 1).slice(0, 30).indexOf(id) };
  }, before.id);
  console.log('after', after);
  console.log('cardList has id:', await p.evaluate(id => cardList.indexOf(id), before.id));
  await p.screenshot({ path: 'v_mark_before_after.png' });
  console.log('errors', errs);
  await b.close();
})();
