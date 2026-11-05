/* How it works: a five-stage selector on wide screens (one panel at a time). On phones the stages are an accordion in the page. */
(function () {
  'use strict';
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#tabs5 [role=tab]')), panels = Array.prototype.slice.call(document.querySelectorAll('#stagebox .stbox'));
  var prev = document.getElementById('st-prev'), next = document.getElementById('st-next'), cur = 1;
  if (!tabs.length) return;
  function show(n) {
    cur = n;
    panels.forEach(function (p, i) { p.hidden = i + 1 !== n; });
    tabs.forEach(function (t, i) { t.setAttribute('aria-selected', String(i + 1 === n)); t.tabIndex = i + 1 === n ? 0 : -1; });
    if (prev) { prev.disabled = n === 1; prev.querySelector('b').textContent = n > 1 ? panels[n - 2].getAttribute('data-name') : ''; }
    if (next) { next.disabled = n === panels.length; next.querySelector('b').textContent = n < panels.length ? panels[n].getAttribute('data-name') : ''; }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i + 1); });
    t.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
      var n = Math.min(panels.length, Math.max(1, cur + k)); show(n); tabs[n - 1].focus(); e.preventDefault();
    });
  });
  if (prev) prev.addEventListener('click', function () { show(Math.max(1, cur - 1)); });
  if (next) next.addEventListener('click', function () { show(Math.min(panels.length, cur + 1)); });
  var start = 1; try { var q = parseInt(new URLSearchParams(location.search).get('stage'), 10); if (q >= 1 && q <= panels.length) start = q; } catch (e) {}
  show(start);
  function openHash() { var id = location.hash.slice(1), el = id && document.getElementById(id); if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); } }
  openHash(); window.addEventListener('hashchange', openHash);
})();
