const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));

  await page.goto('http://127.0.0.1:8766/index.html');
  await page.waitForTimeout(500);

  // 1) 计划页热力图
  await page.evaluate(() => go('plan'));
  await page.waitForTimeout(300);
  const plan = await page.evaluate(() => ({
    cells: document.querySelectorAll('#heat i').length,
    legend: !!document.querySelector('.heatlegend'),
    note: document.getElementById('heatNote').textContent
  }));
  await page.screenshot({ path: 'shot_m_plan.png' });

  // 2) 错题本空状态
  await page.evaluate(() => go('wrong'));
  await page.waitForTimeout(200);
  const empty = await page.evaluate(() => ({
    wrong: document.getElementById('wrongList').innerText.trim(),
    fuzzy: document.getElementById('fuzzyList').innerText.trim()
  }));

  // 3) 无例句词的题型过滤
  const caps = await page.evaluate(() => {
    const w = DATA.words.find(x => x.courses.length === 1 && !x.ex);
    Q = { types: ['e2c', 'spell', 'cloze', 'build', 'use', 'read', 'confusable', 'context', 'listen'] };
    return { word: w.w, caps: capTypes(w) };
  });

  // 4) 第二册故事页提示
  await page.evaluate(() => { S.course = 'c2'; save(); renderHome(); go('story'); });
  await page.waitForTimeout(200);
  const storyNote = await page.evaluate(() => document.querySelector('#storyList .note') ? document.querySelector('#storyList .note').textContent : '');

  // 5) 手机答题页
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /开始今日带练/ }).first().click();
  await page.waitForTimeout(500);
  const quiz = await page.evaluate(() => ({
    type: document.getElementById('qType').textContent,
    pos: document.getElementById('qPos').textContent,
    counter: document.getElementById('qCounter').textContent,
    bodyLen: document.getElementById('qBody').innerText.trim().length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  await page.screenshot({ path: 'shot_m_quiz.png' });

  console.log(JSON.stringify({ plan, empty, caps, storyNote, quiz, errs }, null, 1));
  await browser.close();
})();
