// ===== RIGHT SIDEBAR =====
import { getState, openConversation } from '../state.js';
import { getUserById, renderAvatar } from '../utils.js';
import { sponsored } from '../data.js';
import { icon } from '../icons.js';

export function renderRightSidebar() {
  const { conversations } = getState();
  return `
  <div class="right-sidebar">
    <div class="rs-section">
      <div class="rs-section-title">Disponsori</div>
      ${sponsored.map(s => `
      <div class="sponsored-item">
        <div class="sponsored-img" style="background:${s.bg}">
          <span style="font-size:36px;">${s.emoji}</span>
        </div>
        <div class="sponsored-info">
          <div class="sponsored-name">${s.name}</div>
          <div class="sponsored-domain">${s.domain}</div>
          <div class="sponsored-desc">${s.desc}</div>
        </div>
      </div>`).join('')}
    </div>

    <div class="divider"></div>

    <div class="rs-section">
      <div class="birthdays-item">
        <div class="birthday-icon-wrap">${icon('birthday', { size:24, color:'var(--fb-blue)' })}</div>
        <div class="birthdays-text">
          <strong>Mega Wati</strong> dan <strong>2 orang lainnya</strong> berulang tahun hari ini.
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="rs-section">
      <div class="rs-section-title">
        Kontak
        <div class="rs-title-actions">
          <button class="btn-icon-sm">${icon('search', { size:16 })}</button>
          <button class="btn-icon-sm">${icon('dots',   { size:16 })}</button>
        </div>
      </div>
      ${conversations.map(conv => {
        const user = getUserById(conv.userId);
        return `
        <div class="contact-item" data-conv="${conv.id}">
          <div class="contact-avatar-wrap">
            ${renderAvatar(conv.userId, 'md')}
            <div class="contact-online"></div>
          </div>
          <div class="contact-name">${user.name}</div>
          ${conv.unread > 0 ? `<div class="chat-unread-dot"></div>` : ''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

export function attachRightSidebarEvents() {
  document.querySelectorAll('.contact-item[data-conv]').forEach(item => {
    item.addEventListener('click', () => openConversation(Number(item.dataset.conv)));
  });
}
