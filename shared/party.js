/* Pass the Phone: helpers shared by every game. Plain script, no build step.
   Exposes window.Party. Every game loads it with <script src="../shared/party.js">. */
(function () {
  'use strict';

  /* ---------- Storage (fails quietly in private mode) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Small utilities ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, word, many) => n + ' ' + (n === 1 ? word : (many || word + 's'));
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rand = (min, max) => min + Math.random() * (max - min);
  const possessive = n => (/s$/i.test(n) ? n + "'" : n + "'s");

  /* ---------- Players: one roster shared by every game on the site ---------- */
  const ROSTER = 'ptp.players';
  const cleanName = n => String(n == null ? '' : n).replace(/\s+/g, ' ').trim().slice(0, 18);
  function getRoster() {
    const r = store.get(ROSTER, []);
    return Array.isArray(r) ? r.map(cleanName).filter(Boolean).slice(0, 16) : [];
  }
  function setRoster(list) { store.set(ROSTER, (list || []).map(cleanName).filter(Boolean).slice(0, 16)); }
  function finalNames(list) {
    const seen = {};
    return list.map((n, i) => {
      let v = cleanName(n) || 'Player ' + (i + 1);
      const k = v.toLowerCase();
      seen[k] = (seen[k] || 0) + 1;
      if (seen[k] > 1) v = v.slice(0, 15) + ' ' + seen[k];
      return v;
    });
  }

  const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

  /* Editable list of player names. Each game styles the .pp-* classes. */
  function playerEditor(el, opts) {
    const o = Object.assign({ min: 2, max: 12, onChange: null }, opts || {});
    let names = getRoster();
    while (names.length < o.min) names.push('');
    if (names.length > o.max) names = names.slice(0, o.max);

    function persist() {
      setRoster(names);
      if (o.onChange) o.onChange(api.get());
    }
    function render(focusIdx) {
      el.innerHTML = '<ol class="pp-list">' + names.map((n, i) =>
        '<li class="pp-row"><span class="pp-num" aria-hidden="true">' + (i + 1) + '</span>' +
        '<label class="pp-sr" for="pp-name-' + i + '">Player ' + (i + 1) + ' name</label>' +
        '<input class="pp-input" id="pp-name-' + i + '" data-pp="' + i + '" type="text" maxlength="18" autocomplete="off" autocapitalize="words" enterkeyhint="next" placeholder="Player ' + (i + 1) + '" value="' + esc(n) + '">' +
        '<button class="pp-remove" type="button" data-pp-remove="' + i + '" aria-label="Remove player ' + (i + 1) + '"' + (names.length <= o.min ? ' disabled' : '') + '>' + ICON_X + '</button></li>'
      ).join('') + '</ol>' +
        '<button class="pp-add" type="button" data-pp-add' + (names.length >= o.max ? ' disabled' : '') + '>Add player</button>';
      if (focusIdx != null) { const f = el.querySelector('#pp-name-' + focusIdx); if (f) f.focus(); }
    }
    el.addEventListener('input', e => {
      const i = e.target.getAttribute('data-pp');
      if (i == null) return;
      names[Number(i)] = e.target.value;
      persist();
    });
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.matches('.pp-input')) return;
      e.preventDefault();
      const i = Number(e.target.getAttribute('data-pp'));
      const next = el.querySelector('#pp-name-' + (i + 1));
      if (next) next.focus();
      else if (names.length < o.max && cleanName(e.target.value)) { names.push(''); render(names.length - 1); persist(); }
      else e.target.blur();
    });
    el.addEventListener('click', e => {
      const add = e.target.closest('[data-pp-add]');
      const rm = e.target.closest('[data-pp-remove]');
      if (add && !add.disabled) { names.push(''); render(names.length - 1); persist(); }
      else if (rm && !rm.disabled) { names.splice(Number(rm.getAttribute('data-pp-remove')), 1); render(); persist(); }
    });
    const api = {
      get() { return finalNames(names); },
      count() { return names.length; },
      render
    };
    render();
    return api;
  }

  /* ---------- Draw piles that avoid repeats across visits ---------- */
  function deck(key, items, idOf) {
    const K = 'ptp.used.' + key;
    const id = idOf || (x => (typeof x === 'string' ? x : JSON.stringify(x)));
    return {
      draw(n, avoid) {
        const skip = new Set((avoid || []).map(id));
        let used = new Set(store.get(K, []));
        let pool = items.filter(x => !used.has(id(x)) && !skip.has(id(x)));
        if (pool.length < n) {
          used = new Set();
          pool = items.filter(x => !skip.has(id(x)));
        }
        const out = shuffle(pool.slice()).slice(0, n);
        out.forEach(x => used.add(id(x)));
        store.set(K, [...used]);
        return out;
      },
      one(avoid) { return this.draw(1, avoid)[0]; },
      fresh() { const used = new Set(store.get(K, [])); return items.filter(x => !used.has(id(x))).length; },
      reset() { store.del(K); }
    };
  }

  /* ---------- Sound (Web Audio, no files) ---------- */
  const SOUND = 'ptp.sound';
  let actx = null;
  let noiseBuf = null;
  const soundOn = () => store.get(SOUND, true) !== false;
  function ac() {
    if (!soundOn()) return null;
    try {
      if (!actx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        actx = new C();
      }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freq, o) {
    const c = ac();
    if (!c) return null;
    o = o || {};
    const t = c.currentTime + 0.005 + (o.at || 0);
    const dur = o.dur || 0.2, peak = o.gain == null ? 0.15 : o.gain, att = o.attack || 0.008;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    if (o.hold) g.gain.setValueAtTime(peak, t + att + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = osc;
    if (o.lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      osc.connect(f);
      out = f;
    }
    out.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    return osc;
  }
  function noise(o) {
    const c = ac();
    if (!c) return;
    o = o || {};
    const dur = o.dur || 0.4, t = c.currentTime + 0.005 + (o.at || 0);
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.freq || 1200, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain == null ? 0.3 : o.gain, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
  const sfx = {
    on: soundOn,
    set(v) { store.set(SOUND, !!v); syncToggles(); if (v) sfx.pop(); },
    unlock() { ac(); },
    tone,
    noise,
    pop() { tone(520, { type: 'triangle', to: 880, dur: 0.12, gain: 0.12 }); },
    tick(f) { tone(f || 1500, { type: 'square', dur: 0.04, gain: 0.05, attack: 0.002 }); },
    beep(hi) { tone(hi ? 1320 : 880, { dur: hi ? 0.45 : 0.16, gain: 0.16 }); },
    ding() {
      tone(1318.5, { gain: 0.24, dur: 1.5 });
      tone(2637, { gain: 0.08, dur: 1 });
      tone(659.25, { gain: 0.07, dur: 1.2 });
    },
    buzz(len) {
      const L = len || 0.7;
      [98, 104, 196].forEach(f => tone(f, { type: 'sawtooth', gain: 0.09, dur: L, hold: Math.max(0.01, L - 0.1), lowpass: 1400, attack: 0.015 }));
    },
    whoosh() { noise({ filter: 'bandpass', freq: 400, to: 2600, dur: 0.32, gain: 0.3, q: 1.4 }); },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.12, dur: i === 3 ? 0.9 : 0.25, gain: 0.16 }));
      tone(1318.5, { at: 0.36, dur: 0.9, gain: 0.05 });
    },
    lose() { [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, { type: 'triangle', at: i * 0.2, dur: 0.32, gain: 0.14 })); },
    boom() {
      noise({ freq: 1400, to: 50, dur: 1.8, gain: 0.9, attack: 0.004 });
      tone(80, { to: 28, dur: 1.4, gain: 0.7, glide: 1.1 });
    }
  };

  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function soundToggle(cls) {
    const on = soundOn();
    return '<button type="button" class="ptp-sound' + (cls ? ' ' + cls : '') + '" data-ptp-sound aria-pressed="' + on + '" aria-label="Sound effects">' + (on ? ICON_ON : ICON_OFF) + '</button>';
  }
  function syncToggles() {
    const on = soundOn();
    document.querySelectorAll('[data-ptp-sound]').forEach(b => {
      b.innerHTML = on ? ICON_ON : ICON_OFF;
      b.setAttribute('aria-pressed', String(on));
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ptp-sound]');
    if (b) sfx.set(!soundOn());
  });

  /* ---------- Device helpers ---------- */
  let lock = null, wantAwake = false;
  async function stayAwake() {
    wantAwake = true;
    try {
      if ('wakeLock' in navigator && !lock) {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => { lock = null; });
      }
    } catch (e) { lock = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wantAwake) stayAwake();
  });
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not supported */ } }
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function confetti(opts) {
    if (reducedMotion()) return;
    const o = Object.assign({ colors: ['#ffd23f', '#ff4f6d', '#3ec1ff', '#7bff8a', '#ffffff'], count: 160, ms: 6500 }, opts || {});
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    const parts = Array.from({ length: o.count }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 2.4, vy: 2 + Math.random() * 3.5,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 10,
      c: o.colors[(Math.random() * o.colors.length) | 0]
    }));
    const t0 = performance.now();
    function frame(now) {
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.r += p.vr;
        if (p.y < H + 30) alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, Math.max(1, p.h * Math.abs(Math.cos(p.r * 2))));
        ctx.restore();
      }
      if (alive && now - t0 < o.ms) requestAnimationFrame(frame);
      else cv.remove();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Markup helpers (used with shared/base.css) ---------- */
  const BACK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function header() {
    return '<header class="top"><a class="back" href="../">' + BACK_ICON + 'All games</a>' + soundToggle() + '</header>';
  }
  function seg(name, opts, current) {
    return '<div class="seg" role="radiogroup">' + opts.map(o =>
      '<label><input type="radio" name="' + name + '" id="' + name + '-' + o[0] + '" value="' + o[0] + '"' + (String(current) === String(o[0]) ? ' checked' : '') + '><span>' + o[1] + '</span></label>'
    ).join('') + '</div>';
  }
  function opt(name, value, title, text, current) {
    return '<label class="opt"><input type="radio" name="' + name + '" id="' + name + '-' + value + '" value="' + value + '"' + (String(current) === String(value) ? ' checked' : '') + '><span class="opt-box"><b>' + title + '</b><small>' + text + '</small></span></label>';
  }
  function listNames(names) {
    if (names.length < 2) return names[0] || '';
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }
  function passScreen(o) {
    return '<section class="center pass">' +
      (o.eyebrow ? '<p class="eyebrow">' + esc(o.eyebrow) + '</p>' : '') +
      '<h2 class="big">Pass to ' + esc(o.name) + '</h2>' +
      (o.lead ? '<p class="lead">' + o.lead + '</p>' : '') +
      '<div class="actions center"><button class="btn btn-main btn-big" type="button" data-act="' + (o.act || 'me') + '">I am ' + esc(o.name) + '</button></div>' +
      (o.extra || '') + '</section>';
  }
  function scoreList(entries) {
    const rows = entries.slice().sort((a, b) => b[1] - a[1]);
    const top = rows.length ? rows[0][1] : 0;
    return '<ol class="scores">' + rows.map(r => '<li' + (top > 0 && r[1] === top ? ' class="top"' : '') + '><span>' + esc(r[0]) + '</span><b>' + r[1] + '</b></li>').join('') + '</ol>';
  }
  function splitTeams(names, mix) {
    const a = [], b = [];
    (mix || names.map((_, i) => i)).forEach((idx, k) => (k % 2 === 0 ? a : b).push(names[idx]));
    return [a, b];
  }

  /* Press and hold to show a secret. The element gets the class "open" while held. */
  function holdToReveal(el, onOpen) {
    let open = false;
    const set = v => {
      if (v === open) return;
      open = v;
      el.classList.toggle('open', v);
      if (v && onOpen) onOpen();
    };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
      set(true);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => el.addEventListener(t, () => set(false)));
    el.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(true); } });
    el.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(false); } });
    el.addEventListener('blur', () => set(false));
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  /* Countdown that survives re-renders. onTick(msLeft, secondsLeft) runs ten times a second. */
  function countdown(ms, o) {
    o = o || {};
    let left = ms, last = 0, id = null, running = false, lastSec = null;
    function step() {
      const now = performance.now();
      left -= now - last;
      last = now;
      const sec = Math.max(0, Math.ceil(left / 1000));
      if (sec !== lastSec) {
        lastSec = sec;
        if (o.tickLast && sec > 0 && sec <= o.tickLast) sfx.tick();
      }
      if (o.onTick) o.onTick(Math.max(0, left), sec);
      if (left <= 0) { stop(); if (o.onEnd) o.onEnd(); }
    }
    function start() {
      if (running || left <= 0) return;
      running = true;
      last = performance.now();
      clearInterval(id);
      id = setInterval(step, 100);
      step();
    }
    function stop() { running = false; clearInterval(id); }
    return {
      start, stop,
      get left() { return Math.max(0, left); },
      get running() { return running; },
      reset(v) { stop(); left = v; lastSec = null; }
    };
  }
  const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* Read text out loud. Resolves when finished, or after a safe delay if the voice never reports back. */
  function speak(text, o) {
    o = o || {};
    return new Promise(res => {
      const synth = window.speechSynthesis;
      if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') { res(); return; }
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = o.rate || 0.95;
        u.pitch = o.pitch || 1;
        if (o.voice) u.voice = o.voice;
        let done = false;
        const fin = () => { if (!done) { done = true; res(); } };
        u.onend = fin;
        u.onerror = fin;
        setTimeout(fin, 2000 + text.length * 85);
        synth.speak(u);
      } catch (e) { res(); }
    });
  }
  function hush() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  const canSpeak = () => !!(window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined');
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* Loose answer matching for typed guesses: ignores case, accents, articles, plurals and small typos. */
  function normAnswer(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ').trim().replace(/^(a|an|the) /, '');
  }
  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function sameAnswer(a, b) {
    const x = normAnswer(a), y = normAnswer(b);
    if (!x || !y) return false;
    if (x === y) return true;
    const strip = s => s.replace(/(es|s)$/, '');
    if (x.length > 3 && y.length > 3 && strip(x) === strip(y)) return true;
    const L = Math.max(x.length, y.length);
    return L >= 5 && lev(x, y) <= (L >= 10 ? 2 : 1);
  }

  window.Party = {
    store, esc, plural, shuffle, pick, rand, possessive,
    cleanName, getRoster, setRoster, finalNames, playerEditor,
    deck, sfx, soundToggle, stayAwake, vibrate, reducedMotion, confetti,
    header, seg, opt, listNames, passScreen, scoreList, splitTeams,
    holdToReveal, countdown, clock, speak, hush, canSpeak, wait,
    normAnswer, lev, sameAnswer
  };
})();
