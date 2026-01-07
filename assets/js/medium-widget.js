/**
 * Medium Widget - Displays recent Medium posts using RSS2JSON API
 * Configuration via data attributes on #medium-widget element
 */
(function() {
  const container = document.getElementById('medium-widget');

  if (!container) {
    return;
  }

  const config = {
    username: container.dataset.username,
    maxPosts: parseInt(container.dataset.maxPosts) || 6,
    locale: container.dataset.locale || 'en-US',
    fallbackImage: container.dataset.fallbackImage || 'https://cdn-images-1.medium.com/max/1200/1*6_fgYnisCa9V21mymySIvA.png'
  };

  /**
   * Escape HTML special characters to prevent XSS
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate that URL uses safe protocol (http/https)
   */
  function isSafeUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  const safeUsername = escapeHtml(config.username || '');
  const encodedUsername = encodeURIComponent(config.username || '');

  // Build fallback message dynamically
  const fallbackMessage = `Unable to load Medium posts. Visit <a href="https://medium.com/@${encodedUsername}" target="_blank">${safeUsername ? safeUsername : 'my Medium profile'}</a>.`;

  fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${encodedUsername}`)
    .then(res => res.json())
    .then(data => {
      // Validate response structure before accessing items
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        container.innerHTML = `<div class="col-12"><p class="text-muted">${fallbackMessage}</p></div>`;
        return;
      }

      const posts = data.items.slice(0, config.maxPosts);

      // Build articles array for better performance
      const articles = [];

      posts.forEach(post => {
        // Extract first image from content/description
        let thumbnail = post.thumbnail;

        // Try to extract image from content or description HTML
        if (!thumbnail) {
          const content = post.content || post.description || '';
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch && imgMatch[1]) {
            thumbnail = imgMatch[1];
          }
        }

        // Use enclosure as fallback
        if (!thumbnail && post.enclosure && post.enclosure.link) {
          thumbnail = post.enclosure.link;
        }

        // Final fallback: default image
        if (!thumbnail) {
          thumbnail = config.fallbackImage;
        }

        // Validate thumbnail URL
        if (!isSafeUrl(thumbnail)) {
          thumbnail = config.fallbackImage;
        }

        // Validate post link
        if (!isSafeUrl(post.link)) {
          return; // Skip this post if link is not safe
        }

        // Clean description - extract text without HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.description || post.content || '';
        const description = tempDiv.textContent.substring(0, 150).trim() + '...';

        // Escape all user-controlled content
        const safeTitle = escapeHtml(post.title || 'Untitled');
        const safeDescription = escapeHtml(description);
        const safeThumbnail = escapeHtml(thumbnail);
        const safeLink = escapeHtml(post.link);

        const article = `
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="${safeThumbnail}" class="card-img-top" alt="${safeTitle}" style="object-fit: cover; height: 200px;">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${safeTitle}</h5>
                <p class="card-text text-muted small">${new Date(post.pubDate).toLocaleDateString(config.locale)}</p>
                <p class="card-text">${safeDescription}</p>
                <a href="${safeLink}" class="btn btn-primary mt-auto" target="_blank">Read more</a>
              </div>
            </div>
          </div>
        `;
        articles.push(article);
      });

      // Set innerHTML once for better performance
      container.innerHTML = articles.join('');
    })
    .catch(err => {
      container.innerHTML = `<div class="col-12"><p class="text-muted">${fallbackMessage}</p></div>`;
    });
})();
