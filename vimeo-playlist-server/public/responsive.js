/**
 * Responsive Layout Enhancement
 * Uses ResizeObserver to dynamically adjust layout based on viewport changes
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements we need to adjust
  const videoRow = document.querySelector('.video-row');
  const thumbnailsRow = document.querySelector('.thumbnails-row');
  const videoContentContainer = document.querySelector('.video-content-container');
  const headerContainer = document.querySelector('.header-container');
  const footerRow = document.querySelector('.footer-row');
  const videoCount = document.getElementById('videoCount');
  
  // Function to calculate optimal heights for masonry-like tight packing
  function adjustLayout() {
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Get header height
    const headerHeight = headerContainer.offsetHeight;
    
    // Footer height is fixed at 40px
    const footerHeight = 40;
    
    // Calculate thumbnail section height based on viewport size
    let thumbnailHeight;
    if (viewportWidth <= 320) {
      thumbnailHeight = 120; // Extra small screens
    } else if (viewportWidth <= 480) {
      thumbnailHeight = 140; // Mobile phones
    } else if (viewportWidth <= 768) {
      thumbnailHeight = 170; // Tablets
    } else {
      thumbnailHeight = 180; // Larger screens
    }
    
    // Calculate available content height
    const contentHeight = viewportHeight - headerHeight - footerHeight;
    
    // Calculate optimal player height (content height minus thumbnail height)
    const playerHeight = contentHeight - thumbnailHeight;
    
    // Apply calculated heights with no gaps
    videoContentContainer.style.height = `${contentHeight}px`;
    videoRow.style.height = `${playerHeight}px`;
    thumbnailsRow.style.height = `${thumbnailHeight}px`;
    
    // Force layout recalculation to ensure tight packing
    document.body.offsetHeight;
    
    // Adjust thumbnail sizes based on viewport width
    const thumbnails = document.querySelectorAll('.thumbnail');
    let thumbnailWidth;
    
    if (viewportWidth <= 320) {
      thumbnailWidth = 80;
    } else if (viewportWidth <= 480) {
      thumbnailWidth = 90;
    } else if (viewportWidth <= 768) {
      thumbnailWidth = 100;
    } else {
      thumbnailWidth = 120;
    }
    
    thumbnails.forEach(thumb => {
      thumb.style.width = `${thumbnailWidth}px`;
    });
  }
  
  // Initial adjustment
  adjustLayout();
  
  // Update video count in footer
  if (videoCount) {
    const updateVideoCount = () => {
      const totalVideos = document.querySelectorAll('.thumbnail').length;
      const activeIndex = document.querySelector('.thumbnail.active') ? 
        Array.from(document.querySelectorAll('.thumbnail')).findIndex(el => el.classList.contains('active')) + 1 : 0;
      
      if (totalVideos > 0) {
        videoCount.textContent = `${activeIndex} / ${totalVideos}`;
      } else {
        videoCount.textContent = '';
      }
    };
    
    // Set up a MutationObserver to watch for changes to the gallery
    const galleryObserver = new MutationObserver(updateVideoCount);
    const gallery = document.getElementById('gallery');
    
    if (gallery) {
      galleryObserver.observe(gallery, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    
    // Initial count
    updateVideoCount();
  }
  
  // Set up ResizeObserver to adjust layout on viewport changes
  const resizeObserver = new ResizeObserver(entries => {
    // We only need to call adjustLayout once per resize event
    adjustLayout();
  });
  
  // Observe the document body for size changes
  resizeObserver.observe(document.body);
  
  // Also listen for orientation changes on mobile
  window.addEventListener('orientationchange', adjustLayout);
});
