/* The plan builder on pricing.html.
   PRICING holds every number it uses, in one place. These are starting assumptions that have NOT been
   validated against delivery cost, maintenance, usage or support time. Change them here and the page,
   the summary and the plan sent with a brief all follow.
   To add a job, add an entry to CATALOGUE and to PRICING.jobs. To add a question, add it to QUESTIONS,
   to PRICING.mult, and list its id in a job's "ask". */
(function () {
  'use strict';

  var PRICING = {
    currency: '$',
    rangeLow: 0.85,           // the indicative range runs from 85% of the estimate
    rangeHigh: 1.3,           // to 130% of it
    roundTo: 50,
    jobs: {                   // setup: one-time. monthly: recurring, at the smallest scope.
      'source-scan': { setup: 1200, monthly: 400 },
      'monitor': { setup: 1500, monthly: 600 },
      'competitor': { setup: 2000, monthly: 700 },
      'research': { setup: 1000, monthly: 500 },
      'docs': { setup: 1800, monthly: 500 },
      'model': { setup: 2500, monthly: 450 },
      'patterns': { setup: 2000, monthly: 600 },
      'evidence': { setup: 1800, monthly: 500 },
      'tracking': { setup: 1800, monthly: 450 },
      'memo': { setup: 800, monthly: 300 },
      'knowledge': { setup: 1000, monthly: 350 },
      'comms': { setup: 900, monthly: 350 }
    },
    mult: {                   // s: multiplies setup. m: multiplies the monthly fee.
      scope: { '1 to 3': { s: 1, m: 1 }, '4 to 10': { s: 1.4, m: 1.5 }, 'More than 10': { s: 2, m: 2.3 }, 'Not sure yet': { s: 1.4, m: 1.5 } },
      docs: { 'Fewer than 20': { s: 1, m: 1 }, '20 to 200': { s: 1.3, m: 1.4 }, 'More than 200': { s: 1.8, m: 2 }, 'Not sure yet': { s: 1.3, m: 1.4 } },
      freq: { 'Once': { s: 1, m: 0, once: true }, 'When a question comes up': { s: 1, m: 0.6 }, 'Monthly': { s: 1, m: 1 }, 'Weekly': { s: 1.1, m: 2.4 }, 'Not sure yet': { s: 1, m: 1 } },
      output: { 'One-page summary': { s: 1, m: 1 }, 'Short report': { s: 1.15, m: 1.3 }, 'Presentation': { s: 1.3, m: 1.5 }, 'Short alert or update': { s: 1, m: 0.9 }, 'Not sure yet': { s: 1.1, m: 1.15 } },
      inputs: { 'We have data': { s: 1, m: 1 }, 'Mostly estimates': { s: 1.2, m: 1 }, 'A mix': { s: 1.1, m: 1 }, 'Not sure yet': { s: 1.1, m: 1 } },
      criteria: { 'Yes, written down': { s: 1, m: 1 }, 'Yes, but informal': { s: 1.25, m: 1 }, 'No, help me define them': { s: 1.5, m: 1 }, 'Not sure yet': { s: 1.25, m: 1 } }
    },
    human: {                  // added to the monthly total
      exceptions: { pct: 0.15, min: 150 },
      interpret: { pct: 0.35, min: 400 },
      advice: { rate: 180, unit: 'hour' }   // billed as used, so it is shown as a rate and not added to the total
    }
  };

  var CATALOGUE = [
    { id: 'source-scan', name: 'Find and gather sources', desc: 'Search chosen public sources, or sort material you send.', tag: 'setup', ask: ['scope', 'freq'] },
    { id: 'monitor', name: 'Watch sources for changes', desc: 'Log what changed on agreed pages, with a date and source.', tag: 'example', ex: 'Shiftwatch', ask: ['scope', 'freq'] },
    { id: 'competitor', name: 'Track competitors and products', desc: 'Follow agreed companies for pricing and announcements.', tag: 'example', ex: 'Shiftwatch', ask: ['scope', 'freq'] },
    { id: 'research', name: 'Research a market or question', desc: 'Set out what is known and what is not.', tag: 'setup', ask: ['scope', 'output'] },
    { id: 'docs', name: 'Analyse your documents', desc: 'Pull themes, figures and exceptions from files you supply.', tag: 'setup', ask: ['docs', 'freq'] },
    { id: 'model', name: 'Model a decision or scenario', desc: 'Test options and show which assumption matters most.', tag: 'example', ex: 'Tipping Point', ask: ['inputs'] },
    { id: 'patterns', name: 'Find patterns and exceptions', desc: 'Look across numbers or text for themes, shifts and outliers.', tag: 'setup', ask: ['docs', 'criteria'] },
    { id: 'evidence', name: 'Check claims against evidence', desc: 'Rate how strong the evidence is, by rules you agree.', tag: 'example', ex: 'Condition Watch', ask: ['scope', 'criteria'] },
    { id: 'tracking', name: 'Track plans against outcomes', desc: 'Compare stated targets with what was later reported.', tag: 'example', ex: 'Guidance Tracker', ask: ['scope', 'docs', 'criteria'] },
    { id: 'memo', name: 'Write up findings', desc: 'Turn evidence into a decision memo, summary or alert.', tag: 'example', ex: 'the home page demo', ask: ['output'] },
    { id: 'knowledge', name: 'Organise records and documentation', desc: 'Structured logs and summaries you can reuse.', tag: 'setup', ask: ['docs', 'output'] },
    { id: 'comms', name: 'Prepare briefings and presentations', desc: 'Shape validated findings for a particular audience.', tag: 'setup', ask: ['output'] }
  ];

  var QUESTIONS = {
    scope: { label: 'How many sources, companies or topics?', short: 'sources or topics', opts: ['1 to 3', '4 to 10', 'More than 10', 'Not sure yet'] },
    docs: { label: 'How many documents or files?', short: 'documents', opts: ['Fewer than 20', '20 to 200', 'More than 200', 'Not sure yet'] },
    freq: { label: 'How often should it run?', short: 'runs', opts: ['Once', 'When a question comes up', 'Monthly', 'Weekly', 'Not sure yet'] },
    output: { label: 'What should the output look like?', short: 'output', opts: ['One-page summary', 'Short report', 'Presentation', 'Short alert or update', 'Not sure yet'] },
    inputs: { label: 'How firm are the numbers behind the decision?', short: 'inputs', opts: ['We have data', 'Mostly estimates', 'A mix', 'Not sure yet'] },
    criteria: { label: 'Do you have rules for rating or judging things?', short: 'rules', opts: ['Yes, written down', 'Yes, but informal', 'No, help me define them', 'Not sure yet'] }
  };

  var HUMAN = [
    { id: 'setup', label: 'Setup and first-run check', desc: 'Included. We agree the job and check the first run together.', fixed: true },
    { id: 'exceptions', label: 'Review of exceptions', desc: 'A person looks at gaps and anything unusual first.' },
    { id: 'interpret', label: 'Regular interpretation', desc: 'A person reads each output and adds a short note.' },
    { id: 'advice', label: 'Advisory support', desc: 'Extra time on decisions that follow, billed as used.' }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var P = PRICING, CUR = P.currency;
  function money(n) { return CUR + Math.round(n).toLocaleString('en-US'); }
  function rnd(n) { return Math.round(n / P.roundTo) * P.roundTo; }

  var root = $('plan');
  if (!root) { window.__plan = null; return; }

  var state = { jobs: {}, answers: {}, human: { setup: true } };

  function selectedJobs() { return CATALOGUE.filter(function (j) { return state.jobs[j.id]; }); }
  function neededQuestions() {
    var order = ['scope', 'docs', 'freq', 'inputs', 'criteria', 'output'], out = [];
    order.forEach(function (q) {
      var who = selectedJobs().filter(function (j) { return j.ask.indexOf(q) >= 0; });
      if (who.length) out.push({ id: q, who: who });
    });
    return out;
  }
  function answerFor(q) { return state.answers[q] || 'Not sure yet'; }

  /* The estimate. Pure function of the selections, so it can be tested. */
  function estimate() {
    var jobs = selectedJobs(), lines = [], setup = 0, monthly = 0, once = false, oneoff = 0;
    jobs.forEach(function (j) {
      var base = P.jobs[j.id], s = base.setup, m = base.monthly, isOnce = false;
      j.ask.forEach(function (q) {
        var x = P.mult[q][answerFor(q)];
        s *= x.s; m *= x.m; if (x.once) { isOnce = true; }
      });
      if (isOnce) { s += base.monthly; m = 0; once = true; }
      lines.push({ id: j.id, name: j.name, setup: rnd(s), monthly: rnd(m) });
      setup += rnd(s); monthly += rnd(m);
    });
    var hu = { exceptions: 0, interpret: 0 };
    ['exceptions', 'interpret'].forEach(function (h) {
      if (state.human[h] && monthly > 0) { hu[h] = rnd(Math.max(P.human[h].min, P.human[h].pct * monthly)); }
    });
    var monthlyAll = monthly + hu.exceptions + hu.interpret;
    return {
      lines: lines, human: hu, setup: setup, monthly: monthly, monthlyAll: monthlyAll,
      setupRange: [rnd(setup * P.rangeLow), rnd(setup * P.rangeHigh)],
      monthlyRange: [rnd(monthlyAll * P.rangeLow), rnd(monthlyAll * P.rangeHigh)],
      oneOffOnly: once && monthlyAll === 0
    };
  }

  function assumptions() {
    var out = [], skipped = false;
    neededQuestions().forEach(function (q) {
      if (state.answers[q.id]) out.push(QUESTIONS[q.id].short + ': ' + state.answers[q.id].toLowerCase());
      else skipped = true;
    });
    return { list: out, skipped: skipped };
  }

  function renderJobs() {
    var h = '';
    CATALOGUE.forEach(function (j) {
      var b = P.jobs[j.id], from = 'from ' + money(b.monthly) + '/mo';
      h += '<div class="pj"><input type="checkbox" id="job-' + j.id + '" data-job="' + j.id + '"' + (state.jobs[j.id] ? ' checked' : '') + '>' +
        '<label for="job-' + j.id + '"><span class="pj-n"><span>' + esc(j.name) + '</span><em>' + esc(from) + '</em></span><span class="pj-d">' + esc(j.desc) + (j.tag === 'example' ? ' Example: ' + esc(j.ex) + '.' : '') + '</span></label></div>';
    });
    $('jobs').innerHTML = h;
  }

  function renderQuestions() {
    var qs = neededQuestions(), box = $('qs'), h = '';
    box.hidden = qs.length === 0;
    qs.forEach(function (q) {
      var Q = QUESTIONS[q.id];
      h += '<div class="pq"><label for="q-' + q.id + '">' + esc(Q.label) + '</label>' +
        '<select id="q-' + q.id + '" data-q="' + q.id + '"><option value="">Choose</option>' +
        Q.opts.map(function (o) { return '<option' + (state.answers[q.id] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' +
        '<span class="pq-for">' + q.who.map(function (j) { return esc(j.name); }).join(', ') + '</span></div>';
    });
    $('qs-body').innerHTML = h;
  }

  function renderHuman() {
    var h = '';
    HUMAN.forEach(function (x) {
      h += '<div class="pj"><input type="checkbox" id="h-' + x.id + '" data-h="' + x.id + '"' + (state.human[x.id] ? ' checked' : '') + (x.fixed ? ' disabled' : '') + '>' +
        '<label for="h-' + x.id + '"><span class="pj-n"><span>' + esc(x.label) + '</span></span><span class="pj-d">' + esc(x.desc) + '</span></label></div>';
    });
    $('human').innerHTML = h;
  }

  function planText() {
    var jobs = selectedJobs();
    if (!jobs.length) return '';
    var E = estimate(), A = assumptions();
    var lines = ['Jobs: ' + jobs.map(function (j) { return j.name; }).join('; ') + '.'];
    if (A.list.length) lines.push('Scope: ' + A.list.join('; ') + '.');
    lines.push('Human involvement: ' + HUMAN.filter(function (x) { return state.human[x.id]; }).map(function (x) { return x.label.toLowerCase(); }).join('; ') + '.');
    var pr = 'Indicative price (unvalidated starting assumptions): setup ' + money(E.setupRange[0]) + ' to ' + money(E.setupRange[1]);
    pr += E.oneOffOnly ? ', no recurring fee.' : ', then ' + money(E.monthlyRange[0]) + ' to ' + money(E.monthlyRange[1]) + ' a month.';
    lines.push(pr);
    return lines.join('\n');
  }

  function renderSummary() {
    var jobs = selectedJobs(), h = '', send = $('send');
    if (!jobs.length) {
      h = '<p class="ps-empty">Choose one or more jobs and the plan and an indicative price appear here.</p>';
      send.setAttribute('aria-disabled', 'true'); send.removeAttribute('href');
    } else {
      var E = estimate(), A = assumptions();
      h += '<table class="lines"><tbody><tr class="hd"><th>Jobs</th><td>Setup</td><td>Monthly</td></tr>';
      E.lines.forEach(function (l) { h += '<tr><th scope="row">' + esc(l.name) + '</th><td>' + money(l.setup) + '</td><td>' + (l.monthly ? money(l.monthly) : 'none') + '</td></tr>'; });
      if (E.human.exceptions) h += '<tr><th scope="row">Review of exceptions</th><td></td><td>' + money(E.human.exceptions) + '</td></tr>';
      if (E.human.interpret) h += '<tr><th scope="row">Regular interpretation</th><td></td><td>' + money(E.human.interpret) + '</td></tr>';
      if (state.human.advice) h += '<tr><th scope="row">Advisory support</th><td></td><td>' + money(P.human.advice.rate) + ' an ' + P.human.advice.unit + '</td></tr>';
      h += '</tbody></table>';
      h += '<div class="ps-h2">Indicative range</div><div class="ps-big">' + money(E.setupRange[0]) + ' to ' + money(E.setupRange[1]) + ' <small>one-time setup</small></div>';
      h += E.oneOffOnly ? '<div class="ps-big"><small>No recurring fee for a single run</small></div>' : '<div class="ps-big">' + money(E.monthlyRange[0]) + ' to ' + money(E.monthlyRange[1]) + ' <small>a month</small></div>';
      h += '<p class="ps-note">' + (A.list.length ? 'Assumes ' + esc(A.list.join(', ')) + '. ' : '') + (A.skipped ? 'Questions you skip are priced at a middle estimate. ' : '') + 'Starting estimate only. The proposal depends on source coverage, how often it runs, data volume and the review you want.</p>';
      send.removeAttribute('aria-disabled'); send.href = 'start-a-brief.html?plan=' + encodeURIComponent(planText().slice(0, 900)) + '#brief';
    }
    $('sum-body').innerHTML = h;
  }

  function renderAll() { renderQuestions(); renderSummary(); }

  $('jobs').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-job'); if (!id) return;
    if (e.target.checked) state.jobs[id] = true; else delete state.jobs[id];
    renderAll();
  });
  $('qs').addEventListener('change', function (e) {
    var q = e.target.getAttribute('data-q'); if (!q) return;
    if (e.target.value) state.answers[q] = e.target.value; else delete state.answers[q];
    renderSummary();
  });
  $('human').addEventListener('change', function (e) {
    var id = e.target.getAttribute('data-h'); if (!id) return;
    if (e.target.checked) state.human[id] = true; else delete state.human[id];
    renderSummary();
  });
  $('send').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

  try {
    var qp = new URLSearchParams(window.location.search), pre = (qp.get('jobs') || qp.get('job') || '').split(',');
    pre.forEach(function (id) { if (CATALOGUE.some(function (j) { return j.id === id; })) state.jobs[id] = true; });
  } catch (e) {}

  renderJobs(); renderHuman(); renderAll();
  window.__plan = { PRICING: PRICING, CATALOGUE: CATALOGUE, QUESTIONS: QUESTIONS, state: state, planText: planText, estimate: estimate };
})();
