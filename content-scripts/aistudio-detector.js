// Focus Guard - Google AI Studio Generation Detector
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
    // Strategy 1: Stop button visible (Material Design)
    const stopButton = document.querySelector('button[aria-label*="Stop"]') ||
                       document.querySelector('button[aria-label*="stop"]') ||
                       document.querySelector('[data-test-id="stop-button"]') ||
                       document.querySelector('mat-icon[fonticon="stop"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Material Design progress indicators
    const progressIndicator = document.querySelector('mat-progress-bar') ||
                             document.querySelector('mat-spinner') ||
                             document.querySelector('mat-progress-spinner') ||
                             document.querySelector('[role="progressbar"]');
    if (progressIndicator && isVisible(progressIndicator)) return true;

    // Strategy 3: Run button disabled (indicates processing)
    const runButton = document.querySelector('button[aria-label*="Run"]') ||
                      document.querySelector('button[aria-label*="run"]') ||
                      document.querySelector('[data-test-id="run-button"]');
    if (runButton && (runButton.disabled || runButton.getAttribute('aria-disabled') === 'true')) return true;

    // Strategy 4: Streaming/generating indicator
    const streamingIndicator = document.querySelector('[class*="streaming"]') ||
                               document.querySelector('[class*="generating"]') ||
                               document.querySelector('[class*="loading"]');
    if (streamingIndicator && isInOutputArea(streamingIndicator)) return true;

    // Strategy 5: Output area loading state
    const outputLoading = document.querySelector('[class*="output"][class*="loading"]') ||
                         document.querySelector('[class*="response"][class*="pending"]');
    if (outputLoading && isVisible(outputLoading)) return true;

    return false;
  }

  function isInOutputArea(element) {
    return element.closest('[class*="output"]') ||
           element.closest('[class*="response"]') ||
           element.closest('[class*="result"]') ||
           element.closest('[class*="preview"]');
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'aistudio',
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
