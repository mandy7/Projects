/* Pricing page: the programme selector on phones, and the email-gated sample pack. The email goes to the same Google Form as the enquiry form (no-cors), then the pack link appears. */
(function () {
  'use strict';
  var tabs = document.querySelectorAll('.sel3 [role=tab]');
  function pick(t) {
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i] === t; tabs[i].setAttribute('aria-selected', String(on));
      var card = document.getElementById(tabs[i].getAttribute('aria-controls')); if (card) card.hidden = !on;
    }
  }
  for (var k = 0; k < tabs.length; k++) (function (t) { t.addEventListener('click', function () { pick(t); }); })(tabs[k]);
  var g = document.getElementById('gate'), gm = document.getElementById('gate-msg'), cfg = window.SITE || {};
  if (g) g.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (g._gotcha && g._gotcha.value) return;
    var email = g.email.value.trim(), b = g.querySelector('button');
    function say(t, k, link) { gm.className = 'gnote ' + (k || ''); gm.textContent = t; if (link) { gm.appendChild(document.createTextNode(' ')); var a = document.createElement('a'); a.href = 'assets/sample-pack.pdf'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open the sample pack (PDF)'; a.style.fontWeight = '700'; a.style.textDecoration = 'underline'; gm.appendChild(a); } }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Please give an email address.', 'err'); return; }
    var google = cfg.googleForm && cfg.googleForm.action && cfg.googleForm.entries && cfg.googleForm.entries.pain && cfg.googleForm.entries.contact;
    if (!google && !cfg.formEndpoint) { say('This is not connected yet, so nothing was sent.', 'err'); return; }
    b.disabled = true; say('Sending.');
    var ok = function () { g.reset(); b.disabled = false; say('Thank you.', 'ok', true); };
    var bad = function () { b.disabled = false; say('That did not go through. Please check your connection and try again.', 'err'); };
    var text = 'Sample pack request from the pricing page.';
    if (google) {
      var e = cfg.googleForm.entries, body = new URLSearchParams();
      body.append(e.pain, text); if (e.industry) body.append(e.industry, ''); body.append(e.contact, email);
      fetch(cfg.googleForm.action, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).then(ok).catch(bad);
    } else {
      var fd = new FormData(); fd.set('email', email); fd.set('message', text);
      fetch(cfg.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd }).then(function (r) { if (r.ok) ok(); else bad(); }).catch(bad);
    }
  });
})();
