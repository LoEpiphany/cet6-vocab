const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const errs = [];

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8766/index.html');
  await page.waitForTimeout(700);

  const m = await page.evaluate(() => ({
    innerWidth: innerWidth,
    docClient: document.documentElement.clientWidth,
    docScroll: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    onboard: getComputedStyle(document.getElementById('onboard')).display
  }));

  const over = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > W + 1) {
        out.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 40), right: Math.round(r.right), w: Math.round(r.width) });
      }
    });
    return out.slice(0, 12);
  });

  await page.screenshot({ path: 'shot_m_fresh.png' });
  console.log(JSON.stringify({ mobile: m, over, errs }, null, 1));

  const d = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await d.goto('http://127.0.0.1:8766/index.html');
  await d.waitForTimeout(700);
  await d.screenshot({ path: 'shot_d_fresh.png' });
  console.log('desktop shot ok, errs=', errs.length);

  await browser.close();
})();
