const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'http://localhost:8766/index.html';
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);

  console.log('首屏未加载词典:', await p.evaluate(() => ({
    loaded: !!window.__DICT_DATA__,
    dictScript: [...document.scripts].some(s => (s.src || '').includes('dict.js'))
  })));

  await p.evaluate(() => { go('story'); openStory(0); });
  await p.waitForTimeout(300);
  // 选正文里第一个不在高亮里的英文词
  const pick = await p.evaluate(() => {
    const root = document.querySelector('#storyReader .storytext');
    if (!root) return null;
    root.scrollIntoView({ block: 'center' });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('b.hl')) continue;
      const m = (n.textContent || '').match(/[A-Za-z]{5,}/);
      if (!m) continue;
      const i = m.index;
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, i + m[0].length);
      const rect = r.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return { word: m[0], x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  });
  console.log('点中的正文词:', pick);
  await p.mouse.click(pick.x, pick.y);
  await p.waitForTimeout(1200);
  console.log('首次点词:', await p.evaluate(() => ({
    loaded: !!window.__DICT_DATA__,
    meta: window.__DICT_DATA__ ? window.__DICT_DATA__.meta : null,
    sheet: document.getElementById('sheet').classList.contains('on'),
    text: document.getElementById('sheetBox').innerText.slice(0, 240)
  })));

  async function open(word) {
    await p.evaluate(w => dictOpen(w), word);
    await p.waitForTimeout(120);
    return await p.evaluate(() => ({
      on: document.getElementById('sheet').classList.contains('on'),
      text: document.getElementById('sheetBox').innerText.replace(/\n+/g, ' | ').slice(0, 260)
    }));
  }
  for (const w of ['shallows', 'triggered', 'studies', 'went', 'high-precision', "children's", 'pandemic', 'zzzznotaword']) {
    console.log('查词', w, '=>', await open(w));
  }

  console.log('短语查询:', await p.evaluate(() => {
    const r = dictPhrase('cultural heritage');
    if (r) dictSheet('cultural heritage', r);
    return { hit: !!r, text: document.getElementById('sheetBox').innerText.replace(/\n+/g, ' | ').slice(0, 200) };
  }));

  console.log('查词不动背诵状态:', await p.evaluate(() => {
    const before = localStorage.getItem('cet6vocab_2026_v1');
    dictOpen('study');
    const after = localStorage.getItem('cet6vocab_2026_v1');
    return { same: before === after, sheetHasTag: document.getElementById('sheetBox').innerText.includes('仅供查阅') };
  }));

  await p.evaluate(() => { closeSheet(); go('trans'); tEnter('terms'); TUI.types = ['c2e']; tStart(); });
  await p.waitForTimeout(400);
  const optPoint = async () => p.evaluate(() => {
    const b = document.querySelector('#transQuiz .topt');
    if (!b) return null;
    b.scrollIntoView({ block: 'center' });
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const m = (n.textContent || '').match(/[A-Za-z]{4,}/);
      if (!m) continue;
      const r = document.createRange();
      r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rc = r.getBoundingClientRect();
      if (rc.width > 0) return { word: m[0], x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
    }
    return null;
  });
  const beforeOpt = await p.evaluate(() => ({ right: TQ.right, wrong: TQ.wrong, locked: TQ.cur && TQ.cur.locked }));
  const op = await optPoint();
  if (op) await p.mouse.click(op.x, op.y);
  await p.waitForTimeout(350);
  console.log('作答前点选项: 选项本身生效，不弹词典', { beforeOpt, word: op && op.word, after: await p.evaluate(() => ({ right: TQ.right, wrong: TQ.wrong, locked: TQ.cur && TQ.cur.locked, sheet: document.getElementById('sheet').classList.contains('on') })) });
  const afterAnswer = await p.evaluate(() => ({ right: TQ.right, wrong: TQ.wrong }));
  console.log('tqBody 尾部:', await p.evaluate(() => document.getElementById('tqFb').innerHTML.slice(-900)));
  const glossPoint = await p.evaluate(() => {
    const els = [...document.querySelectorAll('#tqFb .note, #tqFb div')];
    const el = els.find(x => /每个选项的意思/.test(x.innerText)) || els[els.length - 1];
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const m = (n.textContent || '').match(/[A-Za-z]{4,}/);
      if (!m) continue;
      const r = document.createRange();
      r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rc = r.getBoundingClientRect();
      if (rc.width > 0) return { word: m[0], x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
    }
    return null;
  });
  if (glossPoint) await p.mouse.click(glossPoint.x, glossPoint.y);
  await p.waitForTimeout(450);
  console.log('作答后点“每个选项的意思”里的词: 查词，不再计分', { word: glossPoint && glossPoint.word, afterAnswer, after: await p.evaluate(() => ({ right: TQ.right, wrong: TQ.wrong, sheet: document.getElementById('sheet').classList.contains('on'), text: document.getElementById('sheetBox').innerText.replace(/\n+/g, ' | ').slice(0, 160) })) });
  await p.evaluate(() => closeSheet());

  const findPoint = async (sel) => p.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('b.hl')) continue;
      const m = (n.textContent || '').match(/[A-Za-z]{4,}/);
      if (!m) continue;
      const r = document.createRange();
      r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const rc = r.getBoundingClientRect();
      if (rc.width > 0) return { word: m[0], x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
    }
    return null;
  }, sel);

  await p.evaluate(() => {
    const w = WORDS.find(x => x.ex && x.col && x.col.length && x.courses.indexOf('c1') >= 0);
    openWord(w.id);
  });
  await p.waitForTimeout(200);
  const exPt = await findPoint('#sheetBox .ex .en');
  if (exPt) await p.mouse.click(exPt.x, exPt.y);
  await p.waitForTimeout(250);
  console.log('例句点词:', { word: exPt && exPt.word, after: await p.evaluate(() => ({ sheet: document.getElementById('sheet').classList.contains('on'), text: document.getElementById('sheetBox').innerText.replace(/\n+/g, ' | ').slice(0, 140) })) });

  await p.evaluate(() => {
    closeSheet();
    const w = WORDS.find(x => x.col && x.col.length && x.courses.indexOf('c1') >= 0);
    openWord(w.id);
  });
  await p.waitForTimeout(200);
  const colPt = await findPoint('#sheetBox .cols div');
  if (colPt) await p.mouse.click(colPt.x, colPt.y);
  await p.waitForTimeout(250);
  console.log('搭配点词:', { word: colPt && colPt.word, after: await p.evaluate(() => ({ sheet: document.getElementById('sheet').classList.contains('on'), text: document.getElementById('sheetBox').innerText.replace(/\n+/g, ' | ').slice(0, 140) })) });
  await p.evaluate(() => closeSheet());

  // 20 个正文词覆盖率
  const sample = await p.evaluate(() => {
    const texts = [];
    document.querySelectorAll('#storyReader .storytext, #storyReader .cols, #storyReader .note, #storyReader .recall').forEach(el => texts.push(el.innerText));
    const all = texts.join(' ');
    const words = [...new Set((all.match(/[A-Za-z]{4,}/g) || []).map(x => x.toLowerCase()))].slice(0, 20);
    return words.map(w => ({ w, hit: !!dictFind(w), lemma: (dictFind(w) || {}).key || '' }));
  });
  console.log('20 词覆盖率:', sample, '命中', sample.filter(x => x.hit).length + '/20');
  console.log('errors:', errs);
  await b.close();
})();
