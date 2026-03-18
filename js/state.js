// ================================================================
// MakChat — State & Shared Helpers
// ================================================================

// ── GLOBAL STATE ─────────────────────────────────────────────────
let CU = null;                 // Current User object
let currentTab = 'home';

// Filter states
let feedFilter    = 'all';
let mktFilter     = 'all';
let hostelFilter  = 'all';
let gigsFilter    = 'all';
let eventFilter   = 'all';
let oppFilter     = 'all';
let annFilter     = 'all';
let lfFilter      = 'all';
let peopleFilter  = 'all';

// Chat / channel state
let activeChatId      = null;
let activeChannelId   = null;
let activeGroupChatId = null;

// Compose state
let postTag       = '';
let postAnon      = false;
let postImageData = null;

// Study session
let sessionInterval  = null;
let sessionSeconds   = 0;
let sessionGroupName = '';

// Profile
let pfActiveTab = 'achievements';

// Gig rating
let currentRating = 0;
let ratingGigId   = null;

// Reaction picker
let reactionPickerOpen = null;

// ── PURE HELPERS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return Math.floor(s / 60) + 'm ago';
  if (s < 86400)  return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatUGX(n) {
  return 'UGX ' + Number(n).toLocaleString();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function collegeShort(college) {
  if (!college) return '';
  const m = college.match(/\(([^)]+)\)/);
  return m ? m[1] : college.split(' ')[0];
}

function formatMsgTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateSep(ts) {
  const d    = new Date(ts);
  const now  = new Date();
  const yest = new Date(now - 86400000);
  if (d.toDateString() === now.toDateString())  return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _fileEmoji(type) {
  if (!type) return '📎';
  if (type.includes('pdf'))  return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('ppt')) return '📑';
  if (type.includes('text')) return '📃';
  if (type.startsWith('image')) return '🖼️';
  return '📎';
}

function _fmtBytes(b) {
  if (b < 1024)    return b + 'B';
  if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
  return (b / 1048576).toFixed(1) + 'MB';
}

function addPoints(n) {
  if (!CU) return;
  const users = allUsers();
  const me = users.find(u => u.id === CU.id);
  if (!me) return;
  me.points = (me.points || 0) + n;
  saveUsers(users);
  CU = me;
}

function addNotif(icon, text) {
  const notifs = allNotifs() || [];
  notifs.unshift({ id: 'n' + Date.now(), icon, text, ts: Date.now(), read: false });
  DB._set('notifications', notifs);
  updateNotifDot();
}

function updateNotifDot() {
  const unread = allNotifs().filter(n => !n.read).length;
  const nd = $('notif-dot');
  if (nd) nd.style.display = unread ? 'block' : 'none';
}

// ── FILE ATTACHMENT HANDLER ──────────────────────────────────────
function handleChatFile(input, chatType) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('File too large — max 5MB', 'error'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const isImg = file.type.startsWith('image/');
    const data  = e.target.result;
    const enc   = encodeURIComponent(data);
    const name  = file.name;
    let body;
    if (isImg) {
      body = `<img src="${data}" alt="${_esc(name)}" style="max-width:220px;max-height:160px;border-radius:10px;display:block;cursor:pointer;margin-top:2px" onclick="window.open(this.src,'_blank')">`;
    } else {
      body = `<span onclick="dlFile('${enc}','${_esc(name)}')" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.08);border-radius:10px;cursor:pointer;max-width:240px"><span style="font-size:22px">${_fileEmoji(file.type)}</span><span><b style="font-size:12px;word-break:break-all;display:block">${_esc(name)}</b><span style="font-size:10px;color:var(--muted)">${_fmtBytes(file.size)} · tap to download</span></span></span>`;
    }
    if (chatType === 'dm') {
      if (!activeChatId) return;
      const chats = allChats(); const chat = chats.find(c => c.id === activeChatId); if (!chat) return;
      chat.messages = chat.messages || [];
      const msg = { id: 'm' + Date.now(), from: CU.id, body, ts: Date.now(), readBy: [], isFile: true, fileName: name };
      chat.messages.push(msg);
      DB._set('chats', chats);
      AW.sendDM(activeChatId, msg);
      renderChatMessages(activeChatId); renderChatList();
    } else if (chatType === 'channel') {
      if (!activeChannelId) return;
      const channels = allChannels(); const ch = channels.find(c => c.id === activeChannelId); if (!ch) return;
      ch.messages = ch.messages || [];
      const msg = { id: 'c' + Date.now(), from: CU.id, body, ts: Date.now(), isFile: true, fileName: name };
      ch.messages.push(msg);
      DB._set('channels', channels);
      AW.sendChannelMsg(activeChannelId, msg);
      openChannelConvo(activeChannelId);
    } else if (chatType === 'group') {
      if (!activeGroupChatId) return;
      const groups = allGroups(); const g = groups.find(x => x.id === activeGroupChatId); if (!g) return;
      g.messages = g.messages || [];
      const msg = { id: 'g' + Date.now(), from: CU.id, body, ts: Date.now(), isFile: true, fileName: name };
      g.messages.push(msg);
      DB._set('groups', groups);
      AW.sendGroupMsg(activeGroupChatId, msg);
      renderGroupChatMessages(activeGroupChatId);
    }
    input.value = '';
    toast(isImg ? '📸 Image sent!' : '📎 File sent!');
  };
  reader.readAsDataURL(file);
}

function dlFile(enc, name) {
  try {
    const a = document.createElement('a');
    a.href = decodeURIComponent(enc);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) { toast('Download failed', 'error'); }
}

// ── POST IMAGE HELPERS ───────────────────────────────────────────
function handlePostImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Image too large — max 2MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    postImageData = e.target.result;
    const preview = $('post-img-preview');
    if (preview) preview.innerHTML = `<div class="img-preview-wrap"><img src="${postImageData}"><button class="img-preview-remove" onclick="removePostImage()">✕</button></div>`;
  };
  reader.readAsDataURL(file);
}

function removePostImage() {
  postImageData = null;
  const preview = $('post-img-preview'); if (preview) preview.innerHTML = '';
  const inp = $('post-img-input'); if (inp) inp.value = '';
}

// ── PROFILE PHOTO ────────────────────────────────────────────────
function handleProfilePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast('Photo too large — max 3MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const users = allUsers();
    const me = users.find(u => u.id === CU.id);
    if (!me) return;
    me.photo = e.target.result;
    saveUsers(users);
    CU = me;
    AW.upsertOne('users', me);
    toast('Profile photo updated! 📸');
    refreshUI();
  };
  reader.readAsDataURL(file);
}

// ── START CHAT FROM ELSEWHERE ────────────────────────────────────
function startChatWith(userId) {
  if (!CU || userId === CU.id) return;
  const chatId = [CU.id, userId].sort().join('_');
  const chats = allChats();
  let chat = chats.find(c => c.id === chatId);
  if (!chat) {
    chat = { id: chatId, participants: [CU.id, userId], messages: [] };
    chats.push(chat);
    DB._set('chats', chats);
    AW.upsertOne('chats', chat);
  }
  goTab('chat');
  setTimeout(() => openChatConvo(chatId), 100);
}

// ── WHATSAPP ─────────────────────────────────────────────────────
function formatPhone(num) {
  if (!num) return null;
  const clean = num.replace(/\D/g, '');
  if (clean.startsWith('0') && clean.length >= 9) return '256' + clean.slice(1);
  if (clean.startsWith('256')) return clean;
  if (clean.length >= 9) return '256' + clean;
  return null;
}

function openWhatsApp(number, message) {
  const clean = formatPhone(number);
  if (!clean) { toast('No contact number provided', 'error'); return; }
  window.open('https://wa.me/' + clean + (message ? '?text=' + encodeURIComponent(message) : ''), '_blank');
}

function shareText(text) {
  if (navigator.share)      { navigator.share({ text }).catch(() => {}); return; }
  if (navigator.clipboard)  { navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard! 📋')); return; }
  toast('Sharing not supported on this device');
}

// ── CONFIRM DIALOG ───────────────────────────────────────────────
let confirmResolveFn = null;

function showConfirm(title, msg, okLabel = 'Confirm', icon = '⚠️', dangerColor = 'var(--danger)') {
  return new Promise(resolve => {
    confirmResolveFn = resolve;
    $('confirm-icon').textContent  = icon;
    $('confirm-title').textContent = title;
    $('confirm-msg').textContent   = msg;
    const okBtn = $('confirm-ok-btn');
    okBtn.textContent = okLabel;
    okBtn.style.background = dangerColor;
    $('confirm-backdrop').classList.add('open');
  });
}

function confirmResolve(val) {
  $('confirm-backdrop').classList.remove('open');
  if (confirmResolveFn) { confirmResolveFn(val); confirmResolveFn = null; }
}

// ── EMPTY STATE ──────────────────────────────────────────────────
function emptyState(icon, title, desc, btnLabel, btnAction) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-desc">${desc}</div>
    ${btnLabel ? `<button class="btn btn-gold" onclick="${btnAction}">${btnLabel}</button>` : ''}
  </div>`;
}
