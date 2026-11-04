/* The plan builder on pricing.html.

   PRICING is the whole commercial model, in one place. It is an INDICATIVE model: the numbers are
   starting assumptions and have not been validated against real delivery cost. Change them here and
   the page, the summary, the tests and the plan sent with a brief all follow.

   How the model works
   - Setup is one flat fee, charged once, however many jobs are chosen.
   - Each job has an assumed yearly "value": roughly what the same work would cost to do by hand.
     Its recurring price is a fixed share of that value (share, 30%). The recurring price is the top
     of a range, and the bottom is lowFactor of it, because the final figure depends on scope,
     complexity and frequency.
   - The values add up to 60,000, so all twelve jobs together cost at most 18,000 a year, below the
     20,000 ceiling.
   - Analyst work (exception review, interpretation, advice) is priced separately, as ranges, and is
     never counted against the ceiling.

   To add a job: add it to CATALOGUE and to PRICING.jobs. */
(function () {
  'use strict';

  var PRICING = {
    currency: '$',
    ceiling: 20000,                 // yearly recurring workflow cost must stay below this
    setup: 1000,                    // one flat, one-time fee
    share: 0.30,                    // a job's recurring price is this share of its assumed value
    lowFactor: 0.6,                 // the bottom of the range is this share of the top
    roundTo: 50,
    deliveries: 12,                 // analyst fees assume one delivery a month
    jobs: {                         // value: assumed yearly cost of doing the same work by hand
      'source-scan': { value: 4000 },
      'monitor': { value: 7000 },
      'competitor': { value: 7000 },
      'research': { value: 5000 },
      'docs': { value: 6000 },
      'model': { value: 6000 },
      'patterns': { value: 5000 },
      'evidence': { value: 5000 },
      'tracking': { value: 5000 },
      'memo': { value: 3000 },
      'knowledge': { value: 3000 },
      'comms': { value: 4000 }
    },
    analyst: {                      // billed separately, never part of the ceiling
      exceptions: { label: 'Review of exceptions', perDelivery: [100, 150] },
      interpret: { label: 'Interpretation note', perDelivery: [250, 400] },
      advice: { label: 'Advisory support', rate: [150, 200], unit: 'hour' }
    },
    assumptions: [
      'Setup is one flat fee, charged once, however many jobs you choose.',
      'Each job is priced at about 30% of what the same work would cost to do by hand. Those values are my assumptions.',
      'The range reflects scope, complexity and how often the job runs. The top of the range is the most it would cost at the standard scope.',
      'Analyst fees are separate and assume one delivery a month.',
      'These figures have not been checked against real delivery cost, and the proposal after your brief replaces them.'
    ]
  };

  var CATALOGUE = [
    { id: 'source-scan', name: 'Find and gather sources', desc: 'Search chosen public sources, or sort material you send.', tag: 'setup' },
    { id: 'monitor', name: 'Watch sources for changes', desc: 'Log what changed on agreed pages, with a date and source.', tag: 'example', ex: 'Shiftwatch' },
    { id: 'competitor', name: 'Track competitors and products', desc: 'Follow agreed companies for pricing and announcements.', tag: 'example', ex: 'Shiftwatch' },
    { id: 'research', name: 'Research a market or question', desc: 'Set out what is known and what is not.', tag: 'setup' },
    { id: 'docs', name: 'Analyse your documents', desc: 'Pull themes, figures and exceptions from files you supply.', tag: 'setup' },
    { id: 'model', name: 'Model a decision or scenario', desc: 'Test options and show which assumption matters most.', tag: 'example', ex: 'Tipping Point' },
    { id: 'patterns', name: 'Find patterns and exceptions', desc: 'Look across numbers or text for themes, shifts and outliers.', tag: 'setup' },
    { id: 'evidence', name: 'Check claims against evidence', desc: 'Rate how strong the evidence is, by rules you agree.', tag: 'example', ex: 'Condition Watch' },
    { id: 'tracking', name: 'Track plans against outcomes', desc: 'Compare stated targets with what was later reported.', tag: 'example', ex: 'Guidance Tracker' },
    { id: 'memo', name: 'Write up findings', desc: 'Turn evidence into a decision memo, summary or alert.', tag: 'example', ex: 'the Try it yourself page' },
    { id: 'knowledge', name: 'Organise records and documentation', desc: 'Structured logs and summaries you can reuse.', tag: 'setup' },
    { id: 'comms', name: 'Prepare briefings and presentations', desc: 'Shape validated findings for a particular audience.', tag: 'setup' }
  ];

  var P = PRICING, CUR = P.currency;
  function money(n) { return CUR + Math.round(n).toLocaleString('en-US'); }
  function rn(n) { return Math.round(n / P.roundTo) * P.roundTo; }
  function range(r) { return money(r[0]) + ' to ' + money(r[1]); }
  function jobPrice(id) { var top = Math.round(P.jobs[id].value * P.share); return { top: top, low: rn(top * P.lowFactor) }; }

  /* The estimate is a pure function of the selections, so it can be tested without the page. */
  function estimate(sel) {
    var ids = sel.jobs || [], an = sel.analyst || {};
    var jobs = ids.map(function (id) {
      var c = CATALOGUE.filter(function (x) { return x.id === id; })[0], pr = jobPrice(id);
      return { id: id, name: c.name, value: P.jobs[id].value, low: pr.low, top: pr.top };
    });
    var any = jobs.length > 0;
    var lo = jobs.reduce(function (a, j) { return a + j.low; }, 0), hi = jobs.reduce(function (a, j) { return a + j.top; }, 0);
    var setup = any ? P.setup : 0;
    var items = [], aLo = 0, aHi = 0;
    ['exceptions', 'interpret'].forEach(function (k) {
      if (any && an[k]) {
        var r = [P.deliveries * P.analyst[k].perDelivery[0], P.deliveries * P.analyst[k].perDelivery[1]];
        items.push({ id: k, label: P.analyst[k].label, detail: P.deliveries + ' deliveries at ' + range(P.analyst[k].perDelivery), range: r }); aLo += r[0]; aHi += r[1];
      }
    });
    return {
      jobs: jobs, setup: setup, annual: [lo, hi], monthly: [lo / 12, hi / 12],
      firstYear: [setup + lo, setup + hi], ongoing: [lo, hi],
      analyst: { items: items, annual: [aLo, aHi], advice: any && !!an.advice, adviceRate: P.analyst.advice.rate, adviceUnit: P.analyst.advice.unit },
      withAnalyst: { firstYear: [setup + lo + aLo, setup + hi + aHi], ongoing: [lo + aLo, hi + aHi] },
      withinCeiling: hi < P.ceiling
    };
  }

  function planText(sel) {
    var E = estimate(sel);
    if (!E.jobs.length) return '';
    var lines = ['Jobs: ' + E.jobs.map(function (j) { return j.name; }).join('; ') + '.'];
    var an = [];
    ['exceptions', 'interpret', 'advice'].forEach(function (k) { if ((sel.analyst || {})[k]) an.push(P.analyst[k].label.toLowerCase()); });
    lines.push('Analyst involvement: ' + (an.length ? an.join('; ') : 'none') + '.');
    lines.push('Indicative cost (provisional model): one-time setup ' + money(E.setup) + '; recurring ' + range(E.annual) + ' a year; first year ' + range(E.firstYear) + '; ongoing ' + range(E.ongoing) + ' a year' + (E.analyst.annual[1] ? '; analyst fees ' + range(E.analyst.annual) + ' a year, billed separately' : '') + '.');
    return lines.join('\n');
  }

  window.__plan = { PRICING: PRICING, CATALOGUE: CATALOGUE, estimate: estimate, planText: planText, money: money, jobPrice: jobPrice };

  var root = document.getElementById('plan');
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var state = { jobs: [], analyst: {} };

  function renderJobs() {
    var h = '';
    CATALOGUE.forEach(function (j) {
      var on = state.jobs.indexOf(j.id) >= 0;
      h += '<div class="pj"><input type="checkbox" id="job-' + j.id + '" data-job="' + j.id + '"' + (on ? ' checked' : '') + '>' +
        '<label for="job-' + j.id + '"><span class="pj-n"><span>' + esc(j.name) + '</span><em>up to ' + money(jobPrice(j.id).top) + ' a year</em></span><span class="pj-d">' + esc(j.desc) + (j.tag === 'example' ? ' Example: ' + esc(j.ex) + '.' : '') + '</span></label></div>';
    });
    $('jobs').innerHTML = h;
  }

  function renderAnalyst() {
    var A = P.analyst, h = '';
    [['exceptions', range(A.exceptions.perDelivery) + ' a delivery', 'A person looks at gaps and anything unusual before you do.'],
     ['interpret', range(A.interpret.perDelivery) + ' a delivery', 'A short note on what each delivery means.'],
     ['advice', range(A.advice.rate) + ' an ' + A.advice.unit + ', as used', 'Time on the decisions that follow.']].forEach(function (x) {
      h += '<div class="pj"><input type="checkbox" id="h-' + x[0] + '" data-h="' + x[0] + '"' + (state.analyst[x[0]] ? ' checked' : '') + '><label for="h-' + x[0] + '"><span class="pj-n"><span>' + esc(A[x[0]].label) + '</span><em>' + x[1] + '</em></span><span class="pj-d">' + x[2] + '</span></label></div>';
    });
    $('human').innerHTML = h;
  }

  function line(l, v, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + l + '</th><td>' + v + '</td></tr>'; }

  function renderSummary() {
    var E = estimate(state), send = $('send'), bar = $('psum-bar'), h = '';
    if (!E.jobs.length) {
      h = '<p class="ps-empty">Choose a job and the cost appears here.</p>';
      send.setAttribute('aria-disabled', 'true'); send.removeAttribute('href'); bar.hidden = true;
    } else {
      h += '<div class="ps-h2">Recurring, each year</div><div class="ps-big" id="t-ongoing">' + range(E.ongoing) + '</div><div class="ps-sm">about ' + range([Math.round(E.monthly[0]), Math.round(E.monthly[1])]) + ' a month</div>';
      h += '<div class="ps-two" style="margin-top:.9rem"><div><div class="ps-h2">One-time setup</div><div class="ps-big" id="t-setup">' + money(E.setup) + '</div><div class="ps-sm">flat, whatever you choose</div></div>' +
        '<div><div class="ps-h2">First year</div><div class="ps-big" id="t-first" style="font-size:1.1rem">' + range(E.firstYear) + '</div><div class="ps-sm">setup plus recurring</div></div></div>';
      h += '<details class="ps-d"><summary>Line items</summary><table class="lines"><tbody>';
      h += '<tr class="hd"><th>Recurring, each year</th><td></td></tr>';
      E.jobs.forEach(function (j) { h += line(esc(j.name), range([j.low, j.top]), 'sub'); });
      h += line('Recurring total', range(E.annual), 'tot');
      h += '<tr class="hd"><th>One-time</th><td></td></tr>' + line('Setup', money(E.setup));
      h += '</tbody></table></details>';
      if (E.analyst.items.length || E.analyst.advice) {
        h += '<div class="ps-an"><div class="ps-h2">Analyst fees, billed separately</div><table class="lines"><tbody>';
        E.analyst.items.forEach(function (i) { h += line(esc(i.label) + '<small>' + esc(i.detail) + '</small>', range(i.range) + ' a year'); });
        if (E.analyst.advice) h += line('Advisory support', range(E.analyst.adviceRate) + ' an ' + E.analyst.adviceUnit + ', as used');
        h += '</tbody></table>';
        if (E.analyst.annual[1]) h += '<p class="ps-note">With these, the first year is ' + range(E.withAnalyst.firstYear) + ' and ongoing is ' + range(E.withAnalyst.ongoing) + ' a year.</p>';
        h += '</div>';
      }
      h += '<details class="ps-d"><summary>What this assumes</summary><ul class="ps-list">' + P.assumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></details>';
      send.removeAttribute('aria-disabled'); send.href = 'contact.html?plan=' + encodeURIComponent(planText(state).slice(0, 900)) + '#brief';
      bar.hidden = false; $('bar-text').textContent = range(E.ongoing) + ' a year, plus ' + money(E.setup) + ' setup';
    }
    $('sum-body').innerHTML = h;
    $('analyst-box').hidden = !E.jobs.length;
  }

  $('jobs').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-job'); if (!id) return;
    var i = state.jobs.indexOf(id);
    if (e.target.checked && i < 0) state.jobs.push(id); if (!e.target.checked && i >= 0) state.jobs.splice(i, 1);
    renderSummary();
  });
  $('human').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-h'); if (!id) return; state.analyst[id] = e.target.checked; renderSummary();
  });
  $('send').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

  try {
    var qp = new URLSearchParams(window.location.search), pre = (qp.get('jobs') || qp.get('job') || '').split(',');
    pre.forEach(function (id) { if (P.jobs[id] && state.jobs.indexOf(id) < 0) state.jobs.push(id); });
  } catch (e) {}

  renderJobs(); renderAnalyst(); renderSummary();
  window.__plan.state = state;
})();
