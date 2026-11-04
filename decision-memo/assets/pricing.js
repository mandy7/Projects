/* The plan builder on pricing.html. It publishes no prices. It collects a scope that goes into the brief.
   To add a job, add an entry to CATALOGUE. To add a question, add it to QUESTIONS and list its id in a job's "ask". */
(function () {
  'use strict';

  /* tag: where the job stands today. "example" has a working example on the Examples page.
     "setup" is configured for each customer and has no public example yet. */
  var CATALOGUE = [
    { id: 'source-scan', name: 'Find and gather sources', desc: 'Search selected public sources, or sort material you send, for what bears on a question.', tag: 'setup', ask: ['scope', 'freq'] },
    { id: 'monitor', name: 'Watch sources for changes', desc: 'Check agreed pages and public sources and log what changed, with a date and a source.', tag: 'example', ex: 'Shiftwatch', ask: ['scope', 'freq'] },
    { id: 'competitor', name: 'Track competitors and products', desc: 'Follow agreed companies for pricing, positioning and announcements.', tag: 'example', ex: 'Shiftwatch', ask: ['scope', 'freq'] },
    { id: 'research', name: 'Research a market or question', desc: 'Investigate a market, company, trend or question and set out what is known and what is not.', tag: 'setup', ask: ['scope', 'output'] },
    { id: 'docs', name: 'Analyse your documents', desc: 'Pull themes, figures and exceptions out of documents and files you supply.', tag: 'setup', ask: ['docs', 'freq'] },
    { id: 'model', name: 'Model a decision or scenario', desc: 'Test options against ranges of assumptions and show which assumption the answer depends on.', tag: 'example', ex: 'Tipping Point', ask: ['inputs'] },
    { id: 'patterns', name: 'Find patterns, changes and exceptions', desc: 'Look across numbers or text for recurring themes, shifts and outliers.', tag: 'setup', ask: ['docs', 'criteria'] },
    { id: 'evidence', name: 'Check claims against evidence', desc: 'Rate how strong the evidence is for a claim or question, by rules you agree.', tag: 'example', ex: 'Condition Watch', ask: ['scope', 'criteria'] },
    { id: 'tracking', name: 'Track plans against outcomes', desc: 'Compare stated targets or commitments with what was later reported.', tag: 'example', ex: 'Guidance Tracker', ask: ['scope', 'docs', 'criteria'] },
    { id: 'memo', name: 'Write up findings', desc: 'Turn evidence and analysis into a decision memo, summary or alert.', tag: 'example', ex: 'the home page demo', ask: ['output'] },
    { id: 'knowledge', name: 'Organise records and documentation', desc: 'Produce structured logs, summaries and reusable documentation from what was gathered.', tag: 'setup', ask: ['docs', 'output'] },
    { id: 'comms', name: 'Prepare briefings and presentations', desc: 'Shape validated findings into a short narrative or deck for a particular audience.', tag: 'setup', ask: ['output'] }
  ];

  var QUESTIONS = {
    scope: { label: 'How many sources, companies or topics are involved?', short: 'Sources or topics', opts: ['1 to 3', '4 to 10', 'More than 10', 'Not sure yet'] },
    docs: { label: 'Roughly how many documents or files are involved?', short: 'Documents', opts: ['Fewer than 20', '20 to 200', 'More than 200', 'Not sure yet'] },
    freq: { label: 'How often would you want it run?', short: 'How often', opts: ['Once', 'When a question comes up', 'Monthly', 'Weekly', 'Not sure yet'] },
    output: { label: 'What should the output look like?', short: 'Output', opts: ['One-page summary', 'Short report', 'Presentation', 'Short alert or update', 'Not sure yet'] },
    inputs: { label: 'How firm are the numbers behind the decision?', short: 'Inputs', opts: ['We have data', 'Mostly estimates', 'A mix', 'Not sure yet'] },
    criteria: { label: 'Do you already have rules for rating or judging things?', short: 'Rules', opts: ['Yes, written down', 'Yes, but informal', 'No, help me define them', 'Not sure yet'] }
  };

  var HUMAN = [
    { id: 'setup', label: 'Setup and first-run check', desc: 'I agree the job with you and check the first run against what you expected.', fixed: true },
    { id: 'exceptions', label: 'Review of exceptions', desc: 'A person looks at gaps, conflicts and anything unusual before it reaches you.' },
    { id: 'interpret', label: 'Regular interpretation', desc: 'A person reads each output and adds a short note on what it means.' },
    { id: 'advice', label: 'Advisory support', desc: 'Extra time on decisions that follow from the findings.' }
  ];

  var COST_FACTORS = ['Number and type of sources, companies or topics', 'How often it runs, and how much each run covers', 'Volume and variety of your documents', 'Your own rules and checks', 'How complex the output is', 'How much review and interpretation you want'];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var root = $('plan');
  if (!root) return;

  var state = { jobs: {}, answers: {}, human: { setup: true }, notes: '' };

  function selectedJobs() { return CATALOGUE.filter(function (j) { return state.jobs[j.id]; }); }
  function neededQuestions() {
    var order = ['scope', 'docs', 'freq', 'inputs', 'criteria', 'output'], out = [];
    order.forEach(function (q) {
      var who = selectedJobs().filter(function (j) { return j.ask.indexOf(q) >= 0; });
      if (who.length) out.push({ id: q, who: who });
    });
    return out;
  }

  function renderJobs() {
    var h = '';
    CATALOGUE.forEach(function (j) {
      var tag = j.tag === 'example' ? 'Example: ' + j.ex : 'Set up for each customer';
      h += '<div class="pj"><input type="checkbox" id="job-' + j.id + '" data-job="' + j.id + '"' + (state.jobs[j.id] ? ' checked' : '') + '>' +
        '<label for="job-' + j.id + '"><span class="pj-n">' + esc(j.name) + '</span><span class="pj-d">' + esc(j.desc) + '</span><span class="pj-t">' + esc(tag) + '</span></label></div>';
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
        '<span class="pq-for">For: ' + q.who.map(function (j) { return esc(j.name); }).join(', ') + '</span></div>';
    });
    $('qs-body').innerHTML = h;
  }

  function renderHuman() {
    var h = '';
    HUMAN.forEach(function (x) {
      h += '<div class="pj slim"><input type="checkbox" id="h-' + x.id + '" data-h="' + x.id + '"' + (state.human[x.id] ? ' checked' : '') + (x.fixed ? ' disabled' : '') + '>' +
        '<label for="h-' + x.id + '"><span class="pj-n">' + esc(x.label) + (x.fixed ? ' (included)' : '') + '</span><span class="pj-d">' + esc(x.desc) + '</span></label></div>';
    });
    $('human').innerHTML = h;
  }

  function planText() {
    var jobs = selectedJobs();
    if (!jobs.length) return '';
    var lines = ['Jobs: ' + jobs.map(function (j) { return j.name; }).join('; ') + '.'];
    var sc = neededQuestions().filter(function (q) { return state.answers[q.id]; }).map(function (q) { return QUESTIONS[q.id].short + ': ' + state.answers[q.id]; });
    if (sc.length) lines.push('Scope: ' + sc.join('; ') + '.');
    var hu = HUMAN.filter(function (x) { return state.human[x.id]; }).map(function (x) { return x.label.toLowerCase(); });
    lines.push('Human involvement: ' + hu.join('; ') + '.');
    return lines.join('\n');
  }

  function renderSummary() {
    var jobs = selectedJobs(), h = '';
    if (!jobs.length) {
      h = '<p class="ps-empty">Choose one or more jobs and your plan will appear here.</p>';
      $('send').setAttribute('aria-disabled', 'true'); $('send').removeAttribute('href');
    } else {
      h += '<div class="ps-h">Jobs</div><ul>' + jobs.map(function (j) { return '<li>' + esc(j.name) + '</li>'; }).join('') + '</ul>';
      var qs = neededQuestions();
      var done = qs.filter(function (q) { return state.answers[q.id]; });
      if (done.length) h += '<div class="ps-h">Scope</div><ul>' + done.map(function (q) { return '<li>' + esc(QUESTIONS[q.id].short) + ': ' + esc(state.answers[q.id]) + '</li>'; }).join('') + '</ul>';
      else if (qs.length) h += '<div class="ps-h">Scope</div><p class="ps-note">Not answered yet. You can send the plan without it.</p>';
      h += '<div class="ps-h">Human involvement</div><ul>' + HUMAN.filter(function (x) { return state.human[x.id]; }).map(function (x) { return '<li>' + esc(x.label) + '</li>'; }).join('') + '</ul>';
      var txt = planText();
      $('send').removeAttribute('aria-disabled'); $('send').href = 'start-a-brief.html?plan=' + encodeURIComponent(txt.slice(0, 900)) + '#brief';
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

  $('cost-factors').innerHTML = COST_FACTORS.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
  renderJobs(); renderHuman(); renderAll();
  window.__plan = { CATALOGUE: CATALOGUE, QUESTIONS: QUESTIONS, state: state, planText: planText };
})();
