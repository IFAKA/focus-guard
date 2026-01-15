// Focus Guard - Video Playback Detector
(function() {
  'use strict';

  const POLLING_INTERVAL = 500;
  let lastReportedState = null;

  function isVideoPlaying(video) {
    return !video.paused && !video.ended && video.readyState > 2 && video.currentTime > 0;
  }

  function checkVideoPlayback() {
    const videos = document.querySelectorAll('video');
    let anyPlaying = false;

    videos.forEach(video => {
      if (isVideoPlaying(video)) {
        anyPlaying = true;
      }
    });

    if (anyPlaying !== lastReportedState) {
      lastReportedState = anyPlaying;
      chrome.runtime.sendMessage({
        type: 'LOCK_STATE_CHANGED',
        source: 'video',
        isLocked: anyPlaying
      }).catch(() => {});
    }
  }

  function setupVideoListeners() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (!video.dataset.focusGuardListening) {
        video.dataset.focusGuardListening = 'true';
        video.addEventListener('play', checkVideoPlayback);
        video.addEventListener('pause', checkVideoPlayback);
        video.addEventListener('ended', checkVideoPlayback);
        video.addEventListener('emptied', checkVideoPlayback);
      }
    });
  }

  // Watch for dynamically added videos
  const observer = new MutationObserver((mutations) => {
    let hasNewVideos = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
          hasNewVideos = true;
        }
      });
    });
    if (hasNewVideos) {
      setupVideoListeners();
      checkVideoPlayback();
    }
  });

  // Initialize
  if (document.body) {
    setupVideoListeners();
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setupVideoListeners();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Polling fallback
  setInterval(checkVideoPlayback, POLLING_INTERVAL);
  checkVideoPlayback();
})();
