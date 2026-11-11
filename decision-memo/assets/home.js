/* Home page: the chapter buttons jump the video (a portrait cut loads on phones), and the dots follow the swipeable cards. */
(function () {
  'use strict';
  var v = document.getElementById('wf');
  if (v) {
    var b = document.querySelectorAll('.chap [data-t]');
    for (var i = 0; i < b.length; i++) (function (el) {
      el.addEventListener('click', function () {
        var t = +el.getAttribute(window.matchMedia('(max-width: 820px)').matches ? 'data-tm' : 'data-t');
        function seek() { v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        if (v.readyState >= 1) seek(); else { v.addEventListener('loadedmetadata', seek, { once: true }); v.load(); }
      });
    })(b[i]);
  }
  var mob = window.matchMedia('(max-width: 820px)');
  if (v && mob.matches) {
    v.innerHTML = '<source src="assets/video/workflow-m.mp4" type="video/mp4"><source src="assets/video/workflow-m.webm" type="video/webm">Your browser cannot play this video.';
    v.poster = 'assets/video/workflow-m-poster.jpg'; v.load();
  }
  var cars = document.querySelectorAll('.car-s');
  for (var q = 0; q < cars.length; q++) (function (c) {
    var d = c.nextElementSibling; if (!d || !d.classList.contains('wdots')) return; d = d.children;
    c.addEventListener('scroll', function () {
      var cards = c.children, best = 0, bd = 1e9;
      for (var i = 0; i < cards.length; i++) { var dist = Math.abs(cards[i].offsetLeft - c.offsetLeft - c.scrollLeft - 20); if (dist < bd) { bd = dist; best = i; } }
      if (c.scrollLeft + c.clientWidth >= c.scrollWidth - 4) best = cards.length - 1;
      for (var j = 0; j < d.length; j++) d[j].className = j === best ? 'on' : '';
    }, { passive: true });
  })(cars[q]);
})();
