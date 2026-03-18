// ================================================================
// MakChat — UI Module
// Navigation, modals, toast, dark mode, notifications, search
// ================================================================

// ── REFRESH MAIN UI ──────────────────────────────────────────────
function refreshUI() {
  if (!CU) return;
  const letter = initials(CU.name);

  // Sidebar avatar
  const sbAv = $('sb-av'), sbImg = $('sb-av-img'), sbLtr = $('sb-av-letter');
  if (sbAv) sbAv.style.background = CU.photo ? 'transparent' : CU.color;
  if (sbImg) {
    if (CU.photo) { sbImg.src = CU.photo; sbImg.style.display = 'block'; if (sbLtr) sbLtr.style.display = 'none'; }
    else { sbImg.style.display = 'none'; if (sbLtr) { sbLtr.style.display = ''; sbLtr.textContent = letter; } }
  }

  const hg = $('home-greeting'); if (hg) hg.textContent = `${greeting()}, ${CU.name.split(' ')[0]} 👋`;
  const hs = $('home-sub');      if (hs) hs.textContent = `${collegeShort(CU.college)} · ${CU.course}`;

  const myPosts  = allPosts().filter(p => p.userId === CU.id).length;
  const myGroups = allGroups().filter(g => (g.members || []).includes(CU.id)).length;
  const myEvents = allEvents().filter(ev => (ev.rsvps || []).includes(CU.id)).length;
  const sp = $('stat-posts');       if (sp) sp.textContent = myPosts;
  const sc = $('stat-connections'); if (sc) sc.textContent = (CU.connections || []).length;
  const sg = $('stat-groups');      if (sg) sg.textContent = myGroups;
  const se = $('stat-events');      if (se) se.textContent = myEvents;

  // Profile section
  const pfAv = $('pf-av'), pfImg = $('pf-av-img'), pfAl = $('pf-av-letter');
  if (pfAv) pfAv.style.background = CU.photo ? 'transparent' : CU.color;
  if (pfImg) {
    if (CU.photo) { pfImg.src = CU.photo; pfImg.style.display = 'block'; if (pfAl) pfAl.style.display = 'none'; }
    else { pfImg.style.display = 'none'; if (pfAl) { pfAl.style.display = ''; pfAl.textContent = letter; } }
  } else if (pfAl) pfAl.textContent = letter;

  const pfN = $('pf-name');    if (pfN) pfN.textContent = CU.name;
  const pfD = $('pf-detail');  if (pfD) pfD.textContent = `${CU.course} · ${CU.year}`;
  const pfC = $('pf-college'); if (pfC) pfC.textContent = CU.college;
  const pfBio = $('pf-bio');   if (pfBio) pfBio.textContent = CU.bio || 'No bio yet.';

  const pfBadges = $('pf-badges');
  if (pfBadges) {
    let badges = '';
    if (CU.verified) badges += `<span class="pill pill-green">✓ Verified</span>`;
    if (CU.isMentor) badges += `<span class="pill pill-gold">🌟 Mentor</span>`;
    pfBadges.innerHTML = badges;
  }

  const pct = Math.min(100,
    15 +
    (CU.bio && CU.bio.length > 10 ? 10 : 0) +
    ((CU.portfolio || []).length > 0 ? 20 : 0) +
    ((CU.skills || []).length > 0 ? 15 : 0) +
    ((CU.connections || []).length > 0 ? 15 : 0) +
    ((CU.groups || []).length > 0 ? 10 : 0) +
    (CU.interests ? 10 : 0) +
    (CU.photo ? 10 : 0)
  );
  const pfPg = $('pf-progress');       if (pfPg) pfPg.style.width = pct + '%';
  const pfPgL = $('pf-progress-label'); if (pfPgL) pfPgL.textContent = pct + '% complete';

  renderCompletionSteps();

  const mt = $('mentor-toggle-btn');
  if (mt) {
    mt.style.background = CU.isMentor ? 'var(--gold)' : 'var(--sand)';
    mt.style.color = CU.isMentor ? 'var(--blue)' : 'var(--muted)';
    mt.textContent = CU.isMentor ? '✓ You\'re a Mentor' : 'Become a Mentor';
  }
  const ms = $('mentor-status'); if (ms) ms.textContent = CU.isMentor ? 'Active — students can find you' : 'Not active';

  const annBtn = $('post-ann-btn'); if (annBtn) annBtn.style.display = CU.verified ? 'inline-flex' : 'none';
  updateNotifDot();
}

// ── NAVIGATION ───────────────────────────────────────────────────
function goTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-btn[data-tab],.bn-btn[data-tab]').forEach(b => b.classList.remove('active'));
  const screen = $('tab-' + tab); if (screen) screen.classList.add('active');
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
  const content = $('content'); if (content) content.scrollTop = 0;

  const renders = {
    home:          renderHome,
    feed:          renderFeed,
    chat:          renderChat,
    people:        renderPeople,
    groups:        renderGroups,
    marketplace:   renderMarket,
    hostel:        renderHostel,
    gigs:          renderGigs,
    events:        renderEvents,
    opportunities: renderOpps,
    announcements: renderAnnouncements,
    lostfound:     renderLF,
    profile:       renderProfile,
    channels:      renderChannels,
  };
  if (renders[tab]) renders[tab]();
  renderRightPanel();
}

// ── RIGHT PANEL ──────────────────────────────────────────────────
function renderRightPanel() {
  const opps = allOpps().filter(o => o.urgent).slice(0, 4);
  const deadlinesHTML = opps.map(o => {
    const days = Math.max(0, Math.ceil((new Date(o.deadline) - Date.now()) / 86400000));
    return `<div class="flex justify-between items-center gap-8">
      <span class="text-sm font-medium truncate flex-1">${o.title}</span>
      <span class="pill ${days <= 7 ? 'pill-red' : 'pill-gold'}">${days}d</span>
    </div>`;
  }).join('') || '<div class="text-xs text-muted">No urgent deadlines</div>';

  const studyingHTML = allUsers().filter(u => u.id !== CU.id).slice(0, 4).map(u => `
    <div class="flex items-center gap-8">
      <div class="avatar av-sm" style="background:${u.color}"><span style="color:white;font-size:9px;font-weight:700">${initials(u.name)}</span></div>
      <div class="flex-1"><div class="text-xs font-semibold">${u.name}</div><div class="text-xs text-muted">${collegeShort(u.college)}</div></div>
      <div class="live-dot"></div>
    </div>`).join('');

  const rpd = $('rp-deadlines');   if (rpd) rpd.innerHTML = deadlinesHTML;
  const rps = $('rp-studying');    if (rps) rps.innerHTML = studyingHTML;
  const mrpd = $('mob-rp-deadlines'); if (mrpd) mrpd.innerHTML = deadlinesHTML;
  const mrps = $('mob-rp-studying');  if (mrps) mrps.innerHTML = studyingHTML;
}

function openMobileRP()  { $('mobile-rp-drawer')?.classList.add('open');    $('mobile-rp-overlay')?.classList.add('open');    renderRightPanel(); }
function closeMobileRP() { $('mobile-rp-drawer')?.classList.remove('open'); $('mobile-rp-overlay')?.classList.remove('open'); }

// ── MODALS ───────────────────────────────────────────────────────
function openModal(id) {
  $(id).classList.add('open');
  if (id === 'edit-profile-modal' && CU) {
    const epb = $('ep-bio');       if (epb) epb.value = CU.bio || '';
    const epc = $('ep-course');    if (epc) epc.value = CU.course || '';
    const epi = $('ep-interests'); if (epi) epi.value = CU.interests || '';
    const epp = $('ep-phone');     if (epp) epp.value = CU.contact || '';
  }
}
function closeModal(id) { $(id).classList.remove('open'); }
function closeOnBack(e, id) { if (e.target.id === id) closeModal(id); }
function closeOverlay(e, id) { if (e.target.id === id) $(id).classList.remove('open'); }

// ── TOAST ────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  el.innerHTML = `<span>${type === 'error' ? '❌' : type === 'success' ? '✅' : '✓'}</span> ${msg}`;
  $('toast-wrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── DARK MODE ────────────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  DB.set('darkMode', isDark);
  const btn   = $('dark-toggle');     if (btn)   btn.textContent   = isDark ? '☀️' : '🌙';
  const icon  = $('more-dark-icon');  if (icon)  icon.textContent  = isDark ? '☀️' : '🌙';
  const label = $('more-dark-label'); if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function loadDarkMode() {
  if (DB.get('darkMode')) {
    document.body.classList.add('dark-mode');
    const btn   = $('dark-toggle');     if (btn)   btn.textContent   = '☀️';
    const icon  = $('more-dark-icon');  if (icon)  icon.textContent  = '☀️';
    const label = $('more-dark-label'); if (label) label.textContent = 'Light Mode';
  }
}

// ── MORE DRAWER ──────────────────────────────────────────────────
function toggleMoreDrawer() {
  const drawer  = $('more-drawer');
  const overlay = $('more-drawer-overlay');
  if (!drawer || !overlay) return;
  const isOpen = drawer.style.display === 'flex';
  if (isOpen) {
    drawer.style.display  = 'none';
    overlay.style.display = 'none';
  } else {
    drawer.style.display  = 'flex';
    overlay.style.display = 'block';
    document.querySelectorAll('.more-item[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === currentTab);
    });
  }
}

function closeMoreDrawer() {
  const drawer  = $('more-drawer');
  const overlay = $('more-drawer-overlay');
  if (drawer)  drawer.style.display  = 'none';
  if (overlay) overlay.style.display = 'none';
}

// ── OFFLINE DETECTION ────────────────────────────────────────────
function initOfflineDetection() {
  function update() {
    const banner = $('offline-banner');
    if (!navigator.onLine) banner.classList.add('show');
    else banner.classList.remove('show');
  }
  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
  update();
}

// ── NOTIFICATIONS ────────────────────────────────────────────────
function toggleNotifPanel() {
  const panel   = $('notif-panel');
  const overlay = $('notif-overlay');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  if (!isOpen) {
    renderNotifPanel();
    const notifs = allNotifs();
    notifs.forEach(n => n.read = true);
    DB._set('notifications', notifs);
    updateNotifDot();
  }
}

function renderNotifPanel() {
  const notifs = allNotifs();
  const nl = $('notif-list');
  if (!nl) return;
  nl.innerHTML = notifs.map(n => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:10px;background:${n.read ? 'transparent' : 'var(--lightblue)'}">
      <span style="font-size:18px">${n.icon || '🔔'}</span>
      <div class="flex-1">
        <div class="text-sm" style="line-height:1.5">${n.text}</div>
        <div class="text-xs text-muted mt-3">${timeAgo(n.ts)}</div>
      </div>
    </div>`).join('') || '<div class="text-xs text-muted" style="padding:12px">No notifications yet.</div>';
}

// ── GLOBAL SEARCH ────────────────────────────────────────────────
function openGlobalSearch() {
  $('global-search-overlay').classList.add('open');
  setTimeout(() => $('global-search-input').focus(), 100);
}

function closeGlobalSearch(e) {
  if (!e || e.target.id === 'global-search-overlay') {
    $('global-search-overlay').classList.remove('open');
    $('global-search-input').value = '';
    $('search-results').innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">Start typing to search across MakChat...</div>';
  }
}

function runGlobalSearch(q) {
  const container = $('search-results');
  if (!q || q.length < 2) {
    container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">Type at least 2 characters...</div>';
    return;
  }
  const ql = q.toLowerCase();
  let html = '';

  const people = allUsers().filter(u => u.id !== CU.id && (
    u.name.toLowerCase().includes(ql) || (u.course || '').toLowerCase().includes(ql) || (u.username || '').toLowerCase().includes(ql)
  ));
  if (people.length) {
    html += `<div class="search-cat-header">👥 Students</div>`;
    html += people.slice(0, 4).map(u => `
      <div class="search-result-item" onclick="closeGlobalSearch();goTab('people')">
        <div class="search-result-icon" style="background:${u.color}"><span style="color:white;font-weight:700;font-size:13px">${initials(u.name)}</span></div>
        <div><div style="font-size:13px;font-weight:600">${u.name}</div><div style="font-size:11px;color:var(--muted)">${u.course} · ${collegeShort(u.college)}</div></div>
      </div>`).join('');
  }

  const posts = allPosts().filter(p => (p.body || '').toLowerCase().includes(ql));
  if (posts.length) {
    html += `<div class="search-cat-header">📣 Posts</div>`;
    html += posts.slice(0, 3).map(p => `
      <div class="search-result-item" onclick="closeGlobalSearch();openPost('${p.id}')">
        <div class="search-result-icon" style="background:var(--lightblue)">📣</div>
        <div><div style="font-size:13px;font-weight:600">${p.body.slice(0, 60)}...</div><div style="font-size:11px;color:var(--muted)">${timeAgo(p.createdAt)}</div></div>
      </div>`).join('');
  }

  const gigs = allGigs().filter(g => (g.title || '').toLowerCase().includes(ql) || (g.desc || '').toLowerCase().includes(ql));
  if (gigs.length) {
    html += `<div class="search-cat-header">⚡ Gigs</div>`;
    html += gigs.slice(0, 3).map(g => `
      <div class="search-result-item" onclick="closeGlobalSearch();goTab('gigs')">
        <div class="search-result-icon" style="background:var(--lightblue)">⚡</div>
        <div><div style="font-size:13px;font-weight:600">${g.title}</div><div style="font-size:11px;color:var(--muted)">${g.rate}</div></div>
      </div>`).join('');
  }

  const events = allEvents().filter(e => (e.title || '').toLowerCase().includes(ql) || (e.venue || '').toLowerCase().includes(ql));
  if (events.length) {
    html += `<div class="search-cat-header">📅 Events</div>`;
    html += events.slice(0, 3).map(e => `
      <div class="search-result-item" onclick="closeGlobalSearch();goTab('events')">
        <div class="search-result-icon" style="background:var(--lightblue)">📅</div>
        <div><div style="font-size:13px;font-weight:600">${e.title}</div><div style="font-size:11px;color:var(--muted)">${e.date} · ${e.venue}</div></div>
      </div>`).join('');
  }

  const listings = allListings().filter(l => (l.title || '').toLowerCase().includes(ql));
  if (listings.length) {
    html += `<div class="search-cat-header">🛒 Marketplace</div>`;
    html += listings.slice(0, 3).map(l => `
      <div class="search-result-item" onclick="closeGlobalSearch();openItem('${l.id}')">
        <div class="search-result-icon" style="background:var(--lightblue)">${l.emoji}</div>
        <div><div style="font-size:13px;font-weight:600">${l.title}</div><div style="font-size:11px;color:var(--muted)">${l.price === 0 ? 'FREE' : formatUGX(l.price)}</div></div>
      </div>`).join('');
  }

  const lfItems = allLF().filter(x => (x.title || '').toLowerCase().includes(ql) || (x.desc || '').toLowerCase().includes(ql));
  if (lfItems.length) {
    html += `<div class="search-cat-header">🔍 Lost & Found</div>`;
    html += lfItems.slice(0, 3).map(x => `
      <div class="search-result-item" onclick="closeGlobalSearch();openLFItem('${x.id}')">
        <div class="search-result-icon" style="background:var(--lightblue)">${x.status === 'lost' ? '❌' : '✅'}</div>
        <div><div style="font-size:13px;font-weight:600">${x.title}</div><div style="font-size:11px;color:var(--muted)">${x.location}</div></div>
      </div>`).join('');
  }

  container.innerHTML = html || `<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px">No results found for "<strong>${q}</strong>"</div>`;
}

// ── PROFILE COMPLETION STEPS ─────────────────────────────────────
function renderCompletionSteps() {
  const steps = [
    { label: 'Add a bio',            pts: '+10%', done: CU.bio && CU.bio.length > 10,         action: `openModal('edit-profile-modal')` },
    { label: 'Add interests',        pts: '+10%', done: !!CU.interests,                        action: `openModal('edit-profile-modal')` },
    { label: 'Add a skill',          pts: '+20%', done: (CU.skills || []).length > 0,          action: `pfTab('skills')` },
    { label: 'Add a portfolio item', pts: '+20%', done: (CU.portfolio || []).length > 0,       action: `openModal('add-port-modal')` },
    { label: 'Make a connection',    pts: '+15%', done: (CU.connections || []).length > 0,     action: `goTab('people')` },
    { label: 'Join a group',         pts: '+10%', done: (CU.groups || []).length > 0,          action: `goTab('groups')` },
  ];
  const list = $('completion-steps-list');
  if (!list) return;
  const incomplete = steps.filter(s => !s.done);
  if (!incomplete.length) {
    list.innerHTML = '<div style="color:var(--success);font-size:13px;font-weight:600">🎉 Your profile is complete! You\'re fully set up.</div>';
    const card = $('pf-completion-steps'); if (card) card.style.display = 'none';
    return;
  }
  list.innerHTML = incomplete.slice(0, 4).map(s => `
    <div class="profile-step" onclick="${s.action}">
      <span style="font-size:18px">➕</span>
      <span class="flex-1 text-sm font-semibold">${s.label}</span>
      <span class="profile-step-pts">${s.pts}</span>
    </div>`).join('');
}
