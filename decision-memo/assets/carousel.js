/* The how-it-works carousel: five slides you can swipe, with a step bar, dots and arrows. */
(function () {
  'use strict';
  var track = document.getElementById('car-track');
  if (!track) return;
  var slides = track.children, n = slides.length, cur = 0;
  var tabs = document.querySelectorAll('.tabs [data-step]'), dots = document.querySelectorAll('.dots .p i');
  var count = document.getElementById('car-count'), prev = document.getElementById('car-prev'), next = document.getElementById('car-next');
  function offset(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }
  function paint() {
    var i;
    for (i = 0; i < tabs.length; i++) { tabs[i].setAttribute('aria-selected', String(i === cur)); tabs[i].classList.toggle('done', i < cur); }
    for (i = 0; i < dots.length; i++) { dots[i].className = i < cur ? 'd' : (i === cur ? 'on' : ''); }
    if (count) count.textContent = 'Step ' + (cur + 1) + ' of ' + n;
    prev.disabled = cur === 0; next.disabled = cur === n - 1;
  }
  function go(i, smooth) {
    cur = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: offset(cur), behavior: smooth === false ? 'auto' : 'smooth' });
    paint();
  }
  for (var i = 0; i < tabs.length; i++) (function (k) { tabs[k].addEventListener('click', function () { go(k); }); })(i);
  prev.addEventListener('click', function () { go(cur - 1); });
  next.addEventListener('click', function () { go(cur + 1); });
  var t = null;
  track.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var best = 0, bd = 1e9, i;
      for (i = 0; i < n; i++) { var d = Math.abs(track.scrollLeft - offset(i)); if (d < bd) { bd = d; best = i; } }
      if (best !== cur) { cur = best; paint(); }
    }, 90);
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  window.addEventListener('resize', function () { go(cur, false); });
  paint();
  window.__car = { go: go, current: function () { return cur; } };
})();
