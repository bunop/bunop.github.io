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

  // Build fallback message dynamically
  const fallbackMessage = `Unable to load Medium posts. Visit <a href="https://medium.com/@${config.username}" target="_blank">my Medium profile</a>.`;

  fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${config.username}`)
    .then(res => res.json())
    .then(data => {
      const posts = data.items.slice(0, config.maxPosts);

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

        // Clean description - extract text without HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.description || post.content || '';
        const description = tempDiv.textContent.substring(0, 150).trim() + '...';

        const article = `
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="${thumbnail}" class="card-img-top" alt="${post.title}" style="object-fit: cover; height: 200px;">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${post.title}</h5>
                <p class="card-text text-muted small">${new Date(post.pubDate).toLocaleDateString(config.locale)}</p>
                <p class="card-text">${description}</p>
                <a href="${post.link}" class="btn btn-primary mt-auto" target="_blank">Read more</a>
              </div>
            </div>
          </div>
        `;
        container.innerHTML += article;
      });
    })
    .catch(err => {
      container.innerHTML = `<div class="col-12"><p class="text-muted">${fallbackMessage}</p></div>`;
    });
})();
