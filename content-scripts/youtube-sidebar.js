// Focus Guard - YouTube Sidebar Remover
(function() {
  'use strict';

  function removeSecondary() {
    const secondary = document.getElementById('secondary');
    if (secondary) {
      secondary.remove();
    }
    const panelsFullBleed = document.getElementById('panels-full-bleed-container');
    if (panelsFullBleed) {
      panelsFullBleed.remove();
    }
  }

  // Run immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeSecondary);
  } else {
    removeSecondary();
  }

  // YouTube is a SPA — re-run on navigation
  const observer = new MutationObserver(removeSecondary);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
