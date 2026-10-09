/* Pass the Phone: online play. Accounts, lobbies and the host loop.
   Plain script, no build step. Load it after party.js. Exposes window.Online.

   A game page goes online when its URL has ?lobby=CODE, or ?lobby=new to make a
   game. supabase-js is only fetched then, so one-phone play loads nothing extra.

   The host's browser runs the game. A page passes Online.room() a spec:
     game, title, min, max     folder name, display name and player limits
     ui                        class names for this game's buttons and panels
     start(players, opts)      host: make the full game state
     act(full, from, a, ctx)   host: apply a player's action, return true if it changed.
                               ctx.host is the host's id
     view(full)                host: the part everyone may see (default: all of it)
     secrets(full)             host: { playerId: private info } (optional)
     tick(full, now)           host: timed changes, return true if it changed (optional)
     leave(full, ids)          host: someone left, ids are who is still here.
                               Return 'open' to end the game (optional)
     options(), readOptions()  host: settings shown in the waiting room (optional)
     render(v)                 everyone: HTML for the game from v.pub and v.mine
     bind(v), fx(v, prev)      everyone: after-render hooks and sounds (optional)
     unbind()                  everyone: undo page changes when the game screen goes (optional)
     click(name, el, v)        everyone: buttons marked data-ui="name" (optional)
   Buttons marked data-send='{"t":"drop","c":3}' send that action to the host.
   Fields marked data-keep keep their text when the screen redraws, and
   data-enter="name" makes Enter press that data-ui button.
   Online markup must not use data-act, so the page's one-phone handlers ignore it. */
(function () {
  'use strict';
  const P = window.Party, esc = P.esc;

  const SB_URL = 'https://dmfduvttrdyzkmrulbyp.supabase.co';
  // A publishable key is meant to be public. Row level security and the
  // database functions decide what each player can read and do.
  const SB_KEY = 'sb_publishable_BxskYfphVX0V5qLjXMDl8A_MEWYlifa';
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js';
  const LIB_SRI = 'sha384-K1nraABOP/zFehpLIUksXebbs7jMpB8gYMlb+uhVKZcWT/9Vkq1+qhv6ndC+1Yuz';

  const SELF = document.currentScript && document.currentScript.src;
  const ROOT = new URL('../', SELF || location.href).href;
  const params = new URLSearchParams(location.search);
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // On a local test server, ?as=2 gives a tab its own guest account.
  const AS = LOCAL && /^\d{1,2}$/.test(params.get('as') || '') ? params.get('as') : '';
  const AUTH_KEY = AS ? 'ptp-auth-test-' + AS : 'ptp-auth';

  // Games that can be played online. The online page lists these.
  const GAMES = {
    'four-in-a-row': { title: 'Four in a Row', min: 2, max: 2, blurb: 'Two players, one grid. Line up four.' },
    flock: { title: 'Flock', min: 3, max: 12, blurb: 'Give the answer everyone else gives.' },
    impostor: { title: 'Impostor', min: 3, max: 12, blurb: 'One of you does not know the secret word.' },
    'most-likely': { title: 'Most Likely To', min: 3, max: 12, blurb: 'Vote in secret for yearbook titles.' },
    'two-of-a-kind': { title: 'Two of a Kind', min: 3, max: 12, blurb: 'Fill the blank and match exactly one other player.' },
    'hot-takes': { title: 'Hot Takes', min: 3, max: 12, blurb: 'Guess how many people agreed with the take.' },
    'odd-one-out': { title: 'Odd One Out', min: 3, max: 12, blurb: 'One player got a different question.' },
    'mind-meld': { title: 'Mind Meld', min: 2, max: 6, blurb: 'Link your words until you all say the same one.' },
    werewolf: { title: 'Werewolf', min: 5, max: 16, blurb: 'Secret roles and night moves, no narrator needed.' },
    'where-are-we': { title: 'Where Are We?', min: 3, max: 12, blurb: 'Everyone knows the place except the spy.' },
    'inside-job': { title: 'Inside Job', min: 4, max: 12, blurb: 'Find the word, then catch who knew it all along.' },
    mole: { title: 'Mole', min: 5, max: 10, blurb: 'Plan five jobs while the moles try to wreck them.' }
  };

  /* ---------- Connection ---------- */
  let clientP = null;
  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    // Local test pages can swap in a fake backend from the page that frames this one.
    try { if (LOCAL && window.parent !== window && window.parent.PTP_FAKE_SUPABASE) return Promise.resolve(window.parent.PTP_FAKE_SUPABASE); } catch (e) { /* not same origin */ }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.integrity = LIB_SRI;
      s.crossOrigin = 'anonymous';
      s.onload = () => (window.supabase ? resolve(window.supabase) : reject(new Error('offline')));
      s.onerror = () => { s.remove(); reject(new Error('offline')); };
      document.head.appendChild(s);
    });
  }
  function client() {
    if (!clientP) {
      clientP = loadLib().then(lib => lib.createClient(SB_URL, SB_KEY, {
        auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      }));
      clientP.catch(() => { clientP = null; });
    }
    return clientP;
  }
  function hasSession() {
    try { return !!localStorage.getItem(AUTH_KEY); } catch (e) { return false; }
  }
  async function getSession() {
    const sb = await client();
    const { data } = await sb.auth.getSession();
    return data.session;
  }
  async function rpc(fn, args) {
    const sb = await client();
    const { data, error } = await sb.rpc(fn, args || {});
    if (error) throw error;
    return data;
  }

  /* ---------- Accounts ---------- */
  async function guest(name) {
    const sb = await client();
    const { data, error } = await sb.auth.signInAnonymously({ options: { data: { name: P.cleanName(name) || 'Player' } } });
    if (error) throw error;
    return data.session;
  }
  // Email sign in: send a code, then check it. A new email makes a new account.
  async function sendCode(email, name) {
    const sb = await client();
    const opts = { shouldCreateUser: true };
    if (name) opts.data = { name: P.cleanName(name) };
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: opts });
    if (error) throw error;
  }
  async function checkCode(email, code, type) {
    const sb = await client();
    const { data, error } = await sb.auth.verifyOtp({ email: email.trim(), token: String(code).replace(/\D/g, ''), type: type || 'email' });
    if (error) throw error;
    return data.session;
  }
  // A guest keeps their account by adding an email. Confirm with checkCode(email, code, 'email_change').
  async function addEmail(email) {
    const sb = await client();
    const { error } = await sb.auth.updateUser({ email: email.trim() });
    if (error) throw error;
  }
  async function signOut() {
    const sb = await client();
    await sb.auth.signOut();
  }

  const PROBLEMS = {
    not_found: 'There is no open game with that code.',
    removed: 'The host removed you from this game.',
    started: 'That game has already started.',
    full: 'That game is full.',
    closed: 'That game has closed.',
    slow_down: 'Too many tries. Wait a few minutes, then try again.',
    not_host: 'Only the host can do that.',
    not_member: 'You are not in this game any more.',
    too_big: 'That was too much to send.',
    offline: 'Could not reach the game server. Check your connection and try again.',
    disabled: 'Online play has not been switched on yet. You can still play on one phone.'
  };
  function problem(e) {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || '');
    if (PROBLEMS[m]) return PROBLEMS[m];
    if (/anonymous sign-?ins? (are|is) disabled/i.test(m)) return PROBLEMS.disabled;
    if (/rate limit|too many/i.test(m)) return 'Too many tries. Wait a few minutes, then try again.';
    if (/token has expired|otp.*(expired|invalid)|invalid.*(otp|token)/i.test(m)) return 'That code did not work. Check it, or ask for a new one.';
    if (/already (been )?registered|already exists|email.*(taken|in use)/i.test(m)) return 'That email already has an account. Sign in with it instead.';
    if (/valid email|invalid email|unable to validate email/i.test(m)) return 'That does not look like an email address.';
    if (/fetch|network|offline|load failed|timed? ?out/i.test(m)) return PROBLEMS.offline;
    return 'Something went wrong. Try again.';
  }
  function problemKey(e) {
    const m = String((e && e.message) || e || '');
    if (/anonymous sign-?ins? (are|is) disabled/i.test(m)) return 'disabled';
    if (/fetch|network|offline|load failed/i.test(m)) return 'offline';
    return PROBLEMS[m] ? m : 'other';
  }

  /* ---------- Links ---------- */
  function gameUrl(game, code) { return ROOT + game + '/' + (code ? '?lobby=' + encodeURIComponent(code) : ''); }
  function hereUrl(code, keepAs) {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    if (code) u.searchParams.set('lobby', code);
    if (keepAs && AS) u.searchParams.set('as', AS);
    return u.href;
  }
  function wanted() { return /^(new|[a-z]{5})$/i.test(params.get('lobby') || ''); }
  const spaced = code => String(code || '').split('').join(' ');
  // Attribute for a button that sends this action to the host.
  const sendAttr = action => 'data-send="' + esc(JSON.stringify(action)) + '"';

  /* ---------- Styles for the online screens. Each game's tokens tint them. ---------- */
  const CSS = `
.ol-room{margin-top:6px}
.ol-code{margin:2px 0 0;font-family:var(--ol-display,var(--f-display,inherit));font-size:clamp(46px,14vw,78px);line-height:1.05;letter-spacing:.14em;overflow-wrap:anywhere}
.ol-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.ol-small{margin:8px 0 0;font-size:15px;line-height:1.4}
.ol-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ol-list li{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;min-height:48px;padding:6px 8px 6px 12px;border-radius:12px;box-shadow:inset 0 0 0 2px var(--ol-line,var(--line,rgba(127,127,127,.4)))}
.ol-dot{flex:none;width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 2px currentColor;opacity:.55}
.ol-dot.on{background:#18a249;box-shadow:0 0 0 2px rgba(255,255,255,.75);opacity:1}
.ol-name{flex:1;min-width:6em;font-weight:700;overflow-wrap:anywhere}
.ol-tag{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.ol-mini{min-height:40px;padding:4px 14px;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:inset 0 0 0 2px currentColor}
.ol-mini:disabled{opacity:.6;cursor:default}
.ol-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;margin-top:12px;font-size:15px;font-weight:700}
.ol-pill{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:4px 14px;border-radius:999px;box-shadow:inset 0 0 0 2px var(--ol-line,var(--line,rgba(127,127,127,.4)))}
.ol-bar .textbtn{min-height:40px}
.ol-banner{margin:14px 0 0;padding:12px 16px;border-radius:14px;background:#fff1b8;color:#2b2300;font-weight:700;font-size:16px;line-height:1.4;text-align:left}
.ol-banner .ol-mini{margin-top:8px;color:#2b2300}
.ol-sec+.ol-sec{margin-top:22px}
.ol-wait{margin:0;font-weight:700;font-size:19px}
.ol-field{display:grid;gap:6px;max-width:460px;margin:18px auto 0;text-align:left}
.ol-field label{font-weight:700}
.ol-field input{width:100%;min-height:54px;padding:12px 16px;border:0;border-radius:14px;background:var(--ol-field,var(--field,#fff));color:var(--ol-field-ink,var(--field-ink,#141414));font:700 20px/1.3 var(--f-body,inherit);box-shadow:inset 0 0 0 2px var(--ol-line,var(--line,rgba(127,127,127,.4)))}
.ol-field input:focus{outline:3px solid var(--focus,#ffd23f);outline-offset:1px}
.ol-err{min-height:1.4em;margin:8px 0 0;font-weight:700}
.sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
`;
  function addStyles() {
    if (document.getElementById('ol-css')) return;
    const s = document.createElement('style');
    s.id = 'ol-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- The room: waiting room, game and host loop ---------- */
  const UI = {
    main: 'btn btn-main btn-big', alt: 'btn btn-alt', inAlt: 'btn btn-alt', panel: 'panel',
    eyebrow: 'eyebrow', big: 'big', lead: 'lead', label: 'label', center: 'center', textbtn: 'textbtn'
  };
  let R = null;
  let app = null;

  function room(spec) {
    if (R) return;
    app = document.getElementById('app');
    addStyles();
    spec.ui = Object.assign({}, UI, spec.ui || {});
    spec.header = spec.header || (() => P.header());
    R = {
      spec, code: String(params.get('lobby') || '').toUpperCase(), sb: null, me: null, profile: null,
      lobbyId: null, lobby: null, members: [], mine: null, mineRev: -1, online: new Set(), hostSeen: Date.now(),
      hosting: false, loaded: false, full: null, queue: [], seen: new Set(), done: [], lastSecrets: {},
      pumping: false, dirty: false, nextStatus: null, failures: 0,
      channel: null, link: 'up', screen: 'boot', notice: null, pending: 0, note: '',
      friends: null, friendsAt: 0, invited: {}, lastHTML: '', lastKind: '', prev: null, local: {}
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && R.lobbyId) { beat(); refresh(); }
    });
    boot();
  }

  function setScreen(kind, data) { R.screen = kind; R.notice = data || null; paint(); }

  async function boot() {
    setScreen('boot');
    let s;
    try {
      R.sb = await client();
      s = await getSession();
    } catch (e) { return setScreen('notice', { key: 'offline', retry: true }); }
    if (!s) return setScreen('name');
    enter(s);
  }

  async function enter(s) {
    R.me = s.user.id;
    setScreen('boot');
    try {
      R.profile = await rpc('me');
      if (R.code === 'NEW') {
        const made = await rpc('create_lobby', { p_game: R.spec.game, p_max: R.spec.max });
        R.code = made.code;
        history.replaceState(null, '', hereUrl(made.code, true));
      }
      const j = await rpc('join_lobby', { p_code: R.code });
      if (j.error) return setScreen('notice', { key: j.error, game: j.game });
      if (j.game !== R.spec.game) { location.replace(gameUrl(j.game, j.code) + (AS ? '&as=' + AS : '')); return; }
      R.lobbyId = j.id;
      R.code = j.code;
    } catch (e) {
      const k = problemKey(e);
      return setScreen('notice', { key: k === 'other' ? 'offline' : k, retry: true, detail: e });
    }
    R.screen = 'room';
    subscribe();
    await refresh();
    setInterval(beat, 25000);
    setInterval(hostTick, 500);
    setInterval(() => { if (!document.hidden) refresh(); }, 20000);
    setInterval(paint, 5000);
  }

  function subscribe() {
    const id = R.lobbyId;
    const ch = R.sb.channel('lobby:' + id, { config: { private: true, presence: { key: R.me } } });
    const pg = (event, table, col, cb) => ch.on('postgres_changes', { event, schema: 'public', table, filter: col + '=eq.' + id }, p => cb(p.new));
    pg('UPDATE', 'lobbies', 'id', onLobby);
    pg('INSERT', 'lobby_secrets', 'lobby_id', onSecret);
    pg('UPDATE', 'lobby_secrets', 'lobby_id', onSecret);
    pg('INSERT', 'lobby_actions', 'lobby_id', onAction);
    ch.on('presence', { event: 'sync' }, onPresence);
    ch.on('broadcast', { event: 'kick' }, m => { if (m.payload && m.payload.id === R.me) gone('removed'); });
    ch.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        R.link = 'up';
        ch.track({ name: R.profile ? R.profile.name : '' });
        refresh();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        R.link = 'down';
        paint();
      }
    });
    R.channel = ch;
  }

  async function refresh() {
    if (!R.lobbyId || R.screen === 'notice') return;
    if (R.refreshing) { R.refreshAgain = true; return; }
    R.refreshing = true;
    try {
      const [l, m, s] = await Promise.all([
        R.sb.from('lobbies').select('*').eq('id', R.lobbyId).maybeSingle(),
        R.sb.from('lobby_members').select('user_id,name,seat').eq('lobby_id', R.lobbyId).order('seat'),
        R.sb.from('lobby_secrets').select('data,rev').eq('lobby_id', R.lobbyId).eq('user_id', R.me).maybeSingle()
      ]);
      if (l.error || m.error || s.error) throw l.error || m.error || s.error;
      if (!l.data) { gone('removed'); return; }
      R.members = m.data || [];
      if (s.data && s.data.rev >= R.mineRev) { R.mine = s.data.data; R.mineRev = s.data.rev; }
      if (!R.lobby || l.data.rev >= R.lobby.rev) applyLobby(l.data);
      else applyLobby(Object.assign({}, R.lobby, { host_id: l.data.host_id, status: l.data.status, members_rev: l.data.members_rev }));
      if (R.hosting) hostMembers();
      R.link = 'up';
    } catch (e) {
      R.link = 'down';
    } finally {
      R.refreshing = false;
      paint();
      if (R.refreshAgain) { R.refreshAgain = false; refresh(); }
    }
  }

  async function loadMembers() {
    const { data, error } = await R.sb.from('lobby_members').select('user_id,name,seat').eq('lobby_id', R.lobbyId).order('seat');
    if (error) return;
    R.members = data || [];
    if (R.members.length && !R.members.some(m => m.user_id === R.me)) { gone('removed'); return; }
    if (R.hosting) hostMembers();
    paint();
  }

  function onLobby(row) {
    if (!row || row.id !== R.lobbyId || !R.lobby) return;
    const cur = R.lobby;
    if (row.rev < cur.rev || (row.rev === cur.rev && row.members_rev < cur.members_rev)) return;
    // A change event can leave out a big column that did not change.
    if (row.rev === cur.rev) row.state = cur.state;
    else if (row.state == null) { refresh(); return; }
    const members = row.members_rev !== cur.members_rev;
    applyLobby(row);
    if (members) loadMembers();
  }

  function applyLobby(row) {
    const before = R.lobby;
    R.lobby = row;
    if (row.status === 'closed') { gone('closed'); return; }
    if (!before || row.rev !== before.rev) R.pending = 0;
    const isHost = row.host_id === R.me;
    if (isHost && !R.hosting) startHosting();
    else if (!isHost && R.hosting) stopHosting();
    if (before && before.host_id !== row.host_id) R.hostSeen = Date.now();
    paint();
  }

  function onSecret(row) {
    if (!row || row.user_id !== R.me || row.rev < R.mineRev) return;
    R.mine = row.data;
    R.mineRev = row.rev;
    paint();
  }

  // Only the host can read actions, so only the host ever gets these.
  function onAction(row) {
    if (!R.hosting || !row || row.done) return;
    R.queue.push(row);
    pump();
  }

  function onPresence() {
    const st = R.channel.presenceState();
    R.online = new Set(Object.keys(st));
    if (R.lobby && R.online.has(R.lobby.host_id)) R.hostSeen = Date.now();
    paint();
  }

  function gone(key) {
    if (R.screen === 'notice') return;
    stopHosting();
    if (R.channel) { try { R.sb.removeChannel(R.channel); } catch (e) { /* already gone */ } R.channel = null; }
    R.lobbyId = null;
    setScreen('notice', { key });
  }

  function beat() {
    if (!R.me || document.hidden) return;
    rpc('me').then(p => { R.profile = p; }).catch(() => {});
    if (R.lobby && R.online.has(R.lobby.host_id)) R.hostSeen = Date.now();
  }

  /* ---------- Host loop ---------- */
  async function startHosting() {
    R.hosting = true;
    R.loaded = false;
    R.full = null;
    R.queue = [];
    R.seen = new Set();
    R.done = [];
    R.lastSecrets = {};
    try {
      const [h, a] = await Promise.all([
        R.sb.from('lobby_host_state').select('data').eq('lobby_id', R.lobbyId).maybeSingle(),
        R.sb.from('lobby_actions').select('id,user_id,data').eq('lobby_id', R.lobbyId).eq('done', false).order('id')
      ]);
      if (h.error || a.error) throw h.error || a.error;
      if (!R.hosting) return;
      R.full = h.data ? h.data.data : null;
      (a.data || []).forEach(x => R.queue.push(x));
      R.loaded = true;
      hostMembers();
      pump();
    } catch (e) {
      R.hosting = false;
      setTimeout(refresh, 3000);
    }
    paint();
  }

  function stopHosting() {
    R.hosting = false;
    R.loaded = false;
    R.full = null;
    R.queue = [];
  }

  function hostDo(run) {
    R.queue.push({ run });
    pump();
  }

  async function pump() {
    if (!R.hosting || !R.loaded || R.pumping) return;
    R.pumping = true;
    try {
      while (R.hosting && (R.queue.length || R.dirty || R.done.length)) {
        const batch = R.queue.splice(0);
        for (const a of batch) {
          if (a.run) {
            const st = a.run();
            R.dirty = true;
            if (st) R.nextStatus = st;
            continue;
          }
          if (a.id) {
            if (R.seen.has(a.id)) continue;
            R.seen.add(a.id);
            R.done.push(a.id);
          }
          if (!R.full || R.lobby.status !== 'playing') continue;
          if (!R.members.some(m => m.user_id === a.user_id)) continue;
          try {
            if (R.spec.act(R.full, a.user_id, a.data || {}, { host: R.me })) R.dirty = true;
          } catch (e) { console.error('Online: action failed', e); }
        }
        if (!(await commit())) break;
      }
    } finally {
      R.pumping = false;
    }
  }

  async function commit() {
    const spec = R.spec;
    const pub = R.full ? (spec.view ? spec.view(R.full) : R.full) : {};
    const all = R.full && spec.secrets ? spec.secrets(R.full) || {} : {};
    const changed = {};
    let any = false;
    Object.keys(all).forEach(id => {
      const j = JSON.stringify(all[id]);
      if (R.lastSecrets[id] !== j) { changed[id] = all[id]; any = true; }
    });
    const done = R.done.splice(0);
    const status = R.nextStatus;
    const wasDirty = R.dirty;
    R.nextStatus = null;
    R.dirty = false;
    if (!wasDirty && !status && !any) {
      if (!done.length) return true;
    }
    try {
      const rev = await rpc('host_commit', {
        p_lobby: R.lobbyId, p_state: pub, p_secrets: any ? changed : null, p_host: R.full,
        p_done: done.length ? done : null, p_status: status
      });
      Object.keys(changed).forEach(id => { R.lastSecrets[id] = JSON.stringify(changed[id]); });
      if (R.lobby) R.lobby = Object.assign({}, R.lobby, { state: pub, rev, status: status || R.lobby.status });
      if (all[R.me] !== undefined) { R.mine = all[R.me]; R.mineRev = rev; }
      R.failures = 0;
      R.link = 'up';
      paint();
      return true;
    } catch (e) {
      R.done = done.concat(R.done);
      if (String(e.message) === 'not_host') { stopHosting(); refresh(); return false; }
      R.dirty = wasDirty || R.dirty;
      if (status && !R.nextStatus) R.nextStatus = status;
      R.failures++;
      R.link = 'down';
      paint();
      setTimeout(pump, Math.min(8000, 400 * Math.pow(2, R.failures)));
      return false;
    }
  }

  function hostTick() {
    if (!R || !R.hosting || !R.loaded || !R.full || !R.lobby || R.lobby.status !== 'playing' || !R.spec.tick) return;
    let changed = false;
    try { changed = R.spec.tick(R.full, Date.now()); } catch (e) { console.error(e); }
    if (changed) { R.dirty = true; pump(); }
  }

  // Someone joined, left or was removed while the host is running a game.
  function hostMembers() {
    if (!R.hosting || !R.loaded || !R.full || !R.lobby || R.lobby.status !== 'playing' || !R.spec.leave) return;
    const ids = R.members.map(m => m.user_id);
    const key = ids.join(',');
    if (key === R.lastMemberKey) return;
    R.lastMemberKey = key;
    hostDo(() => R.spec.leave(R.full, ids));
  }

  function players() { return R.members.map(m => ({ id: m.user_id, name: m.name })); }

  function startGame() {
    if (!R.hosting || !R.loaded) return;
    if (R.members.length < R.spec.min) return;
    const opts = R.spec.readOptions ? R.spec.readOptions() : {};
    const list = players();
    R.lastMemberKey = list.map(p => p.id).join(',');
    hostDo(() => { R.full = R.spec.start(list, opts, R.full); return 'playing'; });
    P.stayAwake();
  }

  function endGame() {
    hostDo(() => 'open');
  }

  /* ---------- Sending actions ---------- */
  async function send(action) {
    if (!R.lobbyId || !action || typeof action !== 'object') return;
    if (R.hosting) {
      R.queue.push({ id: 0, user_id: R.me, data: action });
      pump();
      return;
    }
    R.pending = Date.now();
    paint();
    try {
      await rpc('send_action', { p_lobby: R.lobbyId, p_data: action });
      R.note = '';
    } catch (e) {
      R.pending = 0;
      R.note = problemKey(e) === 'not_member' ? PROBLEMS.not_member : 'That did not go through. Try again.';
      paint();
      setTimeout(() => { R.note = ''; paint(); }, 4000);
    }
  }

  /* ---------- Drawing ---------- */
  function view() {
    const isHost = !!(R.lobby && R.lobby.host_id === R.me);
    let pub = R.lobby ? R.lobby.state : {};
    let mine = R.mine;
    if (R.hosting && R.loaded && R.full && R.lobby && R.lobby.status === 'playing') {
      pub = R.spec.view ? R.spec.view(R.full) : R.full;
      const sec = R.spec.secrets ? R.spec.secrets(R.full) || {} : {};
      if (sec[R.me] !== undefined) mine = sec[R.me];
    }
    const names = {};
    R.members.forEach(m => { names[m.user_id] = m.name; });
    return {
      pub: pub || {}, mine, me: R.me, host: isHost, hostId: R.lobby && R.lobby.host_id,
      members: R.members, online: R.online, names,
      nameOf: id => names[id] || (id === R.me ? 'You' : 'Someone'),
      pending: R.pending && Date.now() - R.pending < 6000,
      send, redraw: paint, local: R.local
    };
  }

  let paintQueued = false;
  function paint() {
    if (paintQueued || !R) return;
    paintQueued = true;
    Promise.resolve().then(() => { paintQueued = false; draw(); });
  }

  function draw() {
    const spec = R.spec;
    let kind = R.screen, html = '', v = null;
    if (R.screen === 'room') {
      if (!R.lobby) kind = 'boot';
      else {
        v = view();
        kind = R.lobby.status === 'playing' && Object.keys(v.pub).length ? 'game' : 'wait';
      }
    }
    if (kind === 'boot') html = bootHTML();
    else if (kind === 'name') html = nameHTML();
    else if (kind === 'notice') html = noticeHTML();
    else if (kind === 'wait') html = waitHTML(v);
    else html = gameHTML(v);
    if (html !== R.lastHTML) {
      const keep = saveFields();
      app.innerHTML = html;
      restoreFields(keep);
      R.lastHTML = html;
      if (kind === 'game' && spec.bind) spec.bind(v, app);
      if (kind === 'name') { const f = document.getElementById('ol-name'); if (f && !keep['ol-name']) f.focus({ preventScroll: true }); }
      if (kind === 'wait' && R.local.renameFresh) {
        R.local.renameFresh = false;
        const f = document.getElementById('ol-rename');
        if (f) { f.focus({ preventScroll: true }); f.select(); }
      }
    }
    if (kind !== R.lastKind) {
      if (R.lastKind === 'game' && spec.unbind) { try { spec.unbind(); } catch (e) { console.error(e); } }
      window.scrollTo(0, 0);
      R.lastKind = kind;
    }
    if (kind === 'game' && spec.fx) {
      const key = JSON.stringify([v.pub, v.mine]);
      if (key !== R.prevKey) {
        try { spec.fx(v, R.prev); } catch (e) { console.error(e); }
        R.prev = v;
        R.prevKey = key;
      }
    } else if (kind !== 'game') { R.prev = null; R.prevKey = ''; }
    if (kind === 'wait') loadFriends();
  }

  function saveFields() {
    const out = {};
    app.querySelectorAll('input[data-keep],textarea[data-keep]').forEach(el => {
      out[el.id] = { v: el.value, f: document.activeElement === el, s: el.selectionStart, e: el.selectionEnd };
    });
    return out;
  }
  function restoreFields(saved) {
    Object.keys(saved).forEach(id => {
      const el = document.getElementById(id), k = saved[id];
      if (!el || !el.hasAttribute('data-keep')) return;
      if (el.value !== k.v) el.value = k.v;
      if (k.f) {
        el.focus({ preventScroll: true });
        try { el.setSelectionRange(k.s, k.e); } catch (x) { /* not a text field */ }
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function top(extra) { return R.spec.header() + (extra || ''); }
  function section(inner) { return '<section class="' + R.spec.ui.center + ' ol-room">' + inner + '</section>'; }

  function bootHTML() {
    const u = R.spec.ui;
    return top() + section('<p class="' + u.eyebrow + '">' + esc(R.spec.title) + ' online</p><h1 class="' + u.big + '">Connecting</h1><p class="' + u.lead + '">One moment.</p>');
  }

  function nameHTML() {
    const u = R.spec.ui, making = R.code === 'NEW';
    const pre = R.local.name != null ? R.local.name : (P.getRoster()[0] || '');
    return top() + section(`
      <p class="${u.eyebrow}">${esc(R.spec.title)} online</p>
      <h1 class="${u.big}">What should we call you?</h1>
      <p class="${u.lead}">Other players see this name. You do not need an account.</p>
      <div class="ol-field"><label for="ol-name">Your name</label><input id="ol-name" data-keep type="text" maxlength="18" autocomplete="nickname" autocapitalize="words" enterkeyhint="go" value="${esc(pre)}"></div>
      <p class="ol-err" id="ol-err" role="alert">${esc(R.note)}</p>
      <div class="actions center"><button class="${u.main}" type="button" data-ol="guest">${making ? 'Make the game' : 'Join the game'}</button></div>
      <p class="ol-small">Have an account? <a href="${ROOT}online/">Sign in on the Online page</a>.</p>`);
  }

  const NOTICES = {
    not_found: ['Game not found', c => 'There is no open game with the code ' + c + '. Check the code and try again.'],
    started: ['Already started', () => 'This game started without you. Ask the host to end it, then join again.'],
    full: ['Game is full', () => 'Every seat in this game is taken.'],
    removed: ['You are out', () => 'You are no longer in this game.'],
    closed: ['Game closed', () => 'Everyone left, so this game has closed.'],
    slow_down: ['Too many tries', () => 'Wait a few minutes, then try again.'],
    disabled: ['Online play is not ready', () => 'Online play has not been switched on yet. You can still play on one phone.'],
    offline: ['Cannot connect', () => 'Could not reach the game server. Check your connection and try again.']
  };
  function noticeHTML() {
    const u = R.spec.ui, n = R.notice || {}, t = NOTICES[n.key] || NOTICES.offline;
    return top() + section(`
      <p class="${u.eyebrow}">${esc(R.spec.title)} online</p>
      <h1 class="${u.big}">${t[0]}</h1>
      <p class="${u.lead}">${esc(t[1](R.code))}</p>
      <div class="actions center">
        ${n.retry ? `<button class="${u.main}" type="button" data-ol="retry">Try again</button>` : ''}
        <a class="${n.retry ? u.alt : u.main}" href="${esc(hereUrl('', false))}">Play on one phone</a>
        <a class="${u.alt}" href="${ROOT}online/">Online home</a>
      </div>`);
  }

  function hostName() {
    const m = R.members.find(x => x.user_id === (R.lobby && R.lobby.host_id));
    return m ? m.name : 'the host';
  }
  function awayBanner() {
    if (!R.lobby || R.hosting) return '';
    const hostHere = R.online.has(R.lobby.host_id);
    if (hostHere || Date.now() - R.hostSeen < 30000) return '';
    return `<div class="ol-banner" role="status">${esc(hostName())} has dropped out. The game waits for them.
      <br><button class="ol-mini" type="button" data-ol="takeover">Take over as host</button></div>`;
  }
  function linkBanner() {
    if (R.link === 'up' && !R.note) return '';
    return `<div class="ol-banner" role="status">${esc(R.note || 'Reconnecting. Your game is safe.')}</div>`;
  }

  function memberRow(m, v) {
    const on = R.online.has(m.user_id) || m.user_id === R.me;
    const isHost = m.user_id === R.lobby.host_id, mine = m.user_id === R.me;
    const fr = R.friends && R.friends.find(f => f.id === m.user_id);
    let friend = '';
    if (!mine && R.friends) {
      if (fr && fr.status === 'friend') friend = '<span class="ol-tag">Friend</span>';
      else if (fr && fr.status === 'sent') friend = '<span class="ol-tag">Asked</span>';
      else friend = `<button class="ol-mini" type="button" data-ol="befriend" data-id="${esc(m.user_id)}">${fr ? 'Accept friend' : 'Add friend'}</button>`;
    }
    return `<li><span class="ol-dot${on ? ' on' : ''}" aria-hidden="true"></span>
      <span class="ol-name">${esc(m.name)}<span class="sr">${on ? ', here' : ', away'}</span></span>
      ${mine ? '<span class="ol-tag">You</span>' : ''}${isHost ? '<span class="ol-tag">Host</span>' : ''}${friend}
      ${v.host && !mine ? `<button class="ol-mini" type="button" data-ol="kick" data-id="${esc(m.user_id)}" aria-label="Remove ${esc(m.name)}">Remove</button>` : ''}</li>`;
  }

  function inviteHTML() {
    const list = (R.friends || []).filter(f => f.status === 'friend' && !R.members.some(m => m.user_id === f.id));
    if (!list.length) return '';
    const u = R.spec.ui;
    const recent = f => f.last_seen && Date.now() - new Date(f.last_seen).getTime() < 120000;
    list.sort((a, b) => Number(recent(b)) - Number(recent(a)));
    return `<div class="ol-sec"><p class="${u.label}">Invite friends</p><ul class="ol-list">${list.map(f => `
      <li><span class="ol-dot${recent(f) ? ' on' : ''}" aria-hidden="true"></span><span class="ol-name">${esc(f.name)}<span class="sr">${recent(f) ? ', online' : ''}</span></span>
      <button class="ol-mini" type="button" data-ol="invite" data-id="${esc(f.id)}"${R.invited[f.id] ? ' disabled' : ''}>${R.invited[f.id] ? 'Invited' : 'Invite'}</button></li>`).join('')}</ul></div>`;
  }

  function waitHTML(v) {
    const u = R.spec.ui, spec = R.spec, n = R.members.length, max = spec.max;
    const enough = n >= spec.min;
    const opts = v.host && spec.options ? spec.options() : '';
    let go;
    if (v.host) {
      go = `<button class="${u.main}" type="button" data-ol="start"${enough && R.loaded ? '' : ' disabled'}>Start the game</button>`;
      if (!enough) go += `<p class="ol-small" style="width:100%">You need at least ${spec.min} players. ${n === 1 ? 'Only you are here so far.' : P.plural(n, 'player') + ' so far.'}</p>`;
    } else {
      go = `<p class="ol-wait">Waiting for ${esc(hostName())} to start.</p>`;
    }
    return top() + awayBanner() + linkBanner() + section(`
      <p class="${u.eyebrow}">Online game</p>
      <h1 class="${u.big}">${esc(spec.title)}</h1>
      <div class="${u.panel}">
        <p class="${u.label}">Game code</p>
        <p class="ol-code" aria-label="Game code ${esc(spaced(R.code))}">${esc(R.code)}</p>
        <p class="ol-small">Send friends the link, or they can type the code on the Online page.</p>
        <div class="ol-row" style="justify-content:center"><button class="${u.inAlt}" type="button" data-ol="copy">Copy link</button>${navigator.share ? `<button class="${u.inAlt}" type="button" data-ol="share">Share</button>` : ''}</div>
      </div>
      <div class="${u.panel}" style="text-align:left">
        <div class="ol-sec"><p class="${u.label}">Players ${n} of ${max}</p><ul class="ol-list">${R.members.map(m => memberRow(m, v)).join('')}</ul></div>
        ${opts ? `<div class="ol-sec">${opts}</div>` : ''}
        ${inviteHTML()}
      </div>
      <div class="actions center">${go}</div>
      ${R.local.renaming ? `<div class="ol-field"><label for="ol-rename">Your name</label><input id="ol-rename" data-keep type="text" maxlength="18" autocomplete="nickname" autocapitalize="words" enterkeyhint="done" value="${esc(R.profile ? R.profile.name : '')}"></div>
      <div class="actions center"><button class="${u.alt}" type="button" data-ol="rename-cancel">Cancel</button><button class="${u.main}" type="button" data-ol="rename-save">Save name</button></div>`
      : `<div class="actions center"><button class="${u.textbtn}" type="button" data-ol="rename">Change my name</button><button class="${u.textbtn}" type="button" data-ol="leave">Leave the game</button></div>`}`);
  }

  function gameHTML(v) {
    const u = R.spec.ui;
    const bar = `<div class="ol-bar"><span class="ol-pill">Online <b>${esc(R.code)}</b></span><span>
      ${v.host ? `<button class="${u.textbtn}" type="button" data-ol="end">End game</button>` : ''}
      <button class="${u.textbtn}" type="button" data-ol="leave">Leave</button></span></div>`;
    let body;
    try { body = R.spec.render(v); } catch (e) { console.error(e); body = section('<p class="' + u.lead + '">Loading the game.</p>'); }
    return top(bar) + awayBanner() + linkBanner() + body;
  }

  /* ---------- Friends in the waiting room ---------- */
  function loadFriends() {
    if (!R.me || Date.now() - R.friendsAt < 30000) return;
    R.friendsAt = Date.now();
    rpc('my_friends').then(list => { R.friends = list || []; paint(); }).catch(() => {});
  }

  /* ---------- Input ---------- */
  function armed(el, label) {
    if (el.dataset.armed) return true;
    el.dataset.armed = '1';
    const old = el.textContent;
    el.textContent = label;
    setTimeout(() => { if (el.isConnected && el.dataset.armed) { delete el.dataset.armed; el.textContent = old; } }, 3000);
    return false;
  }

  async function goGuest() {
    const f = document.getElementById('ol-name');
    const name = P.cleanName(f ? f.value : '');
    if (!name) { R.note = 'Type a name first.'; R.lastHTML = ''; paint(); return; }
    R.local.name = name;
    R.note = '';
    setScreen('boot');
    try {
      const s = await guest(name);
      enter(s);
    } catch (e) {
      const k = problemKey(e);
      if (k === 'disabled' || k === 'offline') return setScreen('notice', { key: k, retry: k === 'offline' });
      R.note = problem(e);
      setScreen('name');
    }
  }

  async function rename() {
    const f = document.getElementById('ol-rename');
    const next = P.cleanName(f ? f.value : '');
    R.local.renaming = false;
    paint();
    if (!next || (R.profile && next === R.profile.name)) return;
    try {
      const n = await rpc('set_name', { p_name: next });
      if (R.profile) R.profile.name = n;
      if (R.channel) R.channel.track({ name: n });
      loadMembers();
    } catch (e) { R.note = problem(e); paint(); }
  }

  function onKey(e) {
    if (e.key !== 'Enter' || !e.target) return;
    if (e.target.id === 'ol-name') { e.preventDefault(); goGuest(); }
    if (e.target.id === 'ol-rename') { e.preventDefault(); rename(); }
    // A game field marked data-enter="name" acts like its data-ui="name" button.
    const ui = e.target.getAttribute && e.target.getAttribute('data-enter');
    if (ui && R.screen === 'room' && R.spec.click && app.contains(e.target)) { e.preventDefault(); R.spec.click(ui, e.target, view()); }
  }

  function onClick(e) {
    const el = e.target.closest('[data-ol],[data-send],[data-ui]');
    if (!el || el.disabled || !app.contains(el)) return;
    P.sfx.unlock();
    if (el.hasAttribute('data-send')) {
      let a = null;
      try { a = JSON.parse(el.getAttribute('data-send')); } catch (x) { return; }
      send(a);
      return;
    }
    if (el.hasAttribute('data-ui')) {
      if (R.spec.click) R.spec.click(el.getAttribute('data-ui'), el, view());
      return;
    }
    const id = el.getAttribute('data-id');
    switch (el.getAttribute('data-ol')) {
      case 'guest': goGuest(); break;
      case 'retry': location.reload(); break;
      case 'start': startGame(); break;
      case 'end': if (armed(el, 'Tap again to end')) endGame(); break;
      case 'leave':
        if (R.lobby && R.lobby.status === 'playing' && !armed(el, 'Tap again to leave')) break;
        el.disabled = true;
        rpc('leave_lobby', { p_lobby: R.lobbyId }).catch(() => {}).then(() => { location.href = hereUrl('', true); });
        break;
      case 'kick':
        if (!armed(el, 'Tap to confirm')) break;
        rpc('kick_player', { p_lobby: R.lobbyId, p_user: id }).then(() => {
          if (R.channel) R.channel.send({ type: 'broadcast', event: 'kick', payload: { id } });
          loadMembers();
        }).catch(err => { R.note = problem(err); paint(); });
        break;
      case 'takeover':
        el.disabled = true;
        rpc('claim_host', { p_lobby: R.lobbyId }).then(ok => {
          if (ok) R.note = '';
          else { R.note = hostName() + ' is still connected. Give them a moment.'; R.hostSeen = Date.now(); setTimeout(() => { R.note = ''; paint(); }, 5000); }
          paint();
          refresh();
        }).catch(err => { R.note = problem(err); paint(); });
        break;
      case 'copy': {
        const url = hereUrl(R.code, false);
        const done = () => { el.textContent = 'Link copied'; setTimeout(() => { if (el.isConnected) el.textContent = 'Copy link'; }, 2000); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => window.prompt('Copy this link', url));
        else window.prompt('Copy this link', url);
        break;
      }
      case 'share':
        navigator.share({ title: R.spec.title, text: 'Join my game of ' + R.spec.title + '. The code is ' + R.code + '.', url: hereUrl(R.code, false) }).catch(() => {});
        break;
      case 'invite':
        el.disabled = true;
        rpc('invite_friend', { p_lobby: R.lobbyId, p_user: id }).then(r => {
          R.invited[id] = true;
          if (r !== 'sent') R.note = r === 'here' ? 'They are already here.' : '';
          paint();
        }).catch(err => { el.disabled = false; R.note = problem(err); paint(); });
        break;
      case 'befriend':
        el.disabled = true;
        rpc('add_lobby_friend', { p_lobby: R.lobbyId, p_user: id }).then(r => {
          R.note = r === 'accepted' ? 'You are now friends.' : r === 'sent' ? 'Friend request sent.' : '';
          R.friendsAt = 0;
          loadFriends();
          paint();
          setTimeout(() => { R.note = ''; paint(); }, 4000);
        }).catch(err => { el.disabled = false; R.note = problem(err); paint(); });
        break;
      case 'rename': R.local.renaming = true; R.local.renameFresh = true; paint(); break;
      case 'rename-save': rename(); break;
      case 'rename-cancel': R.local.renaming = false; paint(); break;
    }
  }

  /* ---------- Helpers for game pages ---------- */
  // Counts down to `ends` (a Date.now() time) in the element with this id.
  // `local` is the v.local object, so one game page runs one countdown at a time.
  // o.tick plays a tick in the last ten seconds, o.onEnd runs once at zero.
  function ticker(local, id, ends, o) {
    clearInterval(local.olTick);
    const el = document.getElementById(id);
    if (!el || !ends) return;
    const opt = o || {};
    const step = () => {
      if (!el.isConnected) { clearInterval(local.olTick); return; }
      const left = Math.max(0, ends - Date.now());
      el.textContent = left > 0 ? P.clock(left) : (opt.done || "Time's up");
      el.classList.toggle('low', left > 0 && left <= (opt.low || 10000));
      el.classList.toggle('done', left <= 0);
      const sec = Math.ceil(left / 1000);
      if (sec !== local.olSec) {
        local.olSec = sec;
        if (opt.tick && sec > 0 && sec <= 10) P.sfx.tick();
        if (sec <= 0 && opt.onEnd && local.olEnded !== ends) { local.olEnded = ends; if (local.olSeen === ends) opt.onEnd(); }
      }
      if (left > 0) local.olSeen = ends;
    };
    step();
    local.olTick = setInterval(step, 250);
  }

  /* ---------- Small helpers for the online page and the hub ---------- */
  function watchInvites(uid, onInvite) {
    return client().then(sb => {
      const ch = sb.channel('user:' + uid, { config: { private: true } });
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_id=eq.' + uid }, p => onInvite(p.new));
      ch.subscribe();
      return ch;
    });
  }

  window.Online = {
    GAMES, ROOT, AS, wanted, room, client, hasSession, getSession, rpc,
    guest, sendCode, checkCode, addEmail, signOut, problem, problemKey,
    gameUrl, watchInvites, spaced, sendAttr, ticker,
    redraw: () => paint()
  };
})();
