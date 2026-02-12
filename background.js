// Focus Guard - Background Service Worker
(function() {
  'use strict';

  // Track lock state per tab: tabId -> { sources: Set<string>, windowId: number }
  const lockedTabs = new Map();

  /**
   * Handle lock state changes from content scripts
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'LOCK_STATE_CHANGED') return;

    const tabId = sender.tab?.id;
    const windowId = sender.tab?.windowId;
    if (!tabId || !windowId) return;

    updateLockState(tabId, windowId, message.source, message.isLocked);
    sendResponse({ success: true });
  });

  /**
   * Update lock state for a tab
   */
  function updateLockState(tabId, windowId, source, isLocked) {
    if (isLocked) {
      if (!lockedTabs.has(tabId)) {
        lockedTabs.set(tabId, { sources: new Set(), windowId });
      }
      lockedTabs.get(tabId).sources.add(source);
    } else {
      if (lockedTabs.has(tabId)) {
        lockedTabs.get(tabId).sources.delete(source);
        if (lockedTabs.get(tabId).sources.size === 0) {
          lockedTabs.delete(tabId);
        }
      }
    }
  }

  /**
   * Get the locked tab for a window (if any)
   */
  function getLockedTabForWindow(windowId) {
    for (const [tabId, info] of lockedTabs.entries()) {
      if (info.windowId === windowId && info.sources.size > 0) {
        return tabId;
      }
    }
    return null;
  }

  /**
   * Handle tab activation - switch back if locked tab exists
   */
  chrome.tabs.onActivated.addListener((activeInfo) => {
    const { tabId, windowId } = activeInfo;

    const lockedTabId = getLockedTabForWindow(windowId);

    if (lockedTabId && lockedTabId !== tabId) {
      // Switch back to locked tab silently
      chrome.tabs.update(lockedTabId, { active: true }).catch(() => {
        // Tab may have been closed - clean up
        lockedTabs.delete(lockedTabId);
      });
    }
  });

  /**
   * Handle tab creation - prevent new tabs when locked tab exists
   */
  chrome.tabs.onCreated.addListener((tab) => {
    const { id: newTabId, windowId } = tab;

    if (!windowId || !newTabId) return;

    const lockedTabId = getLockedTabForWindow(windowId);

    // If there's a locked tab and this isn't it, close the new tab
    if (lockedTabId && lockedTabId !== newTabId) {
      // Small delay to ensure tab is fully created before removal
      setTimeout(() => {
        chrome.tabs.remove(newTabId).catch(() => {
          // Tab may have already been closed
        });
        // Ensure locked tab is active
        chrome.tabs.update(lockedTabId, { active: true }).catch(() => {
          // Locked tab may have been closed - clean up
          lockedTabs.delete(lockedTabId);
        });
      }, 10);
    }
  });

  /**
   * Clean up when tabs are closed
   */
  chrome.tabs.onRemoved.addListener((tabId) => {
    lockedTabs.delete(tabId);
  });

  /**
   * Clean up when windows are closed
   */
  chrome.windows.onRemoved.addListener((windowId) => {
    for (const [tabId, info] of lockedTabs.entries()) {
      if (info.windowId === windowId) {
        lockedTabs.delete(tabId);
      }
    }
  });

  /**
   * Clear locks when tab URL changes (new content scripts will re-evaluate)
   */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && lockedTabs.has(tabId)) {
      lockedTabs.delete(tabId);
    }
  });

})();
