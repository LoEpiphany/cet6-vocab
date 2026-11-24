const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'http://localhost:8766/' + encodeURIComponent('学习手册.html');
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.waitForTimeout(300);
  console.log('手册第五节:', await p.evaluate(() => {
    const h = document.getElementById('s10');
    return { exists: !!h, text: h ? h.parentElement.innerText.replace(/\n+/g, ' | ').slice(0, 360) : '',
      noPlaceholder: !document.body.innerText.includes('__DICT_INFO__') && !document.body.innerText.includes('__VOCAB_KEYS__') };
  }));
  console.log('首屏未加载词典:', await p.evaluate(() => ({ loaded: !!window.__DICT_DATA__, overflow: document.documentElement.scrollWidth > innerWidth })));

  // 在正文里点一个英文词
  const pick = await p.evaluate(() => {
    const root = document.querySelector('#s1');
    let el = root.nextElementSibling;
    while (el && !(el.innerText || '').match(/[A-Za-z]{6,}/)) el = el.nextElementSibling;
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const m = (n.textContent || '').match(/[A-Za-z]{6,}/);
      if (!m) continue;
      const r = document.createRange();
      r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rc = r.getBoundingClientRect();
      if (rc.width > 0 && rc.height > 0) return { word: m[0], x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
    }
    return null;
  });
  console.log('手册点词:', pick);
  if (pick) {
    await p.mouse.click(pick.x, pick.y);
    await p.waitForTimeout(1200);
  }
  console.log('弹出结果:', await p.evaluate(() => ({
    loaded: !!window.__DICT_DATA__,
    on: document.getElementById('dictMask').classList.contains('on'),
    text: document.getElementById('dictBody').innerText.replace(/\n+/g, ' | ').slice(0, 260),
    overflow: document.documentElement.scrollWidth > innerWidth
  })));

  async function open(w) {
    await p.evaluate(x => dictOpen(x), w);
    await p.waitForTimeout(100);
    return await p.evaluate(() => ({ on: document.getElementById('dictMask').classList.contains('on'), text: document.getElementById('dictBody').innerText.replace(/\n+/g, ' | ').slice(0, 240) }));
  }
  for (const w of ['pandemic', 'shallows', 'zzzznotaword']) console.log('手册查', w, '=>', await open(w));

  const sample = await p.evaluate(() => {
    const txt = document.getElementById('s10').parentElement.parentElement.innerText + ' ' +
      [...document.querySelectorAll('p,li,td')].slice(0, 120).map(x => x.innerText).join(' ');
    const ws = [...new Set((txt.match(/[A-Za-z]{4,}/g) || []).map(x => x.toLowerCase()))].slice(0, 20);
    return { words: ws, hit: ws.filter(w => !!dictFind(w)).length };
  });
  console.log('手册 20 词覆盖:', sample);
  await p.screenshot({ path: 'v_dict_manual.png', fullPage: false });
  console.log('errors:', errs);
  await b.close();
})();
