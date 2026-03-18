// ================================================================
// MakChat — Channels Module
// ================================================================

function renderChannels() {
  seedChannels();
  const channels = allChannels();
  const panel = $('channel-list-panel');
  if (!panel) return;
  const typeIcons = { course: '📚', department: '🏛', interest: '💡', research: '🔬' };
  panel.innerHTML = `
    <div style="padding:8px 4px 6px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Channels</div>
    ${channels.map(ch => `
      <div class="channel-item ${activeChannelId === ch.id ? 'active' : ''}" data-chid="${ch.id}" onclick="openChannelConvo('${ch.id}')">
        <div class="channel-hash" style="background:${ch.type === 'course' ? 'var(--blue)' : ch.type === 'research' ? '#7c3aed' : 'var(--red)'}">
          ${typeIcons[ch.type] || '#'}
        </div>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.name}</div>
          <div style="font-size:10px;color:var(--muted)">${(ch.members || []).length} members</div>
        </div>
      </div>`).join('')}`;

  if (activeChannelId) openChannelConvo(activeChannelId);
  else if (channels.length > 0) openChannelConvo(channels[0].id);
}

function openChannelConvo(channelId) {
  activeChannelId = channelId;
  const channels = allChannels(); const ch = channels.find(c => c.id === channelId); if (!ch) return;

  // Auto-join silently
  if (!(ch.members || []).includes(CU.id)) {
    ch.members = ch.members || []; ch.members.push(CU.id);
    DB._set('channels', channels);
    AW.upsertOne('channels', ch);
  }

  const emptyEl = $('channel-empty'); const activeEl = $('channel-active');
  if (emptyEl) emptyEl.style.display = 'none';
  if (activeEl) activeEl.style.display = 'flex';
  const nameEl = $('ch-hdr-name'); const subEl = $('ch-hdr-sub');
  if (nameEl) nameEl.textContent = ch.name;
  if (subEl)  subEl.textContent  = `${ch.college || 'Makerere'} · ${(ch.members || []).length} members`;

  // Update active highlight without re-rendering list
  document.querySelectorAll('#channel-list-panel .channel-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chid === channelId);
  });

  const msgs = $('channel-messages');
  if (msgs) {
    const messages = ch.messages || [];
    if (!messages.length) {
      msgs.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--muted);font-size:13px">No messages yet. Be the first! 💬</div>';
    } else {
      let html = ''; let lastDate = '';
      for (let i = 0; i < messages.length; i++) {
        const m = messages[i]; const u = getUser(m.from); const isMine = m.from === CU.id;
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
    }
    setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 60);
  }
}

function sendChannelMsg() {
  const input = $('channel-input'); const body = input?.value?.trim();
  if (!body || !activeChannelId) { toast('Write something first!', 'error'); return; }
  const channels = allChannels(); const ch = channels.find(c => c.id === activeChannelId); if (!ch) return;
  ch.messages = ch.messages || [];
  const msg = { id: 'cm' + Date.now(), from: CU.id, body, ts: Date.now() };
  ch.messages.push(msg);
  DB._set('channels', channels);
  AW.sendChannelMsg(activeChannelId, msg);
  input.value = ''; addPoints(3);
  openChannelConvo(activeChannelId);
}

function createChannel() {
  const name    = $('cn-name').value.trim();
  const type    = $('cn-type').value;
  const college = $('cn-college').value;
  const desc    = $('cn-desc').value.trim();
  if (!name) { toast('Enter a channel name', 'error'); return; }
  const newCh = {
    id: 'ch' + Date.now(), name, type, college,
    description: desc || `A ${type} channel for ${college}`,
    members: [CU.id], messages: [], createdBy: CU.id, createdAt: Date.now(),
  };
  const channels = allChannels(); channels.unshift(newCh); DB._set('channels', channels);
  AW.upsertOne('channels', newCh);
  addPoints(20); closeModal('create-channel-modal');
  ['cn-name', 'cn-desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  toast(`Channel "${name}" created! 📡`);
  activeChannelId = newCh.id;
  renderChannels();
}
