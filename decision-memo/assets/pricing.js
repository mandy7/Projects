/* The plan builder on pricing.html.

   PRICING is the whole commercial model, in one place. It is an INDICATIVE model: the numbers are
   starting assumptions and have not been validated against real delivery cost. Change them here and
   the page, the summary, the tests and the plan sent to Contact all follow.

   - Setup is one flat fee, charged once, however many jobs are chosen.
   - Each job has an internal planning value. Its recurring price is a fixed share of that value and is
     the top of a range. The bottom of the range is lowFactor of the top, because the final figure
     depends on scope, complexity and how often the job runs. This working model is internal and is
     not presented on the site as a pricing methodology.
   - All seven jobs together cost at most 13,800 a year, well inside the 15,000 the plan aims for and
     the 20,000 ceiling.
   - Analyst review and advice are billed separately and are not part of these figures.

   To add a job, add it to CATALOGUE and to PRICING.jobs. */
(function () {
  'use strict';

  var PRICING = {
    currency: '$',
    ceiling: 20000,                // all jobs together must stay below this a year (hard limit)
    setup: 1000,                   // one flat, one-time fee
    share: 0.30,                   // a job's recurring price is this share of its assumed value
    lowFactor: 0.6,                // the bottom of the range is this share of the top
    roundTo: 50,
    jobs: {                        // value: assumed yearly cost of doing the same work by hand
      'watch': { value: 9000 },
      'research': { value: 6000 },
      'docs': { value: 6500 },
      'model': { value: 7500 },
      'verify': { value: 7000 },
      'patterns': { value: 5000 },
      'writeup': { value: 5000 }
    },
    assumptions: [
      'Setup is one flat fee, charged once, however many jobs you choose.',
      'The range reflects scope, complexity and how often the job runs.',
      'Analyst review and advice are billed separately.',
      'All figures are provisional until delivery economics have been validated.'
    ]
  };

  var CATALOGUE = [
    { id: 'watch', name: 'Watch competitors and markets', desc: 'Track changes in the sources, prices and announcements you choose.' },
    { id: 'research', name: 'Research a market or question', desc: 'Set out what is known and what is not.' },
    { id: 'docs', name: 'Analyse your documents', desc: 'Pull themes, figures and exceptions from files you send.' },
    { id: 'model', name: 'Model a decision or scenario', desc: 'Test a budget, a price or a set of options.' },
    { id: 'verify', name: 'Verify claims and promises', desc: 'Check what a company said against what it later reported, and rate the evidence.' },
    { id: 'patterns', name: 'Spot patterns and exceptions', desc: 'Look across your numbers for shifts and outliers.' },
    { id: 'writeup', name: 'Write up and present findings', desc: 'Turn results into a memo, a summary or a short deck.' }
  ];

  var P = PRICING, CUR = P.currency;
  function money(n) { return CUR + Math.round(n).toLocaleString('en-US'); }
  function rn(n) { return Math.round(n / P.roundTo) * P.roundTo; }
  function range(r) { return money(r[0]) + ' to ' + money(r[1]); }
  function jobPrice(id) { var top = Math.round(P.jobs[id].value * P.share); return { top: top, low: rn(top * P.lowFactor) }; }

  /* The estimate is a pure function of the selections, so it can be tested without the page. */
  function estimate(sel) {
    var ids = sel.jobs || [];
    var jobs = ids.map(function (id) {
      var c = CATALOGUE.filter(function (x) { return x.id === id; })[0], pr = jobPrice(id);
      return { id: id, name: c.name, value: P.jobs[id].value, low: pr.low, top: pr.top };
    });
    var any = jobs.length > 0;
    var lo = jobs.reduce(function (a, j) { return a + j.low; }, 0), hi = jobs.reduce(function (a, j) { return a + j.top; }, 0);
    var setup = any ? P.setup : 0;
    return { jobs: jobs, setup: setup, annual: [lo, hi], monthly: [lo / 12, hi / 12], firstYear: [setup + lo, setup + hi], ongoing: [lo, hi], withinCeiling: hi < P.ceiling };
  }

  var FREQ = { request: 'on request', monthly: 'monthly', weekly: 'weekly' };
  function planText(sel) {
    var E = estimate(sel), fq = sel.freq || {};
    if (!E.jobs.length) return '';
    return 'Jobs: ' + E.jobs.map(function (j) { return j.name + (fq[j.id] && FREQ[fq[j.id]] ? ' (' + FREQ[fq[j.id]] + ')' : ''); }).join('; ') + '.\n' +
      'Indicative cost (provisional): one-time setup ' + money(E.setup) + '; recurring ' + range(E.annual) + ' a year; first year ' + range(E.firstYear) + '. Frequency and scope are agreed before any work starts. Analyst review and advice are billed separately.';
  }

  window.__plan = { PRICING: PRICING, CATALOGUE: CATALOGUE, estimate: estimate, planText: planText, money: money, jobPrice: jobPrice };

  var root = document.getElementById('jobs');
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var state = { jobs: [], freq: {} };

  function segHtml(id) {
    var cur = state.freq[id] || 'request';
    return ['request', 'monthly', 'weekly'].map(function (k) {
      return '<button type="button" data-freq="' + k + '" aria-pressed="' + (cur === k ? 'true' : 'false') + '">' + (k === 'request' ? 'On request' : k === 'monthly' ? 'Monthly' : 'Weekly') + '</button>';
    }).join('');
  }
  function renderJobs() {
    var h = '';
    CATALOGUE.forEach(function (j) {
      var on = state.jobs.indexOf(j.id) >= 0, pr = jobPrice(j.id);
      h += '<div class="jb' + (on ? ' on' : '') + '" id="row-' + j.id + '" data-id="' + j.id + '"><div class="cb" aria-hidden="true"></div>' +
        '<div class="tx"><label for="job-' + j.id + '"><b>' + esc(j.name) + '</b></label><span class="ds">' + esc(j.desc) + '</span>' +
        '<div class="fr" id="fr-' + j.id + '"' + (on ? '' : ' hidden') + '><small>How often</small><span class="seg" role="group" aria-label="How often: ' + esc(j.name) + '">' + segHtml(j.id) + '</span></div></div>' +
        '<em>' + money(pr.low) + ' to ' + money(pr.top) + '<small>a year</small></em>' +
        '<input type="checkbox" id="job-' + j.id + '" data-job="' + j.id + '"' + (on ? ' checked' : '') + '></div>';
    });
    root.innerHTML = h;
  }

  function renderSummary() {
    var E = estimate(state), send = $('send'), bar = $('psum-bar'), h = '', all = estimate({ jobs: CATALOGUE.map(function (j) { return j.id; }) });
    h += '<div class="lab a">' + (E.jobs.length ? 'Your plan &middot; ' + E.jobs.length + (E.jobs.length === 1 ? ' job' : ' jobs') : 'Your plan') + '<span class="tagp">Provisional</span></div>';
    if (!E.jobs.length) {
      h += '<div class="big" id="t-ongoing">None yet</div><p class="empty">Tick a job to see an indicative cost.</p>';
      send.setAttribute('aria-disabled', 'true'); bar.hidden = true; document.body.classList.remove('hasbar');
      send.href = 'contact.html#brief';
    } else {
      h += '<div class="big" id="t-ongoing">' + range(E.ongoing) + '</div><div class="note" style="margin-top:4px">recurring workflow fees, a year</div>' +
        '<div class="row"><span>One-time setup<small>Charged once, not per job</small></span><b id="t-setup">' + money(E.setup) + '</b></div>' +
        '<div class="row"><span>First year<small>Setup plus recurring</small></span><b id="t-first">about ' + range(E.firstYear) + '</b></div>' +
        '<div class="row"><span>Ongoing, each year after<small>Recurring fees only</small></span><b id="t-ongoing2">' + range(E.ongoing) + '</b></div>' +
        '<div class="row"><span>Optional analyst involvement<small>Review, interpretation, advice</small></span><b>Billed separately</b></div>' +
        '<div class="cap">All seven jobs together: ' + range(all.annual) + ' a year, excluding optional analyst fees.</div>';
      send.removeAttribute('aria-disabled'); send.href = 'contact.html?plan=' + encodeURIComponent(planText(state).slice(0, 900)) + '#brief';
      bar.hidden = false; document.body.classList.add('hasbar'); $('bar-text').textContent = range(E.ongoing) + ' a year';
    }
    $('sum-body').innerHTML = h;
  }

  function toggle(id, on) {
    var i = state.jobs.indexOf(id);
    if (on && i < 0) state.jobs.push(id); if (!on && i >= 0) state.jobs.splice(i, 1);
    var row = $('row-' + id); row.classList.toggle('on', on); $('job-' + id).checked = on; $('fr-' + id).hidden = !on;
    renderSummary();
  }
  root.addEventListener('change', function (e) { var id = e.target.getAttribute('data-job'); if (id) toggle(id, e.target.checked); });
  root.addEventListener('click', function (e) {
    var row = e.target.closest('.jb'); if (!row) return;
    var id = row.getAttribute('data-id'), fb = e.target.closest('[data-freq]');
    if (fb) {
      state.freq[id] = fb.getAttribute('data-freq');
      Array.prototype.forEach.call(row.querySelectorAll('[data-freq]'), function (b) { b.setAttribute('aria-pressed', b === fb ? 'true' : 'false'); });
      renderSummary(); return;
    }
    if (e.target.closest('.fr') || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('label')) return;
    toggle(id, state.jobs.indexOf(id) < 0);
  });
  $('send').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

  try {
    var qp = new URLSearchParams(window.location.search), pre = (qp.get('jobs') || qp.get('job') || '').split(',');
    pre.forEach(function (id) { if (P.jobs[id] && state.jobs.indexOf(id) < 0) state.jobs.push(id); });
  } catch (e) {}

  renderJobs(); renderSummary();
  window.__plan.state = state;
})();
