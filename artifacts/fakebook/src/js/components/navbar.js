// ===== NAVBAR =====
import { getState, navigate, markNotifsRead, on } from '../state.js';
import { renderAvatar } from '../utils.js';
import { users } from '../data.js';
import { icon } from '../icons.js';

export function renderNavbar() {
  const { currentUser, notifications, conversations } = getState();
  const unreadNotifs = notifications.filter(n => n.unread).length;
  const unreadMsgs   = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return `
  <nav class="navbar">
    <!-- Left -->
    <div class="navbar-left">
      <div class="navbar-logo" id="nav-logo">
        <span class="logo-f">f</span>
      </div>
      <div class="navbar-search">
        ${icon('search', { size: 16, cls: 'search-icon-svg' })}
        <input type="text" id="navbar-search-input" placeholder="Cari di Fakebook" autocomplete="off" />
      </div>
    </div>

    <!-- Center tabs -->
    <div class="navbar-tabs">
      <button class="navbar-tab" data-tab="feed"        title="Beranda">${icon('home',        { size: 24 })}</button>
      <button class="navbar-tab" data-tab="friends"     title="Teman">${icon('friends',     { size: 24 })}</button>
      <button class="navbar-tab" data-tab="watch"       title="Watch">${icon('watch',       { size: 24 })}</button>
      <button class="navbar-tab" data-tab="marketplace" title="Marketplace">${icon('marketplace', { size: 24 })}</button>
      <button class="navbar-tab" data-tab="groups"      title="Grup">${icon('groups',      { size: 24 })}</button>
    </div>

    <!-- Right actions -->
    <div class="navbar-right">
      <button class="navbar-profile-btn" id="nav-profile-btn">
        ${renderAvatar(currentUser.id, 'sm')}
        <span>${currentUser.name.split(' ')[0]}</span>
      </button>

      <button class="navbar-icon-btn" id="nav-menu-btn"  title="Menu">${icon('menu',       { size: 20 })}</button>
      <button class="navbar-icon-btn" id="nav-msg-btn"   title="Messenger" style="position:relative;">
        ${icon('msg', { size: 20 })}
        ${unreadMsgs > 0 ? `<span class="nav-badge">${unreadMsgs}</span>` : ''}
      </button>
      <button class="navbar-icon-btn notif-trigger" id="nav-notif-btn" title="Notifikasi" style="position:relative;">
        ${icon('bell', { size: 20 })}
        ${unreadNotifs > 0 ? `<span class="nav-badge" id="notif-badge">${unreadNotifs}</span>` : ''}

        <!-- Notification dropdown -->
        <div class="navbar-dropdown" id="notif-dropdown" onclick="event.stopPropagation()">
          <div class="dropdown-header">
            <span>Notifikasi</span>
            <button class="mark-read-btn" id="mark-all-read">Tandai semua dibaca</button>
          </div>
          <div id="notif-list">${renderNotifList()}</div>
          <div class="dropdown-footer" id="nav-notif-page">Lihat semua notifikasi</div>
        </div>
      </button>
      <button class="navbar-icon-btn" id="nav-account-btn" title="Akun">${icon('chevronDown', { size: 20 })}</button>
    </div>
  </nav>`;
}

function renderNotifList() {
  const { notifications } = getState();
  const typeIcons = { like:'👍', comment:'💬', friend:'👥', tag:'🏷️', share:'↗️', birthday:'🎂' };
  return notifications.slice(0, 8).map(n => {
    const user = users.find(u => u.id === n.userId) || { name: 'Pengguna', id: n.userId };
    return `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <div class="notif-avatar-wrap">
        ${renderAvatar(n.userId, 'lg')}
        <span class="notif-type-badge">${typeIcons[n.type] || '🔔'}</span>
      </div>
      <div class="notif-body">
        <span class="notif-text"><strong>${user.name}</strong> ${n.text}</span>
        <span class="notif-time">${n.time}</span>
      </div>
      ${n.unread ? '<div class="notif-dot"></div>' : ''}
    </div>`;
  }).join('');
}

export function attachNavbarEvents() {
  document.getElementById('nav-logo')?.addEventListener('click', () => goTo('feed'));
  document.getElementById('nav-profile-btn')?.addEventListener('click', () => goTo('profile'));

  // Nav tabs
  document.querySelectorAll('.navbar-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => goTo(tab.dataset.tab));
  });

  // Notification dropdown toggle
  const notifBtn = document.getElementById('nav-notif-btn');
  const notifDD  = document.getElementById('notif-dropdown');
  notifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = notifDD?.classList.toggle('open');
    if (isOpen) {
      markNotifsRead();
      document.getElementById('notif-badge')?.remove();
    }
  });

  document.getElementById('mark-all-read')?.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    markNotifsRead();
    document.querySelectorAll('.notif-item.unread').forEach(el => {
      el.classList.remove('unread');
      el.querySelector('.notif-dot')?.remove();
    });
    document.getElementById('notif-badge')?.remove();
  });

  document.getElementById('nav-notif-page')?.addEventListener('click', e => {
    e.stopPropagation();
    notifDD?.classList.remove('open');
    goTo('notifications');
  });

  document.getElementById('nav-msg-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    import('./messenger.js').then(({ openMessenger }) => openMessenger?.());
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.navbar-dropdown.open').forEach(d => d.classList.remove('open'));
  });

  // Sync active tab on navigate
  on('navigate', page => {
    document.querySelectorAll('.navbar-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.navbar-tab[data-tab="${page}"]`)?.classList.add('active');
  });
}

function goTo(page) {
  document.querySelectorAll('.navbar-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.navbar-tab[data-tab="${page}"]`)?.classList.add('active');
  navigate(page);
}
