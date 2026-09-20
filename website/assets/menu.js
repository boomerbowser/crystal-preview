/* The side menu collapses on narrow viewports. Nothing else on the page depends
   on this: with the script absent the menu is simply always open, which is the
   correct degradation for navigation. */
(function () {
  'use strict';
  function init() {
    var toggle = document.getElementById('menu-toggle');
    var layout = document.querySelector('.site-layout');
    if (!toggle || !layout) return;
    toggle.addEventListener('click', function () {
      var open = layout.hasAttribute('data-menu-open');
      if (open) layout.removeAttribute('data-menu-open');
      else layout.setAttribute('data-menu-open', '');
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
