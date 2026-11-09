/* Try it out: three business questions, each followed step by step from set-up to a decision.
   Competitor watch reads real public records (SEC EDGAR, ClinicalTrials.gov). Responding to a rival's price move uses real offers captured from public pricing pages.
   Price response and budget run real scenario calculations on numbers you set. The page reads bundled snapshots only. Nothing is fetched live and nothing is sent. */
(function () {
  'use strict';
  var CW = window.CW, OF = window.OF, M = window.MODELS, TD = window.TD, root = document.getElementById('tw');
  if (!CW || !OF || !M || !TD || !root) return;
  var SNAP = new Date(CW.snapshot + 'T00:00:00Z');
  var STEPS = [
    { k: 'setup', n: 'Set up', does: 'You define the question, the inputs and what counts. Nothing runs yet.', who: 'You' },
    { k: 'collect', n: 'Collect', does: 'The workflow reads the sources and your inputs, logs each one with where it came from, and checks it. It does not interpret anything yet.', who: 'Workflow' },
    { k: 'analyse', n: 'Analyse', does: 'It does the calculation or comparison, using rules you can see and change.', who: 'Workflow' },
    { k: 'synth', n: 'Synthesise', does: 'It turns the analysis into findings, each with its evidence, and says what the analysis cannot tell you.', who: 'Workflow' },
    { k: 'memo', n: 'Decide and write', does: 'It drafts a decision memo from the findings you keep. In a live engagement a designated analyst reviews it at this point, before it reaches you.', who: 'Workflow, then analyst' },
    { k: 'act', n: 'Act', does: 'The memo waits for your decision. Approve it, put it on hold or ask for changes.', who: 'You' }
  ];
  var Q = [{ k: 'watch', n: 'Watch my competitors' }, { k: 'respond', n: 'Respond to a rival’s price move' }, { k: 'budget', n: 'Split my marketing budget' }];
  var S = { q: 'watch', ind: 'hotels', cos: null, focus: { fin: true, lead: true, cap: true, oth: false, pipe: true }, win: 90, who: '', thr: 3, imp: { fin: 2, lead: 2, cap: 1, oth: 1, pipe: 2 }, dec: 'priority', step: 1, done: { collect: false, run: false }, keep: null, outcome: null, running: false, maxStep: 1, unc: 'med', obj: 'mean', P: null, B: null, K: null, acts: null, _ci: 0 };
  function $(s) { return root.querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDate(d) { var x = new Date(d + 'T00:00:00Z'); return x.getUTCDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function bn(v) { return v < 1e9 ? '$' + Math.round(v / 1e6) + 'm' : '$' + (v / 1e9).toFixed(1) + 'bn'; }
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
  function U() { return TD[S.ind].cur; }
  function cr(v) { var a = Math.abs(v), u = U(); return (v < 0 ? '-' : '') + u.sym + (a < 10 ? a.toFixed(1) : Math.round(a)) + ' ' + u.big; }
  function crs(v) { return (v >= 0 ? '+' : '') + cr(v); }
  function amt(n) { var u = U(); return u.sym + n + ' ' + u.big; }
  function grp(v) { return Math.round(v).toLocaleString(U().sym === '$' ? 'en-US' : 'en-IN'); }
  function mp(v) { return U().sym + (v >= 100 ? grp(v) : v.toFixed(2).replace(/\.00$/, '')); }
  function mon(v) { var a = Math.abs(v), c = U(), sgn = (v < 0 ? '-' : '') + c.sym, big = c.sym === '$' ? [[1e6, ' million'], [1e3, ' thousand']] : [[1e7, ' crore'], [1e5, ' lakh']], i; for (i = 0; i < big.length; i++) if (a >= big[i][0]) { var x = a / big[i][0]; return sgn + (x < 10 ? x.toFixed(1).replace(/\.0$/, '') : Math.round(x)) + big[i][1]; } return sgn + Math.round(a).toLocaleString(c.sym === '$' ? 'en-US' : 'en-IN'); }
  function mons(v) { return (v >= 0 ? '+' : '') + mon(v); }
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
     RESPOND TO A RIVAL'S PRICE MOVE
     ==================================================================== */
  var LV = { L: 'Low', M: 'Medium', H: 'High' };
  function RD() { return TD[S.ind].respond; }
  function ofd() { return OF[S.ind] || null; }
  function respondInit() {
    var d = RD(), o = ofd(), m = d.manual;
    S.R = { price: d.P0, cost: d.c, vol: d.V, leak: d.leak, before: m ? m.before : null, after: m ? m.after : null, offer: d.offers && o ? o.rivals[0].offers[0].id : null, seg: d.segs.map(function (s) { return { ov: s.ov, sens: s.sens }; }), E: null };
  }
  function R() { if (!S.R) respondInit(); return S.R; }
  function offerList() { var o = ofd(), out = []; if (o) o.rivals.forEach(function (r) { r.offers.forEach(function (f) { out.push({ r: r, f: f }); }); }); return out; }
  function chosen() { var id = R().offer, l = offerList(), i; for (i = 0; i < l.length; i++) if (l[i].f.id === id) return l[i]; return null; }
  function rivalMove() {
    var d = RD(), r = R(), c = chosen();
    if (d.offers && c) return { who: c.r.name, page: c.r.page, plan: c.f.plan, before: c.f.list !== null ? c.f.list : r.price, after: c.f.eff, assumedBefore: c.f.list === null, src: c.r.url, quote: c.f.quote, cond: c.f.cond, like: c.f.like, note: c.f.note || '' };
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
      move = '<div class="tw-f"><div class="lab2">2 · The rival’s move</div><p class="note" style="margin:0 0 8px">Choose an offer to respond to. These are real offers captured from the rivals’ public pricing pages on ' + fmtDate(OF.captured) + '.</p>' + ofd().rivals.map(function (rv) {
        return '<div class="tw-rt"><b>' + esc(rv.name) + '</b>' + rv.offers.map(function (f) { return '<label class="tw-ck"><input type="radio" name="offer" data-act="offer" data-v="' + f.id + '"' + (r.offer === f.id ? ' checked' : '') + '><span><b>' + esc(f.plan) + '</b><small>' + mp(f.eff) + ' ' + d.per + (f.list !== null && f.list !== f.eff ? ', ' + mp(f.list) + ' before' : '') + (f.like ? '' : ' · not like-for-like') + '</small></span></label>'; }).join('') + '</div>';
      }).join('') + '</div>';
    } else {
      move = '<div class="tw-f"><div class="lab2">2 · The rival’s move</div><p class="note" style="margin:0 0 8px">' + esc(d.manual.who) + ' has cut its price. Enter the price before and after. This example does not read ' + (S.ind === 'hotels' ? 'hotel' : 'pharma') + ' price pages.</p>' +
        numField('before', esc(d.manual.label) + ' before (' + sym + ')', r.before, '') + numField('after', esc(d.manual.label) + ' after (' + sym + ')', r.after, '') + '</div>';
    }
    var segs = d.segs.map(function (s, i) { return '<div class="tw-rt"><b>' + esc(s.n) + '</b><small class="sg">' + Math.round(s.share * 100) + '% of your volume</small><div class="tw-sel"><label>Overlap with the rival' + segSelect(i, 'ov', r.seg[i].ov) + '</label><label>Price sensitivity' + segSelect(i, 'sens', r.seg[i].sens) + '</label></div></div>'; }).join('');
    var left = indChips() + move +
      '<div class="tw-f"><div class="lab2">3 · Your numbers</div>' + numField('price', d.ref + ' (' + sym + ')', r.price, '') + numField('cost', 'Your cost per ' + d.unit + ' (' + sym + ')', r.cost, 'Must be below your price') + numField('vol', d.volLabel, r.vol, '') + '</div>' +
      '<div class="tw-f"><div class="lab2">4 · Your customers</div><p class="note" style="margin:0 0 8px">Overlap is how many of these customers could easily take the rival’s offer. Sensitivity is how readily they switch for a lower price.</p>' + segs + '</div>' +
      '<div class="tw-f"><div class="lab2">5 · How customers react</div>' + numField('leak', 'Customers lost for each 1% the rival undercuts you (%)', r.leak, 'Typical: 0.2 to 1. This is an assumption.', '0.05') + '</div>' +
      '<div class="tw-f"><div class="lab2">6 · How sure are you?</div>' + uncChips() + '</div>' + whoField(7);
    var right = '<div class="tw-card"><div class="lab2">The workflow you are about to run</div><p class="tw-q">A rival has cut its price or launched an offer. How should we respond?</p><div class="lab2" style="margin-top:14px">Responses it will compare</div><div class="tw-pills">' + M.RESP_LABEL.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div>' +
      '<div class="lab2" style="margin-top:14px">What it will use</div><ul class="tw-src">' + (d.offers ? '<li>' + pm('pub') + '<span><b>The rival’s public pricing page</b><small>Captured on ' + fmtDate(OF.captured) + ', with the page address.</small></span></li>' : '<li>' + pm('int') + '<span><b>The rival’s price you enter</b><small>Before and after the move.</small></span></li>') + '<li>' + pm('int') + '<span><b>Your numbers and customers</b><small>Price, cost, volume and how each customer segment is exposed.</small></span></li><li>' + pm('asm') + '<span><b>Your assumptions</b><small>How strongly customers react to a price gap, each as a range.</small></span></li></ul>' +
      '<div class="lab2" style="margin-top:14px">What you will get</div><ul class="tw-out"><li>What the move costs you if you do nothing</li><li>Which customer segments are most exposed</li><li>Four responses, each with its profit change and range</li><li>What to watch next, and what not to do</li><li>A draft decision memo and actions waiting for you</li></ul>' +
      '<p class="note" style="margin:14px 0 0">' + (d.offers ? 'The rival’s prices are real. ' : '') + 'The numbers about your company are illustrative for ' + esc(lcFirst(TD[S.ind].co)) + '. Change them to your own.</p></div>';
    return { left: left, right: right, ok: bad.length === 0, why: bad[0] };
  }
  function rRows() {
    var d = RD(), r = R(), c = respondCfg(), mv = rivalMove(), rows = [];
    if (d.offers) {
      rows.push({ l: 'Rival page: ' + mv.who + ', ' + mv.page, v: '<a href="' + mv.src + '" target="_blank" rel="noopener">' + esc(mv.src.replace('https://', '')) + '</a>, captured ' + fmtDate(OF.captured), t: 'pub', ok: true });
      rows.push({ l: 'Rival offer: ' + mv.plan, v: mp(mv.after) + ' ' + d.per + (mv.assumedBefore ? '. No earlier price on the page, so we assume the rival was level with you' : ', was ' + mp(mv.before)), t: 'pub', ok: true });
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
    if (d.offers && done) right += '<div class="tw-card"><div class="lab2">' + pm('pub') + 'What the page said</div><p class="tw-q" style="font-size:16px">“' + esc(mv.quote) + '”</p><p class="note" style="margin:6px 0 0">' + esc(mv.who) + ', <a href="' + mv.src + '" target="_blank" rel="noopener">' + esc(mv.page) + ' page</a>, captured ' + fmtDate(OF.captured) + '.</p></div>';
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
    var E = R().E, st = respondStats(), b = st.best, s2 = st.second, sig = [], mv = rivalMove(), src = mv.src ? [{ l: mv.who + ' ' + mv.page + ' page, captured ' + fmtDate(OF.captured), u: mv.src }] : [{ l: 'The rival price you entered', u: null }], scen = [{ l: '5,000 scenarios from your ranges', u: null }];
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
    return mdBase('Rival price move brief', M2, [(d.offers ? 'Rival: ' + mv.who + ', ' + mv.plan + ', ' + mp(mv.after) + ' ' + d.per + (mv.assumedBefore ? '' : ', was ' + mp(mv.before)) + '. Source: ' + mv.src + ', captured ' + fmtDate(OF.captured) + '.' : 'Rival price entered: ' + mp(mv.before) + ' before, ' + mp(mv.after) + ' after.'), 'Your price ' + mp(r.price) + ', cost ' + mp(r.cost) + ', volume ' + grp(r.vol) + '.', 'Customers lost per 1% undercut: ' + r.leak + '%. Ranges set as: ' + ({ narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]) + '.', 'Best is judged by: ' + (S.obj === 'p10' ? 'avoiding big losses' : 'highest average profit') + '.'], respondAssum()) + mdExtra(M2);
  }
  function respondAssum() { return ['How strongly customers react to a price gap, and how many a response keeps, are your assumptions, shown as ranges.', RD().offers ? 'The rival’s prices are as shown on its public page on ' + fmtDate(OF.captured) + '. Offers shown only in store, by address or to existing customers are not captured.' : 'The rival’s prices are the ones you entered.', 'Only the next 12 months of profit are counted, and the rival is assumed not to move again.']; }
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
    sig.push({ id: 'b-stop', head: 'More spend stops being worth it at different points', body: names.map(function (n, r) { return n + ': near ' + cr(E.stop[r].p50); }).join('. ') + '.', why: 'Past that point, each extra rupee brings back less than a rupee.', src: [{ l: 'Stopping points from your ranges', u: null }], ev: ['ana', 'asm'], score: 4 });
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
    if (S.q === 'respond') return respondMemo();
    if (S.q === 'budget') return budgetMemo();
    var A = analyse(); return memo(A);
  }
  function mdFor(M2) {
    if (S.q === 'respond') return respondMd(M2);
    if (S.q === 'budget') return budgetMd(M2);
    return memoMd(analyse(), M2);
  }
  function assumptionsFor() {
    if (S.q === 'respond') return respondAssum();
    if (S.q === 'budget') return ['Sales, margin and how fast returns fade are your inputs and assumptions, shown as ranges.', 'Each channel is an independent curve, so this is the best split inside the model, not a forecast.', 'Rivals’ spend was not read.'];
    return ['The latest reported quarter is comparable across the companies, though fiscal quarters differ by a few days.', S.win + ' days is the right window for this question.', 'Filing text, pricing and news were not read.'];
  }
  function mkey() { return { watch: 'competitor-watch-' + S.ind, respond: 'rival-price-move-' + S.ind, budget: 'marketing-budget-' + S.ind }[S.q]; }
  function actionsFor(M2) {
    var t = M2.top ? M2.top.co.name : 'the top rival';
    if (S.q === 'respond') return [['test', 'Try the response on the most exposed segment first', 'A live engagement sets it up and reads the result with you.'], ['watch', 'Put the rival’s pricing page on a weekly watch', 'A live engagement captures the page every week and flags changes.'], ['evid', 'Replace the reaction assumption with your own data', 'Use customers lost after past rival moves.'], ['brief', 'Brief the pricing team', 'Share the memo and the assumption it depends on.']];
    if (S.q === 'budget') return [['evid', 'Replace the typed numbers with measured ones', 'Sales and margin by route from your own records.'], ['pilot', 'Move part of the budget first', 'Shift a slice toward the best split and measure it.'], ['rerun', 'Re-run next quarter', 'Compare the split and the stopping points.'], ['brief', 'Brief the marketing team', 'Share the memo and the assumption it depends on.']];
    return [['watch', 'Put ' + t + ' on a weekly watch', 'A live engagement schedules the workflow and sends you the brief each week.'], ['open', 'Open the filings behind the top signals', 'Links are in the memo. Open each one and read what the company said.'], ['price', 'Ask your team to check ' + t + '’s pricing and promotions', 'Not collected in this demo. A live engagement can add it as a source.'], ['rerun', 'Re-run this brief in 30 days', 'Compare the signals to see what moved.']];
  }
  function synthView(sig, controls, note) {
    keptOf(sig);
    var left = '<p class="tw-note">' + note + '</p>' + (controls || '');
    var right = sig.map(function (s, i) {
      return '<div class="tw-sig' + (S.keep[s.id] ? '' : ' off') + '"><label class="tw-ck"><input type="checkbox" data-act="keep" data-v="' + s.id + '"' + (S.keep[s.id] ? ' checked' : '') + '><span><b>' + esc(s.head) + '</b></span></label><div class="meta"><span class="rank">#' + (i + 1) + '</span><span class="ev">' + (s.ev || []).map(function (e) { return pm(e); }).join('') + {watch: 'Public source', respond: 'Public source, calculated', budget: 'Calculated from your inputs'}[S.q] + '</span></div><p>' + esc(s.body) + '</p><p class="why"><b>Why it may matter.</b> ' + esc(s.why) + '</p>' + (s.src && s.src.some(function (r) { return r.u; }) ? '<p class="src">' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</p>' : '') + '</div>';
    }).join('');
    right += '<div class="tw-card gap"><div class="lab2">What this cannot tell you</div><ul class="tw-g">' + gapsFor().map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '</ul></div>';
    return { left: left, right: right, ok: true };
  }
  function gapsFor() {
    if (S.q === 'respond') return ['Whether customers really switch at the rate you assumed. That is your assumption.', 'How many customers the rival is winning, which is not public.', RD().offers ? 'Offers shown only in store, by address or to existing customers.' : 'The rival’s real prices, which this example does not read.'];
    if (S.q === 'budget') return ['Whether the sales and margin numbers are right. They are your inputs.', 'How rivals are spending, which this demo does not read.'];
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
    var head = { watch: 'Competitor watch brief: ' + IND().label, respond: 'Rival price move brief: ' + TD[S.ind].label, budget: 'Marketing budget brief: ' + TD[S.ind].label }[S.q];
    var right = '<div class="tw-memo"><div class="tw-mh"><div><div class="lab2">Draft decision memo</div><b>' + esc(head) + '</b>' + (M2.who ? '<span> for ' + esc(M2.who) + '</span>' : '') + '</div><span class="tagh">Draft. In a live engagement an analyst reviews it first</span></div>' +
      '<div class="rec2"><div class="lab2">' + pm('ana') + 'Recommendation</div><div class="big">' + esc(M2.rec) + '</div><p>' + esc(M2.trade) + '</p></div>' +
      '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'Key uncertainty</div><p>' + esc(M2.unc) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Next action</div><p>' + esc(M2.next) + '</p></div></div>' +
      (M2.dont ? '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'What not to do</div><p>' + esc(M2.dont) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Confidence: ' + esc(M2.conf) + '</div><p>' + esc(M2.change) + '</p></div></div><div class="tw-ev"><div class="lab2">Watch next</div><ul>' + M2.watch.map(function (w) { return '<li>' + pm('asm') + '<span>' + esc(w[0]) + '<small>Where to look: ' + esc(w[1]) + '</small></span></li>'; }).join('') + '</ul></div>' : '') +
      '<div class="tw-ev"><div class="lab2">Evidence behind it</div><ul>' + M2.ks.map(function (s) { return '<li>' + pm(S.q === 'watch' || (s.ev && s.ev.indexOf('pub') >= 0) ? 'pub' : 'ana') + '<span>' + esc(s.head) + (s.src && s.src.length ? '<small>' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</small>' : '') + '</span></li>'; }).join('') + '</ul></div>' +
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
  function synthB() { var sig = budgetSignals(); return synthView(sig, '', 'Each finding comes from the 5,000 scenarios. Untick any you do not want in the memo.'); }
  function briefBar(parts, short) { return '<div class="tw-bar"><span class="tw-bs"><b>Your brief</b> · ' + esc(short) + '</span><span class="lab2">Your brief</span>' + parts.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>'; }
  var AD = {
    watch: { views: [wSetup, wCollect, wAnalyse, wSynth], brief: function () { return wBrief(); } },
    respond: { views: [vRSetup, vRCollect, vRAnalyse, synthR], brief: function () { var mv = rivalMove(); return briefBar([TD[S.ind].label, mv.who + ' ' + mv.plan, mp(mv.after) + ' ' + RD().per, { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]], TD[S.ind].label + ' · ' + mv.who + ' ' + mp(mv.after) + ' · ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]); } },
    budget: { views: [vBSetup, vBCollect, vBAnalyse, synthB], brief: function () { return briefBar([TD[S.ind].label, amt(100), 'current split ' + B().split, { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]], TD[S.ind].label + ' · split ' + B().split + ' · ' + { narrow: 'quite sure', med: 'fairly sure', wide: 'not very sure' }[S.unc]); } }
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
  function resetRun() { S.done = { collect: false, run: false }; S.running = false; S.showAll = false; S.keep = null; S.outcome = null; S.acts = null; S.maxStep = Math.min(S.maxStep, 2); if (S.R) S.R.E = null; if (S.B) S.B.E = null; }
  function nCollect() { if (S.q === 'watch') return srcPlan().length; if (S.q === 'respond') return rRows().length; return bRows().length; }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (a === 'q') { S.q = v; S.step = 1; S.maxStep = 1; resetRun(); render(); }
    else if (a === 'ind') { S.ind = v; S.cos = null; S.focus.pipe = v === 'pharma'; S.R = null; S.B = null; resetRun(); render(true); }
    else if (a === 'win') { S.win = +v; resetRun(); render(true); }
    else if (a === 'thr') { S.thr = +v; render(true); }
    else if (a === 'imp') { S.imp[b.getAttribute('data-k')] = +v; render(true); }
    else if (a === 'unc') { S.unc = v; resetRun(); render(true); }
    else if (a === 'fade') { B().fade = v; resetRun(); render(true); }
    else if (a === 'obj') { S.obj = v; S.keep = null; render(true); }
    else if (a === 'collect') { startCollect(nCollect()); }
    else if (a === 'run') {
      if (S.q === 'respond') startRunEngine(function () { R().E = M.respondEngine(respondCfg()); }, 'Drawing scenarios');
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
    else if (a === 'offer') { R().offer = t.getAttribute('data-v'); resetRun(); render(true); }
    else if (a === 'seg') { R().seg[+t.getAttribute('data-i')][t.getAttribute('data-f')] = t.value; resetRun(); render(true); }
    else if (a === 'focus') { S.focus[t.getAttribute('data-v')] = t.checked; resetRun(); render(true); }
    else if (a === 'keep') { S.keep[t.getAttribute('data-v')] = t.checked; render(true); }
    else if (a === 'dec') { S.dec = t.getAttribute('data-v'); render(true); }
    else if (a === 'act') { S.acts[t.getAttribute('data-v')] = t.checked; }
    else if (a === 'split') { B().split = t.value; resetRun(); render(true); }
    else if (a === 'num') {
      var k = t.getAttribute('data-k'), val = num(t.value);
      if (S.q === 'respond') R()[k] = val;
      else { var r = +k.slice(1); if (k.charAt(0) === 'R') B().R[r] = val; else B().m[r] = val / 100; }
      resetRun(); render(true);
    }
  });
  root.addEventListener('input', function (e) { if (e.target.getAttribute('data-act') === 'who') { S.who = e.target.value; } });
  window.__trial = { S: S, describe: function () { var q = Q.filter(function (x) { return x.k === S.q; })[0]; return q.n + ' (' + IND().label + ' example)'; }, memo: memoFor, md: function () { return mdFor(memoFor()); }, go: function (n) { S.step = n; S.maxStep = Math.max(S.maxStep, n); render(); }, render: render, M: M };
  try { var qq = new URLSearchParams(location.search), qk = qq.get('q'); if (qk && AD[qk]) S.q = qk; var ik = qq.get('industry'); if (ik && CW.industries[ik]) { S.ind = ik; S.focus.pipe = ik === 'pharma'; } } catch (e) {}
  render();
})();
