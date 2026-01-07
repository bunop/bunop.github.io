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

  /**
   * Build and display fallback message when posts cannot be loaded
   */
  function showFallbackMessage() {
    const encodedUsername = encodeURIComponent(config.username || '');
    
    const fallbackLink = document.createElement('a');
    fallbackLink.href = `https://medium.com/@${encodedUsername}`;
    fallbackLink.target = '_blank';
    fallbackLink.textContent = config.username || 'my Medium profile';
    
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'col-12';
    const fallbackP = document.createElement('p');
    fallbackP.className = 'text-muted';
    fallbackP.textContent = 'Unable to load Medium posts. Visit ';
    fallbackP.appendChild(fallbackLink);
    fallbackP.appendChild(document.createTextNode('.'));
    fallbackDiv.appendChild(fallbackP);
    
    container.innerHTML = '';
    container.appendChild(fallbackDiv);
  }

  const encodedUsername = encodeURIComponent(config.username || '');

  fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${encodedUsername}`)
    .then(res => res.json())
    .then(data => {
      // Validate response structure before accessing items
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        showFallbackMessage();
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

        // Clean description - extract text without HTML tags safely
        const parser = new DOMParser();
        const doc = parser.parseFromString(post.description || post.content || '', 'text/html');
        const description = (doc.body.textContent || '').substring(0, 150).trim() + '...';

        // Escape text content for safe display
        const safeTitle = escapeHtml(post.title || 'Untitled');
        const safeDescription = escapeHtml(description);

        // Create article card using DOM methods for safer URL handling
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-4 mb-4';
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100';
        
        const img = document.createElement('img');
        img.setAttribute('src', thumbnail);
        img.className = 'card-img-top';
        img.setAttribute('alt', safeTitle);
        img.style.cssText = 'object-fit: cover; height: 200px;';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column';
        
        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = post.title || 'Untitled';
        
        const date = document.createElement('p');
        date.className = 'card-text text-muted small';
        date.textContent = new Date(post.pubDate).toLocaleDateString(config.locale);
        
        const desc = document.createElement('p');
        desc.className = 'card-text';
        desc.textContent = description;
        
        const link = document.createElement('a');
        link.setAttribute('href', post.link);
        link.className = 'btn btn-primary mt-auto';
        link.setAttribute('target', '_blank');
        link.textContent = 'Read more';
        
        cardBody.appendChild(title);
        cardBody.appendChild(date);
        cardBody.appendChild(desc);
        cardBody.appendChild(link);
        
        cardDiv.appendChild(img);
        cardDiv.appendChild(cardBody);
        
        colDiv.appendChild(cardDiv);
        
        articles.push(colDiv);
      });

      // Clear container and append all articles
      container.innerHTML = '';
      articles.forEach(article => container.appendChild(article));
    })
    .catch(err => {
      showFallbackMessage();
    });
})();
