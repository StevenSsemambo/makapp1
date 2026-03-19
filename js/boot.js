// ================================================================
// MakChat — Boot Module
// Runs on DOMContentLoaded. Initialises everything and restores session.
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {

  // 1. Initialise Appwrite (falls back to local mode if not configured)
  initAppwrite();

  // 2. Seed local data if first run
  seedIfEmpty();
  seedChannels();

  // 3. UI defaults
  loadDarkMode();
  initOfflineDetection();

  // 4. Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + K → global search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openGlobalSearch();
    }
    // Escape → close overlays
    if (e.key === 'Escape') {
      const overlays = [
        'post-overlay', 'item-overlay', 'compose-modal', 'list-modal',
        'gig-modal', 'event-modal', 'ann-modal', 'lf-modal', 'hostel-modal',
        'create-group-modal', 'create-channel-modal', 'group-chat-modal',
        'edit-profile-modal', 'add-port-modal', 'rate-gig-modal',
        'new-chat-modal', 'notif-panel',
      ];
      overlays.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('open')) el.classList.remove('open');
      });
      closeGlobalSearch();
      closeMoreDrawer();
    }
  });

  // 5. Session restore
  const savedId = DB._get('session');
  if (savedId) {
    let user = null;

    // Try Appwrite first
    if (USE_APPWRITE) {
      try {
        user = await AW.restoreSession();
        if (user) {
          showSyncBanner(true);
          await AW.pullAll();
          showSyncBanner(false);
        }
      } catch (e) {
        console.warn('Appwrite session restore failed, falling back to local', e);
      }
    }

    // Fallback: find user in local DB
    if (!user) {
      user = allUsers().find(u => u.id === savedId) || null;
    }

    if (user) {
      CU = user;
      enterApp();
      return;
    }
  }

  // 6. No session → show auth screen
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('shell').style.display = 'none';
});
