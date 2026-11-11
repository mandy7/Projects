/* The enquiry form on the Book a diagnostic page. It sends nothing unless config.js connects it, and it says so when it is not connected. */
(function () {
  'use strict';
  var cfg = window.SITE || {};
  var form = document.getElementById('ask');
  if (!form) return;
  var msg = document.getElementById('form-msg'), btn = document.getElementById('send');
  var NAMES = { monitor: 'Essential', insight: 'Standard', embedded: 'Embedded' };

  var src = '', prog = '';
  try {
    var q = new URLSearchParams(window.location.search);
    src = (q.get('source') || q.get('utm_source') || q.get('ref') || '').replace(/[^\w.\-]/g, '').slice(0, 40);
    prog = (q.get('programme') || '').toLowerCase();
  } catch (e) {}
  document.getElementById('f-source').value = src;
  var progName = NAMES[prog] || '';
  var planBox = document.getElementById('plan-box');
  if (progName && planBox) {
    document.getElementById('plan-text').textContent = 'You are asking about the ' + progName + ' programme. This goes with your message.';
    planBox.hidden = false;
    document.getElementById('plan-drop').addEventListener('click', function () { progName = ''; planBox.hidden = true; });
  }

  function say(text, kind) { msg.textContent = text; msg.className = kind || ''; }
  function done() {
    form.reset(); progName = ''; if (planBox) planBox.hidden = true;
    say('Thank you. We read every message ourselves and will reply within one working day to the address you gave.', 'ok');
    btn.disabled = false;
  }
  function failed() { say('The message did not go through. Please check your connection and try again.', 'err'); btn.disabled = false; }

  var google = cfg.googleForm && cfg.googleForm.action && cfg.googleForm.entries &&
    cfg.googleForm.entries.pain && cfg.googleForm.entries.industry && cfg.googleForm.entries.contact;

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (form._gotcha && form._gotcha.value) { return; }
    var name = form.name.value.trim(), contact = form.contact.value.trim(), company = form.industry.value.trim(), question = form.pain.value.trim();
    var topics = Array.prototype.map.call(form.querySelectorAll('input[name=topic]:checked'), function (c) { return c.value; });
    if (name.length < 2) { say('Please give your name.', 'err'); form.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) { say('Please give an email address we can reply to.', 'err'); form.contact.focus(); return; }
    if (!topics.length && question.length < 10) { say('Please choose at least one topic, or describe the question in a sentence.', 'err'); return; }

    var text = 'Name: ' + name + '\n';
    if (progName) text += 'Programme asked about: ' + progName + '\n';
    if (topics.length) text += 'Topics: ' + topics.join(', ') + '\n';
    if (question) text += 'Question: ' + question + '\n';
    text = text.trim();

    if (google) {
      var e = cfg.googleForm.entries, body = new URLSearchParams();
      body.append(e.pain, text); body.append(e.industry, company); body.append(e.contact, contact);
      if (e.source) body.append(e.source, src);
      btn.disabled = true; say('Sending.', '');
      fetch(cfg.googleForm.action, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).then(done).catch(failed);
      return;
    }
    if (!cfg.formEndpoint) {
      if (cfg.contactEmail) {
        window.location.href = 'mailto:' + cfg.contactEmail + '?subject=' + encodeURIComponent('Diagnostic request') + '&body=' + encodeURIComponent(text + '\nCompany: ' + company + '\nEmail: ' + contact);
        say('Your email program should open with the request filled in. Press send there to deliver it.', 'ok');
        return;
      }
      say('This form is not connected yet, so nothing was sent.', 'err');
      return;
    }
    btn.disabled = true; say('Sending.', '');
    var fd = new FormData(); fd.set('name', name); fd.set('email', contact); fd.set('company', company); fd.set('message', text); fd.set('source', src);
    fetch(cfg.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd }).then(function (r) {
      if (r.ok) done(); else { say('The message did not go through. Please try again in a few minutes.', 'err'); btn.disabled = false; }
    }).catch(failed);
  });
})();
