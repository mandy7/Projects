/* How it works: a five-stage selector on wide screens, an accordion on phones. One stage is open at a time. */
(function () {
  'use strict';
  var box = document.getElementById('stagebox');
  if (!box) return;
  var items = Array.prototype.slice.call(box.querySelectorAll('.sitem')), tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs5 [role=tab]'));
  var prev = document.getElementById('st-prev'), next = document.getElementById('st-next');
  var wide = window.matchMedia('(min-width: 821px)'), cur = 1;
  function names(i) { return items[i - 1] ? items[i - 1].getAttribute('data-name') : ''; }
  function show(n, collapse) {
    cur = n;
    items.forEach(function (it, i) {
      var on = (i + 1 === n) && !(collapse && !wide.matches ? true : false);
      it.setAttribute('data-cur', on ? 'true' : 'false');
      var h = it.querySelector('.h2'); if (h) h.setAttribute('aria-expanded', String(on));
    });
    tabs.forEach(function (t, i) { t.setAttribute('aria-selected', String(i + 1 === n)); t.tabIndex = i + 1 === n ? 0 : -1; });
    if (prev) { prev.disabled = n === 1; prev.querySelector('b').textContent = names(n - 1); }
    if (next) { next.disabled = n === items.length; next.querySelector('b').textContent = names(n + 1); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i + 1); });
    t.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
      var n = Math.min(items.length, Math.max(1, cur + k)); show(n); tabs[n - 1].focus(); e.preventDefault();
    });
  });
  items.forEach(function (it, i) {
    var h = it.querySelector('.h2');
    if (h) h.addEventListener('click', function () { if (it.getAttribute('data-cur') === 'true') show(i + 1, true); else show(i + 1); });
  });
  if (prev) prev.addEventListener('click', function () { show(Math.max(1, cur - 1)); });
  if (next) next.addEventListener('click', function () { show(Math.min(items.length, cur + 1)); });
  var start = 1; try { var q = parseInt(new URLSearchParams(location.search).get('stage'), 10); if (q >= 1 && q <= items.length) start = q; } catch (e) {}
  show(start);
  wide.addEventListener('change', function () { if (!items.some(function (it) { return it.getAttribute('data-cur') === 'true'; })) show(cur || 1); });
  /* an FAQ link such as #data opens that question */
  function openHash() { var id = location.hash.slice(1), el = id && document.getElementById(id); if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); } }
  openHash(); window.addEventListener('hashchange', openHash);
})();
