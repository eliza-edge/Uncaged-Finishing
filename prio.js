/*
 * Finishing Priorities tab.
 *
 * What partners are finishing for Uncaged, in priority order. A row is either
 * linked to a color in In Development (ticked there under "Priorities") or
 * entered here by hand.
 *
 * Linked rows show the color's partner, project, quantity (its forecasted
 * order) and color / finish / texture straight from In Development, so they
 * stay current; their dates and notes are kept here. Manual rows keep every
 * field here.
 *
 * Saved as one record per row: "prio-<id>".
 */
(function(){
  const PREFIX = 'prio-';
  const ROOT_ID = 'prioRoot';
  const TEXTURES = ['Fine Grain','Pebble','Nappa'];
  const FINISHES = ['Matte','Satin','Gloss','High gloss'];
  const MATERIALS = ['Signature','Luxe'];

  let rows = [];
  let loaded = false, loadError = '';
  const ui = {q:'', partner:''};

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const norm = s => String(s||'').trim().toLowerCase();
  function pd(s){ if(!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
  function today(){ const t = new Date(); t.setHours(0,0,0,0); return t; }
  function fmtN(n){ return Number(n) ? Math.round(Number(n)).toLocaleString('en-US') : ''; }
  const live = () => rows.filter(r=>!r.deletedAt);
  const dev = () => window.devData && window.devData.loaded() ? window.devData : null;
  function linkedColor(r){ return r.devId && dev() ? dev().byId(r.devId) : null; }
  // Rows linked to a color that was deleted in In Development are hidden.
  function shown(){ return live().filter(r=>!r.devId || !dev() || linkedColor(r)).sort((a,b)=>(a.rank||0)-(b.rank||0)); }

  // The values a row displays: linked rows read from In Development.
  function view(r){
    const c = linkedColor(r);
    if(!c) return {partner:r.partner||'', project:r.project||'', quantity:r.quantity||'', color:r.color||'', hex:r.hex||'',
      material:r.material||'', finish:r.finish||'', texture:r.texture||'', linked:false};
    return {partner:c.partner||'', project:c.forTags.join(', '), quantity:c.forecastSqft||'', color:c.name||'', hex:c.hex||'',
      material:c.material||'', finish:c.finish||'', texture:c.texture||'', linked:true, stage:window.devData.stage(c.stage)};
  }

  // ---------- storage ----------
  async function load(){
    try {
      const {keys} = await window.storage.list(PREFIX);
      const recs = await Promise.all(keys.map(k => window.storage.get(k).then(r=>JSON.parse(r.value)).catch(()=>null)));
      rows = recs.filter(Boolean);
      loaded = true;
    } catch(e){
      loadError = 'Couldn’t load Finishing Priorities (' + (e.message||e) + '). Reload to try again.';
      console.error(e);
    }
    render();
    if(typeof window.renderDev === 'function') window.renderDev();
  }
  async function save(r){ r.updatedAt = new Date().toISOString(); await window.storage.set(PREFIX + r.id, JSON.stringify(r)); }
  const nextRank = () => Math.max(0, ...live().map(r=>r.rank||0)) + 1;

  // Used by In Development's "Priorities" tick box.
  window.prioData = {
    has: devId => loaded && live().some(r=>r.devId===devId),
    async toggle(devId, on){
      if(!loaded) return;
      const existing = rows.filter(r=>r.devId===devId);
      if(on){
        const back = existing.find(r=>r.deletedAt);      // re-ticked: bring back its dates and notes
        if(live().some(r=>r.devId===devId)) return;
        const r = back || {id:uid(), devId, receiveDate:'', targetDate:'', notes:''};
        delete r.deletedAt; r.rank = nextRank();
        if(!back) rows.push(r);
        await save(r);
      } else {
        for(const r of existing.filter(x=>!x.deletedAt)){ r.deletedAt = new Date().toISOString(); await save(r); }
      }
      render();
    },
  };

  // ---------- rendering ----------
  function matches(r){
    const v = view(r);
    if(ui.partner && norm(v.partner) !== norm(ui.partner)) return false;
    const q = norm(ui.q);
    return !q || [v.partner, v.project, v.color, v.finish, v.texture, v.material, r.notes].some(x=>norm(x).includes(q));
  }
  function partners(){
    const set = new Set(['Pearl','Bader']);
    shown().forEach(r=>{ const p = view(r).partner; if(p) set.add(p); });
    if(dev()) dev().colors().forEach(c=>c.partner && set.add(c.partner));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function projects(){
    const set = new Set();
    shown().forEach(r=>{ const p = view(r).project; if(p) set.add(p); });
    if(dev()) dev().colors().forEach(c=>c.forTags.forEach(t=>set.add(t)));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function opt(list, val, blank){
    return `<option value="">${blank}</option>` + list.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('') +
      (val && !list.includes(val) ? `<option selected>${esc(val)}</option>` : '');
  }

  function render(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    const fk = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
    if(loadError){ root.innerHTML = `<div class="dv-empty">${esc(loadError)}</div>`; return; }
    if(!loaded){ root.innerHTML = `<div class="dv-empty">Loading Finishing Priorities…</div>`; return; }
    const all = shown(), list = all.filter(matches);
    const t = today(), soon = new Date(t); soon.setDate(soon.getDate() + 30);
    const late = all.filter(r=>{ const d = pd(r.receiveDate); return d && d < t; }).length;
    const arriving = all.filter(r=>{ const d = pd(r.receiveDate); return d && d >= t && d <= soon; }).length;
    const sqft = all.reduce((a,r)=>a + (Number(view(r).quantity)||0), 0);
    const card = (n,l,cls='') => `<div class="summary-card ${cls}"><div class="num">${n}</div><div class="lbl">${l}</div></div>`;
    root.innerHTML = `
      <div class="summary">
        ${card(all.length,'On the list')}
        ${card(fmtN(sqft) || 0,'Total sq ft')}
        ${card(arriving,'Due at Uncaged in 30 days')}
        ${card(late,'Past receive date', late ? 'dv-warn' : '')}
      </div>
      <div class="dv-toolbar">
        <div class="dv-tools-left">
          <input type="search" class="dv-search" placeholder="Search partner, project, color…" value="${esc(ui.q)}" data-act="search" data-fk="search">
          <label class="dv-inline">Partner <select data-act="partnerFilter">${opt(partners(), ui.partner, 'All partners')}</select></label>
        </div>
        <div class="dv-tools-right">
          <button class="btn" data-act="add">+ Add priority</button>
        </div>
      </div>
      <p class="pr-intro dv-muted">In priority order: #1 is the most urgent. Tick <b>Priorities</b> on a color in <b>In Development</b> to add it here with its details, or add one by hand.</p>
      ${all.length ? `<div class="dt-wrap"><table class="dt pr-table">
        <thead><tr><th>#</th><th>Partner</th><th>Project</th><th>Color / finish / texture</th><th class="r">Quantity</th><th>Uncaged receives</th><th>Brand target</th><th>Notes</th><th></th></tr></thead>
        <tbody>${list.map((r,i)=>rowHTML(r, all.indexOf(r), all.length)).join('') || `<tr><td colspan="9" class="dv-muted" style="padding:16px">Nothing matches these filters.</td></tr>`}</tbody>
      </table></div>` : `<div class="dv-empty"><p><b>No finishing priorities yet.</b></p><p>Tick <b>Priorities</b> on a color in <b>In Development</b>, or use <b>+ Add priority</b>.</p></div>`}`;
    if(fk){ const el = root.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if(el){ el.focus(); if(el.type==='search') el.setSelectionRange(el.value.length, el.value.length); } }
  }

  function rowHTML(r, pos, total){
    const v = view(r), t = today();
    const lateRecv = pd(r.receiveDate) && pd(r.receiveDate) < t;
    const lateTarget = pd(r.targetDate) && pd(r.targetDate) < t;
    const f = (k, extra='') => `data-p="${r.id}" data-f="${k}" data-fk="${r.id}|${k}" ${extra}`;
    const lockTip = 'title="Comes from In Development. Change it there."';
    const desc = [v.material, v.finish, v.texture].filter(Boolean).join(' · ');
    return `<tr class="pr-row ${v.linked ? 'linked' : 'manual'}">
      <td class="pr-rank"><b>${pos + 1}</b>
        <span class="pr-move"><button class="icon-btn" data-act="up" data-p="${r.id}" title="Higher priority" ${pos===0?'disabled':''}>↑</button>
        <button class="icon-btn" data-act="down" data-p="${r.id}" title="Lower priority" ${pos===total-1?'disabled':''}>↓</button></span></td>
      <td>${v.linked ? `<span ${lockTip}>${esc(v.partner) || '<span class="dv-muted">—</span>'}</span>`
        : `<input list="prPartnerList" value="${esc(r.partner)}" placeholder="Partner" ${f('partner')}>`}</td>
      <td>${v.linked ? `<span ${lockTip}>${v.project ? v.project.split(', ').map(x=>`<span class="dv-tag">${esc(x)}</span>`).join(' ') : '<span class="dv-muted">—</span>'}</span>`
        : `<input list="prProjectList" value="${esc(r.project)}" placeholder="Project" ${f('project')}>`}</td>
      <td class="pr-color">${v.linked ? `<div class="pr-color-in" ${lockTip}>
          <span class="dt-swatch" style="background:${esc(v.hex||'#ddd')}"></span>
          <span><b>${esc(v.color)}</b><br><span class="dv-muted">${esc(desc) || 'Finish / texture not set'}</span>
          <br><button class="linkish pr-link" data-act="openDev">From In Development</button> <span class="pr-stage" style="background:${v.stage.color}"></span><span class="dv-muted">${esc(v.stage.label)}</span></span></div>`
        : `<div class="pr-manual-color">
          <input value="${esc(r.color)}" placeholder="Color" ${f('color')}>
          <select ${f('material')}>${opt(MATERIALS, r.material, 'Material')}</select>
          <select ${f('finish')}>${opt(FINISHES, r.finish, 'Finish')}</select>
          <select ${f('texture')}>${opt(TEXTURES, r.texture, 'Texture')}</select></div>`}</td>
      <td class="r">${v.linked ? `<span ${lockTip}>${fmtN(v.quantity) ? fmtN(v.quantity) + ' sq ft' : '<span class="dv-muted">Not forecast</span>'}</span>`
        : `<span class="pr-qty"><input type="number" min="0" step="10" value="${esc(r.quantity)}" placeholder="—" ${f('quantity')}> sq ft</span>`}</td>
      <td><input type="date" value="${esc(r.receiveDate)}" class="${lateRecv ? 'pr-late' : ''}" ${f('receiveDate')}>${lateRecv ? '<div class="dt-late">Past due</div>' : ''}</td>
      <td><input type="date" value="${esc(r.targetDate)}" class="${lateTarget ? 'pr-late' : ''}" ${f('targetDate')}>${lateTarget ? '<div class="dt-late">Passed</div>' : ''}</td>
      <td><textarea rows="1" class="pr-notes" placeholder="Notes" ${f('notes')}>${esc(r.notes)}</textarea></td>
      <td><button class="icon-btn" data-act="remove" data-p="${r.id}" title="${v.linked ? 'Take off the list (also unticks it in In Development)' : 'Delete this priority'}">✕</button></td>
    </tr>`;
  }

  // ---------- events ----------
  async function onChange(e){
    const el = e.target;
    if(el.dataset.act === 'partnerFilter'){ ui.partner = el.value; return render(); }
    const r = rows.find(x=>x.id===el.dataset.p); const f = el.dataset.f;
    if(!r || !f) return;
    r[f] = f === 'quantity' ? (el.value === '' ? '' : String(Math.max(0, Math.round(Number(el.value)) || 0))) : el.value.trim();
    save(r).catch(err=>console.error(err));
    setTimeout(render, 0);
  }
  async function onClick(e){
    const b = e.target.closest('[data-act]'); if(!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    const act = b.dataset.act;
    if(act === 'add'){
      const r = {id:uid(), devId:'', rank:nextRank(), partner:ui.partner||'', project:'', quantity:'', color:'', material:'', finish:'', texture:'',
        receiveDate:'', targetDate:'', notes:''};
      rows.push(r); await save(r); ui.q = '';
      render();
      const el = document.querySelector(`[data-fk="${r.id}|${ui.partner ? 'project' : 'partner'}"]`); if(el) el.focus();
      return;
    }
    if(act === 'openDev'){ document.querySelector('.tab-btn[data-view="dev2"]').click(); return; }
    const r = rows.find(x=>x.id===b.dataset.p);
    if(act === 'up' || act === 'down'){
      const all = shown(), i = all.indexOf(r), j = act === 'up' ? i-1 : i+1;
      if(j < 0 || j >= all.length) return;
      all.splice(i, 1); all.splice(j, 0, r);
      for(let k = 0; k < all.length; k++){ if(all[k].rank !== k + 1){ all[k].rank = k + 1; await save(all[k]); } }
      return render();
    }
    if(act === 'remove'){
      const v = view(r);
      if(!confirm(v.linked ? `Take ${v.color} off Finishing Priorities? Its dates and notes come back if you tick it again in In Development.` : `Delete this priority${v.color ? ' (' + v.color + ')' : ''}?`)) return;
      r.deletedAt = new Date().toISOString(); await save(r);
      render(); if(typeof window.renderDev === 'function') window.renderDev();
    }
  }
  function onInput(e){
    if(e.target.dataset.act === 'search'){ ui.q = e.target.value; clearTimeout(onInput.t); onInput.t = setTimeout(render, 200); }
    if(e.target.classList.contains('pr-notes')){ e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 2 + 'px'; }
  }

  function setup(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    const dl = document.createElement('div'); dl.hidden = true;
    document.body.appendChild(dl);
    window.renderPrio = function(){
      dl.innerHTML = `<datalist id="prPartnerList">${partners().map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
        <datalist id="prProjectList">${projects().map(p=>`<option value="${esc(p)}">`).join('')}</datalist>`;
      render();
    };
    window.renderPrio();
    load().then(()=>window.renderPrio());
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
