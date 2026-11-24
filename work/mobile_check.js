const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const out = 'c:\\Users\\Lenovo\\Desktop\\关于六级\\2026-11-23\\cet6-vocab\\work\\shots';
  require('fs').mkdirSync(out, { recursive: true });
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForTimeout(500);
  const m1 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bodySw: document.body.scrollWidth }));
  await page.screenshot({ path: out + '\\m_home.png', fullPage: true });

  // 进入自测并开始
  await page.click('nav.tabbar button[data-v="test"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: out + '\\m_setup.png', fullPage: true });
  await page.click('#testSetup .btn.primary');
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + '\\m_quiz.png', fullPage: true });
  const m2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

  // 故事页
  await page.click('nav.tabbar button[data-v="story"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: out + '\\m_story.png', fullPage: true });

  // 计划页
  await page.click('nav.tabbar button[data-v="plan"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: out + '\\m_plan.png', fullPage: true });
  const m3 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

  // 手册
  await page.goto('http://127.0.0.1:8765/%E5%AD%A6%E4%B9%A0%E6%89%8B%E5%86%8C.html');
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + '\\m_manual.png', fullPage: false });
  const m4 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

  console.log(JSON.stringify({ home: m1, quiz: m2, plan: m3, manual: m4 }, null, 1));
  await browser.close();
})();
