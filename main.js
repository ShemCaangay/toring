/* TORING website: scroll-driven story in the app's own theme. Raw WebGL point sprites (graphite ink on light glass), DOM text reveals, real GitHub release for the download. */
'use strict';
(() => {
  const N = 8;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const root = document.documentElement;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = mqReduce.matches; root.classList.toggle('rm', reduce);
  mqReduce.addEventListener('change', e => { reduce = e.matches; root.classList.toggle('rm', reduce); wake(); });

  /* ------------------------------------------------------------------ release / download */
  const REPO = 'ShemCaangay/toring-updates';
  let release = null;
  const stat = $('#stat');
  async function loadRelease() {
    try { const c = JSON.parse(sessionStorage.getItem('toring-release-v2') || 'null'); if (c && Date.now() - c.t < 300e3) return c.d; } catch { /* storage blocked */ }   // 5 min: a new release shows up quickly; the new key drops any older cached entry
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('GitHub answered HTTP ' + r.status);
    const j = await r.json(), a = (j.assets || []).find(x => /\.exe$/i.test(x.name) && !/blockmap/i.test(x.name));
    if (!a) throw new Error('no installer in the latest release');
    const d = { tag: j.tag_name, name: a.name, url: a.browser_download_url, size: a.size, date: j.published_at, page: j.html_url };
    try { sessionStorage.setItem('toring-release-v2', JSON.stringify({ t: Date.now(), d })); } catch { /* ignore */ }
    return d;
  }
  const mb = b => (b / 1048576).toFixed(1) + ' MB';
  function applyRelease(d) {
    release = d;
    $$('[data-ver]').forEach(e => { e.textContent = d.tag; });
    $$('[data-ver-inline]').forEach(e => { e.textContent = '· ' + d.tag; });
    $$('[data-size]').forEach(e => { e.textContent = mb(d.size); });
    $$('[data-dl]').forEach(a => {
      a.href = d.url; a.removeAttribute('target');
      const label = `Download TORING ${d.tag} for Windows (${mb(d.size)})`;
      if (!a.closest('.foot')) a.setAttribute('aria-label', label); else a.title = label;
    });
    root.dataset.release = d.tag;
    stat.dataset.s = 'ok'; stat.title = `Latest release ${d.tag} is online (${mb(d.size)})`;      // the same status dot as the widget: green + pulse = reached
  }
  loadRelease().then(applyRelease).catch(err => {
    $$('[data-size]').forEach(e => { e.textContent = 'see release'; });
    $$('[data-ver]').forEach(e => { e.textContent = 'latest'; });
    stat.dataset.s = 'stale'; stat.title = 'Could not reach GitHub; the buttons open the releases page';
    console.warn('[toring] release lookup failed, links point to the releases page:', err.message);
  });
  const toast = $('#toast'); let toastT;
  function say(msg, ms = 9000) { toast.textContent = msg; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, ms); }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-dl]'); if (!a || !release) return;
    say(`Downloading ${release.name} (${mb(release.size)}). Run it when it finishes. The installer is not code-signed yet, so Windows SmartScreen may ask you to confirm (More info → Run anyway).`);
  });

  /* ------------------------------------------------------------------ text: split into letters / words for the reveal */
  $$('.rv').forEach(el => {
    if (el.dataset.rv === 'letters') {
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      $$('.ln', el).forEach((ln, li) => {
        const t = ln.textContent; ln.textContent = ''; ln.setAttribute('aria-hidden', 'true'); let i = 0;
        t.split(' ').forEach((w, wi, arr) => {
          const ws = document.createElement('span'); ws.className = 'w';
          [...w].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--d', 120 + li * 230 + i * 15); i++; ws.appendChild(s); });
          ln.appendChild(ws); if (wi < arr.length - 1) { ln.appendChild(document.createTextNode(' ')); i++; }
        });
      });
    } else {
      const words = el.textContent.trim().split(/\s+/); el.textContent = '';
      words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; s.style.setProperty('--d', 380 + i * 16); el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); });
    }
  });
  // number columns (decorative)
  const VALUES = ['12.4%', '3.8 GB', '166.7M', '$44.20', '57.2 KB/s', '45%', '61%', '2%', '5.32M', '1.9M', '$0.09', '38%', '11%', '15%', '4.1 GB', '930 MB', '$12.07', '88.4M', '0.6%', '27%', '64 °C', '2.10M'];
  $$('.nc').forEach((c, k) => {
    const rot = VALUES.slice(k * 5).concat(VALUES.slice(0, k * 5)), ul = document.createElement('ul');
    ul.innerHTML = rot.concat(rot).map(v => `<li>${v}</li>`).join(''); c.appendChild(ul);
  });

  /* ------------------------------------------------------------------ scenes, scroll mapping, navigation */
  const story = $('#story'), stage = $('#stage'), scenes = $$('.scene'), navLinks = $$('.links a, .menu nav a[data-scene]');
  let vh = innerHeight, W = innerWidth, maxScroll = 1, tgt = 0, active = -1;
  function measure() { vh = stage.clientHeight; W = stage.clientWidth; maxScroll = Math.max(1, story.offsetHeight - vh); }
  const readScroll = () => { tgt = clamp(scrollY / maxScroll) * (N - 1); };
  const sceneY = i => Math.round(i / (N - 1) * maxScroll);
  function setActive(i) {
    if (i === active) return; active = i;
    scenes.forEach((sc, k) => { const on = k === i; sc.classList.toggle('on', on); sc.inert = !on; });
    navLinks.forEach(a => { if (+a.dataset.scene === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    $('#cue').classList.toggle('gone', i > 0);
  }
  let anim = 0;
  function goScene(i) {
    const y = sceneY(i);
    if (reduce) { scrollTo(0, y); return; }
    cancelAnimationFrame(anim);
    const y0 = scrollY, d = y - y0, dur = clamp(Math.abs(d) / vh * 320 + 700, 900, 2400), t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, y0 + d * e); anim = k < 1 ? requestAnimationFrame(step) : 0; };
    anim = requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => { if (anim) { cancelAnimationFrame(anim); anim = 0; } }, { passive: true }));
  const burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open; document.body.style.overflow = open ? 'hidden' : '';
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  menu.addEventListener('keydown', e => {                       // keep Tab inside the open menu
    if (e.key !== 'Tab') return; const f = $$('a, button', menu).concat([burger]).filter(x => x.offsetParent !== null || x === burger); const first = f[0];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); burger.focus(); } else if (!e.shiftKey && document.activeElement === burger) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-scene]'); if (!a) return;
    e.preventDefault(); const i = +a.dataset.scene;
    if (!menu.hidden) setMenu(false);
    goScene(i); try { history.replaceState(null, '', a.getAttribute('href')); } catch { /* file:// etc. */ }
  });
  const hashScene = () => { const a = $(`a[data-scene][href="${location.hash}"]`); if (a && location.hash.length > 1) scrollTo(0, sceneY(+a.dataset.scene)); };

  /* ------------------------------------------------------------------ particle shapes (every shape means something in the product) */
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || matchMedia('(max-width: 760px)').matches;
  const C = lowPower ? 9000 : 16000;
  const rngOf = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2831853 * r());
  function builder(seed) {
    const r = rngOf(seed), a = new Float32Array(C * 4); let k = 0;
    const put = (x, y, z, w) => { if (k >= C) return; a[k * 4] = x; a[k * 4 + 1] = y; a[k * 4 + 2] = z; a[k * 4 + 3] = w; k++; };
    // faint dust everywhere so a scene is never empty
    const dust = (n, wMin = .1, wMax = .24) => { for (let i = 0; i < n && k < C; i++) { const u = r() * 2 - 1, th = r() * 6.2832, rr = 1.6 + r() * 2.8, s = Math.sqrt(1 - u * u); put(Math.cos(th) * s * rr, u * rr * .7, Math.sin(th) * s * rr, wMin + r() * (wMax - wMin)); } };
    return { r, put, dust, fill: () => { dust(C - k); return a; } };
  }
  const frac = f => Math.floor(C * f);
  const shuffled = (a, seed) => { const r = rngOf(seed); for (let i = C - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; for (let q = 0; q < 4; q++) { const t = a[i * 4 + q]; a[i * 4 + q] = a[j * 4 + q]; a[j * 4 + q] = t; } } return a; };
  const K = Math.floor(C * .5);                                  // particles 0..K-1 are the screenshot slot: in the Limits slide (5) they gather into a stipple of the app image
  const SHAPES = [
    function dandelion() {                                    // 0 · hero: a seed head, the TORING "watching" mark
      const b = builder(11), { r, put } = b, SP = 240, sp = [];
      for (let i = 0; i < SP; i++) { const y = 1 - 2 * (i + .5) / SP, rr = Math.sqrt(1 - y * y), th = i * 2.399963; sp.push([Math.cos(th) * rr, y, Math.sin(th) * rr]); }
      for (let i = 0; i < frac(.05); i++) put(gauss(r) * .07, gauss(r) * .07, gauss(r) * .07, 1.5);
      for (let i = 0; i < frac(.62); i++) { const d = sp[(r() * SP) | 0], t = .1 + .9 * Math.pow(r(), .55), j = .006; put(d[0] * t + gauss(r) * j, d[1] * t + gauss(r) * j, d[2] * t + gauss(r) * j, .3 + .6 * t * t); }
      for (let i = 0; i < frac(.14); i++) { const d = sp[(r() * SP) | 0], u = r() * 2 - 1, th = r() * 6.28, s = Math.sqrt(1 - u * u), q = .045 * r(); put(d[0] + Math.cos(th) * s * q, d[1] + u * q, d[2] + Math.sin(th) * s * q, .95); }
      return b.fill();
    },
    function orbits() {                                        // 1 · tokens orbiting a core: usage counted
      const b = builder(23), { r, put } = b;
      for (let i = 0; i < frac(.14); i++) put(gauss(r) * .08, gauss(r) * .08, gauss(r) * .08, 1.5);
      for (let i = 0; i < frac(.06); i++) put(gauss(r) * .28, gauss(r) * .28, gauss(r) * .28, .4);
      for (let ring = 0; ring < 3; ring++) for (let i = 0; i < frac(.2); i++) {
        const ang = r() * 6.2832, x = 1.2 * Math.cos(ang) + gauss(r) * .01, y = .46 * Math.sin(ang) + gauss(r) * .01, z = gauss(r) * .01;
        const tx = 1.05, zr = ring * 1.0472, y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx);
        put(x * Math.cos(zr) - y1 * Math.sin(zr), x * Math.sin(zr) + y1 * Math.cos(zr), z1, .35 + .75 * Math.pow(.5 + .5 * Math.sin(ang * 3 + ring), 2));
      }
      return b.fill();
    },
    function box() {                                           // 2 · a box with dust inside, nothing outside: it stays on this PC
      const b = builder(37), { r, put } = b, h = .78, E = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) E.push([[-h, sx * h, sy * h], [h, sx * h, sy * h]], [[sx * h, -h, sy * h], [sx * h, h, sy * h]], [[sx * h, sy * h, -h], [sx * h, sy * h, h]]);
      for (let i = 0; i < frac(.34); i++) { const e = E[(r() * 12) | 0], t = r(); put(e[0][0] + (e[1][0] - e[0][0]) * t + gauss(r) * .004, e[0][1] + (e[1][1] - e[0][1]) * t + gauss(r) * .004, e[0][2] + (e[1][2] - e[0][2]) * t + gauss(r) * .004, .8 + r() * .2); }
      for (let i = 0; i < frac(.5); i++) put((r() * 2 - 1) * h * .94, (r() * 2 - 1) * h * .94, (r() * 2 - 1) * h * .94, r() < .09 ? .95 : .26);
      return b.fill();
    },
    function candles() {                                       // 3 · 30-second CPU candles: hollow = up, solid = down (the widget's chart)
      const b = builder(41), { r, put } = b, n = 26, cs = []; let price = 0;
      for (let i = 0; i < n; i++) { const o = price; price += gauss(r) * .13 + (i % 9 === 4 ? .18 : 0); cs.push({ o, c: price, hi: Math.max(o, price) + r() * .1, lo: Math.min(o, price) - r() * .1 }); }
      const mn = Math.min(...cs.map(c => c.lo)), mx = Math.max(...cs.map(c => c.hi)), sc = 1.5 / (mx - mn), y = v => (v - mn) * sc - .75;
      const per = frac(.8) / n | 0;
      cs.forEach((c, i) => {
        const x = (i - (n - 1) / 2) * .118, yo = y(c.o), yc = y(c.c), top = Math.max(yo, yc), bot = Math.min(yo, yc), solid = c.c < c.o, bw = .035;
        for (let j = 0; j < per * .26; j++) put(x + gauss(r) * .002, y(c.lo) + r() * (y(c.hi) - y(c.lo)), gauss(r) * .004, .75);                   // wick
        for (let j = 0; j < per * .74; j++) {
          if (solid) put(x + (r() * 2 - 1) * bw, bot + r() * Math.max(.03, top - bot), (r() * 2 - 1) * .02, .95);
          else { const e = r(), hh = Math.max(.03, top - bot); if (e < .5) put(x + (r() < .5 ? -bw : bw), bot + r() * hh, 0, .9); else put(x + (r() * 2 - 1) * bw, r() < .5 ? bot : bot + hh, 0, .9); }
        }
      });
      for (let i = 0; i < frac(.04); i++) put((r() * 2 - 1) * 1.6, -.86, 0, .5);
      return b.fill();
    },
    function bell() {                                          // 4 · a wireframe bell: one bell for loud moments
      const b = builder(53), { r, put } = b, L = 56, M = 30, prof = t => .13 + .92 * Math.pow(1 - t, .62) * (1 - .1 * t) + (t < .06 ? .1 * (1 - t / .06) : 0), Y = t => -.9 + t * 1.8;
      for (let i = 0; i < frac(.34); i++) { const a = ((r() * L) | 0) / L * 6.2832, t = r(), rr = prof(t); put(Math.cos(a) * rr, Y(t), Math.sin(a) * rr, .55 + .3 * (1 - t)); }
      for (let i = 0; i < frac(.34); i++) { const t = ((r() * M) | 0) / (M - 1), a = r() * 6.2832, rr = prof(t); put(Math.cos(a) * rr, Y(t), Math.sin(a) * rr, .6 + .35 * (1 - t)); }
      for (let i = 0; i < frac(.07); i++) put(gauss(r) * .09, -1.0 + gauss(r) * .09, gauss(r) * .09, 1.3);
      for (let i = 0; i < frac(.04); i++) { const a = r() * 6.2832; put(Math.cos(a) * .11, 1.0 + Math.sin(a) * .11, 0, .9); }
      return b.fill();
    },
    function limits() {                                        // 5 · tick-mark rings like the widget's limit bars: dark = used, light = left
      const b = builder(67), { r, put } = b, RINGS = [[1.2, .38], [.92, .15], [.64, .11]], T = 60, tx = .5;
      for (let i = 0; i < frac(.88); i++) {
        const [R, used] = RINGS[i % 3], tk = (r() * T) | 0, u = r(), rr = R + (u - .5) * .13, a = -1.5708 + tk / T * 6.2832 + (r() - .5) * .018;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr; put(x, y * Math.cos(tx), y * Math.sin(tx), tk / T < used ? 1.25 : .5);
      }
      for (let i = 0; i < frac(.04); i++) put(gauss(r) * .05, gauss(r) * .05, gauss(r) * .05, 1.2);
      return b.fill();
    },
    function halo() {                                          // 6 · showcase: a halo of tick marks around the row of app views, like the limit rings
      const b = builder(71), { r, put } = b;
      for (let i = 0; i < frac(.5); i++) { const R = i % 2 ? 1 : .86, tk = (r() * 96) | 0, a = tk / 96 * 6.2832 + (r() - .5) * .02, rr = R + (r() - .5) * .05; put(Math.cos(a) * 2.45 * rr, Math.sin(a) * 1.05 * rr, gauss(r) * .02, .5 + .5 * r()); }
      for (let i = 0; i < frac(.04); i++) put(gauss(r) * .05, gauss(r) * .05, gauss(r) * .05, 1.2);
      return b.fill();
    },
    function ring() {                                          // 6 · the live ring: radial fibres around a pupil (the status dot, enlarged)
      const b = builder(79), { r, put } = b, R = 1.2;
      for (let i = 0; i < frac(.72); i++) { const th = (((r() * 640) | 0) + r() * .22) / 640 * 6.2832, rr = R * (.33 + .67 * Math.pow(r(), .8)), wob = .018 * Math.sin(rr * 22 + th * 5); put(Math.cos(th + wob) * rr, Math.sin(th + wob) * rr, (rr / R - .5) * .12, .4 + .55 * Math.pow(rr / R, 1.6)); }
      for (let i = 0; i < frac(.1); i++) { const th = r() * 6.2832, rr = R * (1 + gauss(r) * .012); put(Math.cos(th) * rr, Math.sin(th) * rr, 0, 1.0); }
      for (let i = 0; i < frac(.05); i++) { const th = r() * 6.2832, rr = R * (.34 + gauss(r) * .01); put(Math.cos(th) * rr, Math.sin(th) * rr, 0, 1.1); }
      return b.fill();
    }
  ];
  // graphite: [colour 1, colour 2, (unused glow)] — the particles are ink on the light glass, like the app's bars and candles
  const GRAY = [.04, .04, .04, .4, .4, .4, 0, 0, 0];
  const PAL = SHAPES.map(() => GRAY);
  const OFF = [[.52, .02], [0, 0], [0, 0], [0, -.02], [0, .06], [0, 0], [0, 0], [-.55, .02]];
  const CAM = [3.2, 3.3, 3.5, 3.3, 3.3, 3.7, 3.4, 3.1];

  /* ------------------------------------------------------------------ WebGL */
  const canvas = $('#gl');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
  let prog, buffers = [], rBuf, U = {}, A = {}, dpr = 1, dprCap = Math.min(devicePixelRatio || 1, 1.75);
  if (!gl) root.classList.add('no-gl');
  else {
    const VS = `attribute vec4 aA; attribute vec4 aB; attribute vec3 aR;
uniform float uMix, uTime, uAspect, uPx, uCamA, uCamB, uImgA, uImgB; uniform vec2 uOffA, uOffB, uRot, uPan; uniform vec3 uPalA[3]; uniform vec3 uPalB[3];
varying vec3 vCol; varying float vA;
void main(){
  float e = uMix * uMix * (3.0 - 2.0 * uMix);
  float keepA = 1.0 - aR.z * uImgA, keepB = 1.0 - aR.z * uImgB, keep = mix(keepA, keepB, e);
  vec3 p = mix(aA.xyz, aB.xyz, e); float w = mix(aA.w, aB.w, e);
  float s = aR.x * 6.2831853, sw = sin(3.14159 * e);
  p += sw * 0.55 * vec3(sin(s * 3.0 + uTime * .6), cos(s * 2.0 + uTime * .5), sin(s * 5.0 - uTime * .4)) * (0.3 + aR.x);
  p += keep * 0.004 * vec3(sin(uTime * .7 + s * 7.0), cos(uTime * .6 + s * 5.0), sin(uTime * .5 + s * 3.0));
  float cy = cos(uRot.y * keep), sy = sin(uRot.y * keep); p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  float cx = cos(uRot.x * keep), sx = sin(uRot.x * keep); p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  p.xy += mix(uOffA * keepA, uOffB * keepB, e) + uPan * keep;
  float z = p.z + mix(uCamA, uCamB, e);
  if (z < 0.3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vCol = vec3(0.0); vA = 0.0; return; }
  gl_Position = vec4(p.x * 2.0 / uAspect, p.y * 2.0, 0.0, z);
  float imgBoost = 1.0 + 0.7 * mix(aR.z * uImgA, aR.z * uImgB, e);
  gl_PointSize = max(1.0, uPx * aR.y * (2.2 / z) * (0.6 + w * 0.45) * imgBoost);
  vec3 c1 = mix(uPalA[0], uPalB[0], e), c2 = mix(uPalA[1], uPalB[1], e);
  vCol = mix(c1, c2, aR.x);
  vA = clamp(w, 0.0, 1.3) * clamp(2.5 / z, 0.35, 1.15) * (0.9 + 0.1 * sin(uTime * 2.0 + s * 11.0));
}`;
    // ink on light: premultiplied "over" blending, so dense areas get darker and everything else stays the glass underneath
    const FS = `precision mediump float; varying vec3 vCol; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard; float a = pow(1.0 - r, 1.4) * vA * 0.9; gl_FragColor = vec4(vCol * a, a); }`;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      ['uMix', 'uTime', 'uAspect', 'uPx', 'uCamA', 'uCamB', 'uOffA', 'uOffB', 'uRot', 'uPan', 'uImgA', 'uImgB'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
      U.palA = gl.getUniformLocation(prog, 'uPalA[0]'); U.palB = gl.getUniformLocation(prog, 'uPalB[0]');
      ['aA', 'aB', 'aR'].forEach(n => { A[n] = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(A[n]); });
      SHAPES.forEach((f, si) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, si === 6 ? shuffled(f(), 906) : f(), gl.DYNAMIC_DRAW); buffers.push(b); });
      const rr = rngOf(5), ra = new Float32Array(C * 3); for (let i = 0; i < C; i++) { ra[i * 3] = rr(); ra[i * 3 + 1] = .6 + rr() * 1.0; ra[i * 3 + 2] = i < K ? 1 : 0; }
      rBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rBuf); gl.bufferData(gl.ARRAY_BUFFER, ra, gl.STATIC_DRAW);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    } catch (err) { console.warn('[toring] WebGL setup failed, using the CSS background:', err.message); root.classList.add('no-gl'); prog = null; }
  }

  /* ------------------------------------------------------------------ the app showcase (scene 6): the only place the app screenshots appear.
     Half of the particles gather into five stipples, one per view, locked to the screen at the cards' exact rectangles; each crisp screenshot
     resolves out of its stipple while the particles are assembled and dissolves back as they leave, with the site's own transition. */
  const SC = 6, L = window.TORING_LAYOUT, shotEls = $$('.shot'), SRC = ['img/compact.webp', 'img/activity.webp', 'img/system-top.webp', 'img/notifications.webp', 'img/limits.webp'];
  let LAY = { mode: '', cards: [] }, stipple = null, stipKey = '', loaded = 0; const imgs = [];
  /* n points over the visible crop of a screenshot: more where there is ink (text, bars), a few on the glass so the card edge reads */
  function sampleImage(img, seed, ar, cropY, n) {
    const nw = img.naturalWidth, nh = img.naturalHeight, nar = nw / nh; let sx = 0, sy = 0, sw = nw, sh = nh;
    if (ar > nar) { sh = nw / ar; sy = (nh - sh) * cropY; } else if (ar < nar) { sw = nh * ar; sx = (nw - sw) * .5; }
    const wpx = 160, hpx = Math.max(8, Math.round(wpx / ar)), cv = document.createElement('canvas'); cv.width = wpx; cv.height = hpx;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, sx, sy, sw, sh, 0, 0, wpx, hpx); const px = g.getImageData(0, 0, wpx, hpx).data;
    const cdf = new Float32Array(wpx * hpx), ink = new Float32Array(wpx * hpx); let sum = 0;
    for (let p = 0; p < wpx * hpx; p++) { const a = px[p * 4 + 3] / 255, lum = (.299 * px[p * 4] + .587 * px[p * 4 + 1] + .114 * px[p * 4 + 2]) / 255, k = a < .5 ? 0 : 1 - lum; ink[p] = k; sum += a < .5 ? 0 : Math.pow(k, 1.5) + .012; cdf[p] = sum; }
    const r = rngOf(seed), u = new Float32Array(n), v = new Float32Array(n), w = new Float32Array(n);
    for (let j = 0; j < n; j++) {
      const t = r() * sum; let lo = 0, hi = cdf.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < t) lo = m + 1; else hi = m; }
      u[j] = ((lo % wpx) + r()) / wpx; v[j] = (Math.floor(lo / wpx) + r()) / hpx; w[j] = .5 + .75 * ink[lo];
    }
    return { u, v, w, n };
  }
  function uploadStipple() {
    if (!prog || loaded < SRC.length || !LAY.cards.length) return;
    const key = LAY.mode + LAY.cards.map(c => c.ar.toFixed(3) + ':' + c.cropY).join();      // re-sample only when the arrangement (row / grid) changes
    if (key !== stipKey) {
      const tot = LAY.cards.reduce((a, c) => a + c.weight, 0); let left = K;
      stipple = LAY.cards.map((c, k) => { const n = k === LAY.cards.length - 1 ? left : Math.floor(K * c.weight / tot); left -= n; return sampleImage(imgs[k], 300 + k, c.ar, c.cropY, n); });
      stipKey = key;
    }
    const asp = asp0(), cam = CAM[SC] * camMul(asp), Wc = canvas.clientWidth, Hc = canvas.clientHeight, out = new Float32Array(K * 4); let o = 0;
    stipple.forEach((s, k) => {
      const r = LAY.cards[k];
      for (let j = 0; j < s.n; j++, o++) { out[o * 4] = (((r.x + s.u[j] * r.w) / Wc) * 2 - 1) * asp * cam / 2; out[o * 4 + 1] = (1 - ((r.y + s.v[j] * r.h) / Hc) * 2) * cam / 2; out[o * 4 + 2] = 0; out[o * 4 + 3] = s.w[j]; }
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[SC]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, out);       // screen-locked: exactly where the crisp screenshots sit
  }
  function layoutAll() {
    LAY = L.slots(canvas.clientWidth, canvas.clientHeight); dbg.lay = LAY.cards;
    LAY.cards.forEach((r, k) => {
      const el = shotEls[k]; if (!el) return;
      el.style.left = r.x.toFixed(1) + 'px'; el.style.top = r.y.toFixed(1) + 'px'; el.style.width = r.w.toFixed(1) + 'px'; el.style.height = r.h.toFixed(1) + 'px';
      el.firstElementChild.style.objectPosition = '50% ' + (r.cropY * 100) + '%';
    });
    uploadStipple();
  }
  function loadStipples() {
    SRC.forEach((src, k) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { try { imgs[k] = im; loaded++; uploadStipple(); wake(); } catch (e) { console.warn('[toring] could not sample screenshot', k, e.message); } };
      im.src = src;
    });
  }
  const shotR = [];
  function updateShots() {
    shotEls.forEach((el, k) => {
      const r = reduce ? (Math.abs(s - SC) < .5 ? 1 : 0) : L.crisp(k, s, SC);
      if (shotR[k] !== undefined && Math.abs(shotR[k] - r) < .003 && (r === 0 || r === 1)) return;
      shotR[k] = r; dbg.shot[k] = +r.toFixed(3);
      if (r < .004) { el.style.visibility = 'hidden'; el.style.opacity = 0; return; }
      el.style.visibility = 'visible'; el.style.opacity = r.toFixed(3);
      el.style.filter = !reduce && r < .995 ? 'blur(' + ((1 - r) * 9).toFixed(1) + 'px)' : 'none';
      el.style.transform = !reduce && r < .995 ? 'scale(' + (.965 + .035 * r).toFixed(4) + ')' : 'none';
    });
  }
  function resize() {
    measure(); dpr = dprCap;
    canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
    if (prog) gl.viewport(0, 0, canvas.width, canvas.height);
    layoutAll();
  }

  /* ------------------------------------------------------------------ per-frame state */
  const pm = { x: 0, y: 0, tx: 0, ty: 0, cx: -999, cy: -999 };
  addEventListener('pointermove', e => { pm.tx = (e.clientX / innerWidth - .5) * 2; pm.ty = (e.clientY / innerHeight - .5) * 2; pm.cx = e.clientX; pm.cy = e.clientY; stage.classList.add('hover'); wake(); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => stage.classList.remove('hover'));
  const numcols = $('#numcols'), pupil = $('#pupil');
  const dbg = window.__toring = { s: 0, active: -1, frames: 0, avgMs: 0, gl: !!prog, dpr: 1, K, shot: [], lay: [], stippled: () => (stipple ? stipple.length : 0) };
  let raf = 0, last = 0, time = 0, s = 0, slow = 0, nSlow = 0, frames = 0;
  const wake = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
  function frame(now) {
    raf = 0;
    const dtRaw = (now - last) / 1000 || .016, dt = Math.min(.05, dtRaw); last = now;
    if (!reduce) time += dt;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6.5);
    s += (tgt - s) * k; if (Math.abs(tgt - s) < .0005) s = tgt;
    pm.x += (pm.tx - pm.x) * (reduce ? 0 : 1 - Math.exp(-dt * 4)); pm.y += (pm.ty - pm.y) * (reduce ? 0 : 1 - Math.exp(-dt * 4));
    // which scene is "on" (its text is shown); a short gap between scenes lets the old text leave first
    const near = Math.round(s); setActive(Math.abs(s - near) <= .36 ? clamp(near, 0, N - 1) : -1);
    numcols.style.opacity = clamp(1 - Math.abs(s - 3) / .55).toFixed(3);
    // the app's cursor highlight and drifting blobs
    if (!reduce) { stage.style.setProperty('--px', (pm.x * 14).toFixed(1)); stage.style.setProperty('--py', (pm.y * 14).toFixed(1)); stage.style.setProperty('--sx', pm.cx.toFixed(0) + 'px'); stage.style.setProperty('--sy', pm.cy.toFixed(0) + 'px'); }
    updateShots();
    // the live dot sits at the centre of the final ring and leans a little towards the pointer
    const po = smooth(6.7, 7, s); pupil.style.opacity = po.toFixed(3);
    if (po > 0.01) {
      const asp = canvas.clientWidth / canvas.clientHeight, fit = camMul(asp), z = CAM[7] * fit, ox = OFF[7][0] * offFactor(asp), oy = OFF[7][1] * offFactor(asp);
      const nx = (ox * 2 / asp) / z, ny = (oy * 2) / z;
      pupil.style.transform = `translate3d(${((nx * .5 + .5) * canvas.clientWidth + (reduce ? 0 : pm.x * 9)).toFixed(1)}px, ${((1 - (ny * .5 + .5)) * canvas.clientHeight + (reduce ? 0 : pm.y * 9)).toFixed(1)}px, 0)`;
    }
    if (prog) draw(asp0());
    frames++; dbg.s = s; dbg.active = active; dbg.frames = frames;
    // adaptive quality: if frames stay slow, render fewer pixels
    if (!reduce && !document.hidden) { slow += dtRaw; nSlow++; if (nSlow >= 90) { const avg = slow / nSlow * 1000; dbg.avgMs = +avg.toFixed(1); if (avg > 24 && dprCap > 1) { dprCap = Math.max(1, dprCap - .25); resize(); } slow = 0; nSlow = 0; } }
    if (!reduce || Math.abs(tgt - s) > .0005) wake();
  }
  const asp0 = () => canvas.clientWidth / canvas.clientHeight;
  const offFactor = asp => clamp((asp - .5) / .7);
  const camMul = asp => (asp > 1.2 ? 1 : Math.min(1.9, 1.2 / asp * .85 + .15));
  const palA = new Float32Array(9), palB = new Float32Array(9);
  function draw(asp) {
    const i0 = clamp(Math.floor(s), 0, N - 2), f = s - i0, t = reduce ? (f > .5 ? 1 : 0) : clamp((f - .16) / .68), fit = camMul(asp), of = offFactor(asp);
    palA.set(PAL[i0]); palB.set(PAL[i0 + 1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i0]); gl.vertexAttribPointer(A.aA, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i0 + 1]); gl.vertexAttribPointer(A.aB, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, rBuf); gl.vertexAttribPointer(A.aR, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(U.uMix, t); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uAspect, asp);
    gl.uniform1f(U.uPx, dpr * canvas.clientHeight / 900 * 2.5 * Math.min(1.25, 1.2 / fit + .1) * Math.sqrt(16000 / C) * (asp < .8 ? 1.55 : 1));
    gl.uniform1f(U.uCamA, CAM[i0] * fit); gl.uniform1f(U.uCamB, CAM[i0 + 1] * fit);
    gl.uniform1f(U.uImgA, i0 === SC ? 1 : 0); gl.uniform1f(U.uImgB, i0 + 1 === SC ? 1 : 0);
    gl.uniform2f(U.uOffA, OFF[i0][0] * of, OFF[i0][1] * of); gl.uniform2f(U.uOffB, OFF[i0 + 1][0] * of, OFF[i0 + 1][1] * of);
    gl.uniform2f(U.uRot, reduce ? 0 : -pm.y * .07 + Math.sin(time * .2) * .03, (reduce ? s * .35 : time * .05 + s * .35 + pm.x * .12));
    gl.uniform2f(U.uPan, reduce ? 0 : pm.x * .04, reduce ? 0 : -pm.y * .03);
    gl.uniform3fv(U.palA, palA); gl.uniform3fv(U.palB, palB);
    gl.drawArrays(gl.POINTS, 0, C);
    dbg.dpr = dpr;
  }

  /* ------------------------------------------------------------------ wiring */
  addEventListener('scroll', () => { readScroll(); wake(); }, { passive: true });
  addEventListener('resize', () => { resize(); readScroll(); wake(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { last = performance.now(); wake(); } });
  addEventListener('hashchange', hashScene);
  resize(); readScroll(); s = tgt; hashScene(); readScroll(); s = tgt;
  setActive(0);
  loadStipples();
  document.fonts && document.fonts.ready.then(() => { measure(); layoutAll(); wake(); });
  wake();
})();
