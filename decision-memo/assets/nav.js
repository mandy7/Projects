/* The mobile menu: opens from the hamburger, closes on a link, Escape, the dimmed area or a wider screen. */
(function () {
  'use strict';
  var b = document.getElementById('burger'), p = document.getElementById('mpanel'), s = document.getElementById('scrim');
  if (!b || !p) return;
  function set(open) {
    b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    p.hidden = !open; p.classList.toggle('open', open);
    if (s) { s.hidden = !open; s.classList.toggle('open', open); }
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
  if (s) s.addEventListener('click', function () { set(false); });
  p.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { set(false); b.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 820) set(false); });
  window.addEventListener('pageshow', function () { set(false); });
})();
