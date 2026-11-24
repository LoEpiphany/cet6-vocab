const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.waitForTimeout(500);
  console.log('entry card:', (await p.textContent('#transEntry')).replace(/\s+/g, ' ').trim().slice(0, 80));
  await p.screenshot({ path: 'v_home.png' });

  await p.click('[data-v=trans]');
  await p.waitForTimeout(300);
  console.log('mod cards:', await p.$$eval('#transHome .tmod', els => els.map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 60))));
  console.log('trans brand:', (await p.textContent('.brand')).replace(/\s+/g, ' '));
  console.log('trans subline:', (await p.textContent('#subline')).replace(/\s+/g, ' '));
  console.log('overflow home:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await p.screenshot({ path: 'v_trans_home.png' });

  // terms module
  await p.click('#transHome .tmod');
  await p.waitForTimeout(200);
  console.log('module title:', await p.textContent('#transMod h2'));
  await p.click('#transMod button.primary.block');
  await p.waitForTimeout(300);
  console.log('quiz type:', await p.textContent('#transQuiz .pill'));
  const optCount = await p.$$eval('#tqBody .topt', els => els.length);
  console.log('options:', optCount);
  await p.click('#tqBody .topt');
  await p.waitForTimeout(250);
  console.log('feedback:', (await p.textContent('#tqFb')).replace(/\s+/g, ' ').trim().slice(0, 100));
  console.log('correct marked:', await p.$$eval('#tqBody .topt.correct', els => els.length));
  await p.screenshot({ path: 'v_terms_fb.png' });
  await p.click('#tqAct .btn.primary');
  await p.waitForTimeout(200);
  console.log('counter:', await p.textContent('#transQuiz .meta > span:last-child'));
  console.log('overflow quiz:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));

  // freq spelling
  await p.evaluate(() => tRenderHome());
  await p.waitForTimeout(200);
  await p.locator('#transHome .tmod').nth(2).click();
  await p.waitForTimeout(200);
  // only keep spell: click other chips
  for (const t of ['dictation', 'cloze', 'c2e']) {
    await p.click('#tTypes .chip[data-t=' + t + ']');
  }
  await p.click('#transMod button.primary.block');
  await p.waitForTimeout(300);
  console.log('freq type:', await p.textContent('#transQuiz .pill'), 'has input:', await p.$('#tTyped') !== null);
  const before = await p.textContent('#transQuiz .meta > span:last-child');
  await p.fill('#tTyped', 'zzzz');
  await p.click('#tqBody button.primary');
  await p.waitForTimeout(1000);
  console.log('after submit counter:', await p.textContent('#transQuiz .meta > span:last-child'), 'before:', before);
  console.log('input disabled:', await p.$eval('#tTyped', e => e.disabled));
  console.log('spell fb:', (await p.textContent('#tqFb')).replace(/\s+/g, ' ').slice(0, 120));
  console.log('repair box:', await p.$('#tRepairIn') !== null);
  await p.screenshot({ path: 'v_spell_fb.png' });
  await p.click('#tqAct .btn.primary');
  await p.waitForTimeout(200);
  console.log('counter after continue:', await p.textContent('#transQuiz .meta > span:last-child'));

  // sentence checker
  const chk = await p.evaluate(() => {
    const w = { w: 'government', cn: '政府', col: ['the Chinese government'] };
    return {
      bad: useIssues('I is very like this government policy', w),
      good: useIssues('The government has made great efforts to protect the environment.', w)
    };
  });
  console.log('bad hard:', chk.bad.hard.map(i => i.label + ':' + i.msg));
  console.log('good hard:', chk.good.hard.length, 'soft:', chk.good.soft, 'tips:', chk.good.tips);

  // overflow in freq + module
  console.log('overflow freq quiz:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await p.evaluate(() => tRenderMod());
  await p.waitForTimeout(200);
  console.log('overflow mod:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await p.screenshot({ path: 'v_mod.png', fullPage: false });

  // 主题：场景 / 找不同
  await p.evaluate(() => { tRenderHome(); });
  await p.locator('#transHome .tmod').nth(1).click();
  await p.waitForTimeout(150);
  for (const t of ['c2e']) await p.click('#tTypes .chip[data-t=' + t + ']');
  await p.click('#transMod button.primary.block');
  await p.waitForTimeout(300);
  console.log('themes type:', await p.textContent('#transQuiz .pill'), 'scene block:', await p.$('#tqBody .tscene') !== null);
  await p.screenshot({ path: 'v_theme_q.png' });
  if (await p.$('#tqBody .topt')) await p.click('#tqBody .topt');
  await p.waitForTimeout(200);
  console.log('theme fb:', (await p.textContent('#tqFb')).replace(/\s+/g, ' ').slice(0, 90));

  // 轮末小结：两题
  await p.evaluate(() => { TUI.len = 2; tStart(); });
  await p.waitForTimeout(200);
  for (let k = 0; k < 2; k++) {
    const opt = await p.$('#tqBody .topt');
    if (opt) await opt.click(); else { await p.fill('#tTyped', 'x'); await p.click('#tqBody button.primary'); }
    await p.waitForTimeout(200);
    await p.click('#tqAct .btn.primary');
    await p.waitForTimeout(200);
  }
  console.log('summary:', (await p.textContent('#transSum')).replace(/\s+/g, ' ').slice(0, 120));
  console.log('overflow sum:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));

  // 阅读里的拼写题也停住
  await p.evaluate(() => {
    enabledTypes.length = 0; enabledTypes.push('spell');
    go('today'); startTest();
  });
  await p.waitForTimeout(400);
  console.log('reading type:', await p.textContent('#qType'), 'typed:', await p.$('#typed') !== null);
  if (await p.$('#typed')) {
    await p.fill('#typed', 'zzzz');
    await p.click('#qBody .btn.primary');
    await p.waitForTimeout(800);
    console.log('reading spell disabled:', await p.$eval('#typed', e => e.disabled), 'kbd:', (await p.textContent('#qActions')).indexOf('回车') >= 0);
    await p.screenshot({ path: 'v_reading_spell.png' });
  }

  console.log('console errors:', errs);
  await b.close();
})();
