/* =====================================================================
   admin.js — the shop owner's product manager (admin.html).
   Products and photos are saved straight into the GitHub repository
   that hosts the website (one commit per save), using a GitHub token
   that is kept only on this device. GitHub Pages then republishes the
   site, usually within a minute or two.
   ===================================================================== */
(() => {
  'use strict';

  const S = window.SHOP || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

  const PRODUCTS_PATH = 'js/products.js';
  const IMG_DIR = 'images/products/';
  const LEGACY_TOKEN_KEY = 'shopAdmin.token';   // plain token saved by the first version (moved into the PIN vault)
  const VAULT_KEY = 'shopAdmin.vault';           // token encrypted with the PIN
  const FAILS_KEY = 'shopAdmin.pinFails';
  const MAX_PIN_FAILS = 5;
  const LOCK_AFTER_MS = 10 * 60 * 1000;          // lock again after 10 minutes away from the page
  const MAX_PHOTOS = 6;
  const OCCASIONS = ['Wedding', 'Festive', 'Party', 'Office', 'Daily'];
  const BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'];
  // used only if the catalogue file has no categories yet
  const DEFAULT_CATS = [
    { id: 'sarees', name: 'Sarees', description: 'Silk, cotton, georgette & more', art: 'saree', sizes: [] },
    { id: 'bangles', name: 'Bangles', description: 'Glass, kundan, thread & lac', art: 'bangles', sizes: BANGLE_SIZES },
    { id: 'combos', name: 'Combos', description: 'Saree + matching bangles', art: 'combo', sizes: BANGLE_SIZES }
  ];
  const ART_KINDS = { saree: 'Saree picture', bangles: 'Bangles picture', combo: 'Saree + bangles picture', plain: 'Simple pattern' };
  const COLORS = {
    red: ['Red', '#c0142f'], maroon: ['Maroon', '#6e1028'], pink: ['Pink', '#e0457b'],
    orange: ['Orange', '#e8743b'], yellow: ['Yellow', '#e3b10f'], green: ['Green', '#157a55'],
    blue: ['Blue', '#1f4e8c'], purple: ['Purple', '#6f3fa0'], black: ['Black', '#1d1d24'],
    white: ['Ivory', '#f3ead7'], gold: ['Gold', '#c9973f']
  };
  // colours used to draw a picture for products that have no photo yet
  const ART_HEX = {
    red: '#b3122e', maroon: '#7a1230', pink: '#c2185b', orange: '#e46a35', yellow: '#d39b12', green: '#0f5e46',
    blue: '#22385e', purple: '#5d2a8a', black: '#1d1d24', white: '#f1e7d2', gold: '#c9973f'
  };

  // ---- which repository to save into ------------------------------------
  function detectRepo() {
    const m = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (m) {
      const seg = location.pathname.split('/').filter(Boolean)[0];
      return seg && !/\.html?$/i.test(seg) ? `${m[1]}/${seg}` : `${m[1]}/${m[1]}.github.io`;
    }
    return S.githubRepo || '';
  }
  const REPO = detectRepo();

  const st = { token: '', branch: 'main', head: '', categories: [], products: [], cat: 'all', q: '' };
  const catOf = id => st.categories.find(c => c.id === id);
  const catLabel = id => (catOf(id) || {}).name || id;
  const countIn = id => st.products.filter(p => p.category === id).length;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage blocked */ } }
  };

  // ---- PIN vault: the GitHub token is stored encrypted (AES-GCM, key from PIN via PBKDF2) --
  const te = new TextEncoder(), td = new TextDecoder();
  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64Bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const cryptoOk = () => !!(window.crypto && crypto.subtle);

  async function pinKey(pin, salt, iterations) {
    const base = await crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function sealToken(token, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 310000;
    const key = await pinKey(pin, salt, iter);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(token));
    return { v: 1, iter, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) };
  }
  async function openToken(vault, pin) {
    const key = await pinKey(pin, fromB64Bytes(vault.salt), vault.iter);
    return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64Bytes(vault.iv) }, key, fromB64Bytes(vault.ct)));
  }
  function loadVault() { try { const v = JSON.parse(ls.get(VAULT_KEY)); return v && v.ct ? v : null; } catch { return null; } }
  function pinProblem(pin, again) {
    if (!/^\d{4,8}$/.test(pin)) return 'The PIN must be 4 to 8 numbers.';
    if (again !== undefined && pin !== again) return "The two PINs don't match. Please type them again.";
    return '';
  }

  // ---- icons ----------------------------------------------------------------
  const svgI = inner => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ICON = {
    plus: svgI('<path d="M12 5v14M5 12h14"/>'),
    close: svgI('<path d="M6 6l12 12M18 6L6 18"/>'),
    search: svgI('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    up: svgI('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    down: svgI('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    trash: svgI('<path d="M4 7h16M9 7V5h6v2M6.5 7l1 12h9l1-12M10 11v5M14 11v5"/>'),
    camera: svgI('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    star: svgI('<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>'),
    lock: svgI('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    tag: svgI('<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.5"/>')
  };

  // ---- GitHub API -------------------------------------------------------------
  async function gh(path, opts = {}) {
    let res;
    try {
      res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
        method: opts.method || 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${st.token}`,
          ...(opts.body ? { 'Content-Type': 'application/json' } : {})
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
    } catch {
      throw Object.assign(new Error('No internet connection — check your network and try again.'), { friendly: true });
    }
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).message || msg; } catch { /* no body */ }
      throw Object.assign(new Error(msg), { status: res.status });
    }
    return res.status === 204 ? null : res.json();
  }

  const fromB64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

  // The catalogue file holds { categories, products } as JSON between /*DATA*/ and /*END*/.
  function parseCatalog(text) {
    const a = text.indexOf('/*DATA*/'), b = text.lastIndexOf('/*END*/');
    if (a < 0 || b < a) throw Object.assign(new Error('js/products.js is not in the admin format (the /*DATA*/ … /*END*/ markers are missing).'), { friendly: true });
    const data = JSON.parse(text.slice(a + 8, b));
    const fresh = () => DEFAULT_CATS.map(c => ({ ...c, sizes: [...c.sizes] }));
    if (Array.isArray(data)) return { categories: fresh(), products: data };   // older file: products only
    return {
      categories: Array.isArray(data.categories) && data.categories.length ? data.categories : fresh(),
      products: Array.isArray(data.products) ? data.products : []
    };
  }

  function serialize(data) {
    return `/* =====================================================================
   SHOP CATALOGUE — categories and products, managed from the admin page
   (admin.html). You can still edit this file by hand: keep everything
   between the DATA and END markers valid JSON (double quotes, no
   trailing commas). Products marked "sample": true are the example
   items the site started with.
   ===================================================================== */
window.SHOP_DATA = /*DATA*/${JSON.stringify({ categories: data.categories, products: data.products }, null, 2)}/*END*/;
window.CATEGORIES = window.SHOP_DATA.categories;
window.PRODUCTS = window.SHOP_DATA.products;
`;
  }

  async function loadRemote() {
    const ref = await gh(`/git/ref/heads/${st.branch}`);
    const head = ref.object.sha;
    const file = await gh(`/contents/${PRODUCTS_PATH}?ref=${head}`);
    return { head, data: parseCatalog(fromB64(file.content)) };
  }

  /* Apply `mutate` to the latest catalogue ({ categories, products }) and save
     it (plus any new photos, minus photos no longer used) as one commit.
     Re-reads the catalogue first, so changes made on another phone are not lost. */
  async function commit(message, mutate, newImages = []) {
    const blobs = [];
    for (const img of newImages) {
      const b = await gh('/git/blobs', { method: 'POST', body: { content: img.base64, encoding: 'base64' } });
      blobs.push({ path: img.path, sha: b.sha });
    }
    for (let attempt = 0; ; attempt++) {
      const { head, data } = await loadRemote();
      const after = mutate(JSON.parse(JSON.stringify(data)));
      const used = new Set(after.products.flatMap(p => p.images || []));
      const gone = [...new Set(data.products.flatMap(p => p.images || []))].filter(x => x.startsWith(IMG_DIR) && !used.has(x));
      const base = await gh(`/git/commits/${head}`);
      let remove = [];
      if (gone.length) {
        const t = await gh(`/git/trees/${base.tree.sha}?recursive=1`);
        const have = new Set(t.tree.map(e => e.path));
        remove = gone.filter(x => have.has(x));
      }
      const tree = [
        ...blobs.map(b => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
        { path: PRODUCTS_PATH, mode: '100644', type: 'blob', content: serialize(after) },
        ...remove.map(path => ({ path, mode: '100644', type: 'blob', sha: null }))
      ];
      const nt = await gh('/git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree } });
      const nc = await gh('/git/commits', { method: 'POST', body: { message, tree: nt.sha, parents: [head] } });
      try {
        await gh(`/git/refs/heads/${st.branch}`, { method: 'PATCH', body: { sha: nc.sha, force: false } });
      } catch (e) {
        if (e.status === 422 && attempt < 2) continue;   // someone else saved at the same moment — retry on top
        throw e;
      }
      st.head = nc.sha;
      st.categories = after.categories;
      st.products = after.products;
      renderList();
      if ($('#catsDialog').open) renderCats();
      return after;
    }
  }

  // ---- errors, busy, toast ------------------------------------------------------
  function friendly(e) {
    if (e.friendly) return e.message;
    if (e.status === 401) return 'GitHub did not accept the key — it may be wrong or expired. Please connect again.';
    if (e.status === 403) return 'This key is not allowed to save. Make sure Contents is set to "Read and write" for the repository.';
    if (e.status === 404) return `Can't find the repository ${REPO}. Make sure the key has access to it.`;
    if (e.status === 422) return 'GitHub refused the change. Reload the page and try again.';
    return 'Something went wrong: ' + e.message;
  }

  function onError(e) {
    console.error(e);
    if (e.status === 401) { disconnect(friendly(e)); return; }
    alert(friendly(e));
  }

  function showBusy(text) {
    const b = $('#busy');
    $('#busyText').textContent = text;
    try { if (b.matches(':popover-open')) b.hidePopover(); b.showPopover(); } catch { /* fallback below */ }
    b.classList.add('show');
  }
  function hideBusy() {
    const b = $('#busy');
    b.classList.remove('show');
    try { if (b.matches(':popover-open')) b.hidePopover(); } catch { /* no popover */ }
  }
  async function withBusy(text, fn) {
    showBusy(text);
    try { return await fn(); } finally { hideBusy(); }
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    const host = $$('dialog[open]').pop() || document.body;
    if (t.parentElement !== host) { try { if (t.matches(':popover-open')) t.hidePopover(); } catch { /* */ } host.appendChild(t); }
    t.innerHTML = `<span>${esc(msg)}</span>`;
    try { if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch { /* */ }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('show'); try { t.hidePopover(); } catch { /* */ } }, 4200);
  }

  // ---- views -------------------------------------------------------------------
  function view(name) {
    ['connectView', 'pinView', 'loadingView', 'listView'].forEach(v => { $('#' + v).hidden = v !== name; });
    $('#lockBtn').hidden = name !== 'listView';
  }

  // Check the token with GitHub and load the products. Returns null on success, or the error.
  async function openShop(token) {
    st.token = token;
    view('loadingView');
    $('#loadingText').textContent = 'Opening your products…';
    try {
      const info = await gh('');
      st.branch = info.default_branch || 'main';
      const r = await loadRemote();
      st.head = r.head;
      st.categories = r.data.categories;
      st.products = r.data.products;
      view('listView');
      renderList();
      return null;
    } catch (e) {
      console.error(e);
      st.token = '';
      return e;
    }
  }

  function disconnect(message) {
    ls.set(VAULT_KEY, null);
    ls.set(LEGACY_TOKEN_KEY, null);
    ls.set(FAILS_KEY, null);
    st.token = '';
    if ($('#editor').open) $('#editor').close();
    showConnect(message || '');
  }

  function lock() {
    st.token = '';
    st.products = [];
    $$('dialog[open]').forEach(d => d.close());
    $('#plist').innerHTML = '';
    showPin('unlock');
  }

  function showConnect(error) {
    const [owner, name] = REPO.split('/');
    $('#repoOwner').textContent = owner || 'your account';
    $('#repoName').textContent = name || 'your shop repository';
    const f = $('#connectForm');
    f.reset();
    const err = $('#connectError');
    err.textContent = error || '';
    err.hidden = !error;
    view('connectView');
  }

  let pinMode = 'unlock';   // 'unlock' = type PIN to open; 'create' = protect an already-saved token with a new PIN
  function showPin(mode, error) {
    pinMode = mode;
    const create = mode === 'create';
    $('#pinTitle').textContent = create ? 'Create a PIN' : 'Enter your PIN';
    $('#pinText').textContent = create
      ? 'Protect the admin page on this phone. You will type this PIN each time you open it.'
      : 'The admin page is locked. Type your PIN to manage products.';
    $('#pinLabel').textContent = create ? 'New PIN (4–8 numbers)' : 'PIN';
    $('#pin2Field').hidden = !create;
    $('#pinInput2').required = create;
    $('#pinSubmit').textContent = create ? 'Save PIN' : 'Unlock';
    $('#forgotPin').hidden = create;
    $('#pinForm').reset();
    const err = $('#pinError');
    err.textContent = error || '';
    err.hidden = !error;
    view('pinView');
    setTimeout(() => $('#pinInput').focus(), 50);
  }

  async function submitConnect(e) {
    e.preventDefault();
    const f = e.target;
    const token = f.elements.token.value.trim();
    const pin = f.elements.pin.value, pin2 = f.elements.pin2.value;
    const err = $('#connectError');
    const problem = !token ? 'Please paste your GitHub token.' : pinProblem(pin, pin2) || (cryptoOk() ? '' : 'This browser cannot lock the key with a PIN. Please open the admin page in Chrome or Safari.');
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    const failure = await openShop(token);
    if (failure) { showConnect(friendly(failure)); return; }
    ls.set(VAULT_KEY, JSON.stringify(await sealToken(token, pin)));
    ls.set(LEGACY_TOKEN_KEY, null);
    ls.set(FAILS_KEY, null);
    toast('Connected and locked with your PIN.');
  }

  async function submitPin(e) {
    e.preventDefault();
    const pin = $('#pinInput').value;
    const err = $('#pinError');
    const showErr = msg => { err.textContent = msg; err.hidden = false; $('#pinInput').value = ''; $('#pinInput').focus(); };
    const btn = $('#pinSubmit');
    const label = btn.textContent;

    if (pinMode === 'create') {
      const problem = pinProblem(pin, $('#pinInput2').value) || (cryptoOk() ? '' : 'This browser cannot lock the key with a PIN. Please open the admin page in Chrome or Safari.');
      if (problem) return showErr(problem);
      const token = ls.get(LEGACY_TOKEN_KEY) || '';
      if (!token) return showConnect('');
      btn.disabled = true; btn.textContent = 'Saving…';
      ls.set(VAULT_KEY, JSON.stringify(await sealToken(token, pin)));
      ls.set(LEGACY_TOKEN_KEY, null);
      btn.disabled = false; btn.textContent = label;
      const failure = await openShop(token);
      if (failure) { failure.status === 401 ? disconnect(friendly(failure)) : showPin('unlock', friendly(failure)); return; }
      toast('PIN saved. The admin page is now locked with it.');
      return;
    }

    const vault = loadVault();
    if (!vault) return showConnect('');
    if (!/^\d{4,8}$/.test(pin)) return showErr('Type your PIN (4 to 8 numbers).');
    btn.disabled = true; btn.textContent = 'Checking…';
    let token = '';
    try { token = await openToken(vault, pin); } catch { token = ''; }
    btn.disabled = false; btn.textContent = label;
    if (!token) {
      const fails = (Number(ls.get(FAILS_KEY)) || 0) + 1;
      if (fails >= MAX_PIN_FAILS) {
        disconnect(`Too many wrong PINs, so this phone was disconnected for safety. Connect again with a GitHub token (and delete the old token on GitHub if you think someone else tried).`);
        return;
      }
      ls.set(FAILS_KEY, String(fails));
      const left = MAX_PIN_FAILS - fails;
      return showErr(`Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left before this phone is disconnected.`);
    }
    ls.set(FAILS_KEY, null);
    const failure = await openShop(token);
    if (failure) { failure.status === 401 ? disconnect(friendly(failure)) : showPin('unlock', friendly(failure)); }
  }

  // ---- product list --------------------------------------------------------------
  const imgUrl = path => /^(https?:|data:)/.test(path) ? path : `https://raw.githubusercontent.com/${REPO}/${st.head}/${path}`;
  const thumb = p => (p.images && p.images.length)
    ? `<img src="${esc(imgUrl(p.images[0]))}" alt="" loading="lazy">`
    : Art.draw(p);

  function renderList() {
    const all = st.products;
    const out = all.filter(p => p.inStock === false).length;
    $('#countLine').textContent = `${all.length} product${all.length === 1 ? '' : 's'} on your website${out ? ` · ${out} sold out` : ''}`;

    const samples = all.filter(p => p.sample).length;
    $('#sampleBanner').hidden = !samples;
    $('#sampleCount').textContent = `${samples} sample product${samples === 1 ? '' : 's'} still showing.`;

    if (st.cat !== 'all' && !catOf(st.cat)) st.cat = 'all';
    const tabs = [['all', 'All', all.length]].concat(st.categories.map(c => [c.id, c.name, countIn(c.id)]));
    $('#adminTabs').innerHTML = tabs.map(([k, l, n]) => `<button type="button" class="tab ${st.cat === k ? 'on' : ''}" data-tab="${esc(k)}" aria-pressed="${st.cat === k}">${esc(l)}<span class="tab-n">${n}</span></button>`).join('');

    const q = st.q.trim().toLowerCase();
    const list = all.filter(p => (st.cat === 'all' || p.category === st.cat) && (!q || `${p.name} ${p.type}`.toLowerCase().includes(q)));
    if (!list.length) {
      $('#plist').innerHTML = `<div class="empty"><h3>${all.length ? 'No products here' : 'No products yet'}</h3><p>Tap <strong>Add product</strong> to put your first item on the website.</p></div>`;
      return;
    }
    $('#plist').innerHTML = list.map(p => {
      const i = all.indexOf(p);
      const sold = p.inStock === false;
      return `<div class="prow ${sold ? 'is-out' : ''}">
        <button type="button" class="prow-pic" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">${thumb(p)}</button>
        <div class="prow-info">
          <p class="prow-name">${esc(p.name)}</p>
          <p class="prow-meta">${esc(catLabel(p.category))}${p.type ? ' · ' + esc(p.type) : ''}${p.images && p.images.length ? ` · ${p.images.length} photo${p.images.length > 1 ? 's' : ''}` : ''}</p>
          <p class="prow-price">${money(p.price)}${p.mrp > p.price ? `<s>${money(p.mrp)}</s>` : ''}</p>
          ${p.sample || sold ? `<div class="prow-tags">${p.sample ? '<span class="ptag sample">Sample</span>' : ''}${sold ? '<span class="ptag out">Sold out</span>' : ''}</div>` : ''}
        </div>
        <div class="prow-actions">
          <label class="stock-toggle"><span class="switch"><input type="checkbox" data-stock="${esc(p.id)}" ${sold ? '' : 'checked'}><span></span></span>In stock</label>
          <div class="order">
            <button type="button" class="icon-btn sm" data-move="-1" data-id="${esc(p.id)}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
            <button type="button" class="icon-btn sm" data-move="1" data-id="${esc(p.id)}" aria-label="Move down" ${i === all.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
            <button type="button" class="btn btn-sm btn-soft" data-edit="${esc(p.id)}">Edit</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ---- editor --------------------------------------------------------------------
  let editing = null;   // product being edited (null = new)
  let photos = [];      // [{ path }] existing, or [{ dataUrl, base64 }] new

  function checkList(name, items, selected, colours) {
    return items.map(([val, label]) => `<label><input type="checkbox" name="${name}" value="${esc(val)}" ${selected.includes(val) ? 'checked' : ''}><span>${colours ? `<i class="sw" style="--c:${COLORS[val][1]}"></i>` : ''}${esc(label)}</span></label>`).join('');
  }

  function openEditor(p) {
    editing = p || null;
    const f = $('#editForm');
    f.reset();
    const first = (st.categories[0] || {}).id;
    const cat = p && catOf(p.category) ? p.category : (!p && catOf(st.cat) ? st.cat : first);
    renderEditorCats(cat);
    f.elements.name.value = p ? p.name : '';
    f.elements.type.value = p ? (p.type || '') : '';
    f.elements.price.value = p ? p.price : '';
    f.elements.mrp.value = p && p.mrp > p.price ? p.mrp : '';
    f.elements.description.value = p ? (p.description || '') : '';
    f.elements.details.value = p ? (p.details || []).join('\n') : '';
    f.elements.badge.value = p ? (p.badge || '') : '';
    f.elements.inStock.checked = !p || p.inStock !== false;
    f.elements.isNew.checked = p ? !!p.isNew : true;
    renderSizes(p && p.category === cat && p.sizes ? p.sizes : null);
    $('#edColors').innerHTML = checkList('colors', Object.entries(COLORS).map(([k, v]) => [k, v[0]]), p ? p.colors || [] : [], true);
    $('#edOcc').innerHTML = checkList('occasions', OCCASIONS.map(o => [o, o]), p ? p.occasions || [] : []);
    $('#typeList').innerHTML = [...new Set(st.products.map(x => x.type).filter(Boolean))].map(t => `<option value="${esc(t)}">`).join('');
    photos = p && p.images ? p.images.map(path => ({ path })) : [];
    $('#edTitle').textContent = p ? 'Edit product' : 'Add product';
    $('#edDelete').hidden = !p;
    $('#edError').hidden = true;
    $('#edSave').textContent = p ? 'Save changes' : 'Save product';
    renderPhotos();
    showOff();
    const d = $('#editor');
    if (!d.open) d.showModal();
    d.scrollTop = 0;
  }

  // category choices in the product form, plus a shortcut to create a new one
  function renderEditorCats(selected) {
    $('#edCat').innerHTML = st.categories.map(c => `<label><input type="radio" name="category" value="${esc(c.id)}" ${c.id === selected ? 'checked' : ''}><span>${esc(c.name)}</span></label>`).join('') +
      `<button type="button" class="seg-add" data-new-cat>${ICON.plus} New category</button>`;
  }

  function currentCategory() { return ($('input[name="category"]:checked') || {}).value || (st.categories[0] || {}).id; }
  // size checkboxes come from the chosen category; `selected` null = all ticked
  function renderSizes(selected) {
    const sizes = (catOf(currentCategory()) || {}).sizes || [];
    $('#sizeBlock').hidden = !sizes.length;
    $('#edSizes').innerHTML = checkList('sizes', sizes.map(s => [s, s]), selected || sizes);
  }

  function showOff() {
    const f = $('#editForm');
    const price = Number(f.elements.price.value), mrp = Number(f.elements.mrp.value);
    $('#edOff').textContent = price > 0 && mrp > price ? `Customers see ${Math.round((1 - price / mrp) * 100)}% off` : '';
  }

  function renderPhotos() {
    $('#edPhotos').innerHTML = photos.map((ph, i) => `
      <div class="ph">
        <img src="${esc(ph.dataUrl || imgUrl(ph.path))}" alt="Photo ${i + 1}">
        ${i === 0 ? '<span class="ph-main">Main</span>' : `<button type="button" class="ph-btn ph-star" data-ph-main="${i}" aria-label="Make this the main photo" title="Make main photo">${ICON.star}</button>`}
        <button type="button" class="ph-btn ph-x" data-ph-remove="${i}" aria-label="Remove photo ${i + 1}">${ICON.close}</button>
      </div>`).join('') +
      (photos.length < MAX_PHOTOS ? `<label class="ph ph-add">${ICON.camera}<span>Add photo</span><input type="file" id="edFile" accept="image/*" multiple></label>` : '');
    $('#photoNote').hidden = photos.length > 0;
  }

  // shrink a photo on the phone before upload (max 1400 px, JPEG)
  function processImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const dataUrl = c.toDataURL('image/jpeg', 0.82);
        resolve({ dataUrl, base64: dataUrl.split(',')[1] });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Couldn't open "${file.name}". Please choose a JPG or PNG photo.`)); };
      img.src = url;
    });
  }

  async function addFiles(files) {
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)).slice(0, room);
    if (files.length > room) toast(`Only ${MAX_PHOTOS} photos per product — extra photos were skipped.`);
    for (const f of list) {
      try { photos.push(await processImage(f)); }
      catch (e) { alert(e.message); }
      renderPhotos();
    }
  }

  // picture settings for a product with no photo, in its main colour, drawn the category's way
  function autoArt(p, cat) {
    const main = p.colors.find(c => c !== 'gold') || p.colors[0];
    const c = ART_HEX[main] || '#7a1230';
    const second = p.colors.find(x => x !== main && x !== 'gold');
    const saree = { body: c, border: second ? ART_HEX[second] : undefined, zari: '#dcb15a', motif: 'buttas', borderStyle: second ? 'temple' : 'zari', sheen: 0.24 };
    const bangles = { style: 'glass', colors: [c, '#d4a64a'], glitter: '#f6d58c' };
    switch ((cat || {}).art) {
      case 'saree': return saree;
      case 'bangles': return bangles;
      case 'combo': return { saree, bangles };
      default: return { kind: 'plain', color: c, label: cat ? cat.name : '' };
    }
  }

  function editorError(msg, field) {
    const e = $('#edError');
    e.textContent = msg;
    e.hidden = false;
    if (field) field.focus();
    e.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  async function saveProduct(ev) {
    ev.preventDefault();
    const f = ev.target;
    $('#edError').hidden = true;
    const name = f.elements.name.value.trim();
    const price = Math.round(Number(f.elements.price.value));
    const mrpRaw = f.elements.mrp.value.trim();
    const mrp = mrpRaw ? Math.round(Number(mrpRaw)) : price;
    if (!name) return editorError('Please type the product name.', f.elements.name);
    if (!(price > 0)) return editorError('Please type the selling price (numbers only, e.g. 2499).', f.elements.price);
    if (mrpRaw && !(mrp >= price)) return editorError('The original price should be more than the selling price — or leave it empty.', f.elements.mrp);

    const category = currentCategory();
    const picked = n => $$(`input[name="${n}"]:checked`, f).map(i => i.value);
    const cat = catOf(category);
    if (!cat) return editorError('Please choose a category.');
    const catSizes = cat.sizes || [];
    const sizes = picked('sizes');
    if (catSizes.length && !sizes.length) return editorError('Please tick at least one size.');
    const colors = picked('colors');

    const id = editing ? editing.id : `${(category.replace(/[^a-z0-9]/gi, '')[0] || 'p').toLowerCase()}-${Date.now().toString(36)}`;
    const stamp = Date.now().toString(36);
    const newImages = [];
    const images = photos.map((ph, i) => {
      if (ph.path) return ph.path;
      const path = `${IMG_DIR}${id}-${stamp}-${i}.jpg`;
      newImages.push({ path, base64: ph.base64 });
      return path;
    });

    const p = {
      id, category,
      type: f.elements.type.value.trim(),
      name, price, mrp,
      occasions: picked('occasions'),
      colors,
      description: f.elements.description.value.trim(),
      details: f.elements.details.value.split('\n').map(s => s.trim()).filter(Boolean),
      images
    };
    const badge = f.elements.badge.value.trim();
    if (badge) p.badge = badge;
    if (f.elements.isNew.checked) p.isNew = true;
    if (!f.elements.inStock.checked) p.inStock = false;
    if (catSizes.length) p.sizes = catSizes.filter(s => sizes.includes(s));
    const sameLook = editing && editing.art && editing.category === category && JSON.stringify(editing.colors || []) === JSON.stringify(colors);
    p.art = sameLook ? editing.art : autoArt(p, cat);

    const isNew = !editing;
    try {
      await withBusy(newImages.length ? `Uploading ${newImages.length} photo${newImages.length > 1 ? 's' : ''}…` : 'Saving…', () =>
        commit(`Admin: ${isNew ? 'add' : 'update'} "${name}"`, data => {
          const i = data.products.findIndex(x => x.id === id);
          if (i >= 0) data.products[i] = p; else data.products.unshift(p);
          return data;
        }, newImages));
      $('#editor').close();
      toast(isNew ? 'Product added! It shows on your website in 1–2 minutes.' : 'Saved! Your website updates in 1–2 minutes.');
    } catch (e) { onError(e); }
  }

  async function deleteProduct() {
    if (!editing) return;
    if (!confirm(`Delete "${editing.name}" from your website? Its photos are deleted too.`)) return;
    const id = editing.id, name = editing.name;
    try {
      await withBusy('Deleting…', () => commit(`Admin: delete "${name}"`, data => ({ ...data, products: data.products.filter(x => x.id !== id) })));
      $('#editor').close();
      toast('Deleted. Your website updates in 1–2 minutes.');
    } catch (e) { onError(e); }
  }

  // ---- quick actions on the list ----------------------------------------------------
  async function setStock(id, inStock, input) {
    const p = st.products.find(x => x.id === id);
    if (!p) return;
    try {
      await withBusy(inStock ? 'Marking in stock…' : 'Marking sold out…', () =>
        commit(`Admin: ${inStock ? 'back in stock' : 'sold out'} "${p.name}"`, data => ({
          ...data,
          products: data.products.map(x => {
            if (x.id !== id) return x;
            const y = { ...x };
            if (inStock) delete y.inStock; else y.inStock = false;
            return y;
          })
        })));
      toast(inStock ? 'Back in stock.' : 'Marked as sold out.');
    } catch (e) { input.checked = !inStock; onError(e); }
  }

  async function move(id, dir) {
    const p = st.products.find(x => x.id === id);
    if (!p) return;
    try {
      await withBusy('Moving…', () => commit(`Admin: reorder "${p.name}"`, data => {
        const list = data.products;
        const i = list.findIndex(x => x.id === id), j = i + dir;
        if (i >= 0 && j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
        return data;
      }));
    } catch (e) { onError(e); }
  }

  async function removeSamples() {
    const n = st.products.filter(p => p.sample).length;
    if (!n || !confirm(`Remove all ${n} sample products from your website? Your own products stay.`)) return;
    try {
      await withBusy('Removing samples…', () => commit('Admin: remove sample products', data => ({ ...data, products: data.products.filter(p => !p.sample) })));
      toast('Samples removed. Your website updates in 1–2 minutes.');
    } catch (e) { onError(e); }
  }

  // ---- categories --------------------------------------------------------------------
  let editingCat = null;   // category being edited (null = new)

  function renderCats() {
    const cats = st.categories;
    $('#catList').innerHTML = cats.map((c, i) => {
      const n = countIn(c.id);
      return `<div class="cat-row">
        <div>
          <strong>${esc(c.name)}</strong>
          <small>${n} product${n === 1 ? '' : 's'}${n ? '' : ' · hidden from customers'} · ${(c.sizes || []).length ? 'Sizes: ' + esc(c.sizes.join(', ')) : 'No sizes'}</small>
          ${c.description ? `<small>${esc(c.description)}</small>` : ''}
        </div>
        <div class="order">
          <button type="button" class="icon-btn sm" data-cat-move="-1" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} up" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button type="button" class="icon-btn sm" data-cat-move="1" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} down" ${i === cats.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button type="button" class="btn btn-sm btn-soft" data-cat-edit="${esc(c.id)}">Edit</button>
        </div>
      </div>`;
    }).join('');
  }

  function openCats() {
    renderCats();
    const d = $('#catsDialog');
    if (!d.open) d.showModal();
  }

  const parseSizes = s => [...new Set(String(s).split(',').map(x => x.trim()).filter(Boolean))].slice(0, 20);

  function openCatEditor(c) {
    editingCat = c || null;
    const f = $('#catForm');
    f.reset();
    f.elements.name.value = c ? c.name : '';
    f.elements.description.value = c ? (c.description || '') : '';
    f.elements.sizes.value = c ? (c.sizes || []).join(', ') : '';
    const art = c ? (c.art || 'plain') : 'plain';
    $$('input[name="art"]', f).forEach(r => { r.checked = r.value === art; });
    $('#ceTitle').textContent = c ? `Edit "${c.name}"` : 'Add category';
    $('#ceSave').textContent = c ? 'Save changes' : 'Add category';
    $('#ceError').hidden = true;
    const box = $('#ceDeleteBox');
    box.hidden = !c;
    if (c) {
      const n = countIn(c.id);
      const others = st.categories.filter(x => x.id !== c.id);
      $('#ceDeleteText').textContent = !others.length
        ? 'This is your only category, so it cannot be deleted. Add another category first.'
        : n ? `This category has ${n} product${n === 1 ? '' : 's'}. Choose where to move ${n === 1 ? 'it' : 'them'} before deleting.` : 'This category has no products.';
      $('#ceMoveField').hidden = !n || !others.length;
      $('#ceMoveTo').innerHTML = others.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
      $('#ceDelete').hidden = !others.length;
    }
    const d = $('#catEditor');
    if (!d.open) d.showModal();
    d.scrollTop = 0;
    setTimeout(() => f.elements.name.focus(), 50);
  }

  function slugify(name, taken) {
    let base = name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '');
    if (!base) base = 'cat-' + Date.now().toString(36);
    let id = base, n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    return id;
  }

  // keep a product's sizes in line with the category it now belongs to
  function fitSizes(p, cat) {
    const sizes = (cat && cat.sizes) || [];
    const y = { ...p };
    if (!sizes.length) delete y.sizes;
    else {
      const keep = (p.sizes || []).filter(s => sizes.includes(s));
      y.sizes = keep.length ? keep : [...sizes];
    }
    return y;
  }

  async function saveCat(ev) {
    ev.preventDefault();
    const f = ev.target;
    const err = msg => { const e = $('#ceError'); e.textContent = msg; e.hidden = false; };
    const name = f.elements.name.value.trim();
    if (!name) return err('Please type a category name.');
    if (st.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && (!editingCat || c.id !== editingCat.id))) return err('There is already a category with this name.');
    const fields = {
      name,
      description: f.elements.description.value.trim(),
      art: ($('input[name="art"]:checked', f) || {}).value || 'plain',
      sizes: parseSizes(f.elements.sizes.value)
    };
    const old = editingCat;
    let applySizes = false;
    let newCatId = '';
    if (old && countIn(old.id) && JSON.stringify(old.sizes || []) !== JSON.stringify(fields.sizes)) {
      const n = countIn(old.id);
      const them = n === 1 ? `the 1 product` : `all ${n} products`;
      applySizes = confirm(fields.sizes.length
        ? `Use the sizes ${fields.sizes.join(', ')} for ${them} in "${name}"?\n\nOK = update ${n === 1 ? 'it' : 'them all'}. Cancel = only new products get these sizes.`
        : `Remove sizes from ${them} in "${name}"?\n\nOK = remove. Cancel = keep the current sizes.`);
    }
    try {
      await withBusy('Saving category…', () => commit(`Admin: ${old ? 'update' : 'add'} category "${name}"`, data => {
        if (old) {
          const i = data.categories.findIndex(c => c.id === old.id);
          if (i < 0) data.categories.push({ id: old.id, ...fields });
          else data.categories[i] = { ...data.categories[i], ...fields };
          if (applySizes) {
            data.products = data.products.map(p => {
              if (p.category !== old.id) return p;
              const y = { ...p };
              if (fields.sizes.length) y.sizes = [...fields.sizes]; else delete y.sizes;
              return y;
            });
          }
        } else {
          newCatId = slugify(name, new Set(data.categories.map(c => c.id)));
          data.categories.push({ id: newCatId, ...fields });
        }
        return data;
      }));
      $('#catEditor').close();
      if ($('#editor').open) {
        // came from the product form: refresh its category choices and select the new one
        const keep = newCatId || currentCategory();
        renderEditorCats(keep);
        renderSizes(null);
        toast(old ? 'Category saved.' : `"${name}" added and selected.`);
      } else {
        toast(old ? 'Category saved.' : `"${name}" added. Add products to it and it appears on your website.`);
      }
    } catch (e) { onError(e); }
  }

  async function deleteCat() {
    const c = editingCat;
    if (!c) return;
    const n = countIn(c.id);
    const target = catOf($('#ceMoveTo').value);
    if (n && !target) return;
    if (!confirm(n ? `Delete "${c.name}" and move its ${n} product${n === 1 ? '' : 's'} to "${target.name}"?` : `Delete the category "${c.name}"?`)) return;
    try {
      await withBusy('Deleting category…', () => commit(`Admin: delete category "${c.name}"${n ? ` (moved ${n} to "${target.name}")` : ''}`, data => {
        const dest = target && data.categories.find(x => x.id === target.id);
        data.categories = data.categories.filter(x => x.id !== c.id);
        if (dest) data.products = data.products.map(p => (p.category === c.id ? fitSizes({ ...p, category: dest.id }, dest) : p));
        return data;
      }));
      $('#catEditor').close();
      toast(n ? `Deleted. ${n} product${n === 1 ? '' : 's'} moved to "${target.name}".` : 'Category deleted.');
    } catch (e) { onError(e); }
  }

  async function moveCat(id, dir) {
    const c = catOf(id);
    if (!c) return;
    try {
      await withBusy('Moving…', () => commit(`Admin: reorder category "${c.name}"`, data => {
        const list = data.categories;
        const i = list.findIndex(x => x.id === id), j = i + dir;
        if (i >= 0 && j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
        return data;
      }));
    } catch (e) { onError(e); }
  }

  // ---- events ---------------------------------------------------------------------
  function bind() {
    $('#connectForm').addEventListener('submit', submitConnect);
    $('#pinForm').addEventListener('submit', submitPin);
    $('#lockBtn').addEventListener('click', lock);
    $('#disconnectBtn').addEventListener('click', () => {
      if (confirm('Disconnect this phone? You will need a GitHub token and a new PIN to make changes here again.')) disconnect();
    });
    $('#forgotPin').addEventListener('click', () => {
      if (confirm('Disconnect this phone? You will need to paste a GitHub token again and choose a new PIN.')) {
        disconnect('Paste your GitHub token and choose a new PIN. If you no longer have the token, create a new one (and delete the old one on GitHub).');
      }
    });
    // lock automatically after being away from the page for a while
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (st.token && hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS && !$('#busy').classList.contains('show')) lock();
    });
    $('#addBtn').addEventListener('click', () => openEditor(null));
    $('#catsBtn').addEventListener('click', openCats);
    $('#addCatBtn').addEventListener('click', () => openCatEditor(null));
    $('#catForm').addEventListener('submit', saveCat);
    $('#ceDelete').addEventListener('click', deleteCat);
    $('#removeSamples').addEventListener('click', removeSamples);
    $('#adminSearch').addEventListener('input', e => { st.q = e.target.value; renderList(); });
    $('#editForm').addEventListener('submit', saveProduct);
    $('#edDelete').addEventListener('click', deleteProduct);
    $('#editForm').addEventListener('input', e => { if (e.target.name === 'price' || e.target.name === 'mrp') showOff(); });

    document.addEventListener('change', e => {
      if (e.target.id === 'edFile') { const files = e.target.files; if (files && files.length) addFiles(files); return; }
      if (e.target.name === 'category' && e.target.closest('#edCat')) { renderSizes(null); return; }
      if (e.target.dataset.stock) setStock(e.target.dataset.stock, e.target.checked, e.target);
    });

    document.addEventListener('click', e => {
      const el = e.target.closest('button');
      if (!el) return;
      const ds = el.dataset;
      if ('close' in ds) { const d = el.closest('dialog'); if (d) d.close(); return; }
      if (ds.tab) { st.cat = ds.tab; renderList(); return; }
      if (ds.edit) { openEditor(st.products.find(p => p.id === ds.edit)); return; }
      if (ds.move) { move(ds.id, Number(ds.move)); return; }
      if (ds.phRemove) { photos.splice(Number(ds.phRemove), 1); renderPhotos(); return; }
      if (ds.phMain) { const [ph] = photos.splice(Number(ds.phMain), 1); photos.unshift(ph); renderPhotos(); return; }
      if (ds.catEdit) { openCatEditor(catOf(ds.catEdit)); return; }
      if ('newCat' in ds) { openCatEditor(null); return; }
      if (ds.catMove) { moveCat(ds.id, Number(ds.catMove)); return; }
      if ('preset' in ds) { $('#ceSizes').value = ds.preset; return; }
    });

    $$('dialog').forEach(d => {
      // tap outside the panel closes it
      d.addEventListener('click', e => {
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
      });
      // a toast shown inside this popup moves back out when it closes
      d.addEventListener('close', () => {
        const t = $('#toast');
        if (!d.contains(t)) return;
        ($$('dialog[open]').pop() || document.body).appendChild(t);
        if (t.classList.contains('show')) { try { t.showPopover(); } catch { /* no popover */ } }
      });
    });
  }

  // ---- start ---------------------------------------------------------------------
  $$('[data-shop-name]').forEach(el => { el.textContent = S.name || el.textContent; });
  $$('[data-i]').forEach(el => { el.outerHTML = ICON[el.dataset.i] || ''; });
  $('#repoLine').textContent = REPO ? `Saving to github.com/${REPO}.` : '';
  bind();
  if (!REPO) showConnect('The repository is not set. Add githubRepo in js/shop-config.js.');
  else if (loadVault()) showPin('unlock');
  else if (ls.get(LEGACY_TOKEN_KEY)) showPin('create');   // connected before PINs existed
  else showConnect('');
})();
