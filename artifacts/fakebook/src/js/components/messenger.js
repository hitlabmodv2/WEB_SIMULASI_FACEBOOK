// ===== MESSENGER =====
import { getState, sendMessage, openConversation, toggleMessengerOpen, on } from '../state.js';
import { getUserById, renderAvatar, escapeHtml } from '../utils.js';

export function renderMessenger() {
  const { activeConversationId, messengerOpen, conversations } = getState();
  const conv = conversations.find(c => c.id === activeConversationId) || conversations[0];
  if (!conv) return '';
  const user = getUserById(conv.userId);

  return `
  <div class="messenger-popup ${messengerOpen ? 'open' : ''}" id="messenger-popup">
    <div class="messenger-header" id="messenger-toggle">
      <div class="messenger-header-info">
        <div class="messenger-header-avatar">${renderAvatar(conv.userId, 'md')}</div>
        <div>
          <div class="messenger-header-title">${user.name}</div>
          <div class="messenger-header-status">● Online</div>
        </div>
      </div>
      <div class="messenger-header-actions">
        <div class="btn-icon" style="font-size:16px;">📞</div>
        <div class="btn-icon" style="font-size:16px;">📹</div>
        <div class="btn-icon" style="font-size:16px;">⋯</div>
      </div>
    </div>
    <div class="messenger-body" id="messenger-body">
      ${conv.messages.map(m => renderMessage(m, conv.userId)).join('')}
    </div>
    <div class="messenger-footer">
      <div class="btn-icon" style="font-size:18px;">➕</div>
      <div class="btn-icon" style="font-size:18px;">🖼️</div>
      <div class="btn-icon" style="font-size:18px;">😊</div>
      <div class="messenger-input-wrap">
        <input type="text" placeholder="Aa" id="messenger-input" />
      </div>
      <div class="msg-send-btn" id="msg-send-btn">➤</div>
    </div>
  </div>`;
}

function renderMessage(msg, otherUserId) {
  const isMine = msg.from !== otherUserId;
  return `
  <div class="msg-group ${isMine ? 'mine' : 'theirs'}">
    ${!isMine ? renderAvatar(msg.from, 'xs') : ''}
    <div class="msg-bubble">${escapeHtml(msg.text)}</div>
  </div>`;
}

function scrollToBottom() {
  const body = document.getElementById('messenger-body');
  if (body) body.scrollTop = body.scrollHeight;
}

export function attachMessengerEvents() {
  document.getElementById('messenger-toggle')?.addEventListener('click', (e) => {
    if (e.target.closest('.messenger-header-actions')) return;
    toggleMessengerOpen();
    rerender();
  });

  document.getElementById('msg-send-btn')?.addEventListener('click', doSend);

  document.getElementById('messenger-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSend();
  });

  scrollToBottom();

  on('messengerUpdate', rerender);
  on('messagesUpdate', rerender);
}

function doSend() {
  const input = document.getElementById('messenger-input');
  const text = input?.value?.trim();
  if (!text) return;
  const { activeConversationId } = getState();
  if (activeConversationId) {
    sendMessage(activeConversationId, text);
    input.value = '';
    rerender();
  }
}

function rerender() {
  const popup = document.getElementById('messenger-popup');
  if (!popup) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = renderMessenger();
  const newPopup = tmp.firstElementChild;
  popup.replaceWith(newPopup);
  attachMessengerEvents();
}

export function openChat(convId) {
  openConversation(convId);
  const existing = document.getElementById('messenger-popup');
  if (existing) {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderMessenger();
    existing.replaceWith(tmp.firstElementChild);
    attachMessengerEvents();
  } else {
    document.body.insertAdjacentHTML('beforeend', renderMessenger());
    attachMessengerEvents();
  }
}
