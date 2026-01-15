// Focus Guard - ChatGPT Generation Detector
(function() {
  'use strict';

  const POLLING_INTERVAL = 300;
  let lastState = null;

  function isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
           window.getComputedStyle(element).display !== 'none' &&
           window.getComputedStyle(element).visibility !== 'hidden';
  }

  function isGenerating() {
    // Strategy 1: Stop button presence (most reliable)
    const stopButton = document.querySelector('[data-testid="stop-button"]') ||
                       document.querySelector('button[aria-label="Stop generating"]') ||
                       document.querySelector('button[aria-label="Stop streaming"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Result streaming class
    const streamingResult = document.querySelector('.result-streaming') ||
                           document.querySelector('[class*="result-streaming"]');
    if (streamingResult) return true;

    // Strategy 3: Agent/thinking indicator
    const thinkingIndicator = document.querySelector('[class*="thinking"]') ||
                              document.querySelector('[data-testid="thinking-indicator"]');
    if (thinkingIndicator && isVisible(thinkingIndicator)) return true;

    // Strategy 4: Animated dots in response
    const animatedDots = document.querySelector('.animate-pulse') ||
                        document.querySelector('[class*="loading-dots"]');
    if (animatedDots && isInChatArea(animatedDots)) return true;

    return false;
  }

  function isInChatArea(element) {
    return element.closest('[class*="conversation"]') ||
           element.closest('[class*="chat"]') ||
           element.closest('main');
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'chatgpt',
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
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled', 'class', 'data-testid', 'aria-label']
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
