/* The scenario engines behind the price and budget questions. Real calculations, run in the browser: 5,000 draws from the ranges you set, with a fixed random seed so a run repeats exactly. */
window.MODELS = (function () {
  'use strict';
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

  /* ---------- engine: respond to a rival's price move ---------- */
  var RESP_LABEL = ['Hold the price', 'Match for everyone', 'Offer at-risk customers a lower price', 'Add value for at-risk customers'];
  var OVL = { L: 0.25, M: 0.5, H: 0.85 }, SNS = { L: 0.5, M: 1, H: 1.6 };
  function respondPress(cfg) {
    var gn = Math.max(0, (cfg.P - cfg.R) / cfg.P * 100), gb = Math.max(0, (cfg.P - cfg.R0) / cfg.P * 100);
    return { now: gn, before: gb, press: Math.max(0, gn - gb) };
  }
  /* x: one draw of the uncertain numbers. Returns the change in profit over the next 12 months against a world where the rival had not moved. */
  function respondEval(cfg, x) {
    var pr = respondPress(cfg).press, m = cfg.P - x.c, V = cfg.V, i, lossHold = 0, flagged = 0, lossT = 0, lossV = 0;
    for (i = 0; i < cfg.segs.length; i++) {
      var s = cfg.segs[i], vs = V * s.share, ar = Math.min(0.6, x.leak * pr * SNS[s.sens] * OVL[s.ov] / 100), fl = Math.min(1, ar * x.om);
      lossHold += vs * ar; flagged += vs * fl; lossT += vs * ar * (1 - x.rho); lossV += vs * ar * (1 - x.rhov);
    }
    var disc = Math.max(0, cfg.P - cfg.R);
    return [-lossHold * m, -V * disc, -flagged * disc - lossT * m, -flagged * x.pk * cfg.P - lossV * m];
  }
  var RESP_PARAMS = [['leak', 'how strongly customers react to a price gap'], ['rho', 'how many at-risk customers a lower-price offer keeps'], ['rhov', 'how many at-risk customers extra value keeps'], ['om', 'how many extra customers would take the offer'], ['pk', 'what the extra value costs'], ['c', 'your unit cost']];
  function respondEngine(cfg) {
    var N = 5000, rng = mulberry32(11), R = cfg.rng, i, k, prof = [0, 1, 2, 3].map(function () { return new Float32Array(N); });
    for (i = 0; i < N; i++) {
      var x = {}; RESP_PARAMS.forEach(function (p) { x[p[0]] = tri(rng(), R[p[0]][0], R[p[0]][1], R[p[0]][2]); });
      var o = respondEval(cfg, x); for (k = 0; k < 4; k++) prof[k][i] = o[k];
    }
    var mode = {}; RESP_PARAMS.forEach(function (p) { mode[p[0]] = R[p[0]][1]; });
    var base = respondEval(cfg, mode), rows = [], d;
    for (k = 0; k < 4; k++) {
      d = new Float32Array(N); var up = 0; for (i = 0; i < N; i++) { d[i] = prof[k][i] - prof[0][i]; if (d[i] > 0) up++; }
      rows.push({ k: k, abs: { mean: mean(prof[k]), p10: quant(prof[k], .1), p90: quant(prof[k], .9) }, mean: mean(d), p10: quant(d, .1), p90: quant(d, .9), beat: up / N });
    }
    var press = respondPress(cfg), m = cfg.P - mode.c, expo = cfg.segs.map(function (s) {
      var vs = cfg.V * s.share, ar = Math.min(0.6, mode.leak * press.press * SNS[s.sens] * OVL[s.ov] / 100); return { share: s.share, atRisk: ar, vol: vs * ar, atRiskProfit: vs * ar * m };
    });
    var mx = Math.max.apply(null, expo.map(function (e) { return e.atRiskProfit; })) || 1;
    expo.forEach(function (e) { var r = e.atRiskProfit / mx; e.level = r >= 0.6 ? 'high' : r >= 0.25 ? 'medium' : 'low'; });
    function bestOf(o) { var b = 0; for (var q = 1; q < 4; q++) if (o[q] > o[b]) b = q; return b; }
    var b0 = bestOf(base), hinge = RESP_PARAMS.map(function (p) {
      var flips = []; [0, 2].forEach(function (end) { var v2 = {}; for (var kk in mode) v2[kk] = mode[kk]; v2[p[0]] = R[p[0]][end]; var bb = bestOf(respondEval(cfg, v2)); if (bb !== b0) flips.push({ end: end === 0 ? 'low' : 'high', to: bb }); });
      return { k: p[0], label: p[1], flips: flips };
    }).sort(function (a, b) { return b.flips.length - a.flips.length; });
    var be = null, bm = null;
    for (var lk = 0.01; lk <= 6; lk += 0.01) {
      var v3 = {}; for (var k3 in mode) v3[k3] = mode[k3]; v3.leak = lk; var oo = respondEval(cfg, v3);
      if (be === null && Math.max(oo[2], oo[3]) > oo[0]) be = lk;
      if (bm === null && oo[1] > oo[0]) bm = lk;
      if (be !== null && bm !== null) break;
    }
    return { N: N, prof: prof, rows: rows, press: press, base: base, expo: expo, hinge: hinge, breakEven: be, matchBreakEven: bm, hold: rows[0].abs };
  }


  return { mulberry32: mulberry32, tri: tri, quant: quant, mean: mean, SPLITS: SPLITS, budgetEngine: budgetEngine, PRICE_OPTS: PRICE_OPTS, PRICE_LABEL: PRICE_LABEL, priceProfit: priceProfit, priceEngine: priceEngine, RESP_LABEL: RESP_LABEL, OVL: OVL, SNS: SNS, respondPress: respondPress, respondEngine: respondEngine };
})();
