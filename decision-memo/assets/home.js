/* The home page: the chapter buttons jump the video, and the preview shows a real sample finding from the demo engine. */
(function () {
  'use strict';
  var v = document.getElementById('wf');
  if (v) {
    var b = document.querySelectorAll('.chapb [data-t]');
    for (var i = 0; i < b.length; i++) (function (el) {
      el.addEventListener('click', function () {
        var t = +el.getAttribute('data-t');
        function seek() { v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        if (v.readyState >= 1) seek(); else { v.addEventListener('loadedmetadata', seek, { once: true }); v.load(); }
      });
    })(b[i]);
  }

  var D = window.PREVIEW, pv = document.getElementById('pv');
  if (!D || !pv) return;
  var SUB = {
    budget: ['Marketing budget', 'Spend and booking history', '5,000 scenarios', 'Answer and memo'],
    price: ['Price change', 'Price and volume history', '5,000 scenarios', 'Answer and memo'],
    watch: ['Competitors', 'Public sources and your notes', 'Evidence rated by strength', 'Answer and memo']
  };
  var NAME = { hotels: 'Hotels', pharma: 'Pharma', telecom: 'Telecom' }, CTX = { budget: 'Marketing budget', price: 'Price change', watch: 'Competitors' };
  var st = { q: 'budget', i: 'hotels' };
  function $(id) { return document.getElementById(id); }
  function render() {
    var f = D.f[st.q + '.' + st.i]; if (!f) return;
    Array.prototype.forEach.call(pv.querySelectorAll('[data-q]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === st.q)); });
    Array.prototype.forEach.call(pv.querySelectorAll('[data-i]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-i') === st.i)); });
    $('pv-ctx').textContent = CTX[st.q] + ' · ' + NAME[st.i];
    SUB[st.q].forEach(function (t, k) { $('pv-s' + k).textContent = t; });
    $('pv-rec').textContent = f.rec; $('pv-trade').textContent = f.trade;
    $('pv-go').href = 'try-it-yourself.html?decision=' + st.q + '&industry=' + st.i + '&run=1';
  }
  pv.addEventListener('click', function (e) {
    var q = e.target.closest('[data-q]'), i = e.target.closest('[data-i]');
    if (q) st.q = q.getAttribute('data-q'); if (i) st.i = i.getAttribute('data-i');
    if (q || i) render();
  });
  render();
})();
