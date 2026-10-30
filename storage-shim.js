/*
 * The app was built inside Claude, where `window.storage` is provided for
 * saving data. Outside of Claude this file gives the app the same API
 * (get / set / delete / list) backed by one of:
 *
 *   - Firebase (shared team mode): when firebase-config.js has an apiKey.
 *     Everyone signs in with a Google account on the allowed email domain and
 *     reads/writes the same data in Firestore (collection "tracker", one
 *     document per key).
 *   - localStorage (single-browser mode): when no apiKey is set. Data is
 *     per-browser and per-device. Clearing site data erases it.
 *
 * The app saves whole lists at once (e.g. every color in one write), so two
 * people editing at the same time could overwrite each other. To prevent that,
 * each document carries a revision number: a save only goes through if nobody
 * else has saved that key since this tab loaded it. Otherwise the save is
 * refused and a banner asks the user to reload.
 */
(function(){
  if (window.storage) return; // running inside Claude: use the real one

  const cfg = window.TRACKER_CONFIG || {};
  const fbConfig = cfg.firebase || {};

  if (!fbConfig.apiKey) {
    installLocalStorage();
    return;
  }
  if (!window.firebase) {
    window.storage = blockedStorage();
    showOverlay('Couldn’t connect',
      'The sign-in service didn’t load. Check your internet connection and reload the page.', false);
    return;
  }
  installFirebase();

  // ---------- single-browser mode ----------
  function installLocalStorage(){
    const PREFIX = 'uncaged-color-tracker:';
    window.storage = {
      async get(key){
        const v = localStorage.getItem(PREFIX + key);
        if (v === null) throw new Error('Key not found: ' + key);
        return { key, value: v, shared: false };
      },
      async set(key, value){
        localStorage.setItem(PREFIX + key, value);
        return { key, value, shared: false };
      },
      async delete(key){
        localStorage.removeItem(PREFIX + key);
        return { key, deleted: true, shared: false };
      },
      async list(prefix = ''){
        const keys = Object.keys(localStorage)
          .filter(k => k.startsWith(PREFIX + prefix))
          .map(k => k.slice(PREFIX.length));
        return { keys, prefix, shared: false };
      }
    };
  }

  function blockedStorage(){
    const never = () => new Promise(() => {});
    return { get: never, set: never, delete: never, list: never };
  }

  // ---------- shared team mode ----------
  function installFirebase(){
    firebase.initializeApp(fbConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const docs = db.collection('tracker');
    const domain = (cfg.allowedEmailDomain || '').toLowerCase();
    const session = Math.random().toString(36).slice(2);
    const knownRev = {};   // key -> revision this tab last loaded or saved
    const watching = new Set();
    let user = null;
    let resolveReady;
    const ready = new Promise(r => { resolveReady = r; });

    const isAllowed = u => u && u.emailVerified &&
      (!domain || (u.email || '').toLowerCase().endsWith('@' + domain));

    let signInMessage = '';
    auth.onAuthStateChanged(async u => {
      if (!u) { showSignIn(signInMessage); signInMessage = ''; return; }
      if (!isAllowed(u)) {
        // Signing out fires this handler again with no user, which shows the message.
        signInMessage = 'That account isn’t allowed. Sign in with your @' + domain + ' Google account.';
        await auth.signOut();
        return;
      }
      if (user && user.uid !== u.uid) { location.reload(); return; }
      user = u;
      hideOverlay();
      showUserChip(u, () => auth.signOut().then(() => location.reload()));
      resolveReady();
    });

    function showSignIn(message){
      showOverlay('Color & Finish Development Calendar',
        'Sign in with your @' + domain + ' Google account to open the team tracker.',
        true, message, signIn);
    }

    function signIn(){
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters(domain ? { hd: domain, prompt: 'select_account' } : { prompt: 'select_account' });
      auth.signInWithPopup(provider).catch(e => {
        if (e.code === 'auth/popup-blocked') return auth.signInWithRedirect(provider);
        if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
        showSignIn('Sign-in failed: ' + e.message);
      });
    }

    function watch(key){
      if (watching.has(key)) return;
      watching.add(key);
      docs.doc(key).onSnapshot(snap => {
        if (snap.metadata.hasPendingWrites || !snap.exists) return;
        const d = snap.data();
        if (d.session !== session && d.rev !== knownRev[key]) {
          showBanner((d.updatedByName || 'A teammate') + ' just updated the tracker. Reload to see the latest.', 'info');
        }
      }, e => console.error('Live update error', e));
    }

    window.storage = {
      async get(key){
        await ready;
        const snap = await docs.doc(key).get();
        watch(key);
        if (!snap.exists) {
          knownRev[key] = 0;
          throw new Error('Key not found: ' + key);
        }
        const d = snap.data();
        knownRev[key] = d.rev || 0;
        return { key, value: d.value, shared: true };
      },
      async set(key, value){
        await ready;
        const ref = docs.doc(key);
        try {
          const rev = await db.runTransaction(async tx => {
            const snap = await tx.get(ref);
            const current = snap.exists ? (snap.data().rev || 0) : 0;
            if (key in knownRev && current !== knownRev[key]) {
              const err = new Error('Changed by someone else: ' + key);
              err.code = 'tracker/conflict';
              throw err;
            }
            tx.set(ref, {
              value,
              rev: current + 1,
              session,
              updatedBy: user.email,
              updatedByName: user.displayName || user.email,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return current + 1;
          });
          knownRev[key] = rev;
          watch(key);
          return { key, value, shared: true };
        } catch (e) {
          if (e.code === 'tracker/conflict') {
            showBanner('Your last change wasn’t saved because a teammate changed the tracker first. Reload, then make your change again.', 'warn');
          } else {
            showBanner('Couldn’t save your last change (' + (e.code || e.message) + '). Check your connection and reload.', 'warn');
          }
          throw e;
        }
      },
      async delete(key){
        await ready;
        await docs.doc(key).delete();
        delete knownRev[key];
        return { key, deleted: true, shared: true };
      },
      async list(prefix = ''){
        await ready;
        const snap = await docs.get();
        const keys = snap.docs.map(d => d.id).filter(k => k.startsWith(prefix));
        return { keys, prefix, shared: true };
      }
    };
  }

  // ---------- UI ----------
  function showOverlay(title, text, withButton, message, onClick){
    let el = document.getElementById('teamOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'teamOverlay';
      el.className = 'team-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="team-panel">' +
        '<h2></h2><p class="team-text"></p>' +
        (withButton ? '<button class="btn" type="button">Sign in with Google</button>' : '') +
        '<p class="team-msg"></p>' +
      '</div>';
    el.querySelector('h2').textContent = title;
    el.querySelector('.team-text').textContent = text;
    el.querySelector('.team-msg').textContent = message || '';
    if (withButton) el.querySelector('button').addEventListener('click', onClick);
    el.style.display = '';
  }

  function hideOverlay(){
    const el = document.getElementById('teamOverlay');
    if (el) el.style.display = 'none';
  }

  function showUserChip(u, onSignOut){
    let el = document.getElementById('teamUser');
    if (!el) {
      el = document.createElement('div');
      el.id = 'teamUser';
      el.className = 'team-user';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span></span><button type="button">Sign out</button>';
    el.querySelector('span').textContent = u.email;
    el.querySelector('button').addEventListener('click', onSignOut);
  }

  function showBanner(text, kind){
    let el = document.getElementById('teamBanner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'teamBanner';
      document.body.appendChild(el);
    }
    // A warning about a lost save outranks an "updated" notice.
    if (kind === 'info' && el.className.includes('warn') && el.style.display !== 'none') return;
    el.className = 'team-banner ' + kind;
    el.innerHTML = '<span></span><button class="btn" type="button">Reload</button>';
    el.querySelector('span').textContent = text;
    el.querySelector('button').addEventListener('click', () => location.reload());
    el.style.display = '';
  }
})();
