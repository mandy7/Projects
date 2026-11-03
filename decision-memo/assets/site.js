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

  function say(text, isErr) {
    msg.textContent = text;
    msg.className = isErr ? 'err' : '';
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var pain = form.pain.value.trim();
    var industry = form.industry.value.trim();
    var contact = form.contact.value.trim();

    if (form._gotcha && form._gotcha.value) { return; }
    if (pain.length < 10) { say('Please describe the decision or pain in a sentence or two.', true); return; }
    if (!industry) { say('Please name your industry.', true); return; }
    var looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    var looksLinkedIn = /linkedin\.com\/.+/i.test(contact);
    if (!looksEmail && !looksLinkedIn) { say('Please give an email address or a LinkedIn profile link so I can reply.', true); return; }

    if (!cfg.formEndpoint) {
      say('This form is not connected yet, so nothing was sent.', true);
      return;
    }

    btn.disabled = true;
    say('Sending.', false);
    fetch(cfg.formEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(function (r) {
      if (r.ok) {
        form.reset();
        say('Thank you. I read every message and will reply to the address or profile you gave.', false);
      } else {
        say('The message did not go through. Please try again in a few minutes.', true);
      }
    }).catch(function () {
      say('The message did not go through. Please check your connection and try again.', true);
    }).then(function () { btn.disabled = false; });
  });
})();
