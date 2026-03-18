// ================================================================
// MakChat — Auth Module
// ================================================================

function authTab(tab) {
  $('tab-login-btn').classList.toggle('active', tab === 'login');
  $('tab-reg-btn').classList.toggle('active', tab === 'register');
  $('login-form').classList.toggle('hidden', tab !== 'login');
  $('register-form').classList.toggle('hidden', tab !== 'register');
}

async function doLogin() {
  const email = $('l-email').value.trim().toLowerCase();
  const pass  = $('l-pass').value;
  if (!email || !pass) { toast('Enter email and password', 'error'); return; }

  const btn = $('tab-login-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

  try {
    let user = null;

    if (USE_APPWRITE) {
      user = await AW.login(email, pass);
      if (!user) { toast('Invalid email or password', 'error'); return; }
    } else {
      // Local fallback
      user = allUsers().find(u => u.email === email && u.password === pass);
      if (!user) { toast('Invalid email or password', 'error'); return; }
    }

    CU = user;
    DB._set('session', user.id);

    if (USE_APPWRITE) {
      showSyncBanner(true);
      await AW.pullAll();
      showSyncBanner(false);
    }

    enterApp();
  } catch (err) {
    console.error('Login error:', err);
    toast('Login failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
  }
}

async function doRegister() {
  const name    = $('r-name').value.trim();
  const uname   = $('r-uname').value.trim().toLowerCase();
  const email   = $('r-email').value.trim().toLowerCase();
  const pass    = $('r-pass').value;
  const college = $('r-college').value;
  const course  = $('r-course').value.trim();
  const year    = $('r-year').value;
  const phone   = ($('r-phone')?.value || '').trim();

  if (!name || !uname || !email || !pass || !college || !course || !year) {
    toast('All fields are required', 'error'); return;
  }
  if (pass.length < 6) { toast('Password must be 6+ characters', 'error'); return; }

  const rbtn = $('tab-reg-btn');
  if (rbtn) { rbtn.disabled = true; rbtn.textContent = 'Creating account...'; }

  try {
    const colors = ['#2D6A27','#3a8a32','#8B0000','#a80000','#16a34a','#d97706','#0891b2','#7c3aed'];
    const newUser = {
      name, username: uname, email,
      password: USE_APPWRITE ? 'AUTH_MANAGED' : pass,
      college, course, year, contact: phone || '',
      color: colors[Math.floor(Math.random() * colors.length)],
      bio: `${course} student at Makerere University.`,
      points: 100, verified: false, isMentor: false,
      connections: [], groups: [], portfolio: [], skills: [],
      interests: '', createdAt: Date.now(),
    };

    if (USE_APPWRITE) {
      const result = await AW.register(email, pass, newUser);
      if (!result.ok) { toast('Registration failed: ' + (result.error || 'Try again'), 'error'); return; }
      newUser.id = result.id;
      CU = newUser;
    } else {
      const users = allUsers();
      if (users.find(u => u.email === email))    { toast('Email already registered', 'error'); return; }
      if (users.find(u => u.username === uname)) { toast('Username already taken', 'error'); return; }
      newUser.id = 'u' + Date.now();
      users.push(newUser);
      DB._set('users', users);
      CU = newUser;
    }

    DB._set('session', CU.id);
    addNotif('🎓', 'Welcome to MakChat! Start by completing your profile.');
    toast(`Welcome to MakChat, ${name.split(' ')[0]}! 🎓`);

    if (USE_APPWRITE) {
      showSyncBanner(true);
      await AW.pullAll();
      showSyncBanner(false);
    }

    enterApp();
  } catch (err) {
    console.error('Registration error:', err);
    toast('Registration failed. Please try again.', 'error');
  } finally {
    if (rbtn) { rbtn.disabled = false; rbtn.textContent = 'Sign Up'; }
  }
}

async function confirmLogout() {
  const ok = await showConfirm('Log Out', 'Are you sure you want to log out of MakChat?', 'Log Out', '👋', 'var(--blue)');
  if (ok) doLogout();
}

async function doLogout() {
  await AW.logout();
  AW.unsubscribeAll();
  DB._del('session');
  CU = null;
  $('shell').style.display = 'none';
  $('auth-screen').classList.remove('hidden');
  $('l-email').value = '';
  $('l-pass').value  = '';
}

function enterApp() {
  $('auth-screen').classList.add('hidden');
  $('shell').style.display = 'block';
  requestAnimationFrame(() => {
    refreshUI();
    goTab('home');
    if (USE_APPWRITE) {
      AW.subscribeToPosts(() => { if (currentTab === 'feed') renderFeed(); });
    }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

function showSyncBanner(visible) {
  let banner = document.getElementById('sync-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'sync-banner';
    banner.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block;margin-right:6px">⟳</span> Syncing data...';
    banner.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--blue);color:white;padding:8px 18px;border-radius:20px;font-size:12px;font-weight:600;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(banner);
  }
  banner.style.display = visible ? 'block' : 'none';
}
