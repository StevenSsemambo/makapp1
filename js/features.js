// ================================================================
// MakChat — People Module
// ================================================================

function renderPeople() {
  const q = ($('people-search')?.value || '').toLowerCase();
  let users = allUsers().filter(u => u.id !== CU.id);
  if (peopleFilter === 'my-college') users = users.filter(u => u.college === CU.college);
  if (peopleFilter === 'connected')  users = users.filter(u => (CU.connections || []).includes(u.id));
  if (peopleFilter === 'mentors')    users = users.filter(u => u.isMentor);
  if (q) users = users.filter(u => u.name.toLowerCase().includes(q) || u.course.toLowerCase().includes(q) || (u.college || '').toLowerCase().includes(q) || (u.interests || '').toLowerCase().includes(q));
  $('people-grid').innerHTML = users.map(u => {
    const connected = (CU.connections || []).includes(u.id);
    return `<div class="match-card card-hov">
      <div class="avatar av-xl" style="background:${u.color};margin:0 auto 10px"><span style="color:white;font-weight:800">${initials(u.name)}</span></div>
      <div style="font-size:14px;font-weight:700;color:var(--blue)">${u.name}</div>
      <div class="flex justify-center gap-4 mt-4 flex-wrap">
        ${u.verified ? '<span class="pill pill-green" style="font-size:10px">✓ Verified</span>' : ''}
        ${u.isMentor  ? '<span class="pill pill-gold" style="font-size:10px">🌟 Mentor</span>'  : ''}
      </div>
      <div class="text-xs text-muted mt-6">${u.course}</div>
      <div class="text-xs text-muted mt-2">${u.year} · ${collegeShort(u.college)}</div>
      ${u.interests ? `<div class="text-xs" style="margin:8px 0;color:var(--blue);opacity:0.7">${u.interests}</div>` : ''}
      <div class="flex gap-6 justify-center mt-10">
        <button class="btn btn-sm ${connected ? 'btn-ghost' : 'btn-primary'}" onclick="toggleConnect('${u.id}')">
          ${connected ? '✓ Connected' : 'Connect'}
        </button>
        <button class="btn btn-sm btn-ghost" onclick="startChatWith('${u.id}')">💬</button>
      </div>
    </div>`;
  }).join('') || '<div class="text-muted text-sm" style="padding:32px 0;text-align:center;grid-column:1/-1">No students found.</div>';
}

function filterPeople(q) { renderPeople(); }
function setPeopleFilter(f, btn) {
  peopleFilter = f;
  document.querySelectorAll('#people-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderPeople();
}

function toggleConnect(userId) {
  const users = allUsers(); const me = users.find(u => u.id === CU.id); if (!me) return;
  me.connections = me.connections || [];
  const idx = me.connections.indexOf(userId);
  if (idx >= 0) { me.connections.splice(idx, 1); toast('Disconnected'); }
  else {
    me.connections.push(userId); addPoints(10);
    const other = getUser(userId);
    toast(`Connected with ${other?.name || 'student'}! 🤝`);
    addNotif('🤝', `You connected with ${other?.name || 'a student'}`);
  }
  saveUsers(users); CU = me; renderPeople(); refreshUI();
}

// ================================================================
// MakChat — Marketplace Module
// ================================================================

function renderMarket() {
  let listings = allListings();
  if (mktFilter !== 'all') listings = listings.filter(l => l.cat === mktFilter);
  $('market-grid').innerHTML = listings.map(l => {
    const u = getUser(l.userId); const isMine = l.userId === CU.id;
    return `<div class="mkt-card" onclick="openItem('${l.id}')">
      ${l.sold ? '<div style="position:absolute;top:10px;right:10px"><span class="pill pill-red">SOLD</span></div>' : ''}
      <span class="mkt-emoji">${l.emoji}</span>
      <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:4px;line-height:1.4">${l.title}</div>
      <div class="mkt-price mt-6">${l.price === 0 ? 'FREE' : formatUGX(l.price)}</div>
      <div class="text-xs text-muted mt-4">${l.cond} · ${l.cat}</div>
      <div class="flex justify-between items-center mt-10">
        <span class="text-xs text-muted">${u ? u.name.split(' ')[0] : '?'} · ${u ? collegeShort(u.college) : ''}</span>
        <div class="flex gap-4">
          ${isMine && !l.sold ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();confirmMarkSold('${l.id}')">Sold</button>` : ''}
          ${isMine ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();confirmDeleteListing('${l.id}')">🗑</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('') || emptyState('🛒', 'No listings yet', 'List your textbooks, notes, or offer tutoring!', '+ List an Item', "openModal('list-modal')");
}

function filterMarket(f, btn) {
  mktFilter = f;
  document.querySelectorAll('#mkt-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderMarket();
}

function openItem(id) {
  const l = allListings().find(x => x.id === id); if (!l) return;
  const u = getUser(l.userId);
  $('item-detail-content').innerHTML = `
    <div class="flex justify-between items-center mb-16">
      <div style="font-size:36px">${l.emoji}</div>
      <button class="modal-x" onclick="$('item-overlay').classList.remove('open')">✕</button>
    </div>
    <div style="font-size:18px;font-weight:800;color:var(--blue);margin-bottom:8px">${l.title}</div>
    <div class="flex gap-8 mb-12">
      <span class="pill pill-blue">${l.cat}</span>
      <span class="pill pill-gray">${l.cond}</span>
      ${l.sold ? '<span class="pill pill-red">SOLD</span>' : ''}
    </div>
    <div style="font-size:22px;font-weight:900;color:var(--blue);margin-bottom:12px">${l.price === 0 ? 'FREE' : formatUGX(l.price)}</div>
    <div class="card" style="margin-bottom:14px"><div class="text-sm" style="line-height:1.65">${l.desc || 'No description.'}</div></div>
    <div class="flex items-center gap-12 mb-14">
      <div class="avatar av-sm" style="background:${u?.color || '#003478'}"><span style="color:white;font-size:9px;font-weight:700">${u ? initials(u.name) : '?'}</span></div>
      <div><div class="text-sm font-semibold">${u?.name || 'Unknown'}</div><div class="text-xs text-muted">${u ? collegeShort(u.college) : ''}</div></div>
    </div>
    <div class="flex gap-8 flex-wrap">
      ${!l.sold ? `<button class="btn btn-whatsapp flex-1" onclick="openWhatsApp('${l.contact}','Hi! I saw your listing on MakChat: ${l.title.replace(/'/g, '')}. Is it still available?')">📲 WhatsApp Seller</button>` : '<div class="text-muted text-sm">This item has been sold.</div>'}
      ${u && u.id !== CU.id ? `<button class="btn btn-primary btn-sm" onclick="startChatWith('${u.id}')">💬 MakChat</button>` : ''}
    </div>`;
  $('item-overlay').classList.add('open');
}

function createListing() {
  const title = $('m-title').value.trim(); const cat = $('m-cat').value;
  const cond  = $('m-cond').value;        const price = parseInt($('m-price').value) || 0;
  const contact = $('m-contact').value.trim(); const desc = $('m-desc').value.trim();
  if (!title) { toast('Enter a title', 'error'); return; }
  const catEmojis = { textbooks:'📚', notes:'📝', 'past-papers':'📄', tutoring:'🎓', equipment:'🛠', exchange:'🔄', free:'🆓', other:'📦' };
  const newListing = { id: 'm' + Date.now(), userId: CU.id, title, cat, cond, price, contact, desc, emoji: catEmojis[cat] || '📦', sold: false, createdAt: Date.now() };
  const ls = DB._get('listings') || []; ls.unshift(newListing); DB._set('listings', ls);
  AW.upsertOne('listings', newListing);
  addPoints(15); closeModal('list-modal');
  [$('m-title'), $('m-contact'), $('m-desc'), $('m-price')].forEach(el => { if (el) el.value = ''; });
  toast('Listed! 🛒'); renderMarket();
}

async function confirmMarkSold(id) {
  const ok = await showConfirm('Mark as Sold', 'Show this item as sold to all buyers.', 'Mark Sold', '✅', 'var(--success)');
  if (ok) {
    const listings = allListings(); const l = listings.find(x => x.id === id); if (!l) return;
    l.sold = true; DB._set('listings', listings); AW.upsertOne('listings', l); addPoints(20); toast('Marked as sold! ✅'); renderMarket();
  }
}

async function confirmDeleteListing(id) {
  const ok = await showConfirm('Delete Listing', 'This listing will be permanently removed.', 'Delete', '🗑️');
  if (ok) { const listings = allListings().filter(x => x.id !== id); DB._set('listings', listings); toast('Listing deleted'); renderMarket(); }
}

// ================================================================
// MakChat — Hostel Hub Module
// ================================================================

function renderHostel() {
  let hostels = allHostels();
  if (hostelFilter !== 'all') hostels = hostels.filter(h => h.type === hostelFilter);
  const typeLabels = { campus:'🏛 On-Campus', offcampus:'🏘 Off-Campus', roommate:'🤝 Roommate', review:'⭐ Review', warning:'⚠️ Warning' };
  $('hostel-grid').innerHTML = hostels.map(h => {
    const u = getUser(h.userId);
    return `<div class="hostel-card" onclick="openHostelItem('${h.id}')">
      <div class="flex justify-between items-start mb-8">
        <span class="pill ${h.type === 'warning' ? 'pill-red' : h.type === 'review' ? 'pill-gold' : 'pill-blue'}">${typeLabels[h.type] || h.type}</span>
        ${h.price ? `<span class="font-bold text-sm" style="color:var(--blue)">${formatUGX(h.price)}/mo</span>` : ''}
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:6px;line-height:1.4">${h.title}</div>
      <div class="text-xs text-muted mb-8">📍 ${h.location}</div>
      <div class="text-xs" style="color:var(--muted);line-height:1.55">${h.desc.slice(0, 100)}${h.desc.length > 100 ? '...' : ''}</div>
      <div class="flex justify-between items-center mt-10">
        <span class="text-xs text-muted">${u ? u.name.split(' ')[0] : '?'} · ${timeAgo(h.createdAt)}</span>
        ${h.type === 'review' && h.rating ? `<span style="color:var(--gold2)">★</span><span class="text-xs font-semibold">${h.rating}/5</span>` : ''}
      </div>
    </div>`;
  }).join('') || '<div class="text-muted text-sm text-center" style="padding:32px 0;grid-column:1/-1">No posts in this category yet.</div>';
}

function filterHostel(f, btn) {
  hostelFilter = f;
  document.querySelectorAll('#hostel-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderHostel();
}

function openHostelItem(id) {
  const h = allHostels().find(x => x.id === id); if (!h) return;
  const u = getUser(h.userId);
  const typeLabels = { campus:'🏛 On-Campus', offcampus:'🏘 Off-Campus', roommate:'🤝 Roommate Needed', review:'⭐ Review', warning:'⚠️ Warning' };
  const typeColors = { campus:'pill-blue', offcampus:'pill-blue', roommate:'pill-gold', review:'pill-gold', warning:'pill-red' };
  $('item-detail-content').innerHTML = `
    <div class="flex justify-between items-center mb-12">
      <span class="pill ${typeColors[h.type] || 'pill-blue'}" style="font-size:12px">${typeLabels[h.type] || h.type}</span>
      <button class="modal-x" onclick="$('item-overlay').classList.remove('open')">✕</button>
    </div>
    <div style="font-size:20px;font-weight:800;color:var(--blue);margin-bottom:6px;line-height:1.3">${h.title}</div>
    <div class="flex items-center gap-8 mb-12">
      <span class="text-sm text-muted">📍 ${h.location}</span>
      ${h.price ? `<span style="font-size:16px;font-weight:800;color:var(--blue);margin-left:auto">${formatUGX(h.price)}<span style="font-size:11px;font-weight:500">/mo</span></span>` : ''}
    </div>
    <div style="background:var(--cream);border-radius:12px;padding:14px;margin-bottom:16px">
      <div class="text-sm" style="line-height:1.75">${h.desc}</div>
    </div>
    <div class="flex gap-8">
      ${h.contact ? `<button class="btn btn-whatsapp btn-full" onclick="openWhatsApp('${h.contact}','Hi! I found your hostel listing on MakChat: ${h.title.replace(/'/g, '')}. Still available?')">📲 WhatsApp — ${h.contact}</button>` : ''}
      ${u && u.id !== CU.id ? `<button class="btn btn-primary btn-full" onclick="startChatWith('${u.id}')">💬 Message ${u.name.split(' ')[0]}</button>` : ''}
    </div>`;
  $('item-overlay').classList.add('open');
}

function createHostelPost() {
  const title = $('h-title').value.trim(); const type = $('h-type').value;
  const price = parseInt($('h-price').value) || 0; const location = $('h-location').value.trim();
  const desc  = $('h-desc').value.trim();          const contact  = $('h-contact').value.trim();
  if (!title || !location || !desc) { toast('Fill in title, location and description', 'error'); return; }
  const newHostel = { id: 'h' + Date.now(), userId: CU.id, title, type, price, location, desc, contact, rating: 0, createdAt: Date.now() };
  DB.push('hostels', newHostel);
  AW.upsertOne('hostels', newHostel);
  addPoints(10); closeModal('hostel-modal');
  [$('h-title'), $('h-location'), $('h-desc'), $('h-contact'), $('h-price')].forEach(el => { if (el) el.value = ''; });
  toast('Posted to Hostel Hub! 🏠'); renderHostel();
}

// ================================================================
// MakChat — Skills & Gigs Module
// ================================================================

function renderGigs() {
  let gigs = allGigs();
  if (gigsFilter !== 'all') gigs = gigs.filter(g => g.cat === gigsFilter);
  const catIcons = { tutoring:'📖', design:'🎨', tech:'💻', writing:'✍️', photo:'📸', other:'🔧' };
  $('gigs-grid').innerHTML = gigs.map(g => {
    const u = getUser(g.userId);
    const reviewCount = (g.reviews || []).length;
    const stars = '★'.repeat(Math.round(g.rating || 0)) + '☆'.repeat(5 - Math.round(g.rating || 0));
    return `<div class="gig-card" onclick="openGigItem('${g.id}')">
      <div class="flex items-center gap-10 mb-10">
        <div class="avatar av-sm" style="background:${u?.color || '#003478'}"><span style="color:white;font-size:9px;font-weight:700">${u ? initials(u.name) : '?'}</span></div>
        <div>
          <div class="text-sm font-semibold" style="color:var(--blue)">${u?.name || '?'}</div>
          <div class="text-xs text-muted">${u ? collegeShort(u.college) : ''}</div>
        </div>
        ${u?.verified ? '<span class="pill pill-green" style="font-size:9px;margin-left:auto">✓</span>' : ''}
      </div>
      <div style="font-size:22px;margin-bottom:8px">${catIcons[g.cat] || '🔧'}</div>
      <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:6px;line-height:1.4">${g.title}</div>
      <div class="text-xs text-muted mb-8" style="line-height:1.5">${(g.desc || '').slice(0, 80)}${(g.desc || '').length > 80 ? '...' : ''}</div>
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px">${g.rate}</div>
      <div class="flex justify-between items-center">
        <div>
          <span style="color:#FFD700;font-size:12px">${stars}</span>
          <span class="text-xs text-muted ml-4">${reviewCount > 0 ? reviewCount + ' review' + (reviewCount !== 1 ? 's' : '') : 'No reviews'}</span>
        </div>
        ${u && u.id !== CU.id ? `<button class="btn btn-sm btn-ghost" onclick="openRateGig('${g.id}',event)" style="font-size:10px">⭐ Rate</button>` : ''}
      </div>
    </div>`;
  }).join('') || emptyState('⚡', 'No gigs yet', 'Be the first to offer a service!', '+ Offer Your Service', "openModal('gig-modal')");
}

function filterGigs(f, btn) {
  gigsFilter = f;
  document.querySelectorAll('#gigs-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderGigs();
}

function openGigItem(id) {
  const g = allGigs().find(x => x.id === id); if (!g) return;
  const u = getUser(g.userId);
  $('item-detail-content').innerHTML = `
    <div class="flex justify-between items-center mb-16">
      <div class="flex items-center gap-12">
        <div class="avatar av-lg" style="background:${u?.color || '#003478'}"><span style="color:white;font-size:16px;font-weight:700">${u ? initials(u.name) : '?'}</span></div>
        <div><div class="font-semibold">${u?.name || 'Unknown'}</div><div class="text-xs text-muted">${u ? `${collegeShort(u.college)} · ${u.course}` : ''}</div></div>
      </div>
      <button class="modal-x" onclick="$('item-overlay').classList.remove('open')">✕</button>
    </div>
    <div style="font-size:18px;font-weight:800;color:var(--blue);margin-bottom:8px">${g.title}</div>
    ${g.rating ? `<div style="color:var(--gold2);margin-bottom:8px">${'★'.repeat(Math.round(g.rating))} <span class="text-xs text-muted">${g.rating}/5 · ${g.orders || 0} orders</span></div>` : ''}
    <div class="card mb-14"><div class="text-sm" style="line-height:1.7">${g.desc}</div></div>
    <div style="font-size:20px;font-weight:900;color:var(--blue);margin-bottom:16px">${g.rate}</div>
    <div class="flex gap-8">
      <button class="btn btn-whatsapp flex-1" onclick="openWhatsApp('${g.contact}','Hi ${u?.name?.split(' ')[0] || ''}! I saw your ${g.title.replace(/'/g, '')} on MakChat. Available?')">📲 WhatsApp</button>
      ${u && u.id !== CU.id ? `<button class="btn btn-primary btn-sm" onclick="startChatWith('${u.id}')">💬 Message</button>` : ''}
    </div>`;
  $('item-overlay').classList.add('open');
}

function createGig() {
  const title = $('gi-title').value.trim(); const cat  = $('gi-cat').value;
  const rate  = $('gi-rate').value.trim();  const desc  = $('gi-desc').value.trim();
  const contact = $('gi-contact').value.trim();
  if (!title || !rate || !desc) { toast('Fill all required fields', 'error'); return; }
  const newGig = { id: 'gi' + Date.now(), userId: CU.id, title, cat, rate, desc, contact, rating: 0, orders: 0, reviews: [], createdAt: Date.now() };
  DB.push('gigs', newGig);
  AW.upsertOne('gigs', newGig);
  addPoints(20); closeModal('gig-modal');
  [$('gi-title'), $('gi-rate'), $('gi-desc'), $('gi-contact')].forEach(el => { if (el) el.value = ''; });
  toast('Service listed! ⚡'); renderGigs();
}

function openRateGig(gigId, e) {
  e.stopPropagation(); ratingGigId = gigId; currentRating = 0;
  $('rating-gig-id').value = gigId;
  const gig = allGigs().find(g => g.id === gigId);
  $('rate-gig-content').innerHTML = gig ? `<div style="font-size:14px;font-weight:700;color:var(--blue);margin-bottom:16px">${gig.title}</div>` : '';
  $('rating-review').value = ''; setRating(0); openModal('rate-gig-modal');
}

function setRating(n) {
  currentRating = n;
  document.querySelectorAll('#star-rating-input .star').forEach((star, i) => {
    star.classList.toggle('filled', i < n); star.classList.toggle('empty', i >= n);
    star.style.color = i < n ? '#FFD700' : '#d1d5db';
  });
}

function submitRating() {
  if (!currentRating) { toast('Please select a star rating', 'error'); return; }
  const gigId  = $('rating-gig-id').value;
  const review = $('rating-review').value.trim();
  const gigs   = allGigs(); const gig = gigs.find(g => g.id === gigId); if (!gig) return;
  gig.reviews  = gig.reviews || [];
  gig.reviews.push({ userId: CU.id, rating: currentRating, review, ts: Date.now() });
  const avg = gig.reviews.reduce((s, r) => s + r.rating, 0) / gig.reviews.length;
  gig.rating  = Math.round(avg * 10) / 10;
  gig.orders  = (gig.orders || 0) + 1;
  DB._set('gigs', gigs);
  AW.upsertOne('gigs', gig);
  addPoints(10); closeModal('rate-gig-modal');
  toast('Review submitted! ⭐');
  if (currentTab === 'gigs') renderGigs();
}

// ================================================================
// MakChat — Events Module
// ================================================================

function renderEvents() {
  let events = allEvents();
  if (eventFilter !== 'all') events = events.filter(e => e.cat === eventFilter);
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  const catColors = { academic:'pill-blue', social:'pill-green', tech:'pill-blue', sports:'pill-gold', career:'pill-blue', cultural:'pill-gold' };
  $('events-list').innerHTML = events.map(e => {
    const d = new Date(e.date); const rsvpd = (e.rsvps || []).includes(CU.id);
    return `<div class="event-card">
      <div class="event-date-badge">
        <div class="event-date-day">${d.getDate()}</div>
        <div class="event-date-mon">${d.toLocaleString('en', { month: 'short' })}</div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-8 mb-4">
          <span class="pill ${catColors[e.cat] || 'pill-blue'}" style="font-size:10px">${e.cat}</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:var(--blue);margin-bottom:4px">${e.title}</div>
        <div class="text-xs text-muted mb-6">⏰ ${e.time || 'TBD'} · 📍 ${e.venue}</div>
        <div class="text-xs text-muted mb-8" style="line-height:1.5">${e.desc.slice(0, 100)}${e.desc.length > 100 ? '...' : ''}</div>
        <div class="flex gap-8 items-center">
          <button class="btn btn-sm ${rsvpd ? 'btn-success' : 'btn-primary'}" onclick="rsvpEvent('${e.id}')">
            ${rsvpd ? "✓ RSVP'd" : 'RSVP'}
          </button>
          <span class="text-xs text-muted">${(e.rsvps || []).length} attending</span>
          <span class="text-xs text-muted ml-auto">by ${e.organizer}</span>
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="text-muted text-sm text-center" style="padding:32px 0">No events found.</div>';
}

function filterEvents(f, btn) {
  eventFilter = f;
  document.querySelectorAll('#event-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderEvents();
}

function rsvpEvent(id) {
  const events = allEvents(); const e = events.find(x => x.id === id); if (!e) return;
  e.rsvps = e.rsvps || [];
  const idx = e.rsvps.indexOf(CU.id);
  if (idx >= 0) { e.rsvps.splice(idx, 1); toast('RSVP removed'); }
  else { e.rsvps.push(CU.id); addPoints(5); toast(`RSVP'd for ${e.title}! 📅`); }
  DB._set('events', events); AW.upsertOne('events', e); renderEvents();
}

function createEvent() {
  const title = $('ev-title').value.trim(); const cat = $('ev-cat').value;
  const date  = $('ev-date').value;         const time = $('ev-time').value;
  const venue = $('ev-venue').value.trim(); const desc = $('ev-desc').value.trim();
  const organizer = $('ev-organizer').value.trim();
  if (!title || !date || !venue) { toast('Title, date and venue are required', 'error'); return; }
  const newEvent = { id: 'ev' + Date.now(), userId: CU.id, title, cat, date, time, venue, desc, organizer: organizer || CU.name, rsvps: [], createdAt: Date.now() };
  DB.push('events', newEvent);
  AW.upsertOne('events', newEvent);
  addPoints(15); closeModal('event-modal');
  [$('ev-title'), $('ev-date'), $('ev-time'), $('ev-venue'), $('ev-desc'), $('ev-organizer')].forEach(el => { if (el) el.value = ''; });
  toast('Event added! 📅'); renderEvents();
}

// ================================================================
// MakChat — Opportunities Module
// ================================================================

function renderOpps() {
  let opps = allOpps();
  if (oppFilter !== 'all') opps = opps.filter(o => o.type === oppFilter);
  const typeColors = { scholarship:'pill-green', internship:'pill-blue', grant:'pill-gold', fellowship:'pill-blue', competition:'pill-red', job:'pill-blue' };
  $('opps-list').innerHTML = opps.map(o => {
    const saved = (o.saved || []).includes(CU.id);
    const days  = Math.max(0, Math.ceil((new Date(o.deadline) - Date.now()) / 86400000));
    return `<div class="opp-card">
      <div class="flex items-start gap-12 mb-10">
        <div class="flex-1">
          <div class="flex items-center gap-8 mb-8">
            <span class="pill ${typeColors[o.type] || 'pill-blue'}">${o.type}</span>
            ${o.urgent ? '<span class="pill pill-red">⏰ Urgent</span>' : ''}
          </div>
          <div style="font-size:16px;font-weight:800;color:var(--blue);margin-bottom:6px">${o.title}</div>
          <div class="text-sm text-muted mb-8" style="line-height:1.55">${o.desc}</div>
          <div class="flex gap-16">
            <span class="text-sm font-semibold" style="color:var(--blue)">💰 ${o.amount}</span>
            <span class="text-sm ${days <= 7 ? 'deadline-urgent' : days <= 14 ? 'deadline-warn' : 'text-muted'}">⏰ ${days}d left</span>
          </div>
          <div class="text-xs text-muted mt-4">by ${o.provider}</div>
        </div>
        <button class="btn btn-sm ${saved ? 'btn-primary' : 'btn-ghost'}" onclick="toggleSaveOpp('${o.id}',event)">${saved ? '★ Saved' : '☆ Save'}</button>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-gold btn-sm flex-1" onclick="applyOpp('${o.id}')">Apply Now →</button>
      </div>
    </div>`;
  }).join('');
}

function filterOpps(f, btn) {
  oppFilter = f;
  document.querySelectorAll('#opp-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderOpps();
}

function applyOpp(id) {
  const opps = allOpps(); const o = opps.find(x => x.id === id); if (!o) return;
  if (o.link && o.link !== '#') { window.open(o.link, '_blank', 'noopener,noreferrer'); toast('Opening application page 🚀'); addPoints(5); }
  else { toast('Application link coming soon — check back!'); }
}

function toggleSaveOpp(id, e) {
  e.stopPropagation();
  const opps = allOpps(); const o = opps.find(x => x.id === id); if (!o) return;
  o.saved = o.saved || [];
  const idx = o.saved.indexOf(CU.id);
  if (idx >= 0) { o.saved.splice(idx, 1); toast('Removed from saved'); }
  else { o.saved.push(CU.id); addPoints(5); toast('Saved! ★'); }
  DB.set('opportunities', opps); renderOpps();
}

// ================================================================
// MakChat — Announcements Module
// ================================================================

function renderAnnouncements() {
  let anns = allAnn();
  if (annFilter === 'urgent')    anns = anns.filter(a => a.cat === 'urgent');
  else if (annFilter === 'my-college') anns = anns.filter(a => a.college === 'All' || a.college === collegeShort(CU.college));
  else if (annFilter !== 'all')  anns = anns.filter(a => a.cat === annFilter);
  $('announcements-list').innerHTML = anns.map(a => `
    <div class="ann-card ${a.cat === 'urgent' ? 'urgent' : a.college !== 'All' ? 'gold' : ''}">
      <div class="flex justify-between items-start mb-8">
        <div class="flex items-center gap-8 flex-wrap">
          <span class="pill ${a.cat === 'urgent' ? 'pill-red' : a.cat === 'guild' ? 'pill-gold' : 'pill-blue'}">${a.cat}</span>
          ${a.college !== 'All' ? `<span class="pill pill-gray">${a.college}</span>` : '<span class="pill pill-gray">All Colleges</span>'}
        </div>
        <span class="text-xs text-muted">${timeAgo(a.createdAt)}</span>
      </div>
      <div style="font-size:15px;font-weight:700;color:var(--blue);margin-bottom:8px">${a.title}</div>
      <div class="text-sm" style="line-height:1.7;color:var(--text)">${a.body}</div>
    </div>`).join('') || '<div class="text-muted text-sm text-center" style="padding:32px 0">No announcements.</div>';
}

function filterAnn(f, btn) {
  annFilter = f;
  document.querySelectorAll('#ann-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderAnnouncements();
}

function createAnnouncement() {
  if (!CU.verified) { toast('Only verified users can post announcements', 'error'); return; }
  const title = $('an-title').value.trim(); const cat = $('an-cat').value;
  const college = $('an-college').value;   const body = $('an-body').value.trim();
  if (!title || !body) { toast('Title and message are required', 'error'); return; }
  const newAnn = { id: 'an' + Date.now(), userId: CU.id, title, cat, college, body, createdAt: Date.now() };
  DB.push('announcements', newAnn);
  AW.upsertOne('announcements', newAnn);
  addPoints(20); closeModal('ann-modal');
  [$('an-title'), $('an-body')].forEach(el => { if (el) el.value = ''; });
  toast('Announcement posted! 📢'); renderAnnouncements();
}

// ================================================================
// MakChat — Lost & Found Module
// ================================================================

function renderLF() {
  let items = allLF();
  if (lfFilter === 'lost')    items = items.filter(x => x.status === 'lost');
  else if (lfFilter === 'found')   items = items.filter(x => x.status === 'found');
  else if (lfFilter === 'claimed') items = items.filter(x => x.claimed);
  $('lf-grid').innerHTML = items.map(item => {
    const u = getUser(item.userId);
    return `<div class="lf-card" onclick="openLFItem('${item.id}')">
      <div class="flex justify-between items-center mb-8">
        <span class="pill ${item.claimed ? 'pill-green' : item.status === 'lost' ? 'pill-red' : 'pill-green'}">${item.claimed ? '🎉 Claimed' : item.status === 'lost' ? '❌ Lost' : '✅ Found'}</span>
        <span class="text-xs text-muted">${timeAgo(item.createdAt)}</span>
      </div>
      <div style="font-size:14px;font-weight:700;color:var(--blue);margin-bottom:6px">${item.title}</div>
      <div class="text-xs text-muted mb-6">📍 ${item.location}</div>
      <div class="text-xs" style="color:var(--muted);line-height:1.5">${item.desc.slice(0, 90)}${item.desc.length > 90 ? '...' : ''}</div>
      <div class="text-xs text-muted mt-8">${u ? u.name.split(' ')[0] : '?'}</div>
    </div>`;
  }).join('') || emptyState('🔍', 'Nothing reported yet', 'Help the community by reporting lost or found items', '+ Report Item', "openModal('lf-modal')");
}

function filterLF(f, btn) {
  lfFilter = f;
  document.querySelectorAll('#lf-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary'; renderLF();
}

function openLFItem(id) {
  const item = allLF().find(x => x.id === id); if (!item) return;
  const u = getUser(item.userId);
  $('item-detail-content').innerHTML = `
    <div class="flex justify-between items-center mb-16">
      <span class="pill ${item.claimed ? 'pill-green' : item.status === 'lost' ? 'pill-red' : 'pill-green'}">${item.claimed ? '🎉 Claimed' : item.status === 'lost' ? '❌ Lost' : '✅ Found'}</span>
      <button class="modal-x" onclick="$('item-overlay').classList.remove('open')">✕</button>
    </div>
    <div style="font-size:18px;font-weight:800;color:var(--blue);margin-bottom:8px">${item.title}</div>
    <div class="text-sm text-muted mb-12">📍 ${item.location} · 📅 ${item.date || 'Unknown date'}</div>
    <div class="card mb-14"><div class="text-sm" style="line-height:1.7">${item.desc}</div></div>
    <div class="flex gap-8">
      ${!item.claimed ? `<button class="btn btn-whatsapp flex-1" onclick="openWhatsApp('${item.contact}','Hi! I saw your Lost and Found post on MakChat about: ${item.title.replace(/'/g, '')}')">📲 WhatsApp</button>` : '<div class="text-muted text-sm">This item has been claimed.</div>'}
      ${u && u.id !== CU.id ? `<button class="btn btn-primary btn-sm" onclick="startChatWith('${u.id}')">💬 Message</button>` : ''}
      ${u && u.id === CU.id && !item.claimed ? `<button class="btn btn-success btn-sm" onclick="markLFClaimed('${item.id}')">✅ Mark Claimed</button>` : ''}
    </div>`;
  $('item-overlay').classList.add('open');
}

function markLFClaimed(id) {
  const items = allLF(); const item = items.find(x => x.id === id); if (!item) return;
  item.claimed = true; DB._set('lostfound', items); AW.upsertOne('lost_found', item);
  addPoints(10); toast('Marked as claimed! 🎉');
  $('item-overlay').classList.remove('open'); renderLF();
}

function createLFPost() {
  const status = $('lf-status').value; const title = $('lf-title').value.trim();
  const location = $('lf-location').value.trim(); const date = $('lf-date').value;
  const desc = $('lf-desc').value.trim(); const contact = $('lf-contact').value.trim();
  if (!title || !location || !desc) { toast('Title, location and description are required', 'error'); return; }
  const newItem = { id: 'lf' + Date.now(), userId: CU.id, title, status, location, date, desc, contact, claimed: false, createdAt: Date.now() };
  DB.push('lostfound', newItem);
  AW.upsertOne('lost_found', newItem);
  addPoints(8); closeModal('lf-modal');
  [$('lf-title'), $('lf-location'), $('lf-date'), $('lf-desc'), $('lf-contact')].forEach(el => { if (el) el.value = ''; });
  toast('Report submitted! 🔍'); renderLF();
}
