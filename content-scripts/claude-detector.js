// Focus Guard - Claude.ai Generation Detector
(function() {
  'use strict';

  const POLLING_INTERVAL = 300;
  let lastState = null;

  function isVisible(element) {
    if (!element) return false;
    return element.offsetParent !== null &&
           window.getComputedStyle(element).display !== 'none' &&
           window.getComputedStyle(element).visibility !== 'hidden';
  }

  function isGenerating() {
    // Strategy 1: Stop button visible during generation
    const stopButton = document.querySelector('button[aria-label="Stop Response"]') ||
                       document.querySelector('button[aria-label*="Stop"]') ||
                       document.querySelector('[data-testid="stop-button"]');
    if (stopButton && isVisible(stopButton)) return true;

    // Strategy 2: Streaming indicator on message
    const streamingMessage = document.querySelector('[data-is-streaming="true"]');
    if (streamingMessage) return true;

    // Strategy 3: Look for the animated cursor/caret during streaming
    const streamingCursor = document.querySelector('.font-claude-message [class*="cursor"]') ||
                           document.querySelector('[class*="streaming"]');
    if (streamingCursor && isVisible(streamingCursor)) return true;

    // Strategy 4: Send button disabled state
    const sendButton = document.querySelector('button[aria-label="Send Message"]') ||
                       document.querySelector('fieldset button[type="button"]:last-child');
    if (sendButton && (sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true')) {
      // Check if there's actual content being generated (not just empty state)
      const hasMessages = document.querySelector('[class*="message"]');
      if (hasMessages) return true;
    }

    return false;
  }

  function checkAndReport() {
    const generating = isGenerating();
    if (generating !== lastState) {
      lastState = generating;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'claude',
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
        attributeFilter: ['disabled', 'aria-disabled', 'data-is-streaming', 'class', 'aria-label']
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
