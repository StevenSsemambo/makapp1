// ================================================================
// MakChat — Profile Module
// ================================================================

function renderProfile() {
  if (!CU) return;
  refreshUI();
  renderPortfolio();
  const mt = $('mentor-toggle-btn');
  if (mt) {
    mt.style.background = CU.isMentor ? 'var(--gold)' : 'var(--sand)';
    mt.style.color      = CU.isMentor ? 'var(--blue)' : 'var(--muted)';
    mt.textContent      = CU.isMentor ? '✓ You\'re a Mentor' : 'Become a Mentor';
  }
  const ms = $('mentor-status'); if (ms) ms.textContent = CU.isMentor ? 'Active — students can find you' : 'Not active';

  const mentors = allUsers().filter(u => u.isMentor && u.id !== CU.id).slice(0, 4);
  const mm = $('my-mentors');
  if (mm) mm.innerHTML = mentors.map(u => `
    <div class="flex items-center gap-12 card mb-8">
      <div class="avatar av-md" style="background:${u.color}"><span style="color:white;font-weight:700">${initials(u.name)}</span></div>
      <div class="flex-1">
        <div class="font-semibold text-sm">${u.name} <span class="pill pill-gold" style="font-size:9px">🌟 Mentor</span></div>
        <div class="text-xs text-muted">${u.course} · ${collegeShort(u.college)}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="startChatWith('${u.id}')">Message</button>
    </div>`).join('') || '<div class="text-xs text-muted">No mentors available right now.</div>';

  pfTab(pfActiveTab);
}

function pfTab(tab) {
  pfActiveTab = tab;
  ['achievements', 'skills', 'mentorship'].forEach(t => {
    const sec = $(`pf-section-${t}`); const btn = $(`pf-tab-${t}`);
    if (sec) sec.style.display = t === tab ? 'block' : 'none';
    if (btn) { btn.style.borderBottom = t === tab ? '2px solid var(--blue)' : 'none'; btn.style.color = t === tab ? 'var(--blue)' : 'var(--muted)'; }
  });
  if (tab === 'skills') renderSkills();
}

function renderPortfolio() {
  const icons = { Research:'📄', Achievement:'🏆', Certification:'🎓', Leadership:'👑', Project:'🛠', Volunteer:'💙', Award:'🥇' };
  const portfolio = CU.portfolio || [];
  const pi = $('port-items'); if (!pi) return;
  pi.innerHTML = portfolio.length
    ? portfolio.map(item => `
      <div class="card flex items-center gap-14">
        <div style="width:40px;height:40px;border-radius:10px;background:${item.verified ? 'rgba(45,106,39,0.1)' : 'var(--sand)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icons[item.type] || '📋'}</div>
        <div class="flex-1">
          <div class="font-semibold text-sm" style="color:var(--blue)">${item.title}</div>
          <div class="text-xs text-muted mt-3">${item.type} · ${item.date || '—'}</div>
          ${item.desc ? `<div class="text-xs text-muted mt-3" style="line-height:1.5">${item.desc}</div>` : ''}
        </div>
        <div class="flex flex-col items-end gap-6">
          ${item.verified ? '<span class="pill pill-green">✓ Verified</span>' : '<span class="pill pill-gray">Pending</span>'}
          <button class="btn btn-sm btn-danger" style="padding:3px 7px;font-size:11px" onclick="deletePortfolioItem('${item.id}')">🗑</button>
        </div>
      </div>`).join('')
    : '<div class="text-muted text-sm" style="padding:16px 0">No achievements yet. Add your first one! 🏆</div>';
}

function renderSkills() {
  const skills = CU.skills || [];
  const sc = $('skills-card'); if (!sc) return;
  sc.innerHTML = skills.length
    ? skills.map((s, i) => `
      <div style="margin-bottom:14px">
        <div class="flex justify-between mb-5">
          <span class="text-sm font-semibold" style="color:var(--blue)">${s.name}</span>
          <div class="flex items-center gap-8">
            <span class="text-xs text-muted">${s.level}%</span>
            <button class="btn btn-sm btn-danger" style="padding:2px 6px;font-size:10px" onclick="deleteSkill(${i})">✕</button>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${s.level}%"></div></div>
      </div>`).join('')
    : '<div class="text-muted text-sm" style="padding:8px 0">No skills added yet. Add skills to get found for gigs!</div>';
}

function deleteSkill(index) {
  const users = allUsers(); const me = users.find(u => u.id === CU.id); if (!me) return;
  (me.skills = me.skills || []).splice(index, 1);
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  toast('Skill removed'); renderSkills(); refreshUI();
}

function showAddSkill() {
  const f = $('add-skill-form'); if (f) f.classList.toggle('hidden');
}

async function deletePortfolioItem(itemId) {
  const ok = await showConfirm('Delete Achievement', 'Remove this portfolio item?', 'Delete', '🗑️');
  if (!ok) return;
  const users = allUsers(); const me = users.find(u => u.id === CU.id); if (!me) return;
  me.portfolio = (me.portfolio || []).filter(p => p.id !== itemId);
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  toast('Achievement removed'); renderPortfolio();
}

function addPortfolioItem() {
  const title = $('p-title').value.trim(); const type = $('p-type').value;
  const date  = $('p-date').value;         const desc = $('p-desc').value.trim();
  if (!title) { toast('Enter a title', 'error'); return; }
  const users = allUsers(); const me = users.find(u => u.id === CU.id);
  me.portfolio = me.portfolio || [];
  me.portfolio.unshift({ id: 'port' + Date.now(), title, type, date, desc, verified: false });
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  addPoints(25); closeModal('add-port-modal');
  [$('p-title'), $('p-date'), $('p-desc')].forEach(el => { if (el) el.value = ''; });
  toast('Achievement added! 🏆'); renderPortfolio(); refreshUI();
}

function saveSkill() {
  const name  = $('new-skill-name').value.trim();
  const level = Math.min(100, Math.max(1, parseInt($('new-skill-level').value) || 50));
  if (!name) { toast('Enter a skill name', 'error'); return; }
  const users = allUsers(); const me = users.find(u => u.id === CU.id);
  me.skills = me.skills || [];
  if (me.skills.find(s => s.name.toLowerCase() === name.toLowerCase())) { toast('Skill already added', 'error'); return; }
  me.skills.push({ name, level });
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  $('new-skill-name').value = ''; $('new-skill-level').value = '';
  $('add-skill-form').classList.add('hidden');
  addPoints(10); toast('Skill added! 💪'); renderSkills(); refreshUI();
}

function toggleMentor() {
  const users = allUsers(); const me = users.find(u => u.id === CU.id); if (!me) return;
  me.isMentor = !me.isMentor;
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  toast(me.isMentor ? 'You\'re now a Mentor! Students can find you 🌟' : 'Removed from mentor list');
  renderProfile(); refreshUI();
}

function saveProfileEdit() {
  const bio       = $('ep-bio').value.trim();
  const course    = $('ep-course').value.trim();
  const interests = $('ep-interests').value.trim();
  const phone     = ($('ep-phone')?.value || '').trim();
  const users = allUsers(); const me = users.find(u => u.id === CU.id); if (!me) return;
  if (bio)       me.bio       = bio;
  if (course)    me.course    = course;
  if (interests) me.interests = interests;
  if (phone)     me.contact   = phone;
  saveUsers(users); CU = me;
  AW.upsertOne('users', me);
  closeModal('edit-profile-modal');
  toast('Profile updated! ✓'); refreshUI();
  if (currentTab === 'profile') renderProfile();
}
