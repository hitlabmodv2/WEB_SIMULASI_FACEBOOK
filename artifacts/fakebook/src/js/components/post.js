// ===== POST CARD =====
import { getState, toggleLike, addComment } from '../state.js';
import { getUserById, renderAvatar, formatNumber, escapeHtml } from '../utils.js';
import { icon } from '../icons.js';

const REACTIONS = ['👍','❤️','😂','😮','😢','😡'];

export function renderPost(post) {
  const { currentUser } = getState();
  const author  = getUserById(post.userId);
  const liked   = post.likedBy.has(currentUser.id);

  const topReactions = REACTIONS.slice(0, 3).map(r =>
    `<span class="reaction-icon-badge">${r}</span>`
  ).join('');

  return `
  <div class="post-card fade-in" data-post-id="${post.id}">

    <!-- Header -->
    <div class="post-header">
      <div class="post-avatar">${renderAvatar(post.userId, 'md')}</div>
      <div class="post-header-info">
        <div class="post-author">${escapeHtml(author.name)}</div>
        <div class="post-meta">
          <span>${post.time}</span>
          <span class="meta-dot">·</span>
          ${icon('globe', { size: 13, cls: 'globe-svg' })}
        </div>
      </div>
      <button class="post-opts-btn" data-post-opts="${post.id}">${icon('dots', { size: 20 })}</button>
    </div>

    <!-- Body -->
    <div class="post-body">
      <p class="post-text ${post.text.length < 80 ? 'post-text-large' : ''}">${escapeHtml(post.text)}</p>
    </div>

    ${post.imageEmoji ? `<div class="post-img-placeholder"><span>${post.imageEmoji}</span></div>` : ''}

    <!-- Stats -->
    ${post.likes > 0 || post.comments.length > 0 ? `
    <div class="post-stats">
      ${post.likes > 0 ? `
      <div class="post-stats-reactions">
        <div class="reaction-badges">${topReactions}</div>
        <span class="stats-count">${formatNumber(post.likes)}</span>
      </div>` : '<div></div>'}
      ${post.comments.length > 0 ? `
      <button class="stats-comments-btn" data-toggle-comments="${post.id}">
        ${post.comments.length} komentar
      </button>` : ''}
    </div>` : ''}

    <!-- Action buttons -->
    <div class="post-actions-bar">
      <!-- Like with reactions popup -->
      <div class="post-action-wrap">
        <button class="post-action-btn ${liked ? 'liked' : ''}" data-like="${post.id}">
          ${liked
            ? icon('like', { size: 20 })
            : icon('likeOutline', { size: 20 })
          }
          <span>${liked ? 'Suka' : 'Suka'}</span>
        </button>
        <div class="reactions-popup" data-reactions="${post.id}">
          ${REACTIONS.map(r =>
            `<button class="reaction-btn" data-reaction="${r}" data-post="${post.id}">${r}</button>`
          ).join('')}
        </div>
      </div>

      <button class="post-action-btn" data-toggle-comments="${post.id}">
        ${icon('comment', { size: 20 })}
        <span>Komentar</span>
      </button>

      <button class="post-action-btn" data-share="${post.id}">
        ${icon('share', { size: 20 })}
        <span>Bagikan</span>
      </button>
    </div>

    <!-- Comments section (hidden by default) -->
    <div class="post-comments-wrap" id="comments-${post.id}" style="display:none;">
      <div class="post-comments-list" id="comments-list-${post.id}">
        ${post.comments.map(c => renderComment(c)).join('')}
      </div>
      <div class="comment-input-row">
        ${renderAvatar(currentUser.id, 'sm')}
        <div class="comment-input-box">
          <input
            type="text"
            class="comment-input"
            data-comment-for="${post.id}"
            placeholder="Tulis komentar…"
            autocomplete="off"
          />
        </div>
      </div>
    </div>

  </div>`;
}

function renderComment(c) {
  const user = getUserById(c.userId);
  return `
  <div class="comment-row">
    ${renderAvatar(c.userId, 'sm')}
    <div>
      <div class="comment-bubble">
        <span class="comment-author">${escapeHtml(user.name)}</span>
        <span class="comment-text">${escapeHtml(c.text)}</span>
      </div>
      <div class="comment-actions-row">
        <button class="comment-action">Suka</button>
        <button class="comment-action">Balas</button>
        <span class="comment-time">${c.time}</span>
      </div>
    </div>
  </div>`;
}

export function attachPostEvents(container) {
  if (!container) return;

  // Like button
  container.querySelectorAll('[data-like]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const postId = Number(btn.dataset.like);
      toggleLike(postId);
      refreshPost(postId);
    });
  });

  // Reaction popup (hover via CSS, click via JS)
  container.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const postId = Number(btn.dataset.post);
      toggleLike(postId);
      refreshPost(postId);
    });
  });

  // Toggle comments
  container.querySelectorAll('[data-toggle-comments]').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.toggleComments;
      const wrap = document.getElementById(`comments-${postId}`);
      if (!wrap) return;
      const isHidden = wrap.style.display === 'none';
      wrap.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        const input = wrap.querySelector('.comment-input');
        input?.focus();
      }
    });
  });

  // Submit comment on Enter
  container.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const postId = Number(input.dataset.commentFor);
        const text   = input.value.trim();
        if (!text) return;
        addComment(postId, text);
        input.value = '';
        // Append comment directly without full refresh
        const list = document.getElementById(`comments-list-${postId}`);
        const { posts } = getState();
        const post = posts.find(p => p.id === postId);
        if (list && post) {
          const newComment = post.comments[post.comments.length - 1];
          list.insertAdjacentHTML('beforeend', renderComment(newComment));
          // Update stats counter
          const statsBtn = document.querySelector(`[data-toggle-comments="${postId}"]`);
          if (statsBtn && statsBtn.classList.contains('stats-comments-btn')) {
            statsBtn.textContent = `${post.comments.length} komentar`;
          }
        }
      }
    });
  });

  // Share (toast)
  container.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../utils.js').then(({ toast }) => toast('Link postingan disalin!'));
    });
  });
}

function refreshPost(postId) {
  const { posts } = getState();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const el = document.querySelector(`[data-post-id="${postId}"]`);
  if (!el) return;

  // Remember if comments were open
  const commentsWrap = el.querySelector('.post-comments-wrap');
  const commentsVisible = commentsWrap && commentsWrap.style.display !== 'none';

  const tmpDiv = document.createElement('div');
  tmpDiv.innerHTML = renderPost(post);
  const newEl = tmpDiv.firstElementChild;
  el.replaceWith(newEl);

  // Restore comments visibility
  if (commentsVisible) {
    const newWrap = document.getElementById(`comments-${postId}`);
    if (newWrap) newWrap.style.display = 'block';
  }

  // Re-attach events just for this card
  attachPostEvents(newEl);
}
