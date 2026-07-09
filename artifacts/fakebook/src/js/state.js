// ===== APP STATE =====
import { posts as initialPosts, friendIds, requestIds, notifications as initialNotifs, conversations as initialConvos, currentUser } from './data.js';

const state = {
  currentPage: 'feed',
  currentUser: { ...currentUser },
  posts: initialPosts.map(p => ({ ...p, likedBy: new Set(p.likedBy) })),
  friendIds: new Set(friendIds),
  requestIds: new Set(requestIds),
  notifications: initialNotifs.map(n => ({ ...n })),
  conversations: initialConvos.map(c => ({ ...c, messages: [...c.messages] })),
  activeConversationId: null,
  messengerOpen: false,
  notifDropdownOpen: false,
  msgDropdownOpen: false,
  listeners: {},
};

export function getState() { return state; }

export function navigate(page) {
  state.currentPage = page;
  emit('navigate', page);
}

export function toggleLike(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  const uid = state.currentUser.id;
  if (post.likedBy.has(uid)) {
    post.likedBy.delete(uid);
    post.likes--;
  } else {
    post.likedBy.add(uid);
    post.likes++;
  }
  emit('postUpdate', postId);
}

export function addComment(postId, text) {
  const post = state.posts.find(p => p.id === postId);
  if (!post || !text.trim()) return;
  const comment = {
    id: Date.now(),
    userId: state.currentUser.id,
    text: text.trim(),
    likes: 0,
    time: 'Baru saja',
  };
  post.comments.push(comment);
  emit('postUpdate', postId);
}

export function addPost(text) {
  if (!text.trim()) return;
  const newPost = {
    id: Date.now(),
    userId: state.currentUser.id,
    text: text.trim(),
    image: null, imageEmoji: null,
    likes: 0, likedBy: new Set(),
    comments: [],
    time: 'Baru saja',
    privacy: '🌐',
  };
  state.posts.unshift(newPost);
  emit('feedUpdate');
}

export function acceptFriendRequest(userId) {
  state.requestIds.delete(userId);
  state.friendIds.add(userId);
  const notif = state.notifications.find(n => n.userId === userId && n.type === 'friend');
  if (notif) notif.unread = false;
  emit('friendsUpdate');
}

export function declineFriendRequest(userId) {
  state.requestIds.delete(userId);
  emit('friendsUpdate');
}

export function sendFriendRequest(userId) {
  // Simulate sending — just mark as pending
  emit('friendsUpdate');
}

export function markNotifsRead() {
  state.notifications.forEach(n => { n.unread = false; });
  emit('notifsUpdate');
}

export function sendMessage(convId, text) {
  const conv = state.conversations.find(c => c.id === convId);
  if (!conv || !text.trim()) return;
  conv.messages.push({
    id: Date.now(),
    from: state.currentUser.id,
    text: text.trim(),
    time: 'Baru saja',
  });
  emit('messagesUpdate', convId);
}

export function openConversation(convId) {
  state.activeConversationId = convId;
  state.messengerOpen = true;
  const conv = state.conversations.find(c => c.id === convId);
  if (conv) conv.unread = 0;
  emit('messengerUpdate');
}

export function toggleMessengerOpen() {
  state.messengerOpen = !state.messengerOpen;
  emit('messengerUpdate');
}

export function on(event, fn) {
  if (!state.listeners[event]) state.listeners[event] = [];
  state.listeners[event].push(fn);
}

export function off(event, fn) {
  if (!state.listeners[event]) return;
  state.listeners[event] = state.listeners[event].filter(f => f !== fn);
}

function emit(event, data) {
  (state.listeners[event] || []).forEach(fn => fn(data));
}
