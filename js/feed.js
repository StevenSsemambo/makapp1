// ================================================================
// MakChat — Feed Module
// ================================================================

function renderFeedCard(p) {
  const u = p.anon ? null : getUser(p.userId);
  const liked = (p.likes || []).includes(CU.id);
  const tagColors  = { study:'pill-blue', marketplace:'pill-gold', event:'pill-green', support:'pill-blue', announcement:'pill-red', anon:'pill-anon' };
  const tagLabels  = { study:'📚 Study', marketplace:'🛒 Market', event:'📅 Event', support:'💙 Support', announcement:'📢 Notice' };
  const isMine = !p.anon && p.userId === CU.id;
  return `<div class="feed-item" onclick="openPost('${p.id}')">
    <div class="avatar av-sm" style="background:${p.anon ? '#94a3b8' : (u?.color || '#003478')}">
      <span style="color:white;font-size:9px;font-weight:700">${p.anon ? '?' : (u ? initials(u.name) : '?')}</span>
    </div>
    <div class="flex-1">
      <div class="flex justify-between items-center mb-4">
        <span class="font-semibold text-sm">${p.anon ? (p.anonLabel || 'Anonymous') : (u?.name || 'Unknown')}</span>
        <div class="flex items-center gap-6">
          <span class="text-xs text-muted">${timeAgo(p.createdAt)}</span>
          ${isMine ? `<button class="btn btn-sm" style="padding:2px 6px;background:transparent;border:none;color:var(--muted);font-size:12px" onclick="event.stopPropagation();deletePost('${p.id}')">🗑</button>` : ''}
        </div>
      </div>
      ${p.tag ? `<span class="pill ${tagColors[p.tag] || 'pill-blue'} mb-6" style="font-size:10px">${tagLabels[p.tag] || p.tag}</span>` : ''}
      <div class="text-sm" style="line-height:1.6;margin-top:2px;color:var(--text)">${p.body.length > 180 ? p.body.slice(0, 180) + '...' : p.body}</div>
      ${p.image ? `<img src="${p.image}" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;margin-top:8px">` : ''}
      <div class="flex gap-14 mt-8">
        <span class="text-xs text-muted">♡ ${(p.likes || []).length}</span>
        <span class="text-xs text-muted">💬 ${(p.comments || []).length}</span>
        ${p.anon ? '<span class="text-xs text-muted">👤 Anonymous</span>' : ''}
      </div>
    </div>
  </div>`;
}

function renderFeed() {
  let posts = allPosts();
  if (feedFilter === 'my-college') posts = posts.filter(p => { const u = getUser(p.userId); return u && u.college === CU.college; });
  else if (feedFilter === 'anon')  posts = posts.filter(p => p.anon);
  else if (feedFilter !== 'all')   posts = posts.filter(p => p.tag === feedFilter);
  $('feed-list').innerHTML = posts.length
    ? posts.map(renderFeedCard).join('')
    : emptyState('📣', 'No posts yet', 'Be the first to share something with the Makerere community!', '+ Create Post', "openModal('compose-modal')");
}

function filterFeed(f, btn) {
  feedFilter = f;
  document.querySelectorAll('#feed-filters .btn').forEach(b => b.className = 'btn btn-sm btn-ghost');
  btn.className = 'btn btn-sm btn-primary';
  renderFeed();
}

function openPost(id) {
  const p = allPosts().find(x => x.id === id); if (!p) return;
  const u = p.anon ? null : getUser(p.userId);
  const liked = (p.likes || []).includes(CU.id);
  const tagColors = { study:'pill-blue', marketplace:'pill-gold', event:'pill-green', support:'pill-blue', announcement:'pill-red' };
  $('post-detail-content').innerHTML = `
    <div class="flex justify-between items-center mb-16">
      <div class="flex items-center gap-12">
        <div class="avatar av-md" style="background:${p.anon ? '#94a3b8' : (u?.color || '#003478')}">
          <span style="color:white;font-size:13px;font-weight:700">${p.anon ? '?' : (u ? initials(u.name) : '?')}</span>
        </div>
        <div>
          <div class="font-semibold">${p.anon ? (p.anonLabel || 'Anonymous') : (u?.name || 'Unknown')}</div>
          <div class="text-xs text-muted">${p.anon ? 'Makerere University' : (u?.college ? collegeShort(u.college) : '')} · ${timeAgo(p.createdAt)}</div>
        </div>
      </div>
      <button class="modal-x" onclick="$('post-overlay').classList.remove('open')">✕</button>
    </div>
    ${p.tag ? `<span class="pill ${tagColors[p.tag] || 'pill-blue'} mb-12" style="font-size:11px">${p.tag}</span>` : ''}
    <div style="font-size:14px;line-height:1.7;margin-bottom:12px">${p.body}</div>
    ${p.image ? `<img src="${p.image}" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;margin-bottom:14px">` : ''}
    <div class="flex gap-10 mb-16 flex-wrap">
      <button class="btn btn-sm ${liked ? 'btn-primary' : 'btn-ghost'}" onclick="likePost('${p.id}')">
        ${liked ? '❤️' : '♡'} ${(p.likes || []).length}
      </button>
      ${!p.anon && u && u.id !== CU.id ? `<button class="btn btn-sm btn-ghost" onclick="startChatWith('${u.id}')">💬 Message ${u.name.split(' ')[0]}</button>` : ''}
      <button class="btn btn-sm btn-ghost" onclick="shareText('Check this out on MakChat:\\n\\n&quot;${p.body.slice(0, 120).replace(/'/g, '')}${p.body.length > 120 ? '...' : ''}&quot;')">📤 Share</button>
      ${!p.anon && p.userId === CU.id ? `<button class="btn btn-sm btn-danger" onclick="deletePost('${p.id}')">🗑 Delete</button>` : ''}
    </div>
    <div class="divider"></div>
    <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Comments (${(p.comments || []).length})</div>
    <div class="flex flex-col gap-10 mb-14">
      ${(p.comments || []).map(c => {
        const cu = getUser(c.userId);
        return `<div class="flex gap-10">
          <div class="avatar av-xs" style="background:${cu?.color || '#003478'}"><span style="color:white;font-size:8px;font-weight:700">${cu ? initials(cu.name) : '?'}</span></div>
          <div style="background:var(--cream);border-radius:10px;padding:8px 12px;flex:1">
            <div class="font-semibold text-xs mb-3" style="color:var(--blue)">${cu?.name || 'Unknown'}</div>
            <div class="text-sm">${c.body}</div>
          </div>
        </div>`;
      }).join('') || '<div class="text-xs text-muted">No comments yet. Start the conversation!</div>'}
    </div>
    <div class="flex gap-8">
      <input class="input flex-1" id="comment-input-${p.id}" placeholder="Write a comment..." style="font-size:13px" onkeydown="if(event.key==='Enter')submitComment('${p.id}')">
      <button class="btn btn-primary btn-sm" onclick="submitComment('${p.id}')">Send</button>
    </div>`;
  $('post-overlay').classList.add('open');
}

function likePost(id) {
  const posts = allPosts(); const p = posts.find(x => x.id === id); if (!p) return;
  p.likes = p.likes || [];
  const idx = p.likes.indexOf(CU.id);
  if (idx >= 0) p.likes.splice(idx, 1);
  else { p.likes.push(CU.id); addPoints(3); }
  DB._set('posts', posts);
  AW.upsertOne('posts', p);
  openPost(id);
  if (currentTab === 'feed') renderFeed();
  if (currentTab === 'home') renderHome();
}

async function deletePost(id) {
  const ok = await showConfirm('Delete Post', 'This post will be permanently deleted.', 'Delete', '🗑️');
  if (!ok) return;
  const posts = allPosts().filter(p => p.id !== id);
  DB._set('posts', posts);
  $('post-overlay').classList.remove('open');
  toast('Post deleted');
  if (currentTab === 'feed') renderFeed();
  if (currentTab === 'home') renderHome();
  refreshUI();
}

function submitComment(postId) {
  const inp = $('comment-input-' + postId); const body = inp?.value?.trim();
  if (!body) { toast('Write something first!', 'error'); return; }
  const posts = allPosts(); const p = posts.find(x => x.id === postId); if (!p) return;
  p.comments = p.comments || [];
  p.comments.push({ id: 'c' + Date.now(), userId: CU.id, body, createdAt: Date.now() });
  DB._set('posts', posts);
  AW.upsertOne('posts', p);
  addPoints(5);
  toast('Comment posted! 💬');
  openPost(postId);
}

function toggleAnon() {
  postAnon = !postAnon;
  const el = $('anon-toggle');
  if (el) { el.textContent = `👤 Post Anonymously: ${postAnon ? 'ON' : 'OFF'}`; el.classList.toggle('on', postAnon); }
}

function tagPost(tag) {
  postTag = tag;
  const labels = { study: '📚 Study', event: '📅 Event', marketplace: '🛒 Market', support: '💙 Support', announcement: '📢 Notice' };
  $('post-tag-display').innerHTML = `<span class="pill pill-blue">${labels[tag] || tag}</span>`;
}

function submitPost() {
  const body = $('post-body').value.trim();
  if (!body) { toast('Write something first!', 'error'); return; }
  const post = {
    id: 'p' + Date.now(),
    userId: postAnon ? 'anon' : CU.id,
    body, tag: postTag || null,
    image: postImageData || null,
    anon: postAnon,
    anonLabel: postAnon ? `Anonymous ${collegeShort(CU.college)} Student` : null,
    likes: [], comments: [], createdAt: Date.now(),
  };
  const posts = DB._get('posts') || [];
  posts.unshift(post);
  DB._set('posts', posts);
  AW.upsertOne('posts', post);
  addPoints(10);
  closeModal('compose-modal');
  $('post-body').value = '';
  postTag = ''; postAnon = false; postImageData = null;
  const pi = $('post-img-preview'); if (pi) pi.innerHTML = '';
  const ii = $('post-img-input');   if (ii) ii.value = '';
  $('post-tag-display').innerHTML = '';
  $('anon-toggle').textContent = '👤 Post Anonymously: OFF';
  $('anon-toggle').classList.remove('on');
  toast('Posted! 🎉');
  if (currentTab === 'feed') renderFeed();
  if (currentTab === 'home') renderHome();
  refreshUI();
}
