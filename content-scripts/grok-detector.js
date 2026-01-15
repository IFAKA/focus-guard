// Focus Guard - Grok (X/Twitter) Generation Detector
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
                       document.querySelector('[data-testid="stop-generating"]') ||
                       document.querySelector('[data-testid="stop-button"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Loading/streaming indicator
    const loadingIndicator = document.querySelector('[class*="loading"]') ||
                            document.querySelector('[class*="streaming"]') ||
                            document.querySelector('[class*="generating"]');
    if (loadingIndicator && isInResponseArea(loadingIndicator)) return true;

    // Strategy 3: Animated cursor/typing effect
    const typingIndicator = document.querySelector('[class*="cursor"]') ||
                           document.querySelector('[class*="blink"]') ||
                           document.querySelector('[class*="caret"]');
    if (typingIndicator && isInResponseArea(typingIndicator)) return true;

    // Strategy 4: X/Twitter specific - progress spinner
    const spinner = document.querySelector('[role="progressbar"]') ||
                   document.querySelector('[class*="spinner"]') ||
                   document.querySelector('[class*="LoadingSpinner"]');
    if (spinner && isInResponseArea(spinner)) return true;

    // Strategy 5: Thinking/processing state
    const thinkingState = document.querySelector('[class*="thinking"]') ||
                         document.querySelector('[class*="processing"]');
    if (thinkingState && isVisible(thinkingState)) return true;

    return false;
  }

  function isInResponseArea(element) {
    return element.closest('[class*="message"]') ||
           element.closest('[class*="response"]') ||
           element.closest('[class*="grok"]') ||
           element.closest('[class*="conversation"]') ||
           element.closest('[data-testid*="grok"]');
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'grok',
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
