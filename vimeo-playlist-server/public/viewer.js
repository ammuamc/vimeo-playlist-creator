// viewer.js - Vimeo Playlist Viewer Logic

let playerContainer, galleryContainer, prevBtn, nextBtn, currentIndex = 0;
const urlsGlobal = [];

/**
 * Initialize viewer controls
 */
function initViewer() {
  playerContainer = document.getElementById('player');
  galleryContainer = document.getElementById('gallery');
  prevBtn = document.getElementById('prevBtn');
  nextBtn = document.getElementById('nextBtn');

  // SCROLL instead of navigate
  prevBtn.addEventListener('click', () => {
    galleryContainer.scrollBy({ left: -200, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    galleryContainer.scrollBy({ left: 200, behavior: 'smooth' });
  });
}

/**
 * Extract Vimeo ID and hash from a URL
 */
function parseVimeoUrl(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    const id = seg[0];
    const hash = seg[1] || u.searchParams.get('h') || '';
    return { id, hash };
  } catch {
    return { id: '', hash: '' };
  }
}

/**
 * Render all thumbnails using oEmbed for correct URLs and titles
 */
async function renderGallery() {
  galleryContainer.innerHTML = '';
  for (let i = 0; i < urlsGlobal.length; i++) {
    const url = urlsGlobal[i];
    const { id, hash } = parseVimeoUrl(url);
    let thumbUrl = '', title = '';
    try {
      const o = await (await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      )).json();
      thumbUrl = o.thumbnail_url;
      title = o.title;
    } catch {
      // Fallback thumbnail and empty title
      thumbUrl = `https://i.vimeocdn.com/video/${id}_295x166.jpg`;
    }

    const thumb = document.createElement('div');
    thumb.className = 'thumbnail';
    thumb.dataset.index = i;

    const img = document.createElement('img');
    img.src = thumbUrl;
    img.alt = title;
    thumb.appendChild(img);

    const caption = document.createElement('p');
    caption.textContent = title;
    thumb.appendChild(caption);

    thumb.addEventListener('click', () => {
      currentIndex = i;
      renderPlayer(i);
    });

    galleryContainer.appendChild(thumb);
  }
}

/**
 * Render the Vimeo embed in the player
 */
function renderPlayer(index) {
  const { id, hash } = parseVimeoUrl(urlsGlobal[index]);
  const params = hash ? `?h=${hash}&` : '?';
  const src = `https://player.vimeo.com/video/${id}${params}autoplay=1&title=0&byline=0&portrait=0`;
  playerContainer.innerHTML = `
    <iframe
      src="${src}"
      frameborder="0"
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>`;

  // Highlight active thumbnail
  document.querySelectorAll('.thumbnail').forEach(el => el.classList.remove('active'));
  const active = galleryContainer.children[index];
  if (active) active.classList.add('active');
}

/**
 * Load and display playlist videos
 */
async function loadVideos(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    document.getElementById('player').innerHTML = '<p>No videos in playlist.</p>';
    return;
  }

  urlsGlobal.splice(0, urlsGlobal.length, ...urls);
  initViewer();
  await renderGallery();

  // Reveal UI
  document.querySelector('.video-row').style.display = 'flex';
  document.querySelector('.thumbnails-row').style.display = 'block';

  // Auto-play first video
  currentIndex = 0;
  renderPlayer(0);
}

// Expose for inline init
window.loadVideos = loadVideos;
