/*
 * Stock Offerings tab.
 *
 * Coating colors: what Uncaged can sell. Each offering is a color in one
 * material (Signature or Luxe) with one or more textures (Fine Grain, Pebble,
 * Nappa) and finishes (Satin, Matte). Colors approved in In Development
 * (stage "Approved – final") appear here automatically.
 *
 * Base colors: uncoated material in stock, by lot.
 *
 * Stock numbers come from the inventory tracking sheet. Someone downloads it as
 * .xlsx and picks it with "Update stock from sheet"; only totals per color /
 * texture / lot are kept (no customer, contact or shipment details).
 *
 * Saved records: "offer-<id>" per offering, "stockSnapshot", "stockSettings".
 */
(function(){
  // Stock numbers (panels, sq ft, uncoated yards) stay hidden until the tracker is
  // connected live to the inventory sheet. The sheet-reading code below is kept;
  // set this to true to show the numbers and the "Update stock from sheet" button again.
  const SHOW_STOCK = false;

  const PREFIX = 'offer-';
  const SNAP_KEY = 'stockSnapshot';
  const SETTINGS_KEY = 'stockSettings';
  const TEXTURES = ['Fine Grain','Pebble','Nappa'];
  const FINISHES = ['Satin','Matte'];
  const MATERIALS = ['Signature','Luxe'];
  const AVAILABILITY = [
    'Full scale material / panels available',
    'Swatches available, full scale run scheduled',
    'Swatches available, no full scale run scheduled',
    'No swatches, full scale run scheduled',
    'No swatches, no full scale run scheduled',
  ];
  const TEST_FIELDS = [
    {k:'ballyFlex', label:'Bally flex'}, {k:'martindale', label:'Martindale'}, {k:'coatWeight', label:'Coat weight'},
    {k:'deltaE', label:'ΔE vs base'}, {k:'L', label:'L*'}, {k:'a', label:'a*'}, {k:'b', label:'b*'},
  ];
  const DEFAULT_BASES = ['Coffee','Stone','Onyx','Natural','Off-White','Cherry'];

  // Starting offerings: everything with finished panels in the inventory (Nov 2026).
  // Hex values and Pantone codes are estimates carried over from the original tracker.
  const SEEDS = [
    ['Signature','Aubergine','#4C2A32','504 C',['Onyx'],[['Pebble','Satin'],['Nappa','Satin']]],
    ['Signature','Cherry','#5C1F26','',['Cherry'],[['Pebble','Satin']]],
    ['Signature','Chocolate','#4A2E20','4625 C',['Onyx'],[['Pebble','Satin'],['Nappa','Satin']]],
    ['Signature','Coffee','#5C4130','',['Coffee'],[['Pebble','Satin']]],
    ['Signature','Everglade','#1E4C3F','567 C',['Onyx'],[['Pebble','Satin'],['Nappa','Satin']]],
    ['Signature','Midnight','#0C2340','289 C',['Onyx'],[['Pebble','Satin'],['Nappa','Satin']]],
    ['Signature','Olive','#5B6236','5753 C',['Onyx'],[['Pebble','Satin'],['Nappa','Satin']]],
    ['Signature','Onyx','#161513','',['Onyx'],[['Pebble','Satin'],['Nappa','Satin'],['Nappa','Matte']]],
    ['Signature','Stone','#B8AEB0','',['Stone'],[['Nappa','Matte']]],
    ['Luxe','Cashew','#C9A27A','',[],[['Fine Grain','']]],
    ['Luxe','Natural','#EFD0AD','719 C',['Natural'],[['Fine Grain','']]],
    ['Luxe','Onyx','#161513','',['Onyx'],[['Fine Grain','']]],
  ];

  let offers = [];
  let snap = null;
  let settings = {seeded:false};
  let loaded = false, loadError = '';
  const ui = {view:'all', material:'', texture:'', q:'', base:'', showDev:false};
  let editing = null, editingIsNew = false;

  // ---------- helpers ----------
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const num = n => (Math.round(n*10)/10).toLocaleString('en-US');
  const int = n => Math.round(n).toLocaleString('en-US');
  const norm = s => String(s||'').trim().toLowerCase();
  function fmtDate(iso){ if(!iso) return ''; const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
  function contrast(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return '#2A2621';
    const n = parseInt(m[1],16); return (((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000) > 150 ? '#2A2621' : '#FFFFFF';
  }
  function texLabel(t){ return [t.finish, t.texture].filter(Boolean).join(' '); }
  function live(){ return offers.filter(o=>!o.deletedAt); }
  function byId(id){ return offers.find(o=>o.id===id); }
  function dev(){ return window.devData && window.devData.loaded() ? window.devData : null; }
  function baseList(){
    const names = (dev() ? dev().bases() : DEFAULT_BASES.map(n=>({name:n, active:true}))).map(b=>b.name);
    (snap ? snap.uncoated : []).forEach(l=>{ if(l.color && !names.some(n=>norm(n)===norm(l.color))) names.push(l.color); });
    live().forEach(o=>o.bases.forEach(b=>{ if(!names.some(n=>norm(n)===norm(b))) names.push(b); }));
    return names;
  }
  function normalize(o){
    o.textures = Array.isArray(o.textures) ? o.textures : [];
    o.bases = Array.isArray(o.bases) ? o.bases : [];
    o.forTags = Array.isArray(o.forTags) ? o.forTags : [];
    if(typeof o.order !== 'number') o.order = Date.now();
    return o;
  }
  function blankOffer(){
    return {id:uid(), color:'', material:'Signature', textures:[{texture:'Pebble', finish:'Satin'}], bases:[], hex:'#B9A58C',
      pantone:'', forTags:[], availability:'', photosUrl:'', notes:'', inventoryName:'', devId:'',
      ballyFlex:'', martindale:'', coatWeight:'', deltaE:'', L:'', a:'', b:'', order: Math.max(0, ...offers.map(o=>o.order||0)) + 1};
  }

  // Texture / finish / material from the inventory sheet's wording.
  // Supplier names: Freeport = Fine Grain, Denver = Pebble.
  function parseTexture(raw){
    const s = norm(raw);
    const texture = /freeport|fine ?grain/.test(s) ? 'Fine Grain' : /denver|pebble/.test(s) ? 'Pebble' : /nappa/.test(s) ? 'Nappa' : String(raw||'').trim();
    const finish = /satin/.test(s) ? 'Satin' : /matte/.test(s) ? 'Matte' : '';
    const luxe = /luxe|freeport/.test(s);
    return {texture, finish, luxe};
  }

  // ---------- stock lookups ----------
  function stockFor(o, t){
    if(!SHOW_STOCK || !snap) return null;
    const name = norm(o.inventoryName || o.color);
    const rows = snap.finished.filter(f => norm(f.material)===norm(o.material) && f.texture===t.texture &&
      (f.finish||'')===(t.finish||'') && norm(f.color)===name);
    if(!rows.length) return null;
    const sum = {available:0, tbi:0, pending:0, allocated:0, internal:0, sqftAvailable:0};
    rows.forEach(r=>Object.keys(sum).forEach(k=>{ sum[k] += Number(r[k])||0; }));
    return sum;
  }
  function lotsFor(base){
    return SHOW_STOCK && snap ? snap.uncoated.filter(l=>norm(l.color)===norm(base)) : [];
  }
  function unmatchedFinished(){
    if(!SHOW_STOCK || !snap) return [];
    return snap.finished.filter(f=>{
      if((f.available + f.tbi + f.pending + f.allocated) <= 0) return false;
      return !live().some(o => norm(o.material)===norm(f.material) && norm(o.inventoryName||o.color)===norm(f.color) &&
        o.textures.some(t=>t.texture===f.texture && (t.finish||'')===(f.finish||'')));
    });
  }
  function devFinals(){
    if(!dev()) return [];
    return dev().colors().filter(c=>c.stage==='final' && !live().some(o=>o.devId===c.id));
  }
  function devInProgress(){
    if(!dev()) return [];
    return dev().colors().filter(c=>!['final','failed_stopped'].includes(c.stage));
  }

  // ---------- storage ----------
  async function load(){
    try {
      try { settings = JSON.parse((await window.storage.get(SETTINGS_KEY)).value) || settings; } catch(e){}
      try { snap = JSON.parse((await window.storage.get(SNAP_KEY)).value); } catch(e){ snap = null; }
      const {keys} = await window.storage.list(PREFIX);
      const recs = await Promise.all(keys.map(k=>window.storage.get(k).then(r=>JSON.parse(r.value)).catch(()=>null)));
      offers = recs.filter(Boolean).map(normalize);
      if(!settings.seeded) await seed();
      loaded = true;
    } catch(e){
      loadError = 'Couldn’t load Stock Offerings (' + (e.message||e) + '). Reload to try again.';
      console.error(e);
    }
    render();
  }
  async function seed(){
    // Fixed ids, so two people opening the tab for the first time can't create duplicates.
    for(const [i, [material, color, hex, pantone, bases, tex]] of SEEDS.entries()){
      const id = 'seed-' + slug(material) + '-' + slug(color);
      if(offers.some(o=>o.id===id)) continue;
      const o = normalize(Object.assign(blankOffer(), {id, material, color, hex, pantone, bases,
        textures: tex.map(([texture, finish])=>({texture, finish})), order:i,
        availability:'Full scale material / panels available'}));
      await save(o); offers.push(o);
    }
    settings.seeded = true;
    await window.storage.set(SETTINGS_KEY, JSON.stringify(settings));
  }
  async function save(o){ o.updatedAt = new Date().toISOString(); await window.storage.set(PREFIX + o.id, JSON.stringify(o)); }

  // ---------- rendering ----------
  function render(){
    const root = document.getElementById('stockRoot');
    if(!root) return;
    const fk = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
    if(loadError){ root.innerHTML = `<div class="dv-empty">${esc(loadError)}</div>`; return; }
    if(!loaded){ root.innerHTML = `<div class="dv-empty">Loading stock offerings…</div>`; return; }

    root.innerHTML = `
      ${summaryHTML()}
      <div class="dv-toolbar">
        <div class="dv-tools-left">
          <div class="so-seg">${[['all','All'],['coating','Coating colors'],['base','Base colors']].map(([k,l])=>
            `<button class="${ui.view===k?'active':''}" data-act="view" data-v="${k}">${l}</button>`).join('')}</div>
          <input type="search" class="dv-search" placeholder="Search colors, Pantone, brand…" value="${esc(ui.q)}" data-act="search" data-fk="search">
          <label class="dv-inline">Material <select data-act="material"><option value="">All</option>${MATERIALS.map(m=>`<option ${ui.material===m?'selected':''}>${m}</option>`).join('')}</select></label>
          <label class="dv-inline">Texture <select data-act="texture"><option value="">All</option>${TEXTURES.map(t=>`<option ${ui.texture===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label class="dv-inline"><input type="checkbox" data-act="showDev" ${ui.showDev?'checked':''}> Include colors in development</label>
        </div>
        <div class="dv-tools-right">
          ${SHOW_STOCK ? `<button class="btn secondary" data-act="importStock">Update stock from sheet…</button>` : ''}
          <div class="dv-menu">
            <button class="btn secondary" data-act="menu">More ▾</button>
            <div class="dv-menu-list" hidden>
              <button data-act="exportCsv">Export offerings for Excel (.csv)</button>
              <button data-act="trash">Recently deleted (${offers.filter(o=>o.deletedAt).length})</button>
            </div>
          </div>
          <button class="btn" data-act="new">+ New offering</button>
        </div>
      </div>
      ${!SHOW_STOCK ? '' : `<div class="so-stockline">${snap
        ? `Stock numbers from <b>${esc(snap.fileName||'the inventory sheet')}</b>, updated ${esc(fmtDate(snap.importedAt))}${snap.uncoatedAsOf ? ` (uncoated material last updated ${esc(fmtDate(snap.uncoatedAsOf))})` : ''}.`
        : `No stock numbers yet. Download the inventory tracking sheet as .xlsx and choose <b>Update stock from sheet…</b>`}</div>`}
      ${ui.base ? `<div class="so-filter">Showing colors on <b>${esc(ui.base)}</b> <button class="linkish" data-act="clearBase">Show all bases</button></div>` : ''}
      ${ui.view !== 'base' ? coatingHTML() : ''}
      ${ui.view !== 'coating' ? baseHTML() : ''}
    `;
    if(fk){ const el = root.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if(el){ el.focus(); if(el.type==='search') el.setSelectionRange(el.value.length, el.value.length); } }
  }

  function summaryHTML(){
    const L = live();
    const card = (n,l,title='') => `<div class="summary-card" title="${esc(title)}"><div class="num">${n}</div><div class="lbl">${l}</div></div>`;
    const usedBases = new Set(); L.forEach(o=>o.bases.forEach(b=>usedBases.add(norm(b))));
    let stockCards = '';
    if(SHOW_STOCK){
      let panels = 0, sqft = 0;
      L.forEach(o=>o.textures.forEach(t=>{ const s = stockFor(o,t); if(s){ panels += s.available; sqft += s.sqftAvailable; } }));
      const yds = (snap ? snap.uncoated.filter(l=>l.section==='available') : []).reduce((a,l)=>a+(l.usableYds||0),0);
      stockCards = card(snap ? int(panels) : '—','Finished panels available', snap ? `${int(sqft)} sq ft` : '') +
                   card(snap ? int(yds) : '—','Uncoated usable yards', snap ? `≈ ${int(yds/2)} panels` : '');
    }
    return `<div class="summary">
      ${card(L.length + devFinals().length,'Coating colors offered')}
      ${card(L.reduce((a,o)=>a+o.textures.length,0),'Color + texture options')}
      ${card(usedBases.size,'Base colors used')}
      ${card(devInProgress().length,'Colors in development')}
      ${stockCards}
    </div>`;
  }

  function matchesOffer(o){
    if(ui.material && o.material !== ui.material) return false;
    if(ui.texture && !o.textures.some(t=>t.texture===ui.texture)) return false;
    if(ui.base && !o.bases.some(b=>norm(b)===norm(ui.base))) return false;
    const q = norm(ui.q);
    return !q || [o.color, o.pantone, o.material, o.notes, o.inventoryName, ...o.forTags, ...o.bases, ...o.textures.map(texLabel)].some(v=>norm(v).includes(q));
  }
  function matchesDev(c){
    if(ui.material && c.material !== ui.material) return false;
    if(ui.texture && norm(c.texture) && !norm(c.texture).includes(norm(ui.texture))) return false;
    if(ui.base && !c.bases.some(b=>norm(b)===norm(ui.base))) return false;
    const q = norm(ui.q);
    return !q || [c.name, c.pantone, c.material, ...c.forTags, ...c.bases].some(v=>norm(v).includes(q));
  }

  // ----- swatch-book layout: one row per base, compact tiles -----
  const AVAIL_SHORT = {
    'Full scale material / panels available':          {label:'In stock',                cls:'ok'},
    'Swatches available, full scale run scheduled':    {label:'Swatches · run scheduled', cls:'mid'},
    'Swatches available, no full scale run scheduled': {label:'Swatches only',            cls:'mid'},
    'No swatches, full scale run scheduled':           {label:'Run scheduled',            cls:'soon'},
    'No swatches, no full scale run scheduled':        {label:'Not available',            cls:'off'},
  };
  const availShort = a => AVAIL_SHORT[a] || {label:'Availability not set', cls:'unset'};
  const texClass = t => 'tx-' + slug(t && t.texture || 'none') + (t && t.finish === 'Satin' ? ' fin-satin' : '');
  const TEX_SHORT = t => [t.finish === 'Matte' ? 'Matte' : '', t.texture].filter(Boolean).join(' ');
  const preview = {};   // offering id -> index of the texture shown on its swatch

  function coatingHTML(){
    const groups = new Map();
    const add = (b, html) => { if(!groups.has(b)) groups.set(b, []); groups.get(b).push(html); };
    const NONE = 'Base not set';
    live().filter(matchesOffer).sort((a,b)=>a.order-b.order).forEach(o=>{
      (o.bases.length ? o.bases : [NONE]).forEach(b=>add(b, offerTile(o)));
    });
    devFinals().filter(matchesDev).forEach(c=>(c.bases.length ? c.bases : [NONE]).forEach(b=>add(b, devFinalTile(c))));
    if(ui.showDev) devInProgress().filter(matchesDev).forEach(c=>(c.bases.length ? c.bases : [NONE]).forEach(b=>add(b, devTile(c))));
    const order = baseList();
    const keys = [...groups.keys()].sort((a,b)=>{
      if(a===NONE) return 1; if(b===NONE) return -1;
      return (order.indexOf(a)+1||99) - (order.indexOf(b)+1||99);
    });
    const extra = unmatchedFinished();
    return `<section class="so-section">
      <h2 class="so-h2">Coating colors <span class="dv-muted">click a swatch for details</span></h2>
      <div class="so-book">
      ${keys.length ? keys.map(k=>`
        <div class="so-row">
          <div class="so-row-label"><span class="so-row-base">${esc(k)}</span><span class="dv-muted">${k===NONE ? '' : 'base · '}${groups.get(k).length}</span></div>
          <div class="so-tiles">${groups.get(k).join('')}</div>
        </div>`).join('') : `<div class="dv-empty">No coating colors match these filters.</div>`}
      </div>
      ${extra.length && !ui.base ? `<div class="so-unmatched"><b>In the inventory sheet but not listed here:</b>
        ${extra.map(f=>`<span class="so-chip">${esc(f.material)} ${esc(f.color)} · ${esc(texLabel(f))} (${int(f.available)} available)
          <button class="linkish" data-act="addFromInventory" data-m="${esc(f.material)}" data-c="${esc(f.color)}" data-t="${esc(f.texture)}" data-f="${esc(f.finish)}">Add</button></span>`).join(' ')}
      </div>` : ''}
    </section>`;
  }

  function offerTile(o){
    const i = Math.min(preview[o.id] || 0, Math.max(0, o.textures.length - 1));
    const t = o.textures[i];
    const av = availShort(o.availability);
    return `<div class="so-tile" data-act="detail" data-id="${o.id}" title="${esc(o.color)} – click for details">
      <div class="so-chip-sw ${texClass(t)}" style="background-color:${esc(o.hex||'#ddd')};color:${contrast(o.hex)}">
        ${o.material === 'Luxe' ? '<span class="so-luxe">Luxe</span>' : ''}
      </div>
      <div class="so-tile-name">${esc(o.color||'Untitled')}</div>
      <div class="so-tile-tex">${o.textures.map((x,j)=>`<button class="so-tx ${j===i?'on':''}" data-act="tex" data-id="${o.id}" data-i="${j}">${esc(TEX_SHORT(x))}</button>`).join('')}</div>
      <div class="so-av ${av.cls}"><span class="dot"></span>${esc(av.label)}</div>
    </div>`;
  }
  function devFinalTile(c){
    return `<div class="so-tile so-tile-new" data-act="detailDev" data-dev="${c.id}" title="${esc(c.name)} – click for details">
      <div class="so-chip-sw ${texClass(parseTexture(c.texture))}" style="background-color:${esc(c.hex||'#ddd')}"><span class="so-newtag">New</span></div>
      <div class="so-tile-name">${esc(c.name)}</div>
      <div class="so-tile-tex"><span class="dv-muted">${c.forTags.map(esc).join(', ') || 'Approved'}</span></div>
      <div class="so-av new"><span class="dot"></span>Approved – add details</div>
    </div>`;
  }
  function devTile(c){
    const st = window.devData.stage(c.stage);
    return `<div class="so-tile so-tile-dev" data-act="detailDev" data-dev="${c.id}" title="${esc(c.name)} – in development">
      <div class="so-chip-sw" style="background-color:${esc(c.hex||'#ddd')}"></div>
      <div class="so-tile-name">${esc(c.name)}</div>
      <div class="so-tile-tex"><span class="dv-muted">${esc([c.partner, c.forTags[0]].filter(Boolean).join(' · '))}</span></div>
      <div class="so-av"><span class="dot" style="background:${st.color}"></span>${esc(st.label)}</div>
    </div>`;
  }

  function detailHTML(o){
    const av = availShort(o.availability);
    const tests = TEST_FIELDS.filter(f=>o[f.k]!=='' && o[f.k]!=null);
    const row = (k,v) => v ? `<div class="so-d-row"><span>${k}</span><span>${v}</span></div>` : '';
    return `<div class="so-detail">
      <div class="so-d-swatches">${(o.textures.length ? o.textures : [null]).map(t=>`
        <div><div class="so-chip-sw big ${texClass(t)}" style="background-color:${esc(o.hex||'#ddd')}"></div>
        <div class="so-d-cap">${t ? esc(texLabel(t)) : 'No texture set'}</div></div>`).join('')}</div>
      <div class="so-d-info">
        ${row('Material', esc(o.material))}
        ${row('Pantone', esc(o.pantone))}
        ${row('Base', o.bases.map(esc).join(' + ') || '<span class="dv-muted">Not set</span>')}
        ${row('Textures', o.textures.map(t=>esc(texLabel(t))).join(', '))}
        ${row('For', o.forTags.map(esc).join(', '))}
        ${row('Availability', `<span class="so-av ${av.cls}"><span class="dot"></span>${esc(o.availability || 'Not set')}</span>`)}
        ${tests.length ? row('Test data', tests.map(f=>`${f.label} ${esc(o[f.k])}`).join(' · ')) : ''}
        ${row('Photos', o.photosUrl ? `<a href="${esc(o.photosUrl)}" target="_blank" rel="noopener">Open photos</a>` : '')}
        ${row('Notes', o.notes ? esc(o.notes) : '')}
        ${SHOW_STOCK ? `<div class="so-texlist">${texRowsHTML(o)}</div>` : ''}
      </div>
      <p class="dv-hint">Swatches show the grain as a rough preview only – not color- or texture-accurate.</p>
    </div>`;
  }
  function openDetail(o){
    let el = document.getElementById('soDetail');
    if(!el){ el = document.createElement('div'); el.className = 'modal-overlay'; el.id = 'soDetail'; document.body.appendChild(el);
      el.addEventListener('click', e=>{
        if(e.target === el || e.target.closest('[data-close]')) return el.classList.remove('open');
        const ed = e.target.closest('[data-edit]'); if(ed){ el.classList.remove('open'); openModal(byId(ed.dataset.edit), false); }
      }); }
    el.innerHTML = `<div class="modal" style="max-width:620px"><h2>${esc(o.color)} <span class="dv-muted" style="font-family:Inter;font-size:13px">${esc(o.material)}</span></h2>
      ${detailHTML(o)}
      <div class="modal-actions"><button class="btn secondary" data-close>Close</button><button class="btn" data-edit="${o.id}">Edit</button></div></div>`;
    el.classList.add('open');
  }

  function texRowsHTML(o){
    return o.textures.map(t=>{
      const s = stockFor(o,t);
      const extra = s ? [s.tbi ? `${int(s.tbi)} to inspect` : '', s.pending ? `${int(s.pending)} pending` : '', s.allocated ? `${int(s.allocated)} allocated` : ''].filter(Boolean).join(' · ') : '';
      return `<div class="so-texrow">
        <span class="so-texname">${esc(texLabel(t) || 'Texture not set')}</span>
        ${SHOW_STOCK ? `<span class="so-qty ${s && s.available ? '' : 'none'}">${s ? `${int(s.available)} panels${s.sqftAvailable ? ` · ${int(s.sqftAvailable)} sq ft` : ''}` : (snap ? 'No stock in sheet' : '')}</span>` : ''}
        ${extra ? `<span class="so-extra">${esc(extra)}</span>` : ''}
      </div>`;
    }).join('');
  }

  function testLine(o){
    const parts = TEST_FIELDS.filter(f=>o[f.k]!=='' && o[f.k]!=null).map(f=>`${f.label} ${esc(o[f.k])}`);
    return parts.length ? `<div class="so-tests">${parts.join(' · ')}</div>` : '';
  }

  function offerCard(o){
    return `<div class="so-card">
      <div class="so-swatch" style="background:${esc(o.hex||'#ddd')};color:${contrast(o.hex)}">
        <span class="so-mat">${esc(o.material)}</span>
        <button class="icon-btn so-edit" data-act="edit" data-id="${o.id}" title="Edit">✎</button>
      </div>
      <div class="so-body">
        <div class="so-title">${esc(o.color||'Untitled')}</div>
        <div class="so-sub">${[o.pantone ? 'Pantone ' + esc(o.pantone) : '', o.bases.length ? 'Base: ' + o.bases.map(esc).join(' + ') : 'Base not set'].filter(Boolean).join(' · ')}</div>
        <div class="so-texlist">${texRowsHTML(o)}</div>
        ${o.forTags.length ? `<div class="dv-tags">${o.forTags.map(t=>`<span class="dv-tag">${esc(t)}</span>`).join('')}</div>` : ''}
        ${testLine(o)}
        <select class="so-avail" data-act="avail" data-id="${o.id}" data-fk="avail-${o.id}" title="Availability">
          <option value="">Availability not set</option>
          ${AVAILABILITY.map(a=>`<option ${o.availability===a?'selected':''}>${esc(a)}</option>`).join('')}
        </select>
        ${o.photosUrl ? `<a class="so-link" href="${esc(o.photosUrl)}" target="_blank" rel="noopener">Photos</a>` : ''}
      </div>
    </div>`;
  }

  function devFinalCard(c){
    const t = window.devData.finalShade(c) || {};
    const rounds = window.devData.trialCount(c);
    const tests = TEST_FIELDS.filter(f=>t[f.k]!=='' && t[f.k]!=null).map(f=>`${f.label} ${esc(t[f.k])}`);
    return `<div class="so-card so-new">
      <div class="so-swatch" style="background:${esc(c.hex||'#ddd')};color:${contrast(c.hex)}"><span class="so-mat">${esc(c.material||'Material not set')}</span></div>
      <div class="so-body">
        <div class="so-title">${esc(c.name)}</div>
        <div class="so-sub">${[c.pantone ? 'Pantone ' + esc(c.pantone) : '', c.bases.length ? 'Base: ' + c.bases.map(esc).join(' + ') : 'Base not set', c.finish ? esc(c.finish) : ''].filter(Boolean).join(' · ')}</div>
        <div class="so-badge">Approved in In Development · ${rounds} trial round${rounds===1?'':'s'}</div>
        ${c.forTags.length ? `<div class="dv-tags">${c.forTags.map(x=>`<span class="dv-tag">${esc(x)}</span>`).join('')}</div>` : ''}
        ${tests.length ? `<div class="so-tests">${tests.join(' · ')}</div>` : ''}
        <button class="btn secondary so-addbtn" data-act="adoptDev" data-dev="${c.id}">${SHOW_STOCK ? 'Add textures &amp; stock details' : 'Add textures &amp; details'}</button>
      </div>
    </div>`;
  }

  function devCard(c){
    const st = window.devData.stage(c.stage);
    return `<div class="so-card so-dev">
      <div class="so-swatch" style="background:${esc(c.hex||'#ddd')}"></div>
      <div class="so-body">
        <div class="so-title">${esc(c.name)} <span class="dv-code">${esc(c.pantone||'')}</span></div>
        <div class="so-sub">${[c.material, c.finish, c.partner].filter(Boolean).map(esc).join(' · ')}</div>
        <span class="dv-stage" style="background:${st.color};color:${contrast(st.color)}">${esc(st.label)}</span>
        ${c.forTags.length ? `<div class="dv-tags">${c.forTags.map(x=>`<span class="dv-tag">${esc(x)}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  function baseHTML(){
    const names = baseList().filter(b=>!ui.base || norm(b)===norm(ui.base));
    const q = norm(ui.q);
    const cards = names.map(b=>{
      const lots = lotsFor(b).filter(l=>!ui.material || l.material===ui.material).filter(l=>!ui.texture || l.texture===ui.texture);
      const coatings = live().filter(o=>o.bases.some(x=>norm(x)===norm(b)));
      const devCount = devInProgress().filter(c=>c.bases.some(x=>norm(x)===norm(b))).length;
      if(q && !norm(b).includes(q) && !lots.some(l=>norm(l.lot).includes(q) || norm(l.location).includes(q))) return '';
      if(SHOW_STOCK && (ui.material || ui.texture) && !lots.length) return '';
      const avail = lots.filter(l=>l.section==='available');
      const yds = avail.reduce((a,l)=>a+(l.usableYds||0),0);
      const sq = avail.reduce((a,l)=>a+(l.sqft||0),0);
      const same = coatings.find(o=>norm(o.color)===norm(b));
      const sample = (same || coatings[0] || {}).hex || '';
      return `<div class="so-base">
        <div class="so-base-head">
          <span class="dv-swatch sm" style="background:${esc(sample || '#ddd')}"></span>
          <div><div class="so-title">${esc(b)}</div>
            ${SHOW_STOCK ? `<div class="so-sub">${snap ? (avail.length ? `${num(yds)} usable yds · ≈ ${int(yds/2)} panels · ${int(sq)} sq ft` : 'No uncoated stock') : 'Stock numbers not loaded'}</div>` : ''}</div>
        </div>
        ${lots.length ? `<table class="so-lots"><thead><tr><th>Lot</th><th>Texture</th><th>Location</th><th class="r">Usable yds</th><th class="r">≈ Panels</th></tr></thead><tbody>
          ${lots.map(l=>`<tr class="${l.section}"><td>${esc(l.lot)}</td><td>${esc(l.material)} · ${esc(texLabel(l))}</td><td>${esc(l.location)}</td>
            <td class="r">${l.section==='out' ? 'Out of stock' : num(l.usableYds||0)}</td><td class="r">${l.section==='out' ? '' : num(l.panels||0)}</td></tr>
            ${l.section==='sampling' ? `<tr class="sampling note"><td colspan="5">Available for sampling only</td></tr>` : ''}
            ${l.note ? `<tr class="note"><td colspan="5">${esc(l.note)}</td></tr>` : ''}`).join('')}
        </tbody></table>` : ''}
        <div class="so-base-links">
          ${coatings.length ? `<span class="dv-muted">Coating colors on this base:</span> ${coatings.map(o=>`<span class="so-chip">${esc(o.color)}${o.material==='Luxe'?' (Luxe)':''}</span>`).join(' ')}
            <button class="linkish" data-act="showBase" data-b="${esc(b)}">Show these</button>` : `<span class="dv-muted">No coating colors on this base yet.</span>`}
          ${devCount ? `<div><button class="linkish" data-act="showBaseDev" data-b="${esc(b)}">${devCount} color${devCount===1?'':'s'} in development on ${esc(b)}</button></div>` : ''}
        </div>
      </div>`;
    }).join('');
    return `<section class="so-section"><h2 class="so-h2">Base colors <span class="dv-muted">${SHOW_STOCK ? 'uncoated material, by lot' : 'the uncoated colors our coatings are built on'}</span></h2>
      <div class="so-base-grid">${cards || '<div class="dv-empty">No base colors match these filters.</div>'}</div></section>`;
  }

  // ---------- events ----------
  async function onClick(e){
    const btn = e.target.closest('[data-act]');
    const root = document.getElementById('stockRoot');
    const menu = root.querySelector('.dv-menu-list');
    if(menu && !e.target.closest('.dv-menu')) menu.hidden = true;
    if(!btn || btn.tagName==='SELECT' || btn.tagName==='INPUT') return;
    switch(btn.dataset.act){
      case 'menu': menu.hidden = !menu.hidden; return;
      case 'view': ui.view = btn.dataset.v; return render();
      case 'clearBase': ui.base = ''; return render();
      case 'showBase': ui.base = btn.dataset.b; ui.view = 'coating'; window.scrollTo(0,0); return render();
      case 'showBaseDev': ui.base = btn.dataset.b; ui.view = 'coating'; ui.showDev = true; window.scrollTo(0,0); return render();
      case 'edit': return openModal(byId(btn.dataset.id), false);
      case 'detail': return openDetail(byId(btn.dataset.id));
      case 'tex': e.stopPropagation(); preview[btn.dataset.id] = Number(btn.dataset.i); return render();
      case 'detailDev': {
        const c = window.devData.colors().find(x=>x.id===btn.dataset.dev);
        if(c && c.stage === 'final') return adoptDev(c);
        // A color still in development: open the In Development tab.
        document.querySelector('.tab-btn[data-view="dev2"]').click(); return;
      }
      case 'new': return openModal(null, true);
      case 'adoptDev': return adoptDev(window.devData.colors().find(x=>x.id===btn.dataset.dev));
      case 'addFromInventory': {
        const o = Object.assign(blankOffer(), {color:btn.dataset.c, material:btn.dataset.m,
          textures:[{texture:btn.dataset.t, finish:btn.dataset.f}]});
        return openModal(o, true);
      }
      case 'importStock': return pickStockFile();
      case 'exportCsv': menu.hidden = true; return exportCsv();
      case 'trash': menu.hidden = true; return openTrash();
    }
  }
  // A color approved in In Development becomes an offering, pre-filled from its final trial round.
  function adoptDev(c){
    const o = Object.assign(blankOffer(), {color:c.name, material:c.material||'Signature', hex:c.hex, pantone:c.pantone,
      bases:c.bases.slice(), forTags:c.forTags.slice(), photosUrl:c.photosUrl||'', devId:c.id, availability:c.availability||'',
      textures:[{texture: parseTexture(c.texture).texture || 'Pebble', finish: c.finish==='Matte' ? 'Matte' : 'Satin'}]});
    const t = window.devData.finalShade(c);
    if(t) TEST_FIELDS.forEach(f=>{ o[f.k] = t[f.k] || ''; });
    return openModal(o, true);
  }
  async function onChange(e){
    const el = e.target, act = el.dataset.act;
    if(act === 'material'){ ui.material = el.value; return render(); }
    if(act === 'texture'){ ui.texture = el.value; return render(); }
    if(act === 'showDev'){ ui.showDev = el.checked; return render(); }
    if(act === 'avail'){ const o = byId(el.dataset.id); o.availability = el.value; await save(o); return render(); }
  }
  function onInput(e){
    if(e.target.dataset.act === 'search'){ ui.q = e.target.value; clearTimeout(onInput.t); onInput.t = setTimeout(render, 200); }
  }

  // ---------- edit modal ----------
  function ensureModal(){
    if(document.getElementById('soModal')) return;
    const el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = 'soModal';
    el.innerHTML = `<div class="modal dv-modal"><h2 id="soModalTitle"></h2><div id="soModalBody"></div>
      <div class="modal-actions">
        <button class="btn danger" id="soDelete" style="margin-right:auto">Delete offering</button>
        <button class="btn secondary" id="soCancel">Cancel</button>
        <button class="btn" id="soSave">Save</button>
      </div></div>`;
    document.body.appendChild(el);
    el.querySelector('#soCancel').addEventListener('click', closeModal);
    el.querySelector('#soSave').addEventListener('click', saveModal);
    el.querySelector('#soDelete').addEventListener('click', deleteOffer);
    el.addEventListener('click', e=>{
      if(e.target === el) return closeModal();
      const b = e.target.closest('[data-tx]'); if(!b) return;
      readModal();
      if(b.dataset.tx === 'add') editing.textures.push({texture:'Pebble', finish:'Satin'});
      if(b.dataset.tx === 'del') editing.textures.splice(Number(b.dataset.i), 1);
      fillModal();
    });
    el.addEventListener('input', e=>{
      if(e.target.id === 'soHexPick') el.querySelector('#soHex').value = e.target.value;
      if(e.target.id === 'soHex' && /^#[0-9a-f]{6}$/i.test(e.target.value)) el.querySelector('#soHexPick').value = e.target.value;
    });
  }
  function openModal(o, isNew){
    ensureModal();
    editingIsNew = isNew;
    editing = o ? JSON.parse(JSON.stringify(o)) : blankOffer();
    document.getElementById('soModalTitle').textContent = isNew ? 'New stock offering' : 'Edit ' + (o.color || 'offering');
    document.getElementById('soDelete').style.display = isNew ? 'none' : '';
    fillModal();
    document.getElementById('soModal').classList.add('open');
    document.getElementById('soColor').focus();
  }
  function closeModal(){ document.getElementById('soModal').classList.remove('open'); editing = null; }
  function opts(list, val, blank){
    return (blank !== undefined ? `<option value="">${blank}</option>` : '') + list.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('') +
      (val && !list.includes(val) ? `<option selected>${esc(val)}</option>` : '');
  }
  function fillModal(){
    const o = editing;
    const bases = [...new Set([...baseList(), ...o.bases])];
    document.getElementById('soModalBody').innerHTML = `
      <div class="form-grid">
        <div class="form-field"><label>Color name</label><input id="soColor" value="${esc(o.color)}" placeholder="e.g. Aubergine"></div>
        <div class="form-field"><label>Material</label><select id="soMaterial">${opts(MATERIALS, o.material)}</select></div>
        <div class="form-field"><label>Pantone code</label><input id="soPantone" value="${esc(o.pantone)}"></div>
        <div class="form-field"><label>Swatch color</label><div class="hex-row">
          <input type="color" id="soHexPick" value="${/^#[0-9a-f]{6}$/i.test(o.hex)?esc(o.hex):'#B9A58C'}"><input id="soHex" value="${esc(o.hex)}"></div></div>
        <div class="form-field full"><label>Textures &amp; finishes offered</label>
          <div class="so-texedit">${o.textures.map((t,i)=>`<div class="so-texedit-row" data-i="${i}">
            <select data-k="texture">${opts(TEXTURES, t.texture)}</select>
            <select data-k="finish">${opts(FINISHES, t.finish, 'No finish set')}</select>
            <button class="icon-btn" data-tx="del" data-i="${i}" title="Remove">✕</button></div>`).join('')}
            <button class="linkish" data-tx="add">+ Add texture</button></div></div>
        <div class="form-field full"><label>Base color</label><div class="dv-checks">
          ${bases.map(b=>`<label><input type="checkbox" class="soBase" value="${esc(b)}" ${o.bases.includes(b)?'checked':''}> ${esc(b)}</label>`).join('')}</div></div>
        <div class="form-field"><label>For (brand or collection)</label><input id="soFor" value="${esc(o.forTags.join(', '))}" placeholder="Leave empty for general stock"></div>
        <div class="form-field"><label>Name in inventory sheet</label><input id="soInv" value="${esc(o.inventoryName)}" placeholder="Same as color name">
          <span class="dv-hint">Only if the sheet calls it something else</span></div>
        <div class="form-field full"><label>Availability</label><select id="soAvail">${opts(AVAILABILITY, o.availability, 'Not set')}</select></div>
        ${TEST_FIELDS.map(f=>`<div class="form-field so-test"><label>${f.label}</label><input data-test="${f.k}" value="${esc(o[f.k])}"></div>`).join('')}
        <div class="form-field full"><label>Photos link (e.g. Dropbox)</label><input id="soPhotos" value="${esc(o.photosUrl)}" placeholder="https://"></div>
        <div class="form-field full"><label>Notes</label><textarea id="soNotes" rows="2">${esc(o.notes)}</textarea></div>
      </div>`;
  }
  function readModal(){
    const v = id => (document.getElementById(id) || {}).value || '';
    const o = editing;
    o.color = v('soColor').trim(); o.material = v('soMaterial'); o.pantone = v('soPantone').trim(); o.hex = v('soHex').trim();
    o.forTags = v('soFor').split(',').map(s=>s.trim()).filter(Boolean);
    o.inventoryName = v('soInv').trim(); o.availability = v('soAvail'); o.photosUrl = v('soPhotos').trim(); o.notes = v('soNotes');
    o.bases = [...document.querySelectorAll('#soModal .soBase:checked')].map(x=>x.value);
    o.textures = [...document.querySelectorAll('#soModal .so-texedit-row')].map(r=>({
      texture: r.querySelector('[data-k=texture]').value, finish: r.querySelector('[data-k=finish]').value}));
    document.querySelectorAll('#soModal [data-test]').forEach(inp=>{ o[inp.dataset.test] = inp.value.trim(); });
  }
  async function saveModal(){
    readModal();
    const o = editing;
    if(!o.color) return alert('Give the offering a color name.');
    if(o.photosUrl && !/^https?:\/\//i.test(o.photosUrl)) o.photosUrl = 'https://' + o.photosUrl;
    const btn = document.getElementById('soSave'); btn.disabled = true;
    try {
      await save(o);
      const i = offers.findIndex(x=>x.id===o.id);
      if(i >= 0) offers[i] = o; else offers.push(normalize(o));
      closeModal(); render();
    } catch(e){} finally { btn.disabled = false; }
  }
  async function deleteOffer(){
    const o = byId(editing.id);
    if(!o || !confirm(`Delete ${o.material} ${o.color} from Stock Offerings? You can restore it from More → Recently deleted.`)) return;
    o.deletedAt = new Date().toISOString(); await save(o); closeModal(); render();
  }
  function openTrash(){
    let el = document.getElementById('soDialog');
    if(!el){ el = document.createElement('div'); el.className = 'modal-overlay'; el.id = 'soDialog'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-close]')) el.classList.remove('open'); }); }
    const del = offers.filter(o=>o.deletedAt);
    el.innerHTML = `<div class="modal" style="max-width:520px"><h2>Recently deleted</h2>
      ${del.length ? `<div class="dv-trash">${del.map(o=>`<div class="dv-trash-row"><span class="dv-swatch sm" style="background:${esc(o.hex)}"></span>
        <span><b>${esc(o.material)} ${esc(o.color)}</b></span><button class="btn secondary" data-restore="${o.id}">Restore</button></div>`).join('')}</div>`
        : '<p class="dv-muted">Nothing has been deleted.</p>'}
      <div class="modal-actions"><button class="btn secondary" data-close>Close</button></div></div>`;
    el.classList.add('open');
    el.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click', async ()=>{
      const o = byId(b.dataset.restore); delete o.deletedAt; await save(o); render(); openTrash();
    }));
  }

  // ---------- CSV export ----------
  function exportCsv(){
    const q = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
    const rows = [['Material','Color','Texture','Finish','Pantone','Base','For','Availability', ...(SHOW_STOCK ? ['Panels available','Sq ft available','To be inspected','Pending','Allocated'] : [])]];
    live().sort((a,b)=>a.order-b.order).forEach(o=>o.textures.forEach(t=>{
      const s = stockFor(o,t) || {};
      rows.push([o.material,o.color,t.texture,t.finish,o.pantone,o.bases.join(' + '),o.forTags.join('; '),o.availability,
        ...(SHOW_STOCK ? [s.available??'', s.sqftAvailable!=null?Math.round(s.sqftAvailable):'', s.tbi??'', s.pending??'', s.allocated??''] : [])]);
    }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r=>r.map(q).join(',')).join('\r\n')], {type:'text/csv'}));
    a.download = `stock-offerings-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------- reading the inventory sheet (.xlsx) ----------
  // An .xlsx file is a zip of XML files; the browser unzips it with DecompressionStream.
  async function unzip(buf){
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let eocd = -1;
    for(let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--){ if(dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; } }
    if(eocd < 0) throw new Error('not an .xlsx file');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    const dec = new TextDecoder();
    for(let i = 0; i < count; i++){
      if(dv.getUint32(p, true) !== 0x02014b50) throw new Error('damaged .xlsx file');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      files[name] = {method, csize, off};
      p += 46 + nlen + xlen + clen;
    }
    return async name => {
      const f = files[name]; if(!f) return null;
      const start = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true);
      const data = u8.subarray(start, start + f.csize);
      if(f.method === 0) return dec.decode(data);
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).text();
    };
  }
  async function readWorkbook(file){
    const read = await unzip(await file.arrayBuffer());
    const xml = s => new DOMParser().parseFromString(s, 'application/xml');
    const wb = xml(await read('xl/workbook.xml'));
    const rels = xml(await read('xl/_rels/workbook.xml.rels'));
    const target = {};
    [...rels.getElementsByTagName('Relationship')].forEach(r=>{ target[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const sheets = {};
    [...wb.getElementsByTagName('sheet')].forEach(s=>{
      const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
      let t = target[rid] || ''; t = t.startsWith('/') ? t.slice(1) : 'xl/' + t;
      sheets[s.getAttribute('name')] = t;
    });
    const ssText = await read('xl/sharedStrings.xml');
    const shared = ssText ? [...xml(ssText).getElementsByTagName('si')].map(si=>
      [...si.getElementsByTagName('t')].filter(t=>!t.closest || !t.closest('rPh')).map(t=>t.textContent).join('')) : [];
    const colIdx = ref => { let n = 0; for(const ch of ref.replace(/[0-9]/g,'')) n = n*26 + ch.charCodeAt(0) - 64; return n - 1; };
    return {
      names: Object.keys(sheets),
      async rows(name){
        const text = await read(sheets[name]); if(!text) return [];
        const out = [];
        [...xml(text).getElementsByTagName('row')].forEach(row=>{
          const r = [];
          [...row.getElementsByTagName('c')].forEach(c=>{
            const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
            let val = '';
            if(t === 's') val = v ? shared[Number(v.textContent)] : '';
            else if(t === 'inlineStr') val = [...c.getElementsByTagName('t')].map(x=>x.textContent).join('');
            else if(v) val = (t === 'str' || t === 'e') ? v.textContent : (isNaN(Number(v.textContent)) ? v.textContent : Number(v.textContent));
            r[colIdx(c.getAttribute('r'))] = val;
          });
          out[Number(row.getAttribute('r')) - 1] = r;
        });
        return out.map(r=>r || []);
      }
    };
  }
  const excelDate = v => typeof v === 'number' ? new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0,10) : String(v||'').slice(0,10);
  const toNum = v => { const n = typeof v === 'number' ? v : parseFloat(String(v||'').replace(/,/g,'')); return isNaN(n) ? 0 : n; };

  // Same rule as the Vault, so the two agree: a measured size is used as is, a
  // range like "19 - 22" counts at its low end, and a missing size uses the average.
  function panelSqft(size, avg){
    if(typeof size === 'number' && size > 0) return size;
    const m = /^\s*([\d.]+)\s*-\s*([\d.]+)/.exec(String(size||''));
    if(m) return Number(m[1]);
    const n = toNum(size);
    return n > 0 ? n : toNum(avg);
  }

  async function parseInventory(file){
    const wb = await readWorkbook(file);
    const invName = wb.names.find(n=>norm(n)==='inventory') || wb.names.find(n=>norm(n).includes('inventory'));
    const uncName = wb.names.find(n=>norm(n).includes('uncoated'));
    if(!invName && !uncName) throw new Error('couldn’t find the Inventory or Uncoated Material tabs');
    const finished = {};
    if(invName){
      const rows = await wb.rows(invName);
      const hi = rows.findIndex(r=>r.some(c=>norm(c)==='status') && r.some(c=>norm(c)==='color'));
      if(hi < 0) throw new Error('the Inventory tab has no STATUS / COLOR header row');
      const H = {}; rows[hi].forEach((c,i)=>{ if(c!=='' && c!=null) H[norm(c)] = i; });
      const col = (r, name) => r[H[name]];
      const STATUS = {'available':'available','to be inspected':'tbi','pending':'pending','allocated':'allocated','internal use':'internal','sold':'sold'};
      rows.slice(hi+1).forEach(r=>{
        const status = STATUS[norm(col(r,'status'))]; if(!status) return;
        const color = String(col(r,'color')||'').trim(); if(!color) return;
        const material = String(col(r,'material')||'').trim();
        const tx = parseTexture(col(r,'texture'));
        const key = [material, tx.texture, tx.finish, color].map(norm).join('|');
        const f = finished[key] || (finished[key] = {material, texture:tx.texture, finish:tx.finish, color,
          available:0, tbi:0, pending:0, allocated:0, internal:0, sold:0, sqftAvailable:0});
        const qty = toNum(col(r,'current qty')) || 0;
        f[status] += qty;
        if(status === 'available') f.sqftAvailable += panelSqft(col(r,'size (sq ft)'), col(r,'avg. size (sq ft)')) * qty;
      });
    }
    const uncoated = []; let uncoatedAsOf = '';
    if(uncName){
      const rows = await wb.rows(uncName);
      rows.forEach(r=>{ const i = r.findIndex(c=>/last updated/i.test(String(c||''))); if(i >= 0 && r[i+1]) uncoatedAsOf = excelDate(r[i+1]); });
      const hi = rows.findIndex(r=>r.some(c=>norm(c)==='lot') && r.some(c=>norm(c)==='color'));
      if(hi >= 0){
        const H = {}; rows[hi].forEach((c,i)=>{ if(c!=='' && c!=null) H[norm(c)] = i; });
        const last = Math.max(...Object.values(H));
        const find = re => { const k = Object.keys(H).find(k=>re.test(k)); return k ? H[k] : -1; };
        const c = {lot:H['lot'], color:H['color'], texture:H['texture'], location:find(/^location/), delivered:find(/^delivered/),
          usable:find(/usable/), panels:find(/panels/), sqft:find(/sqf|sq ?ft/)};
        let section = 'available';
        rows.slice(hi+1).forEach(r=>{
          const first = r.find(x=>x!=='' && x!=null);
          if(/sampling/i.test(String(first||''))) { section = 'sampling'; return; }
          if(/out of stock/i.test(String(first||''))) { section = 'out'; return; }
          const lot = String(r[c.lot]||'').trim(), color = String(r[c.color]||'').trim();
          if(!lot || !color) return;
          const tx = parseTexture(r[c.texture]);
          uncoated.push({lot, color, location:String(r[c.location]||'').trim(), section,
            texture:tx.texture, finish:tx.finish, material: tx.luxe ? 'Luxe' : 'Signature', textureRaw:String(r[c.texture]||'').trim(),
            usableYds: section==='out' ? 0 : toNum(r[c.usable]), panels: section==='out' ? 0 : toNum(r[c.panels]),
            sqft: section==='out' ? 0 : toNum(r[c.sqft]),
            note: r.slice(last+1).filter(x=>x!=='' && x!=null).map(String).join(' ').trim()});
        });
      }
    }
    return {fileName:file.name, importedAt:new Date().toISOString(), uncoatedAsOf,
      finished:Object.values(finished), uncoated};
  }

  function pickStockFile(){
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.xlsx';
    inp.addEventListener('change', async ()=>{
      const file = inp.files[0]; if(!file) return;
      let s;
      try { s = await parseInventory(file); }
      catch(e){ console.error(e); return alert('Couldn’t read that file: ' + (e.message||e) + '.\n\nIn Google Sheets, use File → Download → Microsoft Excel (.xlsx).'); }
      const panels = s.finished.reduce((a,f)=>a+f.available,0);
      const lots = s.uncoated.filter(l=>l.section!=='out').length;
      if(!confirm(`Update stock numbers from ${file.name}?\n\n• ${s.finished.length} finished color/texture combinations, ${Math.round(panels)} panels available\n• ${lots} uncoated lots in stock` + (s.uncoatedAsOf ? ` (sheet updated ${s.uncoatedAsOf})` : ''))) return;
      try { await window.storage.set(SNAP_KEY, JSON.stringify(s)); snap = s; render(); toast('Stock numbers updated.'); }
      catch(e){ console.error(e); }
    });
    inp.click();
  }
  function toast(text){
    let el = document.getElementById('dvToast');
    if(!el){ el = document.createElement('div'); el.id = 'dvToast'; el.className = 'dv-toast'; document.body.appendChild(el); }
    el.textContent = text; el.style.display = '';
    clearTimeout(toast.t); toast.t = setTimeout(()=>{ el.style.display = 'none'; }, 3500);
  }

  // ---------- setup ----------
  function setup(){
    const root = document.getElementById('stockRoot');
    if(!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    window.renderStock = render;
    render();
    load();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
