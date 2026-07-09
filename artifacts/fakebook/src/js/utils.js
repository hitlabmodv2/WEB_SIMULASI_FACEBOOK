// ===== UTILITY FUNCTIONS =====
import { getColor, getInitials, users, currentUser } from './data.js';

export function getUserById(id) {
  if (id === currentUser.id) return currentUser;
  return users.find(u => u.id === id) || { id, name: 'Pengguna', bio: '' };
}

export function renderAvatar(userId, size = 'md', extraClass = '') {
  const user = getUserById(userId);
  const color = getColor(userId);
  const initials = getInitials(user.name);
  return `<div class="avatar avatar-${size} avatar-placeholder ${extraClass}" 
    style="background:${color};width:${sizeMap[size]};height:${sizeMap[size]};font-size:${fontMap[size]};border-radius:50%;flex-shrink:0;">${initials}</div>`;
}

const sizeMap = { xs:'28px', sm:'36px', md:'40px', lg:'48px', xl:'72px', xxl:'168px' };
const fontMap = { xs:'11px', sm:'14px', md:'16px', lg:'18px', xl:'28px', xxl:'60px' };

export function timeAgo(str) {
  // Already formatted strings from data
  return str;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

export function truncate(str, len = 100) {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
  return String(n);
}

export function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay);
  });
  return overlay;
}

export function closeModal(overlay) {
  if (!overlay) return;
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.15s';
  setTimeout(() => overlay.remove(), 150);
}

export function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${type==='error'?'#e74c3c':'#27ae60'};color:white;
    padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;
    box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;
    animation:fadeIn 0.2s ease-out both;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(()=>el.remove(),300); }, 2500);
}
