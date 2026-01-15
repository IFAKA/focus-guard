// Focus Guard - Perplexity Generation Detector
(function() {
  'use strict';

  const POLLING_INTERVAL = 300;
  let lastState = null;

  function isVisible(element) {
    if (!element) return false;
    return element.offsetParent !== null &&
           window.getComputedStyle(element).display !== 'none';
  }

  function isGenerating() {
    // Strategy 1: Stop button visible
    const stopButton = document.querySelector('button[aria-label*="Stop"]') ||
                       document.querySelector('[data-testid="stop-button"]') ||
                       document.querySelector('button[aria-label*="stop"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Searching/thinking indicator by class
    const searchingIndicator = document.querySelector('[class*="searching"]') ||
                               document.querySelector('[class*="thinking"]') ||
                               document.querySelector('[class*="loading"]');
    if (searchingIndicator && isInAnswerArea(searchingIndicator)) return true;

    // Strategy 3: Animated pulse/loading dots
    const animatedElement = document.querySelector('[class*="animate-pulse"]') ||
                           document.querySelector('[class*="pulse"]') ||
                           document.querySelector('[class*="skeleton"]');
    if (animatedElement && isInAnswerArea(animatedElement)) return true;

    // Strategy 4: Sources loading state
    const sourcesLoading = document.querySelector('[class*="sources"][class*="loading"]') ||
                          document.querySelector('[class*="source-skeleton"]');
    if (sourcesLoading && isVisible(sourcesLoading)) return true;

    // Strategy 5: Pro search indicator (when Perplexity is actively searching)
    const proSearchActive = document.querySelector('[class*="pro-search"][class*="active"]') ||
                           document.querySelector('[class*="searching-web"]');
    if (proSearchActive && isVisible(proSearchActive)) return true;

    return false;
  }

  function isInAnswerArea(element) {
    return element.closest('[class*="answer"]') ||
           element.closest('[class*="response"]') ||
           element.closest('[class*="result"]') ||
           element.closest('[class*="prose"]') ||
           element.closest('main');
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'perplexity',
        isLocked: generating
      }).catch(() => {});
    }
  }

  const observer = new MutationObserver(checkAndReport);

  function init() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  setInterval(checkAndReport, POLLING_INTERVAL);
  checkAndReport();
})();
