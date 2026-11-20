/*
 * Finishing Priorities tab.
 *
 * Everything each finishing partner (Pearl, Bader, ...) is doing for Uncaged,
 * in priority order per partner: color matches and trial rounds from In
 * Development, plus other work such as panel orders or gloss adjustments.
 *
 * A row is either linked to a color in In Development (ticked there under
 * "Priorities") or entered here by hand. Linked rows show the color's partner,
 * project and color / finish / texture straight from In Development; the job,
 * quantity, dates, notes and done state are kept here.
 *
 * Rows can be dragged (by the handle) to reorder them within a partner, or to
 * move a hand-entered row to another partner. Ticking "Done" moves a row to
 * the Completed list.
 *
 * Saved as one record per row: "prio-<id>".
 */
(function(){
  const PREFIX = 'prio-';
  const ROOT_ID = 'prioRoot';
  const TEXTURES = ['Fine Grain','Pebble','Nappa'];
  const FINISHES = ['Matte','Satin','Gloss','High gloss'];
  const MATERIALS = ['Signature','Luxe'];
  const JOBS = ['Color match (A4s)','Trial round','Panels / production','Gloss / finish adjustment','Samples','Other'];
  const UNITS = ['A4s','panels','sq ft','meters','yards'];
  const NO_PARTNER = 'No partner yet';

  // Dropdowns backed by a shared list get "+ Add new…" (see lists.js).
  const LA = (name, label) => window.lists.attrs(name, label);
  const LO = (name, base, val, blank) => window.lists.opts(name, base, val, blank);

  let rows = [];
  let loaded = false, loadError = '';
  const ui = {q:'', partner:'', showDone:false};
  let dragId = null;

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const norm = s => String(s||'').trim().toLowerCase();
  function pd(s){ if(!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
  function today(){ const t = new Date(); t.setHours(0,0,0,0); return t; }
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function fmtD(s){ const d = pd(s); return d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''; }
  function fmtN(n){ return Number(n) ? Math.round(Number(n)).toLocaleString('en-US') : ''; }
  const live = () => rows.filter(r=>!r.deletedAt);
  const dev = () => window.devData && window.devData.loaded() ? window.devData : null;
  function linkedColor(r){ return r.devId && dev() ? dev().byId(r.devId) : null; }
  // Rows linked to a color that was deleted in In Development are hidden.
  const visible = () => live().filter(r=>!r.devId || !dev() || linkedColor(r));

  // What a row displays: linked rows read partner, project and color details from In Development.
  function view(r){
    const c = linkedColor(r);
    const base = {job:r.job||'', quantity:r.quantity||'', unit:r.unit||''};
    if(!c) return Object.assign(base, {partner:r.partner||'', project:r.project||'', color:r.color||'', hex:r.hex||'',
      material:r.material||'', finish:r.finish||'', texture:r.texture||'', linked:false});
    return Object.assign(base, {partner:c.partner||'', project:c.forTags.join(', '), color:c.name||'', hex:c.hex||'',
      material:c.material||'', finish:c.finish||'', texture:c.texture||'', linked:true, stage:window.devData.stage(c.stage),
      forecast:c.forecastSqft||''});
  }
  const partnerOf = r => view(r).partner || NO_PARTNER;
  const colorText = v => [v.color, [v.material, v.finish, v.texture].filter(Boolean).join(' · ')].filter(Boolean).join(' – ');

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
  function jobFromStep(type){ return type === 'trial' ? 'Trial round' : type === 'color_match' ? 'Color match (A4s)' : ''; }

  // Used by In Development's "Priorities" tick box.
  window.prioData = {
    has: devId => loaded && live().some(r=>r.devId===devId),
    async toggle(devId, on){
      if(!loaded) return;
      const existing = rows.filter(r=>r.devId===devId);
      if(on){
        if(live().some(r=>r.devId===devId)) return;
        const back = existing.find(r=>r.deletedAt);      // re-ticked: bring back its job, dates and notes
        const c = dev() && dev().byId(devId);
        const r = back || {id:uid(), devId, job: c ? jobFromStep(dev().stepType(c)) : '', quantity:'', unit:'A4s',
          receiveDate:'', targetDate:'', notes:'', done:false};
        delete r.deletedAt; r.rank = nextRank();
        if(!back) rows.push(r);
        await save(r);
      } else {
        for(const r of existing.filter(x=>!x.deletedAt)){ r.deletedAt = new Date().toISOString(); await save(r); }
      }
      render();
    },
  };

  // ---------- grouping ----------
  function matches(r){
    const v = view(r);
    if(ui.partner && partnerOf(r) !== ui.partner) return false;
    const q = norm(ui.q);
    return !q || [v.partner, v.project, v.color, v.finish, v.texture, v.material, v.job, r.notes].some(x=>norm(x).includes(q));
  }
  // Open rows by partner, each list in priority order.
  function byPartner(list){
    const map = new Map();
    list.slice().sort((a,b)=>(a.rank||0)-(b.rank||0)).forEach(r=>{
      const p = partnerOf(r);
      if(!map.has(p)) map.set(p, []);
      map.get(p).push(r);
    });
    return [...map.entries()].sort((a,b)=>{
      if((a[0]===NO_PARTNER) !== (b[0]===NO_PARTNER)) return a[0]===NO_PARTNER ? 1 : -1;
      return b[1].length - a[1].length || a[0].localeCompare(b[0]);
    });
  }
  function partners(){
    const set = new Set(['Pearl','Bader']);
    visible().forEach(r=>{ const p = view(r).partner; if(p) set.add(p); });
    if(dev()) dev().colors().forEach(c=>c.partner && set.add(c.partner));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function projects(){
    const set = new Set();
    visible().forEach(r=>{ const p = view(r).project; if(p) set.add(p); });
    if(dev()) dev().colors().forEach(c=>c.forTags.forEach(t=>set.add(t)));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function opt(list, val, blank){
    return (blank !== null ? `<option value="">${blank}</option>` : '') + list.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('') +
      (val && !list.includes(val) ? `<option selected>${esc(val)}</option>` : '');
  }

  // ---------- rendering ----------
  function render(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    const fk = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
    if(loadError){ root.innerHTML = `<div class="dv-empty">${esc(loadError)}</div>`; return; }
    if(!loaded){ root.innerHTML = `<div class="dv-empty">Loading Finishing Priorities…</div>`; return; }
    const open = visible().filter(r=>!r.done), done = visible().filter(r=>r.done);
    const t = today(), soon = new Date(t); soon.setDate(soon.getDate() + 30);
    const late = open.filter(r=>{ const d = pd(r.receiveDate); return d && d < t; }).length;
    const arriving = open.filter(r=>{ const d = pd(r.receiveDate); return d && d >= t && d <= soon; }).length;
    const groups = byPartner(open.filter(matches));
    const card = (n,l,cls='') => `<div class="summary-card ${cls}"><div class="num">${n}</div><div class="lbl">${l}</div></div>`;
    root.innerHTML = `
      <div class="summary">
        ${card(open.length,'Open jobs')}
        ${card(byPartner(open).filter(([p])=>p!==NO_PARTNER).length,'Partners with work')}
        ${card(arriving,'Due at Uncaged in 30 days')}
        ${card(late,'Past receive date', late ? 'dv-warn' : '')}
      </div>
      <div class="dv-toolbar">
        <div class="dv-tools-left">
          <input type="search" class="dv-search" placeholder="Search project, color, job…" value="${esc(ui.q)}" data-act="search" data-fk="search">
          <label class="dv-inline">Partner <select data-act="partnerFilter">${opt(partners(), ui.partner, 'All partners')}</select></label>
        </div>
        <div class="dv-tools-right"><button class="btn" data-act="add">+ Add job</button></div>
      </div>
      <p class="pr-intro dv-muted">Each partner's work for Uncaged, most urgent first. Drag a row by <b>⠿</b> to reorder it. Tick <b>Done</b> when it's finished. Tick <b>Priorities</b> on a color in <b>In Development</b> to add it here, or add a job by hand.</p>
      ${groups.length ? groups.map(([p, list])=>sectionHTML(p, list)).join('') :
        `<div class="dv-empty"><p><b>${open.length ? 'Nothing matches these filters.' : 'No open jobs.'}</b></p>${open.length ? '' : '<p>Use <b>+ Add job</b>, or tick <b>Priorities</b> on a color in <b>In Development</b>.</p>'}</div>`}
      ${done.length ? `<div class="pr-done">
        <button class="linkish pr-done-toggle" data-act="toggleDone">${ui.showDone ? '▾' : '▸'} Completed (${done.length})</button>
        ${ui.showDone ? `<div class="dt-wrap"><table class="dt pr-table pr-done-table">
          <thead><tr><th>Done</th><th>Partner</th><th>Project / brand</th><th>Job</th><th>Color / finish / texture</th><th class="r">Quantity</th><th>Completed</th><th></th></tr></thead>
          <tbody>${done.sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||'')).map(doneRowHTML).join('')}</tbody></table></div>` : ''}
      </div>` : ''}`;
    if(fk){ const el = root.querySelector(`[data-fk="${CSS.escape(fk)}"]`); if(el){ el.focus(); if(el.type==='search') el.setSelectionRange(el.value.length, el.value.length); } }
    root.querySelectorAll('.pr-notes').forEach(grow);
  }

  function sectionHTML(partner, list){
    const sqft = list.reduce((a,r)=>{ const v = view(r); return a + (v.unit === 'sq ft' ? Number(v.quantity)||0 : 0); }, 0);
    return `<section class="pr-section" data-partner="${esc(partner)}">
      <div class="pr-section-head">
        <h3>${esc(partner)} <span class="dv-count">${list.length} job${list.length===1?'':'s'}${sqft ? ` · ${fmtN(sqft)} sq ft` : ''}</span></h3>
        <span class="pr-section-btns">
          <button class="btn secondary" data-act="copy" data-partner="${esc(partner)}" title="Copy this list to paste into an email or message">Copy list</button>
          <button class="btn secondary" data-act="add" data-partner="${esc(partner === NO_PARTNER ? '' : partner)}">+ Add job</button>
        </span>
      </div>
      <div class="dt-wrap"><table class="dt pr-table">
        <thead><tr><th class="pr-h-handle"></th><th>#</th><th>Done</th><th>Project / brand</th><th>Job</th><th>Color / finish / texture</th><th class="r">Quantity</th><th>Uncaged receives</th><th>Brand target</th><th>Notes</th><th></th></tr></thead>
        <tbody data-partner="${esc(partner)}">${list.map((r,i)=>rowHTML(r, i, list.length)).join('')}</tbody>
      </table></div>
    </section>`;
  }

  function rowHTML(r, pos, total){
    const v = view(r), t = today();
    const lateRecv = pd(r.receiveDate) && pd(r.receiveDate) < t;
    const lateTarget = pd(r.targetDate) && pd(r.targetDate) < t;
    const f = (k, extra='') => `data-p="${r.id}" data-f="${k}" data-fk="${r.id}|${k}" ${extra}`;
    const lockTip = 'title="Comes from In Development. Change it there."';
    const desc = [v.material, v.finish, v.texture].filter(Boolean).join(' · ');
    return `<tr class="pr-row ${v.linked ? 'linked' : 'manual'}" data-id="${r.id}">
      <td class="pr-handle" title="Drag to reorder${v.linked ? '' : ' or move to another partner'}">⠿</td>
      <td class="pr-rank"><b>${pos + 1}</b>
        <span class="pr-move"><button class="icon-btn" data-act="up" data-p="${r.id}" title="Higher priority" ${pos===0?'disabled':''}>↑</button>
        <button class="icon-btn" data-act="down" data-p="${r.id}" title="Lower priority" ${pos===total-1?'disabled':''}>↓</button></span></td>
      <td class="pr-donecell"><input type="checkbox" data-act="done" data-p="${r.id}" title="Mark done"></td>
      <td>${v.linked ? `<span ${lockTip}>${v.project ? v.project.split(', ').map(x=>`<span class="dv-tag">${esc(x)}</span>`).join(' ') : '<span class="dv-muted">—</span>'}</span>`
        : `<input list="prProjectList" value="${esc(r.project)}" placeholder="Project / brand" ${f('project')}>`}
        ${v.linked ? '' : `<div class="pr-partner-edit"><input list="prPartnerList" value="${esc(r.partner)}" placeholder="Partner" ${f('partner')} title="Partner"></div>`}</td>
      <td><select class="pr-job ${v.job ? '' : 'unset'}" ${f('job')} ${LA('job','job type')}>${LO('job', JOBS, v.job, 'Job?')}</select></td>
      <td class="pr-color">${v.linked ? `<div class="pr-color-in" ${lockTip}>
          <span class="dt-swatch" style="background:${esc(v.hex||'#ddd')}"></span>
          <span><b>${esc(v.color)}</b><br><span class="dv-muted">${esc(desc) || 'Finish / texture not set'}</span>
          <br><button class="linkish pr-link" data-act="openDev">From In Development</button> <span class="pr-stage" style="background:${v.stage.color}"></span><span class="dv-muted">${esc(v.stage.label)}</span></span></div>`
        : `<div class="pr-manual-color">
          <input value="${esc(r.color)}" placeholder="Color" ${f('color')}>
          <select ${f('material')} ${LA('material','material')}>${LO('material', MATERIALS, r.material, 'Material')}</select>
          <select ${f('finish')} ${LA('finish','finish')}>${LO('finish', FINISHES, r.finish, 'Finish')}</select>
          <select ${f('texture')} ${LA('texture','texture')}>${LO('texture', TEXTURES, r.texture, 'Texture')}</select></div>`}</td>
      <td class="r"><span class="pr-qty"><input type="number" min="0" step="1" value="${esc(r.quantity)}" placeholder="${v.linked && fmtN(v.forecast) && (r.unit||'')==='sq ft' ? esc(v.forecast) : '—'}" ${f('quantity')}>
        <select ${f('unit')} ${LA('unit','unit')}>${LO('unit', UNITS, r.unit || '', null)}</select></span>
        ${v.linked && fmtN(v.forecast) ? `<div class="dv-muted pr-fc">Forecast order: ${fmtN(v.forecast)} sq ft</div>` : ''}</td>
      <td><input type="date" value="${esc(r.receiveDate)}" class="${lateRecv ? 'pr-late' : ''}" ${f('receiveDate')}>${lateRecv ? '<div class="dt-late">Past due</div>' : ''}</td>
      <td><input type="date" value="${esc(r.targetDate)}" class="${lateTarget ? 'pr-late' : ''}" ${f('targetDate')}>${lateTarget ? '<div class="dt-late">Passed</div>' : ''}</td>
      <td><textarea rows="1" class="pr-notes" placeholder="Notes, e.g. estimated" ${f('notes')}>${esc(r.notes)}</textarea></td>
      <td><button class="icon-btn" data-act="remove" data-p="${r.id}" title="${v.linked ? 'Take off the list (also unticks it in In Development)' : 'Delete this job'}">✕</button></td>
    </tr>`;
  }

  function doneRowHTML(r){
    const v = view(r);
    return `<tr class="pr-row done">
      <td class="pr-donecell"><input type="checkbox" data-act="done" data-p="${r.id}" checked title="Untick to put it back on the list"></td>
      <td>${esc(v.partner) || '<span class="dv-muted">—</span>'}</td>
      <td>${esc(v.project) || '<span class="dv-muted">—</span>'}</td>
      <td>${esc(v.job) || '<span class="dv-muted">—</span>'}</td>
      <td>${esc(colorText(v)) || '<span class="dv-muted">—</span>'}</td>
      <td class="r">${fmtN(v.quantity) ? fmtN(v.quantity) + ' ' + esc(v.unit) : '—'}</td>
      <td>${esc(fmtD(r.doneAt)) || '—'}</td>
      <td><button class="icon-btn" data-act="remove" data-p="${r.id}" title="Delete">✕</button></td>
    </tr>`;
  }

  function grow(t){ t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }

  // ---------- reordering ----------
  // Puts row r at index `to` in its partner's open list. The list reuses its own
  // rank numbers (plus r's), so other partners' rows are never renumbered.
  async function placeAt(r, partner, to){
    const list = visible().filter(x=>!x.done && x !== r && partnerOf(x) === partner).sort((a,b)=>(a.rank||0)-(b.rank||0));
    list.splice(Math.max(0, Math.min(to, list.length)), 0, r);
    let slots = list.map(x=>x.rank||0).sort((a,b)=>a-b);
    if(slots.includes(0) || new Set(slots).size < slots.length){ const base = nextRank(); slots = list.map((x,k)=>base + k); }
    for(let k = 0; k < list.length; k++){ if(list[k].rank !== slots[k] || list[k] === r){ list[k].rank = slots[k]; await save(list[k]); } }
  }

  // ---------- copy as text ----------
  function listText(partner){
    const list = visible().filter(r=>!r.done && partnerOf(r) === partner).sort((a,b)=>(a.rank||0)-(b.rank||0));
    const lines = list.map((r,i)=>{
      const v = view(r);
      const what = [v.project, colorText(v), v.job].filter(Boolean).join(' – ');
      const qty = fmtN(v.quantity) ? `${fmtN(v.quantity)} ${v.unit}` : '';
      const dates = [r.receiveDate ? `Uncaged receives ${fmtD(r.receiveDate)}` : '', r.targetDate ? `brand target ${fmtD(r.targetDate)}` : ''].filter(Boolean).join(', ');
      return `${i+1}. ${what}${qty ? ` (${qty})` : ''}${dates ? ` – ${dates}` : ''}${r.notes ? ` – ${r.notes}` : ''}`;
    });
    return `${partner} priorities as of ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}\n` + lines.join('\n');
  }
  async function copyText(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch(e){
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch(err){}
      ta.remove(); return ok;
    }
  }
  function toast(text){
    let el = document.getElementById('dvToast');
    if(!el){ el = document.createElement('div'); el.id = 'dvToast'; el.className = 'dv-toast'; document.body.appendChild(el); }
    el.textContent = text; el.style.display = '';
    clearTimeout(toast.t); toast.t = setTimeout(()=>{ el.style.display = 'none'; }, 3500);
  }

  // ---------- events ----------
  async function onChange(e){
    const el = e.target;
    if(el.dataset.act === 'partnerFilter'){ ui.partner = el.value; return render(); }
    const r = rows.find(x=>x.id===el.dataset.p);
    if(el.dataset.act === 'done' && r){
      r.done = el.checked; r.doneAt = el.checked ? iso(new Date()) : '';
      if(!el.checked) r.rank = nextRank();
      await save(r); render(); if(typeof window.renderDev === 'function') window.renderDev();
      toast(el.checked ? 'Marked done. It is in the Completed list at the bottom.' : 'Back on the list, at the bottom of its partner.');
      return;
    }
    const f = el.dataset.f;
    if(!r || !f) return;
    r[f] = f === 'quantity' ? (el.value === '' ? '' : String(Math.max(0, Number(el.value) || 0))) : el.value.trim();
    save(r).catch(err=>console.error(err));
    setTimeout(render, 0);
  }
  async function onClick(e){
    const b = e.target.closest('[data-act]'); if(!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
    const act = b.dataset.act;
    if(act === 'add'){
      const partner = b.dataset.partner != null ? b.dataset.partner : (ui.partner || '');
      const r = {id:uid(), devId:'', rank:nextRank(), partner, project:'', job:'', quantity:'', unit:'A4s', color:'', material:'', finish:'', texture:'',
        receiveDate:'', targetDate:'', notes:'', done:false};
      rows.push(r); await save(r); ui.q = '';
      render();
      const el = document.querySelector(`[data-fk="${r.id}|project"]`); if(el) el.focus();
      return;
    }
    if(act === 'toggleDone'){ ui.showDone = !ui.showDone; return render(); }
    if(act === 'openDev'){ document.querySelector('.tab-btn[data-view="dev2"]').click(); return; }
    if(act === 'copy'){
      const ok = await copyText(listText(b.dataset.partner));
      return toast(ok ? `${b.dataset.partner} list copied. Paste it into an email or message.` : 'Couldn’t copy automatically. Select the rows and copy them instead.');
    }
    const r = rows.find(x=>x.id===b.dataset.p);
    if(!r) return;
    if(act === 'up' || act === 'down'){
      const p = partnerOf(r);
      const list = visible().filter(x=>!x.done && partnerOf(x) === p).sort((a,c)=>(a.rank||0)-(c.rank||0));
      const i = list.indexOf(r), j = act === 'up' ? i-1 : i+1;
      if(j < 0 || j >= list.length) return;
      await placeAt(r, p, j);
      return render();
    }
    if(act === 'remove'){
      const v = view(r);
      if(!confirm(v.linked ? `Take ${v.color} off Finishing Priorities? Its job, dates and notes come back if you tick it again in In Development.` : `Delete this job${v.color || v.project ? ' (' + [v.project, v.color].filter(Boolean).join(' – ') + ')' : ''}?`)) return;
      r.deletedAt = new Date().toISOString(); await save(r);
      render(); if(typeof window.renderDev === 'function') window.renderDev();
    }
  }
  function onInput(e){
    if(e.target.dataset.act === 'search'){ ui.q = e.target.value; clearTimeout(onInput.t); onInput.t = setTimeout(render, 200); }
    if(e.target.classList.contains('pr-notes')) grow(e.target);
  }

  // Drag by the ⠿ handle. Rows become draggable only while the handle is held,
  // so typing in a row's fields is never mistaken for a drag.
  function clearMarks(root){ root.querySelectorAll('.drop-before,.drop-after,.drop-into').forEach(x=>x.classList.remove('drop-before','drop-after','drop-into')); }
  function onPointerDown(e){
    const h = e.target.closest('.pr-handle'); if(!h) return;
    h.closest('tr').setAttribute('draggable', 'true');
  }
  function onDragStart(e){
    const tr = e.target.closest && e.target.closest('tr.pr-row');
    if(!tr || tr.getAttribute('draggable') !== 'true') return;
    dragId = tr.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch(err){}
    tr.classList.add('dragging');
  }
  function onDragOver(e){
    if(!dragId) return;
    const root = e.currentTarget;
    const tr = e.target.closest('tr.pr-row'), sec = e.target.closest('.pr-section');
    if(!tr && !sec) return;
    e.preventDefault();
    clearMarks(root);
    if(tr && tr.dataset.id !== dragId && !tr.classList.contains('done')){
      const box = tr.getBoundingClientRect();
      tr.classList.add(e.clientY < box.top + box.height/2 ? 'drop-before' : 'drop-after');
    } else if(sec && !tr) sec.classList.add('drop-into');
  }
  async function onDrop(e){
    if(!dragId) return;
    e.preventDefault();
    const root = e.currentTarget;
    const r = rows.find(x=>x.id===dragId);
    const tr = e.target.closest('tr.pr-row'), sec = e.target.closest('.pr-section');
    const before = tr && tr.classList.contains('drop-before');
    clearMarks(root);
    endDrag(root);
    if(!r || !sec) return;
    const target = sec.dataset.partner;
    if(target !== partnerOf(r)){
      if(view(r).linked){ toast('This job comes from In Development, so its partner is set there. Change the partner in In Development.'); return render(); }
      r.partner = target === NO_PARTNER ? '' : target;
    }
    const list = visible().filter(x=>!x.done && x !== r && partnerOf(x) === target).sort((a,b)=>(a.rank||0)-(b.rank||0));
    let to = list.length;
    if(tr && tr.dataset.id !== r.id){ const i = list.findIndex(x=>x.id===tr.dataset.id); if(i >= 0) to = before ? i : i + 1; }
    await placeAt(r, target, to);
    render();
  }
  function endDrag(root){
    dragId = null;
    (root || document).querySelectorAll('tr[draggable]').forEach(x=>{ x.removeAttribute('draggable'); x.classList.remove('dragging'); });
  }

  function setup(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('mousedown', onPointerDown);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('dragover', onDragOver);
    root.addEventListener('drop', onDrop);
    root.addEventListener('dragend', ()=>{ clearMarks(root); endDrag(root); });
    root.addEventListener('mouseup', ()=>{ if(!dragId) endDrag(root); });
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
