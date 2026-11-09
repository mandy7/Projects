/* Shared behaviour: details elements that stay open on wide screens, and anchors that open an accordion on phones. */
(function () {
  'use strict';
  var wide = window.matchMedia('(min-width: 821px)');
  function sync() {
    var d = document.querySelectorAll('details[data-do]');
    for (var i = 0; i < d.length; i++) { d[i].open = wide.matches ? true : d[i].hasAttribute('data-mo'); }
  }
  function hash() {
    var id = location.hash.slice(1); if (!id) return;
    var t = document.getElementById(id), m = document.getElementById('m-' + id);
    if (!wide.matches && m && m.tagName === 'DETAILS') { m.open = true; m.scrollIntoView(); }
    else if (t && t.tagName === 'DETAILS') { t.open = true; t.scrollIntoView(); }
  }
  window.__ui = { sync: sync };
  sync(); hash();
  if (wide.addEventListener) wide.addEventListener('change', sync);
  window.addEventListener('hashchange', hash);
})();
