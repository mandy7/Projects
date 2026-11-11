/* Browser tests for the Second Analyst site. Run with: node site-tests/site.test.js (needs Playwright). */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '../decision-memo') + '/', B = 'file://' + ROOT;
const PAGES = [['index', ''], ['capabilities', 'Capabilities'], ['try-it-yourself', 'Try it out'], ['how-it-works', 'How it works'], ['pricing', 'Pricing'], ['our-approach', 'Our approach'], ['contact', 'Book a diagnostic']];
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  async function open(url, vw, vh) { const ctx = await b.newContext({ viewport: { width: vw || 1440, height: vh || 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(url + ': ' + m.text()); }); await p.goto(B + url); await p.waitForTimeout(150); return p; }
  const txt = async p => p.evaluate(() => document.body.innerText);

  // 1. every page: navigation, active page, no horizontal overflow on desktop and phone
  for (const w of [1440, 1024, 390, 360]) for (const [f, label] of PAGES) {
    const p = await open(f + '.html', w, 800);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, cur: (document.querySelector('.nav a[aria-current=page]') || {}).textContent || null, t: [...document.querySelectorAll('.nav a')].map(a => a.textContent).join('|') }));
    ok(r.sw <= r.vw, 'no horizontal overflow ' + w + ' ' + f + ' (' + r.sw + ')');
    ok(r.t === 'Capabilities|Try it out|How it works|Pricing|Our approach|Book a diagnostic', 'nav labels ' + w + ' ' + f);
    if (w === 1440) ok(r.cur === (label || null), 'active page ' + f + ' = ' + r.cur);
    await p.context().close();
  }
  // 2. mobile menu
  { const p = await open('index.html', 390, 800);
    ok(!(await p.isVisible('.nav')) && await p.isVisible('#burger'), 'mobile: hamburger, no nav row');
    await p.click('#burger'); ok(await p.isVisible('#mpanel'), 'mobile: menu opens');
    await p.keyboard.press('Escape'); ok(!(await p.isVisible('#mpanel')), 'Escape closes the menu');
    await p.click('#burger'); await Promise.all([p.waitForNavigation(), p.click('#mpanel a[href="pricing.html"]')]); ok(/pricing\.html/.test(p.url()), 'menu link navigates');
    await p.context().close(); }

  // 3. no leftovers, no placeholders, every local link resolves
  for (const [f] of PAGES) {
    const s = fs.readFileSync(ROOT + f + '.html', 'utf8');
    ok(!/pharma|₹|crore|provisional|prices are in USD/i.test(s.replace(/<script[\s\S]*?<\/script>/g, '')), 'no pharma, rupee or provisional wording: ' + f);
    ok(!/href="#"/.test(s), 'no placeholder links: ' + f);
    const bad = [...s.matchAll(/(?:href|src)="([^":#?]+\.(?:html|js|css|pdf|png|jpg|mp4|webm|woff2))(?:[#?][^"]*)?"/g)].map(m => m[1]).filter(u => !fs.existsSync(ROOT + u));
    ok(!bad.length, 'local links resolve: ' + f + (bad.length ? ' ' + bad.join(',') : ''));
    const h1 = (s.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1] || '';
    ok(!/^(Capabilities|Try it out|How it works|Pricing|Our approach)$/.test(h1.replace(/<[^>]+>/g, '')), 'headline does not repeat the menu label: ' + f);
  }

  // 4. home
  { const p = await open('index.html'); const T = await txt(p);
    ok(/Do intelligence work without building a team\./.test(T), 'home headline');
    ok(/Bring us a recurring or one-off question\. We help you make better decisions by building automated workflows that collect and analyse the evidence, and an analyst reviews every brief before it reaches you\./.test(T), 'hero sentence');
    const hs = await p.$$eval('main h1, main h2', a => a.map(x => x.textContent.trim()));
    ok(hs.join(' | ') === 'Do intelligence work without building a team. | Why this is hard to do in-house | See it in action | Decisions we can help with | Start small. Stop any month. | Need recurring intelligence without adding to your team?', 'home section order: ' + hs.join(' | '));
    ok(/57%/.test(T) && /64%/.test(T) && /13 of 21/.test(T), 'home stats present');
    ok(await p.isVisible('a.btn[href="try-it-yourself.html"]'), 'Try it now button present');
    ok(/Competitors/.test(T) && /Customers/.test(T) && /Distribution and supply/.test(T), 'three pillars on home');
    ok(!/Pricing, budget and supply|Pricing, spend and supply/.test(T), 'old pillar name gone');
    await p.context().close(); }
  { const p = await open('index.html', 390, 800); ok((await p.$$eval('.hero h1', a => a.length)) === 1, 'home mobile renders'); await p.context().close(); }

  // 5. capabilities
  { const p = await open('capabilities.html'); const T = await txt(p);
    ok(/Decisions we can help you make/.test(T) && /How each project runs/.test(T), 'capabilities headings');
    const l = await p.$$eval('a.go', a => a.map(x => x.getAttribute('href')));
    ok(l.join(',') === 'try-it-yourself.html?q=respond,try-it-yourself.html?q=journey,try-it-yourself.html?q=customers,try-it-yourself.html?q=budget', 'capabilities Try links: ' + l.join(','));
    await p.context().close(); }

  // 6. how it works and privacy
  { const p = await open('how-it-works.html'); const T = await txt(p);
    ok(/Privacy notice/.test(T) && /Mandhir Dua/.test(T) && /Gurugram, India/.test(T) && /mandhir@secondanalyst\.in/.test(T) && /12 months/.test(T), 'privacy notice details');
    ok(!/data location|where your data is stored/i.test(T), 'no data-location line');
    ok(await p.$('#privacy') !== null, 'privacy anchor');
    await p.context().close(); }

  // 7. pricing: USD only, sample pack behind an email
  { const p = await open('pricing.html'); const T = await txt(p);
    ok(!/INR|₹|rupee/i.test(T), 'pricing in USD only');
    ok(/\$500/.test(T) && /\$600/.test(T) && /\$1,100/.test(T) && /\$1,650/.test(T), 'prices shown');
    ok(/workflows/i.test(T) && /decisions/i.test(T) && /support/i.test(T), 'package cards');
    let sent = 0; await p.route('https://docs.google.com/**', r => { sent++; r.fulfill({ status: 200, body: '' }); });
    await p.fill('#gate-email', 'bad'); await p.click('#gate button'); ok(/Please give an email address/.test(await p.innerText('#gate-msg')) && sent === 0, 'gate rejects a bad email');
    await p.fill('#gate-email', 'a@example.com'); await p.click('#gate button'); await p.waitForFunction(() => /Open the sample pack/.test(document.getElementById('gate-msg').textContent), null, { timeout: 5000 });
    ok(sent === 1 && (await p.getAttribute('#gate-msg a', 'href')) === 'assets/sample-pack.pdf', 'gate sends the email and reveals the pack link');
    ok(fs.existsSync(ROOT + 'assets/sample-pack.pdf'), 'sample pack file exists');
    await p.context().close(); }

  // 8. our approach and contact
  { const p = await open('our-approach.html'); const T = await txt(p);
    const hs = await p.$$eval('main h2', a => a.map(x => x.textContent.trim()));
    ok(hs.join('|') === 'Three ways to get this done|Why in-house is hard|Experience behind the work|Who is this designed for?', 'our approach order: ' + hs.join('|'));
    await p.context().close(); }
  { const p = await open('contact.html'); const T = await txt(p);
    ok(/one working day/i.test(T), 'contact reply time'); await p.context().close(); }

  // 9. Try it out: every decision in every setting, step by step
  { const p = await open('try-it-yourself.html'); const Qs = ['respond', 'journey', 'customers', 'budget'], Is = ['telecom', 'saas', 'travel', 'streaming'];
    const cards = await p.$$eval('.dcs button b', a => a.map(x => x.textContent));
    ok(cards.join('|') === 'A rival cut its price. What do we do?|How does our website compare with rivals?|How should we serve each customer group?|How should we split our spend across channels?', 'four decision cards');
    const chips = await p.$$eval('[data-act=ind]', a => a.map(x => x.textContent));
    ok(chips.join('|') === 'Telecom|B2B software|Travel|Streaming', 'four settings: ' + chips.join('|'));
    for (const q of Qs) for (const ind of Is) {
      await p.click('[data-act=q][data-v=' + q + ']'); await p.click('[data-act=ind][data-v=' + ind + ']'); let bad = '';
      for (let s = 1; s <= 6; s++) {
        const t = await p.innerText('#tw'); if (/undefined|NaN|\[object|₹|crore/.test(t)) bad += ' bad text at step ' + s;
        if (s === 2) { await p.click('[data-act=collect]'); await p.waitForFunction(() => /Collected/.test(document.querySelector('[data-act=collect]').textContent), null, { timeout: 15000 }); }
        if (s === 3) { await p.click('[data-act=run]'); await p.waitForFunction(() => /(Scenarios run|Compared|Groups found)/.test(document.querySelector('[data-act=run]').textContent), null, { timeout: 15000 }); }
        if (s < 6) { if (await p.$eval('[data-act=next]', e => e.disabled)) { bad += ' next disabled at step ' + s; break; } await p.click('[data-act=next]'); }
      }
      const md = await p.evaluate(() => window.__trial.md());
      ok(!bad && /## Recommendation/.test(md) && /Where an analyst steps in/.test(md), 'flow ' + q + ' / ' + ind + (bad || ''));
      await p.click('[data-act=restart]');
    }
    // honesty labels
    await p.click('[data-act=q][data-v=journey]'); let T = await txt(p); ok(/illustrative example/i.test(T) && /cannot visit a site/i.test(T), 'journey says it is illustrative and cannot visit sites');
    await p.click('[data-act=ind][data-v=telecom]'); await p.click('[data-act=q][data-v=respond]'); T = await txt(p);
    ok(/AT&T/.test(T) && /T-Mobile/.test(T) && !/Verizon/.test(T) && /9 Nov 2026/.test(T), 'telecom: two rivals, dated');
    await p.click('[data-act=ind][data-v=travel]'); T = await txt(p); ok(/Hilton/.test(T) && /Marriott/.test(T) && /10 Nov 2026/.test(T), 'travel: Hilton and Marriott, dated');
    await p.click('[data-act=ind][data-v=streaming]'); T = await txt(p); ok(/Netflix/.test(T) && /Disney\+/.test(T), 'streaming: Netflix and Disney+');
    await p.click('[data-act=ind][data-v=saas]'); T = await txt(p); ok(/Slack/.test(T) && /Asana/.test(T), 'B2B software: Slack and Asana');
    // the spend numbers match the calculation the mocks showed
    await p.click('[data-act=q][data-v=budget]'); await p.click('[data-act=ind][data-v=telecom]'); await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => /Collected/.test(document.querySelector('[data-act=collect]').textContent)); await p.click('[data-act=next]'); await p.click('[data-act=run]'); await p.waitForFunction(() => /Scenarios run/.test(document.querySelector('[data-act=run]').textContent), null, { timeout: 15000 });
    T = await txt(p); ok(/50 \/ 40 \/ 10/.test(T) && /\$85 million/.test(T) && /\$80 million/.test(T) && /72%/.test(T), 'telecom spend result: 50/40/10, $85m against $80m, 72%');
    // customer file upload
    await p.click('[data-act=q][data-v=customers]'); await p.click('[data-act=csrc][data-v=upload]'); ok(await p.$eval('[data-act=next]', e => e.disabled), 'upload: next is disabled until a file is chosen');
    const csv = 'id,spend,seats,tickets,age\n' + Array.from({ length: 240 }, (_, i) => [i, [30, 90, 250][i % 3] + (i % 7), [2, 12, 40][i % 3] + (i % 4), [1, 3, 7][i % 3] + (i % 3), 20 + i % 40].join(',')).join('\n');
    fs.writeFileSync('/tmp/upload-test.csv', csv); await p.setInputFiles('#tw-file', '/tmp/upload-test.csv'); await p.waitForTimeout(300);
    T = await txt(p); ok(/240 rows/.test(T), 'upload: file read in the browser');
    await p.click('[data-act=next]'); await p.click('[data-act=collect]'); await p.waitForFunction(() => /Collected/.test(document.querySelector('[data-act=collect]').textContent)); await p.click('[data-act=next]'); await p.click('[data-act=run]'); await p.waitForFunction(() => /Groups found/.test(document.querySelector('[data-act=run]').textContent), null, { timeout: 15000 });
    T = await txt(p); ok(/3 customer groups/.test(T) && /Group 1/.test(T) || /customer groups/.test(T), 'upload: groups found');
    // phone layout
    await p.context().close(); }
  { const p = await open('try-it-yourself.html', 390, 800); let w = 0;
    for (const q of ['respond', 'journey', 'customers', 'budget']) { await p.click('[data-act=q][data-v=' + q + ']'); for (let s = 1; s <= 6; s++) { if (s === 2) { await p.click('[data-act=collect]'); await p.waitForFunction(() => /Collected/.test(document.querySelector('[data-act=collect]').textContent), null, { timeout: 15000 }); } if (s === 3) { await p.click('[data-act=run]'); await p.waitForFunction(() => /(Scenarios run|Compared|Groups found)/.test(document.querySelector('[data-act=run]').textContent), null, { timeout: 15000 }); } w = Math.max(w, await p.evaluate(() => document.documentElement.scrollWidth)); if (s < 6) await p.click('[data-act=next]'); } await p.click('[data-act=restart]'); }
    ok(w <= 390, 'try it out: no horizontal overflow on a phone in any step (' + w + ')'); await p.context().close(); }
  { const p = await open('try-it-yourself.html?q=journey&industry=streaming'); ok((await p.$eval('[data-act=q][aria-pressed=true]', e => e.dataset.v)) === 'journey' && (await p.$eval('[data-act=ind][aria-pressed=true]', e => e.dataset.v)) === 'streaming', 'URL picks decision and setting'); await p.context().close(); }

  ok(!errs.length, 'no console or page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
