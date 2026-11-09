/* Home page: the chapter buttons jump the video, and the dots follow the swipeable category cards. */
(function () {
  'use strict';
  var v = document.getElementById('wf');
  if (v) {
    var b = document.querySelectorAll('.chap [data-t]');
    for (var i = 0; i < b.length; i++) (function (el) {
      el.addEventListener('click', function () {
        var t = +el.getAttribute('data-t');
        function seek() { v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        if (v.readyState >= 1) seek(); else { v.addEventListener('loadedmetadata', seek, { once: true }); v.load(); }
      });
    })(b[i]);
  }
  var c = document.getElementById('cats'), d = document.querySelectorAll('#catdots i');
  if (c && d.length) c.addEventListener('scroll', function () {
    var cards = c.children, best = 0, bd = 1e9;
    for (var i = 0; i < cards.length; i++) { var dist = Math.abs(cards[i].offsetLeft - c.scrollLeft - c.offsetLeft + c.firstElementChild.offsetLeft); if (dist < bd) { bd = dist; best = i; } }
    if (c.scrollLeft + c.clientWidth >= c.scrollWidth - 4) best = cards.length - 1;
    for (var j = 0; j < d.length; j++) d[j].className = j === best ? 'on' : '';
  }, { passive: true });
})();
