// Focus Guard - YouTube Layout: Move masthead into guide sidebar
(function () {
  'use strict';

  const CSS = `
    /* ── Masthead hidden via JS after ytd-searchbox is moved out ── */

    /* Zero toolbar-height variable — propagates to all YouTube var() usages */
    ytd-app { --ytd-toolbar-height: 0px !important; }

    /* Guide and mini-guide start from very top */
    #guide, ytd-mini-guide-renderer { top: 0 !important; }

    /* Remove drawer content width/padding constraints */
    #contentContainer.tp-yt-app-drawer { width: unset !important; padding: 0 !important; }

    /* Remove page manager top offset (YouTube JS may also set this inline) */
    #page-manager { margin-top: 0 !important; padding-top: 0 !important; }

    /* ── Fixed hamburger — only when drawer is closed ── */
    #fg-guide-toggle {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 2200;
    }
    #fg-guide-toggle yt-icon-button {
      color: var(--yt-spec-text-primary, #fff);
    }
    body:has(tp-yt-app-drawer[opened]) #fg-guide-toggle { display: none !important; }

    /* ── Sidebar search bar ── */
    #fg-guide-header {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px 12px 10px;
      border-bottom: 1px solid var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1));
      margin-bottom: 4px;
      box-sizing: border-box;
    }

    /* Fit real ytd-searchbox inside the sidebar */
    #fg-guide-header ytd-searchbox {
      width: 100% !important;
      max-width: 100% !important;
      flex: 1 !important;
    }
  `;

  function injectStyles() {
    if (document.getElementById('fg-yt-styles')) return;
    const style = document.createElement('style');
    style.id = 'fg-yt-styles';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function buildGuideHeader(guideContent, searchbox) {
    const header = document.createElement('div');
    header.id = 'fg-guide-header';

    // Move the real ytd-searchbox (with autocomplete) from the masthead
    header.appendChild(searchbox);

    // Now the masthead is empty — fully collapse it and zero the toolbar height variable
    const masthead = document.getElementById('masthead-container');
    if (masthead) masthead.style.setProperty('display', 'none', 'important');
    const app = document.querySelector('ytd-app');
    if (app) app.style.setProperty('--ytd-toolbar-height', '0px', 'important');

    const nativeHeader = guideContent.querySelector('#header');
    const sectionsEl = guideContent.querySelector('#sections');
    if (nativeHeader) {
      nativeHeader.after(header);
    } else {
      guideContent.insertBefore(header, sectionsEl ?? guideContent.firstChild);
    }
  }

  function setupDrawerAutofocus() {
    const drawer = document.querySelector('tp-yt-app-drawer');
    if (!drawer) return false;

    new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'opened' && drawer.hasAttribute('opened')) {
          const input = document.querySelector('#fg-guide-header ytd-searchbox input');
          input?.focus();
          break;
        }
      }
    }).observe(drawer, { attributes: true });

    return true;
  }

  let drawerWatched = false;
  let cachedSearchbox = null; // survives guide re-renders during SPA navigation

  function trySetup() {
    // Move #guide-button to a fixed wrapper so it stays accessible when guide is closed
    if (!document.getElementById('fg-guide-toggle')) {
      const guideBtn = document.querySelector('#guide-button');
      if (guideBtn) {
        const wrapper = document.createElement('div');
        wrapper.id = 'fg-guide-toggle';
        wrapper.appendChild(guideBtn);
        document.body.appendChild(wrapper);
      }
    }

    // Re-insert searchbox whenever guide-content is re-rendered (SPA navigation removes fg-guide-header)
    if (!document.getElementById('fg-guide-header')) {
      const guideContent = document.getElementById('guide-content');
      // Prefer a live DOM element; fall back to cached detached element from a prior move
      const searchbox = document.querySelector('ytd-searchbox') || cachedSearchbox;
      if (guideContent && searchbox) {
        cachedSearchbox = searchbox;
        buildGuideHeader(guideContent, searchbox);
      }
    }

    // Set up drawer autofocus observer once
    if (!drawerWatched) {
      drawerWatched = setupDrawerAutofocus();
    }

    // Zero page-manager inline margin (YouTube JS may re-apply it)
    const pm = document.getElementById('page-manager');
    if (pm) pm.style.setProperty('margin-top', '0', 'important');
  }

  // Cmd+. (Mac) / Ctrl+. (Windows/Linux) toggles the guide sidebar
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === '.') {
      e.preventDefault();
      const btn = document.querySelector('#fg-guide-toggle button, #guide-button button');
      btn?.click();
    }
  });

  function run() {
    injectStyles();
    trySetup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const observer = new MutationObserver(trySetup);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
