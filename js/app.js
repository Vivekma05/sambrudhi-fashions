/* =====================================================================
   app.js — the shop itself: product grid, filters, wishlist, bag and
   WhatsApp checkout. You don't need to edit this file; shop details
   live in js/shop-config.js and products in js/products.js.
   ===================================================================== */
(() => {
  'use strict';

  const S = window.SHOP || {};
  const PRODUCTS = (window.PRODUCTS || []).map((p, i) => ({
    order: i, occasions: [], colors: [], details: [], images: [], ...p
  }));
  const byId = new Map(PRODUCTS.map(p => [p.id, p]));

  // ---- helpers ------------------------------------------------------------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const onlyDigits = s => String(s || '').replace(/\D/g, '');
  const discount = p => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
  const fillIn = s => String(s).replace(/\{(\w+)\}/g, (m, k) => ({
    free: money(S.freeDeliveryAbove), fee: money(S.deliveryFee), days: S.deliveryTime,
    exchange: S.exchangeDays, name: S.name
  }[k] ?? m));

  let WA = onlyDigits(S.whatsapp);
  if (WA.length === 10) WA = '91' + WA;
  const waReady = WA.length >= 11;
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  const KEY = 'shop.' + String(S.orderPrefix || 'store').toLowerCase();
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(`${KEY}.${k}`)); return v ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(`${KEY}.${k}`, JSON.stringify(v)); } catch { /* storage blocked */ } };

  // ---- icons --------------------------------------------------------------
  const svgI = (inner, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ICON = {
    bag: svgI('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    heart: svgI('<path d="M12 20s-7-4.35-9-9.1C1.6 7.6 3.7 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.4 0 5.5 3.1 4.1 6.4C19 15.65 12 20 12 20z"/>', 'ico-heart'),
    search: svgI('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    menu: svgI('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    close: svgI('<path d="M6 6l12 12M18 6L6 18"/>'),
    minus: svgI('<path d="M6 12h12"/>'),
    plus: svgI('<path d="M12 6v12M6 12h12"/>'),
    trash: svgI('<path d="M4 7h16M9 7V5h6v2M6.5 7l1 12h9l1-12M10 11v5M14 11v5"/>'),
    check: svgI('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    arrow: svgI('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    truck: svgI('<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    cash: svgI('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>'),
    swap: svgI('<path d="M4 9h14l-3.5-3.5M20 15H6l3.5 3.5"/>'),
    phone: svgI('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a11 11 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6a2 2 0 0 1-2.2 2C10.4 19 5 13.6 4.6 5.7a2 2 0 0 1 2-2.2z"/>'),
    insta: svgI('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".7" class="fill"/>'),
    mail: svgI('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>'),
    pin: svgI('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
    clock: svgI('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    spark: svgI('<path d="M12 3c.6 4.6 1.9 6.4 6 7.5-4.1 1.1-5.4 2.9-6 7.5-.6-4.6-1.9-6.4-6-7.5 4.1-1.1 5.4-2.9 6-7.5z"/>'),
    wa: svgI('<path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8z"/><path class="fill" d="M9 7.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.3 0 .6.4.7.9 1.3 1.5 1.8.6.5 1.2.9 1.9 1.1.2.1.4 0 .5-.1l.7-.9c.2-.2.3-.2.6-.1l1.7.8c.2.1.4.2.4.4 0 .5-.2 1.2-.7 1.6-.5.4-1.3.7-2.2.5-1.5-.3-3.1-1.1-4.3-2.3-1.2-1.2-2.2-2.7-2.6-4.1-.3-1.1.1-1.9.6-2.3z"/>', 'ico-wa')
  };

  // ---- reference data -----------------------------------------------------
  const COLORS = {
    red: ['Red', '#c0142f'], maroon: ['Maroon', '#6e1028'], pink: ['Pink', '#e0457b'],
    orange: ['Orange', '#e8743b'], yellow: ['Yellow', '#e3b10f'], green: ['Green', '#157a55'],
    blue: ['Blue', '#1f4e8c'], purple: ['Purple', '#6f3fa0'], black: ['Black', '#1d1d24'],
    white: ['Ivory', '#f3ead7'], gold: ['Gold', '#c9973f']
  };
  const OCCASIONS = [
    ['Wedding', 'Silks & bridal bangles', '#7a1530', '#3d0a18'],
    ['Festive', 'Pooja, festivals & functions', '#b86a12', '#6e3a06'],
    ['Party', 'Sequins, organza & glam', '#28305e', '#121633'],
    ['Office', 'Cotton, linen & ikat', '#1e5c4a', '#0d3328'],
    ['Daily', 'Easy, light & everyday', '#8a3b5e', '#4a1730']
  ];
  const PRICES = {
    u1k: ['Under ₹1,000', 0, 999],
    '1to3k': ['₹1,000 – ₹3,000', 1000, 3000],
    '3to7k': ['₹3,000 – ₹7,000', 3001, 7000],
    o7k: ['Above ₹7,000', 7001, Infinity]
  };
  const CATS = [
    ['sarees', 'Sarees', 'Silk, cotton, georgette & more', 's2'],
    ['bangles', 'Bangles', 'Glass, kundan, thread & lac', 'b2'],
    ['combos', 'Combos', 'Saree + matching bangles', 'c1']
  ];
  const SIZE_GUIDE = [['2.2', '54 mm'], ['2.4', '57 mm'], ['2.6', '60 mm'], ['2.8', '64 mm'], ['2.10', '67 mm']];
  const usedColors = Object.keys(COLORS).filter(c => PRODUCTS.some(p => p.colors.includes(c)));
  const countIn = (key, val) => PRODUCTS.filter(p => (key === 'cat' ? p.category === val : p.occasions.includes(val))).length;

  // ---- state --------------------------------------------------------------
  let bag = load('bag', []).filter(i => byId.has(i.id) && i.qty > 0 && byId.get(i.id).inStock !== false);
  const wish = new Set(load('wish', []).filter(id => byId.has(id)));
  const state = { cat: 'all', occasion: 'all', color: 'all', price: 'all', sort: 'featured', q: '' };

  const picture = (p, eager) => (p.images && p.images.length)
    ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`
    : Art.draw(p);

  // ======================================================================
  // STATIC SECTIONS
  // ======================================================================
  function renderStatic() {
    document.title = `${S.name} — Sarees & Bangles`;
    $$('[data-shop-name]').forEach(el => { el.textContent = S.name; });
    $$('[data-shop-tagline]').forEach(el => { el.textContent = S.tagline || ''; });
    $$('[data-i]').forEach(el => { el.outerHTML = ICON[el.dataset.i] || ''; });
    $('#year').textContent = new Date().getFullYear();

    // setup reminder for the shop owner
    if (!waReady) {
      const b = $('#setupBanner');
      b.innerHTML = `<strong>Setup needed:</strong> add your WhatsApp number in <code>js/shop-config.js</code> so customer orders reach you.`;
      b.hidden = false;
    }

    // announcement messages
    const notes = [`Free delivery on orders above ${money(S.freeDeliveryAbove)}`];
    if (S.cashOnDelivery) notes.push('Cash on delivery available');
    notes.push('Order easily on WhatsApp');
    if (S.exchangeDays) notes.push(`Easy ${S.exchangeDays}-day exchange`);
    const ann = $('#announce');
    let ai = 0;
    ann.textContent = notes[0];
    if (notes.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(() => {
        ann.classList.add('fade');
        setTimeout(() => { ai = (ai + 1) % notes.length; ann.textContent = notes[ai]; ann.classList.remove('fade'); }, 350);
      }, 3800);
    }

    $('#heroArt').innerHTML = Art.hero();
    $('#heroPoints').innerHTML = [
      S.cashOnDelivery && 'Cash on delivery',
      `Free delivery above ${money(S.freeDeliveryAbove)}`,
      'Bangle size guide'
    ].filter(Boolean).map(t => `<li>${ICON.check}${esc(t)}</li>`).join('');

    // trust strip
    const trust = [
      [ICON.truck, 'Free delivery', `On orders above ${money(S.freeDeliveryAbove)}`],
      S.cashOnDelivery ? [ICON.cash, 'Cash on delivery', 'Or pay easily by UPI'] : [ICON.cash, 'Easy UPI payment', 'GPay, PhonePe, Paytm'],
      S.exchangeDays ? [ICON.swap, `${S.exchangeDays}-day exchange`, 'On unused items with tags'] : [ICON.spark, 'Handpicked', 'Every piece chosen by us'],
      [ICON.wa, 'WhatsApp help', 'Ask us anything, anytime']
    ];
    $('#trust').innerHTML = trust.map(([i, t, s]) => `<li><span class="trust-ico">${i}</span><span><strong>${esc(t)}</strong><small>${esc(s)}</small></span></li>`).join('');

    // categories
    $('#catGrid').innerHTML = CATS.map(([key, title, sub, sample]) => {
      const p = byId.get(sample) || PRODUCTS.find(x => x.category === key);
      if (!p) return '';
      return `<a class="cat-card" href="#shop" data-go="${key}">
        <div class="cat-art">${picture(p)}</div>
        <div class="cat-text"><h3>${title}</h3><p>${sub}</p><span class="cat-link">${countIn('cat', key)} styles ${ICON.arrow}</span></div>
      </a>`;
    }).join('');

    // occasions
    $('#occGrid').innerHTML = OCCASIONS.map(([o, sub, c1, c2]) => `
      <a class="occ" href="#shop" data-go-occasion="${o}" style="--c1:${c1};--c2:${c2}">
        <span class="occ-art">${Art.mandala('#f3d38a')}</span>
        <h3>${o}</h3><p>${sub}</p><span class="occ-count">${countIn('occ', o)} pieces</span>
      </a>`).join('');

    // complete-the-look art
    const matchPick = byId.get('c2') || PRODUCTS.find(p => p.category === 'combos');
    if (matchPick) $('#matchArt').innerHTML = picture(matchPick);
    else $('#matchSection').hidden = true;

    // how to order
    const steps = [
      ['Pick your favourites', 'Browse sarees, bangles and combos. Choose your bangle size.'],
      ['Checkout in a minute', 'Add your delivery address — no account or sign-up needed.'],
      ['Confirm on WhatsApp', 'Your order opens in WhatsApp. Tap send and we reply to confirm.'],
      [S.cashOnDelivery ? 'Pay by UPI or COD' : 'Pay by UPI', S.cashOnDelivery ? 'Pay by UPI after we confirm, or in cash when it arrives.' : 'Pay by UPI after we confirm your order.']
    ];
    $('#steps').innerHTML = steps.map(([t, s], i) => `<li><span class="step-n">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(s)}</p></li>`).join('');

    // about
    const ab = S.about || {};
    $('#aboutTitle').textContent = fillIn(ab.title || `About ${S.name}`);
    $('#aboutText').innerHTML = (ab.text || []).map(t => `<p>${esc(fillIn(t))}</p>`).join('');
    $('#aboutPoints').innerHTML = (ab.points || []).map(([t, s]) => `<li>${ICON.spark}<span><strong>${esc(t)}</strong>${esc(s)}</span></li>`).join('');
    const aboutPick = byId.get('s3') || PRODUCTS[0];
    if (aboutPick) $('#aboutArt').innerHTML = picture(aboutPick);

    // faq
    $('#faqList').innerHTML = (S.faq || [])
      .filter(([q]) => S.exchangeDays || !/exchange/i.test(q))
      .map(([q, a]) => `<details><summary>${esc(fillIn(q))}<span class="faq-ico">${ICON.plus}</span></summary><p>${esc(fillIn(a))}</p></details>`).join('');

    // contact
    const contact = [];
    contact.push(waReady
      ? [ICON.wa, 'WhatsApp', 'Chat with us', waLink(`Hi ${S.name}! I have a question.`), 'wa']
      : [ICON.wa, 'WhatsApp', 'Number coming soon', '', 'wa']);
    if (S.phoneDisplay) {
      let tel = onlyDigits(S.phoneDisplay);
      if (tel.length === 10) tel = '91' + tel;
      contact.push([ICON.phone, 'Call us', S.phoneDisplay, 'tel:+' + tel, '']);
    }
    if (S.instagram) contact.push([ICON.insta, 'Instagram', '@' + S.instagram.replace(/\/+$/, '').split('/').pop(), S.instagram, '']);
    if (S.email) contact.push([ICON.mail, 'Email', S.email, 'mailto:' + S.email, '']);
    if (S.address) contact.push([ICON.pin, 'Visit us', S.address, 'https://www.google.com/maps/search/' + encodeURIComponent(S.address), '']);
    if (S.hours) contact.push([ICON.clock, 'Open', S.hours, '', '']);
    $('#contactGrid').innerHTML = contact.map(([i, t, s, href, cls]) => {
      const tag = href ? `a href="${esc(href)}" target="_blank" rel="noopener"` : 'div';
      return `<${tag} class="contact-card ${cls}"><span class="contact-ico">${i}</span><span><strong>${esc(t)}</strong><small>${esc(s)}</small></span></${href ? 'a' : 'div'}>`;
    }).join('');

    // footer
    $('#footContact').innerHTML = [
      waReady && `<li><a href="${waLink(`Hi ${S.name}!`)}" target="_blank" rel="noopener">WhatsApp us</a></li>`,
      S.phoneDisplay && `<li>${esc(S.phoneDisplay)}</li>`,
      S.email && `<li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>`,
      S.instagram && `<li><a href="${esc(S.instagram)}" target="_blank" rel="noopener">Instagram</a></li>`,
      S.address && `<li>${esc(S.address)}</li>`
    ].filter(Boolean).join('') || '<li>Contact details coming soon</li>';
    $('#footPolicy').textContent = [
      `Free delivery above ${money(S.freeDeliveryAbove)}, otherwise ${money(S.deliveryFee)}.`,
      `Delivery in ${S.deliveryTime}.`,
      S.exchangeDays ? `Exchange within ${S.exchangeDays} days on unused items.` : ''
    ].join(' ');

    // mobile menu footer
    $('#menuFoot').innerHTML = [
      `${ICON.truck}<span>Free delivery above ${money(S.freeDeliveryAbove)}</span>`,
      S.cashOnDelivery && `${ICON.cash}<span>Cash on delivery available</span>`,
      waReady && `<a class="btn btn-wa btn-sm" href="${waLink(`Hi ${S.name}!`)}" target="_blank" rel="noopener">${ICON.wa} Chat on WhatsApp</a>`
    ].filter(Boolean).map(x => `<div class="menu-note">${x}</div>`).join('');

    // floating WhatsApp button
    const f = $('#waFloat');
    if (waReady) f.href = waLink(`Hi ${S.name}! I'd like to know more about your sarees and bangles.`);
    else f.hidden = true;

    // cash on delivery option
    if (!S.cashOnDelivery) $('#codOpt').remove();
    else if (S.codFee) $('#codNote').textContent = `Pay when it arrives (+${money(S.codFee)})`;
  }

  // ======================================================================
  // SHOP GRID + FILTERS
  // ======================================================================
  function activeFilterCount() {
    return ['occasion', 'color', 'price'].filter(k => state[k] !== 'all').length + (state.q ? 1 : 0);
  }

  function renderFilters() {
    const tabs = [['all', 'All'], ['sarees', 'Sarees'], ['bangles', 'Bangles'], ['combos', 'Combos'], ['wishlist', 'Wishlist']];
    $('#catTabs').innerHTML = tabs.map(([k, l]) =>
      `<button type="button" class="tab ${state.cat === k ? 'on' : ''}" data-cat="${k}" aria-pressed="${state.cat === k}">${k === 'wishlist' ? ICON.heart : ''}${l}${k === 'wishlist' && wish.size ? `<span class="tab-n">${wish.size}</span>` : ''}</button>`).join('');

    $('#occasionChips').innerHTML = [['all', 'Any']].concat(OCCASIONS.map(o => [o[0], o[0]])).map(([k, l]) =>
      `<button type="button" class="chip ${state.occasion === k ? 'on' : ''}" data-occasion="${k}" aria-pressed="${state.occasion === k}">${l}</button>`).join('');

    $('#colorChips').innerHTML = `<button type="button" class="chip ${state.color === 'all' ? 'on' : ''}" data-color="all" aria-pressed="${state.color === 'all'}">Any</button>` +
      usedColors.map(c => `<button type="button" class="swatch ${state.color === c ? 'on' : ''}" data-color="${c}" title="${COLORS[c][0]}" aria-label="${COLORS[c][0]}" aria-pressed="${state.color === c}" style="--sw:${COLORS[c][1]}"></button>`).join('');

    $('#priceChips').innerHTML = [['all', 'Any']].concat(Object.entries(PRICES).map(([k, v]) => [k, v[0]])).map(([k, l]) =>
      `<button type="button" class="chip ${state.price === k ? 'on' : ''}" data-price="${k}" aria-pressed="${state.price === k}">${l}</button>`).join('');

    const n = activeFilterCount();
    $('#filterCount').textContent = n ? `(${n})` : '';
    $('#clearFilters').hidden = !n;
    if ($('#searchInput').value.trim().toLowerCase() !== state.q) $('#searchInput').value = state.q;
    $('#sortSelect').value = state.sort;
  }

  function matchesQuery(p, q) {
    if (!q) return true;
    const words = [p.name, p.type, p.category, p.description, ...p.occasions, ...p.colors.map(c => (COLORS[c] || [c])[0])]
      .join(' ').toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
    return q.split(/\s+/).filter(Boolean).every(t => words.some(w => w.startsWith(t) || (t.length > 3 && w.startsWith(t.replace(/s$/, '')))));
  }

  function filtered() {
    const list = PRODUCTS.filter(p => {
      if (state.cat === 'wishlist') { if (!wish.has(p.id)) return false; }
      else if (state.cat !== 'all' && p.category !== state.cat) return false;
      if (state.occasion !== 'all' && !p.occasions.includes(state.occasion)) return false;
      if (state.color !== 'all' && !p.colors.includes(state.color)) return false;
      if (state.price !== 'all') { const [, lo, hi] = PRICES[state.price]; if (p.price < lo || p.price > hi) return false; }
      return matchesQuery(p, state.q);
    });
    const sorters = {
      featured: (a, b) => a.order - b.order,
      new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.order - b.order,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      off: (a, b) => discount(b) - discount(a)
    };
    return list.sort(sorters[state.sort] || sorters.featured);
  }

  function priceRow(p, big) {
    const d = discount(p);
    return `<div class="price-row ${big ? 'lg' : ''}"><span class="price">${money(p.price)}</span>${d ? `<s>${money(p.mrp)}</s><span class="off">${d}% off</span>` : ''}</div>`;
  }

  function card(p) {
    const sold = p.inStock === false;
    const on = wish.has(p.id);
    return `<article class="card ${sold ? 'is-sold' : ''}">
      <div class="card-media">
        <button type="button" class="card-open" data-open="${p.id}" aria-label="View ${esc(p.name)}">${picture(p)}</button>
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        ${sold ? '<span class="soldout">Sold out</span>' : ''}
        <button type="button" class="wish-btn ${on ? 'on' : ''}" data-wish="${p.id}" aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Save to'} wishlist">${ICON.heart}</button>
      </div>
      <div class="card-body">
        <p class="card-type">${esc(p.type)}</p>
        <h3 class="card-title"><button type="button" data-open="${p.id}">${esc(p.name)}</button></h3>
        ${priceRow(p)}
        <button type="button" class="btn btn-sm btn-soft add-btn" data-add="${p.id}" ${sold ? 'disabled' : ''}>${sold ? 'Sold out' : p.sizes ? 'Choose size' : 'Add to bag'}</button>
      </div>
    </article>`;
  }

  function renderGrid() {
    const list = filtered();
    $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
    let empty = '';
    if (!list.length) {
      empty = state.cat === 'wishlist' && !wish.size
        ? `<div class="empty">${ICON.heart}<h3>Your wishlist is empty</h3><p>Tap the heart on anything you love to save it here.</p><button type="button" class="btn btn-primary btn-sm" data-cat="all">Browse the collection</button></div>`
        : `<div class="empty">${ICON.search}<h3>Nothing matches yet</h3><p>Try a different colour, occasion or price.</p><button type="button" class="btn btn-primary btn-sm" data-clear>Clear filters</button></div>`;
    }
    $('#grid').innerHTML = list.length ? list.map(card).join('') : empty;
  }

  function refresh() { renderFilters(); renderGrid(); }

  function go({ cat = 'all', occasion = 'all' } = {}) {
    Object.assign(state, { cat, occasion, color: 'all', price: 'all', q: '' });
    refresh();
    closeAll();
    const shop = $('#shop');
    shop.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // ======================================================================
  // WISHLIST
  // ======================================================================
  function toggleWish(id) {
    const p = byId.get(id);
    if (!p) return;
    const on = !wish.has(id);
    on ? wish.add(id) : wish.delete(id);
    save('wish', [...wish]);
    $$(`[data-wish="${id}"]`).forEach(b => {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      if (b.classList.contains('wish-btn')) b.setAttribute('aria-label', `${on ? 'Remove from' : 'Save to'} wishlist`);
    });
    updateCounts();
    if (state.cat === 'wishlist') renderGrid();
    renderFilters();
    toast(on ? 'Saved to your wishlist' : 'Removed from wishlist', on ? 'View' : '', () => go({ cat: 'wishlist' }));
  }

  // ======================================================================
  // BAG
  // ======================================================================
  function totals(payment) {
    const sub = bag.reduce((a, i) => a + byId.get(i.id).price * i.qty, 0);
    const count = bag.reduce((a, i) => a + i.qty, 0);
    const delivery = sub === 0 || sub >= S.freeDeliveryAbove ? 0 : (Number(S.deliveryFee) || 0);
    const codFee = payment === 'cod' ? (Number(S.codFee) || 0) : 0;
    return { sub, count, delivery, codFee, total: sub + delivery + codFee };
  }

  function updateCounts() {
    const { count } = totals();
    $$('[data-bag-count]').forEach(el => { el.textContent = count; el.hidden = !count; });
    $$('[data-wish-count]').forEach(el => { el.textContent = wish.size; el.hidden = !wish.size; });
  }

  function persistBag() { save('bag', bag); updateCounts(); renderBag(); }

  function addToBag(id, size, qty = 1) {
    const p = byId.get(id);
    if (!p || p.inStock === false) return false;
    if (p.sizes && !size) { openProduct(id); return false; }
    const line = bag.find(i => i.id === id && (i.size || null) === (size || null));
    if (line) line.qty = Math.min(line.qty + qty, 10);
    else bag.push({ id, size: size || null, qty: Math.min(qty, 10) });
    persistBag();
    $$('[data-bag-count]').forEach(el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
    toast(`Added to bag${size ? ` · Size ${size}` : ''}`, 'View bag', openBag);
    return true;
  }

  function renderBag() {
    const t = totals();
    $('#bagHeadCount').textContent = t.count ? `(${t.count})` : '';
    const body = $('#bagItems');
    $('#bagFoot').hidden = !bag.length;
    if (!bag.length) {
      body.innerHTML = `<div class="empty small">${ICON.bag}<h3>Your bag is empty</h3><p>Find something lovely in the collection.</p><button type="button" class="btn btn-primary btn-sm" data-go="all">Start shopping</button></div>`;
      return;
    }
    body.innerHTML = bag.map((i, idx) => {
      const p = byId.get(i.id);
      return `<div class="line">
        <button type="button" class="line-pic" data-open="${p.id}" aria-label="View ${esc(p.name)}">${picture(p)}</button>
        <div class="line-info">
          <p class="line-name">${esc(p.name)}</p>
          <p class="line-meta">${i.size ? `Size ${esc(i.size)} · ` : ''}${money(p.price)}</p>
          <div class="stepper sm">
            <button type="button" data-line-dec="${idx}" aria-label="One less">${ICON.minus}</button>
            <span aria-live="polite">${i.qty}</span>
            <button type="button" data-line-inc="${idx}" aria-label="One more" ${i.qty >= 10 ? 'disabled' : ''}>${ICON.plus}</button>
          </div>
        </div>
        <div class="line-end">
          <strong>${money(p.price * i.qty)}</strong>
          <button type="button" class="icon-btn sm" data-line-remove="${idx}" aria-label="Remove ${esc(p.name)}">${ICON.trash}</button>
        </div>
      </div>`;
    }).join('');

    const left = S.freeDeliveryAbove - t.sub;
    const pct = Math.min(100, Math.round((t.sub / S.freeDeliveryAbove) * 100));
    $('#freeMeter').innerHTML = left > 0
      ? `<p>Add <strong>${money(left)}</strong> more for <strong>free delivery</strong></p><div class="meter"><span style="width:${pct}%"></span></div>`
      : `<p class="ok">${ICON.check} You've unlocked <strong>free delivery</strong></p>`;
    $('#bagSub').textContent = money(t.sub);
    $('#bagDelivery').textContent = t.delivery ? money(t.delivery) : 'Free';
    $('#bagTotal').textContent = money(t.total);
  }

  function openBag() {
    closeAll();
    renderBag();
    $('#bagDrawer').showModal();
  }

  // ======================================================================
  // PRODUCT VIEW
  // ======================================================================
  let current = null, currentSize = null, currentQty = 1;

  function matchesFor(p) {
    const want = p.category === 'sarees' ? ['bangles', 'combos'] : p.category === 'bangles' ? ['sarees', 'combos'] : ['bangles', 'sarees'];
    const main = p.colors.filter(c => c !== 'gold');
    return PRODUCTS
      .filter(q => q.id !== p.id && want.includes(q.category) && q.inStock !== false)
      .map(q => {
        const shared = q.colors.filter(c => main.includes(c)).length;
        const occ = q.occasions.filter(o => p.occasions.includes(o)).length;
        return [q, shared * 4 + occ + (q.category === want[0] ? 1 : 0) + (shared ? 0 : -5)];
      })
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([q]) => q);
  }

  function productView(p) {
    const sold = p.inStock === false;
    const on = wish.has(p.id);
    const imgs = p.images || [];
    const media = imgs.length
      ? `<div class="pm-main"><img id="pmMainImg" src="${esc(imgs[0])}" alt="${esc(p.name)}"></div>` +
        (imgs.length > 1 ? `<div class="pm-thumbs">${imgs.map((src, i) => `<button type="button" class="${i ? '' : 'on'}" data-thumb="${esc(src)}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : '')
      : `<div class="pm-main">${Art.draw(p)}</div><p class="pm-note">Illustration — ask us on WhatsApp for real photos and a video.</p>`;

    const sizes = p.sizes ? `
      <div class="pm-block">
        <div class="pm-label"><span>Bangle size</span><button type="button" class="link-btn" data-toggle-guide aria-expanded="false">Size guide</button></div>
        <div class="sizes" role="group" aria-label="Bangle size">${p.sizes.map(s => `<button type="button" class="size" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div>
        <p class="size-hint" id="sizeHint" hidden>Please choose your bangle size</p>
        <div class="guide" id="sizeGuide" hidden>
          <p>Measure straight across the <strong>inside</strong> of a bangle that fits you well.</p>
          <table><thead><tr><th>Size</th>${SIZE_GUIDE.map(r => `<th>${r[0]}</th>`).join('')}</tr></thead>
          <tbody><tr><td>Inside width</td>${SIZE_GUIDE.map(r => `<td>${r[1]}</td>`).join('')}</tr></tbody></table>
          <p>Between two sizes? Choose the bigger one.</p>
        </div>
      </div>` : '';

    const ask = waReady
      ? `<a class="ask-wa" href="${waLink(`Hi! I'm interested in "${p.name}" (${money(p.price)}). Is it available?`)}" target="_blank" rel="noopener">${ICON.wa} Ask about this on WhatsApp</a>`
      : '';

    const matches = matchesFor(p);
    const matchTitle = p.category === 'sarees' ? 'Bangles to match' : p.category === 'bangles' ? 'Sarees to pair with' : 'Complete the look';

    return `
      <div class="pm-grid">
        <div class="pm-media">${media}</div>
        <div class="pm-info">
          <p class="eyebrow">${esc(p.type)}</p>
          <h2 id="pmTitle">${esc(p.name)}</h2>
          ${priceRow(p, true)}
          <p class="pm-ship">${S.freeDeliveryAbove ? `Free delivery on orders above ${money(S.freeDeliveryAbove)}` : ''}${S.cashOnDelivery ? ' · Cash on delivery' : ''}</p>
          <p class="pm-desc">${esc(p.description)}</p>
          ${sizes}
          <div class="pm-block pm-buy">
            <div class="stepper" aria-label="Quantity">
              <button type="button" data-pm-qty="-1" aria-label="One less">${ICON.minus}</button>
              <span id="pmQty" aria-live="polite">1</span>
              <button type="button" data-pm-qty="1" aria-label="One more">${ICON.plus}</button>
            </div>
            <button type="button" class="btn btn-primary grow" data-pm-add ${sold ? 'disabled' : ''}>${sold ? 'Sold out' : `${ICON.bag} Add to bag`}</button>
            <button type="button" class="btn btn-outline btn-icon wish-lg ${on ? 'on' : ''}" data-wish="${p.id}" aria-pressed="${on}" aria-label="Save to wishlist">${ICON.heart}</button>
          </div>
          ${ask}
          ${p.details.length ? `<ul class="pm-details">${p.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          ${p.occasions.length ? `<p class="pm-tags">Perfect for: ${p.occasions.map(o => `<button type="button" class="tag" data-go-occasion="${o}">${o}</button>`).join('')}</p>` : ''}
        </div>
      </div>
      ${matches.length ? `
      <div class="pm-match">
        <h3>${matchTitle}</h3>
        <div class="mini-grid">${matches.map(q => `
          <button type="button" class="mini" data-open="${q.id}">
            <span class="mini-art">${picture(q)}</span>
            <span class="mini-name">${esc(q.name)}</span>
            <span class="mini-price">${money(q.price)}</span>
          </button>`).join('')}</div>
      </div>` : ''}`;
  }

  function openProduct(id) {
    const p = byId.get(id);
    if (!p) return;
    current = p; currentSize = null; currentQty = 1;
    const m = $('#productModal');
    if ($('#bagDrawer').open) $('#bagDrawer').close();
    $('#pmBody').innerHTML = productView(p);
    m.setAttribute('aria-labelledby', 'pmTitle');
    if (!m.open) m.showModal();
    m.scrollTop = 0;
  }

  // ======================================================================
  // CHECKOUT
  // ======================================================================
  function checkoutSummary() {
    const pay = ($('input[name="payment"]:checked') || {}).value;
    const t = totals(pay);
    $('#coSummary').innerHTML = `
      <h3>Order summary</h3>
      <ul class="co-lines">${bag.map(i => {
        const p = byId.get(i.id);
        return `<li><span class="co-pic">${picture(p)}</span><span class="co-name">${esc(p.name)}${i.size ? `<small>Size ${esc(i.size)}</small>` : ''}<small>Qty ${i.qty}</small></span><span>${money(p.price * i.qty)}</span></li>`;
      }).join('')}</ul>
      <div class="sum-row"><span>Items (${t.count})</span><span>${money(t.sub)}</span></div>
      <div class="sum-row"><span>Delivery</span><span>${t.delivery ? money(t.delivery) : 'Free'}</span></div>
      ${t.codFee ? `<div class="sum-row"><span>Cash on delivery</span><span>${money(t.codFee)}</span></div>` : ''}
      <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>`;
  }

  function openCheckout() {
    if (!bag.length) return;
    closeAll();
    const f = $('#checkoutForm');
    const saved = load('customer', {});
    ['name', 'phone', 'address', 'city', 'pincode'].forEach(k => { if (saved[k] && !f.elements[k].value) f.elements[k].value = saved[k]; });
    $('#coForm').hidden = false;
    $('#coDone').hidden = true;
    $('#coError').hidden = true;
    checkoutSummary();
    $('#checkoutModal').showModal();
  }

  function orderId() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return `${S.orderPrefix || 'ORD'}-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function orderMessage(id, d, t) {
    const lines = bag.map((i, n) => {
      const p = byId.get(i.id);
      return `${n + 1}. ${p.name}${i.size ? ` (Size ${i.size})` : ''}\n    ${i.qty} × ${money(p.price)} = ${money(p.price * i.qty)}`;
    });
    return [
      `*New order — ${S.name}*`,
      `Order ID: ${id}`,
      '',
      ...lines,
      '',
      `Items total: ${money(t.sub)}`,
      `Delivery: ${t.delivery ? money(t.delivery) : 'FREE'}`,
      t.codFee ? `COD charge: ${money(t.codFee)}` : null,
      `*Total: ${money(t.total)}*`,
      `Payment: ${d.payment === 'cod' ? 'Cash on delivery' : 'UPI'}`,
      '',
      '*Deliver to*',
      d.name,
      `Phone: ${d.phone}`,
      d.address,
      `${d.city} – ${d.pincode}`,
      d.note ? `\nNote: ${d.note}` : null
    ].filter(x => x !== null).join('\n');
  }

  function submitCheckout(e) {
    e.preventDefault();
    const f = e.target;
    const phone = f.elements.phone;
    const pd = onlyDigits(phone.value);
    phone.setCustomValidity(pd.length === 10 || (pd.length === 12 && pd.startsWith('91')) ? '' : 'Please enter a 10-digit mobile number');
    if (!f.reportValidity()) return;

    const err = $('#coError');
    if (!waReady) {
      err.innerHTML = 'Online ordering isn\'t switched on yet — the shop\'s WhatsApp number still needs to be added in <code>js/shop-config.js</code>.';
      err.hidden = false;
      return;
    }
    const d = Object.fromEntries(new FormData(f).entries());
    Object.keys(d).forEach(k => { d[k] = String(d[k]).trim(); });
    const t = totals(d.payment);
    const id = orderId();
    const link = waLink(orderMessage(id, d, t));
    save('customer', { name: d.name, phone: d.phone, address: d.address, city: d.city, pincode: d.pincode });
    window.open(link, '_blank', 'noopener');
    showDone({ id, payment: d.payment, total: t.total, link });
    f.elements.note.value = '';
    bag = [];
    persistBag();
  }

  function showDone(o) {
    let pay = '';
    if (o.payment === 'upi') {
      if (S.upiId) {
        const upi = `upi://pay?pa=${encodeURIComponent(S.upiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(S.upiName || S.name)}&am=${o.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + o.id)}`;
        pay = `<div class="upi-box">
          <p>Once we confirm on WhatsApp, pay <strong>${money(o.total)}</strong> to:</p>
          <div class="upi-id"><code>${esc(S.upiId)}</code><button type="button" class="btn btn-outline btn-sm" data-copy="${esc(S.upiId)}">Copy</button></div>
          ${S.upiQr ? `<img class="upi-qr" src="${esc(S.upiQr)}" alt="UPI QR code for ${esc(S.name)}">` : ''}
          <a class="btn btn-soft btn-sm" href="${upi}">Open my UPI app</a>
        </div>`;
      } else {
        pay = `<p class="fine">We'll share UPI payment details on WhatsApp after confirming your order.</p>`;
      }
    } else {
      pay = `<p class="fine">Please keep <strong>${money(o.total)}</strong> ready when your order arrives.</p>`;
    }
    $('#coDone').innerHTML = `
      <div class="done">
        <div class="done-badge">${ICON.check}</div>
        <h2>One last tap!</h2>
        <p>Your order <strong>${esc(o.id)}</strong> is ready in WhatsApp. <strong>Press send</strong> there so it reaches us — we'll reply to confirm.</p>
        <a class="btn btn-wa" href="${o.link}" target="_blank" rel="noopener">${ICON.wa} Open WhatsApp again</a>
        ${pay}
        <button type="button" class="link-btn" data-close>Continue shopping</button>
      </div>`;
    $('#coForm').hidden = true;
    $('#coDone').hidden = false;
    $('#checkoutModal').scrollTop = 0;
  }

  // ======================================================================
  // DIALOGS, TOAST
  // ======================================================================
  function closeAll() { $$('dialog[open]').forEach(d => d.close()); }

  let toastTimer;
  function hideToast() {
    const t = $('#toast');
    t.classList.remove('show');
    try { if (t.matches(':popover-open')) t.hidePopover(); } catch { /* no popover support */ }
  }
  function toast(msg, actionLabel, action) {
    const t = $('#toast');
    // Inside an open popup the page behind is inactive, so the toast must live in that popup to stay tappable.
    const host = $$('dialog[open]').pop() || document.body;
    if (t.parentElement !== host) {
      try { if (t.matches(':popover-open')) t.hidePopover(); } catch { /* no popover support */ }
      host.appendChild(t);
    }
    t.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
    if (actionLabel) t.querySelector('button').addEventListener('click', () => { hideToast(); action(); });
    try { if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch { /* fallback: plain fixed element */ }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3400);
  }

  // ======================================================================
  // EVENTS
  // ======================================================================
  function onClick(e) {
    const el = e.target.closest('button, a, [data-open]');
    if (!el) return;
    const ds = el.dataset;

    if ('close' in ds) { const d = el.closest('dialog'); if (d) d.close(); return; }
    if (ds.open) { e.preventDefault(); openProduct(ds.open); return; }
    if (ds.wish) { e.preventDefault(); toggleWish(ds.wish); return; }
    if (ds.add) { addToBag(ds.add); return; }
    if (ds.go) { e.preventDefault(); ds.go === 'wishlist' ? go({ cat: 'wishlist' }) : go({ cat: ds.go }); return; }
    if (ds.goOccasion) { e.preventDefault(); go({ occasion: ds.goOccasion }); return; }
    if (ds.cat) { state.cat = ds.cat; refresh(); return; }
    if (ds.occasion) { state.occasion = ds.occasion; refresh(); return; }
    if (ds.color) { state.color = state.color === ds.color && ds.color !== 'all' ? 'all' : ds.color; refresh(); return; }
    if (ds.price) { state.price = ds.price; refresh(); return; }
    if ('clear' in ds) { clearFilters(); return; }

    // bag lines
    if (ds.lineInc) { const i = bag[+ds.lineInc]; if (i) { i.qty = Math.min(10, i.qty + 1); persistBag(); } return; }
    if (ds.lineDec) { const i = bag[+ds.lineDec]; if (i) { i.qty -= 1; if (i.qty < 1) bag.splice(+ds.lineDec, 1); persistBag(); } return; }
    if (ds.lineRemove) { bag.splice(+ds.lineRemove, 1); persistBag(); return; }

    // product modal
    if (ds.size) {
      currentSize = ds.size;
      $$('.size', $('#productModal')).forEach(b => { const on = b.dataset.size === ds.size; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      $('#sizeHint').hidden = true;
      return;
    }
    if ('toggleGuide' in ds) { const g = $('#sizeGuide'); g.hidden = !g.hidden; el.setAttribute('aria-expanded', !g.hidden); return; }
    if (ds.pmQty) { currentQty = Math.max(1, Math.min(10, currentQty + Number(ds.pmQty))); $('#pmQty').textContent = currentQty; return; }
    if ('pmAdd' in ds) {
      if (!current) return;
      if (current.sizes && !currentSize) {
        const h = $('#sizeHint');
        h.hidden = false;
        const row = $('.sizes', $('#productModal'));
        row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
        row.querySelector('button').focus();
        return;
      }
      if (addToBag(current.id, currentSize, currentQty)) {
        el.innerHTML = `${ICON.check} Added to bag`;
        el.classList.add('added');
        setTimeout(() => { if (el.isConnected) { el.innerHTML = `${ICON.bag} Add to bag`; el.classList.remove('added'); } }, 1800);
      }
      return;
    }
    if (ds.thumb) {
      $('#pmMainImg').src = ds.thumb;
      $$('.pm-thumbs button').forEach(b => b.classList.toggle('on', b === el));
      return;
    }
    if (ds.copy) {
      const done = () => toast('UPI ID copied');
      if (navigator.clipboard) navigator.clipboard.writeText(ds.copy).then(done, () => {});
      return;
    }
  }

  function clearFilters() {
    Object.assign(state, { occasion: 'all', color: 'all', price: 'all', q: '' });
    $('#searchInput').value = '';
    refresh();
  }

  function bind() {
    document.addEventListener('click', onClick);

    $('#bagBtn').addEventListener('click', openBag);
    $('#checkoutBtn').addEventListener('click', openCheckout);
    $('#menuBtn').addEventListener('click', () => $('#menuDrawer').showModal());
    $('#searchBtn').addEventListener('click', () => {
      $('#shop').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => $('#searchInput').focus({ preventScroll: true }), 400);
    });

    let tmr;
    $('#searchInput').addEventListener('input', e => {
      clearTimeout(tmr);
      tmr = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); const n = activeFilterCount(); $('#filterCount').textContent = n ? `(${n})` : ''; $('#clearFilters').hidden = !n; }, 160);
    });
    $('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
    $('#clearFilters').addEventListener('click', clearFilters);
    $('#filterToggle').addEventListener('click', e => {
      const p = $('#filterPanel');
      const open = p.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });

    // checkout form
    const f = $('#checkoutForm');
    f.addEventListener('submit', submitCheckout);
    f.addEventListener('change', e => { if (e.target.name === 'payment') checkoutSummary(); });
    f.elements.phone.addEventListener('input', e => e.target.setCustomValidity(''));
    $('#checkoutModal').addEventListener('close', () => {
      if (!$('#coDone').hidden) { $('#coDone').hidden = true; $('#coForm').hidden = false; }
    });

    // close dialogs when tapping outside the panel
    $$('dialog').forEach(d => {
      d.addEventListener('click', e => {
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
      });
      // a toast shown inside this popup moves back to the page when it closes
      d.addEventListener('close', () => {
        const t = $('#toast');
        if (!d.contains(t)) return;
        const showing = t.classList.contains('show');
        hideToast();
        ($$('dialog[open]').pop() || document.body).appendChild(t);
        if (showing) { try { t.showPopover(); } catch { /* fallback */ } t.classList.add('show'); }
      });
    });

    // keep bag in sync across tabs
    window.addEventListener('storage', e => {
      if (e.key === `${KEY}.bag`) { bag = load('bag', []).filter(i => byId.has(i.id)); updateCounts(); renderBag(); }
    });
  }

  // ---- start ----------------------------------------------------------
  renderStatic();
  refresh();
  renderBag();
  updateCounts();
  bind();
})();
