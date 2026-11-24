const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(300);

  console.log('intervals:', await p.evaluate(() => [1, 2, 3, 4, 5, 6].map(b => srsInterval({ b, e: 2.5 }))));

  const start = await p.evaluate(() => {
    const w = WORDS.find(x => x.w.length > 6) || WORDS[0];
    window.__wid = w.id;
    const r = ensure(w.id); r.seen = 1; r.b = 6; r.rc = 2; r.due = today(); r.e = 2.5; r.retired = 0;
    Q = { ids: [w.id], srcIds: [w.id], i: 0, len: 1, right: 0, wrong: 0, wrongIds: [], t0: Date.now(),
      cur: null, locked: false, retry: {}, scope: 'all', types: ['e2c'], qn: 0, perWord: {}, prod: 0, rested: false, lastType: '' };
    document.getElementById('testSetup').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    go('test'); nextQ();
    return { type: Q.cur.type, answer: Q.cur.answer };
  });
  console.log('q:', start);
  await p.evaluate(() => { const btn = [...document.querySelectorAll('#qBody .opt')].find(x => x.dataset.v === Q.cur.answer); if (btn) btn.click(); else { document.getElementById('typed').value = Q.cur.answer; submitTyped(); } });
  await p.waitForTimeout(300);
  console.log('retired:', await p.evaluate(() => { const r = rec(__wid); return { b: r.b, rc: r.rc, retired: r.retired, due: r.due, label: bandLabel(r), inAll: buildQueue('all').includes(__wid), statsRetired: stats().retired.length, fb: document.getElementById('qFeedback').innerText.includes('已退休') }; }));
  await p.screenshot({ path: 'v_srs_retire.png' });

  // 唤醒：退休词答错
  await p.evaluate(() => {
    const r = rec(__wid); r.retired = 1; r.b = 7; r.due = addDays(today(), 365); r.rc = 5;
    Q = { ids: [__wid], srcIds: [__wid], i: 0, len: 1, right: 0, wrong: 0, wrongIds: [], t0: Date.now(),
      cur: null, locked: false, retry: {}, scope: 'all', types: ['e2c'], qn: 0, perWord: {}, prod: 0, rested: false, lastType: '' };
    document.getElementById('quiz').style.display = 'block'; nextQ();
  });
  await p.evaluate(() => { const btn = [...document.querySelectorAll('#qBody .opt')].find(x => x.dataset.v !== Q.cur.answer); btn.click(); });
  await p.waitForTimeout(250);
  console.log('woken:', await p.evaluate(() => { const r = rec(__wid); return { b: r.b, retired: r.retired, due: r.due, rc: r.rc, lapses: r.lapses, label: bandLabel(r) }; }));

  console.log('errors:', errs);
  await b.close();
})();
