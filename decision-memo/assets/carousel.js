/* The how-it-works carousel: five full-width slides, a step bar above and previous and next buttons below. */
(function () {
  'use strict';
  var track = document.getElementById('car-track');
  if (!track) return;
  var slides = track.children, n = slides.length, cur = 0;
  var tabs = document.querySelectorAll('[data-step]');
  var count = document.getElementById('car-count'), prev = document.getElementById('car-prev'), next = document.getElementById('car-next');

  function paint() {
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-selected', String(i === cur));
      tabs[i].classList.toggle('done', i < cur);
    }
    if (count) count.textContent = 'Step ' + (cur + 1) + ' of ' + n;
    prev.disabled = cur === 0; next.disabled = cur === n - 1;
  }
  function go(i, smooth) {
    cur = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: cur * track.clientWidth, behavior: smooth === false ? 'auto' : 'smooth' });
    paint();
  }
  for (var i = 0; i < tabs.length; i++) (function (k) { tabs[k].addEventListener('click', function () { go(k); }); })(i);
  prev.addEventListener('click', function () { go(cur - 1); });
  next.addEventListener('click', function () { go(cur + 1); });
  var t = null;
  track.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () { var k = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (k !== cur) { cur = k; paint(); } }, 80);
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  window.addEventListener('resize', function () { go(cur, false); });
  paint();
  window.__car = { go: go, current: function () { return cur; } };
})();
