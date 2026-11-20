/*
 * Shared dropdown lists with "+ Add new…".
 *
 * Any <select data-list="texture" data-list-label="texture"> gets a last option
 * "+ Add new…". Choosing it asks for a name, adds it to that list for the whole
 * team (saved under "customLists"), selects it, and then lets the page save the
 * change as usual.
 *
 * Pages build their options with lists.opts(name, builtIn, value, blankLabel),
 * so a new entry shows up in every dropdown that uses the same list
 * (e.g. a new texture appears in In Development, Stock Offerings and
 * Finishing Priorities).
 */
(function(){
  const KEY = 'customLists';
  const NEW = '__new__';
  let custom = {};
  let ready = false;

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  function get(name, base){
    const out = (base || []).slice();
    (custom[name] || []).forEach(v=>{ if(!out.some(x=>same(x, v))) out.push(v); });
    return out;
  }
  // Option HTML: an optional blank first option, the list, the current value if it
  // isn't in the list, then "+ Add new…". `prefix` turns a label into a value
  // (used for custom step types).
  function opts(name, base, val, blank, prefix){
    const p = prefix || '';
    const list = get(name, base);
    let html = blank != null ? `<option value="">${esc(blank)}</option>` : '';
    html += list.map(x=>{ const v = (base||[]).includes(x) ? x : p + x; return `<option value="${esc(v)}" ${v===val?'selected':''}>${esc(x)}</option>`; }).join('');
    if(val && !list.some(x=>x===val || p + x === val)) html += `<option value="${esc(val)}" selected>${esc(p && val.startsWith(p) ? val.slice(p.length) : val)}</option>`;
    return html + `<option value="${NEW}">+ Add new…</option>`;
  }
  // Attributes that switch on "+ Add new…" for a select.
  function attrs(name, label, prefix){
    return `data-list="${esc(name)}" data-list-label="${esc(label || name)}"${prefix ? ` data-list-prefix="${esc(prefix)}"` : ''}`;
  }

  async function load(){
    try { custom = JSON.parse((await window.storage.get(KEY)).value) || {}; } catch(e){ custom = {}; }
    ready = true;
    ['renderDev','renderStock','renderPrio'].forEach(f=>{ if(typeof window[f] === 'function') window[f](); });
  }
  async function add(name, value){
    // Re-read first, so two people adding at once don't lose each other's entries.
    try { custom = JSON.parse((await window.storage.get(KEY)).value) || {}; } catch(e){}
    custom[name] = custom[name] || [];
    if(!custom[name].some(x=>same(x, value))) custom[name].push(value);
    await window.storage.set(KEY, JSON.stringify(custom));
  }

  // Remember each select's value before it changes, so cancelling "Add new" can put it back.
  function remember(e){
    const s = e.target.closest && e.target.closest('select[data-list]');
    if(s && s.value !== NEW) s.dataset.prev = s.value;
  }
  document.addEventListener('focusin', remember, true);
  document.addEventListener('mousedown', remember, true);
  document.addEventListener('keydown', remember, true);

  document.addEventListener('change', async e=>{
    const s = e.target;
    if(!(s instanceof HTMLSelectElement) || !s.dataset.list || s.value !== NEW) return;
    e.stopImmediatePropagation();          // the page sees the change only once a name is given
    const name = s.dataset.list, label = s.dataset.listLabel || name, prefix = s.dataset.listPrefix || '';
    const typed = (window.prompt(`Add a new ${label}:`) || '').trim();
    if(!typed){ s.value = s.dataset.prev || ''; return; }
    const existing = [...s.options].find(o=>o.value !== NEW && same(o.textContent, typed));
    let value;
    if(existing) value = existing.value;
    else {
      value = prefix + typed;
      try { await add(name, typed); }
      catch(err){ console.error(err); s.value = s.dataset.prev || ''; return; }
      const o = document.createElement('option'); o.value = value; o.textContent = typed;
      s.insertBefore(o, s.querySelector(`option[value="${NEW}"]`));
    }
    s.value = value; s.dataset.prev = value;
    s.dispatchEvent(new Event('change', {bubbles:true}));
  }, true);

  window.lists = { get, opts, attrs, isReady: () => ready };
  function start(){ if(window.storage) load(); else setTimeout(start, 50); }
  start();
})();
