const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const U = 'http://localhost:8766/index.html';
const S = (p, n) => p.screenshot({ path: n });
const txt = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
  await p.goto(U);
  await p.waitForTimeout(600);

  await p.click('[data-v=essay]');
  await p.waitForTimeout(400);
  console.log('brand:', await txt(p, '.brand'));
  console.log('subline:', await txt(p, '#subline'));
  console.log('hero:', !!(await p.$('#essayBody .ehero')));
  console.log('modes:', await p.$$eval('#essayBody .emode', e => e.length));
  console.log('overflow:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await S(p, 'v_essay_home.png');

  // 句型卡
  await p.$$eval('#essayBody .emode', e => e[0].click());
  await p.waitForTimeout(250);
  console.log('cards: flash', !!(await p.$('#essayBody .eflash')), 'rates0', await p.$$eval('#essayBody .erates .btn', e => e.length));
  await p.click('#essayBody .eflash');
  await p.waitForTimeout(200);
  console.log('cards flipped rates:', await p.$$eval('#essayBody .erates .btn', e => e.length));
  await S(p, 'v_essay_card.png');
  await p.$$eval('#essayBody .erates .btn', e => e[2].click());
  await p.waitForTimeout(200);
  console.log('cards progress:', await txt(p, '#essayBody .meta .mini'));
  await p.$$eval('#essayBody button.btn.sm', e => e[0].click());
  await p.waitForTimeout(250);

  // 速配
  await p.$$eval('#essayBody .emode', e => e[1].click());
  await p.waitForTimeout(250);
  console.log('match items:', await p.$$eval('#essayBody .emitem', e => e.length));
  await p.$$eval('#essayBody .emcol', c => c[0].children[0].click());
  await p.waitForTimeout(100);
  const target = await p.evaluate(() => eCtx.pairs[eCtx.orderL[0]].en);
  await p.evaluate(t => {
    const col = document.querySelectorAll('#essayBody .emcol')[1];
    const btn = [...col.children].find(b => b.textContent === t);
    if (btn) btn.click();
  }, target);
  await p.waitForTimeout(250);
  console.log('match after click done:', await txt(p, '#essayBody .pill'));
  await S(p, 'v_essay_match.png');
  await p.$$eval('#essayBody button.btn.sm', e => e[0].click());
  await p.waitForTimeout(250);

  // 填空
  await p.$$eval('#essayBody .emode', e => e[2].click());
  await p.waitForTimeout(250);
  console.log('cloze opts:', await p.$$eval('#essayBody .opt', e => e.length));
  await p.$$eval('#essayBody .opt', e => e[0].click());
  await p.waitForTimeout(250);
  console.log('cloze fb:', await txt(p, '#essayBody .fb'));
  await S(p, 'v_essay_cloze.png');
  await p.evaluate(() => eGo('home'));
  await p.waitForTimeout(250);

  // 中译英
  await p.$$eval('#essayBody .emode', e => e[3].click());
  await p.waitForTimeout(250);
  console.log('build toks:', await p.$$eval('#essayBody .ebuildpool .etok', e => e.length));
  await p.$$eval('#essayBody .ebuildpool .etok', e => { e[0].click(); });
  await p.waitForTimeout(120);
  await p.$$eval('#essayBody .ebuildpool .etok', e => { e[0].click(); });
  await p.waitForTimeout(120);
  await p.$$eval('#essayBody button.btn.primary', e => e[0].click());
  await p.waitForTimeout(250);
  console.log('build fb:', await txt(p, '#essayBody .fb'));
  await S(p, 'v_essay_build.png');
  await p.evaluate(() => eGo('home'));
  await p.waitForTimeout(250);

  // 段落排序
  await p.$$eval('#essayBody .emode', e => e[4].click());
  await p.waitForTimeout(250);
  const sn = await p.$$eval('#essayBody .esents', c => c[1].children.length);
  console.log('order pool:', sn);
  for (let i = 0; i < sn + 3; i++) {
    const moved = await p.evaluate(() => {
      const c = document.querySelectorAll('#essayBody .esents')[1];
      if (!c) return false;
      const btn = [...c.children].find(b => !b.classList.contains('used'));
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!moved) break;
    await p.waitForTimeout(120);
  }
  console.log('order picked:', await p.evaluate(() => eCtx.picked.length + '/' + eCtx.ans.length));
  await p.$$eval('#essayBody button.btn.primary', e => e[0].click());
  await p.waitForTimeout(300);
  console.log('order result:', await txt(p, '#essayBody .etitle'));
  await S(p, 'v_essay_order.png');
  await p.evaluate(() => eGo('home'));
  await p.waitForTimeout(250);

  // 归类
  await p.$$eval('#essayBody .emode', e => e[5].click());
  await p.waitForTimeout(250);
  console.log('sort opts:', await p.$$eval('#essayBody .opt', e => e.length));
  await p.$$eval('#essayBody .opt', e => e[0].click());
  await p.waitForTimeout(250);
  console.log('sort fb:', await txt(p, '#essayBody .fb'));
  await p.evaluate(() => eGo('home'));
  await p.waitForTimeout(250);

  // 60 秒挑战
  await p.$$eval('#essayBody .emode', e => e[6].click());
  await p.waitForTimeout(1400);
  console.log('challenge time:', await txt(p, '#echTime'));
  await p.$$eval('#essayBody .opt', e => e[0].click());
  await p.waitForTimeout(400);
  console.log('challenge score:', await p.$$eval('#essayBody .pill', e => e.map(x => x.textContent.trim()).join('|')));
  await S(p, 'v_essay_challenge.png');
  await p.evaluate(() => eGo('home'));
  await p.waitForTimeout(300);

  // 骨架
  await p.evaluate(() => eGo('tpl'));
  await p.waitForTimeout(300);
  console.log('tpl cards:', await p.$$eval('#essayBody .ecard', e => e.length));
  await p.$$eval('#essayBody button.btn.sm', e => e.find(x => /标记已读/.test(x.textContent)).click());
  await p.waitForTimeout(200);
  console.log('tpl seen:', await txt(p, '#essayBody .pill'));
  await S(p, 'v_essay_tpl.png');

  // 语料库
  await p.evaluate(() => eGo('lib'));
  await p.waitForTimeout(300);
  console.log('lib rows:', await p.$$eval('#elibList .elibrow', e => e.length));
  await p.fill('#elibSearch', 'benefit');
  await p.waitForTimeout(300);
  console.log('lib search rows:', await p.$$eval('#elibList .elibrow', e => e.length));
  await S(p, 'v_essay_lib.png');

  // 写作台
  await p.evaluate(() => eGo('topics'));
  await p.waitForTimeout(300);
  console.log('topics:', await p.$$eval('#essayBody .etopic', e => e.length));
  await p.$$eval('#essayBody .etopic', e => e[0].click());
  await p.waitForTimeout(250);
  console.log('topic prompt:', (await txt(p, '#essayBody .eprompt')).slice(0, 60));
  await p.$$eval('#essayBody button.btn.primary', e => e[0].click());
  await p.waitForTimeout(350);
  console.log('write textarea:', !!(await p.$('#ewText')));
  const essay = 'Faced with the popularity of artificial intelligence, college students realize that independent thinking matters more than ever. Even so, quite a few still struggle to translate this awareness into consistent action. Admittedly, AI serves as a powerful assistant, helping us sort out materials and streamline tedious work. Nevertheless, over-reliance on it will gradually erode our capacity to analyze, judge and create. Without independent thinking, we can hardly filter out biased content or generate original ideas. Therefore, we must strike a proper balance between using AI and preserving our own thinking. Only in this way can we make the most of this technology and lay a solid foundation for our long-term growth.';
  await p.fill('#ewText', essay);
  await p.waitForTimeout(400);
  console.log('wordcount:', await txt(p, '#ewCount'));
  await p.$$eval('#essayBody button.btn.primary', e => e[0].click());
  await p.waitForTimeout(400);
  console.log('submit title:', await txt(p, '#essayBody .etitle'));
  await S(p, 'v_essay_submit.png');

  const ls = await p.evaluate(() => ({ essay: !!localStorage.getItem('cet6vocab_2026_essay_v1'), keys: Object.keys(localStorage) }));
  console.log('localStorage:', JSON.stringify(ls));
  console.log('ERRORS:', errs.length ? JSON.stringify(errs, null, 1) : 'none');
  await b.close();
})();
