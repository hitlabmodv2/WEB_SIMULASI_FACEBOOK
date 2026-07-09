// ===== NOTIFICATIONS PAGE =====
import { getState, markNotifsRead } from '../state.js';
import { getUserById, renderAvatar } from '../utils.js';

const TYPE_ICONS = { like:'👍', comment:'💬', friend:'👥', tag:'🏷️', share:'↗️', birthday:'🎂' };

export function renderNotifications() {
  const { notifications } = getState();
  markNotifsRead();
  const unread = notifications.filter(n => n.unread);
  const read   = notifications.filter(n => !n.unread);

  return `
  <div class="notifications-page">
    <div class="notifications-page-header">
      <div class="notifications-page-title">Notifikasi</div>
      <button class="btn btn-secondary" style="font-size:14px;padding:6px 12px;" id="mark-all-read-page">
        Tandai semua dibaca
      </button>
    </div>

    ${unread.length > 0 ? `
    <div class="notif-section-title">Baru</div>
    ${unread.map(n => renderNotifItem(n)).join('')}` : ''}

    ${read.length > 0 ? `
    <div class="notif-section-title">Sebelumnya</div>
    ${read.map(n => renderNotifItem(n)).join('')}` : ''}
  </div>`;
}

function renderNotifItem(n) {
  const user = getUserById(n.userId);
  return `
  <div class="notif-item ${n.unread ? 'unread' : ''}" data-notif="${n.id}">
    <div class="notif-avatar-wrap">
      ${renderAvatar(n.userId, 'lg')}
      <div class="notif-type-icon ${n.type}">${TYPE_ICONS[n.type]||'🔔'}</div>
    </div>
    <div class="notif-content">
      <div class="notif-text"><strong>${user.name}</strong> ${n.text}</div>
      <div class="notif-time">${n.time}</div>
    </div>
    ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
    <div class="notif-options">⋯</div>
  </div>`;
}

export function attachNotificationsEvents() {
  document.getElementById('mark-all-read-page')?.addEventListener('click', () => {
    markNotifsRead();
    document.querySelectorAll('.notif-item.unread').forEach(el => {
      el.classList.remove('unread');
      el.querySelector('.notif-unread-dot')?.remove();
    });
  });
}
