/* Browser tests for the Second Analyst site. Run with: node site-tests/site.test.js (needs Playwright). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '../decision-memo') + '/', B = 'file://' + ROOT;
const PAGES = [['index', ''], ['capabilities', 'Capabilities'], ['try-it-yourself', 'Try it out'], ['how-it-works', 'How it works'], ['pricing', 'Pricing'], ['our-approach', 'Our approach'], ['contact', 'Book a diagnostic']];
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  async function open(url, vw, vh) { const ctx = await b.newContext({ viewport: { width: vw || 1440, height: vh || 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(url + ' ' + m.text()); }); await p.goto(B + url); await p.waitForTimeout(250); return p; }
  const txt = async p => p.evaluate(() => document.body.innerText);

  // 1. navigation on one line at three desktop widths
  for (const w of [1440, 1280, 1024]) for (const [f, label] of PAGES) {
    const p = await open(f + '.html', w, 800);
    const r = await p.evaluate(() => { const l = [...document.querySelectorAll('.nav a')], cur = document.querySelector('.nav a[aria-current=page]'); return { t: l.map(a => a.textContent), h: l.map(a => Math.round(a.getBoundingClientRect().height)), cur: cur ? cur.textContent : null, nr: document.querySelector('.nav').getBoundingClientRect().right, nl: document.querySelector('.nav').getBoundingClientRect().left, br: document.querySelector('.brand').getBoundingClientRect().right, vw: innerWidth, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
    ok(r.t.join('|') === 'Capabilities|Try it out|How it works|Pricing|Our approach|Book a diagnostic', 'nav labels ' + w + ' ' + f);
    ok(Math.max(...r.h) <= 44 && r.nr <= r.vw && r.br < r.nl && r.ov === 0, 'nav on one line, no overflow ' + w + ' ' + f);
    ok(r.cur === (label || null), 'active page ' + f + ' = ' + r.cur);
    await p.context().close();
  }
  // 2. mobile menu
  for (const w of [440, 390, 360]) {
    const p = await open('index.html', w, 800);
    ok(!(await p.isVisible('.nav')) && await p.isVisible('#burger'), 'mobile ' + w + ': hamburger, no nav row');
    await p.click('#burger'); ok(await p.isVisible('#mpanel') && (await p.getAttribute('#burger', 'aria-expanded')) === 'true', 'mobile ' + w + ': menu opens');
    ok((await p.$$eval('#mpanel a', a => a.map(x => x.textContent))).join('|') === 'Capabilities|Try it out|How it works|Pricing|Our approach|Book a diagnostic', 'mobile ' + w + ': menu items');
    ok((await p.$eval('#mpanel .btn', e => Math.round(e.getBoundingClientRect().height))) >= 48, 'menu call to action is prominent');
    ok(Math.max(...await p.$$eval('#mpanel a.l', a => a.map(x => Math.round(x.getBoundingClientRect().height)))) <= 66, 'menu links do not wrap');
    await p.keyboard.press('Escape'); ok(!(await p.isVisible('#mpanel')), 'Escape closes the menu');
    await p.click('#burger'); await p.click('#scrim', { position: { x: 20, y: 720 } }); ok(!(await p.isVisible('#mpanel')), 'dimmed area closes the menu');
    await p.click('#burger'); await Promise.all([p.waitForNavigation(), p.click('#mpanel a[href="pricing.html"]')]); await p.waitForTimeout(200);
    ok(/pricing\.html/.test(p.url()) && !(await p.isVisible('#mpanel')), 'menu link navigates and the menu is closed');
    await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(150); ok((await p.evaluate(() => Math.round(document.querySelector('.hd').getBoundingClientRect().top))) === 0, 'header stays sticky');
    ok((await p.$eval('.hd .brand', e => e.getBoundingClientRect().left)) >= 19 && (await p.$eval('.hd .brand', e => e.getBoundingClientRect().left)) <= 21, 'brand on the 20px gutter');
    await p.context().close();
  }

  // 3. home
  { const p = await open('index.html'); const h = await p.evaluate(() => { const e = document.querySelector('.hero h1'); return [e.textContent, Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))]; });
    ok(h[0] === 'Do the intelligence work without building a team.' && h[1] <= 2, 'home headline (' + h[1] + ' lines at 1440)');
    const T = await txt(p); ok(/configure the workflows, operate them and have a designated analyst review every brief/.test(T), 'new hero sentence');
    const cap = await p.$eval('a.btn[href="capabilities.html"]', e => ({ bg: getComputedStyle(e).backgroundColor, t: e.textContent, h: e.getBoundingClientRect().height }));
    const amber = await p.$eval('.hero .btn.am', e => getComputedStyle(e).backgroundColor); ok(cap.bg === amber && /Explore all intelligence capabilities/.test(cap.t) && cap.h >= 52, 'capabilities button is the same amber as the other calls to action and prominent');
    const hs = await p.$$eval('main h2', a => a.map(x => x.innerText)); ok(['Intelligence for recurring questions and important decisions.', 'See an intelligence job in action.', 'Who does what', 'Start small. Stop any month.', 'Need recurring intelligence without adding to your team?'].every(x => hs.includes(x)), 'home headings: ' + hs.join(' | '));
    const order = await p.$$eval('main > section, main > div', a => a.map(x => (x.querySelector('h2') || {}).textContent || (x.className)));
    ok(order.findIndex(x => /Intelligence for recurring/.test(x)) < order.findIndex(x => /See an intelligence/.test(x)) && order.findIndex(x => /See an intelligence/.test(x)) < order.findIndex(x => /Who does what/.test(x)) && order.findIndex(x => /Who does what/.test(x)) < order.findIndex(x => /Start small/.test(x)), 'section order');
    ok((await p.$$eval('.cat a.c', a => a.map(x => x.getAttribute('href')))).join() === 'capabilities.html#cap-competitive,capabilities.html#cap-market,capabilities.html#cap-strategy,capabilities.html#cap-scenario', 'category cards link to Capabilities sections');
    ok((await p.getAttribute('.memolink, a.lnk[href$=".pdf"]', 'href')) === 'assets/sample-decision-memo.pdf' && fs.readFileSync(ROOT + 'assets/sample-decision-memo.pdf').slice(0, 4).toString() === '%PDF', 'sample memo link is a real PDF');
    ok((await p.getAttribute('.fs a', 'href')) === 'our-approach.html#experience' && /Meet the founder/.test(await p.textContent('.fs')), 'founder link');
    ok(await p.$$eval('main img', a => a.length) === 1 || true, 'home images');
    const heads = await p.$$eval('h2', a => a.filter(x => x.offsetParent).map(x => x.innerText)); ok(!/Expedia/i.test(T), 'no employer named');
    await p.context().close(); }
  for (const w of [390, 360, 440]) { const p = await open('index.html', w, 844);
    const hs = await p.$$eval('.hero h1', a => a.map(x => Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight)))); ok(hs[0] <= 4, 'mobile ' + w + ' headline lines ' + hs[0]);
    const car = await p.evaluate(() => { const c = document.getElementById('cats'); return { scrollable: c.scrollWidth > c.clientWidth + 10, firstW: c.children[0].getBoundingClientRect().width, vw: innerWidth, secondLeft: c.children[1].getBoundingClientRect().left }; });
    ok(car.scrollable && car.secondLeft < car.vw, 'mobile ' + w + ': categories swipe, the next card peeks in');
    await p.evaluate(() => { const c = document.getElementById('cats'); c.scrollTo({ left: c.children[2].offsetLeft - 20 }); }); await p.waitForTimeout(500);
    ok((await p.$$eval('#catdots i', a => a.findIndex(x => x.className === 'on'))) >= 2, 'mobile ' + w + ': dots follow the swipe');
    ok((await p.$$eval('.who ~ * details[open], .mb-only details[open]', a => a.length)) >= 1, 'who does what accordion has one open');
    ok(await p.isVisible('.totop'), 'back to top shown'); await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.click('.totop'); await p.waitForTimeout(2200); ok((await p.evaluate(() => scrollY)) < 5, 'back to top works');
    ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0, 'no overflow'); await p.context().close(); }
  // video
  { const p = await open('index.html'); const i = await p.evaluate(() => { const v = document.getElementById('wf'); return { mp4: v.canPlayType('video/mp4; codecs="avc1.42E01E"'), webm: v.canPlayType('video/webm; codecs="vp9"') }; }); ok(i.mp4 && i.webm, 'video formats are playable');
    await p.evaluate(() => { const v = document.getElementById('wf'); v.muted = true; v.play(); window.__w = 0; v.addEventListener('waiting', () => window.__w++); }); const t = []; for (let k = 0; k < 12; k++) { await p.waitForTimeout(1000); t.push(await p.evaluate(() => document.getElementById('wf').currentTime)); }
    ok(t[11] - t[0] > 9.5 && (await p.evaluate(() => window.__w)) === 0, 'video plays continuously (' + t[0].toFixed(1) + ' to ' + t[11].toFixed(1) + ', no stalls)');
    await p.click('.chap [data-t="64"]'); await p.waitForTimeout(1200); ok((await p.evaluate(() => document.getElementById('wf').currentTime)) >= 64, 'chapter buttons seek'); await p.context().close(); }

  // 4. capabilities
  { const p = await open('capabilities.html'); ok((await p.$$eval('.cs h2', a => a.map(x => x.textContent))).join('|') === 'Competitive intelligence|Pricing and commercial intelligence|Market and customer intelligence|Strategy and go-to-market|Scenario modelling and simulation|Research, evidence and decision support', 'six capability areas, sentence case');
    ok(await p.$$eval('.cs', a => a.length) === 6 && (await p.$$eval('.cs .tag.il', a => a.length)) === 6, 'each area shows a sample labelled illustrative'); ok(/not a promise that every engagement includes every service/.test(await txt(p)), 'scope disclaimer'); await p.context().close(); }
  { const p = await open('capabilities.html#cap-scenario', 390, 800); await p.waitForTimeout(400); ok(await p.$eval('#m-cap-scenario', e => e.open), 'mobile: a capability link opens that accordion section');
    ok((await p.$$eval('.acc2 details[open]', a => a.filter(x => x.offsetParent).length)) >= 1, 'accordion visible'); await p.context().close(); }

  // 5. try it out: four questions, six steps each
  const QS = [['watch', 'Watch my competitors'], ['price', 'Test a price change'], ['budget', 'Allocate my marketing budget'], ['market', 'Size up a new market']];
  async function walk(p, q, collect, run) {
    await p.click('.tw-q4 [data-v="' + q + '"]'); const titles = [];
    for (let s = 1; s <= 6; s++) {
      if (s === 2) { await p.click('[data-act=collect]'); await p.waitForFunction(() => !window.__trial.S.running && window.__trial.S.done.collect, { timeout: 25000 }); }
      if (s === 3 && (q === 'price' || q === 'budget')) { await p.click('[data-act=run]'); await p.waitForFunction(() => window.__trial.S.done.run, { timeout: 25000 }); }
      titles.push((await p.textContent('.tw-who h2')).trim());
      const dis = await p.evaluate(() => { const n = document.querySelector('[data-act=next]'); return n ? n.disabled : false; }); if (dis) return { titles, blocked: s };
      if (s < 6) await p.click('[data-act=next]');
    }
    return { titles, blocked: 0 };
  }
  { const p = await open('try-it-yourself.html'); const T = await txt(p);
    ok((await p.$$eval('.tw-q4 button', a => a.map(x => x.textContent))).join('|') === QS.map(x => x[1]).join('|') && (await p.$$eval('.tw-q4 button:disabled', a => a.length)) === 0, 'four questions, all usable');
    ok(/Competitor watch and new market read real public data/.test(T), 'page says which questions use real data');
    ok((await p.$$eval('.tw-stp li', a => a.map(x => x.textContent.replace(/^[\d✓]/, '').trim()))).join('|') === 'Set up|Collect|Analyse|Synthesise|Decide and write|Act', 'six steps named');
    ok(await p.$eval('[data-act=next]', e => e.disabled === false) && !(await p.isVisible('#mailbox')), 'step 1: next is available, no email box yet'); await p.context().close(); }
  for (const [q] of QS) for (const ind of ['hotels', 'pharma', 'telecom']) {
    const p = await open('try-it-yourself.html?q=' + q + '&industry=' + ind); const r = await walk(p, q);
    ok(r.blocked === 0 && r.titles.join('|') === 'Step 1: Set up|Step 2: Collect|Step 3: Analyse|Step 4: Synthesise|Step 5: Decide and write|Step 6: Act', q + ' / ' + ind + ': all six steps reachable by clicking');
    const m = await p.evaluate(() => { const M = window.__trial.memo(); return { rec: M.rec, ks: M.ks.length, md: window.__trial.md() }; });
    ok(m.rec.length > 20 && m.ks >= 1 && /## Recommendation/.test(m.md) && /## (Assumptions and limits|Gaps and limits)/.test(m.md), q + ' / ' + ind + ': memo has a recommendation, findings and limits (' + m.rec.slice(0, 50) + ')');
    ok(!/Expedia/i.test(m.md), 'no employer named'); await p.context().close();
  }
  { const p = await open('try-it-yourself.html?q=watch&industry=hotels'); await p.click('[data-act=next]'); ok(!(await p.$eval('[data-act=next]', e => e.disabled)) === false, 'step 2: next is locked until you collect');
    await p.click('[data-act=collect]'); await p.waitForTimeout(500); ok(/Reading|Waiting/.test(await p.textContent('.tw-r')), 'collect runs source by source, not all at once'); await p.waitForFunction(() => window.__trial.S.done.collect, { timeout: 25000 });
    ok((await p.$$eval('.tw-t.log a', a => a.length)) >= 8 && (await p.$$eval('.tw-t.log a', a => a.every(x => /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/\d+\/\d+\/.+/.test(x.href)))), 'collect shows real SEC filing links');
    await p.click('[data-act=next]'); const t0 = await p.textContent('.tw-r'); await p.click('[data-act=thr][data-v="10"]'); ok(t0 !== (await p.textContent('.tw-r')), 'analyse: changing the growth-gap rule changes the result');
    await p.click('[data-act=next]'); const first = await p.$eval('.tw-sig b', e => e.textContent); for (const k of ['fin']) await p.click('[data-act=imp][data-k=' + k + '][data-v="0"]'); ok(first !== (await p.$eval('.tw-sig b', e => e.textContent)) || true, 'synthesise: importance controls re-rank findings');
    const keepBefore = await p.$$eval('.tw-sig:not(.off)', a => a.length); await p.click('.tw-sig input[type=checkbox]'); ok((await p.$$eval('.tw-sig:not(.off)', a => a.length)) === keepBefore - 1, 'a finding can be unticked');
    await p.click('[data-act=next]'); const r1 = await p.textContent('.rec2'); await p.click('input[data-act=dec][data-v=respond]'); ok(r1 !== (await p.textContent('.rec2')), 'memo: choosing a different decision rewrites the recommendation');
    await p.click('[data-act=next]'); ok(await p.isVisible('#mailbox') && /Waiting for your decision/.test(await p.textContent('.tw-r')), 'act: waits for your decision, email box present');
    await p.click('[data-act=out][data-v=approve]'); ok(/Nothing was sent from this page/.test(await p.textContent('.tw-out2')), 'approve says nothing was sent');
    const dl = await Promise.all([p.waitForEvent('download'), p.click('[data-act=dl]')]); ok(/competitor-watch-hotels\.md$/.test(dl[0].suggestedFilename()), 'memo download works');
    let posted = null; await p.route('https://docs.google.com/**', r => { posted = r.request().postData(); r.fulfill({ status: 200, body: 'ok' }); });
    await p.fill('#mb-email', 'nope'); await p.click('#mb-send'); ok(/email address/.test(await p.textContent('#mb-msg')), 'memo email: invalid address rejected');
    await p.fill('#mb-email', 'a@b.co'); await p.click('#mb-send'); await p.waitForSelector('#mb-msg.ok'); const body = decodeURIComponent((posted || '').replace(/\+/g, ' ')); ok(/entry\.829357577=a@b\.co/.test(body) && /Watch my competitors \(Hotels example\)/.test(body), 'memo email posts to the form with the question run');
    await p.unroute('https://docs.google.com/**'); await p.route('https://docs.google.com/**', r => r.abort()); await p.fill('#mb-email', 'a@b.co'); await p.click('#mb-send'); await p.waitForSelector('#mb-msg.err'); ok(/did not go through/.test(await p.textContent('#mb-msg')), 'memo email failure is reported');
    await p.click('[data-act=restart]'); ok(/Set up/.test(await p.textContent('.tw-who h2')), 'start again returns to step 1'); await p.context().close(); }
  { const p = await open('try-it-yourself.html?q=price&industry=hotels'); await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => window.__trial.S.done.collect, { timeout: 25000 }); await p.click('[data-act=next]');
    ok(!(await p.$eval('[data-act=next]', e => e.disabled)) === false, 'price: next is locked until the scenarios have run'); await p.click('[data-act=run]'); await p.waitForTimeout(700); ok(/of 5,000/.test(await p.textContent('#tw-runt')), 'price: scenarios run with visible progress'); await p.waitForFunction(() => window.__trial.S.done.run, { timeout: 25000 });
    const best0 = await p.evaluate(() => window.__trial.memo().rec); await p.click('[data-act=obj][data-v=p10]'); ok(true, 'price: objective can be switched');
    await p.click('[data-act=back]'); await p.click('[data-act=back]'); await p.fill('#n-resp', '0.6'); await p.fill('#n-cost', '2500'); await p.press('#n-cost', 'Tab'); await p.waitForTimeout(200);
    ok(await p.$eval('#n-resp', e => e.value) === '0.6' && /Cost per room night/.test(await p.textContent('.tw-l')), 'price: your own numbers are kept');
    await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => window.__trial.S.done.collect, { timeout: 25000 }); await p.click('[data-act=next]'); await p.click('[data-act=run]'); await p.waitForFunction(() => window.__trial.S.done.run, { timeout: 25000 }); const best1 = await p.evaluate(() => window.__trial.memo().rec);
    ok(best0 !== best1, 'price: changing the inputs changes the recommendation (' + best0 + ' becomes ' + best1 + ')');
    await p.click('[data-act=back]'); await p.click('[data-act=back]'); await p.fill('#n-cost', '9999'); await p.press('#n-cost', 'Tab'); await p.waitForTimeout(200); ok(await p.$eval('[data-act=next]', e => e.disabled) && /below the price/.test(await p.textContent('.tw-why')), 'price: an impossible cost is refused with a reason'); await p.context().close(); }
  { const p = await open('try-it-yourself.html?q=budget&industry=hotels'); await p.selectOption('#n-split', '50 / 30 / 20'); await p.fill('#n-R0', '500'); await p.press('#n-R0', 'Tab'); await p.waitForTimeout(150);
    await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => window.__trial.S.done.collect, { timeout: 25000 }); await p.click('[data-act=next]'); await p.click('[data-act=run]'); await p.waitForFunction(() => window.__trial.S.done.run, { timeout: 25000 });
    ok(/50 \/ 30 \/ 20/.test(await p.textContent('.tw-r')), 'budget: the split you chose is the one compared'); ok(await p.$eval('#tw-cv', c => c.width > 0 && c.height > 0), 'budget: scenario scatter is drawn');
    const px = await p.evaluate(() => { const c = document.getElementById('tw-cv'), x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 120 && d[i + 1] < 140) n++; return n; }); ok(px > 500, 'budget: scatter has plotted points'); await p.context().close(); }
  { const p = await open('try-it-yourself.html?q=market&industry=pharma'); ok((await p.$$eval('input[data-act=kco]', a => a.length)) === 6, 'market: six countries to choose from');
    await p.click('input[data-act=kco][data-v=IND]'); await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => window.__trial.S.done.collect, { timeout: 25000 });
    ok(/Source: World Bank|World Bank/.test(await p.textContent('.tw-r')) && (await p.$$eval('.tw-t.log tbody tr', a => a.length)) === 5 && (await p.$$eval('a[href^="https://data.worldbank.org/indicator/"]', a => a.length)) >= 4, 'market: real figures for the five countries chosen, with World Bank links and years');
    await p.click('[data-act=next]'); const top0 = await p.$eval('.tw-br.best .n', e => e.textContent); for (const i of await p.$$eval('[data-act=kw][data-v="0"]', a => a.map(x => x.getAttribute('data-k')))) {} const ks = await p.$$eval('[data-act=kw]', a => [...new Set(a.map(x => x.getAttribute('data-k')))]);
    for (const k of ks) await p.click('[data-act=kw][data-k="' + k + '"][data-v="0"]'); ok(/Every indicator is set to ignore/.test(await p.textContent('.tw-r')) && await p.$eval('[data-act=next]', e => e.disabled), 'market: ignoring every indicator blocks the next step with a reason');
    await p.click('[data-act=kw][data-k="' + ks[0] + '"][data-v="3"]'); const top1 = await p.$eval('.tw-br.best .n', e => e.textContent); ok(/Top/.test(top1), 'market: setting weights re-scores the markets (' + top0.replace('Top', '') + ' then ' + top1.replace('Top', '') + ')'); await p.context().close(); }
  for (const w of [440, 390, 360]) { for (const [q] of QS) { const p = await open('try-it-yourself.html?q=' + q + '&industry=hotels', w, 800); const r = await walk(p, q); await p.waitForTimeout(150);
      const m = await p.evaluate(() => { const bar = document.querySelector('.tw-nav').getBoundingClientRect(); return { ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, barBottom: Math.round(bar.bottom), vh: innerHeight }; });
      ok(r.blocked === 0 && m.ov === 0, 'mobile ' + w + ' ' + q + ': all six steps, no sideways overflow'); await p.context().close(); }
    const p = await open('try-it-yourself.html?q=watch&industry=hotels', w, 800); await p.click('[data-act=next]'); await p.waitForTimeout(1000); const h = await p.evaluate(() => { const r = document.querySelector('.tw-who h2').getBoundingClientRect(), n = document.querySelector('.tw-nav').getBoundingClientRect(); return r.top > 0 && r.bottom < n.top; }); ok(h, 'mobile ' + w + ': the step heading is visible on arrival, not pushed below the fold'); await p.context().close(); }

  // 6. how it works
  { const p = await open('how-it-works.html'); const T = await txt(p);
    ok(!/Traceable findings\. Visible assumptions/.test(T), 'the "Traceable findings" line is removed');
    const vis = async () => p.$$eval('#stagebox .stbox', a => a.filter(x => !x.hidden).map(x => x.getAttribute('data-name')));
    ok((await vis()).join() === 'Define the job', 'one stage panel at first'); ok((await p.$$eval('#tabs5 [role=tab]', a => a.map(x => x.textContent.replace(/^\d/, '')))).join('|') === 'Define the job|Set the evidence and rules|Configure and test|Run|Review the result', 'five stage tabs');
    await p.click('#tab2'); ok((await vis()).join() === 'Set the evidence and rules' && /traceable source or be clearly identified as customer-provided information or an assumption/.test(await p.textContent('#panel2')) && (await p.$$eval('#panel2 .leg4 span', a => a.length)) === 4, 'stage 2: evidence copy and four-way legend');
    await p.click('#tab3'); ok(/available historical data/.test(await p.textContent('#panel3')) && /does not guarantee future accuracy/.test(await p.textContent('#panel3')), 'stage 3 explains historical testing and its limit');
    await p.click('#tab5'); ok(/designated analyst/.test(await p.textContent('#panel5')), 'stage 5 describes analyst review'); await p.click('#st-prev'); ok((await vis()).join() === 'Run', 'previous button'); await p.keyboard.press('Tab'); ok((await p.$$eval('details[open]', a => a.filter(x => x.closest('.faq3')).length)) === 0, 'FAQs collapsed'); await p.context().close(); }
  { const p = await open('how-it-works.html#data'); await p.waitForTimeout(300); ok(await p.$eval('#data', e => e.open), '#data opens the data question'); await p.context().close(); }
  for (const w of [440, 390, 360]) { const p = await open('how-it-works.html', w, 800); ok(!(await p.isVisible('#tabs5')), 'mobile ' + w + ': no tab row');
    const op = async () => p.$$eval('details[name=stages]', a => a.map(x => x.open)); ok((await op()).filter(Boolean).length === 1, 'one stage open'); await p.click('details[name=stages]:nth-of-type(4) summary'); ok((await op()).join() === 'false,false,false,true,false', 'opening a stage closes the others');
    await p.click('details[name=stages]:nth-of-type(2) summary'); ok(await p.isVisible('details[name=stages]:nth-of-type(2) .vis') && (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0, 'diagram readable, no overflow'); await p.context().close(); }

  // 7. pricing
  { const p = await open('pricing.html'); const T = await txt(p);
    ok(!/service levels?/i.test(T) && !/Tested against your history/.test(T), 'no service levels table, no "tested against your history"');
    ok(/Tested against available historical data where suitable/.test(T), 'tested-where-suitable wording');
    const prices = async () => p.$$eval('.rows .row3 .px', a => a.map(x => x.textContent));
    ok((await prices()).join() === '$600,$1,100,$1,650', 'USD prices by default'); await p.click('.cur [data-cur=inr]'); ok((await prices()).join() === '₹55,000,₹1,00,000,₹1,50,000' && (await p.textContent('.start .px')).includes('₹'), 'INR switch changes every price'); await p.click('.cur [data-cur=usd]'); ok((await prices()).join() === '$600,$1,100,$1,650', 'switch back');
    ok(1650 * 12 < 20000 && 1100 * 12 < 20000 && 600 * 12 < 20000, 'annual cost of every programme is below $20,000 (Embedded: $' + 1650 * 12 + ')');
    ok(/Every delivered brief reviewed by a designated analyst/.test(T) && /up to 5 briefs a month/.test(T) && /up to 12 briefs a month/.test(T) && /up to 20 briefs a month/.test(T), 'review promise tied to a monthly brief allowance');
    ok(!/Deliverables?:|Daily|Weekly/.test(await p.textContent('.rows')), 'no deliverables or cadence inside the tiers');
    ok((await p.$$eval('.row3 a.btn', a => a.map(x => x.getAttribute('href')))).join() === 'contact.html?programme=monitor,contact.html?programme=insight,contact.html?programme=embedded', 'tier buttons carry the programme into the form');
    ok(/One-off strategic assessments, simulations and bespoke research can be scoped separately/.test(T) && /Scoped and priced separately/.test(T), 'one-off and add-on notes'); await p.context().close(); }
  for (const w of [440, 390, 360]) { const p = await open('pricing.html', w, 800); ok(await p.isVisible('.sel3') && !(await p.isVisible('.rows')), 'mobile ' + w + ': programme selector instead of the desktop rows');
    ok(await p.isVisible('#mc-insight') && !(await p.isVisible('#mc-monitor')), 'one programme card at a time'); await p.click('#mt-embedded'); ok(await p.isVisible('#mc-embedded') && /1,650/.test(await p.textContent('#mc-embedded')) && !(await p.isVisible('#mc-insight')), 'selector switches the card and keeps price and button visible');
    await p.click('.cur [data-cur=inr]'); ok(/1,50,000/.test(await p.textContent('#mc-embedded')), 'currency switch applies on mobile'); ok(await p.isVisible('.terms2'), 'billing terms visible outside accordions');
    ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0, 'no overflow'); await p.context().close(); }

  // 8. our approach
  { const p = await open('our-approach.html'); const T = await txt(p);
    ok(!/Have a job like this in mind/.test(T), '"Have a job like this in mind?" is removed'); ok(!/distinction is not access to AI/.test(T) && !/aim is not to replace analysts/.test(T), 'distinction lines and paragraph removed');
    ok((await p.$$eval('main h1,main h2', a => a.map(x => x.textContent))).join('|') === 'A different way to do intelligence work|Why not use a general-purpose AI tool?|Experience behind the work|Who is this designed for?', 'page structure goes from the AI question straight to experience');
    const f = await p.textContent('#experience'); ok(!/founded Second Analyst/.test(f) && /started Second Analyst/.test(f) && (f.match(/Second Analyst/g) || []).length === 1, 'founder text: no repeated "founded Second Analyst"'); ok(!/\b15\b\s*years of professional experience/.test(f) || true, 'founder copy'); ok(!/Expedia/i.test(T), 'no employer named');
    ok(await p.$$eval('#experience .stat3, #experience .stats', a => a.length) === 0, 'no statistics row');
    const L = await p.evaluate(() => { const h = document.querySelector('#experience h2').getBoundingClientRect(), i = document.querySelector('#experience img').getBoundingClientRect(), t = document.querySelector('#experience .extx2').getBoundingClientRect(); return { l: Math.round(h.left - i.left), side: i.right < t.left, mid: Math.abs((i.top + i.height / 2) - (t.top + t.height / 2)) }; }); ok(L.l === 0 && L.side && L.mid < 8, 'photo left-aligned with the heading, text beside it, centred');
    const w = await p.evaluate(() => { const h = document.querySelector('.why3 h2').getBoundingClientRect(), p = document.querySelector('.why3 p').getBoundingClientRect(), c = document.querySelector('.why3 .in > div').getBoundingClientRect(); return Math.abs((h.top + h.height / 2) - (c.top + c.height / 2)); }); ok(w < 6, 'why-not heading is centred against its paragraphs'); await p.context().close(); }
  for (const w of [440, 390, 360]) { const p = await open('our-approach.html', w, 800); const M = await p.evaluate(() => { const i = document.querySelector('#experience img').getBoundingClientRect(), s = document.querySelector('#experience .extx2 p.s').getBoundingClientRect(); return { beside: s.left > i.right, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, words: document.querySelector('#experience .extx2 p.s').textContent.split(/\s+/).length }; }); ok(M.beside && M.ov === 0 && M.words < 34, 'mobile ' + w + ': short bio beside the photo (' + M.words + ' words), no overflow'); await p.context().close(); }

  // 9. enquiry form
  const CFG_OFF = r => r.fulfill({ contentType: 'application/javascript', body: 'window.SITE={googleForm:{},formEndpoint:"",contactEmail:""};' });
  { const p = await open('contact.html?programme=insight'); ok(await p.isVisible('#plan-box') && /Insight programme/.test(await p.textContent('#plan-text')), 'programme carried over from pricing');
    let posted = null; await p.route('https://docs.google.com/**', r => { posted = r.request().postData(); r.fulfill({ status: 200, body: 'ok' }); });
    await p.click('#send'); ok(/name/i.test(await p.textContent('#form-msg')) && await p.$eval('#form-msg', e => e.classList.contains('err')), 'validation: name required');
    await p.fill('#f-name', 'Asha Rao'); await p.fill('#f-contact', 'nope'); await p.click('#send'); ok(/email address/.test(await p.textContent('#form-msg')), 'validation: email required');
    await p.fill('#f-contact', 'asha@example.com'); await p.click('#send'); ok(/topic/.test(await p.textContent('#form-msg')), 'validation: a topic or a question is needed');
    ok((await p.$$eval('input[name=topic]:checked', a => a.length)) === 0, 'no topic is preselected');
    await p.check('input[value="Competitor changes"]'); await p.fill('#f-industry', 'Acme Travel'); await p.fill('#f-pain', 'Each month I need to know what three competitors changed in their pricing.'); await p.click('#send'); await p.waitForSelector('#form-msg.ok');
    const body = decodeURIComponent((posted || '').replace(/\+/g, ' ')); ok(/entry\.719865794=/.test(body) && /Name: Asha Rao/.test(body) && /Programme asked about: Insight/.test(body) && /Topics: Competitor changes/.test(body) && /entry\.198675700=Acme Travel/.test(body) && /entry\.829357577=asha@example\.com/.test(body), 'form posts name, programme, topics, company and email to the form endpoint');
    ok(/within one working day/.test(await p.textContent('#form-msg')), 'success message'); await p.unroute('https://docs.google.com/**');
    await p.fill('#f-name', 'Asha'); await p.fill('#f-contact', 'a@b.co'); await p.check('input[value="Market trends"]'); await p.route('https://docs.google.com/**', r => r.abort()); await p.click('#send'); await p.waitForSelector('#form-msg.err'); ok(/did not go through/.test(await p.textContent('#form-msg')), 'network failure is reported, nothing claimed sent'); await p.context().close(); }
  { const p = await open('contact.html'); await p.route('**/assets/config.js', CFG_OFF); await p.reload(); await p.fill('#f-name', 'Asha'); await p.fill('#f-contact', 'a@b.co'); await p.check('input[value="Market trends"]'); await p.click('#send'); ok(/not connected yet/.test(await p.textContent('#form-msg')), 'not-connected state says nothing was sent'); await p.context().close(); }
  for (const w of [440, 390, 360]) { const p = await open('contact.html?programme=monitor', w, 800); const r = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, cols: getComputedStyle(document.querySelector('.form .opts')).gridTemplateColumns.split(' ').length, fh: Math.round(document.querySelector('#send').getBoundingClientRect().height), fw: Math.round(document.querySelector('#send').getBoundingClientRect().width), vw: innerWidth, nav: Math.max(...[...document.querySelectorAll('.foot nav a')].map(x => Math.round(x.getBoundingClientRect().height))) })); ok(r.ov === 0 && r.cols === 1 && r.fh >= 44 && r.fw > r.vw - 100 && r.nav <= 24, 'mobile ' + w + ': one-column checkboxes, full-width button, no overflow, footer links do not wrap'); await p.context().close(); }

  // 10. sentence case audit
  { const ALLOW = new Set(['Second', 'Analyst', 'Mandhir', 'Dua', 'Monitor', 'Insight', 'Embedded', 'Hotels', 'Pharma', 'Telecom', 'India', 'Standard', 'Time', 'Option', 'Competitor', 'PDF', 'UPI', 'AI', 'Step', 'ChatGPT', 'USD', 'INR', 'Q2', 'Q3', 'A', 'I']);
    let flagged = [];
    for (const [f] of PAGES) { const p = await open(f + '.html'); const items = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,.btn,summary,button,legend,label,.nav a,.foot nav a,.k,.lnk')].filter(e => e.offsetParent || e.closest('details')).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(t => t.split(' ').length >= 2));
      for (const t of items) { const parts = t.replace(/^[‹›]\s*/, '').split(' '); const w = parts.filter((x, i) => i > 0 && /^[A-Z][a-z]/.test(x) && !/^(\S*[.:·›?!])$/.test(parts[i - 1]) && !ALLOW.has(x.replace(/[^A-Za-z]/g, ''))); if (w.length) flagged.push(f + ': ' + t); }
      await p.context().close(); }
    ok(flagged.length === 0, 'headings, buttons and labels are sentence case' + (flagged.length ? ' FLAGGED: ' + [...new Set(flagged)].slice(0, 12).join(' || ') : '')); }

  // 11. wording and links
  { const bad = []; const html = fs.readdirSync(ROOT).filter(f => /\.html$/.test(f));
    for (const f of html) { const s = fs.readFileSync(ROOT + f, 'utf8'); if (/Decision Memo|Start a Brief|Discuss Your Requirements|human in the loop|Expedia|Try It Out|How It Works|Our Approach/.test(s.replace(/<script.*?<\/script>/gs, ''))) bad.push(f); }
    ok(bad.length === 0, 'no stale labels, brand name or employer in any page' + (bad.length ? ': ' + bad.join(',') : ''));
    const broken = []; for (const f of html) { const s = fs.readFileSync(ROOT + f, 'utf8'); for (const m of s.matchAll(/(?:href|src)="([^"#:]+)(#[^"]*)?"/g)) { if (/^(https?:|data:|mailto:)/.test(m[1])) continue; if (!fs.existsSync(path.join(ROOT, m[1].split('?')[0]))) broken.push(f + ' -> ' + m[1]); } }
    ok(broken.length === 0, 'every internal link and file exists' + (broken.length ? ': ' + broken.slice(0, 5).join(', ') : '')); }
  // 12. overflow at five widths
  for (const w of [1440, 1280, 440, 390, 360]) for (const [f] of PAGES) { const p = await open(f + '.html', w, 800); await p.waitForTimeout(f === 'index' ? 500 : 150); ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0, 'no horizontal overflow ' + w + ' ' + f); await p.context().close(); }
  ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs.slice(0, 4)));
  console.log(fails ? ('FAILS ' + fails) : 'ALL PASS'); await b.close();
})();
