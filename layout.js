/* Showcase layout and fade, as pure functions of the window size and the scroll position (so scrolling back gives exactly what scrolling forward gave).
   Used by main.js; also loaded directly by the Node checks. */
(function (root) {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const NAT = [760 / 1400, 760 / 1400, 872 / 740, 760 / 1400, 872 / 1622];     // Today, Activity & Logs, System, Notifications, Limits
  const CROP = [0, 0, .5, 0, .45];                                              // which part of a tall screenshot the phone thumbnails show

  /* five cards: one row on a wide screen (alternate cards sit a little higher or lower), a 2-2-1 grid of thumbnails on a phone or tablet in portrait */
  function slots(Wc, Hc) {
    const portrait = Wc < 760 || Wc / Hc < .85, out = [];
    if (!portrait) {
      const gap = Wc * .018, sum = NAT.reduce((a, b) => a + b, 0), h = Math.min(Hc * .40, (Wc * .92 - 4 * gap) / sum), total = h * sum + 4 * gap, cy = Hc * .53;
      let x = (Wc - total) / 2;
      NAT.forEach((ar, k) => { const w = h * ar, c = cy + (k % 2 ? -1 : 1) * Hc * .025; out.push({ x, y: c - h / 2, w, h, ar, cropY: .5, weight: ar }); x += w + gap; });
      return { mode: 'row', cards: out };
    }
    const gap = 12, top = Hc * .21, avail = Math.min(Hc * .85, Hc - 128) - top, ar = 1.05, cell = (avail - 2 * gap) / 3, w = Math.min(Wc * .44, cell * ar), h = w / ar, y0 = top + (avail - (3 * h + 2 * gap)) / 2;
    const at = [[Wc / 2 - gap / 2 - w, y0], [Wc / 2 + gap / 2, y0], [Wc / 2 - gap / 2 - w, y0 + h + gap], [Wc / 2 + gap / 2, y0 + h + gap], [Wc / 2 - w / 2, y0 + 2 * (h + gap)]];
    at.forEach(([x, y], k) => out.push({ x, y, w, h, ar, cropY: CROP[k], weight: 1 }));
    return { mode: 'grid', cards: out };
  }

  /* how far card k has resolved out of its particles (1 = crisp) when the scroll position is s and the showcase is scene `scene`.
     Same smoothstep as the site's other reveals; later cards start a little earlier, so they come out one after another rather than all at once. */
  const crisp = (k, s, scene) => 1 - smooth(.15 + k * .016, .33 + k * .016, Math.abs(s - scene));

  const api = { slots, crisp, smooth, clamp, NAT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TORING_LAYOUT = api;
})(typeof window !== 'undefined' ? window : globalThis);
