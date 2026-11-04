/* The plan builder on pricing.html.

   PRICING is the whole commercial model, in one place. It is an INDICATIVE model: the numbers are
   starting assumptions and have not been validated against real delivery cost. Change them here and
   the page, the summary, the tests and the plan sent with a brief all follow.

   How the model works
   - One shared service base fee per year, charged once the plan has at least one job. It covers hosting,
     the shared source list and reporting structure, and support.
   - Each job adds an annual recurring fee at the standard scope (monthly runs, standard volume).
   - Setup is one-time: a shared onboarding fee, charged once, plus a small configuration fee per job.
     It is never charged monthly. It is charged again only for a new setup or a material
     reconfiguration (see reconfigurePct).
   - Frequency and volume scale the per-job recurring fees. The options marked standard keep a plan
     with EVERY job selected below the ceiling. The options marked standard:false do not, and the page
     says so.
   - Analyst work (exception review, interpretation, advice) is priced separately and is never
     counted against the ceiling.

   To add a job: add it to CATALOGUE and to PRICING.jobs. */
(function () {
  'use strict';

  var PRICING = {
    currency: '$',
    ceiling: 20000,                 // annual recurring workflow cost, all jobs at standard scope, must stay below this
    platform: { annual: 2400 },     // shared service base, per year
    onboarding: { oneTime: 1200 },  // shared setup, charged once
    reconfigurePct: 0.5,            // a material reconfiguration costs this share of the job's setup fee
    jobs: {                         // annual: recurring per year at monthly runs and standard volume. setup: one-time.
      'source-scan': { annual: 900, setup: 300 },
      'monitor': { annual: 1400, setup: 500 },
      'competitor': { annual: 1500, setup: 600 },
      'research': { annual: 1000, setup: 300 },
      'docs': { annual: 1200, setup: 600 },
      'model': { annual: 800, setup: 800 },
      'patterns': { annual: 1100, setup: 600 },
      'evidence': { annual: 1100, setup: 600 },
      'tracking': { annual: 1000, setup: 600 },
      'memo': { annual: 600, setup: 250 },
      'knowledge': { annual: 700, setup: 300 },
      'comms': { annual: 600, setup: 300 }
    },
    cadence: {
      quarterly: { label: 'Quarterly', runs: 4, mult: 0.55, standard: true },
      monthly: { label: 'Monthly', runs: 12, mult: 1, standard: true },
      fortnightly: { label: 'Fortnightly', runs: 26, mult: 1.6, standard: false },
      weekly: { label: 'Weekly', runs: 52, mult: 2.8, standard: false }
    },
    volume: {
      standard: { label: 'Standard', mult: 1, standard: true, desc: 'up to about 10 sources and 50 documents for each job' },
      larger: { label: 'Larger', mult: 1.35, standard: true, desc: 'up to about 30 sources and 200 documents for each job' }
    },
    analyst: {                      // billed separately, per delivery (one delivery for each run), never part of the ceiling
      exceptions: { label: 'Review of exceptions', perDelivery: 120 },
      interpret: { label: 'Interpretation note', perDelivery: 350 },
      advice: { label: 'Advisory support', rate: 180, unit: 'hour' }
    },
    assumptions: [
      'Standard scope is monthly runs and up to about 10 sources and 50 documents for each job.',
      'Recurring prices are assumed to cover compute and source access, upkeep of the rules, and light support. They have not been checked against real delivery cost.',
      'Setup is charged once. A new setup or a material reconfiguration is charged again at half the job\'s setup fee.',
      'Quarterly and larger-volume plans are inside the standard package. Fortnightly and weekly runs are not, and are confirmed in the proposal.',
      'Analyst fees are separate, and are not counted in the recurring workflow cost.'
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
    { id: 'memo', name: 'Write up findings', desc: 'Turn evidence into a decision memo, summary or alert.', tag: 'example', ex: 'the home page demo' },
    { id: 'knowledge', name: 'Organise records and documentation', desc: 'Structured logs and summaries you can reuse.', tag: 'setup' },
    { id: 'comms', name: 'Prepare briefings and presentations', desc: 'Shape validated findings for a particular audience.', tag: 'setup' }
  ];

  var P = PRICING, CUR = P.currency;
  function money(n) { return CUR + Math.round(n).toLocaleString('en-US'); }
  function r10(n) { return Math.round(n / 10) * 10; }

  /* The estimate is a pure function of the selections, so it can be tested without the page. */
  function estimate(sel) {
    var ids = sel.jobs || [], cad = P.cadence[sel.cadence || 'monthly'], vol = P.volume[sel.volume || 'standard'];
    var jobs = ids.map(function (id) {
      var j = P.jobs[id], c = CATALOGUE.filter(function (x) { return x.id === id; })[0];
      return { id: id, name: c.name, annual: r10(j.annual * cad.mult * vol.mult), setup: j.setup };
    });
    var any = jobs.length > 0;
    var platform = any ? P.platform.annual : 0, onboarding = any ? P.onboarding.oneTime : 0;
    var jobsAnnual = jobs.reduce(function (a, j) { return a + j.annual; }, 0);
    var jobsSetup = jobs.reduce(function (a, j) { return a + j.setup; }, 0);
    var annual = platform + jobsAnnual, setup = onboarding + jobsSetup;
    var runs = cad.runs, an = sel.analyst || {}, items = [];
    if (any && an.exceptions) items.push({ id: 'exceptions', label: P.analyst.exceptions.label, detail: runs + ' deliveries at ' + money(P.analyst.exceptions.perDelivery), annual: runs * P.analyst.exceptions.perDelivery });
    if (any && an.interpret) items.push({ id: 'interpret', label: P.analyst.interpret.label, detail: runs + ' deliveries at ' + money(P.analyst.interpret.perDelivery), annual: runs * P.analyst.interpret.perDelivery });
    var analystAnnual = items.reduce(function (a, i) { return a + i.annual; }, 0);
    var standard = cad.standard && vol.standard;
    return {
      jobs: jobs, platform: platform, onboarding: onboarding, jobsAnnual: jobsAnnual, jobsSetup: jobsSetup,
      setup: setup, annual: annual, monthlyEquiv: annual / 12, firstYear: setup + annual, ongoing: annual,
      analyst: { items: items, annual: analystAnnual, advice: any && !!an.advice, adviceRate: P.analyst.advice.rate },
      withAnalyst: { firstYear: setup + annual + analystAnnual, ongoing: annual + analystAnnual },
      standard: standard, withinCeiling: annual < P.ceiling, runs: runs
    };
  }

  function planText(sel) {
    var E = estimate(sel);
    if (!E.jobs.length) return '';
    var lines = ['Jobs: ' + E.jobs.map(function (j) { return j.name; }).join('; ') + '.'];
    lines.push('Runs: ' + P.cadence[sel.cadence || 'monthly'].label.toLowerCase() + '. Volume: ' + P.volume[sel.volume || 'standard'].label.toLowerCase() + '.');
    var an = [];
    ['exceptions', 'interpret', 'advice'].forEach(function (k) { if ((sel.analyst || {})[k]) an.push(P.analyst[k].label.toLowerCase()); });
    lines.push('Analyst involvement: ' + (an.length ? an.join('; ') : 'none') + '.');
    lines.push('Indicative cost (provisional model): one-time setup ' + money(E.setup) + '; recurring ' + money(E.annual) + ' a year; first year ' + money(E.firstYear) + '; ongoing ' + money(E.ongoing) + ' a year' + (E.analyst.annual ? '; analyst fees ' + money(E.analyst.annual) + ' a year, billed separately' : '') + '.');
    return lines.join('\n');
  }

  window.__plan = { PRICING: PRICING, CATALOGUE: CATALOGUE, estimate: estimate, planText: planText, money: money };

  var root = document.getElementById('plan');
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var state = { jobs: [], cadence: 'monthly', volume: 'standard', analyst: {} };

  function renderJobs() {
    var h = '';
    CATALOGUE.forEach(function (j) {
      var on = state.jobs.indexOf(j.id) >= 0;
      h += '<div class="pj"><input type="checkbox" id="job-' + j.id + '" data-job="' + j.id + '"' + (on ? ' checked' : '') + '>' +
        '<label for="job-' + j.id + '"><span class="pj-n"><span>' + esc(j.name) + '</span><em>' + money(P.jobs[j.id].annual) + ' a year</em></span><span class="pj-d">' + esc(j.desc) + (j.tag === 'example' ? ' Example: ' + esc(j.ex) + '.' : '') + '</span></label></div>';
    });
    $('jobs').innerHTML = h;
  }

  function renderOptions() {
    var h = '<legend>Scope</legend><div class="opt-row"><div class="pl" id="pl-cad">How often it runs</div><div class="chips" role="radiogroup" aria-labelledby="pl-cad">';
    Object.keys(P.cadence).forEach(function (k) {
      h += '<button type="button" role="radio" data-cad="' + k + '" aria-checked="' + (state.cadence === k) + '">' + esc(P.cadence[k].label) + '</button>';
    });
    h += '</div></div><div class="opt-row"><div class="pl" id="pl-vol">How much material</div><div class="chips" role="radiogroup" aria-labelledby="pl-vol">';
    Object.keys(P.volume).forEach(function (k) {
      h += '<button type="button" role="radio" data-vol="' + k + '" aria-checked="' + (state.volume === k) + '">' + esc(P.volume[k].label) + '</button>';
    });
    h += '</div><p class="hint" id="vol-desc"></p></div>';
    $('opts').innerHTML = h;
  }

  function renderAnalyst() {
    var A = P.analyst, h = '';
    [['exceptions', money(A.exceptions.perDelivery) + ' a delivery'], ['interpret', money(A.interpret.perDelivery) + ' a delivery'], ['advice', money(A.advice.rate) + ' an ' + A.advice.unit + ', as used']].forEach(function (x) {
      var d = { exceptions: 'A person looks at gaps and anything unusual before you do.', interpret: 'A short note on what each delivery means.', advice: 'Time on the decisions that follow.' }[x[0]];
      h += '<div class="pj"><input type="checkbox" id="h-' + x[0] + '" data-h="' + x[0] + '"' + (state.analyst[x[0]] ? ' checked' : '') + '><label for="h-' + x[0] + '"><span class="pj-n"><span>' + esc(A[x[0]].label) + '</span><em>' + x[1] + '</em></span><span class="pj-d">' + d + '</span></label></div>';
    });
    $('human').innerHTML = h;
  }

  function line(l, v, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + l + '</th><td>' + v + '</td></tr>'; }

  function renderSummary() {
    var E = estimate(state), send = $('send'), bar = $('psum-bar'), h = '';
    $('vol-desc') && ($('vol-desc').textContent = 'Standard is ' + P.volume.standard.desc + '. Larger is ' + P.volume.larger.desc + '.');
    if (!E.jobs.length) {
      h = '<p class="ps-empty">Choose a job and the cost appears here.</p>';
      send.setAttribute('aria-disabled', 'true'); send.removeAttribute('href'); bar.hidden = true;
    } else {
      h += '<div class="ps-two"><div><div class="ps-h2">Ongoing, each year</div><div class="ps-big" id="t-ongoing">' + money(E.ongoing) + '</div><div class="ps-sm">about ' + money(E.monthlyEquiv) + ' a month</div></div>' +
        '<div><div class="ps-h2">First year, with setup</div><div class="ps-big" id="t-first">' + money(E.firstYear) + '</div><div class="ps-sm">includes ' + money(E.setup) + ' one-time</div></div></div>';
      if (!E.standard) h += '<p class="ps-warn">This frequency is outside the standard package, so the proposal will confirm the figure.</p>';
      h += '<details class="ps-d"><summary>Line items</summary><table class="lines"><tbody>';
      h += '<tr class="hd"><th>Recurring, each year</th><td></td></tr>' + line('Service base', money(E.platform));
      E.jobs.forEach(function (j) { h += line(esc(j.name), money(j.annual), 'sub'); });
      h += line('Recurring total', money(E.annual), 'tot');
      h += '<tr class="hd"><th>One-time setup, charged once</th><td></td></tr>' + line('Shared onboarding', money(E.onboarding));
      E.jobs.forEach(function (j) { h += line(esc(j.name), money(j.setup), 'sub'); });
      h += line('Setup total', money(E.setup), 'tot');
      h += '</tbody></table><p class="ps-note">Setup is charged once. A new setup or a material reconfiguration is charged again at ' + Math.round(P.reconfigurePct * 100) + '% of the job&rsquo;s setup fee.</p></details>';
      if (E.analyst.items.length || E.analyst.advice) {
        h += '<div class="ps-an"><div class="ps-h2">Analyst fees, billed separately</div><table class="lines"><tbody>';
        E.analyst.items.forEach(function (i) { h += line(esc(i.label) + '<small>' + esc(i.detail) + '</small>', money(i.annual) + ' a year'); });
        if (E.analyst.advice) h += line('Advisory support', money(E.analyst.adviceRate) + ' an hour, as used');
        h += '</tbody></table>';
        if (E.analyst.annual) h += '<p class="ps-note">With these, the first year is ' + money(E.withAnalyst.firstYear) + ' and ongoing is ' + money(E.withAnalyst.ongoing) + ' a year.</p>';
        h += '</div>';
      }
      h += '<details class="ps-d"><summary>What this assumes</summary><ul class="ps-list">' + P.assumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul><p class="ps-note">Indicative model. The proposal after your brief replaces it.</p></details>';
      send.removeAttribute('aria-disabled'); send.href = 'start-a-brief.html?plan=' + encodeURIComponent(planText(state).slice(0, 900)) + '#brief';
      bar.hidden = false; $('bar-text').textContent = money(E.ongoing) + ' a year ongoing, ' + money(E.firstYear) + ' in the first year';
    }
    $('sum-body').innerHTML = h;
    var chips = document.querySelectorAll('[data-cad]'), i;
    for (i = 0; i < chips.length; i++) chips[i].setAttribute('aria-checked', String(chips[i].getAttribute('data-cad') === state.cadence));
    chips = document.querySelectorAll('[data-vol]');
    for (i = 0; i < chips.length; i++) chips[i].setAttribute('aria-checked', String(chips[i].getAttribute('data-vol') === state.volume));
    $('opts').hidden = !E.jobs.length; $('analyst-box').hidden = !E.jobs.length;
  }

  $('jobs').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-job'); if (!id) return;
    var i = state.jobs.indexOf(id);
    if (e.target.checked && i < 0) state.jobs.push(id); if (!e.target.checked && i >= 0) state.jobs.splice(i, 1);
    renderSummary();
  });
  $('opts').addEventListener('click', function (e) {
    var c = e.target.getAttribute('data-cad'), v = e.target.getAttribute('data-vol');
    if (c) state.cadence = c; if (v) state.volume = v; if (c || v) renderSummary();
  });
  $('human').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-h'); if (!id) return; state.analyst[id] = e.target.checked; renderSummary();
  });
  $('send').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

  try {
    var qp = new URLSearchParams(window.location.search), pre = (qp.get('jobs') || qp.get('job') || '').split(',');
    pre.forEach(function (id) { if (P.jobs[id] && state.jobs.indexOf(id) < 0) state.jobs.push(id); });
    var c = qp.get('runs'); if (c && P.cadence[c]) state.cadence = c;
  } catch (e) {}

  renderJobs(); renderOptions(); renderAnalyst(); renderSummary();
  window.__plan.state = state;
})();
