// ===== LEFT SIDEBAR =====
import { getState, navigate } from '../state.js';
import { renderAvatar } from '../utils.js';
import { icon } from '../icons.js';

const NAV_ITEMS = [
  { id: 'feed',        iconName: 'home',        label: 'Beranda',     bg: '#1877f2' },
  { id: 'profile',     iconName: 'person',      label: 'Profil',      bg: '#1877f2' },
  { id: 'friends',     iconName: 'friends',     label: 'Teman',       bg: '#1877f2' },
  { id: 'watch',       iconName: 'watch',       label: 'Watch',       bg: '#e41e3f' },
  { id: 'marketplace', iconName: 'marketplace', label: 'Marketplace', bg: '#00c6c6' },
  { id: 'groups',      iconName: 'groups',      label: 'Grup',        bg: '#1877f2' },
  { id: 'gaming',      iconName: 'gaming',      label: 'Gaming',      bg: '#7c4dff' },
  { id: 'saved',       iconName: 'saved',       label: 'Tersimpan',   bg: '#7c4dff' },
  { id: 'memories',    iconName: 'memories',    label: 'Kenangan',    bg: '#1877f2' },
  { id: 'events',      iconName: 'events',      label: 'Acara',       bg: '#e41e3f' },
];

export function renderLeftSidebar() {
  const { currentUser, currentPage } = getState();
  return `
  <div class="left-sidebar">
    <div class="sidebar-section">
      <button class="sidebar-link ${currentPage==='profile'?'active':''}" data-nav="profile">
        ${renderAvatar(currentUser.id, 'sm')}
        <span class="sidebar-link-label">${currentUser.name}</span>
      </button>
      ${NAV_ITEMS.map(item => `
      <button class="sidebar-link ${currentPage===item.id?'active':''}" data-nav="${item.id}">
        <div class="sidebar-icon-wrap" style="background:${item.bg};">
          ${icon(item.iconName, { size: 20, color: 'white' })}
        </div>
        <span class="sidebar-link-label">${item.label}</span>
      </button>`).join('')}
    </div>
    <div class="divider"></div>
    <div class="sidebar-footer">
      <a href="#">Privasi</a> · <a href="#">Ketentuan</a> · <a href="#">Iklan</a> · <a href="#">Cookie</a> · <a href="#">Lainnya</a><br>
      Fakebook © 2025
    </div>
  </div>`;
}

export function attachLeftSidebarEvents() {
  document.querySelectorAll('.sidebar-link[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}
