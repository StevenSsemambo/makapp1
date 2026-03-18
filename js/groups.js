// ================================================================
// MakChat — Groups Module
// ================================================================

function renderGroups() {
  const myGroups      = allGroups().filter(g => (g.members || []).includes(CU.id));
  const discoverGroups = allGroups().filter(g => !(g.members || []).includes(CU.id));
  $('my-groups').innerHTML      = myGroups.map(g => renderGroupCard(g, true)).join('') || '<div class="text-muted text-sm">You haven\'t joined any groups yet.</div>';
  $('discover-groups').innerHTML = discoverGroups.map(g => renderGroupCard(g, false)).join('');
}

function renderGroupCard(g, joined) {
  const memberCount = (g.members || []).length;
  const maxLabel    = g.max === 'Unlimited' ? '∞' : g.max;
  return `<div class="tribe-card ${joined ? 'card-hov' : ''}">
    <div class="flex justify-between items-start mb-10">
      <div class="flex items-center gap-10">
        <span style="font-size:24px">${g.emoji}</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--blue)">${g.name}</div>
          <div class="text-xs text-muted mt-2">${g.college} · ${g.type}</div>
        </div>
      </div>
      ${joined ? `<span class="pill pill-green" style="font-size:10px">🔥 ${g.streak || 0}d streak</span>` : `<span class="pill pill-blue">${memberCount}/${maxLabel}</span>`}
    </div>
    <div class="text-xs text-muted mb-10" style="line-height:1.55">${g.desc}</div>
    ${joined ? `
      <div class="progress-bar mb-8"><div class="progress-fill" style="width:${g.progress || 0}%"></div></div>
      <div class="flex justify-between items-center mb-10">
        <span class="text-xs text-muted">${g.progress || 0}% this week</span>
        <span class="text-xs text-muted">📅 ${g.days || '—'}</span>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary btn-sm flex-1" onclick="openGroupChat('${g.id}')">💬 Group Chat</button>
        <button class="btn btn-ghost btn-sm" onclick="startGroupSession('${g.id}')">▶</button>
        <button class="btn btn-ghost btn-sm" onclick="confirmLeaveGroup('${g.id}')">Leave</button>
      </div>`
    : `<div class="flex gap-8"><button class="btn btn-gold btn-sm flex-1" onclick="joinGroupAndChat('${g.id}')">Join Group</button></div>`}
  </div>`;
}

function createGroup() {
  const name    = $('g-name').value.trim(); const emoji = $('g-emoji').value || '🏘️';
  const type    = $('g-type').value;        const college = $('g-college').value;
  const max     = $('g-max').value;         const days    = $('g-days').value;
  const desc    = $('g-desc').value.trim();
  if (!name) { toast('Enter a group name', 'error'); return; }
  const newGroup = {
    id: 'g' + Date.now(), name, emoji, type, college, max, days,
    desc: desc || `A ${type} group for ${college} students.`,
    members: [CU.id], admins: [CU.id], createdBy: CU.id,
    progress: 0, streak: 0, points: 0, messages: [], createdAt: Date.now(),
  };
  const groups = allGroups(); groups.unshift(newGroup); DB._set('groups', groups);
  AW.upsertOne('groups', newGroup);
  const users = allUsers(); const me = users.find(u => u.id === CU.id);
  me.groups = me.groups || []; me.groups.push(newGroup.id);
  saveUsers(users); CU = me;
  addPoints(25); closeModal('create-group-modal');
  [$('g-name'), $('g-emoji'), $('g-desc'), $('g-days')].forEach(el => { if (el) el.value = ''; });
  toast(`Group "${name}" created! 🏘️`); renderGroups(); refreshUI();
}

function joinGroupAndChat(id) { joinGroup(id); setTimeout(() => openGroupChat(id), 200); }

function openGroupChat(groupId) {
  const g = allGroups().find(x => x.id === groupId); if (!g) return;
  if (!(g.members || []).includes(CU.id)) joinGroup(groupId);
  activeGroupChatId = groupId;
  AW.subscribeToGroup(groupId, () => renderGroupChatMessages(groupId));
  $('gc-title').textContent = `${g.emoji} ${g.name}`;
  $('gc-sub').textContent   = `${(g.members || []).length} members`;
  renderGroupChatMessages(groupId);
  openModal('group-chat-modal');
}

function renderGroupChatMessages(groupId) {
  const g = allGroups().find(x => x.id === groupId); if (!g) return;
  const msgs = $('gc-messages'); if (!msgs) return;
  const messages = g.messages || [];
  if (!messages.length) {
    msgs.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--muted);font-size:13px">No messages yet. Be the first! 💬</div>';
    return;
  }
  let html = ''; let lastDate = '';
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const u = getUser(m.from); const isMine = m.from === CU.id;
    const next = messages[i + 1]; const isLast = !next || next.from !== m.from;
    const dStr = formatDateSep(m.ts);
    if (dStr !== lastDate) { lastDate = dStr; html += `<div class="date-sep"><div class="date-sep-line"></div><div class="date-sep-label">${dStr}</div><div class="date-sep-line"></div></div>`; }
    html += `<div style="display:flex;flex-direction:column;align-items:${isMine ? 'flex-end' : 'flex-start'};margin-bottom:${isLast ? '8' : '2'}px">
      ${!isMine && isLast ? `<div style="font-size:10px;color:var(--muted);margin-bottom:2px;padding:0 4px">${u?.name?.split(' ')[0] || '?'}</div>` : ''}
      <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}${!isLast ? ' grouped' : ''}">${m.body}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px;padding:0 4px">${formatMsgTime(m.ts)}</div>
    </div>`;
  }
  msgs.innerHTML = html;
  setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
}

function sendGroupChatMsg() {
  const inp  = $('gc-input');
  const body = inp?.value?.trim();
  if (!body || !activeGroupChatId) { toast('Write something first!', 'error'); return; }
  const groups = allGroups(); const g = groups.find(x => x.id === activeGroupChatId); if (!g) return;
  g.messages = g.messages || [];
  const msg = { id: 'gm' + Date.now(), from: CU.id, body, ts: Date.now(), reactions: {} };
  g.messages.push(msg);
  DB._set('groups', groups);
  AW.sendGroupMsg(activeGroupChatId, msg);
  inp.value = ''; addPoints(3);
  renderGroupChatMessages(activeGroupChatId);
}

function joinGroup(id) {
  const groups = allGroups(); const g = groups.find(x => x.id === id); if (!g) return;
  g.members = g.members || [];
  if (g.members.includes(CU.id)) return;
  if (g.max !== 'Unlimited' && g.members.length >= parseInt(g.max)) { toast('This group is full', 'error'); return; }
  g.members.push(CU.id);
  DB._set('groups', groups);
  AW.upsertOne('groups', g);
  const users = allUsers(); const me = users.find(u => u.id === CU.id);
  me.groups = me.groups || []; if (!me.groups.includes(id)) me.groups.push(id);
  saveUsers(users); CU = me;
  addPoints(15); toast(`Joined ${g.name}! 🏘️`); renderGroups(); refreshUI();
}

async function confirmLeaveGroup(id) {
  const g = allGroups().find(x => x.id === id); if (!g) return;
  const ok = await showConfirm(`Leave "${g.name}"?`, 'You can rejoin anytime.', 'Leave Group', '🚪', '#64748b');
  if (ok) leaveGroup(id);
}

function leaveGroup(id) {
  const groups = allGroups(); const g = groups.find(x => x.id === id); if (!g) return;
  g.members = (g.members || []).filter(m => m !== CU.id);
  DB._set('groups', groups);
  AW.upsertOne('groups', g);
  const users = allUsers(); const me = users.find(u => u.id === CU.id);
  me.groups = (me.groups || []).filter(x => x !== id);
  saveUsers(users); CU = me;
  toast('Left group'); renderGroups(); refreshUI();
}

function startGroupSession(id) {
  const g = allGroups().find(x => x.id === id); if (!g) return;
  sessionGroupName = g.name; sessionSeconds = 0;
  $('session-group-name').textContent = g.name;
  $('session-banner').classList.remove('hidden');
  if (sessionInterval) clearInterval(sessionInterval);
  sessionInterval = setInterval(() => {
    sessionSeconds++;
    const m = Math.floor(sessionSeconds / 60).toString().padStart(2, '0');
    const s = (sessionSeconds % 60).toString().padStart(2, '0');
    const t = $('session-timer'); if (t) t.textContent = `${m}:${s}`;
  }, 1000);
  toast(`Study session started for ${g.name}! 📚`);
}

function endSession() {
  if (sessionInterval) { clearInterval(sessionInterval); sessionInterval = null; }
  $('session-banner').classList.add('hidden');
  const mins = Math.floor(sessionSeconds / 60);
  const pts  = Math.min(50, Math.floor(sessionSeconds / 12));
  addPoints(pts);
  toast(`Session ended! ${mins} min studied · +${pts} pts 🎉`);
  sessionSeconds = 0;
}
