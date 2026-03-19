// ================================================================
// MakChat — Chat Module (Direct Messages)
// ================================================================

async function renderChat() {
  // Always pull fresh chat list from Appwrite when opening Chat tab
  if (USE_APPWRITE) {
    await AW.refreshChatList(CU.id);
  }
  renderChatList();
  if (activeChatId) openChatConvo(activeChatId);
}

function renderChatList(filterQ) {
  const chats = allChats().filter(c => c.participants?.includes(CU.id));
  const panel = $('chat-list-panel'); if (!panel) return;
  const q = (filterQ || ($('chat-list-search')?.value || '')).toLowerCase();
  const filtered = chats.filter(c => {
    if (!q) return true;
    const otherId = c.participants.find(id => id !== CU.id);
    const other = getUser(otherId);
    return other && (other.name.toLowerCase().includes(q) || (other.course || '').toLowerCase().includes(q));
  });

  panel.innerHTML = `
    <div class="chat-search-bar">
      <input id="chat-list-search" placeholder="🔍 Search by name or course..." oninput="renderChatList(this.value)" value="${filterQ || ''}">
    </div>
    ${filtered.map(c => {
      const otherId = c.participants.find(id => id !== CU.id);
      const other = getUser(otherId); if (!other) return '';
      const last   = c.messages && c.messages.length ? c.messages[c.messages.length - 1] : null;
      const unread = (c.messages || []).filter(m => m.from !== CU.id && !m.readBy?.includes(CU.id)).length;
      return `<div class="chat-item ${activeChatId === c.id ? 'active' : ''}" onclick="openChatConvo('${c.id}')">
        <div class="avatar-wrapper">
          ${other.photo
            ? `<div class="avatar av-sm" style="background:${other.color};overflow:hidden;padding:0"><img src="${other.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`
            : `<div class="avatar av-sm" style="background:${other.color}"><span style="color:white;font-size:9px;font-weight:700">${initials(other.name)}</span></div>`}
          <div class="online-dot"></div>
        </div>
        <div class="flex-1" style="min-width:0">
          <div class="flex justify-between items-center">
            <div class="chat-item-name">${other.name}</div>
            <div style="font-size:10px;color:var(--muted)">${last ? formatMsgTime(last.ts) : ''}</div>
          </div>
          <div class="flex justify-between items-center mt-2">
            <div class="chat-item-preview" style="flex:1;min-width:0">${last
              ? (last.from === CU.id ? `<span style='color:var(--muted)'>You: </span>` : '')
                + (last.isFile ? '📎 ' + (last.fileName || 'Attachment') : last.body.length > 35 ? last.body.slice(0, 35) + '…' : last.body)
              : '<em style="color:var(--muted)">No messages yet</em>'}</div>
            ${unread > 0 ? `<span class="chat-unread-badge">${unread}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('')}
    ${filtered.length === 0 ? `<div style="padding:24px;text-align:center">
      <div style="font-size:40px;margin-bottom:12px">💬</div>
      <div style="font-weight:700;color:var(--blue);margin-bottom:6px">${q ? 'No results' : 'No conversations yet'}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">${q ? 'Try a different search' : 'Find a student and start chatting!'}</div>
      ${!q ? `<button class="btn btn-primary btn-sm" onclick="openModal('new-chat-modal')">Start a conversation</button>` : ''}
    </div>` : ''}`;
}

async function openChatConvo(chatId) {
  activeChatId = chatId;
  AW.unsubscribeAll();

  // Pull fresh messages from Appwrite so other person's messages show up
  if (USE_APPWRITE) await AW.refreshChat(chatId);

  // Realtime subscription for instant new messages
  AW.subscribeToChat(chatId, () => {
    if (activeChatId === chatId) { renderChatMessages(chatId); renderChatList(); }
  });

  // Polling fallback every 3s — catches any missed realtime events
  AW.startPolling(chatId, () => {
    if (activeChatId === chatId) { renderChatMessages(chatId); renderChatList(); }
  });

  const chats = allChats(); const chat = chats.find(c => c.id === chatId); if (!chat) return;
  const otherId = chat.participants.find(id => id !== CU.id);
  const other = getUser(otherId); if (!other) return;

  // Mobile: hide list
  const isMobile = window.innerWidth <= 768;
  const listPanel = $('chat-list-panel'); const backBtn = $('chat-back-btn');
  if (isMobile && listPanel) { listPanel.style.display = 'none'; if (backBtn) backBtn.style.display = 'flex'; }
  else { if (backBtn) backBtn.style.display = 'none'; }

  $('chat-empty').style.display = 'none';
  const active = $('chat-active'); active.style.display = 'flex';

  // Header
  const hdrEl = $('chat-hdr-av'), hdrInit = $('chat-hdr-init');
  if (hdrEl) {
    hdrEl.style.background = other.photo ? 'transparent' : other.color;
    let hdrImg = hdrEl.querySelector('img.hdr-photo');
    if (other.photo) {
      if (!hdrImg) { hdrImg = document.createElement('img'); hdrImg.className = 'hdr-photo'; hdrImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;position:absolute;inset:0'; hdrEl.style.position = 'relative'; hdrEl.appendChild(hdrImg); }
      hdrImg.src = other.photo; hdrImg.style.display = 'block'; if (hdrInit) hdrInit.style.visibility = 'hidden';
    } else {
      if (hdrImg) hdrImg.style.display = 'none'; if (hdrInit) { hdrInit.style.visibility = ''; hdrInit.textContent = initials(other.name); }
    }
  }
  $('chat-hdr-name').textContent = other.name;
  $('chat-hdr-sub').innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px"><span class="online-dot" style="width:7px;height:7px;border:none"></span>Online</span> · ${collegeShort(other.college)}`;

  // Mark read
  const chats2 = allChats(); const chat2 = chats2.find(c => c.id === chatId);
  if (chat2) {
    (chat2.messages || []).forEach(m => { if (m.from !== CU.id) { m.readBy = m.readBy || []; if (!m.readBy.includes(CU.id)) m.readBy.push(CU.id); } });
    DB._set('chats', chats2);
  }
  renderChatMessages(chatId);
  renderChatList();
}

function chatGoBack() {
  AW.stopPolling();
  const listPanel = $('chat-list-panel'); if (listPanel) listPanel.style.display = '';
  $('chat-active').style.display = 'none';
  $('chat-empty').style.display = 'flex';
  const backBtn = $('chat-back-btn'); if (backBtn) backBtn.style.display = 'none';
  activeChatId = null;
}

async function confirmClearChat() {
  const ok = await showConfirm('Clear Chat', 'This will delete all messages in this conversation.', 'Clear', '🗑️', 'var(--danger)');
  if (!ok) return;
  const chats = allChats(); const chat = chats.find(c => c.id === activeChatId); if (!chat) return;
  chat.messages = []; DB._set('chats', chats);
  toast('Chat cleared'); renderChatMessages(activeChatId); renderChatList();
}

function chatWhatsApp() {
  if (!activeChatId) return;
  const chat = allChats().find(c => c.id === activeChatId); if (!chat) return;
  const otherId = chat.participants.find(id => id !== CU.id);
  const other = getUser(otherId); if (!other) return;
  if (other.contact) { openWhatsApp(other.contact, `Hi ${other.name.split(' ')[0]}! I found you on MakChat 👋`); }
  else { toast(`No WhatsApp number for ${other.name.split(' ')[0]} yet. Use MakChat messages instead.`); }
}

function renderChatMessages(chatId) {
  const chats = allChats(); const chat = chats.find(c => c.id === chatId); if (!chat) return;
  const msgs = $('chat-messages'); if (!msgs) return;
  const messages = chat.messages || [];
  if (!messages.length) {
    msgs.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px 20px;text-align:center"><div style="font-size:48px;margin-bottom:12px">💬</div><div style="font-weight:700;color:var(--blue);margin-bottom:6px">Start the conversation!</div><div style="font-size:12px;color:var(--muted)">Say hello 👋</div></div>';
    return;
  }
  let html = ''; let lastDate = '';
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const mine = m.from === CU.id;
    const next = messages[i + 1]; const isLast = !next || next.from !== m.from;
    const dStr = formatDateSep(m.ts);
    if (dStr !== lastDate) { lastDate = dStr; html += `<div class="date-sep"><div class="date-sep-line"></div><div class="date-sep-label">${dStr}</div><div class="date-sep-line"></div></div>`; }
    const reactions = m.reactions || {};
    const reactionHTML = Object.entries(reactions).map(([emoji, users]) =>
      `<span class="reaction-chip ${users.includes(CU.id) ? 'mine' : ''}" onclick="toggleReaction('${chatId}','${m.id}','${emoji}')">${emoji} ${users.length}</span>`).join('');
    let tick = '';
    if (mine) {
      const otherId = chat.participants.find(id => id !== CU.id);
      tick = `<span class="read-tick ${(m.readBy || []).includes(otherId) ? 'blue' : ''}">✓✓</span>`;
    }
    html += `<div style="display:flex;flex-direction:column;align-items:${mine ? 'flex-end' : 'flex-start'};margin-bottom:${isLast ? '8' : '2'}px;position:relative" data-msgid="${m.id}">
      <div class="chat-bubble ${mine ? 'mine' : 'theirs'}${!isLast ? ' grouped' : ''}" style="cursor:pointer" ondblclick="openReactionPicker('${chatId}','${m.id}',this)" title="Double-tap to react">${m.body}</div>
      ${reactionHTML ? `<div class="bubble-reactions" style="${mine ? 'justify-content:flex-end' : ''}">${reactionHTML}</div>` : ''}
      <div style="font-size:10px;color:var(--muted);margin-top:2px;padding:0 4px;display:flex;align-items:center;gap:3px">${formatMsgTime(m.ts)}${tick}</div>
      <div id="rp-${m.id}" style="display:none;position:absolute;${mine ? 'right:0' : 'left:0'};bottom:calc(100% + 4px);z-index:200">
        <div class="reaction-picker">
          ${['👍','❤️','😂','😮','😢','🔥'].map(e => `<button class="reaction-btn" onclick="toggleReaction('${chatId}','${m.id}','${e}');closeReactionPicker('${m.id}')">${e}</button>`).join('')}
        </div>
      </div>
    </div>`;
  }
  html += `<div id="typing-indicator" style="display:none;margin-bottom:8px"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.innerHTML = html;
  msgs.scrollTop = msgs.scrollHeight;
}

function openReactionPicker(chatId, msgId, el) {
  if (reactionPickerOpen) closeReactionPicker(reactionPickerOpen);
  const rp = document.getElementById('rp-' + msgId);
  if (rp) { rp.style.display = 'block'; reactionPickerOpen = msgId; }
  setTimeout(() => { document.addEventListener('click', _closePickerOutside, { once: true }); }, 50);
}
function _closePickerOutside() { if (reactionPickerOpen) closeReactionPicker(reactionPickerOpen); }
function closeReactionPicker(msgId) {
  const rp = document.getElementById('rp-' + msgId); if (rp) rp.style.display = 'none';
  reactionPickerOpen = null;
}

function toggleReaction(chatId, msgId, emoji) {
  const chats = allChats(); const chat = chats.find(c => c.id === chatId); if (!chat) return;
  const msg = (chat.messages || []).find(m => m.id === msgId); if (!msg) return;
  msg.reactions = msg.reactions || {};
  msg.reactions[emoji] = msg.reactions[emoji] || [];
  const idx = msg.reactions[emoji].indexOf(CU.id);
  if (idx >= 0) msg.reactions[emoji].splice(idx, 1);
  else msg.reactions[emoji].push(CU.id);
  if (!msg.reactions[emoji].length) delete msg.reactions[emoji];
  DB._set('chats', chats);
  renderChatMessages(chatId);
}

function sendChatMsg() {
  if (!activeChatId) return;
  const inp = $('chat-input'); const body = inp.value.trim(); if (!body) return;
  const chats = allChats(); const chat = chats.find(c => c.id === activeChatId); if (!chat) return;
  const msg = { id: 'msg' + Date.now(), from: CU.id, body, ts: Date.now(), readBy: [], reactions: {} };
  chat.messages = chat.messages || [];
  chat.messages.push(msg);
  DB._set('chats', chats); inp.value = '';
  AW.sendDM(activeChatId, msg);
  renderChatMessages(activeChatId); renderChatList(); addPoints(2);
  // Typing indicator simulation
  setTimeout(() => {
    const ti = $('typing-indicator');
    if (ti) { ti.style.display = 'block'; const msgs = $('chat-messages'); if (msgs) msgs.scrollTop = msgs.scrollHeight; }
    setTimeout(() => { if (ti) ti.style.display = 'none'; }, 1500);
  }, 300);
}

function renderChatUserSearch(q) {
  if (!q || q.length < 2) { $('chat-user-results').innerHTML = ''; return; }
  const users = allUsers().filter(u => u.id !== CU.id && (u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase())));
  $('chat-user-results').innerHTML = users.slice(0, 6).map(u => `
    <div class="flex items-center gap-10 p-12" style="cursor:pointer;border-radius:10px;transition:background 0.15s"
         onmouseover="this.style.background='var(--cream)'" onmouseout="this.style.background=''"
         onclick="startChatWith('${u.id}');closeModal('new-chat-modal')">
      <div class="avatar av-sm" style="background:${u.color}"><span style="color:white;font-size:9px;font-weight:700">${initials(u.name)}</span></div>
      <div class="flex-1">
        <div class="font-semibold text-sm">${u.name}</div>
        <div class="text-xs text-muted">${collegeShort(u.college)} · ${u.year}</div>
      </div>
      <button class="btn btn-primary btn-sm">Chat</button>
    </div>`).join('') || '<div class="text-xs text-muted p-12">No students found.</div>';
}
