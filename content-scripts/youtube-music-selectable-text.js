// Focus Guard - YouTube Music Selectable Text
(function () {
  'use strict';

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
  `;

  function injectStyles() {
    if (document.getElementById('fg-ytmusic-selectable-text')) return;

    const style = document.createElement('style');
    style.id = 'fg-ytmusic-selectable-text';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  injectStyles();
})();
