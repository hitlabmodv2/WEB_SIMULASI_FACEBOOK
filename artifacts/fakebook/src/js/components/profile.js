// ===== PROFILE PAGE =====
import { getState } from '../state.js';
import { renderAvatar, formatNumber } from '../utils.js';
import { renderPost as renderPostCard, attachPostEvents } from './post.js';
import { users, getColor, getInitials } from '../data.js';

export function renderProfile() {
  const { currentUser, posts, friendIds } = getState();
  const myPosts = posts.filter(p => p.userId === currentUser.id);
  const myFriends = [...friendIds].map(id => users.find(u => u.id === id)).filter(Boolean);

  return `
  <div class="profile-page">
    <div class="profile-cover-wrap">
      <div class="profile-cover-img" style="background:${currentUser.coverBg||'linear-gradient(135deg,#1877f2,#00c6ff)'};">
        ${currentUser.coverEmoji||'🌆'}
      </div>
      <div class="profile-info-row">
        <div class="profile-avatar-wrap">
          <div class="avatar avatar-xxl avatar-placeholder" style="background:${getColor(currentUser.id)};width:168px;height:168px;font-size:60px;border:4px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;">
            ${getInitials(currentUser.name)}
          </div>
        </div>
        <div class="profile-name-area">
          <div class="profile-name">${currentUser.name}</div>
          <div class="profile-friends-count">${myFriends.length} teman</div>
          <div class="profile-friends-preview">
            ${myFriends.slice(0,8).map(f => renderAvatar(f.id, 'xs')).join('')}
          </div>
        </div>
        <div class="profile-actions">
          <button class="btn btn-secondary">✏️ Edit Profil</button>
          <button class="btn btn-secondary">➕ Tambahkan ke Story</button>
          <button class="btn btn-secondary">⋯</button>
        </div>
      </div>
      <div class="profile-tabs">
        <div class="profile-tab active" data-profile-tab="posts">Postingan</div>
        <div class="profile-tab" data-profile-tab="about">Tentang</div>
        <div class="profile-tab" data-profile-tab="friends">Teman</div>
        <div class="profile-tab" data-profile-tab="photos">Foto</div>
        <div class="profile-tab" data-profile-tab="videos">Video</div>
        <div class="profile-tab" data-profile-tab="more">Lainnya ▾</div>
      </div>
    </div>

    <div class="profile-content">
      <!-- Left col -->
      <div>
        <div class="intro-card">
          <h3>Intro</h3>
          <div class="intro-bio">${currentUser.bio}</div>
          <div class="intro-item"><span class="icon">💼</span>${currentUser.work}</div>
          <div class="intro-item"><span class="icon">🎓</span>Belajar di <strong>${currentUser.school}</strong></div>
          <div class="intro-item"><span class="icon">📍</span>Tinggal di <strong>${currentUser.location}</strong></div>
          <div class="intro-item"><span class="icon">❤️</span>${currentUser.relationship}</div>
          <div class="intro-item"><span class="icon">📅</span>${currentUser.joined}</div>
          <div class="btn-edit-details">Edit Detail</div>
        </div>

        <div class="photos-card">
          <div class="photos-card-header">
            <h3>Foto</h3>
            <a href="#" style="color:var(--fb-blue);font-size:15px;font-weight:600;">Lihat semua foto</a>
          </div>
          <div class="photos-grid">
            ${['🌆','🏖️','🌄','🎉','🍕','🎮','🌸','🚀','🎵'].map(e => `
            <div class="photo-thumb">${e}</div>`).join('')}
          </div>
        </div>

        <div class="friends-card">
          <div class="friends-card-header">
            <h3>Teman</h3>
            <a href="#" style="color:var(--fb-blue);font-size:15px;font-weight:600;">Lihat semua</a>
          </div>
          <div class="friends-card-count">${myFriends.length} teman</div>
          <div class="friends-grid-small">
            ${myFriends.slice(0,9).map(f => `
            <div class="friend-thumb">
              <div style="width:100%;aspect-ratio:1;border-radius:8px;background:${getColor(f.id)};display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;margin-bottom:4px;">
                ${getInitials(f.name)}
              </div>
              <div class="friend-thumb-name">${f.name.split(' ')[0]}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Right col (posts) -->
      <div>
        <div id="profile-posts-container">
          ${myPosts.length > 0
            ? myPosts.map(p => renderPostCard(p)).join('')
            : `<div class="card" style="padding:32px;text-align:center;color:var(--text-secondary);">
                <div style="font-size:48px;margin-bottom:12px;">📝</div>
                <div style="font-size:17px;font-weight:600;">Belum ada postingan</div>
              </div>`}
        </div>
      </div>
    </div>
  </div>`;
}

export function attachProfileEvents() {
  document.querySelectorAll('[data-profile-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-profile-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
  const container = document.getElementById('profile-posts-container');
  if (container) attachPostEvents(container);
}
