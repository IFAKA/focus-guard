// Focus Guard - YouTube Sidebar Remover
(function() {
  'use strict';

  // CSS hiding is instantaneous and survives SPA re-renders without flash
  const style = document.createElement('style');
  style.id = 'fg-yt-sidebar-styles';
  style.textContent = `
    #masthead-container {
      position: fixed !important;
      top: -100vh !important;
      pointer-events: none !important;
    }
    #secondary,
    #panels-full-bleed-container,
    a.yt-simple-endpoint.ytd-video-owner-renderer { display: none !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
})();
