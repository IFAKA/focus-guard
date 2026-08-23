// Focus Guard - Popup
(function() {
  'use strict';

  const DEFAULT_SETTINGS = { videoLock: true, aiLock: true };
  const STORAGE_KEY = 'settings';

  const videoToggle = document.getElementById('video-lock');
  const aiToggle = document.getElementById('ai-lock');
  const statusEl = document.getElementById('status');

  async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) };
  }

  async function saveSetting(key, value) {
    const settings = await loadSettings();
    settings[key] = value;
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    renderStatus(settings);
  }

  function renderStatus(settings) {
    const active = [];
    if (settings.videoLock) active.push('videos');
    if (settings.aiLock) active.push('AI chats');
    statusEl.textContent = active.length
      ? `Guarding: ${active.join(' & ')}`
      : 'Guarding: nothing';
  }

  async function init() {
    const settings = await loadSettings();
    videoToggle.checked = settings.videoLock;
    aiToggle.checked = settings.aiLock;
    renderStatus(settings);
  }

  videoToggle.addEventListener('change', () => saveSetting('videoLock', videoToggle.checked));
  aiToggle.addEventListener('change', () => saveSetting('aiLock', aiToggle.checked));

  init();
})();
