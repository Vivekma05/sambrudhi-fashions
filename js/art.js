/* =====================================================================
   art.js — draws the product pictures as illustrations (SVG).
   They stand in until you add real photos: put photo paths in a
   product's `images` list (js/products.js) and the photo is used instead.
   You don't need to edit this file.
   ===================================================================== */
window.Art = (() => {
  'use strict';
  let n = 0;
  const uid = () => 'w' + (++n).toString(36) + Math.random().toString(36).slice(2, 5);

  // ---- colour helpers ----------------------------------------------------
  const rgb = h => {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/./g, c => c + c);
    const v = parseInt(h, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  const hex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
  const dark = (c, t) => mix(c, '#000000', t);
  const light = (c, t) => mix(c, '#ffffff', t);
  const lum = c => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  const GOLD = '#d4a64a', GOLD_D = '#9a7128', GOLD_L = '#f4dc9c';

  const wrap = (viewBox, defs, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;

  function backdrop(id, base) {
    const c1 = mix('#fcf7f0', base, 0.07);
    const c2 = mix('#eee1d1', base, 0.13);
    return {
      defs: `<radialGradient id="${id}bg" cx="50%" cy="38%" r="72%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`,
      body: `<rect width="400" height="500" fill="url(#${id}bg)"/>`
    };
  }

  const shadowGrad = id => `<radialGradient id="${id}sh"><stop offset="0" stop-color="#3b1d12" stop-opacity=".34"/><stop offset=".55" stop-color="#3b1d12" stop-opacity=".14"/><stop offset="1" stop-color="#3b1d12" stop-opacity="0"/></radialGradient>`;

  // ---- small motifs ------------------------------------------------------
  const butta = (x, y, c, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle r="1.7"/><circle cy="-3.4" r="1.4"/><circle cy="3.4" r="1.4"/><circle cx="-3.4" r="1.4"/><circle cx="3.4" r="1.4"/></g>`;
  const flower = (x, y, c, cc, s = 1) => {
    let p = '';
    for (let i = 0; i < 5; i++) p += `<ellipse cy="-5.5" rx="3" ry="5.5" transform="rotate(${i * 72})"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s})"><g fill="${c}">${p}</g><circle r="2.4" fill="${cc}"/></g>`;
  };
  const PAISLEY = 'M0 -10C8 -6 7 6 0 9C-6 11 -9 3 -5 -1C-3 -3 -1 -5 0 -10Z';
  const paisley = (x, y, c, cc, s = 1, r = 0) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="${PAISLEY}" fill="${c}"/><circle cx="-1" cy="3" r="2" fill="${cc}"/></g>`;
  const diamond = (x, y, c, s = 4) => `<path d="M${x} ${y - s}L${x + s} ${y}L${x} ${y + s}L${x - s} ${y}Z" fill="${c}"/>`;

  function motifPattern(pid, a, B, z) {
    const soft = lum(B) > 0.62 ? dark(B, 0.16) : light(B, 0.2);
    const T = (w, h, inner) => `<pattern id="${pid}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern>`;
    switch (a.motif) {
      case 'buttas': return T(34, 34, butta(8.5, 8.5, z) + butta(25.5, 25.5, z));
      case 'checks': return T(26, 26, `<path d="M0 .8H26M.8 0V26" stroke="${z}" stroke-width="1.6" opacity=".85"/><path d="M0 6H26M6 0V26" stroke="${soft}" stroke-width="1" opacity=".7"/>`);
      case 'stripes': return T(18, 18, `<rect width="2" height="18" fill="${z}" opacity=".8"/><rect x="9" width="1" height="18" fill="${soft}" opacity=".8"/>`);
      case 'floral': return T(56, 56, flower(14, 14, soft, z) + flower(42, 42, soft, z) + `<circle cx="42" cy="14" r="1.6" fill="${z}"/><circle cx="14" cy="42" r="1.6" fill="${z}"/>`);
      case 'ikat': return T(40, 26, `<path d="M0 13L10 4L20 13L30 4L40 13" fill="none" stroke="${soft}" stroke-width="3.2" stroke-linejoin="round" opacity=".9"/><path d="M0 22L10 13L20 22L30 13L40 22" fill="none" stroke="${z}" stroke-width="1.3" opacity=".7"/>`);
      case 'paisley': return T(46, 46, paisley(12, 13, z, B, 0.85, -25) + paisley(35, 36, z, B, 0.85, 155));
      case 'sequins': return T(22, 22, `<circle cx="5" cy="5" r="1.3" fill="${z}" opacity=".9"/><circle cx="16" cy="16" r="1.3" fill="${z}" opacity=".9"/>`);
      default: return T(48, 48, `<circle cx="11" cy="13" r="1" fill="${z}" opacity=".45"/><circle cx="35" cy="37" r="1" fill="${z}" opacity=".45"/>`);
    }
  }

  function palluMotif(x, y, a, z, R) {
    switch (a.motif) {
      case 'paisley': case 'floral': return paisley(x, y, z, R, 1.25, -20);
      case 'ikat': case 'checks': return diamond(x, y, z, 7) + diamond(x, y, R, 3);
      default: return butta(x, y, z, 1.8);
    }
  }

  // ---- folded saree (400 x 500 space) -------------------------------------
  function sareeParts(a = {}) {
    const id = uid();
    const B = a.body || '#7a1230';
    const R = a.border || dark(B, 0.35);
    const z = a.zari || GOLD;
    const x = 72, y = 92, w = 256, h = 318;
    const thin = a.borderStyle === 'thin';
    const bw = thin ? 16 : 40;           // side border width
    const ph = thin ? 72 : 98;           // pallu band height
    const py = y + h - ph;
    const bx = x + w - bw;
    const sheen = a.sheen ?? 0.2;

    let d = '';
    // pallu band along the bottom
    d += `<rect x="${x}" y="${py}" width="${w}" height="${ph}" fill="${R}"/>`;
    d += `<rect x="${x}" y="${py}" width="${w}" height="3" fill="${z}"/><rect x="${x}" y="${py + 8}" width="${w}" height="1.5" fill="${z}" opacity=".8"/>`;
    const my = py + (thin ? 28 : 34);
    for (let mx = x + 16; mx < bx - 8; mx += 30) d += palluMotif(mx, my, a, z, R);
    for (let sy = py + (thin ? 46 : 56); sy < y + h - 3; sy += 7) d += `<rect x="${x}" y="${sy}" width="${w}" height="2" fill="${z}" opacity=".7"/>`;

    // temple border teeth
    if (a.borderStyle === 'temple') {
      for (let xx = x - 4; xx < bx; xx += 16)
        d += `<path d="M${xx} ${py + 0.5}L${xx + 8} ${py - 10}L${xx + 16} ${py + 0.5}Z" fill="${R}" stroke="${z}" stroke-width=".9"/>`;
      for (let yy = y - 4; yy + 16 <= py + 2; yy += 16)
        d += `<path d="M${bx + 0.5} ${yy}L${bx - 10} ${yy + 8}L${bx + 0.5} ${yy + 16}Z" fill="${R}" stroke="${z}" stroke-width=".9"/>`;
    }
    // side border
    d += `<rect x="${bx}" y="${y}" width="${bw}" height="${h}" fill="${R}"/>`;
    if (!thin) {
      d += `<rect x="${bx + 6}" y="${y}" width="1" height="${h}" fill="${z}" opacity=".8"/><rect x="${x + w - 12}" y="${y}" width="1" height="${h}" fill="${z}" opacity=".8"/>`;
      for (let yy = y + 8; yy < y + h; yy += 15) d += diamond(bx + (bw - 6) / 2 + 3, yy, z, 3.5);
    }
    d += `<rect x="${bx}" y="${y}" width="2.5" height="${h}" fill="${z}"/><rect x="${x + w - 6}" y="${y}" width="2" height="${h}" fill="${z}"/>`;

    const defs =
      motifPattern(id + 'm', a, B, z) + shadowGrad(id) +
      `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity="${sheen}"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>` +
      `<clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/></clipPath>`;

    const body =
      `<ellipse cx="200" cy="${y + h + 30}" rx="170" ry="26" fill="url(#${id}sh)"/>` +
      // folded layers peeking out underneath
      `<rect x="${x + 10}" y="${y + h}" width="${w - 20}" height="24" rx="5" fill="${dark(B, 0.25)}"/>` +
      `<rect x="${x + 10}" y="${y + h + 17}" width="${w - 20}" height="1.5" fill="${z}" opacity=".6"/>` +
      `<rect x="${x + 5}" y="${y + h - 10}" width="${w - 10}" height="22" rx="5" fill="${dark(R, 0.12)}"/>` +
      `<rect x="${x + 5}" y="${y + h + 5}" width="${w - 10}" height="2" fill="${z}" opacity=".8"/>` +
      `<g clip-path="url(#${id}c)">` +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${B}"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${py - y}" fill="url(#${id}m)"/>` +
        d +
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}s)"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="2.5" fill="#fff" opacity=".3"/>` +
      `</g>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="none" stroke="${dark(B, 0.4)}" stroke-opacity=".35"/>`;
    return { defs, body };
  }

  // ---- stack of bangles (400 x 500 space) ----------------------------------
  function bangleParts(a = {}, opt = {}) {
    const id = uid();
    const style = a.style || 'glass';
    const cols = (a.colors && a.colors.length) ? a.colors : ['#b3122e'];
    const W = { glass: 9, kundan: 17, thread: 14, kada: 24, lac: 15, pearl: 12 }[style] || 10;
    const count = a.count || { glass: 10, kundan: 3, thread: 5, kada: 2, lac: 5, pearl: 4 }[style] || 5;
    const stand = opt.stand !== false;
    const cx = 200, rx = 116, ry = 34, gap = W + 1.5;
    const bottom = 372;
    const top = bottom - gap * (count - 1);

    const arc = (cy, front) => `M${cx - rx} ${cy}A${rx} ${ry} 0 0 ${front ? 0 : 1} ${cx + rx} ${cy}`;
    const P = (d, s, w, extra = '') => `<path d="${d}" stroke="${s}" stroke-width="${w}"${extra}/>`;
    const dots = gapLen => ` stroke-dasharray="0.1 ${gapLen}" stroke-linecap="round"`;
    const shift = v => ` transform="translate(0 ${v})"`;

    function ring(d, c, c2, dim) {
      const k = col => (dim ? dark(col, 0.34) : col);
      switch (style) {
        case 'kundan':
          return P(d, k(GOLD_D), W, shift(1.5)) + P(d, k(GOLD), W - 2) +
            P(d, k(c), W * 0.5, ' stroke-dasharray="5 6" stroke-linecap="round"') +
            P(d, k('#ffffff'), 2.4, dots(5.5) + shift(-W * 0.36)) + P(d, k('#ffffff'), 2.4, dots(5.5) + shift(W * 0.36));
        case 'thread':
          return P(d, k(dark(c, 0.3)), W, shift(1.5)) + P(d, k(c), W - 1.5) +
            P(d, k(GOLD), W - 1.5, ' stroke-dasharray="1.8 7"') +
            P(d, k(a.stone || '#ffffff'), W * 0.34, dots(17.6) + ' stroke-dashoffset="-4.4"') +
            P(d, k(GOLD), 1.4, shift(-W * 0.45)) + P(d, k(GOLD), 1.4, shift(W * 0.45));
        case 'kada':
          return P(d, k(GOLD_D), W, shift(2)) + P(d, k('#d1a24c'), W - 2) +
            P(d, k(GOLD_D), W * 0.62, ' stroke-dasharray="2 4" stroke-opacity=".55"') +
            P(d, k(c), 8, dots(16)) +
            P(d, k(GOLD_L), 3, dots(5) + shift(-W * 0.42)) + P(d, k(GOLD_L), 3, dots(5) + shift(W * 0.42)) +
            P(d, k('#fff6d8'), 1.6, ' stroke-opacity=".6"' + shift(-W * 0.28));
        case 'lac':
          return P(d, k(dark(c, 0.3)), W, shift(1.5)) + P(d, k(c), W - 1.5) +
            P(d, k('#eef3f6'), W * 0.42, dots(11)) +
            P(d, k(GOLD), W * 0.22, dots(11) + ' stroke-dashoffset="-5.5"') +
            P(d, k(GOLD), 1.5, shift(-W * 0.42)) + P(d, k(GOLD), 1.5, shift(W * 0.42));
        case 'pearl':
          return P(d, k(GOLD_D), 4) +
            P(d, k(dark(c, 0.18)), W, dots(W) + shift(1)) + P(d, k(c), W - 1, dots(W)) +
            P(d, k('#ffffff'), W * 0.3, dots(W) + shift(-W * 0.18));
        default: // glass
          return P(d, k(dark(c, 0.35)), W, shift(1.5)) + P(d, k(c), W - 1.5) +
            (a.glitter ? P(d, k(a.glitter), W * 0.32, dots(7)) : '') +
            P(d, k('#ffffff'), W * 0.22, ' stroke-opacity=".5"' + shift(-W * 0.22));
      }
    }

    let back = '', front = '';
    for (let i = 0; i < count; i++) {
      const cy = bottom - i * gap;
      const c = cols[i % cols.length], c2 = cols[(i + 1) % cols.length];
      back += ring(arc(cy, false), c, c2, true);
      front += ring(arc(cy, true), c, c2, false);
    }

    const standTop = top - 84;
    const defs = shadowGrad(id) +
      `<linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="#3d0a18"/><stop offset=".45" stop-color="#8a2140"/><stop offset="1" stop-color="#3d0a18"/></linearGradient>` +
      `<radialGradient id="${id}k" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fbe7b0"/><stop offset=".6" stop-color="${GOLD}"/><stop offset="1" stop-color="#8a6420"/></radialGradient>` +
      `<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a32a4a"/><stop offset="1" stop-color="#5a1022"/></linearGradient>`;

    const base = stand
      ? `<ellipse cx="200" cy="${bottom + 56}" rx="150" ry="22" fill="url(#${id}sh)"/>` +
        `<ellipse cx="200" cy="${bottom + 44}" rx="86" ry="18" fill="#4a0d1d"/>` +
        `<ellipse cx="200" cy="${bottom + 37}" rx="86" ry="18" fill="url(#${id}v)"/>` +
        `<ellipse cx="200" cy="${bottom + 37}" rx="86" ry="18" fill="none" stroke="${GOLD}" stroke-opacity=".6" stroke-width="1.2"/>`
      : `<ellipse cx="200" cy="${bottom + ry + 12}" rx="160" ry="22" fill="url(#${id}sh)"/>`;
    const rod = stand
      ? `<rect x="187" y="${standTop}" width="26" height="${bottom + 37 - standTop}" rx="13" fill="url(#${id}r)"/>` +
        `<circle cx="200" cy="${standTop}" r="15" fill="url(#${id}k)"/>`
      : '';

    const body = `${base}<g fill="none">${back}</g>${rod}<g fill="none">${front}</g>`;
    return { defs, body };
  }

  // ---- public drawing functions ------------------------------------------
  function saree(a) {
    const id = uid(), bg = backdrop(id, a.body || '#7a1230'), s = sareeParts(a);
    return wrap('0 0 400 500', bg.defs + s.defs, bg.body + s.body);
  }

  function bangles(a) {
    const id = uid(), bg = backdrop(id, (a.colors && a.colors[0]) || '#b3122e'), b = bangleParts(a);
    return wrap('0 0 400 500', bg.defs + b.defs, bg.body + b.body);
  }

  function combo(a) {
    const id = uid(), bg = backdrop(id, a.saree.body), s = sareeParts(a.saree), b = bangleParts(a.bangles, { stand: false });
    return wrap('0 0 400 500', bg.defs + s.defs + b.defs,
      bg.body + `<g transform="translate(-14 -18)">${s.body}</g><g transform="translate(176 228) scale(.56)">${b.body}</g>`);
  }

  // Placeholder for categories that have no special drawing (kurtis, jewellery, …)
  function plain(a = {}) {
    const id = uid(), c = a.color || '#7a1230', bg = backdrop(id, c);
    let petals = '';
    for (let i = 0; i < 12; i++) petals += `<ellipse cy="-58" rx="13" ry="30" transform="rotate(${i * 30})"/>`;
    const label = String(a.label || '').replace(/[<>&"]/g, '').slice(0, 18);
    return wrap('0 0 400 500', bg.defs + shadowGrad(id),
      bg.body +
      `<ellipse cx="200" cy="420" rx="150" ry="22" fill="url(#${id}sh)"/>` +
      `<g transform="translate(200 230)"><circle r="112" fill="${c}"/><circle r="112" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
      `<g fill="none" stroke="${GOLD_L}" stroke-width="1.6" opacity=".9">${petals}<circle r="92" stroke-dasharray="1.5 6" stroke-linecap="round"/><circle r="26"/></g>` +
      `<circle r="10" fill="${GOLD}"/></g>` +
      (label ? `<text x="200" y="395" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${dark(c, 0.25)}" letter-spacing="2">${label}</text>` : ''));
  }

  // Which drawing a product gets: from the shape of its art settings, then its category
  function kindOf(p) {
    const a = p.art || {};
    if (a.kind) return a.kind;
    if (a.saree && a.bangles) return 'combo';
    if (a.style) return 'bangles';
    if (a.body) return 'saree';
    return { sarees: 'saree', bangles: 'bangles', combos: 'combo' }[p.category] || 'plain';
  }

  function draw(p) {
    const a = p.art || {};
    switch (kindOf(p)) {
      case 'bangles': return bangles(a);
      case 'combo': return a.saree && a.bangles ? combo(a) : saree(a.saree || a);
      case 'saree': return saree(a.saree || a);
      default: return plain(a);
    }
  }

  const sparkle = (x, y, s, o = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10C1 -2 2 -1 10 0C2 1 1 2 0 10C-1 2 -2 1 -10 0C-2 -1 -1 -2 0 -10Z" fill="#f3d38a" opacity="${o}"/>`;

  // Hero picture: a temple arch with a saree and a bangle stand
  function hero() {
    const id = uid();
    const s = sareeParts({ body: '#0f5e46', border: '#a3123a', zari: '#dcb15a', motif: 'buttas', borderStyle: 'temple', sheen: 0.26 });
    const b = bangleParts({ style: 'glass', colors: ['#a3123a', '#d4a64a', '#0f5e46'], glitter: '#f6d58c', count: 11 });
    const arch = 'M40 640V280a240 240 0 0 1 480 0V640Z';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 640" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d1a38"/><stop offset="1" stop-color="#43091a"/></linearGradient>
      <radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6d48f" stop-opacity=".42"/><stop offset="1" stop-color="#f6d48f" stop-opacity="0"/></radialGradient>
      <pattern id="${id}j" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M14 1L27 14L14 27L1 14Z" fill="none" stroke="#f3d38a" stroke-opacity=".11"/><circle cx="14" cy="14" r="1.8" fill="#f3d38a" fill-opacity=".14"/></pattern>
      <clipPath id="${id}c"><path d="${arch}"/></clipPath>
      ${s.defs}${b.defs}</defs>
      <path d="${arch}" fill="url(#${id}a)"/>
      <path d="${arch}" fill="url(#${id}j)"/>
      <g clip-path="url(#${id}c)">
        <ellipse cx="280" cy="380" rx="250" ry="230" fill="url(#${id}g)"/>
        <rect x="40" y="586" width="480" height="60" fill="#2c0611" opacity=".45"/>
        <g transform="translate(14 118) scale(1.04)">${s.body}</g>
        <g transform="translate(232 262) scale(.8)">${b.body}</g>
      </g>
      <path d="M58 640V282a222 222 0 0 1 444 0V640" fill="none" stroke="#dcb15a" stroke-width="2" stroke-opacity=".75"/>
      <path d="M72 640V284a208 208 0 0 1 416 0V640" fill="none" stroke="#dcb15a" stroke-width="1.2" stroke-opacity=".45" stroke-dasharray="1.5 6" stroke-linecap="round"/>
      ${sparkle(120, 170, 1.2, 0.9)}${sparkle(440, 150, 0.9, 0.8)}${sparkle(470, 300, 0.6, 0.7)}${sparkle(98, 300, 0.55, 0.6)}${sparkle(280, 84, 0.8, 0.85)}
    </svg>`;
  }

  // Decorative mandala used on occasion tiles
  function mandala(color) {
    let p = '', q = '';
    for (let i = 0; i < 16; i++) p += `<ellipse cy="-40" rx="8" ry="20" transform="rotate(${i * 22.5})"/>`;
    for (let i = 0; i < 8; i++) q += `<ellipse cy="-19" rx="6" ry="12" transform="rotate(${i * 45 + 22.5})"/>`;
    return `<svg viewBox="-70 -70 140 140" aria-hidden="true" focusable="false"><g fill="none" stroke="${color}" stroke-width="1.3">${p}${q}<circle r="62"/><circle r="66" stroke-dasharray="1.5 5" stroke-linecap="round"/><circle r="30"/><circle r="7"/></g></svg>`;
  }

  return { draw, saree, bangles, combo, plain, hero, mandala };
})();
