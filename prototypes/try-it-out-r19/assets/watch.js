/* Try it out: a step-by-step competitor-watch brief on real public records (SEC EDGAR and ClinicalTrials.gov), as at the snapshot date in competitor-data.js.
   The page reads the snapshot only. Nothing is fetched live and nothing is sent from this page. */
(function () {
  'use strict';
  var CW = window.CW, root = document.getElementById('tw');
  if (!CW || !root) return;
  var SNAP = new Date(CW.snapshot + 'T00:00:00Z');
  var STEPS = [
    { k: 'setup', n: 'Set up', does: 'You define the question, who to watch and what counts. Nothing runs yet.', who: 'You' },
    { k: 'collect', n: 'Collect', does: 'The workflow reads the sources and logs every record with a date, a source and a link. It does not interpret anything yet.', who: 'Workflow' },
    { k: 'analyse', n: 'Analyse', does: 'It sorts the records into types and calculates comparisons from the reported figures, using the rules you can see and change.', who: 'Workflow' },
    { k: 'synth', n: 'Synthesise', does: 'It turns the analysis into ranked signals, each with its evidence, and says what the records cannot tell you.', who: 'Workflow' },
    { k: 'memo', n: 'Decide and write', does: 'It drafts a decision memo from the signals you keep. In a live engagement a designated analyst reviews it at this point, before it reaches you.', who: 'Workflow, then analyst' },
    { k: 'act', n: 'Act', does: 'The memo waits for your decision. Approve, hold or ask for changes. Nothing is sent from this demo.', who: 'You' }
  ];
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
  var S = { ind: 'hotels', cos: null, focus: { fin: true, lead: true, cap: true, oth: false, pipe: true }, win: 90, who: '', thr: 3, imp: { fin: 2, lead: 2, cap: 1, oth: 1, pipe: 2 }, dec: 'priority', step: 1, done: { collect: false }, keep: null, outcome: null, running: false, maxStep: 1 };
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

  /* ---------- views ---------- */
  function chipsBar() {
    var f = FOCUS.filter(function (x) { return S.focus[x.k] && (!x.only || x.only === S.ind); }).map(function (x) { return x.n.toLowerCase(); });
    return '<div class="tw-bar"><span class="lab2">Your brief</span><span><b>' + esc(IND().label) + '</b></span><span>' + cos().map(function (c) { return esc(c.name); }).join(', ') + '</span><span>' + (f.join(', ') || 'nothing selected') + '</span><span>' + S.win + ' days</span>' + (S.who.trim() ? '<span>for ' + esc(S.who.trim()) + '</span>' : '') + '</div>';
  }
  function vSetup() {
    var ids = S.cos || allCos().map(function (c) { return c.id; });
    var left = '<div class="tw-f"><div class="lab2">1 &middot; Industry</div><div class="chp" role="group" aria-label="Industry">' + Object.keys(CW.industries).map(function (k) { return '<button type="button" data-act="ind" data-v="' + k + '" aria-pressed="' + (S.ind === k) + '">' + CW.industries[k].label + '</button>'; }).join('') + '</div></div>' +
      '<div class="tw-f"><div class="lab2">2 &middot; Companies to watch</div>' + allCos().map(function (c) { return '<label class="tw-ck"><input type="checkbox" data-act="co" data-v="' + c.id + '"' + (ids.indexOf(c.id) >= 0 ? ' checked' : '') + '><span><b>' + esc(c.name) + '</b><small>' + esc(c.ticker) + ' &middot; ' + esc(c.exch) + '</small></span></label>'; }).join('') + '</div>' +
      '<div class="tw-f"><div class="lab2">3 &middot; What to watch</div>' + FOCUS.map(function (x) { var dis = x.only && x.only !== S.ind; return '<label class="tw-ck' + (dis ? ' off' : '') + '"><input type="checkbox" data-act="focus" data-v="' + x.k + '"' + (S.focus[x.k] && !dis ? ' checked' : '') + (dis ? ' disabled' : '') + '><span><b>' + x.n + '</b><small>' + (dis ? 'No source for this industry in the demo' : x.d) + '</small></span></label>'; }).join('') + '</div>' +
      '<div class="tw-f"><div class="lab2">4 &middot; Time window</div><div class="chp" role="group" aria-label="Time window">' + [30, 60, 90, 120].map(function (d) { return '<button type="button" data-act="win" data-v="' + d + '" aria-pressed="' + (S.win === d) + '">' + d + ' days</button>'; }).join('') + '</div></div>' +
      '<div class="tw-f"><label class="lab2" for="tw-who">5 &middot; Your company <span style="text-transform:none;letter-spacing:0;font-weight:400">(optional)</span></label><input type="text" id="tw-who" class="inp" data-act="who" value="' + esc(S.who) + '" maxlength="60" placeholder="Used in the memo heading">' + '<p class="note" style="margin:6px 0 0">' + pm('int') + 'Customer-provided</p></div>';
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
  function vCollect() {
    var plan = srcPlan(), done = S.done.collect, run = S.running;
    var left = '<p class="tw-note">Press the button and watch each source being read. The numbers are what the records contain for your window of <b>' + S.win + ' days</b>.</p>' +
      '<button type="button" class="btn am" data-act="collect"' + (done || run ? ' disabled' : '') + '>' + (done ? 'Collected' : run ? 'Reading sources' : 'Collect from sources') + '</button>' +
      (done ? '<p class="tw-note" style="margin-top:14px">Not happy with the result? Go back, change the companies or the window, and collect again.</p>' : '');
    var rowsH = plan.map(function (r, i) {
      var st = done ? 'done' : (r.state || 'wait');
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
  function vAnalyse() {
    var A = analyse(), pharma = S.ind === 'pharma';
    var left = '<p class="tw-note">The workflow sorts every record into a type, then compares the companies on figures they reported. These are the rules. Change one and the table updates.</p>' +
      '<div class="tw-f"><div class="lab2">Flag a revenue growth gap of at least</div><div class="chp">' + [1, 3, 5, 10].map(function (v) { return '<button type="button" data-act="thr" data-v="' + v + '" aria-pressed="' + (S.thr === v) + '">' + v + (v === 1 ? ' point' : ' points') + '</button>'; }).join('') + '</div><p class="note" style="margin:6px 0 0">' + pm('asm') + 'Assumption: a gap this size is worth a look.</p></div>' +
      '<div class="tw-f"><div class="lab2">How records are typed</div><ul class="tw-rules"><li><b>Results:</b> 8-K Item 2.02</li><li><b>Leadership:</b> Item 5.02</li><li><b>Financing:</b> Items 1.01, 2.03, prospectus and shelf filings</li><li><b>Other:</b> any other 8-K item</li><li>Insider and ownership forms are left out</li></ul></div>';
    var hdr = '<tr><th>Company</th><th>Results</th><th>Leader-<br>ship</th><th>Financing</th><th>Other</th></tr>';
    var m1 = A.rows.map(function (x) { return '<tr><td>' + esc(x.c.name) + '</td><td>' + (x.n.results + x.n.periodic + x.n.foreign || '0') + '</td><td>' + x.n.lead + '</td><td>' + x.n.cap + '</td><td>' + x.n.oth + '</td></tr>'; }).join('');
    var h2 = '<tr><th>Company</th><th>Revenue</th><th>Year on year</th><th>' + (pharma ? 'Research spend' : 'Operating margin') + '</th></tr>';
    var m2 = A.rows.map(function (x) { return '<tr><td>' + esc(x.c.name) + '</td>' + (x.rev ? '<td>' + bn(x.rev.val) + '</td><td' + (x.g !== null && A.med !== null && Math.abs(x.g - A.med) >= S.thr ? ' class="hit"' : '') + '>' + (x.g !== null ? pct(x.g, true) : '<span class="tag h">Gap</span>') + '</td><td>' + ((pharma ? x.rd : x.om) !== null ? pct(pharma ? x.rd : x.om) + (pharma ? ' of revenue' : '') : '<span class="tag h">Gap</span>') + '</td>' : '<td colspan="3"><span class="tag h">Gap</span> no quarterly figures in this source</td>') + '</tr>'; }).join('');
    var right = '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Records by type, last ' + S.win + ' days</div><table class="tw-t"><thead>' + hdr + '</thead><tbody>' + m1 + '</tbody></table></div>' +
      (S.focus.fin ? '<div class="tw-card"><div class="lab2">' + pm('ana') + 'Reported figures, latest quarter</div><table class="tw-t"><thead>' + h2 + '</thead><tbody>' + m2 + '</tbody></table><p class="note" style="margin:10px 0 0">Peer median revenue growth: <b>' + (A.med !== null ? pct(A.med, true) : 'not available') + '</b>. Highlighted cells are at least ' + S.thr + ' points from it. Source: figures each company reported to the SEC.</p></div>' : '') +
      '<div class="tw-card gap"><div class="lab2">Gaps, shown not hidden</div><ul class="tw-g">' + A.gaps.map(function (g) { return '<li>' + pm('asm') + esc(g) + '</li>'; }).join('') + '</ul></div>';
    return { left: left, right: right, ok: true, A: A };
  }
  function vSynth() {
    var A = analyse(); keptSignals(A);
    var left = '<p class="tw-note">Each signal is scored: how big it is, times how much it matters to you. Change what matters and the ranking moves. Untick any signal you do not want in the memo.</p><div class="tw-f"><div class="lab2">How much each type matters</div>' +
      FOCUS.filter(function (x) { return S.focus[x.k] && (!x.only || x.only === S.ind); }).map(function (x) { return '<div class="tw-imp"><span>' + x.n + '</span><div class="chp sm" role="group" aria-label="' + x.n + '">' + IMP.map(function (l, v) { return '<button type="button" data-act="imp" data-k="' + x.k + '" data-v="' + v + '" aria-pressed="' + (S.imp[x.k] === v) + '">' + l + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>';
    var right = A.sig.length ? A.sig.map(function (s, i) {
      return '<div class="tw-sig' + (S.keep[s.id] ? '' : ' off') + '"><label class="tw-ck"><input type="checkbox" data-act="keep" data-v="' + s.id + '"' + (S.keep[s.id] ? ' checked' : '') + '><span><b>' + esc(s.head) + '</b></span></label><div class="meta"><span class="rank">#' + (i + 1) + '</span><span class="sc">Score ' + s.score + '</span><span class="ev">' + s.ev.map(function (e) { return pm(e); }).join('') + (s.ev.indexOf('ana') >= 0 ? 'Public source, calculated' : 'Public source') + '</span></div><p>' + esc(s.body) + '</p><p class="why"><b>Why it may matter.</b> ' + esc(s.why) + '</p><p class="src">' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</p></div>';
    }).join('') : '<div class="tw-card"><p>No signal meets your rules. Widen the window, lower the growth gap or add focus areas.</p></div>';
    right += '<div class="tw-card gap"><div class="lab2">What the records cannot tell you</div><ul class="tw-g"><li>' + pm('asm') + 'Why a company did something. The filing text and the company’s own explanation are not read.</li><li>' + pm('asm') + 'Anything about pricing, promotions or customers. Those sources are not collected here.</li></ul></div>';
    return { left: left, right: right, ok: true };
  }
  function vMemo() {
    var A = analyse(), M = memo(A);
    var left = '<p class="tw-note">Choose the decision you are weighing. The recommendation is written for it, from the signals you kept.</p><div class="tw-f"><div class="lab2">Your decision</div>' + DEC.map(function (d) { return '<label class="tw-ck"><input type="radio" name="dec" data-act="dec" data-v="' + d.k + '"' + (S.dec === d.k ? ' checked' : '') + '><span><b>' + d.n + '</b></span></label>'; }).join('') + '</div><p class="tw-note"><b>Rule used:</b> the rival with the highest total score across the signals you kept is the priority. ' + M.ks.length + ' signal' + (M.ks.length === 1 ? '' : 's') + ' kept.</p>';
    var right = '<div class="tw-memo"><div class="tw-mh"><div><div class="lab2">Draft decision memo</div><b>Competitor watch brief: ' + esc(IND().label) + '</b>' + (M.who ? '<span> for ' + esc(M.who) + '</span>' : '') + '</div><span class="tagh">Draft. Analyst review comes next in a live engagement</span></div>' +
      '<div class="rec2"><div class="lab2">' + pm('ana') + 'Recommendation</div><div class="big">' + esc(M.rec) + '</div><p>' + esc(M.trade) + '</p></div>' +
      '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'Key uncertainty</div><p>' + esc(M.unc) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Next action</div><p>' + esc(M.next) + '</p></div></div>' +
      '<div class="tw-ev"><div class="lab2">Evidence behind it</div><ul>' + M.ks.map(function (s) { return '<li>' + pm('pub') + '<span>' + esc(s.head) + '<small>' + s.src.map(function (r) { return r.u ? '<a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.l) + '</a>' : esc(r.l); }).join(' &middot; ') + '</small></span></li>'; }).join('') + '</ul></div>' +
      '<div class="tw-ev"><div class="lab2">Assumptions and limits</div><ul><li>' + pm('asm') + '<span>The latest reported quarter is comparable across the companies, though fiscal quarters differ by a few days.</span></li><li>' + pm('asm') + '<span>' + S.win + ' days is the right window for this question.</span></li><li>' + pm('asm') + '<span>Filing text, pricing and news were not read.</span></li></ul></div></div>';
    return { left: left, right: right, ok: true, A: A, M: M };
  }
  function vAct() {
    var A = analyse(), M = memo(A), name = M.top ? M.top.co.name : 'the top rival';
    var acts = [['watch', 'Put ' + name + ' on a weekly watch', 'A live engagement schedules the workflow and sends you the brief each week.'], ['open', 'Open the filings behind the top signals', 'Links are in the memo. Reading them takes about twenty minutes.'], ['price', 'Ask your team to check ' + name + '’s pricing and promotions', 'Not collected in this demo. A live engagement can add it as a source.'], ['rerun', 'Re-run this brief in 30 days', 'Compare the signals to see what moved.']];
    if (!S.acts) S.acts = { watch: true, open: true, price: true, rerun: false };
    var left = '<p class="tw-note">The memo is ready and waiting for you. Choose the actions you want, then decide. Nothing leaves this page.</p><div class="tw-f"><div class="lab2">Actions to take</div>' + acts.map(function (a) { return '<label class="tw-ck"><input type="checkbox" data-act="act" data-v="' + a[0] + '"' + (S.acts[a[0]] ? ' checked' : '') + '><span><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></span></label>'; }).join('') + '</div>';
    var out = S.outcome;
    var right = '<div class="tw-card wait"><div class="lab2">Waiting for your decision</div><p class="tw-q" style="margin-bottom:4px">' + esc(M.rec) + '</p><p class="note" style="margin:0 0 14px">Based on ' + M.ks.length + ' signal' + (M.ks.length === 1 ? '' : 's') + ' you kept. Draft only.</p><div class="btns"><button type="button" class="btn am" data-act="out" data-v="approve">Approve</button><button type="button" class="btn o" data-act="out" data-v="hold">Hold</button><button type="button" class="btn o" data-act="out" data-v="change">Ask for changes</button></div>';
    if (out) {
      var msg = out === 'approve' ? '<b>Approved.</b> In a live engagement this now goes to your designated analyst for review, then to you by email, and the actions you ticked are scheduled.' : out === 'hold' ? '<b>On hold.</b> In a live engagement the memo stays with your analyst until you say go. Nothing is scheduled.' : '<b>Changes requested.</b> In a live engagement your analyst revises the memo and sends it back. You can also go back a step here and change the rules.';
      right += '<div class="tw-out2"><p>' + msg + ' Nothing was sent from this page.</p><div class="btns"><button type="button" class="btn o s" data-act="dl">Download the memo</button><a class="btn am s" href="contact.html">Book a diagnostic</a></div></div>';
    }
    right += '</div>' + '<div class="tw-card"><div class="lab2">What a live engagement adds</div><ul class="tw-out"><li>The sources you choose, such as pricing pages, news and your own data</li><li>A designated analyst who reviews every brief before you see it</li><li>The brief on your schedule, month to month</li></ul></div>';
    return { left: left, right: right, ok: true, A: A, M: M };
  }
  var VIEWS = [vSetup, vCollect, vAnalyse, vSynth, vMemo, vAct];

  /* ---------- shell ---------- */
  function render(keepScroll) {
    var v = VIEWS[S.step - 1](), st = STEPS[S.step - 1];
    var stp = '<ol class="tw-stp" aria-label="Steps">' + STEPS.map(function (x, i) { var n = i + 1, cls = n === S.step ? 'on' : n < S.step ? 'done' : (n <= S.maxStep ? 'seen' : ''); return '<li class="' + cls + '"' + (n === S.step ? ' aria-current="step"' : '') + '><button type="button" data-act="go" data-v="' + n + '"' + (n > S.maxStep ? ' disabled' : '') + '><b>' + (n < S.step ? '✓' : n) + '</b><span>' + x.n + '</span></button></li>'; }).join('') + '</ol>';
    var mob = '<div class="tw-mstep"><b>Step ' + S.step + ' of 6</b> &middot; ' + st.n + '<div class="tw-prog"><i style="width:' + (S.step / 6 * 100) + '%"></i></div></div>';
    var qrow = '<div class="tw-q4" role="group" aria-label="Business question"><button type="button" aria-pressed="true">Watch my competitors</button><button type="button" class="soon" disabled>Test a price change<small>Next</small></button><button type="button" class="soon" disabled>Allocate my marketing budget<small>Next</small></button><button type="button" class="soon" disabled>Size up a new market<small>Next</small></button></div>';
    var pane = '<div class="tw-pane"><div class="tw-l"><div class="tw-who"><span class="tag">' + st.who + '</span><h2>Step ' + S.step + ': ' + st.n + '</h2><p class="does"><b>What happens here.</b> ' + st.does + '</p></div>' + v.left + '</div><div class="tw-r" aria-live="polite">' + v.right + '</div></div>';
    var nav = '<div class="tw-nav"><button type="button" class="btn o" data-act="back"' + (S.step === 1 ? ' disabled' : '') + '>Back</button><span class="tw-why">' + (v.ok ? '' : esc(v.why || '')) + '</span>' + (S.step < 6 ? '<button type="button" class="btn am" data-act="next"' + (v.ok ? '' : ' disabled') + '>Next step: ' + STEPS[S.step].n.toLowerCase() + '</button>' : '<button type="button" class="btn o" data-act="restart">Start again</button>') + '</div>';
    var y = window.scrollY; root.innerHTML = qrow + stp + mob + (S.step > 1 ? chipsBar() : '') + pane + nav; if (keepScroll) window.scrollTo(0, y);
    var w = $('#tw-who'); if (w && S._focusWho) { w.focus(); w.setSelectionRange(w.value.length, w.value.length); }
  }
  function resetRun() { S.done.collect = false; S.running = false; S.showAll = false; S.keep = null; S.outcome = null; S.maxStep = Math.min(S.maxStep, 2); }
  function runCollect() {
    var plan = srcPlan(); S.running = true; plan.forEach(function (r) { r.state = 'wait'; }); S._plan = plan; render(true);
    var i = 0;
    (function next() {
      if (i > 0) plan[i - 1].state = 'done';
      if (i >= plan.length) { S.running = false; S.done.collect = true; render(true); return; }
      plan[i].state = 'run'; i++;
      var t = $('.tw-t tbody'); if (t) { /* redraw table only */ }
      render(true); setTimeout(next, 420);
    })();
  }
  var _srcPlan = srcPlan; srcPlan = function () { return S.running && S._plan ? S._plan : _srcPlan(); };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' && b.type !== 'radio' && b.type !== 'checkbox') return;
    var a = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    if (b.tagName === 'INPUT') return;
    if (a === 'ind') { S.ind = v; S.cos = null; S.focus.pipe = v === 'pharma'; resetRun(); render(true); }
    else if (a === 'win') { S.win = +v; resetRun(); render(true); }
    else if (a === 'thr') { S.thr = +v; render(true); }
    else if (a === 'imp') { S.imp[b.getAttribute('data-k')] = +v; render(true); }
    else if (a === 'collect') { runCollect(); }
    else if (a === 'all') { S.showAll = !S.showAll; render(true); }
    else if (a === 'go') { S.step = +v; render(); }
    else if (a === 'back') { S.step = Math.max(1, S.step - 1); render(); window.scrollTo(0, root.offsetTop - 80); }
    else if (a === 'next') { S.step = Math.min(6, S.step + 1); S.maxStep = Math.max(S.maxStep, S.step); render(); window.scrollTo(0, root.offsetTop - 80); }
    else if (a === 'restart') { S.step = 1; S.maxStep = 1; resetRun(); render(); }
    else if (a === 'out') { S.outcome = v; render(true); }
    else if (a === 'dl') { var A = analyse(), M = memo(A), u = URL.createObjectURL(new Blob([memoMd(A, M)], { type: 'text/markdown' })), l = document.createElement('a'); l.href = u; l.download = 'competitor-watch-' + S.ind + '.md'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 800); }
  });
  root.addEventListener('change', function (e) {
    var t = e.target, a = t.getAttribute('data-act'); if (!a) return;
    if (a === 'co') { var ids = S.cos || allCos().map(function (c) { return c.id; }); S.cos = t.checked ? ids.concat([t.getAttribute('data-v')]) : ids.filter(function (x) { return x !== t.getAttribute('data-v'); }); resetRun(); render(true); }
    else if (a === 'focus') { S.focus[t.getAttribute('data-v')] = t.checked; resetRun(); render(true); }
    else if (a === 'keep') { S.keep[t.getAttribute('data-v')] = t.checked; render(true); }
    else if (a === 'dec') { S.dec = t.getAttribute('data-v'); render(true); }
    else if (a === 'act') { S.acts[t.getAttribute('data-v')] = t.checked; }
  });
  root.addEventListener('input', function (e) { if (e.target.getAttribute('data-act') === 'who') { S.who = e.target.value; } });
  window.__watch = { S: S, analyse: analyse, memo: memo, memoMd: memoMd, STEPS: STEPS, go: function (n) { S.step = n; S.maxStep = Math.max(S.maxStep, n); render(); }, collectNow: function () { S.done.collect = true; render(); }, setInd: function (k) { S.ind = k; S.cos = null; S.focus.pipe = k === 'pharma'; resetRun(); render(); }, render: render };
  render();
})();
