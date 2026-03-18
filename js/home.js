// ================================================================
// MakChat — Home Screen
// ================================================================

function renderHome() {
  const posts = allPosts().slice(0, 3);

  $('home-feed').innerHTML = posts.map(p => {
    const u = getUser(p.userId);
    return `<div class="card home-feed-card" onclick="openPost('${p.id}')">
      <div class="flex items-center gap-8 mb-6">
        <div class="avatar av-xs" style="background:${u?.color || '#2D6A27'};flex-shrink:0"><span style="color:white;font-size:9px;font-weight:700">${initials(u?.name || '?')}</span></div>
        <div style="min-width:0;flex:1">
          <div class="text-sm font-semibold truncate">${p.anon ? 'Anonymous' : u?.name || 'Unknown'}</div>
          <div class="text-xs text-muted">${timeAgo(p.createdAt)}</div>
        </div>
        ${p.tag ? `<span class="pill pill-blue" style="font-size:9px;flex-shrink:0">${p.tag}</span>` : ''}
      </div>
      <div class="text-sm" style="color:var(--text);line-height:1.5;word-break:break-word">${p.body.slice(0, 120)}${p.body.length > 120 ? '…' : ''}</div>
      <div class="flex gap-12 mt-8" style="color:var(--muted);font-size:11px">
        <span>❤️ ${(p.likes || []).length}</span>
        <span>💬 ${(p.comments || []).length}</span>
      </div>
    </div>`;
  }).join('') || '<div class="text-muted text-sm" style="padding:12px 0">No posts yet.</div>';

  // Latest announcement
  const anns = allAnn().slice(0, 1);
  $('home-ann').innerHTML = anns.map(a => `
    <div class="card home-ann-card" onclick="goTab('announcements')" style="cursor:pointer;border-left:3px solid ${a.cat === 'urgent' ? 'var(--red)' : 'var(--blue)'}">
      <div class="flex items-center gap-6 mb-5">
        <span class="pill ${a.cat === 'urgent' ? 'pill-red' : 'pill-blue'}" style="font-size:9px">${a.cat}</span>
        <span class="text-xs text-muted">${timeAgo(a.createdAt)}</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:4px">${a.title}</div>
      <div class="text-xs text-muted" style="line-height:1.5">${a.body.slice(0, 110)}${a.body.length > 110 ? '…' : ''}</div>
      <div class="text-xs" style="color:var(--blue);margin-top:6px;font-weight:600">View all →</div>
    </div>`).join('') || '<div class="text-muted text-sm" style="padding:8px 0">No announcements.</div>';

  // Active users
  const activeUsers = allUsers().filter(u => u.id !== CU.id).slice(0, 4);
  $('home-active').innerHTML = activeUsers.map(u => `
    <div class="flex items-center gap-10"
         style="padding:6px 8px;border-radius:10px;cursor:pointer;transition:background 0.15s"
         onclick="startChatWith('${u.id}')"
         onmouseover="this.style.background='var(--lightblue)'"
         onmouseout="this.style.background=''">
      <div class="avatar-wrapper" style="flex-shrink:0">
        <div class="avatar av-sm" style="background:${u.color};overflow:hidden;padding:0">
          ${u.photo
            ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`
            : `<span style="color:white;font-size:10px;font-weight:700">${initials(u.name)}</span>`}
        </div>
        <div class="online-dot"></div>
      </div>
      <div style="flex:1;min-width:0">
        <div class="text-sm font-semibold truncate">${u.name}</div>
        <div class="text-xs text-muted truncate">${collegeShort(u.college)}</div>
      </div>
      <span style="font-size:10px;background:var(--blue);color:white;padding:3px 8px;border-radius:20px;flex-shrink:0;font-weight:600">Chat →</span>
    </div>`).join('');

  // Upcoming events
  const upEvents = allEvents().slice(0, 3);
  $('home-events').innerHTML = upEvents.map(e => {
    const d = new Date(e.date);
    return `<div class="card home-event-card" onclick="goTab('events')" style="cursor:pointer;padding:10px 12px">
      <div class="flex items-center gap-10">
        <div style="width:36px;height:38px;background:var(--blue);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <div style="font-size:13px;font-weight:900;color:var(--gold);line-height:1">${d.getDate()}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.75);text-transform:uppercase">${d.toLocaleString('en', { month: 'short' })}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div class="text-sm font-semibold truncate">${e.title}</div>
          <div class="text-xs text-muted truncate">📍 ${e.venue}</div>
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="text-muted text-sm" style="padding:8px 0">No upcoming events.</div>';

  const annBadge = $('ann-badge-home');
  if (annBadge) annBadge.textContent = allAnn().length;
  renderRightPanel();
}
