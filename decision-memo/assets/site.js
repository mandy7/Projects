(function () {
  'use strict';
  var cfg = window.SITE || {};
  var form = document.getElementById('ask');
  var mail = document.getElementById('mail-line');

  if (mail) {
    if (cfg.contactEmail) {
      var a = document.createElement('a');
      a.href = 'mailto:' + cfg.contactEmail;
      a.textContent = cfg.contactEmail;
      mail.textContent = 'To ask a question or have your message deleted, write to ';
      mail.appendChild(a);
      mail.appendChild(document.createTextNode('.'));
    } else {
      mail.textContent = 'To ask a question or have your message deleted, reply to any message I send you.';
    }
  }

  if (!form) return;

  var msg = document.getElementById('form-msg');
  var btn = document.getElementById('send');

  // Keep the source tag if the link that brought you here had one, for example ?source=arjan
  try {
    var q = new URLSearchParams(window.location.search);
    var src = q.get('source') || q.get('utm_source') || q.get('ref') || '';
    document.getElementById('f-source').value = src.replace(/[^\w.\-]/g, '').slice(0, 40);
  } catch (e) {}

  // A plan carried over from the pricing page, for example ?plan=Jobs%3A...
  var plan = '';
  try {
    plan = (new URLSearchParams(window.location.search).get('plan') || '').replace(/[<>]/g, ' ').slice(0, 900);
  } catch (e) {}
  var planBox = document.getElementById('plan-box');
  if (plan && planBox) {
    document.getElementById('plan-text').textContent = plan;
    planBox.hidden = false;
    document.getElementById('plan-drop').addEventListener('click', function () { plan = ''; planBox.hidden = true; });
  }

  function say(text, isErr) {
    msg.textContent = text;
    msg.className = isErr ? 'err' : (text === 'Sending.' ? '' : 'ok');
  }

  function done() {
    form.reset(); plan = ''; if (planBox) planBox.hidden = true;
    say('Thank you. I read every message myself and will reply to the address or profile you gave.', false);
    btn.disabled = false;
  }
  function failed() {
    say('The message did not go through. Please check your connection and try again.', true);
    btn.disabled = false;
  }

  var google = cfg.googleForm && cfg.googleForm.action && cfg.googleForm.entries &&
    cfg.googleForm.entries.pain && cfg.googleForm.entries.industry && cfg.googleForm.entries.contact;

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var pain = form.pain.value.trim();
    var industry = form.industry.value.trim();
    var contact = form.contact.value.trim();
    var source = document.getElementById('f-source').value;

    if (form._gotcha && form._gotcha.value) { return; }
    if (pain.length < 10) { say('Please describe the job or question in a sentence or two.', true); return; }
    var looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    var looksLinkedIn = /linkedin\.com\/.+/i.test(contact);
    if (!looksEmail && !looksLinkedIn) { say('Please give an email address or a LinkedIn profile link so I can reply.', true); return; }

    if (plan) { pain = pain + '\n\nPlan from the pricing page:\n' + plan; }

    if (google) {
      // Posts to a Google Form. The browser cannot read Google's reply, so a sent request counts as success.
      var e = cfg.googleForm.entries;
      var body = new URLSearchParams();
      body.append(e.pain, pain);
      body.append(e.industry, industry);
      body.append(e.contact, contact);
      if (e.source) { body.append(e.source, source); }
      btn.disabled = true;
      say('Sending.', false);
      fetch(cfg.googleForm.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      }).then(done).catch(failed);
      return;
    }

    if (!cfg.formEndpoint) {
      if (cfg.contactEmail) {
        // No form service is set up, so hand the brief to the visitor's own email program.
        var subject = encodeURIComponent('A brief');
        var mbody = encodeURIComponent(pain + '\n\nIndustry: ' + industry + '\nContact: ' + contact);
        window.location.href = 'mailto:' + cfg.contactEmail + '?subject=' + subject + '&body=' + mbody;
        say('Your email program should open with the brief filled in. Press send there to deliver it.', false);
        return;
      }
      say('This form is not connected yet, so nothing was sent.', true);
      return;
    }

    btn.disabled = true;
    say('Sending.', false);
    fetch(cfg.formEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: (function () { var fd = new FormData(form); fd.set('pain', pain); return fd; })()
    }).then(function (r) {
      if (r.ok) { done(); } else {
        say('The message did not go through. Please try again in a few minutes.', true);
        btn.disabled = false;
      }
    }).catch(failed);
  });
})();
