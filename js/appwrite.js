// ================================================================
// MakChat — Appwrite Backend Layer
// Replaces Supabase. All cloud operations go through AW.
//
// SETUP:
//   1. Create project at https://cloud.appwrite.io
//   2. Fill in APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, DB_ID below
//   3. Create collections matching COLLECTIONS map
//   4. Enable Realtime on messages, group_messages, channel_messages, posts
// ================================================================

const APPWRITE_ENDPOINT   = 'https://cloud.appwrite.io/v1'; // change if self-hosted
const APPWRITE_PROJECT_ID = '69baf48d002a555c0351';              // ← replace
const DB_ID               = '69bb01db0003a31cfe54';             // ← replace

// Collection IDs — set these after creating them in Appwrite Console
const COLLECTIONS = {
  users:            'users',
  posts:            'posts',
  chats:            'chats',
  messages:         'messages',
  groups:           'groups',
  group_messages:   'group_messages',
  channels:         'channels',
  channel_messages: 'channel_messages',
  listings:         'listings',
  hostels:          'hostels',
  gigs:             'gigs',
  events:           'events',
  announcements:    'announcements',
  lost_found:       'lost_found',
};

let awClient    = null;
let awAccount   = null;
let awDatabases = null;
let awRealtime  = null;
let USE_APPWRITE = false;

function initAppwrite() {
  if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID === 'YOUR_PROJECT_ID') {
    console.log('MakChat: Running in LOCAL mode (Appwrite not configured)');
    USE_APPWRITE = false;
    return false;
  }
  try {
    const { Client, Account, Databases } = Appwrite;
    awClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    awAccount   = new Account(awClient);
    awDatabases = new Databases(awClient);
    USE_APPWRITE = true;
    console.log('MakChat: Appwrite connected ✓');
    const dot = document.getElementById('sb-status-dot');
    if (dot) dot.style.background = '#22c55e';
    return true;
  } catch (e) {
    console.error('Appwrite init failed:', e);
    USE_APPWRITE = false;
    return false;
  }
}

// ── DOCUMENT CONVERTERS ──────────────────────────────────────────
// Appwrite stores everything as document attributes.
// These functions convert between app objects and Appwrite documents.

const AW = {

  // ── Convert Appwrite document → app object ──
  fromDoc(collection, doc) {
    if (!doc) return null;
    const d = doc; // Appwrite returns flat attribute objects
    if (collection === 'users') return {
      id: d.$id, name: d.name, username: d.username, email: d.email,
      college: d.college, course: d.course, year: d.year,
      contact: d.contact || '', color: d.color || '#2D6A27',
      bio: d.bio || '', photo: d.photo || null,
      verified: d.verified || false, isMentor: d.is_mentor || false,
      connections: JSON.parse(d.connections || '[]'),
      groups: JSON.parse(d.groups || '[]'),
      portfolio: JSON.parse(d.portfolio || '[]'),
      skills: JSON.parse(d.skills || '[]'),
      interests: d.interests || '', points: d.points || 100,
      createdAt: d.created_at || Date.now(),
    };
    if (collection === 'posts') return {
      id: d.$id, userId: d.user_id, body: d.body, tag: d.tag || 'general',
      anon: d.anon || false, anonLabel: d.anon_label || null,
      likes: JSON.parse(d.likes || '[]'),
      comments: JSON.parse(d.comments || '[]'),
      image: d.image || null, createdAt: d.created_at || Date.now(),
    };
    if (collection === 'chats') return {
      id: d.$id, participants: JSON.parse(d.participants || '[]'),
      messages: [], createdAt: d.created_at || Date.now(),
    };
    if (collection === 'messages') return {
      id: d.$id, from: d.from_user, body: d.body, ts: d.created_at,
      readBy: JSON.parse(d.read_by || '[]'), isFile: d.is_file || false,
      fileName: d.file_name || null, reactions: JSON.parse(d.reactions || '{}'),
    };
    if (collection === 'groups') return {
      id: d.$id, name: d.name, emoji: d.emoji || '🏘️',
      description: d.description || '', type: d.type || 'study',
      college: d.college || 'All', members: JSON.parse(d.members || '[]'),
      admins: JSON.parse(d.admins || '[]'), max: d.max || '20',
      days: d.days || '', desc: d.desc || d.description || '',
      progress: d.progress || 0, streak: d.streak || 0, points: d.points || 0,
      createdBy: d.created_by, messages: [], createdAt: d.created_at || Date.now(),
    };
    if (collection === 'group_messages') return {
      id: d.$id, from: d.from_user, body: d.body, ts: d.created_at,
      isFile: d.is_file || false, fileName: d.file_name || null,
      reactions: JSON.parse(d.reactions || '{}'),
    };
    if (collection === 'channels') return {
      id: d.$id, name: d.name, description: d.description || '',
      type: d.type || 'course', college: d.college || 'All',
      members: JSON.parse(d.members || '[]'),
      messages: [], createdBy: d.created_by, createdAt: d.created_at || Date.now(),
    };
    if (collection === 'channel_messages') return {
      id: d.$id, from: d.from_user, body: d.body, ts: d.created_at,
      isFile: d.is_file || false, fileName: d.file_name || null,
    };
    if (collection === 'listings') return {
      id: d.$id, userId: d.user_id, title: d.title,
      price: d.price || 0, cond: d.condition || '', cat: d.category || '',
      desc: d.description || '', emoji: d.emoji || '📦',
      image: d.image || null, sold: d.sold || false,
      contact: d.contact || '', createdAt: d.created_at || Date.now(),
    };
    if (collection === 'hostels') return {
      id: d.$id, userId: d.user_id, title: d.title, type: d.type || '',
      price: d.price || 0, location: d.location || '',
      desc: d.description || '', contact: d.contact || '',
      rating: d.rating || 0, createdAt: d.created_at || Date.now(),
    };
    if (collection === 'gigs') return {
      id: d.$id, userId: d.user_id, title: d.title,
      cat: d.category || '', rate: d.rate || '',
      desc: d.description || '', contact: d.contact || '',
      rating: d.rating || 0, orders: d.orders || 0,
      reviews: JSON.parse(d.reviews || '[]'),
      createdAt: d.created_at || Date.now(),
    };
    if (collection === 'events') return {
      id: d.$id, userId: d.user_id, title: d.title,
      cat: d.category || '', date: d.date || '', time: d.time || '',
      venue: d.venue || '', desc: d.description || '',
      organizer: d.organizer || '', rsvps: JSON.parse(d.rsvps || '[]'),
      createdAt: d.created_at || Date.now(),
    };
    if (collection === 'announcements') return {
      id: d.$id, userId: d.user_id, title: d.title,
      body: d.body || '', cat: d.category || '',
      college: d.college || 'All', createdAt: d.created_at || Date.now(),
    };
    if (collection === 'lost_found') return {
      id: d.$id, userId: d.user_id, title: d.title,
      status: d.type || 'lost', location: d.location || '',
      date: d.date || '', desc: d.description || '',
      contact: d.contact || '', claimed: d.claimed || false,
      createdAt: d.created_at || Date.now(),
    };
    return doc;
  },

  // ── Convert app object → Appwrite document attributes ──
  toDoc(collection, obj) {
    const ts = obj.createdAt || Date.now();
    if (collection === 'users') return {
      name: obj.name, username: obj.username, email: obj.email,
      college: obj.college || '', course: obj.course || '', year: obj.year || '',
      contact: obj.contact || '', color: obj.color || '#2D6A27',
      bio: obj.bio || '', photo: obj.photo || null,
      verified: obj.verified || false, is_mentor: obj.isMentor || false,
      connections: JSON.stringify(obj.connections || []),
      groups: JSON.stringify(obj.groups || []),
      portfolio: JSON.stringify(obj.portfolio || []),
      skills: JSON.stringify(obj.skills || []),
      interests: obj.interests || '', points: obj.points || 100,
      created_at: ts,
    };
    if (collection === 'posts') return {
      user_id: obj.userId, body: obj.body, tag: obj.tag || 'general',
      anon: obj.anon || false, anon_label: obj.anonLabel || null,
      likes: JSON.stringify(obj.likes || []),
      comments: JSON.stringify(obj.comments || []),
      image: obj.image || null, created_at: ts,
    };
    if (collection === 'chats') return {
      participants: JSON.stringify(obj.participants || []),
      created_at: ts,
    };
    if (collection === 'messages') return {
      chat_id: obj.chatId, from_user: obj.from, body: obj.body,
      is_file: obj.isFile || false, file_name: obj.fileName || null,
      read_by: JSON.stringify(obj.readBy || []),
      reactions: JSON.stringify(obj.reactions || {}),
      created_at: obj.ts || ts,
    };
    if (collection === 'groups') return {
      name: obj.name, emoji: obj.emoji || '🏘️',
      description: obj.desc || obj.description || '',
      desc: obj.desc || '', type: obj.type || 'study',
      college: obj.college || 'All',
      members: JSON.stringify(obj.members || []),
      admins: JSON.stringify(obj.admins || []),
      max: String(obj.max || '20'), days: obj.days || '',
      progress: obj.progress || 0, streak: obj.streak || 0,
      points: obj.points || 0,
      created_by: obj.createdBy || obj.created_by || null,
      created_at: ts,
    };
    if (collection === 'group_messages') return {
      group_id: obj.groupId, from_user: obj.from, body: obj.body,
      is_file: obj.isFile || false, file_name: obj.fileName || null,
      reactions: JSON.stringify(obj.reactions || {}),
      created_at: obj.ts || ts,
    };
    if (collection === 'channels') return {
      name: obj.name, description: obj.description || '',
      type: obj.type || 'course', college: obj.college || 'All',
      members: JSON.stringify(obj.members || []),
      created_by: obj.createdBy || null, created_at: ts,
    };
    if (collection === 'channel_messages') return {
      channel_id: obj.channelId, from_user: obj.from, body: obj.body,
      is_file: obj.isFile || false, file_name: obj.fileName || null,
      created_at: obj.ts || ts,
    };
    if (collection === 'listings') return {
      user_id: obj.userId, title: obj.title, price: obj.price || 0,
      condition: obj.cond || '', category: obj.cat || '',
      description: obj.desc || '', emoji: obj.emoji || '📦',
      image: obj.image || null, sold: obj.sold || false,
      contact: obj.contact || '', created_at: ts,
    };
    if (collection === 'hostels') return {
      user_id: obj.userId, title: obj.title, type: obj.type || '',
      price: obj.price || 0, location: obj.location || '',
      description: obj.desc || '', contact: obj.contact || '',
      rating: obj.rating || 0, created_at: ts,
    };
    if (collection === 'gigs') return {
      user_id: obj.userId, title: obj.title,
      category: obj.cat || '', rate: obj.rate || '',
      description: obj.desc || '', contact: obj.contact || '',
      rating: obj.rating || 0, orders: obj.orders || 0,
      reviews: JSON.stringify(obj.reviews || []),
      created_at: ts,
    };
    if (collection === 'events') return {
      user_id: obj.userId, title: obj.title, category: obj.cat || '',
      date: obj.date || '', time: obj.time || '', venue: obj.venue || '',
      description: obj.desc || '', organizer: obj.organizer || '',
      rsvps: JSON.stringify(obj.rsvps || []), created_at: ts,
    };
    if (collection === 'announcements') return {
      user_id: obj.userId, title: obj.title, body: obj.body || '',
      category: obj.cat || '', college: obj.college || 'All', created_at: ts,
    };
    if (collection === 'lost_found') return {
      user_id: obj.userId, title: obj.title, type: obj.status || 'lost',
      location: obj.location || '', date: obj.date || '',
      description: obj.desc || '', contact: obj.contact || '',
      claimed: obj.claimed || false, created_at: ts,
    };
    return obj;
  },

  // ── AUTH ──────────────────────────────────────────────────────
  async register(email, password, userData) {
    if (!USE_APPWRITE) return { ok: true, local: true };
    try {
      const { ID } = Appwrite;
      // Create Appwrite Auth account
      const authUser = await awAccount.create(ID.unique(), email, password, userData.name);
      // Create session immediately
      await awAccount.createEmailPasswordSession(email, password);
      // Store profile in users collection
      const profile = AW.toDoc('users', { ...userData, id: authUser.$id });
      await awDatabases.createDocument(DB_ID, COLLECTIONS.users, authUser.$id, profile);
      return { ok: true, id: authUser.$id };
    } catch (e) {
      console.error('AW.register:', e);
      return { ok: false, error: e.message };
    }
  },

  async login(email, password) {
    if (!USE_APPWRITE) return null;
    try {
      await awAccount.createEmailPasswordSession(email, password);
      const authUser = await awAccount.get();
      const doc = await awDatabases.getDocument(DB_ID, COLLECTIONS.users, authUser.$id);
      return AW.fromDoc('users', doc);
    } catch (e) {
      console.error('AW.login:', e);
      return null;
    }
  },

  async logout() {
    if (!USE_APPWRITE) return;
    try { await awAccount.deleteSession('current'); } catch (e) { /* ignore */ }
  },

  async restoreSession() {
    if (!USE_APPWRITE) return null;
    try {
      const authUser = await awAccount.get();
      const doc = await awDatabases.getDocument(DB_ID, COLLECTIONS.users, authUser.$id);
      return AW.fromDoc('users', doc);
    } catch (e) {
      return null;
    }
  },

  // ── PULL ALL DATA ────────────────────────────────────────────
  async pullAll() {
    if (!USE_APPWRITE) return;
    const { Query } = Appwrite;
    const tables = [
      'users','posts','groups','channels','listings',
      'hostels','gigs','events','announcements','lost_found',
    ];
    try {
      await Promise.all(tables.map(async t => {
        const res = await awDatabases.listDocuments(DB_ID, COLLECTIONS[t], [
          Query.orderDesc('created_at'), Query.limit(100),
        ]);
        const converted = res.documents.map(d => AW.fromDoc(t, d));
        DB._set(t === 'lost_found' ? 'lostfound' : t, converted);
      }));
      await AW.pullMessages();
      console.log('MakChat: Data pulled from Appwrite ✓');
    } catch (e) {
      console.error('AW.pullAll:', e);
    }
  },

  async pullMessages() {
    if (!USE_APPWRITE) return;
    const { Query } = Appwrite;
    try {
      // DMs
      const chats = DB._get('chats') || [];
      // Pull chats list first
      const chatRes = await awDatabases.listDocuments(DB_ID, COLLECTIONS.chats, [Query.limit(50)]);
      const chatList = chatRes.documents.map(d => AW.fromDoc('chats', d));
      // Attach messages to each chat
      await Promise.all(chatList.map(async chat => {
        const msgRes = await awDatabases.listDocuments(DB_ID, COLLECTIONS.messages, [
          Query.equal('chat_id', chat.id),
          Query.orderAsc('created_at'), Query.limit(200),
        ]);
        chat.messages = msgRes.documents.map(d => AW.fromDoc('messages', d));
      }));
      DB._set('chats', chatList);

      // Group messages
      const groups = DB._get('groups') || [];
      await Promise.all(groups.map(async g => {
        const res = await awDatabases.listDocuments(DB_ID, COLLECTIONS.group_messages, [
          Query.equal('group_id', g.id),
          Query.orderAsc('created_at'), Query.limit(200),
        ]);
        g.messages = res.documents.map(d => AW.fromDoc('group_messages', d));
      }));
      DB._set('groups', groups);

      // Channel messages
      const channels = DB._get('channels') || [];
      await Promise.all(channels.map(async ch => {
        const res = await awDatabases.listDocuments(DB_ID, COLLECTIONS.channel_messages, [
          Query.equal('channel_id', ch.id),
          Query.orderAsc('created_at'), Query.limit(200),
        ]);
        ch.messages = res.documents.map(d => AW.fromDoc('channel_messages', d));
      }));
      DB._set('channels', channels);
    } catch (e) {
      console.error('AW.pullMessages:', e);
    }
  },

  // ── UPSERT SINGLE DOCUMENT ───────────────────────────────────
  async upsertOne(collection, obj) {
    if (!USE_APPWRITE) return;
    const { ID } = Appwrite;
    const colId = COLLECTIONS[collection];
    if (!colId) return;
    const data = AW.toDoc(collection, obj);
    try {
      // Try update first, create if not found
      try {
        await awDatabases.updateDocument(DB_ID, colId, obj.id, data);
      } catch (e) {
        if (e.code === 404) {
          await awDatabases.createDocument(DB_ID, colId, obj.id || ID.unique(), data);
        } else throw e;
      }
    } catch (e) {
      console.error(`AW.upsertOne(${collection}):`, e);
    }
  },

  // ── SEND MESSAGES ────────────────────────────────────────────
  async sendDM(chatId, msg) {
    if (!USE_APPWRITE) return;
    const { ID } = Appwrite;
    try {
      // Ensure chat document exists
      try {
        await awDatabases.createDocument(DB_ID, COLLECTIONS.chats, chatId, {
          participants: JSON.stringify([]),
          created_at: Date.now(),
        });
      } catch (e) { /* already exists */ }
      await awDatabases.createDocument(DB_ID, COLLECTIONS.messages, ID.unique(), {
        chat_id: chatId, from_user: msg.from, body: msg.body,
        is_file: msg.isFile || false, file_name: msg.fileName || null,
        read_by: JSON.stringify(msg.readBy || []),
        reactions: JSON.stringify(msg.reactions || {}),
        created_at: msg.ts,
      });
    } catch (e) { console.error('AW.sendDM:', e); }
  },

  async sendGroupMsg(groupId, msg) {
    if (!USE_APPWRITE) return;
    const { ID } = Appwrite;
    try {
      await awDatabases.createDocument(DB_ID, COLLECTIONS.group_messages, ID.unique(), {
        group_id: groupId, from_user: msg.from, body: msg.body,
        is_file: msg.isFile || false, file_name: msg.fileName || null,
        reactions: JSON.stringify(msg.reactions || {}),
        created_at: msg.ts,
      });
    } catch (e) { console.error('AW.sendGroupMsg:', e); }
  },

  async sendChannelMsg(channelId, msg) {
    if (!USE_APPWRITE) return;
    const { ID } = Appwrite;
    try {
      await awDatabases.createDocument(DB_ID, COLLECTIONS.channel_messages, ID.unique(), {
        channel_id: channelId, from_user: msg.from, body: msg.body,
        is_file: msg.isFile || false, file_name: msg.fileName || null,
        created_at: msg.ts,
      });
    } catch (e) { console.error('AW.sendChannelMsg:', e); }
  },

  // ── REALTIME SUBSCRIPTIONS ───────────────────────────────────
  _subs: [],

  subscribeToChat(chatId, callback) {
    if (!USE_APPWRITE || !awClient) return;
    const channel = `databases.${DB_ID}.collections.${COLLECTIONS.messages}.documents`;
    const unsub = awClient.subscribe(channel, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const doc = response.payload;
        if (doc.chat_id !== chatId) return;
        const msg = AW.fromDoc('messages', doc);
        const chats = DB._get('chats') || [];
        const chat = chats.find(c => c.id === chatId);
        if (chat && !chat.messages.find(m => m.id === msg.id)) {
          chat.messages.push(msg);
          DB._set('chats', chats);
          callback(msg);
        }
      }
    });
    AW._subs.push(unsub);
    return unsub;
  },

  subscribeToGroup(groupId, callback) {
    if (!USE_APPWRITE || !awClient) return;
    const channel = `databases.${DB_ID}.collections.${COLLECTIONS.group_messages}.documents`;
    const unsub = awClient.subscribe(channel, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const doc = response.payload;
        if (doc.group_id !== groupId) return;
        const msg = AW.fromDoc('group_messages', doc);
        const groups = DB._get('groups') || [];
        const g = groups.find(x => x.id === groupId);
        if (g && !g.messages.find(m => m.id === msg.id)) {
          g.messages.push(msg);
          DB._set('groups', groups);
          callback(msg);
        }
      }
    });
    AW._subs.push(unsub);
    return unsub;
  },

  subscribeToPosts(callback) {
    if (!USE_APPWRITE || !awClient) return;
    const channel = `databases.${DB_ID}.collections.${COLLECTIONS.posts}.documents`;
    const unsub = awClient.subscribe(channel, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const post = AW.fromDoc('posts', response.payload);
        const posts = DB._get('posts') || [];
        if (!posts.find(p => p.id === post.id)) {
          posts.unshift(post);
          DB._set('posts', posts);
          callback(post);
        }
      }
    });
    AW._subs.push(unsub);
    return unsub;
  },

  unsubscribeAll() {
    AW._subs.forEach(unsub => { try { unsub(); } catch (e) {} });
    AW._subs = [];
  },

  // ── USER HELPERS ─────────────────────────────────────────────
  async updateUser(user) {
    const users = DB._get('users') || [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    DB._set('users', users);
    await AW.upsertOne('users', user);
  },
};
