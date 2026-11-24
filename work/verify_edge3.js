const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(350);

  console.log('空收藏直接开练:', await p.evaluate(() => {
    setCourse('c1');
    startScope('fav');
    return { qNull: Q === null, setup: document.getElementById('testSetup').style.display, toast: document.getElementById('toast').textContent };
  }));

  console.log('跨天重置今日新词:', await p.evaluate(() => {
    const w = WORDS[0], r = ensure(w.id); r.seen = 0; r.fs = 0; r.mm = 0; r.last = 0;
    markSeen(r); save();
    const a = newTodayCount();
    const real = today;
    today = () => '2026-11-25';
    const c = newTodayCount();
    today = real;
    return { today: a, tomorrow: c };
  }));

  console.log('手动熟后到期数与课程卡一致:', await p.evaluate(() => {
    const w = WORDS[1], r = ensure(w.id);
    r.seen = 1; r.b = 2; r.due = addDays(today(), -2); r.mm = 1; r.retired = 0; r.last = Date.now();
    save(); renderHome();
    const st = stats();
    const card = document.querySelector('#courseList .course .cm').textContent;
    return { due: st.due.length, dueEl: document.getElementById('stDue').textContent, card,
      break: document.getElementById('dueBreak').textContent };
  }));

  console.log('发音失败兜底:', await p.evaluate(() => {
    const old = window.speechSynthesis.speak;
    try { window.speechSynthesis.speak = () => { throw new Error('no voice'); }; } catch (e) {}
    speak('test');
    if (old) window.speechSynthesis.speak = old;
    return { toast: document.getElementById('toast').textContent };
  }));

  console.log('errors:', errs);
  await b.close();
})();
