/* Try it out: four business decisions, each followed step by step from set-up to a memo.
   Responding to a rival's price move uses real offers captured from the rivals' public pages. The customer-groups decision also matches those offers to what each group values.
   The website comparison starts from an illustrative feature table that you change: this page cannot visit a site. Spend across channels runs on numbers you set.
   Price response and spend run real scenario calculations. Groups are found with k-means in your browser. The page reads bundled snapshots only. Nothing is fetched live and nothing is sent. */
(function () {
  'use strict';
  var OF = window.OF, M = window.MODELS, TD = window.TD, root = document.getElementById('tw');
  if (!OF || !M || !TD || !root) return;
  var STEPS = [
    { k: 'setup', n: 'Set up', does: 'You define the question, the inputs and what counts. Nothing runs yet.', who: 'You' },
    { k: 'collect', n: 'Collect', does: 'The workflow reads the sources and your inputs, logs each one with where it came from, and checks it. It does not interpret anything yet.', who: 'Workflow' },
    { k: 'analyse', n: 'Analyse', does: 'It does the calculation or comparison, using rules you can see and change.', who: 'Workflow' },
    { k: 'synth', n: 'Synthesise', does: 'It turns the analysis into findings, each with its evidence, and says what the analysis cannot tell you.', who: 'Workflow' },
    { k: 'memo', n: 'Decide and write', does: 'It drafts a decision memo from the findings you keep. In a live engagement a designated analyst reviews it at this point, before it reaches you.', who: 'Workflow, then analyst' },
    { k: 'act', n: 'Act', does: 'The memo waits for your decision. Approve it, put it on hold or ask for changes.', who: 'You' }
  ];
  var Q = [
    { k: 'respond', n: 'A rival cut its price. What do we do?', why: 'Avoid matching a cut that costs more than it saves.', dat: 'Real data: rival offers' },
    { k: 'journey', n: 'How does our website compare with rivals?', why: 'Follow a customer from discovery to checkout, and see where rivals are ahead.', dat: 'Illustrative example, or your own entries' },
    { k: 'customers', n: 'How should we serve each customer group?', why: 'Build customer groups from your data, and see what rivals offer each.', dat: 'Your data, plus real rival offers' },
    { k: 'budget', n: 'How should we split our spend across channels?', why: 'Put each dollar where it earns most.', dat: 'Your numbers' }
  ];
  var S = { q: 'respond', ind: 'telecom', who: '', step: 1, done: { collect: false, run: false }, keep: null, outcome: null, running: false, maxStep: 1, unc: 'med', obj: 'mean', R: null, B: null, J: null, C: null, acts: null, _ci: 0 };
  function $(s) { return root.querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(d) { var x = new Date(d + 'T00:00:00Z'); return x.getUTCDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function pm(c) { return '<i class="pm ' + c + '" aria-hidden="true"></i>'; }
  /* ====================================================================
     Shared helpers for the other three questions
     ==================================================================== */
  function lcAcr(t) { return /^[A-Z]{2,}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }
  function lcFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function num(v) { return Number(String(v).replace(/,/g, '')); }
  function U() { return TD[S.ind].cur; }
  function cr(v) { var a = Math.abs(v), u = U(); return (v < 0 ? '-' : '') + u.sym + (a < 10 ? a.toFixed(1) : Math.round(a)) + ' ' + u.big; }
  function crs(v) { return (v >= 0 ? '+' : '') + cr(v); }
  function amt(n) { var u = U(); return u.sym + n + ' ' + u.big; }
  function grp(v) { return Math.round(v).toLocaleString(U().sym === '$' ? 'en-US' : 'en-IN'); }
  function mp(v) { return U().sym + (v >= 100 ? grp(v) : v.toFixed(2).replace(/\.00$/, '')); }
  function mon(v) { var a = Math.abs(v), c = U(), sgn = (v < 0 ? '-' : '') + c.sym, big = c.sym === '$' ? [[1e6, ' million'], [1e3, ' thousand']] : [[1e7, ' crore'], [1e5, ' lakh']], i; for (i = 0; i < big.length; i++) if (a >= big[i][0]) { var x = a / big[i][0]; return sgn + (x < 10 ? x.toFixed(1).replace(/\.0$/, '') : Math.round(x)) + big[i][1]; } return sgn + Math.round(a).toLocaleString(c.sym === '$' ? 'en-US' : 'en-IN'); }
  function mons(v) { return (v >= 0 ? '+' : '') + mon(v); }
  function indChips() { return '<div class="tw-f"><div class="lab2">1 · Example setting</div><div class="chp" role="group" aria-label="Example setting">' + Object.keys(TD).map(function (k) { return '<button type="button" data-act="ind" data-v="' + k + '" aria-pressed="' + (S.ind === k) + '">' + TD[k].label + '</button>'; }).join('') + '</div><p class="note" style="margin:8px 0 0">Illustrative setting. The same workflow applies in any sector.</p></div>'; }
  function whoField(n) { return '<div class="tw-f"><label class="lab2" for="tw-who">' + n + ' · Your company <span style="text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px">(optional)</span></label><input type="text" id="tw-who" class="inp" data-act="who" value="' + esc(S.who) + '" maxlength="60" placeholder="Used in the memo heading"><p class="note" style="margin:6px 0 0">' + pm('int') + 'Customer-provided</p></div>'; }
  function numField(k, label, val, hint, step) { return '<div class="tw-n"><label for="n-' + k + '">' + label + '</label><input type="number" id="n-' + k + '" inputmode="decimal" step="' + (step || 'any') + '" data-act="num" data-k="' + k + '" value="' + val + '">' + (hint ? '<small>' + hint + '</small>' : '') + '</div>'; }
  function runBar(text) { return '<div class="tw-run"><div class="tw-runt" id="tw-runt">' + text + '</div><div class="tw-prog"><i id="tw-runb" style="width:0"></i></div></div>'; }
  function uncChips() { return '<div class="chp" role="group" aria-label="How sure are you">' + [['narrow', 'Quite sure'], ['med', 'Fairly sure'], ['wide', 'Not very sure']].map(function (x) { return '<button type="button" data-act="unc" data-v="' + x[0] + '" aria-pressed="' + (S.unc === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: this sets how wide the ranges are around each number.</p>'; }
  var UNC = { narrow: 0.12, med: 0.25, wide: 0.45 };

  /* ---------- generic collect list ---------- */
  function collectTable(rows) {
    var done = S.done.collect;
    return '<div class="tw-card"><div class="lab2">What the workflow reads</div><table class="tw-t"><thead><tr><th>Item</th><th>Value</th><th>Type</th><th>Check</th></tr></thead><tbody>' + rows.map(function (r, i) {
      var st = done ? 'done' : (S.running ? (i < S._ci ? 'done' : i === S._ci ? 'run' : 'wait') : 'wait');
      return '<tr class="' + st + '"><td>' + r.l + '</td><td>' + (st === 'done' ? r.v : '') + '</td><td>' + (st === 'done' ? pm(r.t === 'ill' ? 'asm' : r.t) + ({ int: 'Customer-provided', asm: 'Assumption', pub: 'Public source', ana: 'Analysis', ill: 'Illustrative example' }[r.t]) : '') + '</td><td class="st">' + (st === 'done' ? (r.ok === false ? '<span class="tag h">Fix</span> ' + esc(r.msg) : '<span class="okc">✓</span>') : st === 'run' ? 'Reading…' : 'Waiting') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function startCollect(n) {
    S.running = true; S._ci = 0; render(true);
    (function tick() { S._ci++; if (S._ci > n) { S.running = false; S.done.collect = true; render(true); return; } render(true); setTimeout(tick, 380); })();
  }
  function startRunEngine(compute, label, after, opts) {
    var total = (opts && opts.total) || 5000, dur0 = (opts && opts.dur) || 2000;
    S.running = true; render(true);
    setTimeout(function () {
      compute();
      var t0 = Date.now(), dur = dur0, tm = setInterval(function () {
        var f = Math.min(1, (Date.now() - t0) / dur), tx = $('#tw-runt'), b = $('#tw-runb');
        if (tx) tx.textContent = label + ' ' + grp(Math.round(f * total)) + ' of ' + grp(total); if (b) b.style.width = (f * 100) + '%';
        if (after) after(f);
        if (f >= 1) { clearInterval(tm); S.running = false; S.done.run = true; render(true); }
      }, 60);
    }, 60);
  }

  /* ====================================================================
     RESPOND TO A RIVAL'S PRICE MOVE
     ==================================================================== */
  var LV = { L: 'Low', M: 'Medium', H: 'High' };
  function RD() { return TD[S.ind].respond; }
  function ofd() { return OF[S.ind] || null; }
  function capd() { var o = ofd(); return fmtDate(o && o.captured ? o.captured : '2026-11-09'); }
  function priced(f) { return f.eff !== undefined || f.pct !== undefined; }
  function respondInit() {
    var d = RD(), o = ofd(), m = d.manual;
    S.R = { price: d.P0, cost: d.c, vol: d.V, leak: d.leak, before: m ? m.before : null, after: m ? m.after : null, offer: d.offers && o ? (offerList()[0] || { f: {} }).f.id : null, seg: d.segs.map(function (s) { return { ov: s.ov, sens: s.sens }; }), E: null };
  }
  function R() { if (!S.R) respondInit(); return S.R; }
  function offerList() { var o = ofd(), out = []; if (o) o.rivals.forEach(function (r) { r.offers.forEach(function (f) { if (priced(f)) out.push({ r: r, f: f }); }); }); return out; }
  function chosen() { var id = R().offer, l = offerList(), i; for (i = 0; i < l.length; i++) if (l[i].f.id === id) return l[i]; return null; }
  function rivalMove() {
    var d = RD(), r = R(), c = chosen();
    if (d.offers && c && c.f.pct) return { who: c.r.name, page: c.r.page, plan: c.f.plan, pct: c.f.pct, before: r.price, after: Math.round(r.price * (1 - c.f.pct / 100) * 100) / 100, assumedBefore: true, src: c.r.url, quote: c.f.quote, cond: c.f.cond, like: c.f.like, note: c.f.note || '' };
    if (d.offers && c) return { who: c.r.name, page: c.r.page, plan: c.f.plan, before: (c.f.list !== null && c.f.list !== undefined) ? c.f.list : r.price, after: c.f.eff, assumedBefore: (c.f.list === null || c.f.list === undefined), src: c.r.url, quote: c.f.quote, cond: c.f.cond, like: c.f.like, note: c.f.note || '' };
    return { who: d.manual.who, page: null, plan: d.manual.label, before: r.before, after: r.after, assumedBefore: false, src: null, quote: null, cond: '', like: true, note: '' };
  }
  function respondCfg() {
    var d = RD(), r = R(), u = UNC[S.unc], mv = rivalMove(), cc = Math.min(r.cost, r.price * 0.95);
    return {
      P: r.price, c: cc, V: r.vol, R: mv.after, R0: mv.before,
      segs: d.segs.map(function (s, i) { return { share: s.share, ov: r.seg[i].ov, sens: r.seg[i].sens }; }),
      rng: {
        leak: [Math.max(0.02, r.leak * (1 - 2 * u)), r.leak, r.leak * (1 + 3.6 * u)],
        c: [cc * (1 - .7 * u), cc, Math.min(r.price * 0.98, cc * (1 + .9 * u))],
        rho: [Math.max(.1, .7 - u), .7, Math.min(.95, .7 + .8 * u)],
        rhov: [Math.max(.05, .5 - .8 * u), .5, Math.min(.9, .5 + .8 * u)],
        om: [1, 2, 2 + 6 * u],
        pk: [.05, .1, .1 + .32 * u]
      }
    };
  }
  function respondChecks() {
    var r = R(), d = RD(), out = [];
    if (!(r.price > 0)) out.push('Your price must be above zero.');
    if (!(r.cost > 0) || r.cost >= r.price) out.push('Your cost must be above zero and below your price.');
    if (!(r.vol > 0)) out.push('Volume must be above zero.');
    if (!(r.leak >= 0.05 && r.leak <= 3)) out.push('Customer reaction must be between 0.05 and 3.');
    if (!d.offers && !(r.before > 0 && r.after > 0)) out.push('Enter the rival’s price before and after.');
    if (d.offers && !chosen()) out.push('Choose an offer to respond to.');
    return out;
  }
  function segSelect(i, f, v) { return '<select class="inp" data-act="seg" data-i="' + i + '" data-f="' + f + '" aria-label="' + (f === 'ov' ? 'Overlap with the rival' : 'Price sensitivity') + ', ' + esc(RD().segs[i].n) + '">' + ['L', 'M', 'H'].map(function (x) { return '<option value="' + x + '"' + (x === v ? ' selected' : '') + '>' + LV[x] + '</option>'; }).join('') + '</select>'; }
  function vRSetup() {
    var d = RD(), r = R(), bad = respondChecks(), sym = U().sym, move;
    if (d.offers) {
      move = '<div class="tw-f"><div class="lab2">2 · The rival’s move</div><p class="note" style="margin:0 0 8px">Two rivals are pre-filled with real offers, captured ' + capd() + '. Choose one to respond to.</p>' + ofd().rivals.map(function (rv) {
        return '<div class="tw-rt"><b>' + esc(rv.name) + '</b>' + rv.offers.filter(priced).map(function (f) { return '<label class="tw-ck"><input type="radio" name="offer" data-act="offer" data-v="' + f.id + '"' + (r.offer === f.id ? ' checked' : '') + '><span><b>' + esc(f.plan) + '</b><small>' + (f.pct ? 'Up to ' + f.pct + '% off' : mp(f.eff) + ' ' + d.per + (f.list !== null && f.list !== undefined && f.list !== f.eff ? ', ' + mp(f.list) + ' before' : '')) + (f.like ? '' : '. Not like-for-like') + '</small></span></label>'; }).join('') + '</div>';
      }).join('') + '</div>';
    } else {
      move = '<div class="tw-f"><div class="lab2">2 · The rival’s move</div><p class="note" style="margin:0 0 8px">' + esc(d.manual.who) + ' has cut its price. Enter the price before and after. This example does not read price pages.</p>' +
        numField('before', esc(d.manual.label) + ' before (' + sym + ')', r.before, '') + numField('after', esc(d.manual.label) + ' after (' + sym + ')', r.after, '') + '</div>';
    }
    var segs = d.segs.map(function (s, i) { return '<div class="tw-rt"><b>' + esc(s.n) + '</b><small class="sg">' + Math.round(s.share * 100) + '% of your volume</small><div class="tw-sel"><label>Overlap with the rival' + segSelect(i, 'ov', r.seg[i].ov) + '</label><label>Price sensitivity' + segSelect(i, 'sens', r.seg[i].sens) + '</label></div></div>'; }).join('');
    var left = indChips() + move +
      '<div class="tw-f"><div class="lab2">3 · Your numbers</div>' + numField('price', d.ref + ' (' + sym + ')', r.price, '') + numField('cost', 'Your cost per ' + d.unit + ' (' + sym + ')', r.cost, 'Must be below your price') + numField('vol', d.volLabel, r.vol, '') + '</div>' +
      '<div class="tw-f"><div class="lab2">4 · Your customers</div><p class="note" style="margin:0 0 8px">Overlap is how many of these customers could easily take the rival’s offer. Sensitivity is how readily they switch for a lower price.</p>' + segs + '</div>' +
      '<div class="tw-f"><div class="lab2">5 · How customers react</div>' + numField('leak', 'Customers lost for each 1% the rival undercuts you (%)', r.leak, 'Typical: 0.2 to 1. This is an assumption.', '0.05') + '</div>' +
      '<div class="tw-f"><div class="lab2">6 · How sure are you?</div>' + uncChips() + '</div>' + whoField(7);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">A rival has cut its price or launched an offer. How should we respond?</p><div class="lab2" style="margin-top:14px">Responses it will compare</div><div class="tw-pills">' + M.RESP_LABEL.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src">' + (d.offers ? '<li>' + pm('pub') + '<span><b>The rival’s public page</b><small>Captured on ' + capd() + ', with the page address.</small></span></li>' : '<li>' + pm('int') + '<span><b>The rival’s price you enter</b><small>Before and after the move.</small></span></li>') + '<li>' + pm('int') + '<span><b>Your numbers and customers</b><small>Price, cost, volume and how each customer segment is exposed.</small></span></li><li>' + pm('asm') + '<span><b>Your assumptions</b><small>How strongly customers react to a price gap, each as a range.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>What the move costs you if you do nothing</li><li>Which customer segments are most exposed</li><li>Four responses, each with its profit change and range</li><li>What to watch next, and what not to do</li><li>A draft decision memo and actions waiting for you</li></ul>' +
      '<p class="note" style="margin:14px 0 0">' + (d.offers ? 'The rival’s prices are real. ' : '') + 'The numbers about your company are illustrative for ' + esc(lcFirst(TD[S.ind].co)) + '. Change them to your own.</p></div>';
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function rRows() {
    var d = RD(), r = R(), c = respondCfg(), mv = rivalMove(), rows = [];
    if (d.offers) {
      rows.push({ l: 'Rival page: ' + mv.who + ', ' + mv.page, v: '<a href="' + mv.src + '" target="_blank" rel="noopener">' + esc(mv.src.replace('https://', '')) + '</a>, captured ' + capd(), t: 'pub', ok: true });
      rows.push({ l: 'Rival offer: ' + mv.plan, v: mv.pct ? 'Up to ' + mv.pct + '% off. The page shows no rate, so we apply it to a rival rate level with yours: ' + mp(mv.after) + ' ' + d.per : mp(mv.after) + ' ' + d.per + (mv.assumedBefore ? '. No earlier price on the page, so we assume the rival was level with you' : ', was ' + mp(mv.before)), t: 'pub', ok: true });
      rows.push({ l: 'Offer conditions', v: esc(mv.cond), t: 'pub', ok: true });
      rows.push({ l: 'Like-for-like with your plan?', v: mv.like ? 'Yes' : 'No. ' + esc(mv.note), t: 'ana', ok: true });
    } else {
      rows.push({ l: mv.plan + ' before', v: mp(mv.before), t: 'int', ok: mv.before > 0, msg: 'Must be above zero' });
      rows.push({ l: mv.plan + ' after', v: mp(mv.after), t: 'int', ok: mv.after > 0, msg: 'Must be above zero' });
    }
    rows.push({ l: 'Your price', v: mp(r.price) + ' per ' + d.unit, t: 'int', ok: r.price > 0, msg: 'Must be above zero' });
    rows.push({ l: 'Your cost per ' + d.unit, v: mp(r.cost) + ' (range ' + mp(c.rng.c[0]) + ' to ' + mp(c.rng.c[2]) + ')', t: 'int', ok: r.cost > 0 && r.cost < r.price, msg: 'Must be below your price' });
    rows.push({ l: 'Volume in a year', v: grp(r.vol) + ' ' + d.unit + '-' + (d.per.indexOf('month') >= 0 ? 'months' : 's'), t: 'int', ok: r.vol > 0, msg: 'Must be above zero' });
    d.segs.forEach(function (s, i) { rows.push({ l: 'Segment: ' + s.n, v: Math.round(s.share * 100) + '% of volume, overlap ' + LV[r.seg[i].ov].toLowerCase() + ', sensitivity ' + LV[r.seg[i].sens].toLowerCase(), t: 'int', ok: true }); });
    rows.push({ l: 'Customers lost per 1% undercut', v: r.leak + '% (range ' + c.rng.leak[0].toFixed(2) + '% to ' + c.rng.leak[2].toFixed(2) + '%)', t: 'asm', ok: r.leak >= 0.05 && r.leak <= 3, msg: 'Between 0.05 and 3' });
    rows.push({ l: 'Responses tested', v: M.RESP_LABEL.join(', ').toLowerCase(), t: 'asm', ok: true });
    return rows;
  }
  function vRCollect() {
    var d = RD(), mv = rivalMove(), rows = rRows(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">' + (d.offers ? 'The workflow reads the rival’s page as a visitor sees it, records the offer with its source and date, and checks your own numbers.' : 'The workflow reads the rival’s price you entered and checks your own numbers.') + '</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading' : d.offers ? 'Read the page and check inputs' : 'Check and collect inputs') + '</button>' + (done ? '<p class="tw-note" style="margin-top:14px">Change something? Go back to step 1, then collect again.</p>' : '');
    var right = collectTable(rows);
    if (d.offers && done) right += '<div class="tw-card"><div class="lab2">' + pm('pub') + 'What the page said</div><p class="tw-q" style="font-size:16px">“' + esc(mv.quote) + '”</p><p class="note" style="margin:6px 0 0">' + esc(mv.who) + ', <a href="' + mv.src + '" target="_blank" rel="noopener">' + esc(mv.page) + ' page</a>, captured ' + capd() + '.</p></div>';
    right += '<div class="tw-card gap"><div class="lab2">Not collected here</div><ul class="tw-g"><li>' + pm('asm') + 'How many customers the rival is winning or losing. That is not public.</li>' + (d.offers ? '<li>' + pm('asm') + 'Offers shown only in store, by address or to existing customers. The page shows one view.</li><li>' + pm('asm') + 'Whether the offer is permanent. A live engagement captures the page every week to see.</li>' : '<li>' + pm('asm') + 'The rival’s real price lists. A live engagement reads the pages you choose.</li>') + '<li>' + pm('asm') + 'Your own history of customers lost after past rival moves. That is what would firm up the reaction assumption.</li></ul></div>';
    return { left: left, right: right, ok: done, why: 'Collect the inputs to continue.', n: rows.length };
  }
  function respondStats() {
    var E = R().E, key = S.obj === 'p10' ? 'p10' : 'mean', rank = E.rows.slice().sort(function (a, b) { return b[key] - a[key]; });
    return { rows: E.rows, rank: rank, best: rank[0], second: rank[1], none: E.press.press <= 0 };
  }
  function rLabel(k) { return M.RESP_LABEL[k]; }
  function vRAnalyse() {
    var r = R(), ran = S.done.run, run = S.running, mv = rivalMove(), c = respondCfg(), pr = M.respondPress(c);
    var left = '<p class="tw-note">The rival now sells at ' + mp(mv.after) + ' against your ' + mp(r.price) + '. The workflow draws 5,000 possible futures from your ranges. In each one it works out the profit of every response over the next 12 months, then compares them.</p><div class="tw-f"><div class="lab2">What counts as best</div><div class="chp" role="group" aria-label="Objective">' + [['mean', 'Highest average profit'], ['p10', 'Avoid big losses']].map(function (x) { return '<button type="button" data-act="obj" data-v="' + x[0] + '" aria-pressed="' + (S.obj === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: how you weigh risk. “Avoid big losses” ranks responses by their worst 10% of outcomes.</p></div>' +
      '<button type="button" class="btn am" data-act="run"' + (ran || run ? ' disabled' : '') + '>' + (ran ? 'Scenarios run' : run ? 'Running' : 'Run 5,000 scenarios') + '</button>' + (ran ? '<p class="tw-note" style="margin-top:14px">Change the objective and the ranking updates. Change a number in step 1 and run again.</p>' : '');
    var right;
    if (run) right = '<div class="tw-card">' + runBar('Drawing scenarios') + '<p class="note" style="margin:10px 0 0">Each scenario picks how strongly customers react, how many a response keeps and what it costs, then works out profit for all four responses.</p></div>';
    else if (!ran) right = '<div class="tw-card"><div class="lab2">Ready to run</div><p class="tw-q">Nothing has been calculated yet.</p><p class="note" style="margin:8px 0 0">The rival undercuts you by ' + pr.now.toFixed(1) + '% now' + (pr.before > 0 ? ', against ' + pr.before.toFixed(1) + '% before the move' : ', and did not undercut you before') + '. Press the button to run the scenarios.</p></div>';
    else {
      var E = r.E, st = respondStats(), mn = Math.min.apply(null, st.rows.map(function (x) { return x.p10; }).concat([0])), mx = Math.max.apply(null, st.rows.map(function (x) { return x.p90; }).concat([0])), span = (mx - mn) || 1;
      var X = function (v) { return ((v - mn) / span * 100).toFixed(1); };
      right = '<div class="tw-card"><div class="lab2">' + pm('ana') + 'What the move costs if you hold the price</div>' + (st.none ? '<p class="tw-q">The rival does not undercut you, so there is no move to respond to.</p>' : '<p class="tw-q">About ' + mon(-E.hold.mean) + ' a year in lost profit, within ' + mon(-E.hold.p90) + ' to ' + mon(-E.hold.p10) + ' in 80% of scenarios.</p><p class="note" style="margin:6px 0 0">The rival now undercuts you by ' + E.press.now.toFixed(1) + '%' + (E.press.before > 0 ? ', against ' + E.press.before.toFixed(1) + '% before the move' : '. Before the move it did not undercut you') + '.</p>') + '</div>';
      if (!st.none) {
        right += '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Who is exposed</div><table class="tw-t"><thead><tr><th>Segment</th><th>Share</th><th>Exposure</th><th>Profit at risk a year</th></tr></thead><tbody>' + E.expo.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return b.e.atRiskProfit - a.e.atRiskProfit; }).map(function (o) { return '<tr><td>' + esc(RD().segs[o.i].n) + '</td><td>' + Math.round(o.e.share * 100) + '%</td><td><span class="lvl ' + o.e.level + '">' + o.e.level + '</span></td><td>' + mon(o.e.atRiskProfit) + '</td></tr>'; }).join('') + '</tbody></table><p class="note" style="margin:10px 0 0">Profit at risk if you hold, at your central assumptions. It combines the segment’s size, overlap with the rival and sensitivity to price.</p></div>' +
          '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Profit change against holding the price, a year</div><div class="tw-bars">' + st.rows.map(function (x) {
            return '<div class="tw-br' + (x.k === st.best.k ? ' best' : '') + '"><span class="n">' + rLabel(x.k) + (x.k === st.best.k ? '<em>Best</em>' : '') + '</span><div class="trk"><i class="z" style="left:' + X(0) + '%"></i><i class="rg" style="left:' + X(x.p10) + '%;width:' + Math.max(1, X(x.p90) - X(x.p10)) + '%"></i><i class="mn" style="left:' + X(x.mean) + '%"></i></div><span class="v">' + (x.k === 0 ? 'Baseline' : mons(x.mean)) + '</span></div>';
          }).join('') + '</div><p class="note" style="margin:10px 0 0">The bar is the range in 80% of scenarios. The dark mark is the average. The thin line is no change from holding.</p></div>' +
          '<div class="tw-card"><div class="lab2">' + pm('ana') + 'The numbers</div><table class="tw-t num3"><thead><tr><th>Response</th><th>Average</th><th>80% range</th><th>Beat holding</th></tr></thead><tbody>' + st.rank.map(function (x) { return '<tr' + (x.k === st.best.k ? ' class="hit"' : '') + '><td>' + rLabel(x.k) + '</td><td>' + (x.k === 0 ? 'Baseline' : mons(x.mean)) + '</td><td>' + (x.k === 0 ? '–' : mon(x.p10) + ' to ' + mon(x.p90)) + '</td><td>' + (x.k === 0 ? '–' : Math.round(x.beat * 100) + '%') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
    }
    return { left: left, right: right, ok: ran, why: 'Run the scenarios to continue.' };
  }
  function topSegs(n) { var E = R().E, d = RD(); return E.expo.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return b.e.atRiskProfit - a.e.atRiskProfit; }).slice(0, n || 2); }
  function segNames(list) { return list.map(function (o) { return lcFirst(RD().segs[o.i].n); }).join(' and '); }
  function respondSignals() {
    var E = R().E, st = respondStats(), b = st.best, s2 = st.second, sig = [], mv = rivalMove(), src = mv.src ? [{ l: mv.who + ' ' + mv.page + ' page, captured ' + capd(), u: mv.src }] : [{ l: 'The rival price you entered', u: null }], scen = [{ l: '5,000 scenarios from your ranges', u: null }];
    if (st.none) { sig.push({ id: 'r-none', head: 'The rival is not undercutting you, so no response is needed', body: 'The rival’s price after the move is ' + mp(mv.after) + ', against your ' + mp(R().price) + '.', why: 'A response now would give away margin to protect against a threat that is not there.', src: src, ev: ['pub', 'int'], score: 5 }); return sig; }
    sig.push({ id: 'r-cost', head: 'If you hold, the rival’s move costs about ' + mon(-E.hold.mean) + ' a year', body: 'Within ' + mon(-E.hold.p90) + ' to ' + mon(-E.hold.p10) + ' in 80% of 5,000 scenarios. The rival now undercuts you by ' + E.press.now.toFixed(1) + '%' + (E.press.before > 0 ? ', against ' + E.press.before.toFixed(1) + '% before.' : '.'), why: 'This is the size of the problem before any response.', src: src.concat(scen), ev: ['pub', 'ana', 'int'], score: 5 });
    sig.push({ id: 'r-best', head: b.k === 0 ? 'Holding the price is the best response on your numbers' : 'The best response is to ' + lcFirst(rLabel(b.k)), body: b.k === 0 ? 'No response beats holding on ' + (S.obj === 'p10' ? 'the downside' : 'average profit') + '. The nearest is to ' + lcFirst(rLabel(s2.k)) + ', at ' + mons(s2.mean) + ' a year on average against holding.' : 'It changes profit by ' + mons(b.mean) + ' a year against holding, on average, within ' + mon(b.p10) + ' to ' + mon(b.p90) + ' in 80% of scenarios. It beats holding in ' + Math.round(b.beat * 100) + '% of them.', why: 'The model uses the ranges you set. Your own data on customers lost after past rival moves would narrow them.', src: scen, ev: ['ana', 'int', 'asm'], score: 4.8 });
    var mt = E.rows[1], tp = topSegs(2);
    sig.push({ id: 'r-match', head: mt.mean < 0 ? 'Matching the price for everyone costs ' + mon(-mt.mean) + ' a year more than holding' : 'Matching the price for everyone beats holding, by ' + mon(mt.mean) + ' a year', body: E.matchBreakEven ? 'Matching only pays if customers react at least ' + E.matchBreakEven.toFixed(1) + '% for each 1% undercut, against your assumption of ' + R().leak + '%.' : 'It is better than holding at every reaction level tested.', why: 'It gives the discount to every customer, including those who were never going to leave.', src: scen, ev: ['ana', 'asm'], score: 4.5 });
    sig.push({ id: 'r-expo', head: 'The most exposed segments are ' + segNames(tp), body: 'Together they hold ' + Math.round((tp[0].e.atRiskProfit + tp[1].e.atRiskProfit) / E.expo.reduce(function (a, e) { return a + e.atRiskProfit; }, 0) * 100) + '% of the profit at risk.', why: 'A response aimed at them reaches the customers most likely to leave.', src: scen, ev: ['ana', 'int'], score: 4 });
    var h = E.hinge[0];
    sig.push({ id: 'r-hinge', head: 'The answer depends most on ' + h.label, body: h.flips.length ? 'At the ' + h.flips[0].end + ' end of its range, the best response changes to ' + lcFirst(rLabel(h.flips[0].to)) + '.' : 'At either end of its range, the best response stays the same.', why: 'This is the assumption to firm up first.', src: [{ l: 'Sensitivity test on your ranges', u: null }], ev: ['ana', 'asm'], score: 3.5 });
    if (!mv.like) sig.push({ id: 'r-like', head: 'This offer is not like-for-like with your plan', body: mv.note, why: 'The gap is measured against a plan that is not the same tier, so the pressure may be over- or under-stated.', src: src, ev: ['pub'], score: 4.9 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function respondMemo() {
    var E = R().E, st = respondStats(), b = st.best, sig = respondSignals(), ks = keptOf(sig), tp = st.none ? [] : topSegs(2), h = E.hinge[0], d = RD(), mt = E.rows[1];
    var rec = st.none ? 'No response is needed.' : b.k === 0 ? 'Hold the price for now.' : b.k === 1 ? 'Match the rival’s price for everyone.' : b.k === 2 ? 'Offer a lower price to at-risk customers only, starting with ' + segNames(tp) + '.' : 'Hold the price and add value for at-risk customers, starting with ' + segNames(tp) + '.';
    var trade = st.none ? 'The rival is not undercutting you, so a response would only give away margin.' : b.k === 0 ? 'No response beats holding on your numbers. Holding avoids giving a discount to customers who would have stayed.' : 'It changes profit by ' + mons(b.mean) + ' a year against holding, on average, within ' + mon(b.p10) + ' to ' + mon(b.p90) + '. It beats holding in ' + Math.round(b.beat * 100) + '% of scenarios.';
    var dont = st.none ? 'Do not cut your price. There is nothing to defend against.' : b.k === 1 ? 'Do not leave the discount open-ended. Set an end date and review it against customers kept.' : mt.mean < 0 ? 'Do not match the rival’s price for everyone. It costs about ' + mon(-mt.mean) + ' a year more than holding, and gives the discount to customers who were not going to leave.' : 'Do not respond to this move without checking which customers are actually leaving first.';
    var conf = st.none ? 'High' : (b.beat >= 0.75 || b.k === 0) && !h.flips.length ? 'High' : b.beat >= 0.55 && h.flips.length < 2 ? 'Moderate' : 'Low';
    return { q: 'A rival has cut its price or launched an offer. How should we respond?', who: S.who.trim(), rec: rec, trade: trade, unc: 'The answer depends most on ' + h.label + '. That number is your assumption, not a measured fact.', next: st.none ? 'Keep watching the rival’s page. Nothing to do now.' : 'Check ' + d.evidence + ', then try the response on the most exposed segment before rolling it out.', ks: ks, top: null, sig: sig, dont: dont, watch: d.watch, conf: conf, change: h.flips.length ? 'At the ' + h.flips[0].end + ' end of the range for ' + h.label + ', the best response becomes ' + lcFirst(rLabel(h.flips[0].to)) + '.' : 'No assumption changes the best response across its range.' };
  }
  function mdExtra(M2) {
    if (!M2.dont) return '';
    return '\n## What not to do\n\n' + M2.dont + '\n\n## Confidence\n\n' + M2.conf + '. ' + M2.change + '\n\n## Watch next\n\n' + M2.watch.map(function (w) { return '- **' + w[0] + '.** Where to look: ' + w[1] + '.'; }).join('\n') + '\n';
  }
  function respondMd(M2) {
    var r = R(), d = RD(), mv = rivalMove();
    return mdBase('Rival price move brief', M2, [(d.offers ? 'Rival: ' + mv.who + ', ' + mv.plan + ', ' + mp(mv.after) + ' ' + d.per + (mv.assumedBefore ? '' : ', was ' + mp(mv.before)) + '. Source: ' + mv.src + ', captured ' + capd() + '.' : 'Rival price entered: ' + mp(mv.before) + ' before, ' + mp(mv.after) + ' after.'), 'Your price ' + mp(r.price) + ', cost ' + mp(r.cost) + ', volume ' + grp(r.vol) + '.', 'Customers lost per 1% undercut: ' + r.leak + '%. Ranges set as: ' + ({ narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]) + '.', 'Best is judged by: ' + (S.obj === 'p10' ? 'avoiding big losses' : 'highest average profit') + '.'], respondAssum()) + mdExtra(M2);
  }
  function respondAssum() { return ['How strongly customers react to a price gap, and how many a response keeps, are your assumptions, shown as ranges.', RD().offers ? 'The rival’s prices are as shown on its public page on ' + capd() + '. Offers shown only in store, by address or to existing customers are not captured.' : 'The rival’s prices are the ones you entered.', 'Only the next 12 months of profit are counted, and the rival is assumed not to move again.']; }
  function synthR() { var sig = respondSignals(); return synthView(sig, '', 'Each finding comes from the rival’s page and the 5,000 scenarios. Untick any you do not want in the memo.'); }


  /* ====================================================================
     MARKETING BUDGET
     ==================================================================== */
  function budgetInit() { var d = TD[S.ind].budget; S.B = { split: d.plan.join(' / '), R: [d.rng[0][1], d.rng[3][1], d.rng[6][1]], m: [d.rng[1][1], d.rng[4][1], d.rng[7][1]], b: [d.rng[2][1], d.rng[5][1], d.rng[8][1]], fade: 'med', E: null }; }
  function B() { if (!S.B) budgetInit(); return S.B; }
  function budgetCfg() {
    var b = B(), u = UNC[S.unc] * 1.2, sh = { slow: 0.08, med: 0, fast: -0.1 }[b.fade], rng = [], r;
    for (r = 0; r < 3; r++) { var bt = Math.min(0.9, Math.max(0.3, b.b[r] + sh)); rng.push([b.R[r] * (1 - 1.2 * u), b.R[r], b.R[r] * (1 + 1.5 * u)], [b.m[r] * (1 - u), b.m[r], Math.min(0.9, b.m[r] * (1 + u))], [Math.max(0.3, bt - 0.5 * u), bt, Math.min(0.95, bt + 0.4 * u)]); }
    return { routes: TD[S.ind].budget.routes, plan: b.split.split(' / ').map(Number), rng: rng };
  }
  function budgetChecks() { var b = B(), o = [], r; for (r = 0; r < 3; r++) { if (!(b.R[r] > 0)) o.push('Sales for each channel must be above zero.'); if (!(b.m[r] >= 0.02 && b.m[r] <= 0.9)) o.push('Margin must be between 2% and 90%.'); } return o.filter(function (x, i, a) { return a.indexOf(x) === i; }); }
  function budgetRng() { return TD[S.ind].budget.routes; }
  function vBSetup() {
    var b = B(), names = budgetRng(), d = TD[S.ind].budget;
    var routes = names.map(function (n, r) { return '<div class="tw-rt"><b>' + esc(n) + '</b><small class="sg">' + esc(d.defs[r]) + '</small>' + numField('R' + r, 'Sales from ' + amt(50) + ' of spend here (' + U().sym + '\u00a0' + U().big + ')', b.R[r], '') + numField('m' + r, 'Profit margin on those sales (%)', Math.round(b.m[r] * 100), '', '1') + '</div>'; }).join('');
    var left = indChips() + '<div class="tw-f"><div class="lab2">2 · Your budget and current split</div><p class="note" style="margin:0 0 8px">Here the budget is ' + d.what + '. You have ' + amt(100) + ' to place across the three channels. This example keeps the total fixed.</p><label class="lab2" for="n-split" style="margin-top:6px">How you split it today (% for each channel, in the order listed below)</label><select id="n-split" class="inp" data-act="split">' + M.SPLITS.map(function (a) { var t = a.join(' / '); return '<option value="' + t + '"' + (t === b.split ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><p class="note" style="margin:6px 0 0">' + names.map(function (n, r) { return esc(n) + ' ' + amt(b.split.split(' / ')[r]); }).join(' · ') + '</p></div>' +
      '<div class="tw-f"><div class="lab2">3 · What each channel returns</div>' + routes + '</div>' +
      '<div class="tw-f"><div class="lab2">4 · How quickly returns fade</div><div class="chp" role="group" aria-label="How quickly returns fade">' + [['slow', 'Slowly'], ['med', 'Normally'], ['fast', 'Quickly']].map(function (x) { return '<button type="button" data-act="fade" data-v="' + x[0] + '" aria-pressed="' + (b.fade === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: the more you spend on one channel, the less each extra ' + (U().sym === '$' ? 'dollar' : 'rupee') + ' brings back.</p></div>' +
      '<div class="tw-f"><div class="lab2">5 · How sure are you?</div>' + uncChips() + '</div>' + whoField(6);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Where should we spend our marketing budget?</p><div class="lab2" style="margin-top:14px">Channels it will compare</div><div class="tw-pills">' + names.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src"><li>' + pm('int') + '<span><b>Your numbers</b><small>Sales and margin for each channel, and your current split.</small></span></li><li>' + pm('asm') + '<span><b>Your assumptions</b><small>How quickly returns fade, and how sure you are, as ranges.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>5,000 scenarios, each with its own best split</li><li>How your current split compares with the best one</li><li>The spend at which each channel stops being worth it</li><li>A draft decision memo and actions waiting for you</li></ul><p class="note" style="margin:14px 0 0">The starting numbers are illustrative for ' + esc(lcFirst(TD[S.ind].co)) + '. Change them to your own.</p></div>';
    var bad = budgetChecks();
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function bRows() {
    var b = B(), c = budgetCfg(), names = budgetRng(), rows = [{ l: 'Budget to place', v: amt(100), t: 'int', ok: true }, { l: 'Current split', v: b.split + ' (% of budget)', t: 'int', ok: true }];
    names.forEach(function (n, r) {
      rows.push({ l: n + ': sales from ' + amt(50) + ' of spend', v: amt(Math.round(b.R[r])) + ' (range ' + Math.round(c.rng[r * 3][0]) + ' to ' + Math.round(c.rng[r * 3][2]) + ')', t: 'int', ok: b.R[r] > 0, msg: 'Above zero' });
      rows.push({ l: n + ': margin', v: Math.round(b.m[r] * 100) + '% (range ' + Math.round(c.rng[r * 3 + 1][0] * 100) + '% to ' + Math.round(c.rng[r * 3 + 1][2] * 100) + '%)', t: 'int', ok: b.m[r] >= 0.02 && b.m[r] <= 0.9, msg: '2% to 90%' });
    });
    rows.push({ l: 'How quickly returns fade', v: { slow: 'Slowly', med: 'Normally', fast: 'Quickly' }[b.fade], t: 'asm', ok: true });
    return rows;
  }
  function vBCollect() {
    var rows = bRows(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">The workflow reads every number you gave, labels where it came from and checks it makes sense.</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading your inputs' : 'Check and collect inputs') + '</button>' + (done ? '<p class="tw-note" style="margin-top:14px">Change a number? Go back to step 1, then collect again.</p>' : '');
    var right = collectTable(rows) + '<div class="tw-card gap"><div class="lab2">Not collected here</div><ul class="tw-g"><li>' + pm('asm') + TD[S.ind].budget.evidence.charAt(0).toUpperCase() + TD[S.ind].budget.evidence.slice(1) + '. That would replace the sales and margin numbers you typed with measured ones.</li><li>' + pm('asm') + 'Rivals’ spend. A live engagement can add public sources on competitor marketing.</li></ul></div>';
    return { left: left, right: right, ok: done, why: 'Collect the inputs to continue.', n: rows.length };
  }
  function drawScatter(cv, E, upto) {
    var ctx = cv.getContext('2d'), r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== w * r) { cv.width = w * r; cv.height = h * r; }
    ctx.setTransform(r, 0, 0, r, 0, 0); var ml = 40, mr = 10, mt = 10, mb = 34, i;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.font = '11.5px Inter, sans-serif'; ctx.fillStyle = '#697580'; ctx.strokeStyle = '#E6E9EB';
    [0, 25, 50, 75, 100].forEach(function (t) { var x = ml + t / 100 * (w - ml - mr), y = h - mb - t / 100 * (h - mt - mb); ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(t, x, h - mb + 15); ctx.textAlign = 'right'; ctx.fillText(t, ml - 6, y + 4); });
    ctx.textAlign = 'center'; ctx.fillText(budgetRng()[1] + ', ' + U().sym + ' ' + U().big, (ml + w - mr) / 2, h - 5);
    ctx.save(); ctx.translate(11, (mt + h - mb) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(budgetRng()[0] + ', ' + U().sym + ' ' + U().big, 0, 0); ctx.restore();
    var col = ['#172B3A', '#557C78', '#A6B0B8'], n = Math.round(upto * E.N), seed = 3, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (i = 0; i < n; i++) { var a0 = E.optA[i * 3], a1 = E.optA[i * 3 + 1], a2 = E.optA[i * 3 + 2], wn = a1 > a0 && a1 >= a2 ? 1 : a2 > a0 && a2 > a1 ? 2 : 0; ctx.globalAlpha = .42; ctx.fillStyle = col[wn]; ctx.beginPath(); ctx.arc(ml + a1 / 100 * (w - ml - mr) + (rnd() - .5) * 2.4, h - mb - a0 / 100 * (h - mt - mb) + (rnd() - .5) * 2.4, 2.2, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function vBAnalyse() {
    var b = B(), ran = S.done.run, run = S.running, names = budgetRng();
    var left = '<p class="tw-note">The workflow draws 5,000 possible futures from your ranges. In each one it finds the best way to split the budget. Then it compares those splits with yours.</p><button type="button" class="btn am" data-act="run"' + (ran || run ? ' disabled' : '') + '>' + (ran ? 'Scenarios run' : run ? 'Running' : 'Run 5,000 scenarios') + '</button>' + (ran ? '<p class="tw-note" style="margin-top:14px">Change a number in step 1, then collect and run again.</p>' : '');
    var right;
    if (!ran && !run) right = '<div class="tw-card"><div class="lab2">Ready to run</div><p class="tw-q">Nothing has been calculated yet.</p><p class="note" style="margin:8px 0 0">Press the button to run the scenarios.</p></div>';
    else {
      var E = b.E;
      right = '<div class="tw-card">' + (run ? runBar('Drawing scenarios') : '<div class="lab2">' + pm('ana') + '5,000 possible futures</div>') + '<canvas class="tw-cv" id="tw-cv" aria-label="Scatter of the best split in each of 5,000 scenarios"></canvas><div class="lg"><span><i style="background:#172B3A"></i>' + esc(names[0]) + ' leads</span><span><i style="background:#557C78"></i>' + esc(names[1]) + ' leads</span><span><i style="background:#A6B0B8"></i>' + esc(names[2]) + ' leads</span></div><p class="note" style="margin:8px 0 0">Each dot is one possible future. Its position is the best split in that future, and its colour is the channel that gets the most.</p></div>';
      if (ran) right += '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Your split against the best one</div><table class="tw-t"><thead><tr><th></th><th>Split</th><th>Average contribution</th><th>Worst 10%</th></tr></thead><tbody><tr><td>Your current split</td><td>' + E.planSplit + '</td><td>' + cr(E.planMean) + '</td><td>' + cr(E.p10plan) + '</td></tr><tr class="hit"><td>Best split</td><td>' + E.best.join(' / ') + '</td><td>' + cr(E.bestMean) + '</td><td>' + cr(E.p10best) + '</td></tr></tbody></table><p class="note" style="margin:10px 0 0">The best split beats yours in <b>' + Math.round(E.beat * 100) + '%</b> of the 5,000 scenarios.</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Where more spend stops being worth it</div><table class="tw-t"><thead><tr><th>Channel</th><th>Spend beyond which more is not worth it</th><th>80% range</th></tr></thead><tbody>' + names.map(function (n, r) { var s = E.stop[r]; return '<tr><td>' + esc(n) + '</td><td>' + cr(s.p50) + '</td><td>' + Math.round(s.p10) + ' to ' + (s.p90 > 100 ? 'over 100' : Math.round(s.p90)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    return { left: left, right: right, ok: ran, why: 'Run the scenarios to continue.' };
  }
  function budgetSignals() {
    var E = B().E, names = budgetRng(), sig = [], same = E.best.join() === E.planSplit.split(' / ').join(), hg = E.hinge[0], KM = { R: 'the sales you expect from ' + amt(50) + ' of spend', m: 'margin', b: 'how fast returns fade' };
    var bestTxt = E.best.map(function (v, r) { return amt(v) + ' in ' + names[r].toLowerCase(); }).join(', ');
    sig.push({ id: 'b-best', head: same ? 'Your current split is already the best on your numbers' : 'The best split is ' + E.best.join(' / ') + ' (% of budget)', body: same ? 'No other split beats it on average.' : 'Placing ' + bestTxt + ' averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for your current ' + E.planSplit + '. It beats your split in ' + Math.round(E.beat * 100) + '% of 5,000 scenarios.', why: 'It rests on the sales and margin numbers you entered.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana', 'int', 'asm'], score: 5 });
    sig.push({ id: 'b-risk', head: 'In the worst 10% of scenarios the best split returns ' + cr(E.p10best), body: 'Your current split returns ' + cr(E.p10plan) + ' in the same worst 10%.', why: 'A split that is better on average is not always safer.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana'], score: 3 });
    sig.push({ id: 'b-stop', head: 'More spend stops being worth it at different points', body: names.map(function (n, r) { return n + ': near ' + cr(E.stop[r].p50); }).join('. ') + '.', why: 'Past that point, each extra dollar brings back less than a dollar.', src: [{ l: 'Stopping points from your ranges', u: null }], ev: ['ana', 'asm'], score: 4 });
    sig.push({ id: 'b-hinge', head: 'The answer depends most on ' + lcFirst(names[hg.r]) + ': ' + KM[hg.k], body: 'At the low or high end of its range, the best split moves by up to ' + Math.round(hg.dist) + ' points of the budget.', why: 'This is the number to replace with a measured one first.', src: [{ l: 'Sensitivity test on your ranges', u: null }], ev: ['ana', 'asm'], score: 4.5 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function budgetMemo() {
    var E = B().E, names = budgetRng(), sig = budgetSignals(), ks = keptOf(sig), hg = E.hinge[0], KM = { R: 'the sales you expect from ' + amt(50) + ' of spend', m: 'margin', b: 'how fast returns fade' };
    var same = E.best.join() === E.planSplit.split(' / ').join();
    return { q: 'Where should we spend our marketing budget?', who: S.who.trim(), rec: same ? 'Keep your current split of ' + E.planSplit + '.' : 'Place ' + E.best.map(function (v, r) { return amt(v) + ' in ' + names[r].toLowerCase(); }).join(', ').replace(/, ([^,]*)$/, ' and $1') + '.', trade: same ? 'No other split beats yours on average.' : 'It averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for your current ' + E.planSplit + ' split. It beats your split in ' + Math.round(E.beat * 100) + '% of 5,000 scenarios.', unc: 'The answer depends most on ' + lcFirst(names[hg.r]) + ': ' + KM[hg.k] + '. At the low or high end of its range, the best split moves by up to ' + Math.round(hg.dist) + ' points of the budget.', next: 'Replace the numbers you typed with ' + TD[S.ind].budget.evidence + ', then run it again.', ks: ks, top: null, sig: sig };
  }
  function budgetMd(M2) { var b = B(); return mdBase('Marketing budget brief', M2, ['Budget: ' + amt(100) + '. Current split: ' + b.split + '.', 'Sales from ' + amt(50) + ' of spend: ' + budgetRng().map(function (n, r) { return n + ' ' + amt(Math.round(b.R[r])); }).join(', ') + '. Margins: ' + b.m.map(function (x) { return Math.round(x * 100) + '%'; }).join(', ') + '.', 'Returns fade: ' + { slow: 'slowly', med: 'normally', fast: 'quickly' }[b.fade] + '. Ranges: ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc] + '.'], ['Sales, margin and fade numbers are your inputs and assumptions, not measured results.', 'Each channel is modelled as an independent curve, so this is the best split inside the model, not a forecast.']); }

  /* ====================================================================
     WEBSITE FROM DISCOVERY TO CHECKOUT
     The rivals here are labels. The page cannot visit a site, so the feature table starts as an illustrative example and is changed by the person using it.
     ==================================================================== */
  var EFF = { L: 'Low', M: 'Medium', H: 'High' }, WT = { L: 1, M: 2, H: 3 };
  function JD() { return TD[S.ind].journey; }
  function jInit() {
    var d = JD(), v = {};
    d.stages.forEach(function (st) { st.f.forEach(function (f) { v[f.id] = [f.y, f.a, f.b]; }); });
    S.J = { names: ['Your site', 'Rival A', 'Rival B'], v: v, edited: false, on: { disc: true, dec: true, chk: true }, E: null };
  }
  function J() { if (!S.J) jInit(); return S.J; }
  function jStages() { var j = J(); return JD().stages.filter(function (st) { return j.on[st.k]; }); }
  function jChecks() {
    var j = J(), out = [];
    if (!jStages().length) out.push('Choose at least one stage to compare.');
    if (!j.names[1].trim() || !j.names[2].trim()) out.push('Give each rival a name.');
    jStages().forEach(function (st) { st.f.forEach(function (f) { if (f.num && !(j.v[f.id][0] > 0 && j.v[f.id][1] > 0 && j.v[f.id][2] > 0)) out.push('Enter the number of steps for each site.'); }); });
    return out;
  }
  function vJSetup() {
    var d = JD(), j = J(), bad = jChecks();
    var stg = d.stages.map(function (st) { return '<label class="tw-ck"><input type="checkbox" data-act="jstage" data-v="' + st.k + '"' + (j.on[st.k] ? ' checked' : '') + '><span><b>' + esc(st.n) + '</b><small>' + esc(st.sub) + '</small></span></label>'; }).join('');
    var rows = jStages().map(function (st) {
      return '<tr class="stg"><th colspan="4">' + esc(st.n) + '</th></tr>' + st.f.map(function (f) {
        return '<tr><td>' + esc(f.l) + '</td>' + [0, 1, 2].map(function (c) {
          var val = j.v[f.id][c], al = esc(f.l) + ', ' + esc(j.names[c]);
          return '<td>' + (f.num ? '<input type="number" class="inp jn" min="1" step="1" inputmode="numeric" data-act="jf" data-id="' + f.id + '" data-c="' + c + '" value="' + val + '" aria-label="' + al + '">' : '<input type="checkbox" data-act="jf" data-id="' + f.id + '" data-c="' + c + '"' + (val ? ' checked' : '') + ' aria-label="' + al + '">') + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }).join('');
    var head = '<tr><th>Feature</th>' + j.names.map(function (n) { return '<th class="c">' + esc(n.length > 10 ? n.slice(0, 9) + '…' : n) + '</th>'; }).join('') + '</tr>';
    var left = indChips() +
      '<div class="tw-f"><div class="lab2">2 · The sites to compare</div><p class="note" style="margin:0 0 8px">Your site and two rivals. Rival names are labels. This page cannot visit a site, so it does not read them.</p><div class="tw-sel"><label>Rival 1<input type="text" class="inp" data-act="jname" data-c="1" maxlength="24" value="' + esc(j.names[1]) + '"></label><label>Rival 2<input type="text" class="inp" data-act="jname" data-c="2" maxlength="24" value="' + esc(j.names[2]) + '"></label></div></div>' +
      '<div class="tw-f"><div class="lab2">3 · Journey stages to compare</div>' + stg + '</div>' +
      '<details class="tw-det" open><summary class="tw-sum">4 · What each site has</summary><p class="note" style="margin:8px 0">' + pm(j.edited ? 'int' : 'asm') + (j.edited ? 'You have changed the table, so it now holds your entries.' : 'Pre-filled with an illustrative example, not an audit of any real site. Tick or change the boxes to match the sites you care about.') + '</p><div class="tw-sc"><table class="tw-t jt"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' + (j.edited ? '<p class="note" style="margin:8px 0 0"><button type="button" class="lk2 bt" data-act="jreset">Go back to the illustrative example</button></p>' : '') + '</details>' + whoField(5);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">How does our website compare with rivals, from discovery to checkout, and what should we change first?</p>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src"><li>' + pm(j.edited ? 'int' : 'asm') + '<span><b>The features each site has</b><small>' + (j.edited ? 'Your entries.' : 'An illustrative example until you change it.') + ' Rivals are not visited from this page.</small></span></li><li>' + pm('asm') + '<span><b>Effort and impact scores</b><small>Our default estimates for each feature, to be replaced with your team’s.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>The features at each stage, side by side</li><li>Where rivals are ahead of you</li><li>Changes ranked by effort and likely impact</li><li>A draft decision memo: what to build first</li></ul>' +
      '<p class="note" style="margin:14px 0 0">In a live engagement each rival site is visited with a browser and checked by hand. Every observation carries its page address and date, and anything we could not see is marked as not read.</p></div>';
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function jKind() { return J().edited ? 'int' : 'ill'; }
  function jRows() {
    var j = J(), rows = [], kind = jKind(), cnt = function (st, c) { var n = 0, t = 0; st.f.forEach(function (f) { if (!f.num) { t++; if (j.v[f.id][c]) n++; } }); return n + ' of ' + t; };
    jStages().forEach(function (st) { rows.push({ l: st.n + ': features present', v: j.names.map(function (nm, c) { return esc(nm) + ' ' + cnt(st, c); }).join(', '), t: kind, ok: true }); });
    jStages().forEach(function (st) { st.f.forEach(function (f) { if (f.num) rows.push({ l: JD().steps, v: j.names.map(function (nm, c) { return esc(nm) + ' ' + j.v[f.id][c]; }).join(', '), t: kind, ok: j.v[f.id][0] > 0 && j.v[f.id][1] > 0 && j.v[f.id][2] > 0, msg: 'Must be above zero' }); }); });
    rows.push({ l: 'Where the table came from', v: j.edited ? 'Entered by you. No site was visited.' : 'An illustrative example. It is not an audit of any real site.', t: kind, ok: true });
    rows.push({ l: 'Effort and impact scores', v: 'Our default estimates for each feature', t: 'asm', ok: true });
    return rows;
  }
  function vJCollect() {
    var rows = jRows(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">The workflow reads the table you set up, labels where each part came from and checks it. It does not visit any site from this page.</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading the table' : 'Check and collect the table') + '</button>' + (done ? '<p class="tw-note" style="margin-top:14px">Change something? Go back to step 1, then collect again.</p>' : '');
    var right = collectTable(rows) + '<div class="tw-card gap"><div class="lab2">Not collected here</div><ul class="tw-g"><li>' + pm('asm') + 'A visit to each site as a customer would see it. A live engagement does this with a browser and by hand, and marks what it could not see.</li><li>' + pm('asm') + 'What changed on rival sites recently. That needs a capture every month.</li><li>' + pm('asm') + 'How customers behave on your site. That needs your analytics, and would show which gaps cost you sales.</li></ul></div>';
    return { left: left, right: right, ok: done, why: 'Collect the table to continue.', n: rows.length };
  }
  function jCompute() {
    var j = J(), gaps = [], lead = [], stages = [];
    jStages().forEach(function (st) {
      var g = 0, l = 0;
      st.f.forEach(function (f) {
        var y = j.v[f.id][0], a = j.v[f.id][1], b = j.v[f.id][2];
        if (f.num) {
          var best = Math.min(a, b);
          if (y > best) { gaps.push({ f: f, st: st, num: true, you: y, best: best, who: a <= b ? [1] : [2], n: (a < y ? 1 : 0) + (b < y ? 1 : 0) }); g++; }
          else if (y < best) { lead.push({ f: f, st: st, num: true }); l++; }
        } else {
          var n = (a ? 1 : 0) + (b ? 1 : 0);
          if (!y && n) { gaps.push({ f: f, st: st, n: n, who: [a ? 1 : 0, b ? 2 : 0].filter(Boolean) }); g++; }
          else if (y && !n) { lead.push({ f: f, st: st }); l++; }
        }
      });
      stages.push({ st: st, gaps: g, lead: l });
    });
    gaps.sort(function (p, q) { return (WT[q.f.imp] - WT[p.f.imp]) || (WT[p.f.eff] - WT[q.f.eff]) || (q.n - p.n); });
    return { gaps: gaps, lead: lead, stages: stages };
  }
  function whoNames(g) { var j = J(); return g.n === 2 ? 'Both rivals' : j.names[g.who[0]]; }
  function jList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function jBullets(E) {
    var j = J();
    return E.stages.map(function (s) {
      var gs = E.gaps.filter(function (g) { return g.st === s.st; }), ls = E.lead.filter(function (g) { return g.st === s.st; }), parts = [];
      var both = gs.filter(function (g) { return !g.num && g.n === 2; });
      if (both.length) parts.push('Both rivals offer ' + jList(both.map(function (g) { return lcFirst(g.f.l); })) + ', and you offer ' + (both.length > 1 ? 'none of them' : 'neither') + '.');
      [1, 2].forEach(function (c) { var one = gs.filter(function (g) { return !g.num && g.n === 1 && g.who[0] === c; }); if (one.length) parts.push(j.names[c] + ' offers ' + jList(one.map(function (g) { return lcFirst(g.f.l); })) + ', and you do not.'); });
      gs.filter(function (g) { return g.num; }).forEach(function (g) { parts.push(lcFirst(g.f.l) + ': you need ' + g.you + ', and ' + j.names[g.who[0]] + ' needs ' + g.best + '.'); });
      var lf = ls.filter(function (g) { return !g.num; });
      if (lf.length) parts.push('You lead on ' + jList(lf.map(function (g) { return lcFirst(g.f.l); })) + '.');
      return { n: s.st.n, text: parts.length ? parts.join(' ') : 'No gaps against either rival.' };
    });
  }
  function jCell(f, c) { var v = J().v[f.id][c]; return f.num ? String(v) : (v ? '✓' : '–'); }
  function vJAnalyse() {
    var j = J(), ran = S.done.run, run = S.running;
    var left = '<p class="tw-note">The workflow goes through each stage in order and lines the three sites up feature by feature. A gap is a feature a rival has and you do not, or a step count where you need more steps. Nothing is guessed.</p><button type="button" class="btn am" data-act="run"' + (ran || run ? ' disabled' : '') + '>' + (ran ? 'Compared' : run ? 'Comparing' : 'Compare the sites') + '</button>' + (ran ? '<p class="tw-note" style="margin-top:14px">Change a box in step 1, then collect and compare again.</p>' : '');
    var right;
    if (run) right = '<div class="tw-card">' + runBar('Comparing features') + '</div>';
    else if (!ran) right = '<div class="tw-card"><div class="lab2">Ready to compare</div><p class="tw-q">Nothing has been compared yet.</p><p class="note" style="margin:8px 0 0">Press the button to line the sites up stage by stage.</p></div>';
    else {
      var E = j.E, trs = '';
      jStages().forEach(function (st) {
        trs += '<tr class="stg"><th colspan="4">' + esc(st.n) + '</th></tr>';
        st.f.forEach(function (f) {
          var y = j.v[f.id][0], a = j.v[f.id][1], b = j.v[f.id][2], gap = f.num ? y > Math.min(a, b) : (!y && (a || b)), lead = f.num ? y < Math.min(a, b) : (y && !a && !b);
          trs += '<tr><td>' + esc(f.l) + '</td>' + [0, 1, 2].map(function (c) { return '<td class="c' + (c === 0 ? (gap ? ' lo' : lead ? ' hi' : '') : '') + '">' + jCell(f, c) + '</td>'; }).join('') + '</tr>';
        });
      });
      right = '<div class="tw-card"><div class="lab2">' + pm(j.edited ? 'int' : 'asm') + 'Features by journey stage <span class="tagh" style="margin-left:6px">' + (j.edited ? 'Your entries' : 'Illustrative example') + '</span></div><div class="tw-sc"><table class="tw-t jt"><thead><tr><th>Feature</th>' + j.names.map(function (n) { return '<th class="c">' + esc(n) + '</th>'; }).join('') + '</tr></thead><tbody>' + trs + '</tbody></table></div><p class="note" style="margin:10px 0 0">Red: a gap on your site. Green: you lead. ✓ means the site has it, – means it does not.</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Where rivals are ahead</div><ul class="lst">' + jBullets(E).map(function (b) { return '<li><b>' + esc(b.n) + ':</b> ' + esc(b.text) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'What to change first</div>' + (E.gaps.length ? '<div class="tw-sc"><table class="tw-t"><thead><tr><th>Feature</th><th>Stage</th><th>Offered by</th><th>Effort</th><th>Likely impact</th></tr></thead><tbody>' + E.gaps.map(function (g, i) { return '<tr' + (i === 0 ? ' class="hit"' : '') + '><td>' + esc(g.num ? lcFirst(g.f.l).replace(/^./, function (m) { return m.toUpperCase(); }) + ': ' + g.you + ' against ' + g.best : g.f.l) + '</td><td>' + esc(g.st.n) + '</td><td>' + esc(whoNames(g)) + '</td><td>' + EFF[g.f.eff] + '</td><td>' + EFF[g.f.imp] + '</td></tr>'; }).join('') + '</tbody></table></div><p class="note" style="margin:10px 0 0">Ranked by likely impact, then by how little effort it takes. Effort and impact are our default estimates for each feature. Your team would replace them.</p>' : '<p class="tw-q" style="font-size:16px">No gaps against either rival on the stages you chose.</p>') + '</div>';
    }
    return { left: left, right: right, ok: ran, why: 'Compare the sites to continue.' };
  }
  function jSignals() {
    var j = J(), E = j.E, sig = [], src = [{ l: j.edited ? 'The table you entered' : 'An illustrative example table', u: null }];
    var worst = E.stages.slice().sort(function (a, b) { return b.gaps - a.gaps; })[0];
    if (!E.gaps.length) {
      sig.push({ id: 'j-none', head: 'You match or lead both rivals on the stages you chose', body: 'No feature is missing from your site that a rival has, and no step count is higher.', why: 'The next gain is more likely to come from how well each feature works than from adding features.', src: src, ev: [jKind()], score: 5 });
      return sig;
    }
    var top = E.gaps[0];
    sig.push({ id: 'j-top', head: 'Start with: ' + lcFirst(top.f.l), body: (top.num ? 'You need ' + top.you + ' against ' + top.best + ' at ' + j.names[top.who[0]] + '. ' : whoNames(top) + ' offer' + (top.n === 2 ? '' : 's') + ' it and you do not. ') + 'Effort is ' + EFF[top.f.eff].toLowerCase() + ' and likely impact is ' + EFF[top.f.imp].toLowerCase() + ', on our default scores.', why: 'It ranks first by impact, then by how little effort it takes.', src: src.concat([{ l: 'Default effort and impact scores', u: null }]), ev: [jKind(), 'asm'], score: 5 });
    sig.push({ id: 'j-stage', head: 'The biggest gap is at ' + worst.st.n.toLowerCase(), body: worst.gaps + ' feature' + (worst.gaps === 1 ? '' : 's') + ' ' + (worst.gaps === 1 ? 'is' : 'are') + ' missing or behind there' + (worst.lead ? ', and you lead on ' + worst.lead + '.' : '.'), why: 'A gap at this stage may lose customers before they reach the next one.', src: src, ev: [jKind(), 'ana'], score: 4.6 });
    var quick = E.gaps.filter(function (g) { return g.f.eff === 'L' && g.f.imp !== 'L'; });
    if (quick.length) sig.push({ id: 'j-quick', head: quick.length + ' quick win' + (quick.length === 1 ? '' : 's') + ': low effort, with real impact', body: jList(quick.slice(0, 4).map(function (g) { return lcFirst(g.f.l); })) + '.', why: 'These can be shipped soon and show whether closing gaps moves sales.', src: src.concat([{ l: 'Default effort and impact scores', u: null }]), ev: [jKind(), 'asm'], score: 4.2 });
    var steps = E.gaps.filter(function (g) { return g.num; })[0];
    if (steps) sig.push({ id: 'j-steps', head: 'Your checkout takes more steps than a rival’s', body: 'You need ' + steps.you + ', and ' + j.names[steps.who[0]] + ' needs ' + steps.best + '.', why: 'Each extra step is a point where customers can stop.', src: src, ev: [jKind(), 'ana'], score: 4 });
    var lf = E.lead.filter(function (g) { return !g.num; });
    if (lf.length) sig.push({ id: 'j-lead', head: 'You lead on ' + lf.length + ' feature' + (lf.length === 1 ? '' : 's'), body: jList(lf.slice(0, 4).map(function (g) { return lcFirst(g.f.l); })) + '.', why: 'These are strengths to protect, and to say more about.', src: src, ev: [jKind(), 'ana'], score: 3 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function jMemo() {
    var j = J(), E = j.E, sig = jSignals(), ks = keptOf(sig), top = E.gaps[0];
    var rec = top ? 'Start with: ' + lcFirst(top.f.l) + '.' : 'Keep your website as it is for now. You match or lead both rivals.';
    var trade = top ? (top.num ? 'You need ' + top.you + ' steps against ' + top.best + ' at ' + j.names[top.who[0]] + '. ' : whoNames(top) + ' already offer' + (top.n === 2 ? '' : 's') + ' it. ') + 'On our default scores it is the highest-impact gap with the least effort. The next two are ' + (E.gaps.slice(1, 3).map(function (g) { return lcFirst(g.f.l); }).join(' and ') || 'none') + '.' : 'No gap shows on the stages you chose.';
    return { q: 'How does our website compare with rivals, from discovery to checkout, and what should we change first?', who: S.who.trim(), rec: rec, trade: trade, unc: 'The table is ' + (j.edited ? 'your own entries, not a visit to the sites' : 'an illustrative example, not an audit of any site') + ', and effort and impact are default estimates. Confirm them before you build.', next: 'Check the top three gaps on the real sites and in your own analytics, then build the first one and measure it.', ks: ks, top: null, sig: sig, judge: ['Whether each gap matters to your customers, or is only a difference. Your analytics and customer research show this.', 'The effort and impact scores. Your team’s estimates replace our defaults.', 'Which change to make first, given your costs and how quickly each can ship.'] };
  }
  function jMd(M2) {
    var j = J();
    return mdBase('Website comparison brief', M2, ['Sites: ' + j.names.join(', ') + '. Stages: ' + jStages().map(function (s) { return s.n; }).join(', ') + '.', 'Feature table: ' + (j.edited ? 'entered by the user.' : 'an illustrative example.')], jAssum()) + '';
  }
  function jAssum() { return [J().edited ? 'The feature table is your own entries. No site was visited.' : 'The feature table is an illustrative example. It is not an audit of any real site.', 'Effort and impact are default estimates for each feature, not measurements.', 'How customers behave on each site was not measured.']; }
  function synthJ() { var sig = jSignals(); return synthView(sig, '', 'Each finding comes from the comparison. Untick any you do not want in the memo.'); }

  /* ====================================================================
     CUSTOMER GROUPS
     Groups come from k-means on the columns you choose, run in your browser. The example file is generated here and is illustrative.
     ==================================================================== */
  var PAL = ['#172B3A', '#557C78', '#E8A33D', '#9A5B3C', '#7C8FA3'];
  function CD() { return TD[S.ind].customers; }
  function rivalsOf() { return ofd().rivals; }
  function cInit() { S.C = { src: 'example', pick: CD().pick.slice(), k: 4, riv: rivalsOf().map(function (r) { return r.id; }), file: null, err: '', E: null, names: {}, needs: {}, mine: {} }; }
  function C() { if (!S.C) cInit(); return S.C; }
  function colFor(c) { return c; }
  function clampCol(c, v) {
    var u = c.u, k = c.k;
    if (u === '$') return k === 'paid' ? Math.max(1, Math.round(v * 100) / 100) : Math.max(1, Math.round(v));
    if (u === 'people' || u === 'lines' || u === 'seats' || u === 'nights') return Math.max(1, Math.round(v));
    if (u === '%') return Math.min(100, Math.max(0, Math.round(v)));
    if (u === 'years') return Math.max(0.1, Math.round(v * 10) / 10);
    if (u === 'logins') return Math.max(0, Math.round(v * 10) / 10);
    return Math.max(0, Math.round(v));
  }
  function genExample() {
    var d = CD(), rnd = M.mulberry32(42), N = 2000, rows = [], truth = [], i, j;
    function nrm() { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    d.arch.forEach(function (a, ai) {
      var n = Math.round(a.share * N);
      for (i = 0; i < n; i++) { var r = []; for (j = 0; j < d.cols.length; j++) { var c = d.cols[j]; r.push(c.bin ? (rnd() < a.mu[j] ? 1 : 0) : clampCol(c, a.mu[j] + a.sd[j] * nrm())); } rows.push(r); truth.push(ai); }
    });
    var idx = rows.map(function (_, q) { return q; }); for (i = idx.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return { cols: d.cols, rows: idx.map(function (q) { return rows[q]; }), name: 'Example file', n: rows.length };
  }
  function cData() {
    var c = C();
    if (c.src === 'upload') return c.file;
    if (!S._ex) S._ex = {};
    if (!S._ex[S.ind]) S._ex[S.ind] = genExample();
    return S._ex[S.ind];
  }
  function parseCSV(text) {
    var first = text.split(/\r?\n/)[0] || '', del = [',', ';', '\t'].map(function (d) { return [d, first.split(d).length]; }).sort(function (a, b) { return b[1] - a[1]; })[0][0];
    var rows = [], row = [], cur = '', q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text.charAt(i);
      if (q) { if (ch === '"') { if (text.charAt(i + 1) === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === del) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text.charAt(i + 1) === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; if (rows.length > 50001) break; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function toNum(s) { if (s === undefined || s === null) return NaN; s = String(s).trim().replace(/^\$|%$/g, '').replace(/,/g, ''); return s === '' ? NaN : Number(s); }
  function readFile(file) {
    var c = C();
    if (!file) return;
    if (file.size > 3e6) { c.err = 'That file is over 3 MB. Please use a smaller extract.'; c.file = null; render(true); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var all = parseCSV(String(fr.result)), hdr = all[0] || [], body = all.slice(1, 50001), cols = [], j;
      for (j = 0; j < hdr.length; j++) {
        var vals = body.map(function (r) { return toNum(r[j]); }), ok = vals.filter(function (v) { return !isNaN(v); }).length;
        if (body.length && ok / body.length >= 0.9) cols.push({ k: 'c' + j, l: String(hdr[j]).trim() || 'Column ' + (j + 1), u: '', j: j, vals: vals });
      }
      if (!body.length || cols.length < 2) { c.err = 'We could not find at least two numeric columns in that file. Check that the first row holds column names.'; c.file = null; c.E = null; render(true); return; }
      cols = cols.slice(0, 12);
      var rows = body.map(function (r, ri) { return cols.map(function (cc) { return cc.vals[ri]; }); });
      cols.forEach(function (cc) { delete cc.vals; });
      c.file = { cols: cols, rows: rows, name: file.name, n: rows.length }; c.err = '';
      c.pick = cols.filter(function (cc) { return !/(^|[\s_])id$|^id[\s_]|customer.?id|zip|postcode|phone/i.test(cc.l); }).slice(0, 4).map(function (cc) { return cc.k; });
      if (c.pick.length < 2) c.pick = cols.slice(0, 2).map(function (cc) { return cc.k; });
      c.E = null; c.names = {}; c.needs = {}; c.mine = {}; resetRun(); render(true);
    };
    fr.onerror = function () { c.err = 'That file could not be read.'; render(true); };
    fr.readAsText(file);
  }
  function cChecks() {
    var c = C(), out = [], d = cData();
    if (c.src === 'upload' && !c.file) out.push(c.err || 'Choose a file to upload.');
    if (d && c.pick.length < 2) out.push('Choose at least two things to group customers by.');
    if (d && d.n < 60) out.push('The file needs at least 60 rows.');
    if (!c.riv.length) out.push('Choose at least one rival.');
    return out;
  }
  function colsPicked() { var d = cData(); return d.cols.filter(function (cc) { return C().pick.indexOf(cc.k) >= 0; }); }
  function cmeta(cc) { return cc.l; }
  function vCSetup() {
    var d = CD(), c = C(), data = cData(), bad = cChecks(), ex = c.src === 'example';
    var src = '<div class="chp" role="group" aria-label="Customer data">' + [['example', 'Use the example file'], ['upload', 'Upload my own file']].map(function (x) { return '<button type="button" data-act="csrc" data-v="' + x[0] + '" aria-pressed="' + (c.src === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (ex ? '<p class="note" style="margin:8px 0 0">' + pm('asm') + 'The example is ' + esc(d.file) + '. It is made up for this demo, so it is illustrative.</p>' : '<div class="tw-up"><label class="lab2" for="tw-file">A CSV file with column names in the first row</label><input type="file" id="tw-file" accept=".csv,text/csv,text/plain" data-act="cfile">' + (c.file ? '<p class="note" style="margin:8px 0 0">' + pm('int') + esc(c.file.name) + ': ' + grp(c.file.n) + ' rows, ' + c.file.cols.length + ' numeric columns found.</p>' : '') + (c.err ? '<p class="note err" style="margin:8px 0 0">' + esc(c.err) + '</p>' : '') + '<p class="note" style="margin:8px 0 0">The file is read in your browser and is not sent anywhere. Only numeric columns are used.</p></div>');
    var cols = data ? '<div class="tw-f"><div class="lab2">3 · What to group customers by</div>' + data.cols.filter(function (cc) { return !cc.bin; }).concat(data.cols.filter(function (cc) { return cc.bin; })).map(function (cc) { return '<label class="tw-ck"><input type="checkbox" data-act="ccol" data-v="' + cc.k + '"' + (c.pick.indexOf(cc.k) >= 0 ? ' checked' : '') + '><span><b>' + esc(cc.l) + '</b></span></label>'; }).join('') + '<div class="lab2" style="margin-top:12px">Number of groups</div><div class="chp" role="group" aria-label="Number of groups">' + [[0, 'Let the workflow choose'], [3, '3'], [4, '4'], [5, '5']].map(function (x) { return '<button type="button" data-act="ck" data-v="' + x[0] + '" aria-pressed="' + (c.k === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' : '';
    var riv = '<div class="tw-f"><div class="lab2">4 · Rivals to compare</div><p class="note" style="margin:0 0 8px">Two rivals are pre-filled with real offers, captured ' + capd() + '.</p>' + rivalsOf().map(function (r) { return '<label class="tw-ck"><input type="checkbox" data-act="criv" data-v="' + r.id + '"' + (c.riv.indexOf(r.id) >= 0 ? ' checked' : '') + '><span><b>' + esc(r.name) + '</b><small>' + r.offers.length + ' offers read from its public ' + esc(r.page.toLowerCase()) + ' page</small></span></label>'; }).join('') + '</div>';
    var left = indChips() + '<div class="tw-f"><div class="lab2">2 · Your customer data</div>' + src + '</div>' + cols + riv + whoField(5);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Which customer groups do we have, what does each need, and how should we serve them?</p>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src"><li>' + pm(ex ? 'asm' : 'int') + '<span><b>Your customer data</b><small>Grouped by behaviour, so the groups come from what customers do, not from a guess.</small></span></li><li>' + pm('pub') + '<span><b>Rival offers</b><small>Each offer matched to the customer need it is aimed at, from its wording.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>Customer groups, sized and described</li><li>What each group values</li><li>What rivals offer each group</li><li>A draft decision memo: where to focus, and what to offer each group</li></ul>' +
      '<p class="note" style="margin:14px 0 0">Groups are found by putting similar customers together, and the names are ours. ' + (ex ? 'The example file is illustrative. ' : '') + 'The rivals’ offers are real, captured ' + capd() + '.</p></div>';
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function cRows() {
    var c = C(), d = cData(), rows = [], pk = colsPicked(), rv = rivalsOf().filter(function (r) { return c.riv.indexOf(r.id) >= 0; }), bad = cChecks();
    rows.push({ l: 'Customer file', v: c.src === 'example' ? 'Example file, ' + grp(d.n) + ' rows. Made up for this demo' : esc(d.name) + ', ' + grp(d.n) + ' rows', t: c.src === 'example' ? 'ill' : 'int', ok: d.n >= 60, msg: 'At least 60 rows' });
    rows.push({ l: 'Grouped by', v: pk.map(function (x) { return esc(x.l); }).join(', '), t: 'int', ok: pk.length >= 2, msg: 'Choose at least two' });
    var miss = d.rows.filter(function (r) { return pk.some(function (x) { return isNaN(r[d.cols.indexOf(x)]); }); }).length;
    rows.push({ l: 'Rows with a missing value', v: miss ? grp(miss) + ' rows set aside' : 'None', t: 'ana', ok: true });
    rv.forEach(function (r) { rows.push({ l: 'Rival page: ' + r.name + ', ' + r.page, v: '<a href="' + r.url + '" target="_blank" rel="noopener">' + esc(r.url.replace('https://', '')) + '</a>, captured ' + capd(), t: 'pub', ok: true }); rows.push({ l: 'Rival offers read: ' + r.name, v: r.offers.length + ' offers, each with its wording', t: 'pub', ok: true }); });
    rows.push({ l: 'Which need each offer is aimed at', v: 'Matched from the offer’s wording, by us. You can check each match', t: 'ana', ok: true });
    return rows;
  }
  function vCCollect() {
    var rows = cRows(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">The workflow reads your file, sets aside any rows with a missing value, reads the rivals’ offers with their sources, and checks it all makes sense.</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading' : 'Read the data and check') + '</button>' + (done ? '<p class="tw-note" style="margin-top:14px">Change something? Go back to step 1, then collect again.</p>' : '');
    var right = collectTable(rows) + '<div class="tw-card gap"><div class="lab2">Not collected here</div><ul class="tw-g"><li>' + pm('asm') + 'What customers say they want. Groups come from behaviour in the file, not from surveys or reviews.</li><li>' + pm('asm') + 'Offers shown only in store, by address or to existing customers. The page shows one view.</li><li>' + pm('asm') + 'Whether customers in each group actually use the rivals’ offers.</li></ul></div>';
    return { left: left, right: right, ok: done, why: 'Collect the data to continue.', n: rows.length };
  }
  function kmeans(X, k, rnd, restarts) {
    var n = X.length, p = X[0].length, best = null, rs, i, j, g, it;
    function d2(a, b) { var s = 0, t; for (var q = 0; q < p; q++) { t = a[q] - b[q]; s += t * t; } return s; }
    for (rs = 0; rs < restarts; rs++) {
      var cen = [X[Math.floor(rnd() * n)].slice()];
      while (cen.length < k) {
        var dd = new Array(n), tot = 0, m;
        for (i = 0; i < n; i++) { m = 1e18; for (g = 0; g < cen.length; g++) { var s = d2(X[i], cen[g]); if (s < m) m = s; } dd[i] = m; tot += m; }
        var r = rnd() * tot, acc = 0, pick = n - 1;
        for (i = 0; i < n; i++) { acc += dd[i]; if (acc >= r) { pick = i; break; } }
        cen.push(X[pick].slice());
      }
      var asg = new Int16Array(n).fill(-1);
      for (it = 0; it < 60; it++) {
        var ch = 0, sums = [], cnt = new Array(k).fill(0);
        for (g = 0; g < k; g++) sums.push(new Array(p).fill(0));
        for (i = 0; i < n; i++) { var bg = 0, bd = 1e18; for (g = 0; g < k; g++) { var s2 = d2(X[i], cen[g]); if (s2 < bd) { bd = s2; bg = g; } } if (asg[i] !== bg) { asg[i] = bg; ch++; } cnt[bg]++; for (j = 0; j < p; j++) sums[bg][j] += X[i][j]; }
        for (g = 0; g < k; g++) if (cnt[g]) for (j = 0; j < p; j++) cen[g][j] = sums[g][j] / cnt[g];
        if (!ch) break;
      }
      var inertia = 0; for (i = 0; i < n; i++) inertia += d2(X[i], cen[asg[i]]);
      if (!best || inertia < best.inertia) best = { asg: asg, cen: cen, inertia: inertia };
    }
    return best;
  }
  function silhouette(X, asg, k, rnd) {
    var n = X.length, m = Math.min(400, n), idx = [], i, j, g, p = X[0].length;
    for (i = 0; i < m; i++) idx.push(Math.floor(rnd() * n));
    var tot = 0, used = 0;
    for (i = 0; i < m; i++) {
      var sums = new Array(k).fill(0), cnt = new Array(k).fill(0), a = idx[i];
      for (j = 0; j < m; j++) { if (j === i) continue; var b = idx[j], s = 0; for (g = 0; g < p; g++) { var t = X[a][g] - X[b][g]; s += t * t; } sums[asg[b]] += Math.sqrt(s); cnt[asg[b]]++; }
      var own = asg[a]; if (cnt[own] < 1) continue;
      var ai = sums[own] / cnt[own], bi = 1e18;
      for (g = 0; g < k; g++) if (g !== own && cnt[g]) bi = Math.min(bi, sums[g] / cnt[g]);
      if (bi === 1e18) continue;
      tot += (bi - ai) / Math.max(ai, bi); used++;
    }
    return used ? tot / used : 0;
  }
  function cCompute() {
    var c = C(), d = cData(), pk = colsPicked(), ci = pk.map(function (x) { return d.cols.indexOf(x); }), i, j, g;
    var rowsOk = d.rows.filter(function (r) { return ci.every(function (q) { return !isNaN(r[q]); }); });
    var mean = ci.map(function (q) { var s = 0; rowsOk.forEach(function (r) { s += r[q]; }); return s / rowsOk.length; });
    var sd = ci.map(function (q, jj) { var s = 0; rowsOk.forEach(function (r) { s += (r[q] - mean[jj]) * (r[q] - mean[jj]); }); return Math.sqrt(s / rowsOk.length) || 1; });
    var X = rowsOk.map(function (r) { return ci.map(function (q, jj) { return (r[q] - mean[jj]) / sd[jj]; }); });
    var rnd = M.mulberry32(5), res, k = c.k, sils = {};
    if (k) { res = kmeans(X, k, rnd, 8); res.sil = silhouette(X, res.asg, k, M.mulberry32(9)); }
    else { [3, 4, 5].forEach(function (kk) { var r = kmeans(X, kk, rnd, 6); r.sil = silhouette(X, r.asg, kk, M.mulberry32(9)); sils[kk] = r.sil; if (!res || r.sil > res.sil + 0.01) { res = r; k = kk; } }); }
    var size = new Array(k).fill(0), sum = []; for (g = 0; g < k; g++) sum.push(new Array(ci.length).fill(0));
    for (i = 0; i < rowsOk.length; i++) { size[res.asg[i]]++; for (j = 0; j < ci.length; j++) sum[res.asg[i]][j] += rowsOk[i][ci[j]]; }
    var order = size.map(function (s, gi) { return gi; }).sort(function (a, b) { return size[b] - size[a]; }), rank = {};
    order.forEach(function (gi, r) { rank[gi] = r; });
    var groups = order.map(function (gi) { return { n: size[gi], share: size[gi] / rowsOk.length, avg: sum[gi].map(function (s) { return s / size[gi]; }), z: sum[gi].map(function (s, jj) { return (s / size[gi] - mean[jj]) / sd[jj]; }), name: '', need: '', desc: '' }; });
    var asg = Array.prototype.map.call(res.asg, function (a) { return rank[a]; });
    /* name the groups: the example file has known profiles, so the nearest profile gives a name. An uploaded file gets numbered groups. */
    if (c.src === 'example') {
      var arch = CD().arch, pairs = [];
      groups.forEach(function (gr, gi) { arch.forEach(function (a, ai) { var s = 0; ci.forEach(function (q, jj) { var t = (gr.avg[jj] - a.mu[q]) / sd[jj]; s += t * t; }); pairs.push([Math.sqrt(s), gi, ai]); }); });
      pairs.sort(function (x, y) { return x[0] - y[0]; });
      var gu = {}, au = {};
      pairs.forEach(function (pr) { if (!gu[pr[1]] && !au[pr[2]] && pr[0] < 1.6) { gu[pr[1]] = 1; au[pr[2]] = 1; groups[pr[1]].name = arch[pr[2]].n; groups[pr[1]].need = arch[pr[2]].need; } });
    }
    groups.forEach(function (gr, gi) {
      if (!gr.name) gr.name = 'Group ' + (gi + 1);
      var hi = [], lo = [];
      gr.z.map(function (z, jj) { return [z, jj]; }).sort(function (a, b) { return Math.abs(b[0]) - Math.abs(a[0]); }).slice(0, 3).forEach(function (zz) { if (zz[0] >= 0.5) hi.push(pk[zz[1]].l.toLowerCase()); else if (zz[0] <= -0.5) lo.push(pk[zz[1]].l.toLowerCase()); });
      gr.desc = (hi.length ? 'Higher than average: ' + hi.join(', ') + '. ' : '') + (lo.length ? 'Lower: ' + lo.join(', ') + '.' : '');
      if (!gr.desc) gr.desc = 'Close to the average on the columns you chose.';
    });
    var pts = [], stepn = Math.max(1, Math.floor(rowsOk.length / 500)); for (i = 0; i < rowsOk.length; i += stepn) pts.push([rowsOk[i][ci[0]], rowsOk[i][ci[1]], asg[i]]);
    return { k: k, auto: !c.k, sil: res.sil, sils: sils, N: rowsOk.length, dropped: d.rows.length - rowsOk.length, groups: groups, pts: pts, pk: pk };
  }
  function cfmt(cc, v) { var u = cc.u; if (u === '$') return '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v < 20 ? 2 : 0)); var n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toString(); return cc.bin ? Math.round(v * 100) + '%' : n + (u ? ' ' + u : ''); }
  function gNeed(i) { var c = C(); return c.needs[i] !== undefined ? c.needs[i] : (c.E.groups[i].need || ''); }
  function gName(i) { var c = C(); return c.names[i] !== undefined && c.names[i].trim() ? c.names[i].trim() : c.E.groups[i].name; }
  function gAimed(i) {
    var c = C(), need = gNeed(i), out = [];
    if (!need) return out;
    rivalsOf().forEach(function (r) { if (c.riv.indexOf(r.id) >= 0) r.offers.forEach(function (f) { if (f.need === need) out.push({ r: r, f: f }); }); });
    return out;
  }
  function gExposure(i) {
    var n = gAimed(i).length, mine = (C().mine[i] || '').trim(), sc = n * (mine ? 0.5 : 1);
    return { n: n, mine: mine, level: !gNeed(i) ? 'unset' : n === 0 ? 'none' : sc >= 2 ? 'high' : sc >= 1 ? 'medium' : 'low' };
  }
  function oTxt(o) { return o.r.name + ': ' + o.f.plan + (o.f.pct ? ' (up to ' + o.f.pct + '% off)' : ''); }
  function needLabel(k) { var f = CD().needs.filter(function (x) { return x[0] === k; })[0]; return f ? f[1] : ''; }
  function scatter(E) {
    var W = 480, H = 280, ml = 46, mr = 12, mt = 12, mb = 38, pts = E.pts, xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), sx = (x1 - x0) || 1, sy = (y1 - y0) || 1;
    var X = function (v) { return ml + (v - x0) / sx * (W - ml - mr); }, Y = function (v) { return H - mb - (v - y0) / sy * (H - mt - mb); }, o = '';
    [0, 0.5, 1].forEach(function (t) { var xv = x0 + t * sx, yv = y0 + t * sy; o += '<line x1="' + X(xv).toFixed(1) + '" x2="' + X(xv).toFixed(1) + '" y1="' + mt + '" y2="' + (H - mb) + '" stroke="#E6E9EB"/><line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(yv).toFixed(1) + '" y2="' + Y(yv).toFixed(1) + '" stroke="#E6E9EB"/><text x="' + X(xv).toFixed(1) + '" y="' + (H - mb + 15) + '" text-anchor="middle" font-size="11" fill="#697580">' + (Math.round(xv * 10) / 10) + '</text><text x="' + (ml - 6) + '" y="' + (Y(yv) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#697580">' + (Math.round(yv * 10) / 10) + '</text>'; });
    pts.forEach(function (p) { o += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3" fill="' + PAL[p[2] % PAL.length] + '" fill-opacity=".55"/>'; });
    o += '<text x="' + ((ml + W - mr) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11.5" fill="#697580">' + esc(E.pk[0].l) + '</text><text transform="translate(12 ' + ((mt + H - mb) / 2) + ') rotate(-90)" text-anchor="middle" font-size="11.5" fill="#697580">' + esc(E.pk[1].l) + '</text>';
    return '<svg class="tw-cv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Each dot is a customer, coloured by group, plotted by ' + esc(E.pk[0].l) + ' and ' + esc(E.pk[1].l) + '">' + o + '</svg>';
  }
  function vCAnalyse() {
    var c = C(), ran = S.done.run, run = S.running, d = CD();
    var left = '<p class="tw-note">The workflow puts similar customers together. It tries the number of groups you chose' + (c.k ? '' : ', or picks between 3 and 5 by how clearly the groups separate') + ', then matches each group to what it values and to the rivals’ offers aimed at that need.</p><button type="button" class="btn am" data-act="run"' + (ran || run ? ' disabled' : '') + '>' + (ran ? 'Groups found' : run ? 'Grouping' : 'Group my customers') + '</button>' + (ran ? '<p class="tw-note" style="margin-top:14px">Change what to group by in step 1, then collect and run again. You can rename a group and change what it values below.</p>' : '');
    var right;
    if (run) right = '<div class="tw-card">' + runBar('Grouping customers') + '</div>';
    else if (!ran) right = '<div class="tw-card"><div class="lab2">Ready to group</div><p class="tw-q">Nothing has been grouped yet.</p><p class="note" style="margin:8px 0 0">Press the button to find the groups in your data.</p></div>';
    else {
      var E = c.E;
      var gt = E.groups.map(function (g, i) { return '<tr><td><label class="sr" for="gn' + i + '" style="position:absolute;left:-9999px">Name of group ' + (i + 1) + '</label><span class="dot" style="background:' + PAL[i % PAL.length] + '"></span><input type="text" id="gn' + i + '" class="inp gnm" maxlength="40" data-act="gname" data-i="' + i + '" value="' + esc(gName(i)) + '"><small>' + esc(g.desc) + '</small></td><td>' + Math.round(g.share * 100) + '%</td><td>' + E.pk.map(function (cc, jj) { return esc(cc.l) + ' ' + cfmt(cc, g.avg[jj]); }).join('<br>') + '</td></tr>'; }).join('');
      var ot = E.groups.map(function (g, i) {
        var ex = gExposure(i), al = gAimed(i);
        return '<tr><td><b>' + esc(gName(i)) + '</b><small>' + Math.round(g.share * 100) + '% of customers</small></td><td><select class="inp" data-act="gneed" data-i="' + i + '" aria-label="What ' + esc(gName(i)) + ' values most"><option value="">Choose…</option>' + d.needs.map(function (nn) { return '<option value="' + nn[0] + '"' + (gNeed(i) === nn[0] ? ' selected' : '') + '>' + esc(nn[1]) + '</option>'; }).join('') + '</select></td><td>' + (!gNeed(i) ? '<small>Choose what this group values to see matching offers.</small>' : al.length ? al.slice(0, 4).map(function (o) { return esc(oTxt(o)); }).join('<br>') + (al.length > 4 ? '<br><small>and ' + (al.length - 4) + ' more</small>' : '') : 'No rival offer aimed at this need') + '</td><td><input type="text" class="inp" maxlength="60" placeholder="None" data-act="gmine" data-i="' + i + '" value="' + esc(ex.mine) + '" aria-label="What you offer ' + esc(gName(i)) + ' today"></td><td>' + (ex.level === 'unset' ? '–' : ex.level === 'none' ? '<span class="lvl low">None</span>' : '<span class="lvl ' + ex.level + '">' + ex.level + '</span>') + '</td></tr>';
      }).join('');
      right = '<div class="tw-card"><div class="lab2">' + pm('ana') + E.k + ' customer groups' + (E.auto ? ', chosen by the workflow' : '') + '</div><div class="tw-sc"><table class="tw-t"><thead><tr><th>Group</th><th>Share</th><th>Average on what you grouped by</th></tr></thead><tbody>' + gt + '</tbody></table></div><p class="note" style="margin:10px 0 0">' + grp(E.N) + ' ' + d.unit + ' grouped' + (E.dropped ? ', ' + grp(E.dropped) + ' set aside for missing values' : '') + '. How clearly the groups separate: ' + E.sil.toFixed(2) + ' on a scale where 0 is overlapping and 1 is clean' + (E.auto ? ' (3 groups ' + E.sils[3].toFixed(2) + ', 4 groups ' + E.sils[4].toFixed(2) + ', 5 groups ' + E.sils[5].toFixed(2) + ')' : '') + '. ' + (c.src === 'example' ? 'The names match the example file’s profiles. ' : 'The names are placeholders. Rename them above. ') + '</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'The groups, plotted</div>' + scatter(E) + '<div class="lg">' + E.groups.map(function (g, i) { return '<span><i style="background:' + PAL[i % PAL.length] + '"></i>' + esc(gName(i)) + '</span>'; }).join('') + '</div><p class="note" style="margin:8px 0 0">Each dot is a customer, plotted by the first two columns you chose. A sample of up to 500 is shown.</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('pub') + 'What rivals offer each group</div><div class="tw-sc"><table class="tw-t cx"><thead><tr><th>Group</th><th>What it values</th><th>Rival offers aimed at it</th><th>What you offer today</th><th>Exposure</th></tr></thead><tbody>' + ot + '</tbody></table></div><p class="note" style="margin:10px 0 0">Offers are the rivals’ own, from their public pages, captured ' + capd() + '. We matched each offer to a need from its wording, and you can change what a group values. Exposure is high with two or more offers aimed at a group and nothing from you, medium with one, and lower where you already offer something.</p></div>';
    }
    return { left: left, right: right, ok: ran, why: 'Group the customers to continue.' };
  }
  function cSignals() {
    var c = C(), E = c.E, sig = [], src = [{ l: (c.src === 'example' ? 'The example file' : c.file.name) + ', grouped in your browser', u: null }], ord = E.groups.map(function (g, i) { return { g: g, i: i, ex: gExposure(i) }; });
    var rank = { high: 3, medium: 2, low: 1, none: 0, unset: -1 };
    var top = ord.filter(function (o) { return rank[o.ex.level] > 0; }).sort(function (a, b) { return rank[b.ex.level] - rank[a.ex.level] || b.g.share - a.g.share; })[0];
    var rv = [{ l: 'Rivals’ public pages, captured ' + capd(), u: null }];
    if (top) sig.push({ id: 'c-top', head: gName(top.i) + ' are the most exposed group', body: top.ex.n + ' rival offer' + (top.ex.n === 1 ? ' is' : 's are') + ' aimed at what they value (' + needLabel(gNeed(top.i)).toLowerCase() + '), and you offer them ' + (top.ex.mine ? top.ex.mine.toLowerCase() : 'nothing') + '. They are ' + Math.round(top.g.share * 100) + '% of customers. Rivals lead with ' + gAimed(top.i).slice(0, 2).map(oTxt).join(' and ') + '.', why: 'A group with several rival offers aimed at it and no offer from you is where customers are most likely to be courted away.', src: src.concat(rv), ev: ['ana', 'pub'], score: 5 });
    var big = ord.slice().sort(function (a, b) { return b.g.share - a.g.share; })[0];
    sig.push({ id: 'c-big', head: 'The largest group is ' + gName(big.i) + ', ' + Math.round(big.g.share * 100) + '% of customers', body: big.g.desc, why: 'The largest group sets the base of the business, so changes aimed at it have the widest reach.', src: src, ev: ['ana'], score: 3.5 });
    var none = ord.filter(function (o) { return o.ex.level === 'none'; });
    if (none.length) sig.push({ id: 'c-none', head: 'No rival offer is aimed at ' + jList(none.map(function (o) { return gName(o.i); })), body: 'On the rivals’ public pages, nothing is aimed at what ' + (none.length === 1 ? 'this group values' : 'these groups value') + ' (' + jList(none.map(function (o) { return needLabel(gNeed(o.i)).toLowerCase(); })) + ').', why: 'It may be a chance to win them, or a sign they are not worth courting. That is a judgement to make with your own numbers.', src: rv, ev: ['pub', 'ana'], score: 4.2 });
    var unset = ord.filter(function (o) { return o.ex.level === 'unset'; });
    if (unset.length) sig.push({ id: 'c-unset', head: 'You have not said what ' + jList(unset.map(function (o) { return gName(o.i); })) + ' value', body: 'Without that, we cannot match them to rival offers.', why: 'Go back a step and choose what each group values.', src: src, ev: ['asm'], score: 3 });
    sig.push({ id: 'c-how', head: 'The groups come from ' + c.E.pk.length + ' columns and ' + E.k + ' groups', body: 'They separate with a clarity score of ' + E.sil.toFixed(2) + '. A different choice of columns or number of groups can give different groups.', why: 'Treat the groups as a useful way to look at customers, not as fixed facts.', src: src, ev: ['ana', 'asm'], score: 2.5 });
    return sig.sort(function (a, b) { return b.score - a.score; });
  }
  function cMemo() {
    var c = C(), E = c.E, sig = cSignals(), ks = keptOf(sig), ord = E.groups.map(function (g, i) { return { g: g, i: i, ex: gExposure(i) }; }), rank = { high: 3, medium: 2, low: 1, none: 0, unset: -1 };
    var top = ord.filter(function (o) { return rank[o.ex.level] > 0; }).sort(function (a, b) { return rank[b.ex.level] - rank[a.ex.level] || b.g.share - a.g.share; })[0];
    var al = top ? gAimed(top.i) : [];
    var rec = top ? 'Defend ' + gName(top.i).toLowerCase() + ' first.' : 'No group is under pressure from rival offers on what you have told us.';
    var trade = top ? al.length + ' rival offer' + (al.length === 1 ? ' is' : 's are') + ' aimed at what they value, including ' + al.slice(0, 2).map(oTxt).join(' and ') + ', and you offer them ' + (top.ex.mine ? top.ex.mine.toLowerCase() : 'nothing') + '. They are ' + Math.round(top.g.share * 100) + '% of customers. Match the closest rival offer with something that fits your costs.' : 'Check what each group values, and what you offer each one.';
    return { q: 'Which customer groups do we have, what does each need, and how should we serve them?', who: S.who.trim(), rec: rec, trade: trade, unc: 'The groups depend on the columns and number of groups you chose, and each offer was matched to a need from its wording. Change either and the answer can move.', next: 'Check the top group against your own sales or retention data, then test an offer on that group before rolling it out.', ks: ks, top: null, sig: sig, judge: ['Which of the rivals’ offers are really aimed at each group. The workflow matches them from the wording, and the analyst checks each match.', 'Whether a gap matters to your customers, or is only a difference.', 'Which change to make first, given your costs and how quickly you can ship it.'] };
  }
  function cMd(M2) {
    var c = C(), E = c.E, d = cData();
    return mdBase('Customer groups brief', M2, ['Customer data: ' + (c.src === 'example' ? 'the example file, ' + grp(d.n) + ' rows (made up for this demo)' : d.name + ', ' + grp(d.n) + ' rows') + '. Grouped by: ' + E.pk.map(function (x) { return x.l.toLowerCase(); }).join(', ') + '. Groups: ' + E.k + '.', 'Groups: ' + E.groups.map(function (g, i) { return gName(i) + ' ' + Math.round(g.share * 100) + '%'; }).join(', ') + '.', 'Rivals: ' + rivalsOf().filter(function (r) { return c.riv.indexOf(r.id) >= 0; }).map(function (r) { return r.name; }).join(', ') + ', offers captured ' + capd() + '.'], cAssum());
  }
  function cAssum() { return [C().src === 'example' ? 'The customer file is an example made up for this demo.' : 'The customer file is yours, read in your browser.', 'The groups come from the columns and number of groups chosen. They are a way to look at customers, not fixed facts.', 'Each rival offer was matched to a need from its wording. Offers shown only in store, by address or to existing customers are not captured.']; }
  function synthC() { var sig = cSignals(); return synthView(sig, '', 'Each finding comes from the groups and the rivals’ offers. Untick any you do not want in the memo.'); }

  /* ====================================================================
     Generic memo, act, markdown
     ==================================================================== */
  function keptOf(sig) { if (!S.keep) S.keep = {}; sig.forEach(function (s, i) { if (S.keep[s.id] === undefined) S.keep[s.id] = i < 3; }); return sig.filter(function (s) { return S.keep[s.id]; }); }
  function mdBase(title, M2, setup, assumptions) {
    var o = '# ' + title + ': ' + TD[S.ind].label + '\n\n_' + (M2.who ? 'Prepared for ' + M2.who + '. ' : '') + 'Draft. Illustrative example. A designated analyst would review this before delivery._\n\n## Question\n\n' + M2.q + '\n\n## Recommendation\n\n' + M2.rec + '\n\n' + M2.trade + '\n\n## What the analysis shows\n\n';
    M2.ks.forEach(function (s) { o += '- **' + s.head + '.** ' + s.body + (s.src && s.src.length ? ' ' + s.src.map(function (r) { return r.u ? '[' + r.l + '](' + r.u + ')' : r.l; }).join(', ') : '') + '\n'; });
    o += '\n## Inputs\n\n' + setup.map(function (x) { return '- ' + x; }).join('\n') + '\n\n## Assumptions and limits\n\n' + assumptions.map(function (x) { return '- ' + x; }).join('\n') + '\n\n## Key uncertainty\n\n' + M2.unc + '\n\n## Next action\n\n' + M2.next + '\n';
    if (judgeFor(M2)) o += '\n## Where an analyst steps in\n\n' + judgeFor(M2).map(function (x) { return '- ' + x; }).join('\n') + '\n';
    return o;
  }
  var JUDGE = { respond: ['Whether the rival’s offer is meant for new customers only, or for yours too.', 'How much customers really react to a price gap. Your own history of past rival moves beats our assumption.', 'Which of the four responses fits your brand and your costs.'], budget: ['Whether the returns you measured last year will hold next year.', 'Which stopping points are real limits, such as capacity or contracts.', 'Whether to shift part of the budget first, as a test.'] };
  function judgeFor(M2) { return M2.judge || JUDGE[S.q]; }
  function memoFor() { return { respond: respondMemo, journey: jMemo, customers: cMemo, budget: budgetMemo }[S.q](); }
  function mdFor(M2) { return { respond: respondMd, journey: jMd, customers: cMd, budget: budgetMd }[S.q](M2); }
  function assumptionsFor() {
    if (S.q === 'respond') return respondAssum();
    if (S.q === 'journey') return jAssum();
    if (S.q === 'customers') return cAssum();
    return ['Sales, margin and how fast returns fade are your inputs and assumptions, shown as ranges.', 'Each channel is an independent curve, so this is the best split inside the model, not a forecast.', 'Rivals’ spend was not read.'];
  }
  function actionsFor() {
    if (S.q === 'respond') return [['test', 'Try the response on the most exposed segment first', 'A live engagement sets it up and reads the result with you.'], ['watch', 'Put the rival’s page on a weekly watch', 'A live engagement captures the page every week and flags changes.'], ['evid', 'Replace the reaction assumption with your own data', 'Use customers lost after past rival moves.'], ['brief', 'Brief the pricing team', 'Share the memo and the assumption it depends on.']];
    if (S.q === 'journey') return [['audit', 'Check the top gaps on the real sites and in your analytics', 'A live engagement visits each site with a browser and by hand, with page addresses and dates.'], ['build', 'Build the first change and measure it', 'Start with the top row of the table.'], ['watch', 'Put the rival sites on a monthly watch', 'A live engagement captures key pages each month and flags changes.'], ['brief', 'Brief the product and design team', 'Share the memo and the scores it rests on.']];
    if (S.q === 'customers') return [['check', 'Check the top group against your own sales or retention data', 'That shows whether rival offers are really pulling them away.'], ['test', 'Test an offer on the most exposed group first', 'A live engagement sets it up and reads the result with you.'], ['watch', 'Put the rivals’ offer pages on a weekly watch', 'A live engagement captures the pages every week and flags changes.'], ['brief', 'Brief the marketing team', 'Share the memo and how the groups were made.']];
    return [['evid', 'Replace the typed numbers with measured ones', 'Sales and margin by channel from your own records.'], ['pilot', 'Move part of the budget first', 'Shift a slice toward the best split and measure it.'], ['rerun', 'Re-run next quarter', 'Compare the split and the stopping points.'], ['brief', 'Brief the marketing team', 'Share the memo and the assumption it depends on.']];
  }
  var EVN = { respond: 'Public source, calculated', journey: 'Your table, compared', customers: 'Your data and public offers', budget: 'Calculated from your inputs' };
  function synthView(sig, controls, note) {
    keptOf(sig);
    var left = '<p class="tw-note">' + note + '</p>' + (controls || '');
    var right = sig.map(function (s, i) {
      return '<div class="tw-sig' + (S.keep[s.id] ? '' : ' off') + '"><label class="tw-ck"><input type="checkbox" data-act="keep" data-v="' + s.id + '"' + (S.keep[s.id] ? ' checked' : '') + '><span><b>' + esc(s.head) + '</b></span></label><div class="meta"><span class="rank">#' + (i + 1) + '</span><span class="ev">' + (s.ev || []).map(function (e) { return pm(e === 'ill' ? 'asm' : e); }).join('') + EVN[S.q] + '</span></div><p>' + esc(s.body) + '</p><p class="why"><b>Why it may matter.</b> ' + esc(s.why) + '</p>' + (s.src && s.src.some(function (r) { return r.u; }) ? '<p class="src">' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</p>' : '') + '</div>';
    }).join('');
    right += '<div class="tw-card gap"><div class="lab2">What this cannot tell you</div><ul class="tw-g">' + gapsFor().map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '</ul></div>';
    return { left: left, right: right, ok: true };
  }
  function gapsFor() {
    if (S.q === 'respond') return ['Whether customers really switch at the rate you assumed. That is your assumption.', 'How many customers the rival is winning, which is not public.', 'Offers shown only in store, by address or to existing customers.'];
    if (S.q === 'journey') return ['Whether the sites really have the features in the table. This page cannot visit them.', 'Which gaps cost you sales. That needs your analytics.', 'Effort and impact beyond our default estimates.'];
    if (S.q === 'customers') return ['What customers say they want. The groups come from behaviour in the file.', 'Whether customers in a group actually use the rivals’ offers.', 'Offers shown only in store, by address or to existing customers.'];
    return ['Whether the sales and margin numbers are right. They are your inputs.', 'How rivals are spending, which this demo does not read.'];
  }
  /* ====================================================================
     Steps 5 and 6 and the shell
     ==================================================================== */
  var HEADS = { respond: 'Rival price move brief', journey: 'Website comparison brief', customers: 'Customer groups brief', budget: 'Spend across channels brief' };
  function memoView() {
    var M2 = memoFor();
    var left = '<p class="tw-note">The recommendation is written from the findings you kept in the last step. You kept <b>' + M2.ks.length + '</b>. Go back a step to change them.</p><p class="tw-note"><b>Rule used:</b> the memo recommends the option your analysis ranked first, and states the assumption it depends on most.</p>';
    var judge = judgeFor(M2);
    var right = '<div class="tw-memo"><div class="tw-mh"><div><div class="lab2">Draft decision memo</div><b>' + esc(HEADS[S.q] + ': ' + TD[S.ind].label) + '</b>' + (M2.who ? '<span> for ' + esc(M2.who) + '</span>' : '') + '</div><span class="tagh">Draft. In a live engagement an analyst reviews it first</span></div>' +
      '<div class="rec2"><div class="lab2">' + pm('ana') + 'Recommendation</div><div class="big">' + esc(M2.rec) + '</div><p>' + esc(M2.trade) + '</p></div>' +
      '<div class="jg"><b class="t">Where an analyst steps in</b><ul>' + judge.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'Key uncertainty</div><p>' + esc(M2.unc) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Next action</div><p>' + esc(M2.next) + '</p></div></div>' +
      (M2.dont ? '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'What not to do</div><p>' + esc(M2.dont) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Confidence: ' + esc(M2.conf) + '</div><p>' + esc(M2.change) + '</p></div></div><div class="tw-ev"><div class="lab2">Watch next</div><ul>' + M2.watch.map(function (w) { return '<li>' + pm('asm') + '<span>' + esc(w[0]) + '<small>Where to look: ' + esc(w[1]) + '</small></span></li>'; }).join('') + '</ul></div>' : '') +
      '<div class="tw-ev"><div class="lab2">Evidence behind it</div><ul>' + M2.ks.map(function (s) { return '<li>' + pm(s.ev && s.ev.indexOf('pub') >= 0 ? 'pub' : s.ev && s.ev.indexOf('ill') >= 0 ? 'asm' : 'ana') + '<span>' + esc(s.head) + (s.src && s.src.length ? '<small>' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</small>' : '') + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="tw-ev"><div class="lab2">Assumptions and limits</div><ul>' + assumptionsFor().map(function (a) { return '<li>' + pm('asm') + '<span>' + esc(a) + '</span></li>'; }).join('') + '</ul></div></div>';
    return { left: left, right: right, ok: true };
  }
  function actView() {
    var M2 = memoFor(), acts = actionsFor(M2);
    if (!S.acts) { S.acts = {}; acts.forEach(function (a, i) { S.acts[a[0]] = i < 3; }); }
    var left = '<p class="tw-note">Tick the actions you want, then decide. Nothing is sent from this page unless you ask for the memo by email.</p><div class="tw-f"><div class="lab2">Actions to take</div>' + acts.map(function (a) { return '<label class="tw-ck"><input type="checkbox" data-act="act" data-v="' + a[0] + '"' + (S.acts[a[0]] ? ' checked' : '') + '><span><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></span></label>'; }).join('') + '</div>';
    var out = S.outcome;
    var right = '<div class="tw-card wait"><div class="lab2">Waiting for your decision</div><p class="tw-q" style="margin-bottom:4px">' + esc(M2.rec) + '</p><p class="note" style="margin:0 0 14px">Based on ' + M2.ks.length + ' finding' + (M2.ks.length === 1 ? '' : 's') + ' you kept. Draft only.</p><div class="btns"><button type="button" class="btn am" data-act="out" data-v="approve">Approve</button><button type="button" class="btn o" data-act="out" data-v="hold">Hold</button><button type="button" class="btn o" data-act="out" data-v="change">Ask for changes</button></div>';
    if (out) {
      var msg = out === 'approve' ? '<b>Approved.</b> In a live engagement this now goes to your designated analyst for review, then to you by email, and the actions you ticked are scheduled.' : out === 'hold' ? '<b>On hold.</b> In a live engagement the memo stays with your analyst until you say go. Nothing is scheduled.' : '<b>Changes requested.</b> In a live engagement your analyst revises the memo and sends it back. You can also go back a step here and change the inputs.';
      right += '<div class="tw-out2"><p>' + msg + ' Nothing was sent from this page.</p><div class="btns"><a class="btn am s" href="contact.html">Book a diagnostic</a></div></div>';
    }
    right += '</div><form class="tw-card mailbox2" id="mailbox" novalidate><div class="lab2">Email me this memo</div><p class="note" style="margin:0 0 10px">Enter your email and we will send this memo to you. We use it only to send the memo and reply to you. <a href="how-it-works.html#privacy" style="text-decoration:underline">Privacy notice</a></p><div class="mf"><label class="sr" for="mb-email" style="position:absolute;left:-9999px">Email</label><input type="email" id="mb-email" name="email" autocomplete="email" placeholder="name@example.com" required><div class="trap" aria-hidden="true"><input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></div><button class="btn am s" type="submit" id="mb-send">Email me the memo</button></div><p class="msg" id="mb-msg" role="status" aria-live="polite"></p></form>' +
      '<div class="tw-card"><div class="lab2">What a live engagement adds</div><ul class="tw-out"><li>The sources you choose, such as pricing pages, news and your own data</li><li>A designated analyst who reviews every brief before you see it</li><li>The brief on your schedule, month to month</li></ul></div>';
    return { left: left, right: right, ok: true };
  }
  function synthB() { var sig = budgetSignals(); return synthView(sig, '', 'Each finding comes from the 5,000 scenarios. Untick any you do not want in the memo.'); }
  function briefBar(parts, short) { return '<div class="tw-bar"><span class="tw-bs"><b>Your brief</b> · ' + esc(short) + '</span><span class="lab2">Your brief</span>' + parts.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>'; }
  var UNCN = { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' };
  var AD = {
    respond: { views: [vRSetup, vRCollect, vRAnalyse, synthR], brief: function () { var mv = rivalMove(); return briefBar([TD[S.ind].label, mv.who + ' ' + mv.plan, mp(mv.after) + ' ' + RD().per, UNCN[S.unc]], TD[S.ind].label + ' · ' + mv.who + ' ' + mp(mv.after) + ' · ' + UNCN[S.unc]); } },
    journey: { views: [vJSetup, vJCollect, vJAnalyse, synthJ], brief: function () { var j = J(); return briefBar([TD[S.ind].label, 'Your site against ' + j.names[1] + ' and ' + j.names[2], jStages().map(function (s) { return s.n; }).join(', '), j.edited ? 'your entries' : 'illustrative example'], TD[S.ind].label + ' · ' + jStages().length + ' stage' + (jStages().length === 1 ? '' : 's') + ' · ' + (j.edited ? 'your entries' : 'illustrative')); } },
    customers: { views: [vCSetup, vCCollect, vCAnalyse, synthC], brief: function () { var c = C(), d = cData(); return briefBar([TD[S.ind].label, c.src === 'example' ? 'Example file' : d.name, colsPicked().map(function (x) { return x.l.toLowerCase(); }).join(', '), c.k ? c.k + ' groups' : 'groups chosen by the workflow'], TD[S.ind].label + ' · ' + (c.src === 'example' ? 'example file' : 'your file') + ' · ' + (c.k ? c.k + ' groups' : 'auto groups')); } },
    budget: { views: [vBSetup, vBCollect, vBAnalyse, synthB], brief: function () { return briefBar([TD[S.ind].label, amt(100), 'current split ' + B().split, UNCN[S.unc]], TD[S.ind].label + ' · split ' + B().split + ' · ' + UNCN[S.unc]); } }
  };

  function render(keepScroll) {
    var ad = AD[S.q], v = S.step <= 4 ? ad.views[S.step - 1]() : S.step === 5 ? memoView() : actView(), st = STEPS[S.step - 1];
    var stp = '<ol class="tw-stp" aria-label="Steps">' + STEPS.map(function (x, i) { var n = i + 1, cls = n === S.step ? 'on' : n < S.step ? 'done' : (n <= S.maxStep ? 'seen' : ''); return '<li class="' + cls + '"' + (n === S.step ? ' aria-current="step"' : '') + '><button type="button" data-act="go" data-v="' + n + '"' + (n > S.maxStep ? ' disabled' : '') + '><b>' + (n < S.step ? '✓' : n) + '</b><span>' + x.n + '</span></button></li>'; }).join('') + '</ol>';
    var mob = '<div class="tw-mstep"><b>Step ' + S.step + ' of 6</b> &middot; ' + st.n + '<div class="tw-prog"><i style="width:' + (S.step / 6 * 100) + '%"></i></div></div>';
    var cur = Q.filter(function (q) { return q.k === S.q; })[0];
    var qrow = '<div class="dcs" role="group" aria-label="Decision">' + Q.map(function (q) { return '<button type="button" data-act="q" data-v="' + q.k + '" aria-pressed="' + (S.q === q.k) + '"><b>' + q.n + '</b><span class="why">' + q.why + '</span><em class="dat">' + q.dat + '</em></button>'; }).join('') + '</div><p class="dwhy">' + cur.why + '<em>' + cur.dat + '</em></p>';
    var pane = '<div class="tw-pane"><div class="tw-l"><div class="tw-who"><span class="tag">' + st.who + '</span><h2>Step ' + S.step + ': ' + st.n + '</h2><p class="does"><b>What happens here.</b> ' + st.does + '</p></div>' + v.left + '</div><div class="tw-r" aria-live="polite">' + v.right + '</div></div>';
    var nav = '<div class="tw-nav"><button type="button" class="btn o" data-act="back"' + (S.step === 1 ? ' disabled' : '') + '>Back</button><span class="tw-why">' + (v.ok ? '' : esc(v.why || '')) + '</span>' + (S.step < 6 ? '<button type="button" class="btn am" data-act="next"' + (v.ok ? '' : ' disabled') + '>Next step: ' + STEPS[S.step].n.toLowerCase() + '</button>' : '<button type="button" class="btn o" data-act="restart">Start again</button>') + '</div>';
    document.documentElement.setAttribute('data-tw-step', S.step);
    var y = window.scrollY; root.innerHTML = qrow + stp + mob + (S.step > 1 ? ad.brief() : '') + pane + nav; if (keepScroll) window.scrollTo(0, y);
    var w = $('#tw-who'); if (w && S._focusWho) { w.focus(); w.setSelectionRange(w.value.length, w.value.length); }
    if (S.q === 'budget' && S.step === 3 && B().E) { var cv = $('#tw-cv'); if (cv) drawScatter(cv, B().E, S.done.run ? 1 : (S._f || 0)); }
    v.n && (S._n = v.n);
  }
  function toStep() { var t = root.querySelector(window.innerWidth <= 820 ? '.tw-mstep' : '.tw-stp'); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 820 ? 70 : 90), behavior: 'smooth' }); }
  function resetRun() { S.done = { collect: false, run: false }; S.running = false; S.showAll = false; S.keep = null; S.outcome = null; S.acts = null; S.maxStep = Math.min(S.maxStep, 2); if (S.R) S.R.E = null; if (S.B) S.B.E = null; if (S.J) S.J.E = null; if (S.C) S.C.E = null; }
  function nCollect() { if (S.q === 'respond') return rRows().length; if (S.q === 'journey') return jRows().length; if (S.q === 'customers') return cRows().length; return bRows().length; }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (a === 'q') { S.q = v; S.step = 1; S.maxStep = 1; resetRun(); render(); }
    else if (a === 'ind') { S.ind = v; S.R = null; S.B = null; S.J = null; S.C = null; resetRun(); render(true); }
    else if (a === 'unc') { S.unc = v; resetRun(); render(true); }
    else if (a === 'fade') { B().fade = v; resetRun(); render(true); }
    else if (a === 'obj') { S.obj = v; S.keep = null; render(true); }
    else if (a === 'csrc') { C().src = v; C().k = v === 'example' ? 4 : 0; C().E = null; C().names = {}; C().needs = {}; C().mine = {}; if (v === 'example') C().pick = CD().pick.slice(); else if (C().file) C().pick = C().file.cols.slice(0, 4).map(function (x) { return x.k; }); resetRun(); render(true); }
    else if (a === 'ck') { C().k = +v; resetRun(); render(true); }
    else if (a === 'jreset') { S.J = null; resetRun(); render(true); }
    else if (a === 'collect') { startCollect(nCollect()); }
    else if (a === 'run') {
      if (S.q === 'respond') startRunEngine(function () { R().E = M.respondEngine(respondCfg()); }, 'Drawing scenarios');
      else if (S.q === 'journey') startRunEngine(function () { J().E = jCompute(); }, 'Comparing features', null, { total: jStages().reduce(function (n, s) { return n + s.f.length; }, 0), dur: 1100 });
      else if (S.q === 'customers') startRunEngine(function () { var c = C(); c.E = cCompute(); c.names = {}; c.needs = {}; c.mine = {}; }, 'Grouping customers', null, { total: cData().n, dur: 1500 });
      else startRunEngine(function () { var E = M.budgetEngine(budgetCfg()); E.planSplit = B().split; B().E = E; }, 'Drawing scenarios', function (f) { S._f = f; var cv = $('#tw-cv'); if (cv && B().E) drawScatter(cv, B().E, f); });
    }
    else if (a === 'all') { S.showAll = !S.showAll; render(true); }
    else if (a === 'go') { S.step = +v; render(); toStep(); }
    else if (a === 'back') { S.step = Math.max(1, S.step - 1); render(); toStep(); }
    else if (a === 'next') { S.step = Math.min(6, S.step + 1); S.maxStep = Math.max(S.maxStep, S.step); render(); toStep(); }
    else if (a === 'restart') { S.step = 1; S.maxStep = 1; resetRun(); render(); }
    else if (a === 'out') { S.outcome = v; render(true); }
  });
  root.addEventListener('change', function (e) {
    var t = e.target, a = t.getAttribute('data-act'); if (!a) return;
    if (a === 'offer') { R().offer = t.getAttribute('data-v'); resetRun(); render(true); }
    else if (a === 'seg') { R().seg[+t.getAttribute('data-i')][t.getAttribute('data-f')] = t.value; resetRun(); render(true); }
    else if (a === 'keep') { S.keep[t.getAttribute('data-v')] = t.checked; render(true); }
    else if (a === 'act') { S.acts[t.getAttribute('data-v')] = t.checked; }
    else if (a === 'split') { B().split = t.value; resetRun(); render(true); }
    else if (a === 'jstage') { J().on[t.getAttribute('data-v')] = t.checked; resetRun(); render(true); }
    else if (a === 'jf') { var f = J().v[t.getAttribute('data-id')], cc = +t.getAttribute('data-c'); f[cc] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : num(t.value); J().edited = true; resetRun(); render(true); }
    else if (a === 'jname') { J().names[+t.getAttribute('data-c')] = t.value.slice(0, 24); resetRun(); render(true); }
    else if (a === 'ccol') { var k = t.getAttribute('data-v'), p = C().pick, ix = p.indexOf(k); if (t.checked && ix < 0) p.push(k); else if (!t.checked && ix >= 0) p.splice(ix, 1); resetRun(); render(true); }
    else if (a === 'criv') { var rid = t.getAttribute('data-v'), rr = C().riv, rx = rr.indexOf(rid); if (t.checked && rx < 0) rr.push(rid); else if (!t.checked && rx >= 0) rr.splice(rx, 1); resetRun(); render(true); }
    else if (a === 'cfile') { readFile(t.files && t.files[0]); }
    else if (a === 'gname') { C().names[+t.getAttribute('data-i')] = t.value; S.keep = null; render(true); }
    else if (a === 'gneed') { C().needs[+t.getAttribute('data-i')] = t.value; S.keep = null; render(true); }
    else if (a === 'gmine') { C().mine[+t.getAttribute('data-i')] = t.value; S.keep = null; render(true); }
    else if (a === 'num') {
      var kk = t.getAttribute('data-k'), val = num(t.value);
      if (S.q === 'respond') R()[kk] = val;
      else { var r = +kk.slice(1); if (kk.charAt(0) === 'R') B().R[r] = val; else B().m[r] = val / 100; }
      resetRun(); render(true);
    }
  });
  root.addEventListener('input', function (e) { if (e.target.getAttribute('data-act') === 'who') { S.who = e.target.value; } });
  window.__trial = { S: S, describe: function () { var q = Q.filter(function (x) { return x.k === S.q; })[0]; return q.n + ' (' + TD[S.ind].label + ' example)'; }, memo: memoFor, md: function () { return mdFor(memoFor()); }, go: function (n) { S.step = n; S.maxStep = Math.max(S.maxStep, n); render(); }, render: render, M: M };
  try { var qq = new URLSearchParams(location.search), qk = qq.get('q'); if (qk && AD[qk]) S.q = qk; var ik = qq.get('industry'); if (ik && TD[ik]) S.ind = ik; } catch (e) {}
  render();
})();
