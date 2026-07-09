// ===== FEED =====
import { getState, on } from '../state.js';
import { renderStories, attachStoryEvents } from './stories.js';
import { renderPost, attachPostEvents } from './post.js';
import { renderCreatePostBox, attachCreatePostBoxEvents } from './createPost.js';

export function renderFeed() {
  const { posts } = getState();
  return `
  <div id="feed-container">
    ${renderStories()}
    ${renderCreatePostBox()}
    <div id="feed-posts">
      ${posts.map(p => renderPost(p)).join('')}
    </div>
  </div>`;
}

export function attachFeedEvents() {
  attachStoryEvents();
  attachCreatePostBoxEvents();
  const container = document.getElementById('feed-posts');
  if (container) attachPostEvents(container);

  on('feedUpdate', () => {
    const { posts } = getState();
    const container = document.getElementById('feed-posts');
    if (!container) return;
    container.innerHTML = posts.map(p => renderPost(p)).join('');
    attachPostEvents(container);
  });
}
