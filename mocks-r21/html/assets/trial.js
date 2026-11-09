/* Try it out: four business questions, each followed step by step from set-up to a decision.
   Competitor watch reads real public records (SEC EDGAR, ClinicalTrials.gov). New market reads real World Bank country figures.
   Price and budget run real scenario calculations on numbers you set. The page reads bundled snapshots only. Nothing is fetched live and nothing is sent. */
(function () {
  'use strict';
  var CW = window.CW, WB = window.WB, M = window.MODELS, TD = window.TD, root = document.getElementById('tw');
  if (!CW || !WB || !M || !TD || !root) return;
  var SNAP = new Date(CW.snapshot + 'T00:00:00Z');
  var STEPS = [
    { k: 'setup', n: 'Set up', does: 'You define the question, the inputs and what counts. Nothing runs yet.', who: 'You' },
    { k: 'collect', n: 'Collect', does: 'The workflow reads the sources and your inputs, logs each one with where it came from, and checks it. It does not interpret anything yet.', who: 'Workflow' },
    { k: 'analyse', n: 'Analyse', does: 'It does the calculation or comparison, using rules you can see and change.', who: 'Workflow' },
    { k: 'synth', n: 'Synthesise', does: 'It turns the analysis into findings, each with its evidence, and says what the analysis cannot tell you.', who: 'Workflow' },
    { k: 'memo', n: 'Decide and write', does: 'It drafts a decision memo from the findings you keep. In a live engagement a designated analyst reviews it at this point, before it reaches you.', who: 'Workflow, then analyst' },
    { k: 'act', n: 'Act', does: 'The memo waits for your decision. Approve it, put it on hold or ask for changes.', who: 'You' }
  ];
  var Q = [{ k: 'watch', n: 'Watch my competitors' }, { k: 'price', n: 'Test a price change' }, { k: 'budget', n: 'Allocate my marketing budget' }, { k: 'market', n: 'Size up a new market' }];
  var S = { q: 'watch', ind: 'hotels', cos: null, focus: { fin: true, lead: true, cap: true, oth: false, pipe: true }, win: 90, who: '', thr: 3, imp: { fin: 2, lead: 2, cap: 1, oth: 1, pipe: 2 }, dec: 'priority', step: 1, done: { collect: false, run: false }, keep: null, outcome: null, running: false, maxStep: 1, unc: 'med', obj: 'mean', P: null, B: null, K: null, acts: null, _ci: 0 };
  function $(s) { return root.querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(d) { var x = new Date(d + 'T00:00:00Z'); return x.getUTCDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function bn(v) { return '$' + (v / 1e9).toFixed(1) + 'bn'; }
  function pct(v, sign) { return (sign && v > 0 ? '+' : '') + v.toFixed(1) + '%'; }
  function daysAgo(d) { return Math.round((SNAP - new Date(d + 'T00:00:00Z')) / 864e5); }
  function inWin(d) { return daysAgo(d) <= S.win; }
  function IND() { return CW.industries[S.ind]; }
  function allCos() { return IND().companies; }
  function cos() { var ids = S.cos || allCos().map(function (c) { return c.id; }); return allCos().filter(function (c) { return ids.indexOf(c.id) >= 0; }); }
  function median(a) { if (!a.length) return null; a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  function pm(c) { return '<i class="pm ' + c + '" aria-hidden="true"></i>'; }
  function finLink(c, r) { var f = c.filings.filter(function (x) { return x.f === r.form && x.d === r.filed; })[0]; return f ? link(c, f) : null; }
  function link(c, f) { return 'https://www.sec.gov/Archives/edgar/data/' + c.cik + '/' + f.a.replace(/-/g, '') + '/' + f.p; }
  var FOCUS = [
    { k: 'fin', n: 'Financial momentum', d: 'Revenue growth and margins against the other companies' },
    { k: 'lead', n: 'Leadership changes', d: 'Director and officer changes (Item 5.02)' },
    { k: 'cap', n: 'Financing and capital', d: 'Debt, securities and material agreements' },
    { k: 'oth', n: 'Other disclosures', d: 'Cyber incidents, listing notices and other events' },
    { k: 'pipe', n: 'Pipeline activity', d: 'New late-stage clinical trials', only: 'pharma' }
  ];
  var IMP = ['Ignore', 'Low', 'Medium', 'High'];
  var ITEMS = { '1.01': 'entry into a material definitive agreement', '1.02': 'termination of a material agreement', '1.05': 'material cybersecurity incident', '2.01': 'completion of an acquisition or disposition', '2.02': 'results of operations and financial condition', '2.03': 'creation of a direct financial obligation', '2.04': 'triggering events that accelerate an obligation', '3.01': 'listing rule notice or transfer of listing', '3.02': 'unregistered sales of equity securities', '5.02': 'departure or appointment of directors or officers', '5.03': 'amendment to articles or bylaws', '5.07': 'shareholder vote results', '7.01': 'Regulation FD disclosure', '8.01': 'other events', '9.01': 'financial statements and exhibits' };
  var DEC = [
    { k: 'priority', n: 'Which rival should we watch most closely?' },
    { k: 'respond', n: 'Do we need to respond to a rival’s move this quarter?' },
    { k: 'check', n: 'What should my team check next?' }
  ];
  function cat(f) {
    var it = (f.i || '').split(',').filter(function (x) { return x && x !== '9.01'; });
    if (f.f === '10-Q' || f.f === '10-K' || f.f === '20-F') return 'periodic';
    if (f.f === '6-K') return 'foreign';
    if (/^(424B|S-3)/.test(f.f)) return 'cap';
    if (it.indexOf('2.02') >= 0) return 'results';
    if (it.indexOf('5.02') >= 0) return 'lead';
    if (it.some(function (x) { return ['1.01', '1.02', '2.03', '2.04', '3.02'].indexOf(x) >= 0; })) return 'cap';
    if (it.length) return 'oth';
    return 'oth';
  }
  var CATN = { results: 'Results', lead: 'Leadership', cap: 'Financing and capital', oth: 'Other disclosures', periodic: 'Periodic report', foreign: 'Foreign-issuer report' };
  function recText(f) {
    if (f.f === '10-Q' || f.f === '10-K' || f.f === '20-F') return f.f + ' periodic report';
    if (f.f === '6-K') return '6-K report (subject not read)';
    if (/^424B/.test(f.f)) return f.f + ' prospectus supplement (securities offering)';
    if (f.f === 'S-3ASR' || f.f === 'S-3') return f.f + ' shelf registration';
    var it = (f.i || '').split(',').filter(function (x) { return x && x !== '9.01'; });
    return '8-K, Item ' + it.map(function (x) { return x + ' (' + (ITEMS[x] || 'see the filing') + ')'; }).join('; Item ');
  }
  function filingsOf(c) { return c.filings.filter(function (f) { return inWin(f.d); }); }

  /* ---------- analysis ---------- */
  function analyse() {
    var cs = cos(), rows = cs.map(function (c) {
      var fl = filingsOf(c), n = { results: 0, lead: 0, cap: 0, oth: 0, periodic: 0, foreign: 0 }, last = {};
      fl.forEach(function (f) { var k = cat(f); n[k]++; if (!last[k] || f.d > last[k]) last[k] = f.d; });
      var fin = c.fin || {}, r = fin.revenue, g = r && r.prev ? (r.val / r.prev - 1) * 100 : null, om = r && fin.operating_income ? fin.operating_income.val / r.val * 100 : null, rd = r && fin.rd ? fin.rd.val / r.val * 100 : null;
      var tr = (c.trials || []).filter(function (t) { return inWin(t.first); });
      return { c: c, fl: fl, n: n, last: last, rev: r, g: g, om: om, rd: rd, tr: tr };
    });
    var med = median(rows.filter(function (x) { return x.g !== null; }).map(function (x) { return x.g; }));
    var medOm = median(rows.filter(function (x) { return x.om !== null; }).map(function (x) { return x.om; }));
    var sig = [];
    rows.forEach(function (x) {
      var c = x.c;
      if (S.focus.fin && x.g !== null && med !== null && rows.filter(function (y) { return y.g !== null; }).length > 1) {
        var gap = x.g - med;
        if (Math.abs(gap) >= S.thr) sig.push({ id: c.id + '-fin', co: c, t: 'fin', m: Math.min(3, Math.ceil(Math.abs(gap) / S.thr)), head: c.name + ' revenue ' + (x.g >= 0 ? 'grew ' : 'fell ') + pct(Math.abs(x.g)) + ' year on year, ' + Math.abs(gap).toFixed(1) + ' points ' + (gap >= 0 ? 'above' : 'below') + ' the peer median', body: 'Reported quarterly revenue of ' + bn(x.rev.val) + ' for the quarter ending ' + fmtDate(x.rev.end) + ', against ' + bn(x.rev.prev) + ' a year earlier. Peer median growth: ' + pct(med, true) + '.', why: 'Growth well away from peers can mean share gain, pricing power or a one-off. The filing figures do not say which.', src: [{ l: x.rev.form + ' filed ' + fmtDate(x.rev.filed), u: finLink(c, x.rev) }], ev: ['pub', 'ana'] });
      }
      if (S.focus.fin && x.om !== null && medOm !== null && rows.filter(function (y) { return y.om !== null; }).length > 2 && Math.abs(x.om - medOm) >= 10) {
        sig.push({ id: c.id + '-mar', co: c, t: 'fin', m: 1, head: c.name + ' operating margin of ' + pct(x.om) + ' is ' + Math.abs(x.om - medOm).toFixed(1) + ' points ' + (x.om > medOm ? 'above' : 'below') + ' the peer median', body: 'Operating income as a share of revenue for the quarter ending ' + fmtDate(x.rev.end) + '. Peer median: ' + pct(medOm) + '.', why: 'Margin differences often reflect business mix, such as owning or franchising, as much as performance.', src: [{ l: x.rev.form + ' filed ' + fmtDate(x.rev.filed), u: finLink(c, x.rev) }], ev: ['pub', 'ana'] });
      }
      ['lead', 'cap', 'oth'].forEach(function (k) {
        if (!S.focus[k]) return;
        var fl = x.fl.filter(function (f) { return cat(f) === k; });
        if (!fl.length) return;
        var m = Math.min(3, fl.length), h, why;
        if (k === 'lead') { h = c.name + ' filed ' + fl.length + ' notice' + (fl.length > 1 ? 's' : '') + ' of director or officer changes'; why = 'Leadership changes can come before shifts in strategy, pricing or investment. The notice itself is brief.'; }
        else if (k === 'cap') { h = c.name + ' made ' + fl.length + ' financing-related filing' + (fl.length > 1 ? 's' : ''); why = 'New financing can fund expansion, acquisitions or buybacks. The purpose is in the filing text, which this demo does not read.'; }
        else { var cy = fl.some(function (f) { return (f.i || '').indexOf('1.05') >= 0; }); if (cy) m = 3; h = c.name + (cy ? ' reported a material cybersecurity incident (Item 1.05)' : ' filed ' + fl.length + ' other disclosure' + (fl.length > 1 ? 's' : '')); why = cy ? 'Item 1.05 is the SEC item used to report a material cybersecurity incident. The filing text says what happened.' : 'Disclosures outside routine reporting are worth a read.'; }
        sig.push({ id: c.id + '-' + k, co: c, t: k, m: m, head: h, body: fl.slice(0, 3).map(function (f) { return fmtDate(f.d) + ': ' + recText(f); }).join('. ') + '.', why: why, src: fl.slice(0, 3).map(function (f) { return { l: f.f + ' ' + fmtDate(f.d), u: link(c, f) }; }), ev: ['pub'] });
      });
      if (S.focus.pipe && S.ind === 'pharma' && x.tr.length) {
        sig.push({ id: c.id + '-pipe', co: c, t: 'pipe', m: Math.min(3, Math.ceil(x.tr.length / 2)), head: c.name + ' registered ' + x.tr.length + ' new Phase 3 obesity trial' + (x.tr.length > 1 ? 's' : '') + ' in the window', body: x.tr.slice(0, 2).map(function (t) { return fmtDate(t.first) + ': ' + '\u201c' + t.t.slice(0, 100).replace(/\s+\S*$/, '') + '\u2026\u201d'; }).join('. ') + '.', why: 'New late-stage trials show where a rival is investing. Registration is a plan, not a result.', src: x.tr.slice(0, 2).map(function (t) { return { l: t.id, u: 'https://clinicaltrials.gov/study/' + t.id }; }), ev: ['pub'] });
      }
    });
    sig.forEach(function (s) { s.score = s.m * S.imp[s.t]; });
    sig = sig.filter(function (s) { return s.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    var gaps = [];
    rows.forEach(function (x) {
      if (S.focus.fin && !x.rev) gaps.push(x.c.name + ': no quarterly financial figures in this source (foreign filers report on a different basis). Shown as a gap, not estimated.');
      else if (S.focus.fin && x.om === null && S.ind !== 'pharma') gaps.push(x.c.name + ': operating income is not reported under the standard tag, so its margin is left out.');
      if (S.ind === 'pharma' && S.focus.fin && x.rev && x.rd === null) gaps.push(x.c.name + ': research spend is not reported under the standard tag.');
      if (x.n.foreign) gaps.push(x.c.name + ': ' + x.n.foreign + ' foreign-issuer reports (6-K) found. The subject of each is not read in this demo.');
    });
    gaps.push('Pricing, promotions, news and company websites are not collected in this demo. A live engagement adds the sources you choose.');
    gaps.push('Filing text is not read. The signals come from filing types, item codes and reported figures.');
    return { rows: rows, med: med, medOm: medOm, sig: sig, gaps: gaps };
  }
  function keptSignals(A) { if (!S.keep) S.keep = {}; A.sig.forEach(function (s, i) { if (S.keep[s.id] === undefined) S.keep[s.id] = i < 3; }); return A.sig.filter(function (s) { return S.keep[s.id]; }); }
  function byCo(sigs) { var m = {}; sigs.forEach(function (s) { m[s.co.id] = m[s.co.id] || { co: s.co, score: 0, sig: [] }; m[s.co.id].score += s.score; m[s.co.id].sig.push(s); }); return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.score - a.score; }); }

  /* ---------- memo ---------- */
  function memo(A) {
    var ks = keptSignals(A), ranked = byCo(ks), top = ranked[0], second = ranked[1];
    var q = DEC.filter(function (d) { return d.k === S.dec; })[0].n, who = S.who.trim();
    var rec, trade, unc, next;
    if (!top) { rec = 'There is nothing in these records that justifies a change. Keep the current watch.'; trade = 'The filings and figures show no signal above your rules.'; }
    else if (S.dec === 'respond') { rec = 'Do not change your plans on this evidence alone. Ask your team to check ' + top.co.name + '’s pricing and promotions first, then decide.'; trade = 'Filings show what a company reported, not why. A response based on them alone risks reacting to a signal that has an ordinary explanation.'; }
    else if (S.dec === 'check') { rec = 'Ask your team to check three things this week: ' + top.co.name + '’s pricing and promotions, the reasons behind its top signal, and whether ' + (second ? second.co.name : 'the others') + ' show the same pattern.'; trade = 'This is cheap to do and could change the picture. It does not commit you to a response.'; }
    else { rec = 'Watch ' + top.co.name + ' most closely' + (second ? ', with ' + second.co.name + ' next' : '') + '. Put ' + top.co.name + ' on a weekly watch and the others on a monthly one.'; trade = 'A weekly watch costs more analyst time than a monthly one. It is worth it only where the signals keep appearing.'; }
    unc = 'The records say what changed, not why. The reasons behind each signal are not in the filings and figures read here.';
    next = top ? 'Open the filings behind ' + top.co.name + '’s top signal and read what the company said.' : 'Re-run the brief with a wider window or more focus areas.';
    return { q: q, who: who, rec: rec, trade: trade, unc: unc, next: next, ks: ks, ranked: ranked, top: top };
  }
  function memoMd(A, M) {
    var o = '# Competitor watch brief: ' + IND().label + '\n\n_' + (M.who ? 'Prepared for ' + M.who + '. ' : '') + 'Draft. Illustrative example on real public records as at ' + fmtDate(CW.snapshot) + '. A designated analyst would review this before delivery._\n\n';
    o += '## Question\n\n' + M.q + '\n\n## Recommendation\n\n' + M.rec + '\n\n' + M.trade + '\n\n## What the evidence shows\n\n';
    M.ks.forEach(function (s) { o += '- **' + s.head + '.** ' + s.body + ' ' + s.src.map(function (r) { return r.u ? '[' + r.l + '](' + r.u + ')' : r.l; }).join(', ') + '\n'; });
    o += '\n## Assumptions\n\n- The latest reported quarter is comparable across the companies, although fiscal quarters differ by a few days.\n- ' + S.win + ' days is the right window for this question.\n\n## Gaps and limits\n\n' + A.gaps.map(function (g) { return '- ' + g; }).join('\n') + '\n\n## Key uncertainty\n\n' + M.unc + '\n\n## Next action\n\n' + M.next + '\n';
    return o;
  }


  function chipsBar() {
    var f = FOCUS.filter(function (x) { return S.focus[x.k] && (!x.only || x.only === S.ind); }).map(function (x) { return x.n.toLowerCase(); });
    return '<div class="tw-bar"><span class="tw-bs"><b>Your brief</b> \u00b7 ' + esc(briefShort()) + '</span><span class="lab2">Your brief</span><span><b>' + esc(IND().label) + '</b></span><span>' + cos().map(function (c) { return esc(c.name); }).join(', ') + '</span><span>' + (f.join(', ') || 'nothing selected') + '</span><span>' + S.win + ' days</span>' + (S.who.trim() ? '<span>for ' + esc(S.who.trim()) + '</span>' : '') + '</div>';
  }
  function briefShort() { var n = FOCUS.filter(function (x) { return S.focus[x.k] && (!x.only || x.only === S.ind); }).length; return IND().label + ' \u00b7 ' + cos().length + ' companies \u00b7 ' + n + ' focus area' + (n === 1 ? '' : 's') + ' \u00b7 ' + S.win + ' days'; }
  function wSetup() {
    var ids = S.cos || allCos().map(function (c) { return c.id; });
    var left = '<div class="tw-f"><div class="lab2">1 &middot; Industry</div><div class="chp" role="group" aria-label="Industry">' + Object.keys(CW.industries).map(function (k) { return '<button type="button" data-act="ind" data-v="' + k + '" aria-pressed="' + (S.ind === k) + '">' + CW.industries[k].label + '</button>'; }).join('') + '</div></div>' +
      '<div class="tw-f"><div class="lab2">2 &middot; Companies to watch</div>' + allCos().map(function (c) { return '<label class="tw-ck"><input type="checkbox" data-act="co" data-v="' + c.id + '"' + (ids.indexOf(c.id) >= 0 ? ' checked' : '') + '><span><b>' + esc(c.name) + '</b><small>' + esc(c.ticker) + ' &middot; ' + esc(c.exch) + '</small></span></label>'; }).join('') + '</div>' +
      '<div class="tw-f"><div class="lab2">3 &middot; What to watch</div>' + FOCUS.map(function (x) { var dis = x.only && x.only !== S.ind; return '<label class="tw-ck' + (dis ? ' off' : '') + '"><input type="checkbox" data-act="focus" data-v="' + x.k + '"' + (S.focus[x.k] && !dis ? ' checked' : '') + (dis ? ' disabled' : '') + '><span><b>' + x.n + '</b><small>' + (dis ? 'No source for this industry in the demo' : x.d) + '</small></span></label>'; }).join('') + '</div>' +
      '<div class="tw-f"><div class="lab2">4 &middot; Time window</div><div class="chp" role="group" aria-label="Time window">' + [30, 60, 90, 120].map(function (d) { return '<button type="button" data-act="win" data-v="' + d + '" aria-pressed="' + (S.win === d) + '">' + d + ' days</button>'; }).join('') + '</div></div>' +
      '<div class="tw-f"><label class="lab2" for="tw-who">5 &middot; Your company <span style="text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px">(optional)</span></label><input type="text" id="tw-who" class="inp" data-act="who" value="' + esc(S.who) + '" maxlength="60" placeholder="Used in the memo heading">' + '<p class="note" style="margin:6px 0 0">' + pm('int') + 'Customer-provided</p></div>';
    var srcs = ['<li>' + pm('pub') + '<span><b>SEC EDGAR, filings</b><small>data.sec.gov/submissions. Dated filing records for each company.</small></span></li>'];
    if (S.focus.fin) srcs.push('<li>' + pm('pub') + '<span><b>SEC EDGAR, reported figures</b><small>data.sec.gov/api/xbrl. Quarterly revenue, operating income' + (S.ind === 'pharma' ? ' and research spend' : '') + '.</small></span></li>');
    if (S.focus.pipe && S.ind === 'pharma') srcs.push('<li>' + pm('pub') + '<span><b>ClinicalTrials.gov</b><small>clinicaltrials.gov/api. Phase 3 obesity trials by sponsor.</small></span></li>');
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Which of these rivals is making moves that matter to us, and what should we do about it?</p>' +
      '<div class="lab2" style="margin-top:14px">Sources it will read</div><ul class="tw-src">' + srcs.join('') + '</ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>A dated log of every record found, with links</li><li>Comparisons calculated from reported figures</li><li>Ranked signals, each with its evidence</li><li>A draft decision memo and actions waiting for you</li></ul>' +
      '<p class="note" style="margin:14px 0 0">These are real public records for named companies, copied on ' + fmtDate(CW.snapshot) + '. The page does not fetch them live.</p></div>';
    return { left: left, right: right, ok: cos().length > 0 && Object.keys(S.focus).some(function (k) { return S.focus[k] && !(FOCUS.filter(function (x) { return x.k === k; })[0].only && FOCUS.filter(function (x) { return x.k === k; })[0].only !== S.ind); }), why: 'Choose at least one company and one thing to watch.' };
  }
  function srcPlan() {
    var cs = cos(), p = [];
    cs.forEach(function (c) { p.push({ id: c.id + '-f', c: c, s: 'SEC EDGAR filings', n: filingsOf(c).length, unit: 'filings' }); });
    if (S.focus.fin) cs.forEach(function (c) { var k = Object.keys(c.fin || {}).length; p.push({ id: c.id + '-x', c: c, s: 'SEC EDGAR reported figures', n: k, unit: 'figures', gap: !c.fin || !c.fin.revenue }); });
    if (S.focus.pipe && S.ind === 'pharma') cs.forEach(function (c) { p.push({ id: c.id + '-t', c: c, s: 'ClinicalTrials.gov', n: (c.trials || []).filter(function (t) { return inWin(t.first); }).length, unit: 'new Phase 3 trials' }); });
    return p;
  }
  function wCollect() {
    var plan = srcPlan(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">Press the button and watch each source being read. The numbers are what the records contain for your window of <b>' + S.win + ' days</b>.</p>' +
      '<button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading sources' : 'Collect from sources') + '</button>' +
      (done ? '<p class="tw-note" style="margin-top:14px">Not happy with the result? Go back, change the companies or the window, and collect again.</p>' : '');
    var rowsH = plan.map(function (r, i) {
      var st = done ? 'done' : (run ? (i < S._ci ? 'done' : i === S._ci ? 'run' : 'wait') : 'wait');
      return '<tr class="' + st + '"><td>' + esc(r.c.name) + '</td><td>' + esc(r.s) + '</td><td class="st">' + (st === 'done' ? (r.gap ? '<span class="tag h">Gap</span> none under the standard tag' : '<b>' + r.n + '</b> ' + r.unit) : st === 'run' ? 'Reading…' : 'Waiting') + '</td></tr>';
    }).join('');
    var right = '<div class="tw-card"><div class="lab2">Sources</div><table class="tw-t"><thead><tr><th>Company</th><th>Source</th><th>Found</th></tr></thead><tbody>' + rowsH + '</tbody></table></div>';
    if (done) {
      var recs = [];
      cos().forEach(function (c) { filingsOf(c).filter(function (f) { return f.f !== 'CERT'; }).forEach(function (f) { recs.push({ d: f.d, c: c, r: recText(f), u: link(c, f), p: 'SEC EDGAR' }); }); if (S.focus.pipe && S.ind === 'pharma') (c.trials || []).filter(function (t) { return inWin(t.first); }).forEach(function (t) { recs.push({ d: t.first, c: c, r: 'Phase 3 obesity trial registered: \u201c' + t.t.slice(0, 80).replace(/\s+\S*$/, '') + '\u2026\u201d', u: 'https://clinicaltrials.gov/study/' + t.id, p: 'ClinicalTrials.gov' }); }); });
      recs.sort(function (a, b) { return a.d < b.d ? 1 : -1; });
      var show = S.showAll ? recs : recs.slice(0, 10);
      right += '<div class="tw-card"><div class="lab2">The log: ' + recs.length + ' records</div><table class="tw-t log"><thead><tr><th>Date</th><th>Company</th><th>Record</th></tr></thead><tbody>' + show.map(function (r) { return '<tr><td class="d">' + fmtDate(r.d) + '</td><td>' + esc(r.c.name) + '</td><td>' + pm('pub') + esc(r.r) + ' <a href="' + r.u + '" target="_blank" rel="noopener">Open ' + (r.p === 'SEC EDGAR' ? 'filing' : 'record') + '</a></td></tr>'; }).join('') + '</tbody></table>' + (recs.length > 10 ? '<button type="button" class="linkbtn" data-act="all">' + (S.showAll ? 'Show fewer' : 'Show all ' + recs.length) + '</button>' : '') + '</div>';
    }
    return { left: left, right: right, ok: done, why: 'Collect from the sources to continue.' };
  }
  function wAnalyse() {
    var A = analyse(), pharma = S.ind === 'pharma';
    var left = '<p class="tw-note">The workflow sorts every record into a type, then compares the companies on figures they reported. These are the rules. Change one and the table updates.</p>' +
      '<div class="tw-f"><div class="lab2">Flag a revenue growth gap of at least</div><div class="chp">' + [1, 3, 5, 10].map(function (v) { return '<button type="button" data-act="thr" data-v="' + v + '" aria-pressed="' + (S.thr === v) + '">' + v + (v === 1 ? ' point' : ' points') + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: a gap this size is worth a look.</p></div>' +
      '<div class="tw-f"><div class="lab2">How records are typed</div><ul class="tw-rules"><li><b>Results:</b> 8-K Item 2.02</li><li><b>Leadership:</b> Item 5.02</li><li><b>Financing:</b> Items 1.01, 2.03, prospectus and shelf filings</li><li><b>Other:</b> any other 8-K item</li><li>Insider and ownership forms are left out</li></ul></div>';
    var hdr = '<tr><th>Company</th><th>Results</th><th>Leaders</th><th>Financing</th><th>Other</th></tr>';
    var m1 = A.rows.map(function (x) { return '<tr><td>' + esc(x.c.name) + '</td><td>' + (x.n.results + x.n.periodic + x.n.foreign || '0') + '</td><td>' + x.n.lead + '</td><td>' + x.n.cap + '</td><td>' + x.n.oth + '</td></tr>'; }).join('');
    var h2 = '<tr><th>Company</th><th>Revenue</th><th>Year on year</th><th>' + (pharma ? 'Research spend' : 'Operating margin') + '</th></tr>';
    var m2 = A.rows.map(function (x) { return '<tr><td>' + esc(x.c.name) + '</td>' + (x.rev ? '<td>' + bn(x.rev.val) + '</td><td' + (x.g !== null && A.med !== null && Math.abs(x.g - A.med) >= S.thr ? ' class="hit"' : '') + '>' + (x.g !== null ? pct(x.g, true) : '<span class="tag h">Not reported</span>') + '</td><td>' + ((pharma ? x.rd : x.om) !== null ? pct(pharma ? x.rd : x.om) + (pharma ? ' of revenue' : '') : '<span class="tag h">Not reported</span>') + '</td>' : '<td colspan="3"><span class="tag h">Not reported</span> no quarterly figures in this source</td>') + '</tr>'; }).join('');
    var right = '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Records by type, last ' + S.win + ' days</div><table class="tw-t"><thead>' + hdr + '</thead><tbody>' + m1 + '</tbody></table></div>' +
      (S.focus.fin ? '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Reported figures, latest quarter</div><table class="tw-t"><thead>' + h2 + '</thead><tbody>' + m2 + '</tbody></table><p class="note" style="margin:10px 0 0">Peer median revenue growth: <b>' + (A.med !== null ? pct(A.med, true) : 'not available') + '</b>. Highlighted cells are at least ' + S.thr + ' points from it. Source: figures each company reported to the SEC.</p></div>' : '') +
      '<div class="tw-card gap"><div class="lab2">Gaps, shown not hidden</div><ul class="tw-g">' + A.gaps.map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '</ul></div>';
    return { left: left, right: right, ok: true, A: A };
  }
  function wSynth() {
    var A = analyse(); keptSignals(A);
    var left = '<p class="tw-note">Each signal is scored: how big it is, times how much it matters to you. Change what matters and the ranking moves. Untick any signal you do not want in the memo.</p><div class="tw-f"><div class="lab2">How much each type matters</div>' +
      FOCUS.filter(function (x) { return S.focus[x.k] && (!x.only || x.only === S.ind); }).map(function (x) { return '<div class="tw-imp"><span>' + x.n + '</span><div class="chp sm" role="group" aria-label="' + x.n + '">' + IMP.map(function (l, v) { return '<button type="button" data-act="imp" data-k="' + x.k + '" data-v="' + v + '" aria-pressed="' + (S.imp[x.k] === v) + '">' + l + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>';
    var right = A.sig.length ? A.sig.map(function (s, i) {
      return '<div class="tw-sig' + (S.keep[s.id] ? '' : ' off') + '"><label class="tw-ck"><input type="checkbox" data-act="keep" data-v="' + s.id + '"' + (S.keep[s.id] ? ' checked' : '') + '><span><b>' + esc(s.head) + '</b></span></label><div class="meta"><span class="rank">#' + (i + 1) + '</span><span class="sc">Score ' + s.score + '</span><span class="ev">' + s.ev.map(function (e) { return pm(e); }).join('') + (s.ev.indexOf('ana') >= 0 ? 'Public source, calculated' : 'Public source') + '</span></div><p>' + esc(s.body) + '</p><p class="why"><b>Why it may matter.</b> ' + esc(s.why) + '</p><p class="src">' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</p></div>';
    }).join('') : '<div class="tw-card"><p>No signal meets your rules. Widen the window, lower the growth gap or add focus areas.</p></div>';
    right += '<div class="tw-card gap"><div class="lab2">What the records cannot tell you</div><ul class="tw-g"><li>' + pm('asm') + 'Why a company did something. The filing text and the company’s own explanation are not read.</li><li>' + pm('asm') + 'Anything about pricing, promotions or customers. Those sources are not collected here.</li></ul></div>';
    return { left: left, right: right, ok: true };
  }
  /* ====================================================================
     Shared helpers for the other three questions
     ==================================================================== */
  function lcAcr(t) { return /^[A-Z]{2,}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }
  function lcFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function num(v) { return Number(String(v).replace(/,/g, '')); }
  function cr(v) { var a = Math.abs(v); return (v < 0 ? '-' : '') + '₹' + (a < 10 ? a.toFixed(1) : Math.round(a)) + ' crore'; }
  function crs(v) { return (v >= 0 ? '+' : '') + cr(v); }
  function grp(v) { return Math.round(v).toLocaleString('en-IN'); }
  function indChips() { return '<div class="tw-f"><div class="lab2">1 · Example setting</div><div class="chp" role="group" aria-label="Example setting">' + Object.keys(CW.industries).map(function (k) { return '<button type="button" data-act="ind" data-v="' + k + '" aria-pressed="' + (S.ind === k) + '">' + CW.industries[k].label + '</button>'; }).join('') + '</div><p class="note" style="margin:8px 0 0">Illustrative setting. The same workflow applies in any sector.</p></div>'; }
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
      return '<tr class="' + st + '"><td>' + r.l + '</td><td>' + (st === 'done' ? r.v : '') + '</td><td>' + (st === 'done' ? pm(r.t) + ({ int: 'Customer-provided', asm: 'Assumption', pub: 'Public source', ana: 'Analysis' }[r.t]) : '') + '</td><td class="st">' + (st === 'done' ? (r.ok === false ? '<span class="tag h">Fix</span> ' + esc(r.msg) : '<span class="okc">✓</span>') : st === 'run' ? 'Reading…' : 'Waiting') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function startCollect(n) {
    S.running = true; S._ci = 0; render(true);
    (function tick() { S._ci++; if (S._ci > n) { S.running = false; S.done.collect = true; render(true); return; } render(true); setTimeout(tick, 380); })();
  }
  function startRunEngine(compute, label, after) {
    S.running = true; render(true);
    setTimeout(function () {
      compute();
      var t0 = Date.now(), dur = 2000, tm = setInterval(function () {
        var f = Math.min(1, (Date.now() - t0) / dur), tx = $('#tw-runt'), b = $('#tw-runb');
        if (tx) tx.textContent = label + ' ' + grp(f * 5000) + ' of 5,000'; if (b) b.style.width = (f * 100) + '%';
        if (after) after(f);
        if (f >= 1) { clearInterval(tm); S.running = false; S.done.run = true; render(true); }
      }, 60);
    }, 60);
  }

  /* ====================================================================
     PRICE CHANGE
     ==================================================================== */
  function priceInit() { var d = TD[S.ind].price; S.P = { price: d.P0, vol: d.q0, cost: d.c[1], resp: -d.e[1], match: Math.round(d.m[1] * 100), E: null }; }
  function P() { if (!S.P) priceInit(); return S.P; }
  function priceCfg() { var p = P(), u = UNC[S.unc]; return { unit: TD[S.ind].price.unit, P0: p.price, q0: p.vol, c: [p.cost * (1 - .7 * u), p.cost, p.cost * (1 + .9 * u)], e: [-p.resp * (1 + u), -p.resp, -p.resp * (1 - u)], m: [Math.max(0, p.match / 100 - u), p.match / 100, Math.min(1, p.match / 100 + u)] }; }
  function priceChecks() {
    var p = P(), out = [];
    if (!(p.price > 0)) out.push('Price must be above zero.');
    if (!(p.vol > 0)) out.push('Volume must be above zero.');
    if (!(p.cost > 0) || p.cost >= p.price) out.push('Unit cost must be above zero and below the price.');
    if (!(p.resp >= 0.2 && p.resp <= 4)) out.push('Price response must be between 0.2 and 4.');
    if (!(p.match >= 0 && p.match <= 100)) out.push('Rival matching must be between 0 and 100.');
    return out;
  }
  var PLAB = ['cut the price by 10%', 'cut the price by 5%', 'hold the price', 'raise the price by 5%', 'raise the price by 10%'];
  function priceStats() {
    var E = P().E, N = E.N, hold = E.prof[2], rows = M.PRICE_OPTS.map(function (d, k) {
      var del = new Float64Array(N), up = 0, i; for (i = 0; i < N; i++) { del[i] = E.prof[k][i] - hold[i]; if (del[i] > 0) up++; }
      return { k: k, d: d, mean: M.mean(del), p10: M.quant(del, .1), p90: M.quant(del, .9), beat: up / N };
    });
    var key = S.obj === 'p10' ? 'p10' : 'mean', rank = rows.slice().sort(function (a, b) { return b[key] - a[key]; });
    return { rows: rows, rank: rank, best: rank[0], second: rank[1], holdMean: M.mean(hold) };
  }
  function vPSetup() {
    var p = P(), d = TD[S.ind].price, u = d.unit, bad = priceChecks();
    var left = indChips() + '<div class="tw-f"><div class="lab2">2 · Your numbers</div>' +
      numField('price', 'Current price per ' + u + ' (₹)', p.price, '') + numField('vol', 'Volume sold in a year (' + u + 's)', p.vol, '') + numField('cost', 'Cost per ' + u + ' (₹)', p.cost, 'Must be below the price') +
      numField('resp', 'Volume lost for each 1% price rise (%)', p.resp, 'Typical: 0.5 to 3. This is an assumption.', '0.1') + numField('match', 'Rivals that match a price cut (% of them)', p.match, 'Typical: 10 to 60. This is an assumption.', '5') + '</div>' +
      '<div class="tw-f"><div class="lab2">3 · How sure are you?</div>' + uncChips() + '</div>' + whoField(4);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Should we change our price, and by how much?</p><div class="lab2" style="margin-top:14px">Moves it will test</div><div class="tw-pills">' + M.PRICE_LABEL.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src"><li>' + pm('int') + '<span><b>Your numbers</b><small>Price, volume and cost.</small></span></li><li>' + pm('asm') + '<span><b>Your assumptions</b><small>How customers respond to price, and how many rivals match a cut, each as a range.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>5,000 scenarios of how each move could play out</li><li>The expected profit change and its range for every move</li><li>The assumption the answer depends on most</li><li>A draft decision memo and actions waiting for you</li></ul>' +
      '<p class="note" style="margin:14px 0 0">The starting numbers are illustrative for ' + esc(lcFirst(TD[S.ind].co)) + '. Change them to your own.</p></div>';
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function pRows() {
    var p = P(), c = priceCfg(), d = TD[S.ind].price, u = d.unit;
    var okc = priceChecks();
    return [
      { l: 'Current price', v: '₹' + grp(p.price) + ' per ' + u, t: 'int', ok: p.price > 0, msg: 'Must be above zero' },
      { l: 'Volume in a year', v: grp(p.vol) + ' ' + u + 's', t: 'int', ok: p.vol > 0, msg: 'Must be above zero' },
      { l: 'Cost per ' + u, v: '₹' + grp(p.cost) + ' (range ₹' + grp(c.c[0]) + ' to ₹' + grp(c.c[2]) + ')', t: 'int', ok: p.cost > 0 && p.cost < p.price, msg: 'Must be below the price' },
      { l: 'Volume response to a 1% rise', v: '-' + p.resp.toFixed(1) + '% (range -' + (-c.e[0]).toFixed(1) + '% to -' + (-c.e[2]).toFixed(1) + '%)', t: 'asm', ok: p.resp >= 0.2 && p.resp <= 4, msg: 'Between 0.2 and 4' },
      { l: 'Share of a cut that rivals match', v: p.match + '% (range ' + Math.round(c.m[0] * 100) + '% to ' + Math.round(c.m[2] * 100) + '%)', t: 'asm', ok: p.match >= 0 && p.match <= 100, msg: 'Between 0 and 100' },
      { l: 'Moves tested', v: '-10%, -5%, hold, +5%, +10%', t: 'asm', ok: true }
    ];
  }
  function vPCollect() {
    var rows = pRows(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">The workflow reads every number you gave, labels where it came from and checks it makes sense. Rivals’ own price lists are not read in this demo.</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading your inputs' : 'Check and collect inputs') + '</button>' + (done ? '<p class="tw-note" style="margin-top:14px">Change a number? Go back to step 1, then collect again.</p>' : '');
    var right = collectTable(rows) + '<div class="tw-card gap"><div class="lab2">Not collected here</div><ul class="tw-g"><li>' + pm('asm') + 'Rival prices and promotions. A live engagement reads the price lists you choose.</li><li>' + pm('asm') + 'Your own sales history by price. That is what would firm up the response assumption.</li></ul></div>';
    return { left: left, right: right, ok: done, why: 'Collect the inputs to continue.', n: rows.length };
  }
  function vPAnalyse() {
    var p = P(), ran = S.done.run, run = S.running;
    var left = '<p class="tw-note">The workflow draws 5,000 possible futures from your ranges. In each one it works out the profit of every move. Then it compares them.</p><div class="tw-f"><div class="lab2">What counts as best</div><div class="chp" role="group" aria-label="Objective">' + [['mean', 'Highest average profit'], ['p10', 'Avoid big losses']].map(function (x) { return '<button type="button" data-act="obj" data-v="' + x[0] + '" aria-pressed="' + (S.obj === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: how you weigh risk. “Avoid big losses” ranks moves by their worst 10% of outcomes.</p></div>' +
      '<button type="button" class="btn am" data-act="run"' + (ran || run ? ' disabled' : '') + '>' + (ran ? 'Scenarios run' : run ? 'Running' : 'Run 5,000 scenarios') + '</button>' + (ran ? '<p class="tw-note" style="margin-top:14px">Change the objective and the ranking updates. Change a number in step 1 and run again.</p>' : '');
    var right;
    if (run) right = '<div class="tw-card">' + runBar('Drawing scenarios') + '<p class="note" style="margin:10px 0 0">Each scenario picks a cost, a volume response and a rival reaction from your ranges, then works out profit for all five moves.</p></div>';
    else if (!ran) right = '<div class="tw-card"><div class="lab2">Ready to run</div><p class="tw-q">Nothing has been calculated yet.</p><p class="note" style="margin:8px 0 0">Press the button to run the scenarios.</p></div>';
    else {
      var st = priceStats(), lo = Math.min.apply(null, st.rows.map(function (r) { return r.p10; })), hi = Math.max.apply(null, st.rows.map(function (r) { return r.p90; })), span = (hi - lo) || 1;
      var X = function (v) { return ((v - lo) / span * 100).toFixed(1); };
      right = '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Profit change against holding the price, ₹ crore a year</div><div class="tw-bars">' + st.rows.map(function (r) {
        return '<div class="tw-br' + (r.k === st.best.k ? ' best' : '') + '"><span class="n">' + M.PRICE_LABEL[r.k] + (r.k === st.best.k ? '<em>Best</em>' : '') + '</span><div class="trk"><i class="z" style="left:' + X(0) + '%"></i><i class="rg" style="left:' + X(r.p10) + '%;width:' + Math.max(1, X(r.p90) - X(r.p10)) + '%"></i><i class="mn" style="left:' + X(r.mean) + '%"></i></div><span class="v">' + (r.k === 2 ? 'Baseline' : crs(r.mean)) + '</span></div>';
      }).join('') + '</div><p class="note" style="margin:10px 0 0">The bar is the range in 80% of scenarios. The dark mark is the average. The thin line is zero change.</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'The numbers</div><table class="tw-t"><thead><tr><th>Move</th><th>Average</th><th>80% range</th><th>Scenarios that beat holding</th></tr></thead><tbody>' + st.rank.map(function (r) { return '<tr' + (r.k === st.best.k ? ' class="hit"' : '') + '><td>' + M.PRICE_LABEL[r.k] + '</td><td>' + (r.k === 2 ? 'Baseline' : crs(r.mean)) + '</td><td>' + (r.k === 2 ? '\u2013' : cr(r.p10) + ' to ' + cr(r.p90)) + '</td><td>' + (r.k === 2 ? '–' : Math.round(r.beat * 100) + '%') + '</td></tr>'; }).join('') + '</tbody></table><p class="note" style="margin:10px 0 0">Profit from holding the price: about ' + cr(st.holdMean) + ' a year on these numbers.</p></div>';
    }
    return { left: left, right: right, ok: ran, why: 'Run the scenarios to continue.' };
  }
  function priceSignals() {
    var E = P().E, st = priceStats(), b = st.best, s2 = st.second, sig = [], u = TD[S.ind].price, hold = b.k === 2;
    sig.push({ id: 'p-best', head: hold ? 'Holding the price is the best move on your numbers' : 'The best move is to ' + PLAB[b.k], body: hold ? 'No move beats holding on ' + (S.obj === 'p10' ? 'the downside' : 'average profit') + '. The nearest alternative is to ' + PLAB[s2.k] + ', at ' + crs(s2.mean) + ' a year on average.' : 'It changes profit by ' + crs(b.mean) + ' a year on average, within ' + cr(b.p10) + ' to ' + cr(b.p90) + ' in 80% of 5,000 scenarios. It beats holding in ' + Math.round(b.beat * 100) + '% of them.', why: 'The model uses the ranges you set. Better evidence on how customers respond would narrow them.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana', 'int', 'asm'], score: 5 });
    if (!hold) sig.push({ id: 'p-alt', head: 'The next best move is to ' + PLAB[s2.k], body: crs(s2.mean) + ' a year on average, within ' + cr(s2.p10) + ' to ' + cr(s2.p90) + '.', why: 'Worth knowing if the best move is hard to do.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana'], score: 3 });
    var worst = st.rows.slice().sort(function (a, c) { return a.p10 - c.p10; })[0];
    if (worst.p10 < 0) sig.push({ id: 'p-risk', head: 'The main risk is to ' + PLAB[worst.k], body: 'In the worst 10% of scenarios it loses ' + cr(-worst.p10) + ' a year or more against holding.', why: 'Risk matters most if you cannot easily reverse a move.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana'], score: 4 });
    var h = E.hinge[0];
    sig.push({ id: 'p-hinge', head: 'The answer depends most on ' + h.label, body: h.flips.length ? 'At the ' + (h.flips[0].val < (h.k === 'e' ? -P().resp : h.k === 'c' ? P().cost : P().match / 100) ? 'low' : 'high') + ' end of its range, the best move changes to ' + PLAB[h.flips[0].to] + '.' : 'At either end of its range, the best move stays the same.', why: 'This is the assumption to firm up first.', src: [{ l: 'Sensitivity test on your ranges', u: null }], ev: ['ana', 'asm'], score: 4.5 });
    if (E.breakEven !== null && !hold) sig.push({ id: 'p-be', head: 'The move stops paying if volume falls faster than ' + Math.abs(E.breakEven).toFixed(1) + '% for each 1% price change', body: 'That is the break-even response. Your assumption is ' + P().resp.toFixed(1) + '%.', why: 'The closer your assumption is to the break-even, the less safe the move is.', src: [{ l: 'Break-even calculation', u: null }], ev: ['ana'], score: 2 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function priceMemo() {
    var st = priceStats(), b = st.best, sig = priceSignals(), ks = keptOf(sig), u = TD[S.ind].price, h = P().E.hinge[0];
    var rec = b.k === 2 ? 'Hold the price for now.' : (PLAB[b.k].charAt(0).toUpperCase() + PLAB[b.k].slice(1)) + '.';
    return { q: 'Should we change our price, and by how much?', who: S.who.trim(), rec: rec, trade: b.k === 2 ? 'No move beats holding on your numbers. Holding avoids the risk of a move that does not pay back.' : 'It changes profit by ' + crs(b.mean) + ' a year on average, within ' + cr(b.p10) + ' to ' + cr(b.p90) + '. It beats holding in ' + Math.round(b.beat * 100) + '% of scenarios.', unc: 'The answer depends most on ' + h.label + '. That number is your assumption, not a measured fact.', next: 'Check ' + u.evidence + ', then test the move in one segment before rolling it out.', ks: ks, top: null, sig: sig };
  }
  function priceMd(M2) { return mdBase('Price change brief', M2, ['Inputs: price ₹' + grp(P().price) + ', volume ' + grp(P().vol) + ', cost ₹' + grp(P().cost) + ', response -' + P().resp.toFixed(1) + '%, rival matching ' + P().match + '%.', 'Ranges set as: ' + ({ narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]) + '.', 'Best is judged by: ' + (S.obj === 'p10' ? 'protecting the downside' : 'highest average profit') + '.'], ['The ranges around cost, response and rival matching are assumptions.', 'No rival prices or sales history were read.']); }

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
  function budgetChecks() { var b = B(), o = [], r; for (r = 0; r < 3; r++) { if (!(b.R[r] > 0)) o.push('Sales for each route must be above zero.'); if (!(b.m[r] >= 0.02 && b.m[r] <= 0.9)) o.push('Margin must be between 2% and 90%.'); } return o.filter(function (x, i, a) { return a.indexOf(x) === i; }); }
  function budgetRng() { return TD[S.ind].budget.routes; }
  function vBSetup() {
    var b = B(), names = budgetRng(), d = TD[S.ind].budget;
    var routes = names.map(function (n, r) { return '<div class="tw-rt"><b>' + esc(n) + '</b>' + numField('R' + r, 'Sales from ₹50 crore of spend here (₹\u00a0crore)', b.R[r], '') + numField('m' + r, 'Profit margin on those sales (%)', Math.round(b.m[r] * 100), '', '1') + '</div>'; }).join('');
    var left = indChips() + '<div class="tw-f"><div class="lab2">2 · Your budget and current split</div><p class="note" style="margin:0 0 8px">You have ₹100 crore to spend. This example keeps that fixed.</p><label class="lab2" for="n-split" style="margin-top:6px">How you split it today (% for each route, in the order listed below)</label><select id="n-split" class="inp" data-act="split">' + M.SPLITS.map(function (a) { var t = a.join(' / '); return '<option value="' + t + '"' + (t === b.split ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select><p class="note" style="margin:6px 0 0">' + names.map(function (n, r) { return esc(n) + ' ₹' + b.split.split(' / ')[r] + ' crore'; }).join(' · ') + '</p></div>' +
      '<div class="tw-f"><div class="lab2">3 · What each route returns</div>' + routes + '</div>' +
      '<div class="tw-f"><div class="lab2">4 · How quickly returns fade</div><div class="chp" role="group" aria-label="How quickly returns fade">' + [['slow', 'Slowly'], ['med', 'Normally'], ['fast', 'Quickly']].map(function (x) { return '<button type="button" data-act="fade" data-v="' + x[0] + '" aria-pressed="' + (b.fade === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: the more you spend on one route, the less each extra rupee brings back.</p></div>' +
      '<div class="tw-f"><div class="lab2">5 · How sure are you?</div>' + uncChips() + '</div>' + whoField(6);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Where should we spend our marketing budget?</p><div class="lab2" style="margin-top:14px">Routes it will compare</div><div class="tw-pills">' + names.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src"><li>' + pm('int') + '<span><b>Your numbers</b><small>Sales and margin for each route, and your current split.</small></span></li><li>' + pm('asm') + '<span><b>Your assumptions</b><small>How quickly returns fade, and how sure you are, as ranges.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>5,000 scenarios, each with its own best split</li><li>How your current split compares with the best one</li><li>The spend at which each route stops paying back</li><li>A draft decision memo and actions waiting for you</li></ul><p class="note" style="margin:14px 0 0">The starting numbers are illustrative for ' + esc(lcFirst(TD[S.ind].co)) + '. Change them to your own.</p></div>';
    var bad = budgetChecks();
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function bRows() {
    var b = B(), c = budgetCfg(), names = budgetRng(), rows = [{ l: 'Budget to place', v: '₹100 crore', t: 'int', ok: true }, { l: 'Current split', v: b.split + ' (% of budget)', t: 'int', ok: true }];
    names.forEach(function (n, r) {
      rows.push({ l: n + ': sales from ₹50 crore of spend', v: '₹' + Math.round(b.R[r]) + ' crore (range ' + Math.round(c.rng[r * 3][0]) + ' to ' + Math.round(c.rng[r * 3][2]) + ')', t: 'int', ok: b.R[r] > 0, msg: 'Above zero' });
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
    ctx.textAlign = 'center'; ctx.fillText(budgetRng()[1] + ', ₹ crore', (ml + w - mr) / 2, h - 5);
    ctx.save(); ctx.translate(11, (mt + h - mb) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(budgetRng()[0] + ', ₹ crore', 0, 0); ctx.restore();
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
      right = '<div class="tw-card">' + (run ? runBar('Drawing scenarios') : '<div class="lab2">' + pm('ana') + '5,000 possible futures</div>') + '<canvas class="tw-cv" id="tw-cv" aria-label="Scatter of the best split in each of 5,000 scenarios"></canvas><div class="lg"><span><i style="background:#172B3A"></i>' + esc(names[0]) + ' leads</span><span><i style="background:#557C78"></i>' + esc(names[1]) + ' leads</span><span><i style="background:#A6B0B8"></i>' + esc(names[2]) + ' leads</span></div><p class="note" style="margin:8px 0 0">Each dot is one possible future. Its position is the best split in that future, and its colour is the route that gets the most.</p></div>';
      if (ran) right += '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Your split against the best one</div><table class="tw-t"><thead><tr><th></th><th>Split</th><th>Average contribution</th><th>Worst 10%</th></tr></thead><tbody><tr><td>Your current split</td><td>' + E.planSplit + '</td><td>' + cr(E.planMean) + '</td><td>' + cr(E.p10plan) + '</td></tr><tr class="hit"><td>Best split</td><td>' + E.best.join(' / ') + '</td><td>' + cr(E.bestMean) + '</td><td>' + cr(E.p10best) + '</td></tr></tbody></table><p class="note" style="margin:10px 0 0">The best split beats yours in <b>' + Math.round(E.beat * 100) + '%</b> of the 5,000 scenarios.</p></div>' +
        '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Where more spend stops being worth it</div><table class="tw-t"><thead><tr><th>Route</th><th>Spend beyond which more is not worth it</th><th>80% range</th></tr></thead><tbody>' + names.map(function (n, r) { var s = E.stop[r]; return '<tr><td>' + esc(n) + '</td><td>' + cr(s.p50) + '</td><td>' + Math.round(s.p10) + ' to ' + (s.p90 > 100 ? 'over 100' : Math.round(s.p90)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    return { left: left, right: right, ok: ran, why: 'Run the scenarios to continue.' };
  }
  function budgetSignals() {
    var E = B().E, names = budgetRng(), sig = [], same = E.best.join() === E.planSplit.split(' / ').join(), hg = E.hinge[0], KM = { R: 'the sales you expect from ₹50 crore of spend', m: 'margin', b: 'how fast returns fade' };
    var bestTxt = E.best.map(function (v, r) { return '₹' + v + ' crore in ' + names[r].toLowerCase(); }).join(', ');
    sig.push({ id: 'b-best', head: same ? 'Your current split is already the best on your numbers' : 'The best split is ' + E.best.join(' / ') + ' (% of budget)', body: same ? 'No other split beats it on average.' : 'Placing ' + bestTxt + ' averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for your current ' + E.planSplit + '. It beats your split in ' + Math.round(E.beat * 100) + '% of 5,000 scenarios.', why: 'It rests on the sales and margin numbers you entered.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana', 'int', 'asm'], score: 5 });
    sig.push({ id: 'b-risk', head: 'In the worst 10% of scenarios the best split returns ' + cr(E.p10best), body: 'Your current split returns ' + cr(E.p10plan) + ' in the same worst 10%.', why: 'A split that is better on average is not always safer.', src: [{ l: '5,000 scenarios from your ranges', u: null }], ev: ['ana'], score: 3 });
    sig.push({ id: 'b-stop', head: 'More spend stops being worth it at different points', body: names.map(function (n, r) { return n + ': near ' + cr(E.stop[r].p50); }).join('. ') + '.', why: 'Past that point, each extra rupee brings back less than a rupee.', src: [{ l: 'Stopping points from your ranges', u: null }], ev: ['ana', 'asm'], score: 4 });
    sig.push({ id: 'b-hinge', head: 'The answer depends most on ' + names[hg.r].toLowerCase() + ': ' + KM[hg.k], body: 'At the low or high end of its range, the best split moves by up to ' + Math.round(hg.dist) + ' points of the budget.', why: 'This is the number to replace with a measured one first.', src: [{ l: 'Sensitivity test on your ranges', u: null }], ev: ['ana', 'asm'], score: 4.5 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function budgetMemo() {
    var E = B().E, names = budgetRng(), sig = budgetSignals(), ks = keptOf(sig), hg = E.hinge[0], KM = { R: 'the sales you expect from ₹50 crore of spend', m: 'margin', b: 'how fast returns fade' };
    var same = E.best.join() === E.planSplit.split(' / ').join();
    return { q: 'Where should we spend our marketing budget?', who: S.who.trim(), rec: same ? 'Keep your current split of ' + E.planSplit + '.' : 'Place ' + E.best.map(function (v, r) { return '₹' + v + ' crore in ' + names[r].toLowerCase(); }).join(', ').replace(/, ([^,]*)$/, ' and $1') + '.', trade: same ? 'No other split beats yours on average.' : 'It averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for your current ' + E.planSplit + ' split. It beats your split in ' + Math.round(E.beat * 100) + '% of 5,000 scenarios.', unc: 'The answer depends most on ' + names[hg.r].toLowerCase() + ': ' + KM[hg.k] + '. At the low or high end of its range, the best split moves by up to ' + Math.round(hg.dist) + ' points of the budget.', next: 'Replace the numbers you typed with ' + TD[S.ind].budget.evidence + ', then run it again.', ks: ks, top: null, sig: sig };
  }
  function budgetMd(M2) { var b = B(); return mdBase('Marketing budget brief', M2, ['Budget: ₹100 crore. Current split: ' + b.split + '.', 'Sales from ₹50 crore of spend: ' + budgetRng().map(function (n, r) { return n + ' ₹' + Math.round(b.R[r]) + ' crore'; }).join(', ') + '. Margins: ' + b.m.map(function (x) { return Math.round(x * 100) + '%'; }).join(', ') + '.', 'Returns fade: ' + { slow: 'slowly', med: 'normally', fast: 'quickly' }[b.fade] + '. Ranges: ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc] + '.'], ['Sales, margin and fade numbers are your inputs and assumptions, not measured results.', 'Each route is modelled as an independent curve, so this is the best split inside the model, not a forecast.']); }

  /* ====================================================================
     NEW MARKET
     ==================================================================== */
  function K() { if (!S.K) S.K = { cs: null, wt: {} }; return S.K; }
  function WBI() { return WB.industries[S.ind]; }
  function kCos() { var ids = K().cs || WBI().countries.map(function (c) { return c.iso; }); return WBI().countries.filter(function (c) { return ids.indexOf(c.iso) >= 0; }); }
  function wOf(code) { var w = K().wt[code]; return w === undefined ? 2 : w; }
  function fmtV(ind, v) { if (ind.unit === 'people') return v >= 1e6 ? (v / 1e6).toFixed(1) + ' million' : grp(v); if (ind.unit === 'US$') return '$' + grp(v); return v.toFixed(1) + '%'; }
  function kScore() {
    var cs = kCos(), inds = WBI().indicators, mm = {}, rows;
    inds.forEach(function (i) { var vs = cs.map(function (c) { return c.v[i.code].val; }); mm[i.code] = [Math.min.apply(null, vs), Math.max.apply(null, vs)]; });
    function sc(w) { var tot = 0; inds.forEach(function (i) { tot += w[i.code]; }); return cs.map(function (c) { var s = 0, parts = {}; inds.forEach(function (i) { var r = mm[i.code], n = r[1] > r[0] ? (c.v[i.code].val - r[0]) / (r[1] - r[0]) : 0.5; parts[i.code] = tot ? w[i.code] * n * 100 / tot : 0; s += parts[i.code]; }); return { c: c, score: s, parts: parts }; }); }
    var w0 = {}; inds.forEach(function (i) { w0[i.code] = wOf(i.code); });
    rows = sc(w0).sort(function (a, b) { return b.score - a.score; });
    var rng = M.mulberry32(21), first = {}, k, N = 5000; cs.forEach(function (c) { first[c.iso] = 0; });
    for (k = 0; k < N; k++) { var w = {}; inds.forEach(function (i) { w[i.code] = w0[i.code] * (0.5 + rng()); }); var r2 = sc(w).sort(function (a, b) { return b.score - a.score; }); first[r2[0].c.iso]++; }
    rows.forEach(function (r, i) { r.rank = i + 1; r.first = first[r.c.iso] / N; });
    return { rows: rows, w0: w0, mm: mm, any: inds.some(function (i) { return w0[i.code] > 0; }) };
  }
  function vKSetup() {
    var cs = WBI().countries, ids = K().cs || cs.map(function (c) { return c.iso; });
    var left = indChips() + '<div class="tw-f"><div class="lab2">2 · Countries to compare</div>' + cs.map(function (c) { return '<label class="tw-ck"><input type="checkbox" data-act="kco" data-v="' + c.iso + '"' + (ids.indexOf(c.iso) >= 0 ? ' checked' : '') + '><span><b>' + esc(c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam')) + '</b></span></label>'; }).join('') + '<p class="note" style="margin:6px 0 0">Choose at least two.</p></div>' + whoField(3);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">Which new market should we look at first?</p><div class="lab2" style="margin-top:14px">What it will compare</div><ul class="tw-src">' + WBI().indicators.map(function (i) { return '<li>' + pm('pub') + '<span><b>' + esc(i.name) + '</b><small>World Bank open data' + (i.date ? ', ' + i.date + ' (last full year before the pandemic)' : ', latest available year') + '</small></span></li>'; }).join('') + '</ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>The real figures for each country, with the year and source</li><li>A score for each market, with weights you set</li><li>How stable the ranking is when the weights change</li><li>A draft decision memo and actions waiting for you</li></ul><p class="note" style="margin:14px 0 0">These are real World Bank figures, copied on ' + fmtDate(CW.snapshot) + '. The page does not fetch them live.</p></div>';
    return { left: left, right: right, ok: kCos().length >= 2, why: 'Choose at least two countries.' };
  }
  function vKCollect() {
    var done = S.done.collect, run = S.running, inds = WBI().indicators, cs = kCos();
    var left = '<p class="tw-note">Press the button and watch each indicator being read for every country you chose. The year shows how recent each figure is.</p><button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading sources' : 'Collect from the World Bank') + '</button>';
    var plan = '<div class="tw-card"><div class="lab2">Sources</div><table class="tw-t"><thead><tr><th>Indicator</th><th>Source</th><th>Found</th></tr></thead><tbody>' + inds.map(function (i, n) { var st = done ? 'done' : (run ? (n < S._ci ? 'done' : n === S._ci ? 'run' : 'wait') : 'wait'); return '<tr class="' + st + '"><td>' + esc(i.name) + '</td><td>World Bank</td><td class="st">' + (st === 'done' ? '<b>' + cs.length + '</b> countries' : st === 'run' ? 'Reading…' : 'Waiting') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var right = plan;
    if (done) right += '<div class="tw-card"><div class="lab2">' + pm('pub') + 'The figures</div><div class="tw-scroll"><table class="tw-t log"><thead><tr><th>Country</th>' + inds.map(function (i) { return '<th>' + esc(i.name) + '</th>'; }).join('') + '</tr></thead><tbody>' + cs.map(function (c) { return '<tr><td>' + esc(c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam')) + '</td>' + inds.map(function (i) { var x = c.v[i.code]; return '<td>' + fmtV(i, x.val) + '<small class="yr">' + x.year + '</small></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="note" style="margin:10px 0 0">Each figure links to its World Bank series: ' + inds.map(function (i) { return '<a href="https://data.worldbank.org/indicator/' + i.code + '" target="_blank" rel="noopener">' + esc(i.name) + '</a>'; }).join(', ') + '.</p></div>';
    if (done) { var old = []; inds.forEach(function (i) { if (i.date) old.push(i.name + ' is for ' + i.date + ', the last full year before the pandemic. Later figures are incomplete.'); }); right += '<div class="tw-card gap"><div class="lab2">Gaps, shown not hidden</div><ul class="tw-g">' + old.map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '<li>' + pm('asm') + 'These indicators say nothing about competition, regulation, entry cost or fit with your offer.</li></ul></div>'; }
    return { left: left, right: right, ok: done, why: 'Collect the data to continue.', n: inds.length };
  }
  function vKAnalyse() {
    var A = kScore(), inds = WBI().indicators;
    var left = '<p class="tw-note">Each indicator is scaled from 0 (lowest of your countries) to 100 (highest). A market’s score is the weighted average. Set what matters to you.</p><div class="tw-f"><div class="lab2">How much each indicator matters</div>' + inds.map(function (i) { return '<div class="tw-imp"><span>' + esc(i.name) + '</span><div class="chp sm" role="group" aria-label="' + esc(i.name) + '">' + IMP.map(function (l, v) { return '<button type="button" data-act="kw" data-k="' + i.code + '" data-v="' + v + '" aria-pressed="' + (wOf(i.code) === v) + '">' + l + '</button>'; }).join('') + '</div></div>'; }).join('') + '<p class="note" style="margin:8px 0 0">' + pm('asm') + 'Assumption: higher is better for every indicator.</p></div>';
    var cols = ['#172B3A', '#557C78', '#E8A33D', '#A6B0B8'];
    var right = A.any ? '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Market scores out of 100</div><div class="tw-bars">' + A.rows.map(function (r) { return '<div class="tw-br' + (r.rank === 1 ? ' best' : '') + '"><span class="n">' + esc(r.c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam')) + (r.rank === 1 ? '<em>Top</em>' : '') + '</span><div class="trk k">' + inds.map(function (i, n) { return '<i class="sg" style="width:' + r.parts[i.code].toFixed(2) + '%;background:' + cols[n % 4] + '"></i>'; }).join('') + '</div><span class="v">' + r.score.toFixed(0) + '</span></div>'; }).join('') + '</div><div class="lg">' + inds.map(function (i, n) { return '<span><i style="background:' + cols[n % 4] + '"></i>' + esc(i.name) + '</span>'; }).join('') + '</div></div>' +
      '<div class="tw-card"><div class="lab2">' + pm('ana') + 'How stable is the ranking?</div><table class="tw-t"><thead><tr><th>Rank</th><th>Market</th><th>Score</th><th>Ranked first when weights vary</th></tr></thead><tbody>' + A.rows.map(function (r) { return '<tr' + (r.rank === 1 ? ' class="hit"' : '') + '><td>' + r.rank + '</td><td>' + esc(r.c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam')) + '</td><td>' + r.score.toFixed(0) + '</td><td>' + Math.round(r.first * 100) + '%</td></tr>'; }).join('') + '</tbody></table><p class="note" style="margin:10px 0 0">The last column changes each weight by up to 50% either way, 5,000 times, and counts how often each market comes first.</p></div>' : '<div class="tw-card"><p class="tw-q">Every indicator is set to ignore.</p><p class="note">Give at least one indicator some weight to see scores.</p></div>';
    return { left: left, right: right, ok: A.any, why: 'Give at least one indicator some weight.', A: A };
  }
  function marketSignals() {
    var A = kScore(), inds = WBI().indicators, r = A.rows, top = r[0], sec = r[1], sig = [], nm = function (c) { return c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam'); };
    function ordered(row) { return inds.filter(function (i) { return A.w0[i.code] > 0; }).map(function (i) { var rr = A.mm[i.code], v = row.c.v[i.code].val, n = rr[1] > rr[0] ? (v - rr[0]) / (rr[1] - rr[0]) : 0.5; return { i: i, n: n, v: v }; }).sort(function (a, b) { return b.n - a.n; }); }
    var o = ordered(top);
    sig.push({ id: 'k-top', head: nm(top.c) + ' scores highest, at ' + top.score.toFixed(0) + ' out of 100', body: 'Strongest on ' + o.slice(0, 2).map(function (x) { return lcAcr(x.i.name) + ' (' + fmtV(x.i, x.v) + ')'; }).join(' and ') + '.', why: 'The score reflects the weights you set and only these indicators.', src: o.slice(0, 2).map(function (x) { return { l: x.i.name, u: 'https://data.worldbank.org/indicator/' + x.i.code }; }), ev: ['pub', 'ana'], score: 5 });
    if (sec) sig.push({ id: 'k-gap', head: nm(top.c) + ' leads ' + nm(sec.c) + ' by ' + (top.score - sec.score).toFixed(0) + ' points', body: nm(top.c) + ' comes first in ' + Math.round(top.first * 100) + '% of 5,000 weight variations, ' + nm(sec.c) + ' in ' + Math.round(sec.first * 100) + '%.', why: top.first < 0.6 ? 'The lead is not secure. A small change in what matters could reorder the top.' : 'The lead holds across most reasonable weightings.', src: [{ l: 'Weight variation test', u: null }], ev: ['ana'], score: 4 });
    var weak = o[o.length - 1]; if (weak) sig.push({ id: 'k-weak', head: nm(top.c) + ' is weakest on ' + weak.i.name.toLowerCase(), body: fmtV(weak.i, weak.v) + ', ' + (weak.n < 0.34 ? 'among the lowest of the countries you chose' : 'below its other strengths') + '.', why: 'The weakest indicator is the likeliest source of a problem.', src: [{ l: weak.i.name, u: 'https://data.worldbank.org/indicator/' + weak.i.code }], ev: ['pub', 'ana'], score: 3 });
    var stale = inds.filter(function (i) { return i.date; });
    if (stale.length) sig.push({ id: 'k-year', head: 'Some figures are older than the rest', body: stale.map(function (i) { return i.name + ' is for ' + i.date + '.'; }).join(' ') + ' The others are 2022 to 2025.', why: 'Mixed years make comparisons rougher than they look.', src: [{ l: 'World Bank series', u: 'https://data.worldbank.org/indicator/' + stale[0].code }], ev: ['pub', 'asm'], score: 2 });
    return sig.sort(function (a, c) { return c.score - a.score; });
  }
  function marketMemo() {
    var A = kScore(), r = A.rows, top = r[0], sec = r[1], sig = marketSignals(), ks = keptOf(sig), nm = function (c) { return c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam'); };
    return { q: 'Which new market should we look at first?', who: S.who.trim(), rec: 'Look at ' + nm(top.c) + ' first' + (sec ? ', with ' + nm(sec.c) + ' as the alternative' : '') + '.', trade: nm(top.c) + ' scores ' + top.score.toFixed(0) + ' out of 100 and comes first in ' + Math.round(top.first * 100) + '% of 5,000 weight variations. Public indicators narrow the field. They do not choose.', unc: 'These indicators say nothing about competition, regulation, entry cost or how well your offer fits each country.', next: 'Check who already competes in ' + nm(top.c) + ' and what the route to market and approvals look like.', ks: ks, top: { co: { name: nm(top.c) } }, sig: sig };
  }
  function marketMd(M2) { var A = kScore(); return mdBase('New market brief', M2, ['Countries compared: ' + kCos().map(function (c) { return c.name; }).join(', ') + '.', 'Weights: ' + WBI().indicators.map(function (i) { return i.name + ' ' + IMP[wOf(i.code)].toLowerCase(); }).join(', ') + '.'], ['Higher is treated as better for every indicator.', 'Figures are from different years, shown beside each value.', 'Competition, regulation and entry cost are not in the data.']); }

  /* ====================================================================
     Generic memo, act, markdown
     ==================================================================== */
  function keptOf(sig) { if (!S.keep) S.keep = {}; sig.forEach(function (s, i) { if (S.keep[s.id] === undefined) S.keep[s.id] = i < 3; }); return sig.filter(function (s) { return S.keep[s.id]; }); }
  function mdBase(title, M2, setup, assumptions) {
    var o = '# ' + title + ': ' + (S.q === 'watch' ? IND().label : TD[S.ind].label) + '\n\n_' + (M2.who ? 'Prepared for ' + M2.who + '. ' : '') + 'Draft. Illustrative example, as at ' + fmtDate(CW.snapshot) + '. A designated analyst would review this before delivery._\n\n## Question\n\n' + M2.q + '\n\n## Recommendation\n\n' + M2.rec + '\n\n' + M2.trade + '\n\n## What the analysis shows\n\n';
    M2.ks.forEach(function (s) { o += '- **' + s.head + '.** ' + s.body + (s.src && s.src.length ? ' ' + s.src.map(function (r) { return r.u ? '[' + r.l + '](' + r.u + ')' : r.l; }).join(', ') : '') + '\n'; });
    o += '\n## Inputs\n\n' + setup.map(function (x) { return '- ' + x; }).join('\n') + '\n\n## Assumptions and limits\n\n' + assumptions.map(function (x) { return '- ' + x; }).join('\n') + '\n\n## Key uncertainty\n\n' + M2.unc + '\n\n## Next action\n\n' + M2.next + '\n';
    return o;
  }
  function memoFor() {
    if (S.q === 'price') return priceMemo();
    if (S.q === 'budget') return budgetMemo();
    if (S.q === 'market') return marketMemo();
    var A = analyse(); return memo(A);
  }
  function mdFor(M2) {
    if (S.q === 'price') return priceMd(M2);
    if (S.q === 'budget') return budgetMd(M2);
    if (S.q === 'market') return marketMd(M2);
    return memoMd(analyse(), M2);
  }
  function assumptionsFor() {
    if (S.q === 'price') return ['How customers respond to price and how many rivals match a cut are your assumptions, shown as ranges.', 'The ranges are set by how sure you said you were.', 'No rival prices or sales history were read.'];
    if (S.q === 'budget') return ['Sales, margin and how fast returns fade are your inputs and assumptions, shown as ranges.', 'Each route is an independent curve, so this is the best split inside the model, not a forecast.', 'Rivals’ spend was not read.'];
    if (S.q === 'market') return ['Higher is treated as better for every indicator.', 'Figures are from different years, shown beside each value.', 'Competition, regulation and entry cost are not in the data.'];
    return ['The latest reported quarter is comparable across the companies, though fiscal quarters differ by a few days.', S.win + ' days is the right window for this question.', 'Filing text, pricing and news were not read.'];
  }
  function mkey() { return { watch: 'competitor-watch-' + S.ind, price: 'price-change-' + S.ind, budget: 'marketing-budget-' + S.ind, market: 'new-market-' + S.ind }[S.q]; }
  function actionsFor(M2) {
    var t = M2.top ? M2.top.co.name : 'the top rival';
    if (S.q === 'price') return [['test', 'Test the move in one segment first', 'A live engagement sets up the test and reads the result with you.'], ['evid', 'Gather how customers responded to past price changes', 'This would replace the response assumption with a measured one.'], ['rerun', 'Re-run with real figures', 'The workflow runs again on the numbers you bring.'], ['brief', 'Brief the pricing team', 'Share the memo and the assumption it depends on.']];
    if (S.q === 'budget') return [['evid', 'Replace the typed numbers with measured ones', 'Sales and margin by route from your own records.'], ['pilot', 'Move part of the budget first', 'Shift a slice toward the best split and measure it.'], ['rerun', 'Re-run next quarter', 'Compare the split and the stopping points.'], ['brief', 'Brief the marketing team', 'Share the memo and the assumption it depends on.']];
    if (S.q === 'market') return [['comp', 'Check who already competes in ' + t, 'Not in the data. A live engagement adds public sources on competitors.'], ['reg', 'Check the route to market and approvals', 'Regulation is not in these indicators.'], ['rerun', 'Re-run with your own criteria', 'Add indicators that matter to your business.'], ['brief', 'Share with the leadership team', 'The memo shows the ranking and how stable it is.']];
    return [['watch', 'Put ' + t + ' on a weekly watch', 'A live engagement schedules the workflow and sends you the brief each week.'], ['open', 'Open the filings behind the top signals', 'Links are in the memo. Open each one and read what the company said.'], ['price', 'Ask your team to check ' + t + '’s pricing and promotions', 'Not collected in this demo. A live engagement can add it as a source.'], ['rerun', 'Re-run this brief in 30 days', 'Compare the signals to see what moved.']];
  }
  function synthView(sig, controls, note) {
    keptOf(sig);
    var left = '<p class="tw-note">' + note + '</p>' + (controls || '');
    var right = sig.map(function (s, i) {
      return '<div class="tw-sig' + (S.keep[s.id] ? '' : ' off') + '"><label class="tw-ck"><input type="checkbox" data-act="keep" data-v="' + s.id + '"' + (S.keep[s.id] ? ' checked' : '') + '><span><b>' + esc(s.head) + '</b></span></label><div class="meta"><span class="rank">#' + (i + 1) + '</span><span class="ev">' + (s.ev || []).map(function (e) { return pm(e); }).join('') + {watch: 'Public source', price: 'Calculated from your inputs', budget: 'Calculated from your inputs', market: 'Public source, calculated'}[S.q] + '</span></div><p>' + esc(s.body) + '</p><p class="why"><b>Why it may matter.</b> ' + esc(s.why) + '</p>' + (s.src && s.src.some(function (r) { return r.u; }) ? '<p class="src">' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</p>' : '') + '</div>';
    }).join('');
    right += '<div class="tw-card gap"><div class="lab2">What this cannot tell you</div><ul class="tw-g">' + gapsFor().map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '</ul></div>';
    return { left: left, right: right, ok: true };
  }
  function gapsFor() {
    if (S.q === 'price') return ['Whether the response and rival-matching numbers are right. They are your assumptions.', 'Anything about rivals’ actual prices, which this demo does not read.'];
    if (S.q === 'budget') return ['Whether the sales and margin numbers are right. They are your inputs.', 'How rivals are spending, which this demo does not read.'];
    if (S.q === 'market') return ['Competition, regulation, entry cost and fit with your offer.', 'Anything more recent than the World Bank’s latest figures.'];
    return ['Why a company did something. The filing text and the company’s own explanation are not read.', 'Anything about pricing, promotions or customers. Those sources are not collected here.'];
  }
  /* ====================================================================
     Steps 5 and 6 and the shell
     ==================================================================== */
  function memoView() {
    var M2 = memoFor(), A = null, left;
    if (S.q === 'watch') {
      A = analyse();
      left = '<p class="tw-note">Choose the decision you are weighing. The recommendation is written for it, from the signals you kept.</p><div class="tw-f"><div class="lab2">Your decision</div>' + DEC.map(function (d) { return '<label class="tw-ck"><input type="radio" name="dec" data-act="dec" data-v="' + d.k + '"' + (S.dec === d.k ? ' checked' : '') + '><span><b>' + d.n + '</b></span></label>'; }).join('') + '</div><p class="tw-note"><b>Rule used:</b> the rival with the highest total score across the signals you kept is the priority. ' + M2.ks.length + ' signal' + (M2.ks.length === 1 ? '' : 's') + ' kept.</p>';
    } else left = '<p class="tw-note">The recommendation is written from the findings you kept in the last step. You kept <b>' + M2.ks.length + '</b>. Go back a step to change them.</p><p class="tw-note"><b>Rule used:</b> the memo recommends the option your analysis ranked first, and states the assumption it depends on most.</p>';
    var head = { watch: 'Competitor watch brief: ' + IND().label, price: 'Price change brief: ' + TD[S.ind].label, budget: 'Marketing budget brief: ' + TD[S.ind].label, market: 'New market brief: ' + TD[S.ind].label }[S.q];
    var right = '<div class="tw-memo"><div class="tw-mh"><div><div class="lab2">Draft decision memo</div><b>' + esc(head) + '</b>' + (M2.who ? '<span> for ' + esc(M2.who) + '</span>' : '') + '</div><span class="tagh">Draft. In a live engagement an analyst reviews it first</span></div>' +
      '<div class="rec2"><div class="lab2">' + pm('ana') + 'Recommendation</div><div class="big">' + esc(M2.rec) + '</div><p>' + esc(M2.trade) + '</p></div>' +
      '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'Key uncertainty</div><p>' + esc(M2.unc) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Next action</div><p>' + esc(M2.next) + '</p></div></div>' +
      '<div class="tw-ev"><div class="lab2">Evidence behind it</div><ul>' + M2.ks.map(function (s) { return '<li>' + pm(S.q === 'watch' || S.q === 'market' ? 'pub' : 'ana') + '<span>' + esc(s.head) + (s.src && s.src.length ? '<small>' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</small>' : '') + '</span></li>'; }).join('') + '</ul></div>' +
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
    right += '</div><form class="tw-card mailbox2" id="mailbox" novalidate><div class="lab2">Email me this memo</div><p class="note" style="margin:0 0 10px">Enter your email and we will send this memo to you. We use it only to send the memo and reply to you.</p><div class="mf"><label class="sr" for="mb-email" style="position:absolute;left:-9999px">Email</label><input type="email" id="mb-email" name="email" autocomplete="email" placeholder="name@example.com" required><div class="trap" aria-hidden="true"><input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></div><button class="btn am s" type="submit" id="mb-send">Email me the memo</button></div><p class="msg" id="mb-msg" role="status" aria-live="polite"></p></form>' +
      '<div class="tw-card"><div class="lab2">What a live engagement adds</div><ul class="tw-out"><li>The sources you choose, such as pricing pages, news and your own data</li><li>A designated analyst who reviews every brief before you see it</li><li>The brief on your schedule, month to month</li></ul></div>';
    return { left: left, right: right, ok: true };
  }
  function synthK() { var sig = marketSignals(); return synthView(sig, '', 'Each finding comes from the scores you just set. Untick any you do not want in the memo.'); }
  function synthP() { var sig = priceSignals(); return synthView(sig, '', 'Each finding comes from the 5,000 scenarios. Untick any you do not want in the memo.'); }
  function synthB() { var sig = budgetSignals(); return synthView(sig, '', 'Each finding comes from the 5,000 scenarios. Untick any you do not want in the memo.'); }
  function briefBar(parts, short) { return '<div class="tw-bar"><span class="tw-bs"><b>Your brief</b> · ' + esc(short) + '</span><span class="lab2">Your brief</span>' + parts.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>'; }
  var AD = {
    watch: { views: [wSetup, wCollect, wAnalyse, wSynth], brief: function () { return wBrief(); } },
    price: { views: [vPSetup, vPCollect, vPAnalyse, synthP], brief: function () { var p = P(); return briefBar([TD[S.ind].label, '₹' + grp(p.price) + ' per ' + TD[S.ind].price.unit, 'response -' + p.resp + '%', { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]], TD[S.ind].label + ' · price ₹' + grp(p.price) + ' · ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]); } },
    budget: { views: [vBSetup, vBCollect, vBAnalyse, synthB], brief: function () { return briefBar([TD[S.ind].label, '₹100 crore', 'current split ' + B().split, { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]], TD[S.ind].label + ' · split ' + B().split + ' · ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]); } },
    market: { views: [vKSetup, vKCollect, vKAnalyse, synthK], brief: function () { return briefBar([TD[S.ind].label, kCos().map(function (c) { return c.name.replace(', Arab Rep.', '').replace('Viet Nam', 'Vietnam'); }).join(', '), WBI().indicators.length + ' indicators'], TD[S.ind].label + ' · ' + kCos().length + ' countries · ' + WBI().indicators.length + ' indicators'); } }
  };
  function wBrief() { return chipsBar(); }

  function render(keepScroll) {
    var ad = AD[S.q], v = S.step <= 4 ? ad.views[S.step - 1]() : S.step === 5 ? memoView() : actView(), st = STEPS[S.step - 1];
    var stp = '<ol class="tw-stp" aria-label="Steps">' + STEPS.map(function (x, i) { var n = i + 1, cls = n === S.step ? 'on' : n < S.step ? 'done' : (n <= S.maxStep ? 'seen' : ''); return '<li class="' + cls + '"' + (n === S.step ? ' aria-current="step"' : '') + '><button type="button" data-act="go" data-v="' + n + '"' + (n > S.maxStep ? ' disabled' : '') + '><b>' + (n < S.step ? '✓' : n) + '</b><span>' + x.n + '</span></button></li>'; }).join('') + '</ol>';
    var mob = '<div class="tw-mstep"><b>Step ' + S.step + ' of 6</b> &middot; ' + st.n + '<div class="tw-prog"><i style="width:' + (S.step / 6 * 100) + '%"></i></div></div>';
    var qrow = '<div class="tw-q4" role="group" aria-label="Business question">' + Q.map(function (q) { return '<button type="button" data-act="q" data-v="' + q.k + '" aria-pressed="' + (S.q === q.k) + '">' + q.n + '</button>'; }).join('') + '</div>';
    var pane = '<div class="tw-pane"><div class="tw-l"><div class="tw-who"><span class="tag">' + st.who + '</span><h2>Step ' + S.step + ': ' + st.n + '</h2><p class="does"><b>What happens here.</b> ' + st.does + '</p></div>' + v.left + '</div><div class="tw-r" aria-live="polite">' + v.right + '</div></div>';
    var nav = '<div class="tw-nav"><button type="button" class="btn o" data-act="back"' + (S.step === 1 ? ' disabled' : '') + '>Back</button><span class="tw-why">' + (v.ok ? '' : esc(v.why || '')) + '</span>' + (S.step < 6 ? '<button type="button" class="btn am" data-act="next"' + (v.ok ? '' : ' disabled') + '>Next step: ' + STEPS[S.step].n.toLowerCase() + '</button>' : '<button type="button" class="btn o" data-act="restart">Start again</button>') + '</div>';
    document.documentElement.setAttribute('data-tw-step', S.step);
    var y = window.scrollY; root.innerHTML = qrow + stp + mob + (S.step > 1 ? ad.brief() : '') + pane + nav; if (keepScroll) window.scrollTo(0, y);
    var w = $('#tw-who'); if (w && S._focusWho) { w.focus(); w.setSelectionRange(w.value.length, w.value.length); }
    if (S.q === 'budget' && S.step === 3 && B().E) { var cv = $('#tw-cv'); if (cv) drawScatter(cv, B().E, S.done.run ? 1 : (S._f || 0)); }
    v.n && (S._n = v.n);
  }
  function toStep() { var t = root.querySelector(window.innerWidth <= 820 ? '.tw-mstep' : '.tw-stp'); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 820 ? 70 : 90), behavior: 'smooth' }); }
  function resetRun() { S.done = { collect: false, run: false }; S.running = false; S.showAll = false; S.keep = null; S.outcome = null; S.acts = null; S.maxStep = Math.min(S.maxStep, 2); if (S.P) S.P.E = null; if (S.B) S.B.E = null; }
  function nCollect() { if (S.q === 'watch') return srcPlan().length; if (S.q === 'price') return pRows().length; if (S.q === 'budget') return bRows().length; return WBI().indicators.length; }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (a === 'q') { S.q = v; S.step = 1; S.maxStep = 1; resetRun(); render(); }
    else if (a === 'ind') { S.ind = v; S.cos = null; S.focus.pipe = v === 'pharma'; S.P = null; S.B = null; S.K = null; resetRun(); render(true); }
    else if (a === 'win') { S.win = +v; resetRun(); render(true); }
    else if (a === 'thr') { S.thr = +v; render(true); }
    else if (a === 'imp') { S.imp[b.getAttribute('data-k')] = +v; render(true); }
    else if (a === 'kw') { K().wt[b.getAttribute('data-k')] = +v; S.keep = null; render(true); }
    else if (a === 'unc') { S.unc = v; resetRun(); render(true); }
    else if (a === 'fade') { B().fade = v; resetRun(); render(true); }
    else if (a === 'obj') { S.obj = v; S.keep = null; render(true); }
    else if (a === 'collect') { startCollect(nCollect()); }
    else if (a === 'run') {
      if (S.q === 'price') startRunEngine(function () { P().E = M.priceEngine(priceCfg()); }, 'Drawing scenarios');
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
    if (a === 'co') { var ids = S.cos || allCos().map(function (c) { return c.id; }); S.cos = t.checked ? ids.concat([t.getAttribute('data-v')]) : ids.filter(function (x) { return x !== t.getAttribute('data-v'); }); resetRun(); render(true); }
    else if (a === 'kco') { var ids2 = K().cs || WBI().countries.map(function (c) { return c.iso; }), id = t.getAttribute('data-v'); K().cs = t.checked ? ids2.concat([id]) : ids2.filter(function (x) { return x !== id; }); resetRun(); render(true); }
    else if (a === 'focus') { S.focus[t.getAttribute('data-v')] = t.checked; resetRun(); render(true); }
    else if (a === 'keep') { S.keep[t.getAttribute('data-v')] = t.checked; render(true); }
    else if (a === 'dec') { S.dec = t.getAttribute('data-v'); render(true); }
    else if (a === 'act') { S.acts[t.getAttribute('data-v')] = t.checked; }
    else if (a === 'split') { B().split = t.value; resetRun(); render(true); }
    else if (a === 'num') {
      var k = t.getAttribute('data-k'), val = num(t.value);
      if (S.q === 'price') P()[k] = val;
      else { var r = +k.slice(1); if (k.charAt(0) === 'R') B().R[r] = val; else B().m[r] = val / 100; }
      resetRun(); render(true);
    }
  });
  root.addEventListener('input', function (e) { if (e.target.getAttribute('data-act') === 'who') { S.who = e.target.value; } });
  window.__trial = { S: S, describe: function () { var q = Q.filter(function (x) { return x.k === S.q; })[0]; return q.n + ' (' + (S.q === 'market' ? TD[S.ind].label : IND().label) + ' example)'; }, memo: memoFor, md: function () { return mdFor(memoFor()); }, go: function (n) { S.step = n; S.maxStep = Math.max(S.maxStep, n); render(); }, render: render, M: M };
  try { var qq = new URLSearchParams(location.search), qk = qq.get('q'); if (qk && AD[qk]) S.q = qk; var ik = qq.get('industry'); if (ik && CW.industries[ik]) { S.ind = ik; S.focus.pipe = ik === 'pharma'; } } catch (e) {}
  render();
})();
