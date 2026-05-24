// Focus Guard - YouTube Music Selectable Text
(function () {
  'use strict';

  const BUTTON_ID = 'fg-ytmusic-copy-lyrics-ai';
  const STYLE_ID = 'fg-ytmusic-selectable-text';
  const BUTTON_LABEL = 'Copy AI prompt';
  const COPIED_LABEL = 'Copied';
  const NO_LYRICS_LABEL = 'No lyrics';
  const ERROR_LABEL = 'Copy failed';

  const CSS = `
    ytmusic-description-shelf-renderer,
    ytmusic-description-shelf-renderer *,
    ytmusic-lyrics-renderer,
    ytmusic-lyrics-renderer *,
    ytmusic-player-page #lyrics,
    ytmusic-player-page #lyrics *,
    ytmusic-section-list-renderer ytmusic-description-shelf-renderer yt-formatted-string,
    ytmusic-section-list-renderer ytmusic-description-shelf-renderer yt-formatted-string *,
    ytmusic-section-list-renderer ytmusic-lyrics-renderer yt-formatted-string,
    ytmusic-section-list-renderer ytmusic-lyrics-renderer yt-formatted-string * {
      -webkit-user-select: text !important;
      user-select: text !important;
    }

    ytmusic-description-shelf-renderer yt-formatted-string,
    ytmusic-description-shelf-renderer yt-formatted-string *,
    ytmusic-lyrics-renderer yt-formatted-string,
    ytmusic-lyrics-renderer yt-formatted-string *,
    ytmusic-player-page #lyrics yt-formatted-string,
    ytmusic-player-page #lyrics yt-formatted-string * {
      cursor: text !important;
    }

    ytmusic-description-shelf-renderer a,
    ytmusic-description-shelf-renderer button,
    ytmusic-lyrics-renderer a,
    ytmusic-lyrics-renderer button,
    ytmusic-player-page #lyrics a,
    ytmusic-player-page #lyrics button {
      cursor: revert !important;
    }

    #${BUTTON_ID} {
      align-items: center !important;
      background: rgba(255, 255, 255, 0.1) !important;
      border: 0 !important;
      border-radius: 18px !important;
      color: #fff !important;
      cursor: pointer !important;
      display: inline-flex !important;
      font-family: Roboto, Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      gap: 8px !important;
      height: 36px !important;
      line-height: 36px !important;
      margin: 16px 0 0 !important;
      max-width: 100% !important;
      padding: 0 16px 0 14px !important;
      position: relative !important;
      transition: background-color 120ms ease, color 120ms ease, transform 120ms ease !important;
      white-space: nowrap !important;
      z-index: 1 !important;
    }

    #${BUTTON_ID}.fg-floating {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
      margin: 0 !important;
      position: fixed !important;
      right: 24px !important;
      top: 104px !important;
      z-index: 2147483647 !important;
    }

    #${BUTTON_ID}:hover {
      background: rgba(255, 255, 255, 0.16) !important;
    }

    #${BUTTON_ID}:active {
      background: rgba(255, 255, 255, 0.22) !important;
      transform: scale(0.98) !important;
    }

    #${BUTTON_ID}.fg-success {
      background: #fff !important;
      color: #030303 !important;
    }

    #${BUTTON_ID}.fg-warning,
    #${BUTTON_ID}.fg-error {
      background: rgba(255, 255, 255, 0.18) !important;
      color: #ffb4a9 !important;
    }

    #${BUTTON_ID} .fg-ytmusic-copy-icon {
      display: block !important;
      flex: 0 0 auto !important;
      height: 18px !important;
      width: 18px !important;
    }

    #${BUTTON_ID} .fg-ytmusic-copy-label {
      display: block !important;
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

  `;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function isVisible(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

    const style = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }

  function hasLyricsText(node) {
    const text = getLyricsText(node);
    const words = text.split(/\s+/).filter(Boolean);
    return text.length > 40 && words.length >= 8;
  }

  function getLyricsRoot() {
    const preferredSelectors = [
      'ytmusic-description-shelf-renderer[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]',
      'ytmusic-description-shelf-renderer[is-track-lyrics-page]',
      'ytmusic-lyrics-renderer',
      'ytmusic-player-page #lyrics',
      'ytmusic-tab-renderer[page-type*="LYRICS"]',
      'ytmusic-tab-renderer[tab-title="LYRICS"]',
    ];

    const selectorCandidates = preferredSelectors.flatMap((selector) => (
      Array.from(document.querySelectorAll(selector))
    ));

    const visibleCandidate = selectorCandidates.find((node) => (
      isVisible(node) && hasLyricsText(node)
    ));

    if (visibleCandidate) return visibleCandidate;

    const sourceCandidate = Array.from(document.querySelectorAll('ytmusic-description-shelf-renderer, ytmusic-lyrics-renderer'))
      .find((node) => isVisible(node) && /Source:\s*Musixmatch/i.test(node.innerText || node.textContent || ''));

    if (sourceCandidate) return sourceCandidate;
    return null;
  }

  function getLyricsMountTarget(root) {
    if (!root || !isVisible(root)) return null;

    const visibleText = Array.from(root.querySelectorAll('yt-formatted-string'))
      .find((node) => (
        isVisible(node)
        && node.classList.contains('description')
        && !node.closest('#description-button[hidden]')
        && hasLyricsText(node)
      ))
      || Array.from(root.querySelectorAll('yt-formatted-string'))
        .find((node) => isVisible(node) && hasLyricsText(node));

    return visibleText?.parentElement || root.querySelector('.wrapper') || root;
  }

  function getLyricsText(root) {
    if (!root) return '';

    const formattedStrings = Array.from(root.querySelectorAll('yt-formatted-string'))
      .filter((node) => !node.closest(`#${BUTTON_ID}`))
      .filter((node) => !node.closest('#description-button[hidden]'))
      .filter((node) => !node.hasAttribute('hidden'));

    const sourceNodes = formattedStrings.length ? formattedStrings : [root];
    const text = sourceNodes
      .map((node) => node.innerText || node.textContent || '')
      .join('\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => ![
        'Lyrics',
        'UP NEXT',
        'RELATED',
        BUTTON_LABEL,
        COPIED_LABEL,
        NO_LYRICS_LABEL,
        ERROR_LABEL,
      ].includes(line))
      .filter((line) => !/^Source:\s*Musixmatch/i.test(line))
      .join('\n');

    return text.trim();
  }

  function getCleanTextLines(text) {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => ![
        'Lyrics',
        'UP NEXT',
        'RELATED',
        BUTTON_LABEL,
        COPIED_LABEL,
        NO_LYRICS_LABEL,
        ERROR_LABEL,
      ].includes(line))
      .filter((line) => !/^Source:\s*Musixmatch/i.test(line));
  }

  function getPageLyricsText() {
    const lines = getCleanTextLines(document.body?.innerText || '');
    if (!lines.length) return '';

    const rawLines = (document.body?.innerText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const sourceIndex = rawLines.findIndex((line) => /^Source:\s*Musixmatch/i.test(line));
    if (sourceIndex > -1) {
      const startMarkers = ['RELATED', 'Autoplay is on', 'LYRICS'];
      let startIndex = -1;

      for (let index = sourceIndex - 1; index >= 0; index -= 1) {
        if (startMarkers.includes(rawLines[index])) {
          startIndex = index + 1;
          break;
        }
      }

      const musixmatchLyrics = getCleanTextLines(rawLines.slice(Math.max(0, startIndex), sourceIndex).join('\n')).join('\n');
      if (musixmatchLyrics.length > 40) return musixmatchLyrics;
    }

    for (let index = rawLines.length - 1; index >= 0; index -= 1) {
      if (rawLines[index] !== 'LYRICS') continue;

      const relatedOffset = rawLines.slice(index + 1, index + 4).indexOf('RELATED');
      if (relatedOffset === -1) continue;

      const lyricsStart = index + relatedOffset + 2;
      const lyricsEnd = sourceIndex > lyricsStart ? sourceIndex : rawLines.length;
      const tabLyrics = getCleanTextLines(rawLines.slice(lyricsStart, lyricsEnd).join('\n')).join('\n');
      if (tabLyrics.length > 40) return tabLyrics;
    }

    return '';
  }

  function getTrackInfo() {
    let title = document.querySelector('ytmusic-player-bar .title')?.textContent?.trim()
      || document.querySelector('ytmusic-player-bar yt-formatted-string.title')?.textContent?.trim()
      || '';

    let byline = document.querySelector('ytmusic-player-bar .subtitle')?.textContent?.trim()
      || document.querySelector('ytmusic-player-bar yt-formatted-string.subtitle')?.textContent?.trim()
      || '';

    if (/video will play after ad/i.test(title)) title = '';
    if (/video will play after ad/i.test(byline)) byline = '';

    return { title, byline };
  }

  function buildPrompt(lyrics) {
    const { title, byline } = getTrackInfo();
    const context = [
      title ? `Song title: ${title}` : '',
      byline ? `Artist / album context: ${byline}` : '',
    ].filter(Boolean).join('\n');

    return [
      'Tell me what this song is about. Explain the main meaning, emotional tone, recurring imagery, and any likely subtext. Ground the analysis in the lyrics and avoid overclaiming where the lyrics are ambiguous.',
      context,
      'Lyrics:',
      lyrics,
    ].filter(Boolean).join('\n\n');
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      if (!document.execCommand('copy')) {
        throw new Error('execCommand copy failed');
      }
    } finally {
      textarea.remove();
    }
  }

  function setButtonState(button, label, className) {
    const labelNode = button.querySelector('.fg-ytmusic-copy-label');
    if (labelNode) labelNode.textContent = label;
    button.classList.remove('fg-success', 'fg-warning', 'fg-error');
    if (className) button.classList.add(className);

    window.clearTimeout(button.fgResetTimer);
    button.fgResetTimer = window.setTimeout(() => {
      if (labelNode) labelNode.textContent = BUTTON_LABEL;
      button.classList.remove('fg-success', 'fg-warning', 'fg-error');
    }, 1800);
  }

  function createButton() {
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy lyrics with an AI analysis prompt');
    button.innerHTML = `
      <svg class="fg-ytmusic-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z"></path>
      </svg>
      <span class="fg-ytmusic-copy-label">${BUTTON_LABEL}</span>
    `;

    button.addEventListener('click', async () => {
      const root = button.closest('ytmusic-description-shelf-renderer, ytmusic-lyrics-renderer, ytmusic-tab-renderer, #lyrics')
        || getLyricsRoot();
      const lyrics = getLyricsText(root) || getPageLyricsText();

      if (!lyrics) {
        setButtonState(button, NO_LYRICS_LABEL, 'fg-warning');
        return;
      }

      try {
        await copyText(buildPrompt(lyrics));
        setButtonState(button, COPIED_LABEL, 'fg-success');
      } catch (error) {
        setButtonState(button, ERROR_LABEL, 'fg-error');
      }
    });

    return button;
  }

  function mountButton() {
    if (!document.body) return;

    const root = getLyricsRoot();
    const mountTarget = getLyricsMountTarget(root);
    const existingButton = document.getElementById(BUTTON_ID);

    if (!mountTarget) {
      existingButton?.remove();
      return;
    }

    const button = existingButton || createButton();
    button.classList.remove('fg-floating');

    if (button.parentElement !== mountTarget) {
      mountTarget.insertBefore(button, mountTarget.firstChild);
    }
  }

  function observePage() {
    if (!document.documentElement) {
      window.setTimeout(observePage, 50);
      return;
    }

    const observer = new MutationObserver(() => {
      injectStyles();
      mountButton();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('yt-navigate-finish', mountButton);
    document.addEventListener('yt-page-data-updated', mountButton);
    window.setInterval(mountButton, 1000);
  }

  injectStyles();
  observePage();
  mountButton();
  document.addEventListener('DOMContentLoaded', mountButton, { once: true });
  window.addEventListener('load', mountButton, { once: true });
  window.setTimeout(mountButton, 250);
  window.setTimeout(mountButton, 1500);
})();
