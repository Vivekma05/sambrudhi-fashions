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
  const TOKEN_KEY = 'shopAdmin.token';
  const MAX_PHOTOS = 6;
  const CATS = { sarees: 'Saree', bangles: 'Bangles', combos: 'Combo' };
  const OCCASIONS = ['Wedding', 'Festive', 'Party', 'Office', 'Daily'];
  const SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'];
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

  const st = { token: '', branch: 'main', head: '', products: [], cat: 'all', q: '' };
  const tokenStore = {
    get() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
    set(v) { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } }
  };

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
    logout: svgI('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>')
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

  function parseProducts(text) {
    const a = text.indexOf('/*DATA*/'), b = text.lastIndexOf('/*END*/');
    if (a < 0 || b < a) throw Object.assign(new Error('js/products.js is not in the admin format (the /*DATA*/ … /*END*/ markers are missing).'), { friendly: true });
    return JSON.parse(text.slice(a + 8, b));
  }

  function serialize(list) {
    return `/* =====================================================================
   PRODUCTS — managed from the admin page (admin.html).
   You can still edit this file by hand: keep everything between the
   DATA and END markers valid JSON (double quotes, no trailing commas).
   Products marked "sample": true are the example items the site
   started with; remove them from the admin page.
   ===================================================================== */
window.PRODUCTS = /*DATA*/${JSON.stringify(list, null, 2)}/*END*/;
`;
  }

  async function loadRemote() {
    const ref = await gh(`/git/ref/heads/${st.branch}`);
    const head = ref.object.sha;
    const file = await gh(`/contents/${PRODUCTS_PATH}?ref=${head}`);
    return { head, products: parseProducts(fromB64(file.content)) };
  }

  /* Apply `mutate` to the latest product list and save it (plus any new
     photos, minus photos no longer used) as one commit. Re-reads the list
     first, so changes made on another phone are not lost. */
  async function commit(message, mutate, newImages = []) {
    const blobs = [];
    for (const img of newImages) {
      const b = await gh('/git/blobs', { method: 'POST', body: { content: img.base64, encoding: 'base64' } });
      blobs.push({ path: img.path, sha: b.sha });
    }
    for (let attempt = 0; ; attempt++) {
      const { head, products } = await loadRemote();
      const after = mutate(JSON.parse(JSON.stringify(products)));
      const used = new Set(after.flatMap(p => p.images || []));
      const gone = [...new Set(products.flatMap(p => p.images || []))].filter(x => x.startsWith(IMG_DIR) && !used.has(x));
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
      st.products = after;
      renderList();
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
    ['connectView', 'loadingView', 'listView'].forEach(v => { $('#' + v).hidden = v !== name; });
    $('#logoutBtn').hidden = name !== 'listView';
  }

  async function connect(token, fromForm) {
    st.token = token;
    view('loadingView');
    $('#loadingText').textContent = 'Opening your products…';
    try {
      const info = await gh('');
      st.branch = info.default_branch || 'main';
      const r = await loadRemote();
      st.head = r.head;
      st.products = r.products;
      tokenStore.set(token);
      view('listView');
      renderList();
      if (fromForm) toast('Connected! You can now add and edit products.');
    } catch (e) {
      console.error(e);
      tokenStore.set('');
      st.token = '';
      showConnect(friendly(e));
    }
  }

  function disconnect(message) {
    tokenStore.set('');
    st.token = '';
    showConnect(message || '');
  }

  function showConnect(error) {
    const [owner, name] = REPO.split('/');
    $('#repoOwner').textContent = owner || 'your account';
    $('#repoName').textContent = name || 'your shop repository';
    const err = $('#connectError');
    err.textContent = error || '';
    err.hidden = !error;
    view('connectView');
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

    const tabs = [['all', 'All', all.length]].concat(Object.entries(CATS).map(([k, l]) => [k, l === 'Saree' ? 'Sarees' : l === 'Combo' ? 'Combos' : l, all.filter(p => p.category === k).length]));
    $('#adminTabs').innerHTML = tabs.map(([k, l, n]) => `<button type="button" class="tab ${st.cat === k ? 'on' : ''}" data-tab="${k}" aria-pressed="${st.cat === k}">${l}<span class="tab-n">${n}</span></button>`).join('');

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
          <p class="prow-meta">${CATS[p.category] || p.category}${p.type ? ' · ' + esc(p.type) : ''}${p.images && p.images.length ? ` · ${p.images.length} photo${p.images.length > 1 ? 's' : ''}` : ''}</p>
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
    const cat = p ? p.category : (st.cat !== 'all' ? st.cat : 'sarees');
    $$('input[name="category"]', f).forEach(r => { r.checked = r.value === cat; });
    f.elements.name.value = p ? p.name : '';
    f.elements.type.value = p ? (p.type || '') : '';
    f.elements.price.value = p ? p.price : '';
    f.elements.mrp.value = p && p.mrp > p.price ? p.mrp : '';
    f.elements.description.value = p ? (p.description || '') : '';
    f.elements.details.value = p ? (p.details || []).join('\n') : '';
    f.elements.badge.value = p ? (p.badge || '') : '';
    f.elements.inStock.checked = !p || p.inStock !== false;
    f.elements.isNew.checked = p ? !!p.isNew : true;
    $('#edSizes').innerHTML = checkList('sizes', SIZES.map(s => [s, s]), p && p.sizes ? p.sizes : SIZES);
    $('#edColors').innerHTML = checkList('colors', Object.entries(COLORS).map(([k, v]) => [k, v[0]]), p ? p.colors || [] : [], true);
    $('#edOcc').innerHTML = checkList('occasions', OCCASIONS.map(o => [o, o]), p ? p.occasions || [] : []);
    $('#typeList').innerHTML = [...new Set(st.products.map(x => x.type).filter(Boolean))].map(t => `<option value="${esc(t)}">`).join('');
    photos = p && p.images ? p.images.map(path => ({ path })) : [];
    $('#edTitle').textContent = p ? 'Edit product' : 'Add product';
    $('#edDelete').hidden = !p;
    $('#edError').hidden = true;
    $('#edSave').textContent = p ? 'Save changes' : 'Save product';
    syncCategory();
    renderPhotos();
    showOff();
    const d = $('#editor');
    if (!d.open) d.showModal();
    d.scrollTop = 0;
  }

  function currentCategory() { return ($('input[name="category"]:checked') || {}).value || 'sarees'; }
  function syncCategory() { $('#sizeBlock').hidden = currentCategory() === 'sarees'; }

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

  function autoArt(p) {
    const main = p.colors.find(c => c !== 'gold') || p.colors[0];
    const c = ART_HEX[main] || '#7a1230';
    const second = p.colors.find(x => x !== main && x !== 'gold');
    const saree = { body: c, border: second ? ART_HEX[second] : undefined, zari: '#dcb15a', motif: 'buttas', borderStyle: second ? 'temple' : 'zari', sheen: 0.24 };
    const bangles = { style: 'glass', colors: [c, '#d4a64a'], glitter: '#f6d58c' };
    return p.category === 'bangles' ? bangles : p.category === 'combos' ? { saree, bangles } : saree;
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
    const sizes = picked('sizes');
    if (category !== 'sarees' && !sizes.length) return editorError('Please tick at least one bangle size.');
    const colors = picked('colors');

    const id = editing ? editing.id : `${category[0]}-${Date.now().toString(36)}`;
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
    if (category !== 'sarees') p.sizes = SIZES.filter(s => sizes.includes(s));
    const sameLook = editing && editing.art && editing.category === category && JSON.stringify(editing.colors || []) === JSON.stringify(colors);
    p.art = sameLook ? editing.art : autoArt(p);

    const isNew = !editing;
    try {
      await withBusy(newImages.length ? `Uploading ${newImages.length} photo${newImages.length > 1 ? 's' : ''}…` : 'Saving…', () =>
        commit(`Admin: ${isNew ? 'add' : 'update'} "${name}"`, list => {
          const i = list.findIndex(x => x.id === id);
          if (i >= 0) list[i] = p; else list.unshift(p);
          return list;
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
      await withBusy('Deleting…', () => commit(`Admin: delete "${name}"`, list => list.filter(x => x.id !== id)));
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
        commit(`Admin: ${inStock ? 'back in stock' : 'sold out'} "${p.name}"`, list => list.map(x => {
          if (x.id !== id) return x;
          const y = { ...x };
          if (inStock) delete y.inStock; else y.inStock = false;
          return y;
        })));
      toast(inStock ? 'Back in stock.' : 'Marked as sold out.');
    } catch (e) { input.checked = !inStock; onError(e); }
  }

  async function move(id, dir) {
    const p = st.products.find(x => x.id === id);
    if (!p) return;
    try {
      await withBusy('Moving…', () => commit(`Admin: reorder "${p.name}"`, list => {
        const i = list.findIndex(x => x.id === id), j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return list;
        [list[i], list[j]] = [list[j], list[i]];
        return list;
      }));
    } catch (e) { onError(e); }
  }

  async function removeSamples() {
    const n = st.products.filter(p => p.sample).length;
    if (!n || !confirm(`Remove all ${n} sample products from your website? Your own products stay.`)) return;
    try {
      await withBusy('Removing samples…', () => commit('Admin: remove sample products', list => list.filter(p => !p.sample)));
      toast('Samples removed. Your website updates in 1–2 minutes.');
    } catch (e) { onError(e); }
  }

  // ---- events ---------------------------------------------------------------------
  function bind() {
    $('#connectForm').addEventListener('submit', e => {
      e.preventDefault();
      const t = $('#tokenInput').value.trim();
      if (t) connect(t, true);
    });
    $('#logoutBtn').addEventListener('click', () => {
      if (confirm('Disconnect this phone? You will need the GitHub key again to make changes here.')) disconnect();
    });
    $('#addBtn').addEventListener('click', () => openEditor(null));
    $('#removeSamples').addEventListener('click', removeSamples);
    $('#adminSearch').addEventListener('input', e => { st.q = e.target.value; renderList(); });
    $('#editForm').addEventListener('submit', saveProduct);
    $('#edDelete').addEventListener('click', deleteProduct);
    $('#editForm').addEventListener('input', e => { if (e.target.name === 'price' || e.target.name === 'mrp') showOff(); });

    document.addEventListener('change', e => {
      if (e.target.id === 'edFile') { const files = e.target.files; if (files && files.length) addFiles(files); return; }
      if (e.target.name === 'category') { syncCategory(); return; }
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
    });

    const ed = $('#editor');
    ed.addEventListener('click', e => {
      if (e.target !== ed) return;
      const r = ed.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) ed.close();
    });
    ed.addEventListener('close', () => {
      const t = $('#toast');
      if (ed.contains(t)) document.body.appendChild(t);
    });
  }

  // ---- start ---------------------------------------------------------------------
  $$('[data-shop-name]').forEach(el => { el.textContent = S.name || el.textContent; });
  $$('[data-i]').forEach(el => { el.outerHTML = ICON[el.dataset.i] || ''; });
  $('#repoLine').textContent = REPO ? `Saving to github.com/${REPO}.` : '';
  bind();
  const saved = tokenStore.get();
  if (!REPO) showConnect('The repository is not set. Add githubRepo in js/shop-config.js.');
  else if (saved) connect(saved, false);
  else showConnect('');
})();
