// ===== CREATE POST BOX =====
import { getState, addPost } from '../state.js';
import { renderAvatar } from '../utils.js';
import { showModal, closeModal, toast } from '../utils.js';
import { icon } from '../icons.js';

export function renderCreatePostBox() {
  const { currentUser } = getState();
  return `
  <div class="create-post-box">
    <div class="create-post-top">
      ${renderAvatar(currentUser.id, 'md')}
      <button class="create-post-input" id="open-create-post-modal">
        Apa yang kamu pikirkan, ${currentUser.name.split(' ')[0]}?
      </button>
    </div>
    <div class="create-post-divider"></div>
    <div class="create-post-actions">
      <button class="create-post-action" id="open-post-photo">
        ${icon('photo', { size:22, color:'#45bd62' })}
        <span>Foto/Video</span>
      </button>
      <button class="create-post-action" id="open-post-feeling">
        ${icon('feeling', { size:22, color:'#f7b928' })}
        <span>Perasaan/Aktivitas</span>
      </button>
      <button class="create-post-action" id="open-post-live">
        ${icon('live', { size:22, color:'#f02849' })}
        <span>Live Video</span>
      </button>
    </div>
  </div>`;
}

export function attachCreatePostBoxEvents() {
  document.getElementById('open-create-post-modal')?.addEventListener('click', openCreatePostModal);
  document.getElementById('open-post-photo')?.addEventListener('click', openCreatePostModal);
  document.getElementById('open-post-feeling')?.addEventListener('click', openCreatePostModal);
  document.getElementById('open-post-live')?.addEventListener('click', () => toast('Fitur Live Video segera hadir!'));
}

export function openCreatePostModal() {
  const { currentUser } = getState();
  const overlay = showModal(`
    <div class="modal create-post-modal">
      <div class="modal-header">
        <div class="modal-title">Buat Postingan</div>
        <div class="modal-close" id="close-post-modal">✕</div>
      </div>
      <div class="modal-body">
        <div class="post-author-row">
          ${renderAvatar(currentUser.id, 'lg')}
          <div>
            <div style="font-weight:700;font-size:15px;">${currentUser.name}</div>
            <div class="audience-btn">
              ${icon('globe', { size:12 })} Semua orang ▾
            </div>
          </div>
        </div>
        <textarea id="post-text-input" placeholder="Apa yang kamu pikirkan, ${currentUser.name.split(' ')[0]}?" autofocus></textarea>
        <div class="add-to-post-row">
          <span class="add-to-post-label">Tambahkan ke postinganmu</span>
          <div class="add-to-post-icons">
            <div class="add-to-post-icon-btn green" title="Foto/Video">${icon('photo', { size:22 })}</div>
            <div class="add-to-post-icon-btn blue"  title="Tag Teman">${icon('tag', { size:22 })}</div>
            <div class="add-to-post-icon-btn yellow" title="Perasaan">${icon('feeling', { size:22 })}</div>
            <div class="add-to-post-icon-btn red"   title="Live">${icon('live', { size:22 })}</div>
            <div class="add-to-post-icon-btn gray"  title="Lainnya">${icon('dots', { size:22 })}</div>
          </div>
        </div>
        <button class="btn-post" id="submit-post-btn" disabled>Posting</button>
      </div>
    </div>`);

  const textarea  = overlay.querySelector('#post-text-input');
  const submitBtn = overlay.querySelector('#submit-post-btn');

  textarea?.addEventListener('input', () => {
    submitBtn.disabled = !textarea.value.trim();
    textarea.style.fontSize = textarea.value.length > 85 ? '17px' : '24px';
  });

  submitBtn?.addEventListener('click', () => {
    const text = textarea?.value?.trim();
    if (text) {
      addPost(text);
      closeModal(overlay);
      toast('Postingan berhasil dibuat!');
    }
  });

  overlay.querySelector('#close-post-modal')?.addEventListener('click', () => closeModal(overlay));
}
