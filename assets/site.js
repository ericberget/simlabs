/* Woven Sim Lab microsite — page behavior
   ---------------------------------------------------------------
   SETTINGS: edit these two blocks to connect real videos and the form.
*/

// Each video can use ONE of:
//   src:   path or URL to an MP4 file, e.g. 'videos/xft-sizzle.mp4'
//   embed: an embed URL (Canva, Vimeo, YouTube "embed" links). Add `link` for an "Open in..." fallback.
// Leave both '' to show a "coming soon" card.
const VIDEOS = {
  sizzle: {
    src: '',
    embed: 'https://www.canva.com/design/DAHX6MLO6Pg/yl5CijpRftGZ_18JZqZJTg/watch?embed',
    title: 'XFT Performance Lab sizzle reel', poster: 'images/xft-performance-lab-thumbnail.jpg'
  },
  scenario:     { src: '', title: 'Scenario video',                  poster: 'images/scenario-video-still.jpg' },
  instructions: { src: '', title: 'Instructions video',              poster: 'images/instructions-video-still.jpg' }
};

// Where the contact form posts (Formspree, HubSpot, Netlify, your own endpoint...). Leave '' until it's set up.
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = '[CONTACT EMAIL]';

// Analytics. Paste Woven's Google Analytics 4 measurement ID (looks like 'G-XXXXXXXXXX') to switch it on.
// Leave '' and nothing is loaded or sent. Set debug: true to see every event in the browser console instead.
// Umami also works: set provider: 'umami' and fill umamiId (the site's Website ID).
const ANALYTICS = {
  provider: 'ga4',        // 'ga4' or 'umami'
  ga4Id: '',
  umamiId: '',
  umamiSrc: 'https://cloud.umami.is/script.js',
  debug: false
};

/* --------------------------------------------------------------- */

(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Analytics ----------
     Page visits are counted automatically by the analytics tool.
     track() records the actions listed in the README. Without an ID it does nothing. */
  const track = (() => {
    const A = ANALYTICS;
    let send = null;
    try {
      if (A.provider === 'ga4' && A.ga4Id) {
        const s = document.createElement('script');
        s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.ga4Id);
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', A.ga4Id);
        send = (name, params) => window.gtag('event', name, params || {});
      } else if (A.provider === 'umami' && A.umamiId) {
        const s = document.createElement('script');
        s.defer = true; s.src = A.umamiSrc; s.setAttribute('data-website-id', A.umamiId);
        document.head.appendChild(s);
        send = (name, params) => { if (window.umami) window.umami.track(name, params || {}); };
      }
    } catch (e) { send = null; }
    return (name, params) => {
      if (A.debug) console.log('[analytics]', name, params || {});
      if (send) { try { send(name, params); } catch (e) { /* never let tracking break the page */ } }
    };
  })();
  const trackOnce = (() => { const seen = new Set(); return (key, name, params) => { if (seen.has(key)) return; seen.add(key); track(name, params); }; })();

  // "Request a demo" buttons (nav, mobile menu, hero links to the form)
  document.querySelectorAll('a[href="#contact"]').forEach((a) => a.addEventListener('click', () => {
    const where = a.closest('.site-header') ? 'nav' : a.id === 'request-lab' ? 'lab' : 'page';
    if (where !== 'lab') track('demo_button_click', { location: where });
  }));

  // How far down the page people get (each section reported once per visit)
  if ('IntersectionObserver' in window) {
    const secIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { trackOnce('sec-' + e.target.id, 'section_view', { section: e.target.id }); secIO.unobserve(e.target); }
    }), { threshold: 0.3 });
    ['possible', 'how', 'materials', 'leaderboard', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) secIO.observe(el); });
  }

  /* ---------- Mobile menu + sticky shadow ---------- */
  const header = document.querySelector('.site-header');
  const toggle = header.querySelector('.nav-toggle');
  toggle.addEventListener('click', () => {
    const open = !header.classList.contains('nav-open');
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  header.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the nav link for the section in view
  const links = Array.from(header.querySelectorAll('.nav-links a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = map.get(e.target.id);
        if (!a) return;
        if (e.isIntersecting) { links.forEach((l) => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Navy band: becomes a slow ticker only when the items don't fit ---------- */
  const band = document.getElementById('band');
  if (band) {
    const track = band.querySelector('.band-track');
    const originals = Array.from(track.children);
    const fitBand = () => {
      band.classList.remove('is-ticker');
      track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
      if (track.scrollWidth > band.clientWidth - 60) {
        originals.forEach((li) => { const c = li.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
        band.classList.add('is-ticker');
        band.style.setProperty('--ticker-dur', Math.round(track.scrollWidth / 2 / 40) + 's'); // about 40px per second
      }
    };
    let bandTimer = null;
    window.addEventListener('resize', () => { clearTimeout(bandTimer); bandTimer = setTimeout(fitBand, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBand); else fitBand();
    fitBand();
  }

  /* ---------- Engineer your lab ---------- */
  const C = { coral: '#FF585D', teal: '#2CD5C4', gold: '#FFB81C', green: '#00B388', blue: '#198ED6', sky: '#4FB3EA', tan: '#C09C83' };

  const PROBLEMS = [
    { label: 'Launch readiness', measures: ['Collaboration', 'Stakeholder mapping', 'Final recommendation'], desc: 'The first 90 days after approval, with every handoff between functions tested before it happens for real.' },
    { label: 'Access barrier', measures: ['Problem diagnosis', 'Question quality', 'Stakeholder mapping'], desc: 'A payer, formulary or hub change lands mid-quarter. Teams have to diagnose it and respond together.' },
    { label: 'Competitive move', measures: ['Question quality', 'Problem diagnosis', 'Final recommendation'], desc: 'A new entrant changes the conversation. Teams uncover what changed and decide how to respond.' },
    { label: 'Stakeholder friction', measures: ['Stakeholder mapping', 'Question quality', 'Collaboration'], desc: 'An account where every stakeholder sees a different problem. Better questions surface the real one.' }
  ];
  const TEAMS = [
    { label: 'Cross-functional', short: 'brand, access, field, medical and ops together' },
    { label: 'Field sales', short: 'field sales teams' },
    { label: 'Access & KAMs', short: 'market access and key account teams' },
    { label: 'Medical / MSL', short: 'medical and MSL teams' }
  ];
  const FORMATS = [
    { label: 'Live, in the room', short: 'live, in the room', inc: 'Room-to-room discovery in a live meeting space' },
    { label: 'Hybrid meeting', short: 'across in-room and remote teams', inc: 'One shared scenario on iPads and laptops, so remote and in-room teams play on one board' },
    { label: 'Virtual, on demand', short: 'virtually, on their own time', inc: 'Avatar-led practice conversations with branching feedback, available any time' },
    { label: 'Six-month series', short: 'as a six-month series', inc: 'A kickoff lab followed by monthly micro-challenges and branching refreshers' }
  ];
  const LEVELS = ['Low', 'Medium', 'High'];
  const COMP_FX = ['Team reflection, no scores shown', 'Scored rubric with an end-of-day Showdown', 'Live leaderboard all day, with team certification'];
  const TIME_FX = ['Open-ended rounds with time to talk it through', 'Timed decision checkpoints in every round', 'A live clock, with surprise events mid-round'];
  const SIZE_LABELS = ['Small group', 'Full team', 'Large meeting'];
  const SIZE_FX = ['A focused session with a handful of teams', 'Several teams competing on one leaderboard', 'A large meeting with many teams and breakout rooms'];

  const DIALS = [
    { key: 'problem', name: 'Problem',       color: C.coral, labels: PROBLEMS.map((x) => x.label), tip: 'The business situation the lab is built around. We write the scenario, characters and data to fit your brand and market.' },
    { key: 'team',    name: 'People',        color: C.teal,  labels: TEAMS.map((x) => x.label), tip: 'Who takes part. A lab can mix functions or focus on one team, and each role gets material written for it.' },
    { key: 'format',  name: 'Setting',       color: C.gold,  labels: FORMATS.map((x) => x.label), tip: 'Where and how the lab runs: in one room, hybrid, on demand, or as a series over several months.' },
    { key: 'comp',    name: 'Competition',   color: C.green, labels: LEVELS, tip: 'How much the lab runs on scores. Low keeps it to team reflection with no scores shown. High adds a live leaderboard all day.' },
    { key: 'tp',      name: 'Time pressure', color: C.sky,   labels: LEVELS, tip: 'Timed rounds keep teams on task and add the kind of pressure they face in the field. Turn it down for more open discussion.' },
    { key: 'size',    name: 'Group size',    color: C.tan,   labels: SIZE_LABELS, tip: 'How many people take part. Labs scale from a few teams to a large meeting with breakout rooms.' }
  ];
  const DEFAULTS = { problem: 0, team: 0, format: 0, comp: 1, tp: 1, size: 1 };
  const state = Object.assign({}, DEFAULTS);

  /* Dial sounds: synthesized with Web Audio, so there are no audio files to load */
  const Sound = (() => {
    // Overall volume for every dial sound (1 = original level). Lowered 40% on request.
    const MASTER_VOLUME = 0.6;
    let ctx = null;
    let master = null;
    let on = true;
    try { on = localStorage.getItem('simlab-sound') !== 'off'; } catch (e) { /* storage blocked */ }
    const ac = () => {
      if (!ctx) {
        const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
        ctx = new A();
        master = ctx.createGain(); master.gain.value = MASTER_VOLUME; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    let noiseBuf = null;
    const noise = (c) => {
      if (noiseBuf) return noiseBuf;
      // 10 ms of white noise with a very fast decay: a dry "tk", no body
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.01), c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
      return noiseBuf;
    };
    // One detent click: high-passed noise tick plus a tiny high "ping" so it sounds like metal, not plastic.
    // Nothing below ~2 kHz, and no pitch slides, so it stays crisp. pos/n nudges the ping up as the dial turns.
    function detent(t, pos, n, vol) {
      const c = ctx;
      const step = pos / Math.max(1, n - 1);
      const snap = c.createBufferSource(); snap.buffer = noise(c);
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
      const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 5200 + step * 1200; pk.Q.value = 2; pk.gain.value = 8;
      const g1 = c.createGain(); g1.gain.setValueAtTime(0.5 * vol, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
      snap.connect(hp).connect(pk).connect(g1).connect(master); snap.start(t); snap.stop(t + 0.015);
      const ping = c.createOscillator(); ping.type = 'sine'; ping.frequency.value = 3200 + step * 700;
      const g2 = c.createGain(); g2.gain.setValueAtTime(0.05 * vol, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      ping.connect(g2).connect(master); ping.start(t); ping.stop(t + 0.03);
    }
    // Beep: a short steady tone (no pitch slide). Positions map onto a major-pentatonic scale
    // so turning a dial steps through notes that sound good together.
    const SCALE = [659.25, 783.99, 880.0, 1046.5, 1174.66]; // E5 G5 A5 C6 D6
    function beep(t, pos, n, vol) {
      const c = ctx;
      // 3-option dials play E G C, 4-option dials play E G A C
      const notes = n === 3 ? [SCALE[0], SCALE[1], SCALE[3]] : [SCALE[0], SCALE[1], SCALE[2], SCALE[3]];
      const f = notes[pos] || SCALE[0];
      const o1 = c.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2; // soft upper partial for a "digital" edge
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11 * vol, t + 0.006);
      g.gain.setValueAtTime(0.11 * vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      const g2 = c.createGain(); g2.gain.value = 0.25;
      o1.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(master);
      o1.start(t); o2.start(t); o1.stop(t + 0.14); o2.stop(t + 0.14);
    }

    return {
      get on() { return on; },
      set(v) { on = v; try { localStorage.setItem('simlab-sound', v ? 'on' : 'off'); } catch (e) { /* ignore */ } },
      // A dial landing on a new setting: a faint pre-tick, then the main click (like a knob dropping into a notch)
      turn(pos, n) {
        if (!on || !ac()) return;
        const t = ctx.currentTime + 0.005;
        detent(t, pos, n, 0.3); detent(t + 0.03, pos, n, 1);
        beep(t + 0.03, pos, n, 1);
      },
      // Reset: a fast run of light ticks, then a soft two-note chime
      reset() {
        if (!on || !ac()) return;
        const t = ctx.currentTime + 0.005;
        for (let i = 0; i < 6; i++) detent(t + i * 0.035, 3 - (i % 4), 4, 0.45);
        [660, 990].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
          const g = ctx.createGain(); const s = t + 0.24 + i * 0.09;
          g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.12, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.35);
          o.connect(g).connect(master); o.start(s); o.stop(s + 0.4);
        });
      },
      // Confirmation blip when sound is switched on
      blip() {
        if (!ac()) return;
        const t = ctx.currentTime + 0.005, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(880, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
      }
    };
  })();

  const soundBtn = document.getElementById('lab-sound');
  const paintSound = () => {
    soundBtn.setAttribute('aria-checked', String(Sound.on));
  };
  soundBtn.addEventListener('click', () => { Sound.set(!Sound.on); paintSound(); if (Sound.on) Sound.blip(); });
  paintSound();

  const angleFor = (n, i) => { const span = n === 4 ? 240 : 180; return -span / 2 + (span / (n - 1)) * i; };
  const chevron = (d) => '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const dialsEl = document.getElementById('dials');
  const refs = {};

  DIALS.forEach((d) => {
    const n = d.labels.length;
    const unit = document.createElement('div');
    unit.className = 'dial-unit';
    unit.style.setProperty('--c', d.color);
    const ticks = d.labels.map((_, i) => '<span class="tick" style="transform: rotate(' + angleFor(n, i) + 'deg) translateY(-85px)"></span>').join('');
    unit.innerHTML =
      '<div class="dial-size"><button type="button" class="dial">' + ticks +
        '<span class="face pulse" aria-hidden="true"></span><span class="knurl" aria-hidden="true"></span>' +
        '<span class="cap" aria-hidden="true"></span><span class="pointer" aria-hidden="true"><span class="needle"></span></span>' +
      '</button></div>' +
      '<span class="dial-title"><span class="dial-name" id="dn-' + d.key + '">' + d.name + '</span>' +
        '<button type="button" class="dial-help" aria-label="What is ' + d.name + '?" aria-describedby="tip-' + d.key + '">?</button>' +
        '<span class="dial-tip" role="tooltip" id="tip-' + d.key + '">' + d.tip + '</span></span>' +
      '<div class="dial-ctrl" role="group" aria-labelledby="dn-' + d.key + '">' +
        '<button type="button" class="dial-arrow" data-step="-1" aria-label="Previous ' + d.name + ' option">' + chevron('M7.5 2 L3.5 6 L7.5 10') + '</button>' +
        '<span class="dial-value"></span>' +
        '<button type="button" class="dial-arrow" data-step="1" aria-label="Next ' + d.name + ' option">' + chevron('M4.5 2 L8.5 6 L4.5 10') + '</button>' +
      '</div>';
    dialsEl.appendChild(unit);

    const dial = unit.querySelector('.dial');
    const step = (s) => {
      state[d.key] = (state[d.key] + s + n) % n; render(); Sound.turn(state[d.key], n);
      trackOnce('dials-used', 'dial_board_used');
      track('dial_turn', { dial: d.name, setting: d.labels[state[d.key]] });
    };
    dial.addEventListener('click', () => step(1));
    dial.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
    });
    unit.querySelectorAll('.dial-arrow').forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));

    refs[d.key] = {
      dial: dial,
      ticks: Array.from(unit.querySelectorAll('.tick')),
      knurl: unit.querySelector('.knurl'),
      pointer: unit.querySelector('.pointer'),
      value: unit.querySelector('.dial-value'),
      unit: unit
    };
  });

  /* "?" tooltips next to each dial name: hover or focus on desktop, tap on touch screens.
     Each tooltip is nudged sideways if it would run off the screen. */
  function placeTip(help) {
    const tip = help.nextElementSibling;
    tip.style.transition = 'none'; // measure without the fade/slide animation in the way
    tip.style.setProperty('--shift', '0px');
    const r = tip.getBoundingClientRect(), pad = 12;
    let shift = 0;
    if (r.left < pad) shift = pad - r.left;
    else if (r.right > window.innerWidth - pad) shift = window.innerWidth - pad - r.right;
    tip.style.setProperty('--shift', Math.round(shift) + 'px');
    void tip.offsetWidth;
    tip.style.transition = '';
  }
  function closeTips(except) {
    document.querySelectorAll('.dial-title.tip-open').forEach((t) => { if (t !== except) t.classList.remove('tip-open'); });
  }
  dialsEl.querySelectorAll('.dial-help').forEach((help) => {
    const title = help.parentElement;
    ['mouseenter', 'focus'].forEach((ev) => help.addEventListener(ev, () => placeTip(help)));
    help.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !title.classList.contains('tip-open');
      closeTips(title);
      title.classList.toggle('tip-open', open);
      if (open) placeTip(help);
    });
    help.addEventListener('keydown', (e) => { if (e.key === 'Escape') { title.classList.remove('tip-open'); help.blur(); } });
  });
  document.addEventListener('click', () => closeTips(null));
  const placeAllTips = () => dialsEl.querySelectorAll('.dial-help').forEach(placeTip);
  placeAllTips();
  let tipTimer = null;
  window.addEventListener('resize', () => { clearTimeout(tipTimer); tipTimer = setTimeout(placeAllTips, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAllTips);

  const out = (k) => document.querySelector('[data-out="' + k + '"]');
  const li = (text, color) => { const el = document.createElement('li'); el.textContent = text; if (color) el.style.setProperty('--c', color); return el; };

  function render() {
    DIALS.forEach((d) => {
      const r = refs[d.key], i = state[d.key], n = d.labels.length, a = angleFor(n, i);
      r.knurl.style.transform = 'rotate(' + a + 'deg)';
      r.pointer.style.transform = 'rotate(' + a + 'deg)';
      r.ticks.forEach((t, j) => t.classList.toggle('on', j === i));
      r.value.textContent = d.labels[i];
      r.value.title = d.labels[i];
      r.dial.setAttribute('aria-label', d.name + ': ' + d.labels[i] + '. Click to turn.');
    });
    const p = PROBLEMS[state.problem], t = TEAMS[state.team], f = FORMATS[state.format];
    out('problem').textContent = p.label;
    out('team').textContent = t.short;
    out('format').textContent = f.short;
    out('desc').textContent = p.desc;
    out('includes').replaceChildren(
      li(f.inc, C.gold),
      li(COMP_FX[state.comp], C.green),
      li(TIME_FX[state.tp], C.sky),
      li(SIZE_FX[state.size], C.tan),
      li('A debrief that shows the consequences of each team’s decisions', C.coral),
      li('An Insights Report with manager coaching actions', C.blue)
    );
    out('measures').replaceChildren(...p.measures.map((m) => li(m)));
    if (typeof syncFormLab === 'function') syncFormLab();
  }
  document.getElementById('lab-reset').addEventListener('click', () => { Object.assign(state, DEFAULTS); render(); Sound.reset(); });
  render();

  /* Power-on: the first time the dial board scrolls into view, the dials start unlit,
     then light up one by one with a small settling turn into their setting. */
  const board = document.querySelector('.dialboard');
  if (board && !reduceMotion && 'IntersectionObserver' in window) {
    const OFF = '#3A4250';
    const NUDGE = 28; // degrees each knob turns as it settles
    let booted = false;
    board.classList.add('booting');
    DIALS.forEach((d) => {
      const r = refs[d.key], a = angleFor(d.labels.length, state[d.key]);
      r.unit.style.setProperty('--c', OFF);
      r.knurl.style.transform = r.pointer.style.transform = 'rotate(' + (a - NUDGE) + 'deg)';
      r.ticks.forEach((t) => t.classList.remove('on'));
    });
    const finish = () => {
      board.classList.remove('booting');
      DIALS.forEach((d) => refs[d.key].unit.style.setProperty('--c', d.color));
      render();
    };
    // Any click on the board during the sequence skips straight to the finished state
    board.addEventListener('pointerdown', () => { if (!booted) { booted = true; finish(); } }, { capture: true, once: true });
    const bootIO = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || booted) return;
      bootIO.disconnect();
      void board.offsetWidth; // apply the unlit start state before transitions switch back on
      board.classList.remove('booting');
      DIALS.forEach((d, i) => {
        const r = refs[d.key];
        setTimeout(() => {
          if (booted) return;
          const a = angleFor(d.labels.length, state[d.key]);
          r.unit.style.setProperty('--c', d.color);
          r.knurl.style.transform = r.pointer.style.transform = 'rotate(' + a + 'deg)';
          r.ticks.forEach((t, k) => t.classList.toggle('on', k === state[d.key]));
          if (i === DIALS.length - 1) booted = true;
        }, 150 + i * 110);
      });
    }, { threshold: 0.35 });
    bootIO.observe(board);
  }

  // "Request this lab" carries the chosen setup into the contact form
  // and shows it as a "Your lab" summary at the top of the form. It stays in sync if they turn the dials again.
  const formLab = document.getElementById('form-lab');
  const formLabChips = document.getElementById('form-lab-chips');
  const formLabMore = document.getElementById('form-lab-more');
  const labField = document.getElementById('f-lab');
  var labAttached = false; // var (not let): render() runs before this line on page load
  function syncFormLab() {
    if (!labAttached) return;
    const chips = [[PROBLEMS[state.problem].label, C.coral], [TEAMS[state.team].label, C.teal], [FORMATS[state.format].label, C.gold]];
    formLabChips.replaceChildren(...chips.map(([text, color]) => li(text, color)));
    formLabMore.textContent = 'Competition: ' + LEVELS[state.comp] + ' · Time pressure: ' + LEVELS[state.tp] + ' · ' + SIZE_LABELS[state.size];
    labField.value = chips.map((x) => x[0]).join(' · ') + ' · ' + formLabMore.textContent;
  }
  function detachFormLab() { labAttached = false; formLab.hidden = true; labField.value = ''; }
  document.getElementById('request-lab').addEventListener('click', () => {
    track('request_lab_click', { problem: PROBLEMS[state.problem].label, people: TEAMS[state.team].label, setting: FORMATS[state.format].label });
    labAttached = true; syncFormLab(); formLab.hidden = false;
  });
  document.getElementById('form-lab-remove').addEventListener('click', () => { detachFormLab(); document.getElementById('f-name').focus(); });

  /* ---------- How it works: six-phase stepper ---------- */
  const PHASES = [
    { when: 'Before', color: 'var(--gold)',
      body: 'Mission briefing, avatar video intro, character dossiers and reflective pre-work. Everyone knows the scenario and their role before the day starts.',
      listLabel: 'What teams use', list: ['Mission briefing', 'Avatar video intro', 'Character dossiers', 'Reflective pre-work'] },
    { when: 'Live day', color: 'var(--coral)',
      body: 'Branching scenarios, role-plays and room-to-room discovery under time pressure. Decisions at each checkpoint change what happens next.',
      listLabel: 'What teams use', list: ['Branching scenarios', 'Role-plays', 'Room-to-room discovery', 'Decision checkpoints'] },
    { when: 'Live day', color: 'var(--teal)',
      body: 'Better questions earn QR-unlocked insights. Each team decides what to share with the others and what to keep.',
      listLabel: 'What teams use', list: ['QR-unlocked insights', 'Game cards', 'Activity workmat', 'Team intel decisions'] },
    { when: 'Live day', color: 'var(--blue)',
      body: 'Teams are scored against a clear rubric, with standings on a live leaderboard. Each team closes with a final recommendation.',
      listLabel: 'What teams use', list: ['Scoring rubric', 'Live leaderboard', 'Final recommendation'] },
    { when: 'After', color: 'var(--green)',
      body: 'Consequences are revealed, teams see what good looks like, and managers leave with coaching prompts.',
      listLabel: 'What teams get', list: ['Consequence reveal', 'What good looks like', 'Manager coaching prompts', 'Insights Report'] },
    { when: 'Months 1–6', color: 'var(--tan)',
      body: 'Monthly micro-challenges, branching refreshers and field success stories keep the behaviors in use for six months.',
      listLabel: 'What teams get', list: ['Monthly micro-challenges', 'Branching refreshers', 'Field success stories'] }
  ];
  const phaseTabs = Array.from(document.querySelectorAll('.phase-step'));
  const phasePanel = document.getElementById('phase-panel');
  const phaseFill = document.querySelector('.phase-fill');
  const phaseTrack = document.querySelector('.phase-track');
  const ph = (k) => phasePanel.querySelector('[data-ph="' + k + '"]');
  let phaseIdx = 0, swapTimer = null;

  function fillPhase(i) {
    const n = phaseTabs.length;
    phaseFill.style.width = (i / (n - 1) * 100) + '%';
    phaseTrack.style.setProperty('--fill', PHASES[i].color);
    phaseTabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('done', k < i);
    });
  }
  function writePhase(i) {
    const d = PHASES[i];
    phasePanel.style.setProperty('--c', d.color);
    phasePanel.setAttribute('aria-labelledby', 'phase-tab-' + (i + 1));
    ph('num').textContent = String(i + 1);
    ph('when').textContent = d.when;
    ph('head').textContent = phaseTabs[i].querySelector('.phase-name').textContent;
    ph('body').textContent = d.body;
    ph('listLabel').textContent = d.listLabel;
    ph('list').replaceChildren(...d.list.map((x) => li(x)));
  }
  function showPhase(i, focus) {
    if (i === phaseIdx) return;
    phaseIdx = i;
    fillPhase(i);
    if (focus) phaseTabs[i].focus();
    clearTimeout(swapTimer);
    if (reduceMotion) { writePhase(i); return; }
    phasePanel.classList.add('swap');
    swapTimer = setTimeout(() => { writePhase(i); phasePanel.classList.remove('swap'); }, 180);
  }
  phaseTabs.forEach((t, i) => {
    t.addEventListener('click', () => { const h = document.getElementById('phase-hint'); if (h) h.classList.add('is-done'); if (i !== phaseIdx) track('phase_view', { phase: t.querySelector('.phase-name').textContent }); showPhase(i, false); });
    t.addEventListener('keydown', (e) => {
      const n = phaseTabs.length;
      if (e.key === 'ArrowRight') { e.preventDefault(); showPhase((phaseIdx + 1) % n, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showPhase((phaseIdx + n - 1) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); showPhase(0, true); }
      if (e.key === 'End') { e.preventDefault(); showPhase(n - 1, true); }
    });
  });
  fillPhase(0);

  /* ---------- Video player ---------- */
  const modal = document.getElementById('vmodal');
  const stage = document.getElementById('vmodal-stage');
  const mTitle = document.getElementById('vmodal-title');
  const mLink = document.getElementById('vmodal-link');
  let lastTrigger = null;

  function openVideo(key, trigger) {
    const v = VIDEOS[key];
    if (!v) return;
    track('video_play', { video: v.title });
    lastTrigger = trigger;
    mTitle.textContent = v.title;
    stage.replaceChildren();
    if (v.link) { mLink.href = v.link; mLink.textContent = (v.linkLabel || 'Open in new tab') + ' ↗'; mLink.hidden = false; }
    else mLink.hidden = true;
    if (v.embed) {
      const f = document.createElement('iframe');
      f.src = v.embed; f.title = v.title; f.allow = 'fullscreen; autoplay'; f.allowFullscreen = true;
      f.setAttribute('loading', 'eager');
      stage.appendChild(f);
    } else if (v.src) {
      const video = document.createElement('video');
      video.src = v.src; video.poster = v.poster || ''; video.controls = true; video.playsInline = true; video.autoplay = true;
      stage.appendChild(video);
    } else {
      const empty = document.createElement('div');
      empty.className = 'vmodal-empty';
      empty.innerHTML = (v.poster ? '<img src="' + v.poster + '" alt="">' : '') + '<strong>Video coming soon</strong><span>This video will be available here shortly.</span>';
      stage.appendChild(empty);
    }
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }
  function closeVideo() {
    const vid = stage.querySelector('video'); if (vid) vid.pause();
    stage.replaceChildren();
    if (modal.open) modal.close();
    if (lastTrigger) lastTrigger.focus();
  }
  document.querySelectorAll('[data-video]').forEach((el) => el.addEventListener('click', () => openVideo(el.dataset.video, el)));
  document.getElementById('vmodal-close').addEventListener('click', closeVideo);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeVideo(); });
  modal.addEventListener('close', () => { const vid = stage.querySelector('video'); if (vid) vid.pause(); });

  // Touch screens have no hover: tap a montage photo to show it in full color
  document.querySelectorAll('.mtile').forEach((f) => f.addEventListener('click', (e) => {
    if (e.target.closest('.mtile-info')) return;
    f.classList.toggle('is-revealed');
  }));

  /* ---------- "In the room" material details ---------- */
  // Optional: add a video to any material by its caption, e.g. 'Scenario video': 'videos/scenario.mp4'
  const MATERIAL_VIDEOS = { 'Scenario video': '', 'Instructions video': '' };
  const mTiles = Array.from(document.querySelectorAll('.mtile'));
  const mdlg = document.getElementById('mdialog');
  const mImg = document.getElementById('mdialog-img');
  const mTitleEl = document.getElementById('mdialog-title');
  const mDesc = document.getElementById('mdialog-desc');
  const mCount = document.getElementById('mdialog-count');
  const mVideo = document.getElementById('mdialog-video');
  let mIdx = 0, mOpener = null, mSwap = null;

  function fillMaterial(i) {
    const fig = mTiles[i], img = fig.querySelector('img'), cap = fig.querySelector('figcaption').textContent;
    mImg.src = img.getAttribute('src'); mImg.alt = img.alt;
    mTitleEl.textContent = cap;
    mDesc.textContent = fig.querySelector('.mtile-desc').textContent;
    mCount.textContent = (i + 1) + ' of ' + mTiles.length;
    const v = MATERIAL_VIDEOS[cap];
    mVideo.replaceChildren();
    if (v) { const el = document.createElement('video'); el.src = v; el.controls = true; el.playsInline = true; el.poster = img.getAttribute('src'); mVideo.appendChild(el); mVideo.hidden = false; }
    else mVideo.hidden = true;
  }
  function showMaterial(i) {
    mIdx = (i + mTiles.length) % mTiles.length;
    clearTimeout(mSwap);
    if (!mdlg.open || reduceMotion) { fillMaterial(mIdx); return; }
    mdlg.classList.add('swap');
    mSwap = setTimeout(() => { fillMaterial(mIdx); mdlg.classList.remove('swap'); }, 160);
  }
  mTiles.forEach((fig, i) => fig.querySelector('.mtile-info').addEventListener('click', (e) => {
    track('material_open', { material: fig.querySelector('figcaption').textContent });
    e.stopPropagation();
    mOpener = e.currentTarget;
    showMaterial(i);
    if (typeof mdlg.showModal === 'function') mdlg.showModal(); else mdlg.setAttribute('open', '');
  }));
  const closeMaterial = () => { const v = mVideo.querySelector('video'); if (v) v.pause(); if (mdlg.open) mdlg.close(); };
  document.getElementById('mdialog-close').addEventListener('click', closeMaterial);
  document.getElementById('mdialog-prev').addEventListener('click', () => showMaterial(mIdx - 1));
  document.getElementById('mdialog-next').addEventListener('click', () => showMaterial(mIdx + 1));
  mdlg.addEventListener('click', (e) => { if (e.target === mdlg) closeMaterial(); });
  mdlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') showMaterial(mIdx + 1);
    if (e.key === 'ArrowLeft') showMaterial(mIdx - 1);
  });
  mdlg.addEventListener('close', () => { const v = mVideo.querySelector('video'); if (v) v.pause(); if (mOpener) mOpener.focus(); });

  /* ---------- "Why" cards: slide in left to right when scrolled into view ---------- */
  const whyGrid = document.getElementById('why-grid');
  if (whyGrid && !reduceMotion && 'IntersectionObserver' in window) {
    whyGrid.querySelectorAll('.why').forEach((card, i) => card.style.setProperty('--i', i));
    whyGrid.classList.add('anim-ready');
    const whyIO = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        requestAnimationFrame(() => whyGrid.classList.add('in'));
        whyIO.disconnect();
      }
    }, { threshold: 0.25 });
    whyIO.observe(whyGrid);
  }

  /* ---------- Leaderboard replay ---------- */
  const TEAMS_LB = [
    ['Northlight', [65, 70, 65]], ['Ironwood', [70, 55, 70]], ['Halyard', [55, 65, 70]], ['Beacon', [60, 70, 60]],
    ['Quarry', [65, 55, 65]], ['Meridian', [55, 65, 65]], ['Cascade', [60, 65, 55]], ['Foundry', [65, 50, 65]]
  ];
  const lbBody = document.getElementById('lb-body');
  const replayBtn = document.getElementById('lb-replay');
  let replayTimer = null;

  function drawBoard(rounds, bump) {
    const rows = TEAMS_LB.map(([name, s], order) => {
      const shown = s.map((v, i) => (i < rounds ? v : null));
      const total = shown.reduce((a, v) => a + (v || 0), 0);
      return { name, shown, total, order };
    }).sort((a, b) => b.total - a.total || a.order - b.order);
    lbBody.replaceChildren(...rows.map((r, i) => {
      const tr = document.createElement('tr');
      if (i === 0 && rounds > 0) tr.className = 'first'; else if (i < 3 && rounds > 0) tr.className = 'podium';
      if (bump) tr.classList.add('bump');
      tr.innerHTML = '<td>' + (i + 1) + '</td><td class="team">' + r.name + '</td>' +
        r.shown.map((v) => '<td class="r">' + (v == null ? '–' : v) + '</td>').join('') + '<td>' + r.total + '</td>';
      return tr;
    }));
  }
  replayBtn.addEventListener('click', () => {
    clearTimeout(replayTimer);
    if (reduceMotion) { drawBoard(3, false); return; }
    let r = 0;
    replayBtn.disabled = true;
    const tick = () => {
      drawBoard(r, r > 0);
      if (r < 3) { r += 1; replayTimer = setTimeout(tick, 1100); } else { replayBtn.disabled = false; }
    };
    tick();
  });

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const showStatus = (msg, kind) => { status.textContent = msg; status.className = 'form-status' + (kind ? ' ' + kind : ''); status.hidden = false; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    let firstBad = null;
    [name, email].forEach((f) => {
      const ok = f.value.trim() !== '' && f.checkValidity();
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      showStatus(firstBad === name ? 'Add your name so we know who to reply to.' : 'Add a work email we can reply to, like name@company.com.', 'err');
      firstBad.focus();
      return;
    }
    if (!FORM_ENDPOINT) {
      showStatus('This form isn’t connected yet. For now, please email ' + CONTACT_EMAIL + '.', '');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!res.ok) throw new Error(res.status);
      track('generate_lead', { form: 'contact', lab_attached: Boolean(labField.value) });
      form.reset();
      detachFormLab();
      showStatus('Thanks. We got your request and will be in touch soon.', 'ok');
    } catch (err) {
      showStatus('We couldn’t send that. Check your connection and try again, or email ' + CONTACT_EMAIL + '.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
  form.querySelectorAll('input').forEach((f) => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));
})();
