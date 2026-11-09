/* Try it out, last step: "Email me the memo". It goes through the same form connection as the enquiry form and says so if it is not connected. */
(function () {
  'use strict';
  var cfg = window.SITE || {};
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f || f.id !== 'mailbox') return; ev.preventDefault();
    var m = f.querySelector('#mb-msg'), b = f.querySelector('#mb-send');
    function say(t, k) { m.textContent = t; m.className = 'msg ' + (k || ''); }
    if (f._gotcha && f._gotcha.value) return;
    var email = f.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('Please give an email address.', 'err'); return; }
    var T = window.__trial, text = 'Memo request from the try it out page.\nQuestion run: ' + (T ? T.describe() : 'unknown');
    var google = cfg.googleForm && cfg.googleForm.action && cfg.googleForm.entries && cfg.googleForm.entries.pain && cfg.googleForm.entries.contact;
    if (!google && !cfg.formEndpoint) { say('This is not connected yet, so nothing was sent.', 'err'); return; }
    b.disabled = true; say('Sending.', '');
    var ok = function () { f.reset(); b.disabled = false; say('Thank you. We will email the memo to you.', 'ok'); };
    var bad = function () { b.disabled = false; say('That did not go through. Please check your connection and try again.', 'err'); };
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
