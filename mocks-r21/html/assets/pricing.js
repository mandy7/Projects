/* Pricing page: the currency switch and the programme selector on phones. The prices live in the page itself (data-usd and data-inr). */
(function () {
  'use strict';
  var px = document.querySelectorAll('.px'), cb = document.querySelectorAll('.cur [data-cur]');
  function setCur(c) {
    for (var i = 0; i < px.length; i++) px[i].textContent = px[i].getAttribute('data-' + c);
    for (var j = 0; j < cb.length; j++) cb[j].setAttribute('aria-pressed', String(cb[j].getAttribute('data-cur') === c));
  }
  for (var i = 0; i < cb.length; i++) (function (b) { b.addEventListener('click', function () { setCur(b.getAttribute('data-cur')); }); })(cb[i]);
  var tabs = document.querySelectorAll('.sel3 [role=tab]');
  function pick(t) {
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i] === t; tabs[i].setAttribute('aria-selected', String(on));
      var card = document.getElementById(tabs[i].getAttribute('aria-controls')); if (card) card.hidden = !on;
    }
  }
  for (var k = 0; k < tabs.length; k++) (function (t) { t.addEventListener('click', function () { pick(t); }); })(tabs[k]);
})();
