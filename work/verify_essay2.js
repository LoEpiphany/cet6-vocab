const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.waitForTimeout(500);
  await p.click('[data-v=essay]');
  await p.waitForTimeout(300);
  console.log('brand class:', await p.evaluate(() => document.querySelector('.brand').className));
  console.log('brand after:', await p.evaluate(() => getComputedStyle(document.querySelector('.brand'), '::after').content));
  await p.click('[data-v=home]');
  await p.waitForTimeout(300);
  console.log('back home brand:', await p.textContent('.brand'), '| class:', await p.evaluate(() => document.querySelector('.brand').className));
  console.log('back home essayStillOn:', await p.evaluate(() => document.getElementById('v-essay').classList.contains('on')));

  // 练一张卡，刷新后确认独立进度
  await p.click('[data-v=essay]');
  await p.waitForTimeout(200);
  await p.evaluate(() => eGo('cards'));
  await p.waitForTimeout(200);
  await p.click('#essayBody .eflash');
  await p.waitForTimeout(100);
  await p.$$eval('#essayBody .erates .btn', e => e[2].click());
  await p.waitForTimeout(200);
  const before = await p.evaluate(() => JSON.parse(localStorage.getItem('cet6vocab_2026_essay_v1')).items);
  console.log('essay items after 1:', Object.keys(before).length, Object.values(before)[0]);
  console.log('main key exists:', await p.evaluate(() => !!localStorage.getItem('cet6vocab_2026_v1')));
  await p.reload();
  await p.waitForTimeout(500);
  await p.click('[data-v=essay]');
  await p.waitForTimeout(300);
  console.log('after reload subline:', (await p.textContent('#subline')).replace(/\s+/g, ' '));
  console.log('badge:', await p.$$eval('#essayBody .ebadge.on', e => e.map(x => x.textContent.trim())));
  console.log('export essay keys:', await p.evaluate(() => Object.keys(eExportState())));
  console.log('overflow essay:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));

  // 手册
  await p.goto('http://localhost:8766/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C.html');
  await p.waitForTimeout(400);
  console.log('manual s11:', (await p.textContent('#s11')).replace(/\s+/g, ' ').slice(0, 40));
  console.log('manual toc last:', await p.$$eval('.toc li', e => e[e.length - 1].textContent.trim()));
  console.log('manual overflow:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await p.screenshot({ path: 'v_essay_manual.png', fullPage: false });
  console.log('ERRORS:', errs.length ? JSON.stringify(errs) : 'none');
  await b.close();
})();
