const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8766/index.html');
  await page.waitForTimeout(500);

  const views = ['home', 'card', 'test', 'story', 'wrong', 'lib', 'plan'];
  const widths = {};
  for (const v of views) {
    await page.evaluate(x => go(x), v);
    await page.waitForTimeout(250);
    widths[v] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }
  await page.evaluate(() => go('plan'));
  await page.evaluate(() => document.getElementById('heat').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shot_m_heat.png' });

  // 手册
  const man = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  man.on('pageerror', e => errs.push('manual:' + String(e)));
  await man.goto('http://127.0.0.1:8766/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C.html');
  await man.waitForTimeout(500);
  const minfo = await man.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    has2089: document.body.innerText.includes('2089'),
    hasTwoCourses: document.body.innerText.includes('两门课怎么排'),
    planSum: (() => {
      const t = document.querySelectorAll('table');
      return t.length;
    })(),
    backLink: document.querySelector('footer a') ? document.querySelector('footer a').getAttribute('href') : ''
  }));
  await man.screenshot({ path: 'shot_m_manual.png' });

  console.log(JSON.stringify({ widths, minfo, errs }, null, 1));
  await browser.close();
})();
