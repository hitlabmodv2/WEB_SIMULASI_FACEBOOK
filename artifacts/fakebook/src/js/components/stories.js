// ===== STORIES =====
import { getState } from '../state.js';
import { getUserById, renderAvatar } from '../utils.js';
import { stories, getColor } from '../data.js';
import { showModal, closeModal } from '../utils.js';
import { icon } from '../icons.js';

const STORY_GRADIENTS = [
  'linear-gradient(135deg,#1877f2,#00c6ff)',
  'linear-gradient(135deg,#f02849,#ff6b6b)',
  'linear-gradient(135deg,#42b72a,#00e676)',
  'linear-gradient(135deg,#7c4dff,#e040fb)',
  'linear-gradient(135deg,#ff9800,#ffc107)',
  'linear-gradient(135deg,#009688,#4dd0e1)',
];

export function renderStories() {
  const { currentUser } = getState();
  return `
  <div class="stories-row">
    <!-- Create story card -->
    <div class="story-card story-create-card" id="create-story-btn">
      <div class="story-create-photo">
        ${renderAvatar(currentUser.id, 'xl')}
      </div>
      <div class="story-create-footer">
        <div class="story-create-plus">${icon('plus', { size: 18, color: 'white' })}</div>
        <span>Buat Story</span>
      </div>
    </div>

    ${stories.map((s, i) => {
      const user = getUserById(s.userId);
      const grad = STORY_GRADIENTS[i % STORY_GRADIENTS.length];
      return `
      <div class="story-card" data-story="${s.id}">
        <div class="story-bg" style="background:${grad};">
          <div class="story-text-content">${s.text}</div>
        </div>
        <div class="story-gradient-overlay"></div>
        <div class="story-avatar-ring">${renderAvatar(s.userId, 'sm')}</div>
        <div class="story-username">${user.name.split(' ')[0]}</div>
      </div>`;
    }).join('')}
  </div>`;
}

export function attachStoryEvents() {
  document.querySelectorAll('.story-card[data-story]').forEach(card => {
    card.addEventListener('click', () => {
      const storyId = Number(card.dataset.story);
      const story   = stories.find(s => s.id === storyId);
      if (!story) return;
      openStoryViewer(story, getUserById(story.userId));
    });
  });

  document.getElementById('create-story-btn')?.addEventListener('click', () => {
    const overlay = showModal(`
      <div class="modal" style="max-width:400px;">
        <div class="modal-header">
          <div class="modal-title">Buat Story</div>
          <div class="modal-close" id="cls-story">✕</div>
        </div>
        <div class="modal-body" style="text-align:center;padding:40px 24px;">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--hover-blue);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">${icon('camera', { size:36, color:'var(--fb-blue)' })}</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Bagikan momenmu!</div>
          <div style="font-size:15px;color:var(--text-secondary);">Fitur story akan segera hadir.</div>
        </div>
      </div>`);
    overlay.querySelector('#cls-story')?.addEventListener('click', () => closeModal(overlay));
  });
}

function openStoryViewer(story, user) {
  const i   = stories.findIndex(s => s.id === story.id);
  const grad= STORY_GRADIENTS[i % STORY_GRADIENTS.length];
  const ov  = document.createElement('div');
  ov.className = 'story-viewer';
  ov.innerHTML = `
    <div class="story-viewer-inner" style="background:${grad};">
      <div class="story-progress-bar"><div class="story-progress-fill"></div></div>
      <div class="story-viewer-header">
        ${renderAvatar(story.userId, 'sm')}
        <div>
          <div class="story-viewer-name">${user.name}</div>
          <div class="story-viewer-time">Baru saja</div>
        </div>
      </div>
      <div class="story-viewer-body">${story.text}</div>
      <div class="story-viewer-close">✕</div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('.story-viewer-close')?.addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  setTimeout(() => ov.remove(), 5500);
}
