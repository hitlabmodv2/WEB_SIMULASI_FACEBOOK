// ===== MAIN ENTRY POINT =====
import { getState, navigate, on } from './state.js';
import { renderNavbar, attachNavbarEvents } from './components/navbar.js';
import { renderLeftSidebar, attachLeftSidebarEvents } from './components/leftSidebar.js';
import { renderRightSidebar, attachRightSidebarEvents } from './components/rightSidebar.js';
import { renderFeed, attachFeedEvents } from './components/feed.js';
import { renderProfile, attachProfileEvents } from './components/profile.js';
import { renderFriends, attachFriendsEvents } from './components/friends.js';
import { renderNotifications, attachNotificationsEvents } from './components/notifications.js';
import { renderMessenger, attachMessengerEvents } from './components/messenger.js';
import { getInitials, getColor } from './data.js';

const app = document.getElementById('app');

// ===== LOGIN PAGE =====
function renderLoginPage() {
  return `
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="login-brand">fakebook</div>
        <div class="login-tagline">Fakebook membantu kamu terhubung dan berbagi dengan orang-orang dalam kehidupanmu.</div>
      </div>
      <div class="login-card">
        <div class="form-group">
          <input type="text" id="login-email" placeholder="Email atau nomor telepon" value="demo@fakebook.com" />
        </div>
        <div class="form-group">
          <input type="password" id="login-password" placeholder="Kata sandi" value="password123" />
        </div>
        <button class="btn-login" id="login-btn">Masuk</button>
        <a href="#" class="login-forgot">Lupa kata sandi?</a>
        <div class="login-divider"></div>
        <button class="btn-create-account" id="register-btn">Buat Akun Baru</button>
      </div>
    </div>
  </div>`;
}

function attachLoginEvents() {
  document.getElementById('login-btn')?.addEventListener('click', () => {
    const email = document.getElementById('login-email')?.value;
    const pass  = document.getElementById('login-password')?.value;
    if (email && pass) {
      sessionStorage.setItem('fb_logged_in', '1');
      renderApp();
    }
  });

  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn')?.click();
  });

  document.getElementById('register-btn')?.addEventListener('click', () => {
    showRegisterModal();
  });
}

function showRegisterModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal register-modal-content" style="max-width:432px;">
      <div class="modal-header">
        <div class="modal-title">Daftar</div>
        <div class="modal-close" id="close-register">✕</div>
      </div>
      <div class="modal-body">
        <div class="subtitle">Cepat dan mudah.</div>
        <div class="divider"></div>
        <div class="name-row">
          <input type="text" placeholder="Nama depan" />
          <input type="text" placeholder="Nama belakang" />
        </div>
        <input type="text" placeholder="Nomor ponsel atau email" />
        <input type="password" placeholder="Kata sandi baru" />
        <div class="dob-label">Tanggal lahir</div>
        <div class="dob-row">
          <select><option>Jan</option><option>Feb</option><option>Mar</option><option>Apr</option><option>Mei</option><option>Jun</option><option>Jul</option><option>Agu</option><option>Sep</option><option>Okt</option><option>Nov</option><option>Des</option></select>
          <select>${Array.from({length:31},(_,i)=>`<option>${i+1}</option>`).join('')}</select>
          <select>${Array.from({length:50},(_,i)=>`<option>${2025-i}</option>`).join('')}</select>
        </div>
        <div class="gender-label">Jenis kelamin</div>
        <div class="gender-row">
          <div class="gender-option">Perempuan <input type="radio" name="gender" value="f" /></div>
          <div class="gender-option">Laki-laki <input type="radio" name="gender" value="m" /></div>
          <div class="gender-option">Kustom <input type="radio" name="gender" value="c" /></div>
        </div>
        <div class="terms-text">
          Dengan mengklik Daftar, kamu menyetujui <a href="#">Ketentuan</a>,
          <a href="#">Kebijakan Privasi</a>, dan <a href="#">Kebijakan Cookie</a> kami.
        </div>
        <button class="btn-register-submit">Daftar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#close-register')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('.btn-register-submit')?.addEventListener('click', () => {
    overlay.remove();
    sessionStorage.setItem('fb_logged_in', '1');
    renderApp();
  });
}

// ===== MAIN APP =====
function renderApp() {
  const { currentPage, activeConversationId } = getState();
  app.innerHTML = `
    ${renderNavbar()}
    <div class="app-layout">
      <div class="left-sidebar-col">${renderLeftSidebar()}</div>
      <main class="center-content" id="main-content">
        ${renderPageContent(currentPage)}
      </main>
      <div class="right-sidebar-col">${renderRightSidebar()}</div>
    </div>
    ${renderMessenger()}`;

  attachNavbarEvents();
  attachLeftSidebarEvents();
  attachRightSidebarEvents();
  attachPageEvents(currentPage);
  attachMessengerEvents();

  // Navigate handler — re-render center only
  on('navigate', (page) => {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = renderPageContent(page);
      attachPageEvents(page);
    }
    // Update left sidebar active states
    document.querySelectorAll('.sidebar-link[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === page);
    });
  });
}

function renderPageContent(page) {
  switch (page) {
    case 'feed':           return `<div id="page-feed">${renderFeed()}</div>`;
    case 'profile':        return `<div id="page-profile">${renderProfile()}</div>`;
    case 'friends':        return `<div id="page-friends">${renderFriends()}</div>`;
    case 'notifications':  return `<div id="page-notifications">${renderNotifications()}</div>`;
    default: return renderGenericPage(page);
  }
}

function renderGenericPage(page) {
  const labels = {
    watch:       { icon:'▶️', title:'Watch', desc:'Tonton video dari teman dan halaman yang kamu ikuti.' },
    marketplace: { icon:'🛍️', title:'Marketplace', desc:'Beli dan jual barang di komunitasmu.' },
    groups:      { icon:'📌', title:'Grup', desc:'Bergabung dan buat grup untuk berbagi topik favoritmu.' },
    gaming:      { icon:'🎮', title:'Gaming', desc:'Mainkan game favorit dan terhubung dengan gamer lain.' },
    saved:       { icon:'🔖', title:'Tersimpan', desc:'Lihat semua postingan yang kamu simpan.' },
    memories:    { icon:'🕰️', title:'Kenangan', desc:'Lihat kembali momen-momen berharga dari masa lalu.' },
    events:      { icon:'📅', title:'Acara', desc:'Temukan dan buat acara di dekat lokasimu.' },
  };
  const p = labels[page] || { icon:'🚀', title: page, desc:'Halaman ini sedang dalam pengembangan.' };
  return `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:16px;padding:32px;">
    <div style="font-size:80px;">${p.icon}</div>
    <div style="font-size:24px;font-weight:800;color:var(--text-primary);">${p.title}</div>
    <div style="font-size:17px;color:var(--text-secondary);max-width:360px;line-height:1.5;">${p.desc}</div>
    <button class="btn btn-primary" onclick="window.navigate('feed')">Kembali ke Beranda</button>
  </div>`;
}

function attachPageEvents(page) {
  switch (page) {
    case 'feed':          attachFeedEvents(); break;
    case 'profile':       attachProfileEvents(); break;
    case 'friends':       attachFriendsEvents(); break;
    case 'notifications': attachNotificationsEvents(); break;
  }
}

// Global navigate helper for inline onclick
window.navigate = navigate;

// ===== BOOT =====
function boot() {
  renderApp(); // DEV: skip login
}

boot();
