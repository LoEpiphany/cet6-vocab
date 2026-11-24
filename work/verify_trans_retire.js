const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EDGE, headless: true });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8766/index.html');
  await p.waitForTimeout(400);

  const out = await p.evaluate(() => {
    go('trans');
    const st = tState();
    st.m = 'terms';
    tRenderMod();
    const x = TITEMS.find(y => y.mods.length === 1 && y.mods[0] === 'terms');
    const r = tEnsure(x.id);
    r.b = 3; r.rc = 0; r.retired = 0; r.seen = 1; r.r = 3; r.due = today();
    save();

    // 第 1 次答对：升到 4 阶，还不够退休
    tStartIds([x.id]);
    tResolve(true, '', null, '');
    const one = { b: r.b, rc: r.rc, retired: r.retired, due: r.due };
    const fb1 = document.getElementById('tqFb').innerText;

    // 第 2 次答对：4 阶 + 连对 2 次 -> 退休
    tStartIds([x.id]);
    tResolve(true, '', null, '');
    const two = { b: r.b, rc: r.rc, retired: r.retired, due: r.due, label: tRec(x.id).retired ? '已退休' : '' };
    const fb2 = document.getElementById('tqFb').innerText;

    const poolHas = tPool().some(y => y.id === x.id);
    const stats = tStats();
    const itemCount = tItemsOf('terms').length;

    // 词库详情显示已退休
    tOpen(x.id);
    const detail = document.getElementById('sheetBox').innerText;

    // 答错一次：从退休区拉回，降档、当天重来
    tStartIds([x.id]);
    tResolve(false, '', null, '');
    const three = { b: r.b, rc: r.rc, retired: r.retired, due: r.due, lapses: r.x };
    const fb3 = document.getElementById('tqFb').innerText;

    return { id: x.id, en: x.en, one: one, fb1: fb1, two: two, fb2: fb2, poolHas: poolHas,
      statsRetired: stats.retired, statsMaster: stats.master, itemCount: itemCount,
      detailHasRetired: detail.indexOf('已退休') >= 0, three: three, fb3: fb3 };
  });
  console.log(JSON.stringify(out, null, 1));
  await p.screenshot({ path: 'v_trans_retire.png' });
  console.log('console errors:', errs);
  await b.close();
})();
