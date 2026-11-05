/* Decision Memo demo: an analyst working through one decision, on illustrative data.
   Four decisions across three industries. Budget, price and ranking are computed here in the
   browser. The watch decision is a scripted example. Nothing is fetched or sent anywhere. */
(function () {
  'use strict';

  var SPEED = (function () {
    var s = 1;
    try { var q = new URLSearchParams(window.location.search).get('speed'); if (q) s = Math.max(0.1, Math.min(200, +q || 1)); } catch (e) {}
    if (window.DEMO_SPEED) s = window.DEMO_SPEED;
    return s;
  })();
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f0(n) { return String(Math.round(n)); }
  function f1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function pc(n) { return Math.round(n * 100) + '%'; }
  function cr(n) { return '₹' + f0(n) + ' crore'; }

  /* ---------- maths ---------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function tri(u, lo, mo, hi) { if (hi === lo) return lo; var F = (mo - lo) / (hi - lo); return u < F ? lo + Math.sqrt(u * (hi - lo) * (mo - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mo)); }
  function quant(arr, q) { var s = Array.prototype.slice.call(arr).sort(function (x, y) { return x - y; }); var i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
  function mean(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }

  /* ---------- engine: budget split (same model as the Tipping Point example) ---------- */
  var SPLITS = [];
  (function () { for (var g = 0; g <= 10; g++) for (var q = 0; q <= 10 - g; q++) SPLITS.push([g * 10, q * 10, (10 - g - q) * 10]); })();

  function budgetEngine(cfg) {
    var B = 100, REF = 50, N = 5000, rng = mulberry32(7), ns = SPLITS.length, P = cfg.rng;
    var V = new Float32Array(N * 9), optA = new Int16Array(N * 3), splitNet = new Float32Array(N * ns), planNet = new Float32Array(N);
    function rp(v, r) { return { R: v[r * 3], m: v[r * 3 + 1], b: v[r * 3 + 2] }; }
    function net1(p, S) { return p.m * p.R * Math.pow(S / REF, p.b) - S; }
    function marg(p, S) { return p.m * p.R * p.b / REF * Math.pow(S / REF, p.b - 1); }
    function stopPt(p) { return REF * Math.pow(p.m * p.R * p.b / REF, 1 / (1 - p.b)); }
    function totalNet(v, a) { return net1(rp(v, 0), a[0]) + net1(rp(v, 1), a[1]) + net1(rp(v, 2), a[2]); }
    function optimal(v) {
      var a = [0, 0, 0], p = [rp(v, 0), rp(v, 1), rp(v, 2)];
      for (var i = 0; i < B; i++) { var best = -1, bv = 1; for (var r = 0; r < 3; r++) { var g = marg(p[r], a[r] + 0.5); if (g > bv) { bv = g; best = r; } } if (best < 0) break; a[best]++; }
      return a;
    }
    var i, j, s, r;
    for (i = 0; i < N; i++) {
      var v = []; for (j = 0; j < 9; j++) { v.push(tri(rng(), P[j][0], P[j][1], P[j][2])); V[i * 9 + j] = v[j]; }
      var a = optimal(v); optA[i * 3] = a[0]; optA[i * 3 + 1] = a[1]; optA[i * 3 + 2] = a[2];
      planNet[i] = totalNet(v, cfg.plan);
      for (s = 0; s < ns; s++) splitNet[i * ns + s] = totalNet(v, SPLITS[s]);
    }
    var means = [], bi = 0;
    for (s = 0; s < ns; s++) { var m0 = 0; for (i = 0; i < N; i++) m0 += splitNet[i * ns + s]; means.push(m0 / N); if (means[s] > means[bi]) bi = s; }
    var beat = 0, bn = new Float32Array(N); for (i = 0; i < N; i++) { bn[i] = splitNet[i * ns + bi]; if (bn[i] > planNet[i]) beat++; }
    var planIdx = -1; for (s = 0; s < ns; s++) if (SPLITS[s].join() === cfg.plan.join()) planIdx = s;
    var stop = [];
    for (r = 0; r < 3; r++) { var arr = new Float32Array(N); for (i = 0; i < N; i++) arr[i] = stopPt(rp(Array.prototype.slice.call(V, i * 9, i * 9 + 9), r)); stop.push({ p10: quant(arr, .1), p50: quant(arr, .5), p90: quant(arr, .9) }); }
    var grid = []; for (var gg = 4; gg <= 100; gg += 4) grid.push(gg);
    var curve = [];
    for (r = 0; r < 3; r++) { var lo = [], md = [], hi = []; for (var gi = 0; gi < grid.length; gi++) { var col = new Float32Array(N); for (i = 0; i < N; i++) col[i] = marg({ R: V[i * 9 + r * 3], m: V[i * 9 + r * 3 + 1], b: V[i * 9 + r * 3 + 2] }, grid[gi]); lo.push(quant(col, .1)); md.push(quant(col, .5)); hi.push(quant(col, .9)); } curve.push({ lo: lo, md: md, hi: hi }); }
    var modes = P.map(function (x) { return x[1]; }), baseOpt = optimal(modes), hinge = [];
    P.forEach(function (x, jj) { var dist = 0;[x[0], x[2]].forEach(function (val) { var vv = modes.slice(); vv[jj] = val; var aa = optimal(vv); dist = Math.max(dist, (Math.abs(aa[0] - baseOpt[0]) + Math.abs(aa[1] - baseOpt[1]) + Math.abs(aa[2] - baseOpt[2])) / 2); }); hinge.push({ j: jj, r: Math.floor(jj / 3), k: ['R', 'm', 'b'][jj % 3], dist: dist }); });
    hinge.sort(function (x, y) { return y.dist - x.dist; });
    var p10b = quant(bn, .1), p10p = quant(planNet, .1);
    return { N: N, optA: optA, V: V, best: SPLITS[bi], bestMean: means[bi], planMean: means[planIdx], beat: beat / N, p10best: p10b, p10plan: p10p, stop: stop, grid: grid, curve: curve, hinge: hinge, optimal: optimal, totalNet: totalNet };
  }

  /* ---------- engine: price change ---------- */
  var PRICE_OPTS = [-10, -5, 0, 5, 10];
  var PRICE_LABEL = ['Cut by 10%', 'Cut by 5%', 'Hold the price', 'Raise by 5%', 'Raise by 10%'];
  function priceProfit(cfg, d, c, e, m) { var x = 1 + d / 100, ee = d < 0 ? e * (1 - m) : e; return ((cfg.P0 * x) - c) * cfg.q0 * Math.pow(x, ee) / 1e7; }
  function priceEngine(cfg) {
    var N = 5000, rng = mulberry32(11), no = PRICE_OPTS.length, draws = [], prof = [], i, k;
    for (k = 0; k < no; k++) prof.push(new Float64Array(N));
    var best = new Int8Array(N);
    for (i = 0; i < N; i++) {
      var c = tri(rng(), cfg.c[0], cfg.c[1], cfg.c[2]), e = tri(rng(), cfg.e[0], cfg.e[1], cfg.e[2]), m = tri(rng(), cfg.m[0], cfg.m[1], cfg.m[2]);
      draws.push([c, e, m]); var bk = 0, bv = -1e18;
      for (k = 0; k < no; k++) { var pr = priceProfit(cfg, PRICE_OPTS[k], c, e, m); prof[k][i] = pr; if (pr > bv) { bv = pr; bk = k; } }
      best[i] = bk;
    }
    var mn = [], p10 = [], p90 = [], pb = [0, 0, 0, 0, 0];
    for (k = 0; k < no; k++) { mn.push(mean(prof[k])); p10.push(quant(prof[k], .1)); p90.push(quant(prof[k], .9)); }
    for (i = 0; i < N; i++) pb[best[i]]++;
    pb = pb.map(function (x) { return x / N; });
    var bi = 0; for (k = 1; k < no; k++) if (mn[k] > mn[bi]) bi = k;
    var runMean = [], cp = 50, step = N / cp; for (k = 0; k < no; k++) runMean.push([]);
    for (var q = 1; q <= cp; q++) { var upto = Math.round(q * step); for (k = 0; k < no; k++) { var s = 0; for (i = 0; i < upto; i++) s += prof[k][i]; runMean[k].push(s / upto); } }
    var typ = { c: cfg.c[1], e: cfg.e[1], m: cfg.m[1] };
    function bestAt(c, e, m) { var bk2 = 0, bv2 = -1e18; for (var k2 = 0; k2 < no; k2++) { var pr2 = priceProfit(cfg, PRICE_OPTS[k2], c, e, m); if (pr2 > bv2) { bv2 = pr2; bk2 = k2; } } return bk2; }
    var base = bestAt(typ.c, typ.e, typ.m), hinge = [];
    [['e', 'how customers respond to price', cfg.e], ['c', 'your unit cost', cfg.c], ['m', 'how many rivals match a cut', cfg.m]].forEach(function (x) {
      var dist = 0, flips = [];
      [x[2][0], x[2][2]].forEach(function (val) { var t = { c: typ.c, e: typ.e, m: typ.m }; t[x[0]] = val; var b2 = bestAt(t.c, t.e, t.m); dist = Math.max(dist, Math.abs(b2 - base)); if (b2 !== base) flips.push({ val: val, to: b2 }); });
      hinge.push({ k: x[0], label: x[1], dist: dist, flips: flips });
    });
    hinge.sort(function (a, b) { return b.dist - a.dist; });
    var breakEven = null;
    if (bi !== 2) {
      var d = PRICE_OPTS[bi], lo = -8, hi = -0.05, f = function (e) { return priceProfit(cfg, d, typ.c, e, typ.m) - priceProfit(cfg, 0, typ.c, e, typ.m); };
      var flo = f(lo), fhi = f(hi);
      if (flo * fhi < 0) { for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2, fm = f(mid); if (fm * flo > 0) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; } } breakEven = (lo + hi) / 2; }
    }
    return { N: N, mean: mn, p10: p10, p90: p90, probBest: pb, bestIdx: bi, hinge: hinge, breakEven: breakEven, runMean: runMean, cp: cp, draws: draws, prof: prof };
  }

  /* ---------- engine: rank options ---------- */
  function rankEngine(cfg) {
    var N = 5000, rng = mulberry32(5), no = cfg.options.length, nc = cfg.criteria.length, i, o, c, counts = [], sumScore = [];
    for (o = 0; o < no; o++) { counts.push(0); sumScore.push(0); }
    var checkpoints = [], cp = 50, step = N / cp, top = new Int8Array(N), totals = [];
    for (i = 0; i < N; i++) {
      var w = [], tw = 0;
      for (c = 0; c < nc; c++) { var base = cfg.criteria[c].w; var wc = tri(rng(), base * 0.7, base, base * 1.3); w.push(wc); tw += wc; }
      var bk = 0, bv = -1, row = [];
      for (o = 0; o < no; o++) { var t = 0; for (c = 0; c < nc; c++) { var sc = cfg.options[o].scores[c]; t += (w[c] / tw) * tri(rng(), sc[0], sc[1], sc[2]); } row.push(t); sumScore[o] += t; if (t > bv) { bv = t; bk = o; } }
      top[i] = bk; counts[bk]++;
      if ((i + 1) % step === 0) checkpoints.push(counts.map(function (x) { return x / (i + 1); }));
    }
    var prob = counts.map(function (x) { return x / N; }), avg = sumScore.map(function (x) { return x / N; });
    var order = prob.map(function (p, k) { return k; }).sort(function (a, b) { return prob[b] - prob[a]; });
    function topAt(weights) { var tw = weights.reduce(function (a, b) { return a + b; }, 0), bk2 = 0, bv2 = -1; for (var o2 = 0; o2 < no; o2++) { var t2 = 0; for (var c2 = 0; c2 < nc; c2++) t2 += (weights[c2] / tw) * cfg.options[o2].scores[c2][1]; if (t2 > bv2) { bv2 = t2; bk2 = o2; } } return bk2; }
    var baseW = cfg.criteria.map(function (x) { return x.w; }), baseTop = topAt(baseW), flips = [];
    cfg.criteria.forEach(function (cr0, cc) { [0.5, 1.5].forEach(function (f) { var ww = baseW.slice(); ww[cc] *= f; var t3 = topAt(ww); flips.push({ c: cc, f: f, to: t3, flip: t3 !== baseTop }); }); });
    return { N: N, prob: prob, avg: avg, order: order, checkpoints: checkpoints, flips: flips, baseTop: baseTop, top: top };
  }

  /* ---------- rating rules (same as the Condition Watch example) ---------- */
  var PRIMARY = { 'Disclosed': 1, 'Company stated': 1 };
  function rate(rows) {
    var prim = rows.filter(function (r) { return PRIMARY[r.status]; }), classes = {}, gap = rows.some(function (r) { return r.status === 'Not disclosed'; });
    prim.forEach(function (r) { classes[r.cls] = 1; });
    var nc = Object.keys(classes).length;
    if (prim.length >= 2 && nc >= 2 && !gap) return { k: 'Strong', n: 4 };
    if (prim.length >= 1) return { k: 'Mixed', n: 2 };
    if (rows.some(function (r) { return r.status === 'Opinion' || r.status === 'Inference'; })) return { k: 'Inference only', n: 1 };
    return { k: 'Nothing disclosed yet', n: 0 };
  }

  /* ---------- data: industries ---------- */
  var IND = {
    hotels: {
      label: 'Hotels', co: 'A hypothetical mid-size hotel chain in India',
      budget: { routes: ['Direct bookings', 'Online travel agents', 'Corporate and group sales'], plan: [20, 60, 20],
        rng: [[200, 320, 480], [0.30, 0.38, 0.46], [0.40, 0.55, 0.70], [380, 520, 700], [0.14, 0.20, 0.26], [0.50, 0.65, 0.78], [150, 250, 400], [0.24, 0.30, 0.38], [0.40, 0.58, 0.72]],
        evidence: 'your booking and spend history for each channel' },
      price: { unit: 'room night', P0: 7500, q0: 240000, c: [1700, 2000, 2400], e: [-2.4, -1.6, -0.9], m: [0.1, 0.35, 0.6], evidence: 'past rate changes and what happened to bookings' },
      rank: { options: [
          { name: 'Corporate accounts', scores: [[6, 7.5, 9], [5, 6, 7], [5, 6, 7], [5, 6, 7.5]] },
          { name: 'Meetings and events', scores: [[5, 6.5, 8], [4, 5, 6.5], [3, 4.5, 6], [4, 5, 6.5]] },
          { name: 'Loyalty tie-up', scores: [[4, 5.5, 7.5], [6, 7.5, 9], [6, 7, 8], [5, 6.5, 8]] },
          { name: 'Direct booking app', scores: [[5, 7, 9], [2, 3.5, 5.5], [2, 3.5, 5], [3, 4.5, 6.5]] }] },
      knock: {
        budget: ['Moving spend to direct bookings can cut commission costs. It can also reduce the guest data you get from agents.', 'If rivals raise their agent spend, visibility on those sites gets more expensive for everyone.'],
        price: ['A rate rise may lift profit per room and push price-sensitive guests to agents who show lower prices.', 'If a rival matches a rate cut within days, the volume gain disappears and the margin does not come back.'],
        rank: ['The first option decides what the sales team spends its time on next quarter.', 'When the ranking is close, the second option is worth keeping warm.'] },
      watch: { decisions: ['Which booking route do we favour for guests who start with an AI assistant?', 'Do we change our distribution terms?', 'Do we build a plan for corporate clients?'],
        sources: [['pub', 'Trade press'], ['pub', 'Agent announcements'], ['pub', 'Rival results'], ['pub', 'Partner notices'], ['int', 'Your web analytics'], ['int', 'Your sales notes']],
        events: [
          ['2026-08-04', 'An online travel agent says it will add an AI booking assistant in India next year.', 'Company stated', 'pub', 'Agent announcement (example)', 1, 'Company disclosure'],
          ['2026-08-19', 'A rival chain reports a higher share of direct bookings this quarter.', 'Disclosed', 'pub', 'Rival results release (example)', 1, 'Company disclosure'],
          ['2026-09-02', 'Commentators expect agents to charge a fee for AI-assisted bookings.', 'Opinion', 'pub', 'Trade article (example)', 2, 'Analyst or press'],
          ['2026-09-15', 'Our own site shows more first visits that start from AI assistants.', 'Disclosed', 'int', 'Your web analytics (example)', 1, 'Customer-provided'],
          ['2026-09-28', 'The agent has not published its fee for AI-assisted bookings.', 'Not disclosed', 'pub', 'Agent partner notice (example)', 2, 'Company disclosure'],
          ['2026-10-06', 'A rival said it would join the agent programme by September. It has not joined.', 'Disclosed', 'pub', 'Rival statement and partner list (example)', 2, 'Company disclosure'],
          ['2026-10-20', 'Two corporate clients ask our sales team about AI booking tools.', 'Disclosed', 'int', 'Your sales notes (example)', 3, 'Customer-provided'],
          ['2026-11-10', 'The agent holds its partner briefing.', 'Scheduled', 'pub', 'Agent calendar (example)', 2, 'Company disclosure']],
        chain: ['The agent adds an AI assistant, and guests start their search there.', 'Direct bookings fall unless our site shows up in the assistant, and the agent gains leverage over terms.', 'Our commission bill rises, and we hold less guest data to personalise offers.'] },
      tool: ['tools/shiftwatch.html', 'Shiftwatch'] },
    pharma: {
      label: 'Pharma', co: 'A hypothetical specialty-pharma company',
      budget: { routes: ['Field force', 'Digital outreach', 'Medical education'], plan: [60, 10, 30],
        rng: [[300, 420, 560], [0.20, 0.28, 0.35], [0.50, 0.62, 0.75], [150, 300, 520], [0.15, 0.24, 0.32], [0.55, 0.72, 0.88], [200, 260, 340], [0.30, 0.38, 0.45], [0.35, 0.50, 0.65]],
        evidence: 'territory sales against call and event history' },
      price: { unit: 'pack', P0: 420, q0: 4000000, c: [95, 110, 135], e: [-1.8, -1.0, -0.4], m: [0.0, 0.25, 0.5], evidence: 'past price changes and what happened to prescriptions' },
      rank: { options: [
          { name: 'New indication', scores: [[6, 8, 9.5], [2, 3.5, 5], [1.5, 3, 4.5], [2, 3.5, 5.5]] },
          { name: 'Second-line patients', scores: [[4, 5.5, 7], [5, 6.5, 8], [5, 6, 7.5], [5, 6.5, 8]] },
          { name: 'Digital patient support', scores: [[3, 4.5, 6], [6, 7.5, 9], [6, 7.5, 9], [6, 7.5, 9]] },
          { name: 'Distributor partnership', scores: [[4.5, 6, 7.5], [5, 6, 7.5], [5, 6.5, 8], [4, 5.5, 7]] }] },
      knock: {
        budget: ['Shifting effort from the field force to digital can lower the cost of each contact. It can also weaken the relationships that drive prescribing.', 'Medical education pays back slowly, so a cut now shows up as lost momentum a year later.'],
        price: ['A price rise may move patients to alternatives, and a payer may respond by tightening access.', 'A price cut can set a reference price that is hard to raise again.'],
        rank: ['The first option sets the work for the medical and regulatory teams next year.', 'When the ranking is close, the second option should keep a small budget.'] },
      watch: { decisions: ['Do we continue our programme in this condition?', 'How do we price and position?', 'Do we change our trial design?'],
        sources: [['pub', 'Trial registries'], ['pub', 'Regulator notices'], ['pub', 'Company results'], ['pub', 'Conference abstracts'], ['pub', 'Payer calendars'], ['int', 'Your medical affairs notes']],
        events: [
          ['2026-03-12', 'A rival registers a phase 3 study in the condition, with completion listed for mid 2027.', 'Disclosed', 'pub', 'Trial registry entry (example)', 1, 'Trial registry'],
          ['2026-05-20', 'The rival says it expects to file for approval in the first half of 2027.', 'Company stated', 'pub', 'Rival results release (example)', 1, 'Company disclosure'],
          ['2026-06-02', 'A regulator gives the rival an expedited review designation.', 'Disclosed', 'pub', 'Regulator announcement (example)', 2, 'Regulator'],
          ['2026-07-15', 'A conference abstract reports less daytime sleepiness than placebo. The sample is small.', 'Disclosed', 'pub', 'Abstract (example)', 3, 'Conference or journal'],
          ['2026-08-04', 'A commentator argues the rival could take most new patient starts within three years.', 'Opinion', 'pub', 'Trade article (example)', 2, 'Analyst or press'],
          ['2026-09-18', 'Our medical team notes that clinicians are asking about the rival.', 'Disclosed', 'int', 'Your medical affairs notes (example)', 1, 'Customer-provided'],
          ['2026-10-02', 'Price and access terms for the rival have not been disclosed.', 'Not disclosed', 'pub', 'Rival results release (example)', 2, 'Company disclosure'],
          ['2026-11-18', 'A health technology review of the rival is scheduled.', 'Scheduled', 'pub', 'Agency calendar (example)', 2, 'Payer or HTA body']],
        chain: ['The rival may reach the market first.', 'Clinicians form habits with it, and payers set a reference price.', 'Our price and our trial comparator both have to answer to that reference.'] },
      tool: ['tools/condition-watch.html', 'Condition Watch'] },
    telecom: {
      label: 'Telecom', co: 'A hypothetical mid-size mobile operator',
      budget: { routes: ['Retail and dealers', 'Digital', 'Partner bundles'], plan: [70, 20, 10],
        rng: [[420, 560, 720], [0.12, 0.16, 0.20], [0.45, 0.58, 0.70], [150, 260, 420], [0.24, 0.32, 0.40], [0.40, 0.55, 0.70], [200, 340, 560], [0.08, 0.14, 0.22], [0.50, 0.68, 0.85]],
        evidence: 'activations by channel against commission and campaign spend' },
      price: { unit: 'subscriber month', P0: 299, q0: 20000000, c: [80, 90, 105], e: [-2.2, -1.5, -0.8], m: [0.2, 0.45, 0.7], evidence: 'past tariff changes and what happened to subscribers' },
      rank: { options: [
          { name: 'Enterprise connected devices', scores: [[5, 7, 9], [2, 3.5, 5], [2, 3.5, 5], [3, 4.5, 6.5]] },
          { name: 'Home broadband bundles', scores: [[5, 6.5, 8], [5, 6.5, 8], [3, 4.5, 6], [5, 6.5, 8]] },
          { name: 'Rural plans', scores: [[3.5, 5, 6.5], [5, 6, 7.5], [5, 6.5, 8], [4.5, 6, 7.5]] },
          { name: 'Digital wallet partnership', scores: [[3, 4.5, 6.5], [4, 5.5, 7], [5, 6.5, 8], [3, 4.5, 6]] }] },
      knock: {
        budget: ['More spend through partner bundles lifts volume and passes some margin to partners.', 'If dealers see less incentive, they may push a rival’s plans.'],
        price: ['A price cut can start a response from rivals, and the gain disappears when they match.', 'A price rise may increase churn in the segments with the most choice.'],
        rank: ['The first option decides which network and sales investments come next.', 'When the ranking is close, the second option is worth a small trial.'] },
      watch: { decisions: ['Do we change our plan lineup?', 'Do we adjust dealer incentives?', 'Do we respond to the new entrant?'],
        sources: [['pub', 'Entrant announcements'], ['pub', 'Rival tariff pages'], ['pub', 'Analyst notes'], ['pub', 'Regulator calendar'], ['int', 'Your dealer reports'], ['int', 'Your churn data']],
        events: [
          ['2026-08-10', 'A new entrant announces low-priced plans in three circles.', 'Company stated', 'pub', 'Entrant press release (example)', 3, 'Company disclosure'],
          ['2026-08-26', 'A rival operator cuts the price of its mid-tier plan.', 'Disclosed', 'pub', 'Rival tariff page (example)', 1, 'Company disclosure'],
          ['2026-09-09', 'Analysts expect the cut to spread to other operators within a quarter.', 'Opinion', 'pub', 'Analyst note (example)', 1, 'Analyst or press'],
          ['2026-09-22', 'Our dealers report more customers asking to port out in the three circles.', 'Disclosed', 'int', 'Your dealer reports (example)', 2, 'Customer-provided'],
          ['2026-10-05', 'The entrant has not said how long its prices will last.', 'Not disclosed', 'pub', 'Entrant press release (example)', 1, 'Company disclosure'],
          ['2026-10-14', 'Our churn data shows a rise among prepaid customers in those circles.', 'Disclosed', 'int', 'Your churn data (example)', 3, 'Customer-provided'],
          ['2026-10-28', 'The entrant said it would reach ten circles by year end. It has reached five.', 'Disclosed', 'pub', 'Entrant statement and coverage map (example)', 3, 'Company disclosure'],
          ['2026-11-12', 'The regulator holds a consultation on tariff changes.', 'Scheduled', 'pub', 'Regulator calendar (example)', 1, 'Regulator']],
        chain: ['A new entrant undercuts our prices in three circles.', 'Customers port out, and rivals match the price.', 'Dealers push whichever operator pays most, so our incentives rise or we lose shelf space.'] },
      tool: ['tools/guidance-tracker.html', 'Guidance Tracker'] }
  };

  /* Two more jobs: choosing a market to enter, and benchmarking against rivals. Illustrative, like the rest. */
  IND.hotels.market = { options: [
    { name: 'Tier-2 leisure cities', scores: [[5, 6.5, 8], [5, 6, 7.5], [4, 5.5, 7], [4, 5.5, 7]] },
    { name: 'Business hubs', scores: [[6, 7.5, 9], [4, 5, 6.5], [3, 4.5, 6], [5, 6, 7.5]] },
    { name: 'Pilgrimage towns', scores: [[4, 5.5, 7], [6, 7, 8.5], [5, 6.5, 8], [5, 6.5, 8]] },
    { name: 'Airport corridors', scores: [[5, 6, 7.5], [4, 5, 6.5], [3, 4, 5.5], [5, 6, 7]] }] };
  IND.pharma.market = { options: [
    { name: 'Tier-2 city hospitals', scores: [[5, 6.5, 8], [5, 6, 7.5], [4, 5.5, 7], [5, 6, 7.5]] },
    { name: 'Private clinics', scores: [[4, 5.5, 7], [6, 7, 8.5], [6, 7, 8], [5, 6.5, 8]] },
    { name: 'Government tenders', scores: [[6, 7.5, 9], [2, 3.5, 5], [3, 4, 5.5], [3, 4.5, 6]] },
    { name: 'A neighbouring export market', scores: [[5, 6, 8], [2, 3, 4.5], [2, 3, 4.5], [3, 4, 5.5]] }] };
  IND.telecom.market = { options: [
    { name: 'Rural districts', scores: [[5, 6, 7.5], [4, 5, 6.5], [3, 4.5, 6], [5, 6.5, 8]] },
    { name: 'Enterprise campuses', scores: [[6, 7.5, 9], [5, 6, 7.5], [4, 5.5, 7], [5, 6.5, 8]] },
    { name: 'Tourist corridors', scores: [[4, 5.5, 7], [6, 7, 8.5], [5, 6, 7.5], [4, 5.5, 7]] },
    { name: 'A neighbouring state', scores: [[6, 7, 8.5], [3, 4, 5.5], [2, 3.5, 5], [3, 4.5, 6]] }] };
  IND.hotels.knock.market = ['Entering a new city sets a rate level that is hard to move later.', 'Local agents may take the first bookings before direct channels are built.'];
  IND.pharma.knock.market = ['A first launch sets the price that regulators and rivals will point to elsewhere.', 'A thin field force in a new market can leave the first prescribers unsupported.'];
  IND.telecom.knock.market = ['A new market starts a price comparison with the incumbent there.', 'Dealer incentives needed to win the first customers may reset what dealers expect elsewhere.'];
  IND.hotels.bench = { rivals: ['Rival A', 'Rival B', 'Rival C'], metrics: [
    { n: 'Direct booking share', u: '%', us: 31, r: [38, 27, null], hi: 1, src: 'Rival results releases' },
    { n: 'Average daily rate', u: '', us: 7500, r: [7100, 6900, 7200], hi: 1, src: 'Rate shopping, public listings' },
    { n: 'Guest review score', u: ' of 5', us: 4.3, r: [4.5, 4.1, 4.2], hi: 1, src: 'Public review sites' },
    { n: 'Listings on AI assistants', u: '%', us: 12, r: [22, 9, 15], hi: 1, src: 'Public listings' }] };
  IND.pharma.bench = { rivals: ['Rival A', 'Rival B', 'Rival C'], metrics: [
    { n: 'Share of prescriptions in the segment', u: '%', us: 18, r: [24, 15, 9], hi: 1, src: 'Prescription audit summaries' },
    { n: 'Price per pack', u: '', us: 420, r: [455, 440, 430], hi: 0, src: 'Public price lists' },
    { n: 'Clinicians reached', u: '%', us: 62, r: [70, 55, null], hi: 1, src: 'Company statements' },
    { n: 'Trials in this indication', u: '', us: 2, r: [3, 1, 1], hi: 1, src: 'Trial registries' }] };
  IND.telecom.bench = { rivals: ['Rival A', 'Rival B', 'Rival C'], metrics: [
    { n: 'Monthly revenue per user', u: '', us: 183, r: [191, 167, 175], hi: 1, src: 'Quarterly results' },
    { n: 'Monthly churn', u: '%', us: 2.1, r: [1.8, 2.6, 2.3], hi: 0, src: 'Quarterly results' },
    { n: '5G coverage of target circles', u: '%', us: 64, r: [78, null, 60], hi: 1, src: 'Regulator filings' },
    { n: 'Retail outlets', u: ' thousand', us: 41, r: [38, 29, 35], hi: 1, src: 'Company statements' }] };
  var CRITERIA = [{ name: 'Revenue upside', w: 0.35 }, { name: 'Speed to start', w: 0.25 }, { name: 'Cost to start', w: 0.20 }, { name: 'Risk', w: 0.20 }];
  var DEC = {
    budget: { label: 'Split the budget', q: 'Where should we spend our marketing budget?', tool: ['tools/tipping-point.html', 'Tipping Point'], tag: 'Illustrative model',
      inputs: ['A low, typical and high value for each route\'s sales, margin and returns', 'Your current split of the budget'], outputs: ['A recommended split', 'The trade-off against your current plan', 'The assumption that matters most', 'A one-page memo'] },
    watch: { label: 'Watch competitors and the market', q: 'What are my competitors doing, and does it matter?', tag: 'Scripted example',
      inputs: ['A list of public sources', 'Your own sales and web notes'], outputs: ['A dated event log', 'What is not disclosed', 'An evidence rating for each decision', 'A one-page memo'] },
    price: { label: 'Test a price change', q: 'Should we change our price?', tag: 'Illustrative model',
      inputs: ['Your price, volume and unit cost', 'A range for how customers respond to price'], outputs: ['Profit for five price moves', 'How often each move comes out best', 'What would change the answer', 'A one-page memo'] },
    market: { label: 'Size up a new market', q: 'Which new market should we enter first?', tag: 'Illustrative model',
      inputs: ['The markets you are choosing between', 'The criteria and rough weights'], outputs: ['How often each market comes first', 'What would flip the order', 'A one-page memo'] },
    bench: { label: 'Benchmark against rivals', q: 'Where do we lead our rivals, and where do we trail?', tag: 'Scripted example',
      inputs: ['The rivals and the measures you care about', 'Public sources, and your own figures'], outputs: ['A sourced comparison table', 'Where figures are missing', 'Where you lead and where you trail', 'A one-page memo'] },
    rank: { label: 'Rank our options', q: 'Which go-to-market priority should come first?', tag: 'Illustrative model',
      inputs: ['The options you are choosing between', 'The criteria and rough weights'], outputs: ['How often each option comes first', 'What would flip the order', 'A one-page memo'] }
  };

  /* ---------- small view helpers ---------- */
  function pm(kind) { return '<i class="pm ' + kind + '" aria-hidden="true"></i>'; }
  var PM_TEXT = { pub: 'Public source', int: 'Customer-provided information', asm: 'Assumption', ana: 'Analysis or interpretation' };
  function rangeBar(lo, mo, hi, mn, mx, p) {
    var W = 120, X = function (v) { return 4 + (v - mn) / (mx - mn) * (W - 8); };
    return '<svg class="rb" viewBox="0 0 ' + W + ' 12" aria-hidden="true"><line x1="4" x2="' + (W - 4) + '" y1="6" y2="6" stroke="#DCE1E4"/><rect x="' + X(lo) + '" y="3" width="' + Math.max(2, (X(hi) - X(lo)) * p) + '" height="6" fill="#cfd6e3"/><circle cx="' + (X(lo) + (X(mo) - X(lo)) * p) + '" cy="6" r="3.2" fill="#172B3A" opacity="' + p + '"/></svg>';
  }
  var COLORS = ['#172B3A', '#557C78', '#9aa6b8'];

  /* ---------- memo helpers ---------- */
  function memoShell(title, meta) { return { title: title, meta: meta, blocks: [] }; }
  function addH(m, t) { m.blocks.push({ t: 'h', x: t }); }
  function addP(m, t) { m.blocks.push({ t: 'p', x: t }); }
  function addL(m, arr) { arr.forEach(function (x) { m.blocks.push({ t: 'li', x: x }); }); }
  function memoElements(m) {
    var els = [{ t: 'title', x: m.title }, { t: 'meta', x: m.meta }];
    return els.concat(m.blocks);
  }
  function memoHtml(m, n) {
    var els = memoElements(m), h = '', open = false;
    els.slice(0, n === undefined ? els.length : n).forEach(function (b) {
      if (b.t !== 'li' && open) { h += '</ul>'; open = false; }
      if (b.t === 'title') h += '<h3>' + esc(b.x) + '</h3>';
      else if (b.t === 'meta') h += '<p class="meta">' + esc(b.x) + '</p>';
      else if (b.t === 'h') h += '<h4>' + esc(b.x) + '</h4>';
      else if (b.t === 'p') h += '<p>' + esc(b.x) + '</p>';
      else if (b.t === 'li') { if (!open) { h += '<ul>'; open = true; } h += '<li>' + esc(b.x) + '</li>'; }
    });
    if (open) h += '</ul>';
    return h;
  }
  function memoMd(m) {
    var out = '# ' + m.title + '\n\n_' + m.meta + '_\n\n', open = false;
    m.blocks.forEach(function (b) { if (b.t === 'h') out += '\n## ' + b.x + '\n\n'; else if (b.t === 'p') out += b.x + '\n\n'; else if (b.t === 'li') out += '- ' + b.x + '\n'; });
    return out + '\n';
  }

  /* ---------- plans ---------- */
  function inputsTable(head, rows, withBars, p) {
    var h = '<div class="v-table"><table><thead><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) { h += '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; });
    return h + '</tbody></table></div>';
  }
  function hingeBars(items, maxv, unit) {
    var h = '<div class="v-bars">';
    items.forEach(function (it) { h += '<div class="vb"><div class="vb-l">' + it.l + '</div><div class="vb-b"><i style="width:' + (maxv > 0 ? Math.max(3, it.v / maxv * 100) : 3) + '%"></i></div><div class="vb-v">' + it.t + '</div></div>'; });
    return h + '</div>';
  }

  function lc(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function planBudget(ik) {
    var I = IND[ik], cfg = I.budget, E = budgetEngine(cfg), N = E.N, names = cfg.routes;
    var KM = { R: 'sales at half the budget', m: 'contribution margin', b: 'how fast returns fade' };
    var markFor = { R: 'int', m: 'pub', b: 'asm' };
    function tableRows(bars, p) {
      var rows = [];
      for (var r = 0; r < 3; r++) {
        var row = ['<b>' + esc(names[r]) + '</b>'];
        for (var k = 0; k < 3; k++) {
          var x = cfg.rng[r * 3 + k], isM = k === 1, fmt = function (v) { return isM ? f0(v * 100) + '%' : (k === 2 ? v.toFixed(2) : f0(v)); };
          var cell = pm(markFor['Rmb'.charAt(k)]) + fmt(x[0]) + ' / <b>' + fmt(x[1]) + '</b> / ' + fmt(x[2]);
          if (bars) cell += rangeBar(x[0], x[1], x[2], x[0] * 0.85, x[2] * 1.1, p);
          row.push(cell);
        }
        rows.push(row);
      }
      return rows;
    }
    var head = ['Route', 'Sales at half the budget', 'Contribution margin', 'How fast returns fade'];
    var steps = [];
    steps.push({ n: 'Collect what we know', t: 'Your own history, public rate cards and clearly marked assumptions.', d: 4300,
      draw: function (v, p) {
        var k = Math.min(9, Math.floor(Math.min(1, p * 1.1) * 9) + 1), rows = tableRows(false, 1).map(function (r, i) { return r.map(function (c, j) { return j === 0 ? c : (i * 3 + (j - 1) < k ? c : '&nbsp;'); }); }).filter(function (r, i) { return i * 3 < k; });
        v.innerHTML = '<p class="v-title">' + esc(I.co) + ' has ₹100 crore to place across three routes. Low / typical / high.</p>' + inputsTable(head, rows);
      } });
    steps.push({ n: 'Turn each guess into a range', t: 'Nobody knows the exact number, so every input becomes a low, typical and high value.', d: 3800,
      draw: function (v, p) { v.innerHTML = '<p class="v-title">Each input is a range, not a single number.</p>' + inputsTable(head, tableRows(true, Math.min(1, p * 1.1))); } });
    var cv = null, cx = null, drawn = 0, cnt = null;
    steps.push({ n: 'Run 5,000 possible futures', t: 'In each one, work out the best way to split the budget.', d: 5600,
      draw: function (v, p, first) {
        if (first) {
          drawn = 0;
          v.innerHTML = '<div class="v-scat"><canvas width="560" height="420" aria-hidden="true"></canvas><div class="v-side"><div class="v-count" id="v-count"></div><p class="v-note">Each dot is one possible future. Its position is the best split in that future, and its colour is the route that gets the most.</p>' +
            names.map(function (n, i) { return '<div class="v-leg"><i style="background:' + COLORS[i] + '"></i>' + esc(n) + '</div>'; }).join('') + '</div></div>';
          cv = v.querySelector('canvas'); cnt = v.querySelector('#v-count'); cx = cv.getContext('2d');
          var W = cv.width, H = cv.height, ml = 46, mb = 40, mt = 12, mr = 14;
          cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, W, H); cx.strokeStyle = '#DCE1E4'; cx.fillStyle = '#697580'; cx.font = '14px sans-serif';
          [0, 25, 50, 75, 100].forEach(function (t) { var x = ml + t / 100 * (W - ml - mr), y = H - mb - t / 100 * (H - mt - mb); cx.beginPath(); cx.moveTo(x, mt); cx.lineTo(x, H - mb); cx.stroke(); cx.beginPath(); cx.moveTo(ml, y); cx.lineTo(W - mr, y); cx.stroke(); cx.textAlign = 'center'; cx.fillText(String(t), x, H - mb + 16); cx.textAlign = 'right'; cx.fillText(String(t), ml - 6, y + 4); });
          cx.textAlign = 'center'; cx.fillText(names[1] + ', ₹ crore', (ml + W - mr) / 2, H - 6);
          cx.save(); cx.translate(12, (mt + H - mb) / 2); cx.rotate(-Math.PI / 2); cx.fillText(names[0] + ', ₹ crore', 0, 0); cx.restore();
        }
        var upto = Math.floor(p * N), W2 = cv.width, H2 = cv.height, ml2 = 46, mb2 = 40, mt2 = 12, mr2 = 14, rr = mulberry32(3);
        for (var i = drawn; i < upto; i++) {
          var a0 = E.optA[i * 3], a1 = E.optA[i * 3 + 1], a2 = E.optA[i * 3 + 2], w = 0; if (a1 > a0 && a1 >= a2) w = 1; else if (a2 > a0 && a2 > a1) w = 2;
          var x = ml2 + a1 / 100 * (W2 - ml2 - mr2) + (rr() - .5) * 2, y = H2 - mb2 - a0 / 100 * (H2 - mt2 - mb2) + (rr() - .5) * 2;
          cx.globalAlpha = 0.45; cx.fillStyle = COLORS[w]; cx.beginPath(); cx.arc(x, y, 2.6, 0, 6.2832); cx.fill();
        }
        cx.globalAlpha = 1; drawn = upto; if (cnt) cnt.textContent = (p >= 1 ? N : upto).toLocaleString('en-US') + ' of ' + N.toLocaleString('en-US') + ' futures';
      } });
    steps.push({ n: 'Find where each route stops paying', t: 'Past that point, each extra rupee brings back less than a rupee.', d: 4600,
      draw: function (v, p) {
        var q = Math.min(1, p * 1.15), h = '<div class="v-multi">';
        for (var r = 0; r < 3; r++) h += tipChart(E, r, names[r], cfg.plan[r], q);
        v.innerHTML = '<p class="v-title">Spend on each route, ₹ crore. The tick is where it stops paying back.</p>' + h + '</div>';
      } });
    var hing = E.hinge.slice(0, 5);
    steps.push({ n: 'Find the assumption that matters most', t: 'Move each input to its low and high end, and see how far the best split moves.', d: 4400,
      draw: function (v, p) {
        var items = hing.map(function (x) { return { l: pm(markFor[x.k]) + esc(names[x.r]) + ': ' + KM[x.k], v: x.dist * Math.min(1, p * 1.3), t: f0(x.dist) + ' points' }; });
        v.innerHTML = '<p class="v-title">How far the best split moves, in points of the budget.</p>' + hingeBars(items, hing[0].dist);
      } });
    var memo = memoShell('Where to place the next ₹100 crore: draft memo', I.co + '. Illustrative inputs, nothing here describes a real company. ' + N.toLocaleString('en-US') + ' scenarios, fixed seed.');
    addH(memo, 'Recommendation');
    addP(memo, 'Place ' + cr(E.best[0]) + ' in ' + lc(names[0]) + ', ' + cr(E.best[1]) + ' in ' + lc(names[1]) + ' and ' + cr(E.best[2]) + ' in ' + lc(names[2]) + '. Across the scenarios this averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for the current ' + cfg.plan.join('/') + ' plan, and it beats the plan in ' + pc(E.beat) + ' of scenarios.');
    addH(memo, 'Where each route stops paying');
    addL(memo, names.map(function (n, r) { return n + ': near ' + cr(E.stop[r].p50) + ' (80% range ' + f0(E.stop[r].p10) + ' to ' + (E.stop[r].p90 > 100 ? 'over 100' : f0(E.stop[r].p90)) + ').'; }));
    addH(memo, 'The assumption to check first');
    addP(memo, names[hing[0].r] + ': ' + KM[hing[0].k] + '. It moves the best split by up to ' + f0(hing[0].dist) + ' points of the budget. The evidence that would settle it is ' + cfg.evidence + '.');
    addH(memo, 'Knock-on effects to test');
    addL(memo, I.knock.budget);
    addH(memo, 'Limits');
    addL(memo, ['Every input is illustrative. Each route is an independent curve, so this is the best split inside the model and not a forecast.']);
    steps.push(memoStep(memo));
    var summary = {
      rec: 'Place ' + cr(E.best[0]) + ' in ' + lc(names[0]) + ', ' + cr(E.best[1]) + ' in ' + lc(names[1]) + ' and ' + cr(E.best[2]) + ' in ' + lc(names[2]) + '.',
      trade: 'Averages ' + cr(E.bestMean) + ' of contribution, against ' + cr(E.planMean) + ' for the current ' + cfg.plan.join(' / ') + ' plan. It beats the plan in ' + pc(E.beat) + ' of ' + N.toLocaleString('en-US') + ' scenarios.',
      unc: 'The answer depends most on ' + names[hing[0].r].toLowerCase() + ': ' + KM[hing[0].k] + '. At the low or high end of its range, the best split moves by up to ' + f0(hing[0].dist) + ' points of the budget.',
      next: 'The evidence that would settle it is ' + cfg.evidence + '. Replace the assumption with the real figure and rerun.' };
    return { steps: steps, memo: memo, engine: E, summary: summary };
  }

  function tipChart(E, r, name, planAt, q) {
    if (q === undefined) q = 1;
    var W = 250, H = 190, ml = 28, mr = 8, mt = 22, mb = 30, YM = 2.5, c = E.curve[r], g = E.grid, col = COLORS[r], sp = E.stop[r];
    function X(s) { return ml + s / 100 * (W - ml - mr); }
    function Y(v) { return mt + (1 - Math.min(v, YM) / YM) * (H - mt - mb); }
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Return on the next rupee for ' + esc(name) + '">';
    o += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + (H - mb) + '" y2="' + (H - mb) + '" stroke="#697580"/>';
    [0, 1, 2].forEach(function (t) { o += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="#e3e6ea"/><text x="' + (ml - 5) + '" y="' + (Y(t) + 4) + '" text-anchor="end" font-size="12" fill="#697580">' + t + '</text>'; });
    [0, 50, 100].forEach(function (t) { o += '<text x="' + X(t) + '" y="' + (H - mb + 14) + '" text-anchor="middle" font-size="12" fill="#697580">' + t + '</text>'; });
    var d = 'M'; g.forEach(function (s, i) { d += (i ? 'L' : '') + X(s) + ' ' + Y(c.hi[i]); }); for (var i = g.length - 1; i >= 0; i--) d += 'L' + X(g[i]) + ' ' + Y(c.lo[i]);
    o += '<defs><clipPath id="clp' + r + '"><rect x="' + ml + '" y="0" width="' + ((W - ml - mr) * q) + '" height="' + H + '"/></clipPath></defs><g clip-path="url(#clp' + r + ')">';
    o += '<path d="' + d + 'Z" fill="' + col + '" opacity="0.16"/>';
    var ln = ''; g.forEach(function (s, i) { ln += (i ? 'L' : 'M') + X(s) + ' ' + Y(c.md[i]); });
    o += '<path d="' + ln + '" fill="none" stroke="' + col + '" stroke-width="2"/></g>';
    o += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(1) + '" y2="' + Y(1) + '" stroke="#172B3A" stroke-dasharray="4 3" stroke-width="1"/>';
    if (sp.p50 <= 100 && sp.p50 <= q * 100) o += '<line x1="' + X(sp.p50) + '" x2="' + X(sp.p50) + '" y1="' + mt + '" y2="' + (H - mb) + '" stroke="#172B3A"/><circle cx="' + X(sp.p50) + '" cy="' + Y(1) + '" r="4" fill="' + col + '" stroke="#ffffff" stroke-width="2"/>';
    o += '<text x="' + ml + '" y="12" font-size="14" font-weight="600" fill="#172B3A">' + esc(name) + '</text>';
    if (q >= 1) o += '<text x="' + ml + '" y="' + (H - 4) + '" font-size="12.5" fill="#172B3A">' + (sp.p50 <= 100 ? 'Stops paying near ₹' + f0(sp.p50) + ' crore' : 'Does not stop within the budget') + '</text>';
    o += '</svg>';
    return '<div class="v-ch">' + o + '</div>';
  }

  function memoStep(memo) {
    var els = memoElements(memo);
    return { n: 'Draft the memo', t: 'Write it from the results, with the limits and the knock-on effects.', d: 6000, memo: true,
      draw: function (v, p) { var n = Math.max(2, Math.ceil(p * els.length)); v.innerHTML = '<div class="v-memo">' + memoHtml(memo, n) + '</div>'; var m = v.querySelector('.v-memo'); if (m && p < 1) m.scrollTop = m.scrollHeight; } };
  }

  function planPrice(ik) {
    var I = IND[ik], cfg = I.price, E = priceEngine(cfg), N = E.N, unit = cfg.unit;
    var head = ['Input', 'Low / typical / high', 'Where it comes from'];
    function rows(bars, p) {
      var f = function (x, d) { return x.map(function (y, i) { return i === 1 ? '<b>' + y.toFixed(d) + '</b>' : y.toFixed(d); }).join(' / '); };
      var r = [
        [pm('int') + 'Current price per ' + unit, '₹' + cfg.P0.toLocaleString('en-IN'), 'Your price list'],
        [pm('int') + 'Volume per year', cfg.q0.toLocaleString('en-IN') + ' ' + unit + 's', 'Your sales history'],
        [pm('int') + 'Your cost per ' + unit, '₹' + f(cfg.c, 0), 'Your cost data'],
        [pm('asm') + 'How customers respond to price', f(cfg.e, 1) + (bars ? rangeBar(cfg.e[0], cfg.e[1], cfg.e[2], cfg.e[0] - .3, cfg.e[2] + .3, p) : ''), 'Assumption: a 1% rise cuts volume by this many percent'],
        [pm('asm') + 'Share of a price cut that rivals match', f(cfg.m, 2) + (bars ? rangeBar(cfg.m[0], cfg.m[1], cfg.m[2], -0.05, 1, p) : ''), 'Assumption']];
      return r;
    }
    var steps = [];
    steps.push({ n: 'Collect what we know', t: 'Your price, volume and cost, and the assumptions we cannot observe.', d: 4200, draw: function (v, p, first) { if (first) v.innerHTML = '<p class="v-title">' + esc(I.co) + ' is thinking about moving its price.</p>' + inputsTable(head, rows(false, 1)); } });
    steps.push({ n: 'Turn each guess into a range', t: 'Customer response is the least certain input, so it becomes a range.', d: 3600, draw: function (v, p) { v.innerHTML = '<p class="v-title">Unknown inputs become ranges.</p>' + inputsTable(head, rows(true, Math.min(1, p * 1.4))); } });
    steps.push({ n: 'Run 5,000 customer-response scenarios', t: 'For each price move, work out the profit in every scenario.', d: 5400,
      draw: function (v, p) {
        var W = 560, H = 310, ml = 56, mr = 20, mt = 38, mb = 50, lo = Math.min.apply(null, E.p10) * 0.97, hi = Math.max.apply(null, E.p90) * 1.03, k, o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Expected profit for each price move">';
        function X(i) { return ml + (i + 0.5) / 5 * (W - ml - mr); } function Y(vv) { return mt + (1 - (vv - lo) / (hi - lo)) * (H - mt - mb); }
        for (var t = 0; t <= 4; t++) { var val = lo + (hi - lo) * t / 4; o += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + Y(val) + '" y2="' + Y(val) + '" stroke="#e3e6ea"/><text x="' + (ml - 6) + '" y="' + (Y(val) + 4) + '" text-anchor="end" font-size="13" fill="#697580">' + f0(val) + '</text>'; }
        var idx = Math.min(E.cp - 1, Math.max(0, Math.floor(p * E.cp) - 1)), showBand = p > 0.7;
        for (k = 0; k < 5; k++) {
          o += '<text x="' + X(k) + '" y="' + (H - mb + 20) + '" text-anchor="middle" font-size="13" fill="#172B3A">' + PRICE_LABEL[k] + '</text>';
          if (showBand) o += '<line x1="' + X(k) + '" x2="' + X(k) + '" y1="' + Y(E.p10[k]) + '" y2="' + Y(E.p90[k]) + '" stroke="#8c867b" stroke-width="3" opacity="' + Math.min(1, (p - .7) * 4) + '"/>';
          var rm = p <= 0.02 ? E.runMean[k][0] : E.runMean[k][idx];
          o += '<circle cx="' + X(k) + '" cy="' + Y(rm) + '" r="6" fill="' + (k === 2 ? '#697580' : '#172B3A') + '"/>';
        }
        o += '<text x="' + ml + '" y="12" font-size="14" fill="#697580">Expected profit, ₹ crore a year. The grey line spans the middle 80% of scenarios.</text></svg>';
        v.innerHTML = '<div class="v-chart">' + o + '</div><div class="v-count">' + Math.max(1, Math.floor(p * N)).toLocaleString('en-US') + ' of ' + N.toLocaleString('en-US') + ' scenarios</div>';
      } });
    steps.push({ n: 'Compare the five options', t: 'How often does each price move turn out best?', d: 4200,
      draw: function (v, p) {
        var items = PRICE_LABEL.map(function (l, k) { return { l: esc(l), v: E.probBest[k] * Math.min(1, p * 1.3), t: pc(E.probBest[k]) + ' of scenarios' }; });
        v.innerHTML = '<p class="v-title">The share of scenarios in which each option earns the most.</p>' + hingeBars(items, Math.max.apply(null, E.probBest));
      } });
    steps.push({ n: 'Find what would change the answer', t: 'Move each unknown to its low and high end and see if the best option changes.', d: 4200,
      draw: function (v, p) {
        var items = E.hinge.map(function (x) { return { l: pm(x.k === 'c' ? 'int' : 'asm') + esc(x.label), v: x.dist * Math.min(1, p * 1.3), t: x.dist ? 'changes the best option' : 'does not change it' }; });
        v.innerHTML = '<p class="v-title">Does the best option change when this input moves?</p>' + hingeBars(items, Math.max(1, E.hinge[0].dist));
      } });
    var b = E.bestIdx, hold = 2, memo = memoShell('Should we move our price? Draft memo', I.co + '. Illustrative inputs, nothing here describes a real company. ' + N.toLocaleString('en-US') + ' scenarios, fixed seed.');
    addH(memo, 'Recommendation');
    if (b === hold) addP(memo, 'Hold the price. Expected profit is ' + cr(E.mean[hold]) + ' a year, and no price move beats it on average. Holding is the best of the five options in ' + pc(E.probBest[hold]) + ' of scenarios.');
    else addP(memo, PRICE_LABEL[b] + '. Expected profit is ' + cr(E.mean[b]) + ' a year, against ' + cr(E.mean[hold]) + ' if you hold. It is the best of the five options in ' + pc(E.probBest[b]) + ' of scenarios.');
    addP(memo, 'In the worst tenth of scenarios, ' + PRICE_LABEL[b].toLowerCase() + ' returns ' + cr(E.p10[b]) + ', against ' + cr(E.p10[hold]) + ' for holding.');
    addH(memo, 'What the answer depends on');
    addP(memo, 'Most sensitive to ' + E.hinge[0].label + (E.hinge[0].dist ? '. At its low or high end the best option changes.' : '. The best option holds across its range.') + (E.breakEven !== null ? ' At typical costs, ' + PRICE_LABEL[b].toLowerCase() + ' pays only if the response to price is milder than ' + E.breakEven.toFixed(1) + '.' : '') + ' The evidence that would settle it is ' + cfg.evidence + '.');
    addH(memo, 'Knock-on effects to test');
    addL(memo, I.knock.price);
    addH(memo, 'Limits');
    addL(memo, ['Every input is illustrative. The model assumes a constant response to price and ignores brand and long-run effects, so it is a way to test a move and not a forecast.']);
    steps.push(memoStep(memo));
    var summary = {
      rec: (b === hold ? 'Hold the price.' : PRICE_LABEL[b] + '.'),
      trade: b === hold ? 'Expected profit is ' + cr(E.mean[hold]) + ' a year, and no price move beats it on average. In the worst tenth of scenarios it still returns ' + cr(E.p10[hold]) + '.' : 'Expected profit is ' + cr(E.mean[b]) + ' a year, against ' + cr(E.mean[hold]) + ' if you hold. In the worst tenth of scenarios it returns ' + cr(E.p10[b]) + ', against ' + cr(E.p10[hold]) + ' for holding.',
      unc: 'The answer is most sensitive to ' + E.hinge[0].label + (E.hinge[0].dist ? '. At its low or high end the best option changes.' : ', although the best option holds across its range.'),
      next: 'The evidence that would settle it is ' + cfg.evidence + '. Replace the assumption with the real figure and rerun.' };
    return { steps: steps, memo: memo, engine: E, summary: summary };
  }

  function planRank(ik) {
    var I = IND[ik], cfg = { options: I.rank.options, criteria: CRITERIA }, E = rankEngine(cfg), N = E.N, opts = cfg.options;
    function grid(withRange, p) {
      var h = '<div class="v-table"><table><thead><tr><th>Option</th>' + CRITERIA.map(function (c) { return '<th>' + pm('int') + esc(c.name) + ' (' + f0(c.w * 100) + '%)</th>'; }).join('') + '</tr></thead><tbody>';
      opts.forEach(function (o) { h += '<tr><td><b>' + esc(o.name) + '</b></td>' + o.scores.map(function (s) { return '<td>' + pm('asm') + (withRange ? s[0] + ' / <b>' + s[1] + '</b> / ' + s[2] + rangeBar(s[0], s[1], s[2], 0, 10, Math.min(1, p * 1.4)) : '<b>' + s[1] + '</b>') + '</td>'; }).join('') + '</tr>'; });
      return h + '</tbody></table></div>';
    }
    var steps = [];
    steps.push({ n: 'List the options and what matters', t: 'Score each option from 1 to 10 on four criteria, and weigh the criteria.', d: 4300, draw: function (v, p, first) { if (first) v.innerHTML = '<p class="v-title">' + esc(I.co) + ' has four options. A higher score is better on every criterion.</p>' + grid(false, 1); } });
    steps.push({ n: 'Allow for uncertainty', t: 'Scores and weights are judgements, so each becomes a range.', d: 3800, draw: function (v, p) { v.innerHTML = '<p class="v-title">Scores are shown as low / typical / high. Weights can move by about 30%.</p>' + grid(true, p); } });
    steps.push({ n: 'Run 5,000 scenarios', t: 'In each one, draw the scores and weights and see which option comes first.', d: 5400,
      draw: function (v, p) {
        var idx = Math.min(E.checkpoints.length - 1, Math.max(0, Math.floor(p * E.checkpoints.length) - 1)), cur = E.checkpoints[idx];
        var items = opts.map(function (o, k) { return { l: esc(o.name), v: cur[k], t: pc(cur[k]) + ' first' }; });
        v.innerHTML = '<p class="v-title">How often each option ranks first, so far.</p>' + hingeBars(items, 1) + '<div class="v-count">' + Math.max(1, Math.floor(p * N)).toLocaleString('en-US') + ' of ' + N.toLocaleString('en-US') + ' scenarios</div>';
      } });
    steps.push({ n: 'See how stable the ranking is', t: 'A clear winner comes first in most scenarios. A close call does not.', d: 4200,
      draw: function (v, p) {
        var items = E.order.map(function (k) { return { l: esc(opts[k].name), v: E.prob[k] * Math.min(1, p * 1.3), t: pc(E.prob[k]) + ' first, average score ' + f1(E.avg[k]) }; });
        v.innerHTML = '<p class="v-title">Final order, from first to last.</p>' + hingeBars(items, E.prob[E.order[0]]);
      } });
    steps.push({ n: 'Find what would flip the order', t: 'Halve or raise each weight by half and see whether a different option comes first.', d: 4400,
      draw: function (v, p) {
        var h = '<p class="v-title">Does a different option come first when one weight changes?</p><div class="v-table"><table><thead><tr><th>Weight</th><th>Halved</th><th>Raised by half</th></tr></thead><tbody>';
        CRITERIA.forEach(function (c, ci) { var a = E.flips.filter(function (x) { return x.c === ci && x.f === 0.5; })[0], b = E.flips.filter(function (x) { return x.c === ci && x.f === 1.5; })[0];
          var cell = function (x) { return x.flip ? '<b>' + esc(opts[x.to].name) + ' comes first</b>' : 'No change'; };
          h += '<tr><td>' + pm('int') + esc(c.name) + '</td><td>' + (p > 0.3 ? cell(a) : '') + '</td><td>' + (p > 0.55 ? cell(b) : '') + '</td></tr>'; });
        v.innerHTML = h + '</tbody></table></div>';
      } });
    var top = E.order[0], second = E.order[1];
    var memo = memoShell('What should we do first? Draft memo', I.co + '. Illustrative scores and weights, nothing here describes a real company. ' + N.toLocaleString('en-US') + ' scenarios, fixed seed.');
    addH(memo, 'Recommendation');
    addP(memo, 'Do ' + opts[top].name.toLowerCase() + ' first. It ranks first in ' + pc(E.prob[top]) + ' of scenarios, ahead of ' + opts[second].name.toLowerCase() + ' at ' + pc(E.prob[second]) + '. ' + (E.prob[top] - E.prob[second] < 0.2 ? 'This is a close call, so treat the order as a judgement and not a verdict.' : 'The lead is clear under these weights.'));
    addH(memo, 'What would flip the order');
    var fl = E.flips.filter(function (x) { return x.flip; });
    if (fl.length) addL(memo, fl.map(function (x) { return 'If the weight on ' + CRITERIA[x.c].name.toLowerCase() + ' is ' + (x.f === 0.5 ? 'halved' : 'raised by half') + ', ' + opts[x.to].name.toLowerCase() + ' comes first.'; }));
    else addP(memo, 'No single weight change of up to half flips the order.');
    addH(memo, 'Evidence to collect');
    addP(memo, 'The weights your leadership actually uses, and a small test for the option that comes second.');
    addH(memo, 'Knock-on effects to test');
    addL(memo, I.knock.rank);
    addH(memo, 'Limits');
    addL(memo, ['Every score and weight is illustrative. A ranking summarises judgements. It does not remove them.']);
    steps.push(memoStep(memo));
    var close = E.prob[top] - E.prob[second] < 0.2;
    var summary = {
      rec: 'Do ' + opts[top].name.toLowerCase() + ' first.',
      trade: 'It ranks first in ' + pc(E.prob[top]) + ' of scenarios, ahead of ' + opts[second].name.toLowerCase() + ' at ' + pc(E.prob[second]) + '. ' + (close ? 'This is a close call, so treat the order as a judgement.' : 'The lead is clear under these weights.'),
      unc: fl.length ? 'If the weight on ' + CRITERIA[fl[0].c].name.toLowerCase() + ' is ' + (fl[0].f === 0.5 ? 'halved' : 'raised by half') + ', ' + opts[fl[0].to].name.toLowerCase() + ' comes first.' : 'No single weight change of up to half flips the order.',
      next: 'Agree the weights your leadership actually uses, and run a small test of the option that comes second.' };
    return { steps: steps, memo: memo, engine: E, summary: summary };
  }  function planMarket(ik) {
    var I = IND[ik], cfg = { options: I.market.options, criteria: CRITERIA }, E = rankEngine(cfg), N = E.N, opts = cfg.options;
    function grid(withRange, p) {
      var h = '<div class="v-table"><table><thead><tr><th>Option</th>' + CRITERIA.map(function (c) { return '<th>' + pm('int') + esc(c.name) + ' (' + f0(c.w * 100) + '%)</th>'; }).join('') + '</tr></thead><tbody>';
      opts.forEach(function (o) { h += '<tr><td><b>' + esc(o.name) + '</b></td>' + o.scores.map(function (s) { return '<td>' + pm('asm') + (withRange ? s[0] + ' / <b>' + s[1] + '</b> / ' + s[2] + rangeBar(s[0], s[1], s[2], 0, 10, Math.min(1, p * 1.4)) : '<b>' + s[1] + '</b>') + '</td>'; }).join('') + '</tr>'; });
      return h + '</tbody></table></div>';
    }
    var steps = [];
    steps.push({ n: 'List the options and what matters', t: 'Score each option from 1 to 10 on four criteria, and weigh the criteria.', d: 4300, draw: function (v, p, first) { if (first) v.innerHTML = '<p class="v-title">' + esc(I.co) + ' has four markets to choose between. A higher score is better on every criterion.</p>' + grid(false, 1); } });
    steps.push({ n: 'Allow for uncertainty', t: 'Scores and weights are judgements, so each becomes a range.', d: 3800, draw: function (v, p) { v.innerHTML = '<p class="v-title">Scores are shown as low / typical / high. Weights can move by about 30%.</p>' + grid(true, p); } });
    steps.push({ n: 'Run 5,000 scenarios', t: 'In each one, draw the scores and weights and see which option comes first.', d: 5400,
      draw: function (v, p) {
        var idx = Math.min(E.checkpoints.length - 1, Math.max(0, Math.floor(p * E.checkpoints.length) - 1)), cur = E.checkpoints[idx];
        var items = opts.map(function (o, k) { return { l: esc(o.name), v: cur[k], t: pc(cur[k]) + ' first' }; });
        v.innerHTML = '<p class="v-title">How often each option ranks first, so far.</p>' + hingeBars(items, 1) + '<div class="v-count">' + Math.max(1, Math.floor(p * N)).toLocaleString('en-US') + ' of ' + N.toLocaleString('en-US') + ' scenarios</div>';
      } });
    steps.push({ n: 'See how stable the ranking is', t: 'A clear winner comes first in most scenarios. A close call does not.', d: 4200,
      draw: function (v, p) {
        var items = E.order.map(function (k) { return { l: esc(opts[k].name), v: E.prob[k] * Math.min(1, p * 1.3), t: pc(E.prob[k]) + ' first, average score ' + f1(E.avg[k]) }; });
        v.innerHTML = '<p class="v-title">Final order, from first to last.</p>' + hingeBars(items, E.prob[E.order[0]]);
      } });
    steps.push({ n: 'Find what would flip the order', t: 'Halve or raise each weight by half and see whether a different option comes first.', d: 4400,
      draw: function (v, p) {
        var h = '<p class="v-title">Does a different option come first when one weight changes?</p><div class="v-table"><table><thead><tr><th>Weight</th><th>Halved</th><th>Raised by half</th></tr></thead><tbody>';
        CRITERIA.forEach(function (c, ci) { var a = E.flips.filter(function (x) { return x.c === ci && x.f === 0.5; })[0], b = E.flips.filter(function (x) { return x.c === ci && x.f === 1.5; })[0];
          var cell = function (x) { return x.flip ? '<b>' + esc(opts[x.to].name) + ' comes first</b>' : 'No change'; };
          h += '<tr><td>' + pm('int') + esc(c.name) + '</td><td>' + (p > 0.3 ? cell(a) : '') + '</td><td>' + (p > 0.55 ? cell(b) : '') + '</td></tr>'; });
        v.innerHTML = h + '</tbody></table></div>';
      } });
    var top = E.order[0], second = E.order[1];
    var memo = memoShell('Which new market should we enter first? Draft memo', I.co + '. Illustrative scores and weights, nothing here describes a real company. ' + N.toLocaleString('en-US') + ' scenarios, fixed seed.');
    addH(memo, 'Recommendation');
    addP(memo, 'Enter ' + opts[top].name.toLowerCase() + ' first. It ranks first in ' + pc(E.prob[top]) + ' of scenarios, ahead of ' + opts[second].name.toLowerCase() + ' at ' + pc(E.prob[second]) + '. ' + (E.prob[top] - E.prob[second] < 0.2 ? 'This is a close call, so treat the order as a judgement and not a verdict.' : 'The lead is clear under these weights.'));
    addH(memo, 'What would flip the order');
    var fl = E.flips.filter(function (x) { return x.flip; });
    if (fl.length) addL(memo, fl.map(function (x) { return 'If the weight on ' + CRITERIA[x.c].name.toLowerCase() + ' is ' + (x.f === 0.5 ? 'halved' : 'raised by half') + ', ' + opts[x.to].name.toLowerCase() + ' comes first.'; }));
    else addP(memo, 'No single weight change of up to half flips the order.');
    addH(memo, 'Evidence to collect');
    addP(memo, 'The weights your leadership actually uses, and a small test in the market that comes second.');
    addH(memo, 'Knock-on effects to test');
    addL(memo, I.knock.market);
    addH(memo, 'Limits');
    addL(memo, ['Every score and weight is illustrative. A ranking summarises judgements. It does not remove them.']);
    steps.push(memoStep(memo));
    var close = E.prob[top] - E.prob[second] < 0.2;
    var summary = {
      rec: 'Enter ' + opts[top].name.toLowerCase() + ' first.',
      trade: 'It ranks first in ' + pc(E.prob[top]) + ' of scenarios, ahead of ' + opts[second].name.toLowerCase() + ' at ' + pc(E.prob[second]) + '. ' + (close ? 'This is a close call, so treat the order as a judgement.' : 'The lead is clear under these weights.'),
      unc: fl.length ? 'If the weight on ' + CRITERIA[fl[0].c].name.toLowerCase() + ' is ' + (fl[0].f === 0.5 ? 'halved' : 'raised by half') + ', ' + opts[fl[0].to].name.toLowerCase() + ' comes first.' : 'No single weight change of up to half flips the order.',
      next: 'Agree the weights your leadership actually uses, and run a small test in the market that comes second.' };
    return { steps: steps, memo: memo, engine: E, summary: summary };
  }
  function planBench(ik) {
    var I = IND[ik], B = I.bench, M = B.metrics, names = ['Us'].concat(B.rivals);
    function lc1(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
    function fmt(m, v) { return v === null ? 'Not disclosed' : (m.u === '' && v >= 1000 ? v.toLocaleString('en-US') : String(v)) + m.u; }
    var rows = M.map(function (m) {
      var best = null; m.r.forEach(function (v, k) { if (v !== null && (best === null || (m.hi ? v > m.r[best] : v < m.r[best]))) best = k; });
      var ratio = m.hi ? m.us / m.r[best] : m.r[best] / m.us;
      return { m: m, best: best, ratio: ratio, ahead: ratio >= 1 };
    });
    function table(n, gaps) {
      var h = '<div class="v-table"><table><thead><tr><th>Measure</th>' + names.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '<th>Source</th></tr></thead><tbody>';
      M.slice(0, n).forEach(function (m) {
        h += '<tr><td><b>' + esc(m.n) + '</b></td><td>' + pm('int') + esc(fmt(m, m.us)) + '</td>' + m.r.map(function (v) { return '<td' + (v === null && gaps ? ' class="gapc"' : '') + '>' + pm('pub') + esc(fmt(m, v)) + '</td>'; }).join('') + '<td class="v-src1">' + esc(m.src) + '</td></tr>';
      });
      return h + '</tbody></table></div>';
    }
    var steps = [];
    steps.push({ n: 'Choose the rivals and the measures', t: 'Three rivals and four measures that matter for the decision.', d: 3800, draw: function (v, p, first) {
      if (first) v.innerHTML = '<p class="v-title">' + esc(I.co) + ' compares itself with three rivals on four measures.</p><div class="v-table"><table><thead><tr><th>Measure</th><th>Where the figure comes from</th></tr></thead><tbody>' + M.map(function (m) { return '<tr><td><b>' + esc(m.n) + '</b></td><td>' + pm('pub') + esc(m.src) + '</td></tr>'; }).join('') + '</tbody></table></div>'; } });
    steps.push({ n: 'Collect each figure, with a source', t: 'Every figure gets a source. Your own figures are marked as yours.', d: 4800, draw: function (v, p) {
      var n = Math.max(1, Math.ceil(p * M.length)); v.innerHTML = '<p class="v-title">Figures collected so far.</p>' + table(n, false); } });
    steps.push({ n: 'Flag what is missing', t: 'A figure nobody has published stays a gap, and is not guessed.', d: 3600, draw: function (v, p) {
      var g = M.reduce(function (a, m) { return a + m.r.filter(function (x) { return x === null; }).length; }, 0);
      v.innerHTML = '<p class="v-title">' + g + ' figure' + (g === 1 ? ' is' : 's are') + ' not disclosed.</p>' + table(M.length, p > 0.3); } });
    steps.push({ n: 'Compare us with the best rival', t: 'For each measure, how close are we to the best rival?', d: 4600, draw: function (v, p) {
      var items = rows.map(function (r) { return { l: esc(r.m.n), v: Math.min(1.3, r.ratio) * Math.min(1, p * 1.3), t: r.ahead ? 'Ahead of ' + esc(B.rivals[r.best]) : Math.round(r.ratio * 100) + '% of ' + esc(B.rivals[r.best]) }; });
      v.innerHTML = '<p class="v-title">Our position against the best rival on each measure. A full bar is level.</p>' + hingeBars(items, 1.3); } });
    var behind = rows.filter(function (r) { return !r.ahead; }).sort(function (a, b) { return a.ratio - b.ratio; }), ahead = rows.filter(function (r) { return r.ahead; });
    var gaps = []; M.forEach(function (m) { m.r.forEach(function (x, k) { if (x === null) gaps.push(B.rivals[k] + ' has not disclosed ' + lc1(m.n)); }); });
    var memo = memoShell('Where do we lead our rivals? Draft memo', I.co + '. A scripted example: every figure is invented and each source is marked as an example.');
    addH(memo, 'Where we stand');
    addP(memo, 'We lead on ' + ahead.length + ' of ' + M.length + ' measures' + (ahead.length ? ' (' + ahead.map(function (r) { return lc1(r.m.n); }).join(', ') + ')' : '') + ' and trail on ' + behind.length + '.');
    addH(memo, 'Biggest gap');
    addP(memo, behind.length ? behind[0].m.n + ': we are at ' + Math.round(behind[0].ratio * 100) + '% of ' + B.rivals[behind[0].best] + '. This is the first gap to look at.' : 'We are level or ahead on every measure with a published figure.');
    addH(memo, 'Not disclosed');
    addL(memo, gaps.length ? gaps : ['Nothing is missing.']);
    addH(memo, 'Limits');
    addL(memo, ['The figures are invented for this demo. A live engagement reads real sources on an agreed schedule, and a designated analyst reviews every delivered brief.']);
    steps.push(memoStep(memo));
    var summary = {
      rec: behind.length ? 'Look at ' + lc1(behind[0].m.n) + ' first.' : 'Protect the lead on ' + lc1(rows[0].m.n) + '.',
      trade: 'We lead on ' + ahead.length + ' of ' + M.length + ' measures and trail on ' + behind.length + '.',
      unc: gaps.length ? gaps[0] + '.' : 'Every rival has published every figure.',
      next: 'Collect the missing figures, and check the biggest gap against your own data.' };
    return { steps: steps, memo: memo, summary: summary };
  }


  function planWatch(ik) {
    var I = IND[ik], W = I.watch, ev = W.events.map(function (e) { return { date: e[0], text: e[1], status: e[2], kind: e[3], src: e[4], dec: e[5], cls: e[6] }; });
    var ratings = W.decisions.map(function (d, i) { var rows = ev.filter(function (e) { return e.dec === i + 1; }); return rate(rows); });
    function eventRows(n, flagGaps) {
      var h = '<div class="v-events">';
      ev.slice(0, n).forEach(function (e) { h += '<div class="ve' + (flagGaps && e.status === 'Not disclosed' ? ' gap' : '') + '"><span class="ve-d">' + e.date + '</span><span class="ve-t">' + esc(e.text) + '</span><span class="ve-s">' + esc(e.status) + '</span><span class="ve-m">' + pm(e.kind) + esc(e.src) + '</span></div>'; });
      return h + '</div>';
    }
    var steps = [];
    steps.push({ n: 'Read the sources', t: 'Public sources, and your own data where you have it.', d: 3800,
      draw: function (v, p, first) { if (first) v.innerHTML = '<p class="v-title">' + esc(I.co) + ' watches six sources for one standing set of decisions.</p><div class="v-src">' + W.sources.map(function (s) { return '<div>' + pm(s[0]) + esc(s[1]) + '</div>'; }).join('') + '</div><ol class="v-dec">' + W.decisions.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ol>'; } });
    steps.push({ n: 'Log each event with a date and a source', t: 'Every item gets a status: disclosed, stated, opinion, not disclosed or scheduled.', d: 7000,
      draw: function (v, p) { var n = Math.max(1, Math.ceil(p * ev.length)); v.innerHTML = eventRows(n, false); } });
    steps.push({ n: 'Name what is not disclosed', t: 'A gap is logged as a gap, and nothing fills it in.', d: 3600,
      draw: function (v, p) { var g = ev.filter(function (e) { return e.status === 'Not disclosed'; }).length; v.innerHTML = eventRows(ev.length, true) + '<div class="v-count">' + g + ' gap' + (g === 1 ? '' : 's') + ' logged</div>'; } });
    steps.push({ n: 'Tie each event to your decisions', t: 'Rate how strong the evidence is behind each decision, by written rules.', d: 4600,
      draw: function (v, p) {
        var h = '<div class="v-board">';
        W.decisions.forEach(function (d, i) { var r = ratings[i], filled = Math.round(r.n * Math.min(1, p * 1.3)), dots = ''; for (var k = 0; k < 4; k++) dots += '<i class="' + (k < filled ? 'f' : '') + '"></i>'; h += '<div class="vd"><div class="vd-q">' + esc(d) + '</div><div class="vd-r"><span class="meter">' + dots + '</span><b>' + (p > 0.5 ? esc(r.k) : '') + '</b></div></div>'; });
        v.innerHTML = '<p class="v-title">Evidence behind each decision.</p>' + h + '</div>';
      } });
    steps.push({ n: 'Trace the knock-on effects', t: 'Follow the biggest event to its second and third order consequences.', d: 5200,
      draw: function (v, p) {
        var labels = ['First order', 'Second order', 'Third order'], h = '<p class="v-title">If the biggest event plays out, what follows?</p><div class="v-chain">';
        W.chain.forEach(function (c, i) { var show = p > i / 3 + 0.05; h += '<div class="vc' + (show ? ' on' : '') + '"><div class="vc-l">' + labels[i] + '</div><div class="vc-t">' + (show ? esc(c) : '') + '</div></div>'; });
        v.innerHTML = h + '</div><p class="v-note">These are hypotheses to test, not findings.</p>';
      } });
    var memo = memoShell('What changed in the market: draft memo', I.co + '. A scripted example: the events are invented and each source is marked as an example.');
    addH(memo, 'What changed');
    addL(memo, ev.filter(function (e) { return e.status !== 'Not disclosed' && e.status !== 'Scheduled'; }).map(function (e) { return e.date + ' [' + e.src + '] ' + e.text + ' (' + e.status + ')'; }));
    addH(memo, 'Not disclosed');
    addL(memo, ev.filter(function (e) { return e.status === 'Not disclosed'; }).map(function (e) { return e.date + ' [' + e.src + '] ' + e.text; }));
    addH(memo, 'Evidence behind each decision');
    addL(memo, W.decisions.map(function (d, i) { return d + ' Evidence: ' + ratings[i].k + '.'; }));
    addH(memo, 'Knock-on effects to test');
    addL(memo, W.chain.map(function (c, i) { return ['First order: ', 'Second order: ', 'Third order: '][i] + c; }));
    addH(memo, 'Watch next');
    addL(memo, ev.filter(function (e) { return e.status === 'Scheduled'; }).map(function (e) { return e.date + ': ' + e.text + ' (' + e.src + ')'; }));
    addH(memo, 'Limits');
    addL(memo, ['The events are invented for this demo. A live engagement reads real sources on an agreed schedule, and a designated analyst reviews every delivered brief.']);
    steps.push(memoStep(memo));
    var bestI = 0, worstI = 0; ratings.forEach(function (r, i) { if (r.n > ratings[bestI].n) bestI = i; if (r.n < ratings[worstI].n) worstI = i; });
    var gaps = ev.filter(function (e) { return e.status === 'Not disclosed'; }), nxt = ev.filter(function (e) { return e.status === 'Scheduled'; });
    var summary = {
      rec: bestI === worstI ? 'No decision has strong evidence yet, so hold them all.' : 'Act on "' + W.decisions[bestI] + '" now. Hold "' + W.decisions[worstI] + '" until the gap closes.',
      trade: 'Evidence for the first is ' + ratings[bestI].k.toLowerCase() + '. For the second it is ' + ratings[worstI].k.toLowerCase() + ', and ' + gaps.length + ' item' + (gaps.length === 1 ? ' is' : 's are') + ' not disclosed.',
      unc: gaps.length ? gaps[0].text : 'Nothing is flagged as not disclosed.',
      next: nxt.length ? 'Next date to watch: ' + nxt[0].date + '. ' + nxt[0].text : 'Keep watching the same sources.' };
    return { steps: steps, memo: memo, ratings: ratings, events: ev, summary: summary };
  }

  var PLANNERS = { budget: planBudget, watch: planWatch, price: planPrice, rank: planRank, market: planMarket, bench: planBench };

  /* Individual jobs: each plays one step of an end-to-end plan, with a plain statement of what it does. */
  var JOBS = {
    scan: { q: 'What are the sources saying, and when?', label: 'Scan and log sources', small: 'Source scanning', dec: 'watch', step: 1, cat: 'monitor',
      status: 'A scripted example on invented events. Nothing is fetched.',
      does: 'Reads a fixed list of sources and logs each item with a date, a source and a status.', needs: 'A list of public sources, and your own notes if you have them.', makes: 'A dated event log.', human: 'A person picks the sources and approves each flag.' },
    gaps: { q: 'What has nobody disclosed?', label: 'Flag what is not disclosed', small: 'Gaps and exceptions', dec: 'watch', step: 2, cat: 'evidence',
      status: 'A scripted example on invented events.',
      does: 'Marks each place where a source says nothing, so a gap stays visible and is never filled in.', needs: 'The event log, and the questions you care about.', makes: 'A list of gaps, each with a date and a source.', human: 'A person decides which gaps matter and whether to chase them.' },
    rate: { q: 'How strong is the evidence behind each decision?', label: 'Rate the evidence', small: 'Evidence comparison', dec: 'watch', step: 3, cat: 'evidence',
      status: 'A scripted example. The rating rules are written out and fixed.',
      does: 'Ties each event to a decision and rates how strong the evidence is behind it, by written rules.', needs: 'The event log and your list of decisions.', makes: 'An evidence board with one rating for each decision.', human: 'A reviewer can overrule any rating.' },
    scen: { q: 'What could happen to this budget?', label: 'Run scenarios', small: 'Quantitative analysis', dec: 'budget', step: 2, cat: 'model',
      status: 'An illustrative model on invented inputs, computed in your browser. It is not a forecast.',
      does: 'Draws 5,000 possible futures from ranges you set, and works out the best budget split in each.', needs: 'A low, typical and high value for each input.', makes: 'A spread of outcomes instead of one best guess.', human: 'A person supplies and challenges the inputs.' },
    stop: { q: 'At what spend does each route stop paying back?', label: 'Find where returns stop', small: 'Decision modelling', dec: 'budget', step: 3, cat: 'model',
      status: 'An illustrative model on invented inputs. It is not a forecast.',
      does: 'Finds the spend at which each route stops paying back, with a range.', needs: 'The same ranges, for each route.', makes: 'A stopping point for each route.', human: 'A person judges whether the model is fair to the business.' },
    hinge: { q: 'Which assumption does the answer depend on?', label: 'Find what the answer depends on', small: 'Pattern and sensitivity', dec: 'budget', step: 4, cat: 'model',
      status: 'An illustrative model on invented inputs.',
      does: 'Moves each input to its low and high end and shows which one changes the answer most.', needs: 'The same ranges.', makes: 'A ranked list of assumptions to check first.', human: 'A person decides what evidence to collect.' },
    price: { q: 'Which price move comes out best?', label: 'Compare price moves', small: 'Scenario analysis', dec: 'price', step: 3, cat: 'model',
      status: 'An illustrative model on invented inputs. This runs only in the demo.',
      does: 'Works out profit for five price moves across 5,000 scenarios and counts how often each is best.', needs: 'Your price, volume and cost, and a range for how customers respond.', makes: 'The share of scenarios in which each option wins.', human: 'A person judges the response to price, which is the least certain input.' },
    rank: { q: 'Which option should come first?', label: 'Rank options under uncertainty', small: 'Option ranking', dec: 'rank', step: 3, cat: 'model',
      status: 'An illustrative model on invented scores. This runs only in the demo.',
      does: 'Scores each option on several criteria, lets the scores and weights vary, and counts how often each comes first.', needs: 'The options, the criteria and rough weights.', makes: 'How stable the ranking is.', human: 'A person owns the weights, because they express priorities.' },
    memo: { q: 'What should the leadership team read?', label: 'Draft the decision memo', small: 'Synthesis and memo', dec: 'budget', step: 5, cat: 'memo',
      status: 'Built from the model results above. A person reviews it before it goes anywhere.',
      does: 'Turns the findings into one page: a recommendation, the trade-off, the key uncertainty and the next action.', needs: 'The analysis it summarises.', makes: 'A one-page memo, which can be downloaded.', human: 'A person reads, edits and approves it.' }
  };
  function jobFacts(J) {
    var rows = [['Evidence it uses', J.needs], ['What it does', J.does], ['What you get', J.makes], ['Where a person comes in', J.human]];
    return '<div class="v-job"><dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>';
  }

  /* ---------- player ---------- */
  var sel = { ind: 'hotels', indSet: true, dec: 'budget', mode: 'e2e', job: 'scen' }, P = { tok: 0, running: false, skipping: false, last: null };
  function sleep(ms, tok) { return new Promise(function (res, rej) { setTimeout(function () { tok === P.tok ? res() : rej('stop'); }, ms); }); }

  function setCap(i, total, step) {
    $('st-count').textContent = sel.mode === 'jobs' ? 'One job' : 'Step ' + (i + 1) + ' of ' + total;
    $('st-name').textContent = step.n;
    $('st-text').textContent = step.t;
  }
  function setProg(f) { $('st-bar').style.width = Math.round(Math.min(1, f) * 100) + '%'; }
  function ctxLine() { var J = JOBS[sel.job], d = sel.mode === 'jobs' ? J.dec : sel.dec; return (sel.mode === 'jobs' ? J.q : DEC[sel.dec].q) + '  ·  ' + IND[sel.ind].label + '  ·  ' + DEC[d].tag; }

  async function run() {
    if (P.running) return;
    var tok = ++P.tok; P.running = true; P.skipping = false;
    var jobs = sel.mode === 'jobs', J = jobs ? JOBS[sel.job] : null;
    var plan = PLANNERS[J ? J.dec : sel.dec](sel.ind); P.last = jobs ? null : plan;
    var steps = jobs ? [plan.steps[J.step]] : plan.steps;
    lock(true); $('st-ctx').textContent = ctxLine(); $('stage').classList.add('on'); $('stage').classList.remove('done');
    var view = $('st-view'); view.innerHTML = ''; $('st-foot-done').hidden = true; $('st-foot-job').hidden = true; $('st-skip').hidden = false; $('st-go').hidden = true; $('st-prog').hidden = false;
    try {
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i]; setCap(i, steps.length, step);
        var total = P.skipping ? 0 : (REDUCED ? Math.min(step.d, 1500) : step.d) / SPEED, t0 = performance.now();
        step.draw(view, P.skipping ? 1 : 0, true);
        while (!P.skipping) {
          await sleep(Math.min(50, Math.max(1, total)), tok);
          var p = Math.min(1, (performance.now() - t0) / Math.max(1, total));
          step.draw(view, REDUCED ? 1 : p, false); setProg((i + p) / steps.length);
          if (p >= 1) break;
        }
        if (P.skipping) { step.draw(view, 1, false); }
      }
      setProg(1); if (window.__beforeFinish) await window.__beforeFinish(); if (jobs) finishJob(J); else finish(plan);
    } catch (e) { if (e !== 'stop') throw e; }
    finally { if (tok === P.tok) { P.running = false; lock(false); } }
  }
  function resHtml(S) {
    var rows = inputRows(), ev = rows.filter(function (r) { return r[0] !== 'asm'; }), as = rows.filter(function (r) { return r[0] === 'asm'; });
    function li(r) { return '<li>' + pm(r[0]) + '<span>' + esc(r[1]) + '<small>' + esc(r[2]) + '</small></span></li>'; }
    return '<div class="v-res2"><div class="rec2"><div class="lab2">' + pm('ana') + 'Recommendation</div><div class="big">' + esc(S.rec) + '</div><p>' + esc(S.trade) + '</p></div>' +
      '<div class="twoc"><div class="bx"><div class="lab2">' + pm('ana') + 'Key uncertainty</div><p>' + esc(S.unc) + '</p></div><div class="bx"><div class="lab2">' + pm('ana') + 'Next action</div><p>' + esc(S.next) + '</p></div></div>' +
      '<details class="evd" data-do data-mo open><summary>Evidence and assumptions</summary><div class="twoc"><div class="bx"><div class="lab2">Evidence</div><ul>' + ev.map(li).join('') + '</ul></div><div class="bx asm"><div class="lab2">Assumptions</div><ul>' + as.map(li).join('') + '</ul></div></div></details></div>';
  }
  function finish(plan) {
    $('st-view').innerHTML = resHtml(plan.summary) + '<details class="memod" id="memod"><summary>Read the draft memo behind the answer</summary><div class="inner"><div class="v-memo full">' + memoHtml(plan.memo) + '</div></div></details>';
    if (window.__ui) window.__ui.sync(); if ($('mailbox')) $('mailbox').hidden = false;
    $('stage').classList.add('done'); $('st-skip').hidden = true; $('st-prog').hidden = true;
    $('st-count').textContent = 'Done'; $('st-name').textContent = 'The answer, then the memo behind it'; $('st-text').textContent = 'A designated analyst would review this before it went anywhere.';
    $('st-foot-done').hidden = false;
    if ($('st-full')) $('st-full').hidden = true; if ($('st-go')) $('st-go').hidden = true; if ($('run')) { $('run').hidden = false; }
    var v = $('st-view'); if (v.scrollTop) v.scrollTop = 0;
  }
  function finishJob(J) {
    var v = $('st-view'); v.insertAdjacentHTML('beforeend', jobFacts(J));
    $('stage').classList.add('done'); $('st-skip').hidden = true; $('st-prog').hidden = true;
    $('st-count').textContent = 'Done'; $('st-name').textContent = J.label; $('st-text').textContent = '';
    $('st-foot-job').hidden = false; $('st-add').href = 'pricing.html?job=' + J.cat + '#plan';
    $('st-go').textContent = 'Building a set of jobs for a proposal? Include this one in your plan, add others, and see an indicative price on the Pricing page.'; $('st-go').hidden = false;
  }
  function skip() { if (P.running) P.skipping = true; }
  function lock(on) {
    /* the pills stay active: choosing again restarts the run */
  }
  function download() {
    if (!P.last) return;
    var md = memoMd(P.last.memo), url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })), a = document.createElement('a');
    a.href = url; a.download = 'decision-memo-' + sel.ind + '-' + sel.dec + '.md'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 800);
  }
  var planCache = {};
  function flowHtml(q, ins, mids, outs, hint) {
    var li = function (arr) { return arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); };
    return '<div class="v-flow"><p class="vf-q">' + esc(q) + '</p>' +
      '<div class="vf-col"><div class="vf-h">Evidence in</div><ul>' + li(ins) + '</ul></div>' +
      '<div class="vf-col"><div class="vf-h">What the workflow does</div><ol>' + li(mids) + '</ol></div>' +
      '<div class="vf-col out"><div class="vf-h">What comes out</div><ul>' + li(outs) + '</ul></div>' +
      '<p class="vf-hint">' + esc(hint) + '</p></div>';
  }
  function idleHtml() {
    if (sel.mode === 'jobs') { var J = JOBS[sel.job]; return flowHtml(J.q, [J.needs], [J.does], [J.makes], 'Press Run to watch this job. ' + J.human); }
    var pl = null;
    try { var k = sel.ind + '-' + sel.dec; if (!planCache[k]) planCache[k] = PLANNERS[sel.dec](sel.ind); pl = planCache[k]; } catch (e) { pl = null; }
    var D = DEC[sel.dec];
    return flowHtml(D.q, D.inputs, pl ? pl.steps.map(function (st) { return st.n; }) : [], D.outputs, 'Choose a business question and it runs, in about half a minute. ' + 'A designated analyst reviews every delivered brief before it reaches you.');
  }
  function showIdle() { if (!P.running && !$('stage').classList.contains('done')) $('st-view').innerHTML = idleHtml(); }
  function reset() {
    P.tok++; P.running = false; lock(false);
    $('stage').classList.remove('on', 'done'); $('st-view').innerHTML = idleHtml(); if ($('run')) $('run').hidden = true;
    $('st-count').textContent = ''; $('st-name').textContent = ''; $('st-text').textContent = ''; if ($('mailbox')) $('mailbox').hidden = true; setProg(0); $('st-foot-done').hidden = true; $('st-foot-job').hidden = true; $('st-skip').hidden = true; $('st-go').hidden = true;
  }


  /* ---------- inputs panel: the illustrative inputs for the chosen job, and the one adjustable input ---------- */
  function inputRows() {
    var ik = sel.ind, I = IND[ik], d = sel.dec, rows = [['pub', 'Company', I.co + ' (illustrative)']];
    var cfg = I[d];
    if (d === 'budget') { rows.push(['int', 'Budget to place', '₹100 crore']); rows.push(['int', 'Routes', cfg.routes.join(', ')]); rows.push(['asm', 'Ranges for each route', 'Low, typical and high values are assumptions']); }
    else if (d === 'price') { rows.push(['int', 'Current price per ' + cfg.unit, '₹' + cfg.P0.toLocaleString('en-IN')]); rows.push(['int', 'Volume per year', cfg.q0.toLocaleString('en-IN') + ' ' + cfg.unit + 's']); rows.push(['asm', 'Cost, price response and rival reaction', 'Ranges, not facts']); }
    else if (d === 'rank') { rows.push(['int', 'Options', cfg.options.map(function (o) { return o.name; }).join(', ')]); rows.push(['asm', 'Scores for each option', 'Low, typical and high values']); }
    else if (d === 'market') { rows.push(['int', 'Markets', I.market.options.map(function (o) { return o.name; }).join(', ')]); rows.push(['asm', 'Scores for each market', 'Low, typical and high values']); }
    else if (d === 'bench') { rows.push(['int', 'Our figures', I.bench.metrics.map(function (m) { return m.n; }).join(', ')]); rows.push(['pub', 'Rivals', I.bench.rivals.join(', ')]); }
    else if (d === 'watch') { rows.push(['pub', 'Sources', I.watch.sources.map(function (x) { return x[1]; }).join(', ')]); }
    return rows;
  }
  function renderInputs() {
    var html = inputRows().map(function (r) { return '<div class="kv">' + pm(r[0]) + esc(r[1]) + '<small>' + esc(r[2]) + '</small></div>'; }).join('');
    if (sel.dec === 'budget') {
      var cur = IND[sel.ind].budget.plan.join(' / ');
      html += '<div class="field" style="margin-top:12px"><label>Current split across the three routes, %</label><select class="inp in-split">' +
        SPLITS.map(function (a) { var t = a.join(' / '); return '<option value="' + t + '"' + (t === cur ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>';
    }
    Array.prototype.forEach.call(document.querySelectorAll('.in-body'), function (el) { el.innerHTML = html; });
  }

  /* ---------- wiring ---------- */
  function choose(group, val) {
    sel[group] = val; if (group === 'ind') sel.indSet = true;
    if (group === 'mode') { var pk = document.querySelector('.picker'); if (pk) { pk.setAttribute('data-mode', val); } if ($('stage') && !P.running) reset(); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-g="' + group + '"]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === val ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('select[data-gsel="' + group + '"]'), function (el) { el.value = val; });
    if (group === 'ind' || group === 'dec') renderInputs();
    if ($('st-view')) showIdle();
  }
  function restart() { if (P.running) { P.tok++; P.running = false; } $('stage').classList.remove('done'); run(); }
  function init() {
    if (!$('demo')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-g]'), function (b) { b.addEventListener('click', function () {
      var g = b.getAttribute('data-g'); choose(g, b.getAttribute('data-v'));
      if (g === 'ind' || (g === 'dec' && sel.indSet)) restart();
    }); });
    Array.prototype.forEach.call(document.querySelectorAll('select[data-gsel]'), function (el) { el.addEventListener('change', function () {
      var g = el.getAttribute('data-gsel'); choose(g, el.value); if (g === 'dec' && sel.indSet) restart();
    }); });
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t || !t.classList || !t.classList.contains('in-split')) return;
      IND[sel.ind].budget.plan = t.value.split(' / ').map(Number); planCache = {};
      Array.prototype.forEach.call(document.querySelectorAll('.in-split'), function (x) { x.value = t.value; });
      if (sel.indSet && sel.dec === 'budget') restart(); else showIdle();
    });
    if ($('run')) $('run').addEventListener('click', restart);
    $('st-skip').addEventListener('click', skip); $('st-dl').addEventListener('click', download);
    var again = function () { reset(); var d = $('demo'); if (d.scrollIntoView) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    $('st-again').addEventListener('click', again); if ($('st-again2')) $('st-again2').addEventListener('click', again);
    var auto = false;
    try {
      var q = new URLSearchParams(window.location.search), i = q.get('industry'), d = q.get('decision'), j = q.get('job'), md = q.get('mode');
      if (md === 'jobs' || md === 'e2e') choose('mode', md);
      if (i && IND[i]) { choose('ind', i); } if (d && DEC[d]) choose('dec', d); if (j && JOBS[j]) { choose('mode', 'jobs'); choose('job', j); }
      if (q.get('run') === '1') auto = true;
    } catch (e) {}
    reset(); choose('dec', sel.dec); choose('job', sel.job); choose('mode', sel.mode);
    if (sel.indSet) choose('ind', sel.ind); else Array.prototype.forEach.call(document.querySelectorAll('[data-g="ind"]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (auto) setTimeout(run, 300);
  }
  window.__demo = { restart: restart, JOBS: JOBS, run: run, skip: skip, choose: choose, sel: sel, state: P, IND: IND, DEC: DEC, plan: function (ik, dk) { return PLANNERS[dk](ik); },
    engines: { budget: budgetEngine, price: priceEngine, rank: rankEngine, priceProfit: priceProfit, rate: rate }, memoMd: memoMd, PRICE_OPTS: PRICE_OPTS, CRITERIA: CRITERIA };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
