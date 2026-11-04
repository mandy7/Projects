/* Brand settings. Change the name here and every page picks it up when it loads.
   The HTML also holds the current name as plain text, so the site reads correctly before this
   script runs. If you rename the product for good, also replace that text (search for the
   value of STATIC_NAME below) so the two agree. See README.md. */
(function () {
  'use strict';
  var STATIC_NAME = 'Second Analyst';           // the name written into the HTML files
  window.BRAND = {
    name: 'Second Analyst',                        // the product name
    descriptor: 'Repeatable intelligence work, with human judgement',
    owner: 'Mandhir Dua'
  };
  var B = window.BRAND;
  function swap(str) { return String(str).split(STATIC_NAME).join(B.name); }
  function apply() {
    var i, els;
    els = document.querySelectorAll('[data-brand]');
    for (i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-brand'); if (B[k]) els[i].textContent = B[k]; }
    if (B.name !== STATIC_NAME) {
      document.title = swap(document.title);
      els = document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]');
      for (i = 0; i < els.length; i++) els[i].setAttribute('content', swap(els[i].getAttribute('content')));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
