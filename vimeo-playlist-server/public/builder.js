// builder.js - Vimeo Playlist Builder Logic

// DOM Elements
const controls         = document.getElementById('controls');
const playlistUrlInput = document.getElementById('playlistUrlInput');
const loadUrlButton    = document.getElementById('loadUrlButton');
const videoLinks       = document.getElementById('videoLinks');
const loadButton       = document.getElementById('loadButton');
const saveButton       = document.getElementById('saveButton');
const shareContainer   = document.getElementById('shareLinkContainer');
const gallery          = document.getElementById('gallery');
const player           = document.getElementById('player');
const prevBtn          = document.getElementById('prevBtn');
const nextBtn          = document.getElementById('nextBtn');
const titleBox         = document.getElementById('currentTitle');
const fullscreenBtn    = document.getElementById('fullscreenBtn');
const shareBtn         = document.getElementById('shareBtn');
const currentDuration  = document.getElementById('currentDuration');
const notificationArea = document.getElementById('notificationArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const videoRow         = document.querySelector('.video-row');
const thumbnailsRow    = document.querySelector('.thumbnails-row');
const mainContainer    = document.querySelector('.main-container');

// Store loaded video IDs to check for duplicates
let loadedVideoIds = new Set();

// Loading indicator functions
function showLoading(message = 'Loading...') {
  const textElement = loadingIndicator.querySelector('.loading-text');
  if (textElement) textElement.textContent = message;
  loadingIndicator.classList.remove('hidden');
}
function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

// Notification helper
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.padding = '10px';
  notification.style.marginTop = '10px';
  notification.style.backgroundColor = '#f8f8f8';
  notification.style.border = '1px solid #ddd';
  notification.style.borderRadius = '4px';
  notification.textContent = message;
  notificationArea.innerHTML = '';
  notificationArea.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode === notificationArea) notificationArea.removeChild(notification);
  }, 5000);
}

// Parse Vimeo URLs
function parseVimeoUrl(url) {
  try {
    const u   = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    const id  = seg[0];                      // always the numeric ID
    const hash = seg[1]                      // if present as /ID/HASH
               || u.searchParams.get('h')    // or as ?h=HASH
               || null;
    return { id, hash };
  } catch {
    return {};
  }
}


// Copy to clipboard
function copyToClipboard(text) {
  const input = document.createElement('input');
  input.style.position = 'fixed'; input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  input.select(); document.execCommand('copy');
  document.body.removeChild(input);
  showNotification('URL copied to clipboard!');
}

// Update textarea when videos reorder
function updateVideoLinksTextarea() {
  if (!videoLinks || !window.playlistItems) return;
  videoLinks.value = window.playlistItems.map(i => i.url).join('\n');
}

// Drag-and-drop
function initDragAndDrop() {
  new Sortable(gallery, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: () => {
      window.playlistItems = Array.from(gallery.children).map(thumb => ({
        url: thumb.dataset.vimeoUrl,
        id: thumb.dataset.vimeoId,
        hash: thumb.dataset.vimeoHash,
        thumb
      }));
      updateVideoLinksTextarea();
    }
  });
}

// Play selected video
function playVideo(id, hash, thumbElem) {
  showLoading('Loading video...');
  videoRow.style.display = 'flex';
  thumbnailsRow.style.display = 'block';
  mainContainer.style.display = 'flex';
  document.querySelectorAll('.thumbnail.active').forEach(el => el.classList.remove('active'));
  thumbElem.classList.add('active');
  titleBox.textContent = thumbElem.dataset.title;
  let src = `https://player.vimeo.com/video/${id}?autoplay=1&badge=0`;
  if (hash) src += `&h=${hash}`;
  const iframe = document.createElement('iframe');
  iframe.src = src; iframe.allow = 'autoplay; fullscreen';
  iframe.onload = () => hideLoading();
  setTimeout(hideLoading, 5000);
  player.innerHTML = '';
  player.appendChild(iframe);
  setTimeout(() => thumbElem.scrollIntoView({ behavior: 'smooth', inline: 'center' }), 100);
  if (currentDuration) currentDuration.textContent = 'Playing';
}

// Load videos into builder view
async function loadVideos(urls) {
  gallery.innerHTML = '';
  window.playlistItems = [];
  loadedVideoIds.clear();
  let duplicates = 0;
  const processed = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!url) continue;
    const { id, hash } = parseVimeoUrl(url);
    if (!id || loadedVideoIds.has(id)) { duplicates++; continue; }
    try {
      const o = await (await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)).json();
      loadedVideoIds.add(id);
      processed.push(url);
      const thumb = document.createElement('div');
      thumb.className = 'thumbnail';
      thumb.dataset.vimeoUrl = url;
      thumb.dataset.vimeoId = id;
      thumb.dataset.vimeoHash = hash || '';
      thumb.dataset.title = o.title;
      thumb.innerHTML = `
      <img src="${o.thumbnail_url}" alt="${o.title}" />
      <p>${o.title}</p>
      <div class="drag-handle">↕</div>
    `;
    
      thumb.onclick = e => { if (e.target.className !== 'drag-handle') playVideo(id, hash, thumb); };
      gallery.appendChild(thumb);
      window.playlistItems.push({ url, id, hash, thumb });
    } catch {}
  }
  videoLinks.value = processed.join('\n');
  initDragAndDrop();
  videoRow.style.display = 'flex';
  thumbnailsRow.style.display = 'block';
  mainContainer.style.display = 'flex';
  hideLoading();
  if (window.playlistItems.length > 0) {
    const first = window.playlistItems[0];
    playVideo(first.id, first.hash, first.thumb);
  }
  if (duplicates) showNotification(`${duplicates} duplicate${duplicates>1?'s':' '} removed`);
}

// DOM events
document.addEventListener('DOMContentLoaded', () => {
  mainContainer.style.display = 'none';
  loadButton.onclick = () => {
    const lines = videoLinks.value.split('\n');
    if (!lines.some(l => l.trim())) return showNotification('Enter at least one URL');
    showLoading('Loading videos...');
    loadVideos(lines);
  };
  loadUrlButton.onclick = async () => {
    const text = playlistUrlInput.value.trim();
    if (!text) return showNotification('Enter a playlist URL');
    showLoading('Loading playlist...');
    try {
      const u = new URL(text);
      let id;
      if (u.searchParams.has('playlistId')) {
        id = u.searchParams.get('playlistId');
      } else {
        const m = u.pathname.match(/\/playlist\/(.+)/);
        if (m) id = m[1];
      }
      if (!id) throw new Error('Invalid URL');
      const res = await fetch(`/api/playlists/${id}`);
      if (!res.ok) throw new Error('Fetch failed');
      const { urls } = await res.json();
      videoLinks.value = urls.join('\n');
      loadButton.click();
    } catch {
      hideLoading();
      showNotification('Invalid playlist URL');
    }
  };
  saveButton.onclick = async () => {
    const name = prompt('Name this playlist'); if (!name) return;
    showLoading('Saving playlist...');
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, urls: window.playlistItems.map(i => i.url) })
      });
      const { id } = await res.json();
      shareContainer.innerHTML = `<p>Share: <a href="${location.origin}/playlist/${id}" target="_blank">${location.origin}/playlist/${id}</a></p>`;
      hideLoading();
      showNotification('Playlist saved!');
    } catch {
      hideLoading();
      showNotification('Save failed');
    }
  };
  fullscreenBtn?.addEventListener('click', () => {
    const iframe = player.querySelector('iframe'); iframe?.requestFullscreen().catch(console.error);
  });
  shareBtn?.addEventListener('click', () => copyToClipboard(window.location.href));
});
prevBtn.addEventListener('click', () => {
  gallery.scrollBy({ left: -200, behavior: 'smooth' });
});
nextBtn.addEventListener('click', () => {
  gallery.scrollBy({ left: 200, behavior: 'smooth' });
});
