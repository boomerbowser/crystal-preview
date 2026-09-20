/* Crystal controls: state synchronisation only.
 *
 * This script creates no elements and observes no mutations. Field shells and
 * indicators are authored in markup, or emitted by whichever renderer owns the
 * control. All this does is read state and set attributes on elements that
 * already exist.
 *
 * That distinction is the whole point. A script that rewrites other people's
 * DOM cannot coexist with React, SwiftUI or Compose, which own their own trees;
 * one that only reads state and sets attributes can be replaced wholesale by a
 * framework binding to the same headless core.
 */
(function () {
  'use strict';

  const core = (globalThis.CrystalCore || {});
  const state = core.state;

  /* Without the core there is nothing to derive from. Fail quietly rather than
     half-applying: the CSS already handles the common cases on its own. */
  if (!state) return;

  const flagsOf = (el) => ({
    pressed: el.getAttribute('aria-pressed') === 'true',
    selected: el.getAttribute('aria-selected') === 'true',
    checked: el.getAttribute('aria-checked') === 'true',
    current: el.getAttribute('aria-current'),
    busy: el.getAttribute('aria-busy') === 'true',
  });

  /* Most state changes are handled by CSS alone, because the selectors key off
     the aria attributes directly. This exists for the case CSS cannot express:
     a control whose indicator kind changes, such as one that becomes busy while
     it is also selected. */
  function syncIndicators(root) {
    for (const mark of root.querySelectorAll('.cr-indicator[data-kind]')) {
      const kind = mark.dataset.kind;
      if (kind === 'field') continue;
      const host = mark.parentElement;
      if (!host) continue;
      const resolved = state.resolveIndicator(flagsOf(host));
      if (resolved && resolved !== kind) mark.dataset.kind = resolved;
    }
  }

  function syncRange(field) {
    field.style.setProperty('--cr-range-progress', state.rangeProgress({
      value: field.value, min: field.min || 0, max: field.max || 100,
    }) + '%');
  }

  function syncAllRanges(root) {
    for (const field of root.querySelectorAll('input[type=range]')) syncRange(field);
  }

  document.addEventListener('input', (event) => {
    if (event.target.matches('input[type=range]')) syncRange(event.target);
  });
  document.addEventListener('change', () => {
    syncAllRanges(document);
    syncIndicators(document);
  });
  document.addEventListener('click', () => {
    /* After the handler that changed the state has run. */
    requestAnimationFrame(() => syncIndicators(document));
  });
  document.addEventListener('reset', () => requestAnimationFrame(() => syncAllRanges(document)));

  syncAllRanges(document);
  syncIndicators(document);
})();
