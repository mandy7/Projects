/* The home page: the chapter buttons under the video jump to that moment. */
(function () {
  'use strict';
  var v = document.getElementById('wf');
  if (!v) return;
  var b = document.querySelectorAll('.chapb [data-t]');
  for (var i = 0; i < b.length; i++) (function (el) {
    el.addEventListener('click', function () {
      var t = +el.getAttribute('data-t');
      function seek() { v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      if (v.readyState >= 1) seek(); else { v.addEventListener('loadedmetadata', seek, { once: true }); v.load(); }
    });
  })(b[i]);
})();
