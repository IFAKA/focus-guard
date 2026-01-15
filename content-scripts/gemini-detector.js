// Focus Guard - Gemini Generation Detector
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
                       document.querySelector('button[aria-label*="stop"]') ||
                       document.querySelector('[data-test-id="stop-button"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Material progress indicators
    const progressIndicator = document.querySelector('mat-progress-spinner') ||
                             document.querySelector('mat-progress-bar') ||
                             document.querySelector('[role="progressbar"]');
    if (progressIndicator && isVisible(progressIndicator)) return true;

    // Strategy 3: Loading/thinking state classes
    const loadingIndicator = document.querySelector('[class*="loading"]') ||
                            document.querySelector('[class*="pending"]') ||
                            document.querySelector('[class*="generating"]');
    if (loadingIndicator && isInResponseArea(loadingIndicator)) return true;

    // Strategy 4: Streaming response indicator
    const streamingResponse = document.querySelector('[data-streaming="true"]') ||
                              document.querySelector('.response-streaming');
    if (streamingResponse) return true;

    // Strategy 5: Input area disabled
    const inputArea = document.querySelector('rich-textarea') ||
                      document.querySelector('[contenteditable="true"][aria-label*="prompt"]');
    if (inputArea && inputArea.getAttribute('aria-disabled') === 'true') return true;

    return false;
  }

  function isInResponseArea(element) {
    return element.closest('[class*="response"]') ||
           element.closest('[class*="message"]') ||
           element.closest('[class*="conversation"]') ||
           element.closest('message-content');
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'gemini',
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
