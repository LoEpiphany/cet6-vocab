const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/index.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(500);

  // 脑力游戏不打断答题，答完再弹
  const guard = await p.evaluate(() => {
    go('test'); enabledTypes.length = 0; enabledTypes.push('e2c'); startSession('all', 1, 3);
    brainAt = Date.now() - 21 * 60 * 1000; brainCheck();
    const during = document.getElementById('brainModal').classList.contains('on');
    Q.i = Q.ids.length; finish(); brainCheck();
    return { during, after: document.getElementById('brainModal').classList.contains('on'), pending: brainPending };
  });
  await p.evaluate(() => closeBrain());
  const closed = await p.evaluate(() => !document.getElementById('brainModal').classList.contains('on'));
  console.log('brain guard:', JSON.stringify({ guard, closed }));

  // 翻译选项释义
  const tg = await p.evaluate(() => {
    go('trans'); tState().m = 'terms'; tRenderMod(); TUI.types = ['e2c']; TUI.len = 1;
    const x = TITEMS.find(y => y.mods.indexOf('terms') >= 0);
    tStartIds([x.id]);
    return x.id;
  });
  await p.waitForTimeout(300);
  await p.click('#tqBody .topt');
  await p.waitForTimeout(300);
  const transGloss = await p.evaluate(() => {
    const t = document.getElementById('tqFb').innerText;
    return { has: t.indexOf('每个选项的意思') >= 0, sample: t.replace(/\s+/g, ' ').slice(0, 130) };
  });
  console.log('trans gloss:', JSON.stringify(transGloss));

  // 手动熟的收藏词不进任何练习池
  const favManual = await p.evaluate(() => {
    const w = WORDS.find(y => y.w.length > 5);
    const r = ensure(w.id); r.mm = 1; r.fav = 1; r.seen = 1; save();
    return { inAll: poolOf('all').some(y => y.id === w.id), inFav: poolOf('fav').some(y => y.id === w.id) };
  });
  console.log('fav manual excluded:', JSON.stringify(favManual));

  // 翻译拼写大小写
  const caseTest = await p.evaluate(() => {
    go('trans'); tState().m = 'freq'; tRenderMod(); TUI.types = ['spell']; TUI.len = 1;
    const x = TITEMS.find(y => y.mods.indexOf('freq') >= 0 && y.en.indexOf('/') < 0 && y.en.length > 3);
    tStartIds([x.id]);
    return { en: x.en };
  });
  await p.waitForTimeout(300);
  if (await p.evaluate(() => !!document.getElementById('tTyped'))) {
    await p.fill('#tTyped', caseTest.en.toUpperCase());
    await p.click('#tqBody button.primary');
    await p.waitForTimeout(300);
  }
  const caseRes = await p.evaluate(() => ({ ok: !!document.querySelector('#tqFb .fb.ok'), txt: document.getElementById('tqFb').innerText.replace(/\s+/g, ' ').slice(0, 60) }));
  console.log('trans case:', JSON.stringify({ caseTest, caseRes }));

  // 手机无溢出
  const ovs = {};
  for (const v of ['today', 'card', 'test', 'vocab', 'story', 'plan', 'trans']) {
    await p.evaluate(vv => go(vv), v);
    await p.waitForTimeout(150);
    ovs[v] = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }
  console.log('overflow:', JSON.stringify(ovs));
  console.log('errors:', errs);
  await b.close();
})();
