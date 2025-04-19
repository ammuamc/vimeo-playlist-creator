/**
 * Vimeo Playlist Creator
 * Main JavaScript file
 */

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

// Store loaded video IDs to check for duplicates
let loadedVideoIds = new Set();

// Loading indicator functions
function showLoading(message = 'Loading...') {
  const textElement = loadingIndicator.querySelector('.loading-text');
  if (textElement) {
    textElement.textContent = message;
  }
  loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

// Function to show a notification message
function showNotification(message, type = 'info') {
  // Create simple notification
  const notification = document.createElement('div');
  notification.style.padding = '10px';
  notification.style.marginTop = '10px';
  notification.style.backgroundColor = '#f8f8f8';
  notification.style.border = '1px solid #ddd';
  notification.style.borderRadius = '4px';
  notification.textContent = message;
  
  // Add to notification area
  notificationArea.innerHTML = '';
  notificationArea.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode === notificationArea) {
      notificationArea.removeChild(notification);
    }
  }, 5000);
}

// Helper function to parse Vimeo URLs
function parseVimeoUrl(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    let hash = null, id = seg[0];
    if (seg[1] && /^[0-9A-F]+$/i.test(seg[1])) hash = seg[1];
    if (u.searchParams.has('h')) hash = u.searchParams.get('h');
    return { id, hash };
  } catch {
    return {};
  }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
  // Create a temporary input element
  const input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  
  // Select and copy
  input.select();
  document.execCommand('copy');
  
  // Clean up
  document.body.removeChild(input);
  
  // Notify user
  showNotification('URL copied to clipboard!');
}

// Update textarea when videos are reordered
function updateVideoLinksTextarea() {
  // Only update if we're in builder mode
  if (videoLinks) {
    const urls = window.playlistItems.map(item => item.url);
    videoLinks.value = urls.join('\n');
  }
}

// Initialize drag-and-drop functionality
function initDragAndDrop() {
  // Initialize Sortable on the gallery
  const sortable = new Sortable(gallery, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: function(evt) {
      // Update the playlistItems array to match the new DOM order
      const newPlaylistItems = [];
      document.querySelectorAll('.thumbnail').forEach(thumb => {
        const id = thumb.dataset.vimeoId;
        const hash = thumb.dataset.vimeoHash;
        const url = thumb.dataset.vimeoUrl;
        newPlaylistItems.push({ id, hash, thumb, url });
      });
      window.playlistItems = newPlaylistItems;
      
      // Update the textarea to reflect the new order
      updateVideoLinksTextarea();
    }
  });
}

// Play video function
function playVideo(id, hash, thumb) {
  // Show loading indicator
  showLoading('Loading video...');
  
  document.querySelectorAll('.thumbnail.active')
          .forEach(el => el.classList.remove('active'));
  thumb.classList.add('active');
  titleBox.textContent = thumb.dataset.title;
  let src = `https://player.vimeo.com/video/${id}?autoplay=1&badge=0`;
  if (hash) src += `&h=${hash}`;
  
  // Create iframe with onload event
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.setAttribute('allow', 'autoplay; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  
  // Hide loading when iframe loads
  iframe.onload = function() {
    hideLoading();
  };
  
  // Set a timeout in case onload doesn't fire
  setTimeout(hideLoading, 5000);
  
  // Clear the player and add the new iframe
  player.innerHTML = '';
  player.appendChild(iframe);
  
  // Scroll the active thumbnail into view
  setTimeout(() => {
    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, 100);
  
  // Update duration in footer
  if (currentDuration) {
    currentDuration.textContent = 'Playing';
  }
}

// Core loader function
async function loadVideos(urls) {
  gallery.innerHTML = '';
  player.innerHTML = '<p class="placeholder">Select a video to play</p>';
  titleBox.textContent = '';
  
  // Store the complete video data for later use
  window.playlistItems = [];
  
  // Track duplicates
  let duplicateCount = 0;
  let processedUrls = [];
  
  // Check if we're in builder or viewer mode
  const params = new URLSearchParams(window.location.search);
  const isBuilderMode = !params.has('playlistId');
  
  for (const url of urls) {
    const { id, hash } = parseVimeoUrl(url);
    if (!id) continue;
    
    // Check for duplicates
    if (loadedVideoIds.has(id)) {
      duplicateCount++;
      continue; // Skip this URL
    }
    
    // Add to processed list
    processedUrls.push(url);
    
    try {
      const data = await (await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      )).json();
      
      // Mark as loaded to prevent duplicates
      loadedVideoIds.add(id);
      
      const thumb = document.createElement('div');
      thumb.className = 'thumbnail';
      thumb.dataset.title = data.title;
      thumb.dataset.vimeoId = id;
      thumb.dataset.vimeoHash = hash || '';
      thumb.dataset.vimeoUrl = url; // Store the original URL
      
      // Only add drag handles in builder mode
      const dragHandleHtml = isBuilderMode ? '<div class="drag-handle">↕</div>' : '';
      
      thumb.innerHTML = `
        <img src="${data.thumbnail_url}" alt="${data.title}" />
        <p>${data.title}</p>
        ${dragHandleHtml}`;
      
      thumb.onclick = (e) => {
        // Don't trigger video play when dragging
        if (e.target.className === 'drag-handle') return;
        playVideo(id, hash, thumb);
      };
      
      gallery.appendChild(thumb);
      window.playlistItems.push({ id, hash, thumb, url });
    } catch (error) {
      console.error(`Error loading video ${url}:`, error);
    }
  }
  
  // Update textarea with filtered URLs (without duplicates)
  if (videoLinks && isBuilderMode) {
    videoLinks.value = processedUrls.join('\n');
  }
  
  prevBtn.style.display = nextBtn.style.display = window.playlistItems.length > 5 ? 'block' : 'none';
  prevBtn.onclick = () => gallery.scrollBy({ left: -gallery.clientWidth, behavior: 'smooth' });
  nextBtn.onclick = () => gallery.scrollBy({ left: gallery.clientWidth, behavior: 'smooth' });
  
  if (window.playlistItems.length) {
    playVideo(
      window.playlistItems[0].id, 
      window.playlistItems[0].hash, 
      window.playlistItems[0].thumb
    );
  } else {
    // Hide loading if no videos were loaded
    hideLoading();
  }
  
  // Initialize drag-and-drop, but only in builder mode
  if (isBuilderMode) {
    initDragAndDrop();
  }
  
  // Show notification about duplicates if any were found
  if (duplicateCount > 0 && isBuilderMode) {
    showNotification(`${duplicateCount} duplicate video${duplicateCount > 1 ? 's were' : ' was'} removed`);
  }
}

// Event Listeners

// On page load
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('playlistId')) {
    document.querySelector('header.header').style.display = 'none'; // Only hide the builder header
    controls.style.display = 'none';
    showLoading('Loading playlist...');
    fetch(`/api/playlists/${params.get('playlistId')}`)
      .then(r => r.json())
      .then(data => loadVideos(data.urls))
      .catch(err => {
        hideLoading();
        console.error('Error loading playlist:', err);
      });
  } else if (params.has('videos')) {
    const urls = params.get('videos').split(';').map(decodeURIComponent);
    videoLinks.value = urls.join('\n');
  }
});

// Load-from-URL button
loadUrlButton.addEventListener('click', async () => {
  try {
    const u = new URL(playlistUrlInput.value.trim());
    let urls;
    if (u.searchParams.has('videos')) {
      urls = u.searchParams.get('videos').split(';').map(decodeURIComponent);
      videoLinks.value = urls.join('\n');
      loadButton.click();
    } else if (u.searchParams.has('playlistId')) {
      showLoading('Loading playlist...');
      const res = await fetch(`/api/playlists/${u.searchParams.get('playlistId')}`);
      if (!res.ok) throw new Error();
      urls = (await res.json()).urls;
      
      // Update the textarea with the URLs from the playlist
      videoLinks.value = urls.join('\n');
      
      loadVideos(urls);
    } else throw new Error();
  } catch {
    hideLoading();
    showNotification('Invalid playlist URL');
  }
});

// Load button
loadButton.addEventListener('click', () => {
  const urls = videoLinks.value.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (urls.length === 0) {
    showNotification('Please enter at least one video URL');
    return;
  }
  
  // Reset duplicate detection for a fresh load
  loadedVideoIds.clear();
  
  // Show loading indicator
  showLoading('Loading videos...');
  
  loadVideos(urls);
});

// Save button
saveButton.addEventListener('click', async () => {
  const name = prompt('Name this playlist'); 
  if (!name) return;
  
  // Use the ordered URLs from playlistItems instead of parsing the textarea
  const urls = window.playlistItems 
             ? window.playlistItems.map(item => item.url)
             : videoLinks.value.split('\n').map(l => l.trim()).filter(Boolean);
  
  showLoading('Saving playlist...');
  
  try {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, urls })
    });
    
    hideLoading();
    
    const { id } = await res.json();
    shareContainer.innerHTML = `
      <p>Saved! Share this playlist: 
        <a href="${location.origin}/?playlistId=${id}" target="_blank">
          ${location.origin}/?playlistId=${id}
        </a>
      </p>`;
    shareContainer.style.display = 'block';
    
    showNotification('Playlist saved successfully!');
  } catch (error) {
    hideLoading();
    console.error('Error saving playlist:', error);
    showNotification('Failed to save playlist. Please try again.');
  }
});

// Window resize event
window.addEventListener('resize', function() {
  // If we have an active thumbnail, make sure it's visible
  const activeThumb = document.querySelector('.thumbnail.active');
  if (activeThumb) {
    setTimeout(() => {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 100);
  }
});

// Fullscreen button functionality
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', function() {
    const iframe = player.querySelector('iframe');
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    }
  });
}

// Share button functionality
if (shareBtn) {
  shareBtn.addEventListener('click', function() {
    const url = window.location.href;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: url
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to clipboard
        copyToClipboard(url);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(url);
    }
  });
}