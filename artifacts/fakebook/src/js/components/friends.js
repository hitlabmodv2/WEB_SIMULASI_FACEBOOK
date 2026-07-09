// ===== FRIENDS PAGE =====
import { getState, acceptFriendRequest, declineFriendRequest } from '../state.js';
import { getUserById, renderAvatar, toast } from '../utils.js';
import { users, getColor, getInitials } from '../data.js';

export function renderFriends() {
  const { friendIds, requestIds } = getState();
  const requests = [...requestIds].map(id => users.find(u => u.id === id)).filter(Boolean);
  const myFriends = [...friendIds].map(id => users.find(u => u.id === id)).filter(Boolean);
  const suggestions = users.filter(u => u.id !== 1 && !friendIds.has(u.id) && !requestIds.has(u.id));

  return `
  <div class="friends-page">
    <div class="friends-page-title">Teman</div>

    ${requests.length > 0 ? `
    <div class="friends-section-title">Permintaan Pertemanan (${requests.length})</div>
    <div class="friend-requests-list">
      ${requests.map(u => renderFriendRequestCard(u)).join('')}
    </div>` : ''}

    <div class="friends-section-title">Orang yang Mungkin Kamu Kenal</div>
    <div class="people-scroll">
      ${suggestions.map(u => renderSuggestionCard(u)).join('')}
    </div>

    ${myFriends.length > 0 ? `
    <div class="friends-section-title">Semua Teman (${myFriends.length})</div>
    <div class="all-friends-list">
      ${myFriends.map(u => renderAllFriendItem(u)).join('')}
    </div>` : ''}
  </div>`;
}

function renderFriendRequestCard(user) {
  return `
  <div class="friend-card">
    <div class="friend-card-avatar" style="background:${getColor(user.id)};">
      <span style="font-size:56px;font-weight:700;color:white;">${getInitials(user.name)}</span>
    </div>
    <div class="friend-card-body">
      <div class="friend-card-name">${user.name}</div>
      <div class="friend-card-mutual">${user.mutual} teman bersama</div>
      <div class="friend-card-actions">
        <button class="btn-confirm" data-accept="${user.id}">Konfirmasi</button>
        <button class="btn-delete" data-decline="${user.id}">Hapus</button>
      </div>
    </div>
  </div>`;
}

function renderSuggestionCard(user) {
  return `
  <div class="friend-card">
    <div class="friend-card-avatar" style="background:${getColor(user.id)};">
      <span style="font-size:56px;font-weight:700;color:white;">${getInitials(user.name)}</span>
    </div>
    <div class="friend-card-body">
      <div class="friend-card-name">${user.name}</div>
      <div class="friend-card-mutual">${user.mutual} teman bersama · ${user.location}</div>
      <div class="friend-card-actions">
        <button class="btn-add-friend" data-add="${user.id}">Tambah Teman</button>
        <button class="btn-delete" data-remove="${user.id}">Hapus</button>
      </div>
    </div>
  </div>`;
}

function renderAllFriendItem(user) {
  return `
  <div class="all-friend-item">
    ${renderAvatar(user.id, 'lg')}
    <div class="all-friend-info">
      <div class="all-friend-name">${user.name}</div>
      <div class="all-friend-mutual">${user.mutual} teman bersama · ${user.location}</div>
    </div>
    <div class="all-friend-actions">
      <button class="btn btn-secondary" style="padding:6px 12px;font-size:14px;">Pesan</button>
      <button class="btn btn-secondary" style="padding:6px 12px;font-size:14px;">⋯</button>
    </div>
  </div>`;
}

export function attachFriendsEvents() {
  document.querySelectorAll('[data-accept]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.accept);
      const user = getUserById(id);
      acceptFriendRequest(id);
      toast(`Kamu dan ${user.name} sekarang berteman! 🎉`);
      rerenderFriends();
    });
  });

  document.querySelectorAll('[data-decline]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.decline);
      declineFriendRequest(id);
      rerenderFriends();
    });
  });

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.add);
      const user = getUserById(id);
      btn.textContent = 'Permintaan Terkirim';
      btn.className = 'btn-added';
      btn.disabled = true;
      toast(`Permintaan pertemanan dikirim ke ${user.name}! 👋`);
    });
  });

  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.friend-card');
      if (card) { card.style.opacity = '0'; card.style.transition = 'opacity 0.2s'; setTimeout(() => card.remove(), 200); }
    });
  });
}

function rerenderFriends() {
  const page = document.getElementById('page-friends');
  if (page) {
    page.innerHTML = renderFriends();
    attachFriendsEvents();
  }
}
