/*
 * In Development tab.
 *
 * Every color in development is saved as its own record ("dev-<id>"), so two
 * teammates editing different colors never block each other. Shared lists
 * (base colors) are saved under "devSettings".
 *
 * Client data is never written into this file: the starting data is loaded
 * with More → Import, and lives only in the team database.
 */
(function(){
  const PREFIX = 'dev-';
  const SETTINGS_KEY = 'devSettings';
  const PX = 7;                 // pixels per day on the timeline
  const DAY = 86400000;

  const STAGES = [
    {key:'to_be_trialed',   label:'To be trialed',                   color:'#9A9184'},
    {key:'on_hold',         label:'On hold',                         color:'#B8AFA2'},
    {key:'coating_trial',   label:'Coating trial in progress',       color:'#C99A3E'},
    {key:'testing',         label:'Testing in progress',             color:'#5B7DA8'},
    {key:'passed',          label:'Passed testing',                  color:'#8FAE8F'},
    {key:'brand_review',    label:'With brand for approval',         color:'#7A6FA0'},
    {key:'failed_retrying', label:'Failed – more trials in progress',color:'#B65C4A'},
    {key:'failed_stopped',  label:'Failed – no more trials',         color:'#4A453F'},
    {key:'final',           label:'Approved – final',                color:'#4F7A4F'},
  ];
  const BRAND_FEEDBACK = [
    {key:'',           label:'Not sent'},
    {key:'with_brand', label:'With brand'},
    {key:'approved',   label:'Approved'},
    {key:'changes',    label:'Changes requested'},
  ];
  const feedbackLabel = k => (BRAND_FEEDBACK.find(f=>f.key===(k||'')) || BRAND_FEEDBACK[0]).label;
  const STEP_STATUSES = ['Not started','In progress','Complete','At risk','TBD'];
  const FINISHES = ['Matte','Satin','Gloss','High gloss'];
  const MATERIALS = ['Luxe','Signature'];
  const BASE_FORMS = ['Full scale','Lab roll'];
  const AVAILABILITY = [
    'Full scale material / panels available',
    'Swatches available, full scale run scheduled',
    'Swatches available, no full scale run scheduled',
    'No swatches, full scale run scheduled',
    'No swatches, no full scale run scheduled',
  ];
  const TEST_FIELDS = [
    {k:'ballyFlex',  label:'Bally flex'},
    {k:'martindale', label:'Martindale'},
    {k:'coatWeight', label:'Coat weight'},
    {k:'deltaE',     label:'ΔE vs base'},
    {k:'L', label:'L*'}, {k:'a', label:'a*'}, {k:'b', label:'b*'},
  ];
  // Standard R&D steps. Typical durations (days) come from the Finishing Steps tab.
  // In Development ends when a color passes testing; brand approval, purchase
  // orders and production runs belong to the future Production tab.
  const TEMPLATE = [
    {a:p=>`Send Pantone / swatch to ${p}`,   o:()=>'Uncaged', days:4},
    {a:p=>`${p}: lab color match`,           o:p=>p,          days:14},
    {a:p=>`Ship samples from ${p} to Uncaged`, o:p=>p,        days:4},
    {a:()=>'Uncaged testing',                o:()=>'Uncaged', days:7},
  ];
  // Steps saved before phases existed are sorted by name: brand and production
  // work is kept for the Production tab, everything else is R&D.
  const PRODUCTION_RE = /approval|purchase order|\bPO\b|trim panel|spray|ship panels|inspect|swatch ?book|ship (a4s? )?to (?!uncaged)|ship samples to (?!uncaged)|ships? sample to (?!uncaged)/i;
  function phaseOf(s){ return s.phase || (PRODUCTION_RE.test(s.activity||'') ? 'production' : 'rd'); }
  function rdSteps(c){ return c.steps.filter(s=>phaseOf(s)==='rd'); }
  // Only the approved final shade moves to Stock Offerings.
  const DONE_STAGES = ['final','failed_stopped'];
  const DEFAULT_BASES = ['Coffee','Stone','Onyx','Natural','Off-White','Cherry'];

  let colors = [];
  let settings = {baseColors: DEFAULT_BASES.map(n=>({name:n, active:true}))};
  let loaded = false, loadError = '';
  const ui = Object.assign({groupBy:'for', stage:'all', q:'', showDone:false}, readPrefs());
  const expanded = new Set();
  const selected = new Set();
  let didInitialScroll = false;
  let editing = null;      // color being edited in the modal (a copy)
  let editingIsNew = false;

  // ---------- helpers ----------
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function readPrefs(){
    try { const p = JSON.parse(localStorage.getItem('uncaged-dev-prefs') || '{}'); return {groupBy:p.groupBy||'for'}; }
    catch(e){ return {}; }
  }
  function writePrefs(){
    try { localStorage.setItem('uncaged-dev-prefs', JSON.stringify({groupBy:ui.groupBy})); } catch(e){}
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function pd(s){ if(!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
  function iso(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  function addD(d,n){ const c = new Date(d); c.setDate(c.getDate()+n); return c; }
  function fmt(s){ const d = pd(s); return d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''; }
  function today(){ const t = new Date(); t.setHours(0,0,0,0); return t; }
  function days(s){ const a = pd(s.start), b = pd(s.end); return a && b ? Math.round((b-a)/DAY)+1 : ''; }
  function stageDef(k){ return STAGES.find(s=>s.key===k) || STAGES[0]; }
  function ownerColor(o){
    const k = (o||'').trim().toLowerCase();
    if(!k) return '#A39A8C';
    if(k.includes('pearl')) return '#8B5A34';
    if(k.includes('bader')) return '#C99A3E';
    if(k.includes('uncaged')) return '#6E8F6E';
    if(k.includes('marketing')) return '#7A6FA0';
    if(k.includes('milestone')) return '#2A2621';
    return '#B65C4A'; // a brand or client
  }
  function contrast(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return '#2A2621';
    const n = parseInt(m[1],16), r=n>>16, g=(n>>8)&255, b=n&255;
    return (r*299+g*587+b*114)/1000 > 150 ? '#2A2621' : '#FFFFFF';
  }
  function live(){ return colors.filter(c=>!c.deletedAt); }
  function byId(id){ return colors.find(c=>c.id===id); }
  function normalize(c){
    c.forTags = Array.isArray(c.forTags) ? c.forTags : [];
    c.bases = Array.isArray(c.bases) ? c.bases : [];
    c.trials = Array.isArray(c.trials) ? c.trials : [];
    c.steps = Array.isArray(c.steps) ? c.steps : [];
    c.steps.forEach(s=>{ if(!s.id) s.id = uid(); if(!s.phase) s.phase = phaseOf(s); });
    if(typeof c.order !== 'number') c.order = Date.now();
    return c;
  }
  function currentStep(c){
    const st = rdSteps(c);
    return st.find(s=>s.status==='In progress' || s.status==='At risk') ||
           st.find(s=>s.status!=='Complete');
  }
  function activeBases(){ return settings.baseColors.filter(b=>b.active).map(b=>b.name); }
  function allForTags(){
    const set = new Set();
    live().forEach(c=>c.forTags.forEach(t=>set.add(t)));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function allOwners(){
    const set = new Set(['Pearl','Bader','Uncaged','Marketing','Milestone']);
    live().forEach(c=>{ c.steps.forEach(s=>s.owner && set.add(s.owner)); c.forTags.forEach(t=>set.add(t)); });
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function allPartners(){
    const set = new Set(['Pearl','Bader']);
    live().forEach(c=>c.partner && set.add(c.partner));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }

  // ---------- storage ----------
  async function load(){
    try {
      try {
        const r = await window.storage.get(SETTINGS_KEY);
        const s = JSON.parse(r.value);
        if(s && Array.isArray(s.baseColors)) settings = s;
      } catch(e){ /* first run: defaults */ }
      const {keys} = await window.storage.list(PREFIX);
      const recs = await Promise.all(keys.map(k => window.storage.get(k).then(r=>JSON.parse(r.value)).catch(()=>null)));
      colors = recs.filter(Boolean).map(normalize);
      loaded = true;
    } catch(e){
      loadError = 'Couldn’t load colors in development (' + (e.message||e) + '). Reload to try again.';
      console.error(e);
    }
    render();
  }
  async function save(c){
    c.updatedAt = new Date().toISOString();
    await window.storage.set(PREFIX + c.id, JSON.stringify(c));
  }
  async function saveSettings(){
    await window.storage.set(SETTINGS_KEY, JSON.stringify(settings));
  }
  function saveQuietly(c){
    save(c).catch(e=>console.error('Save failed', e));
  }

  // ---------- grouping & filtering ----------
  function matches(c){
    if(ui.stage !== 'all' && c.stage !== ui.stage) return false;
    if(ui.stage === 'all' && !ui.showDone && DONE_STAGES.includes(c.stage)) return false;
    const q = ui.q.trim().toLowerCase();
    if(!q) return true;
    return [c.name, c.pantone, c.partner, c.material, c.finish, c.notes, ...c.forTags, ...c.bases]
      .some(v => (v||'').toLowerCase().includes(q));
  }
  function groups(){
    const list = live().filter(matches).sort((a,b)=>a.order-b.order);
    const map = new Map();
    const push = (k,c) => { if(!map.has(k)) map.set(k, []); map.get(k).push(c); };
    const NONE = {for:'No brand or collection yet', base:'No base set', partner:'No partner set'};
    list.forEach(c=>{
      if(ui.groupBy === 'none') return push('All colors', c);
      let keys = ui.groupBy==='for' ? c.forTags : ui.groupBy==='base' ? c.bases : (c.partner ? [c.partner] : []);
      if(!keys.length) keys = [NONE[ui.groupBy]];
      keys.forEach(k=>push(k,c));
    });
    const entries = [...map.entries()];
    entries.sort((a,b)=>{
      const an = Object.values(NONE).includes(a[0]), bn = Object.values(NONE).includes(b[0]);
      if(an !== bn) return an ? 1 : -1;
      if(ui.groupBy === 'base'){
        const order = settings.baseColors.map(x=>x.name);
        return (order.indexOf(a[0])+1||99) - (order.indexOf(b[0])+1||99);
      }
      return 0; // keep first-appearance order
    });
    return entries;
  }

  function range(){
    const t = today();
    let min = addD(t,-28), max = addD(t,84);
    live().filter(matches).forEach(c=>{
      rdSteps(c).forEach(s=>{ [pd(s.start),pd(s.end)].forEach(d=>{ if(d){ if(d<min) min=d; if(d>max) max=d; } }); });
      c.trials.forEach(s=>{ [pd(s.start),pd(s.end)].forEach(d=>{ if(d){ if(d<min) min=d; if(d>max) max=d; } }); });
    });
    const start = addD(min, -((min.getDay()+6)%7));   // back to Monday
    const end = addD(max, 21);
    return {start, end, width: Math.round((end-start)/DAY)*PX};
  }
  function xOf(d, r){ return Math.round((d - r.start)/DAY)*PX; }
  function bar(start, end, color, cls, title, r){
    const a = pd(start), b = pd(end) || a;
    if(!a) return '';
    const s = a <= b ? a : b, e = a <= b ? b : a;
    const left = xOf(s,r), width = Math.max(PX, xOf(e,r) - left + PX);
    return `<div class="dv-bar ${cls||''}" style="left:${left}px;width:${width}px;background:${color}" title="${esc(title)}"></div>`;
  }

  // ---------- rendering ----------
  function render(){
    const root = document.getElementById('devRoot');
    if(!root) return;
    const scroller = root.querySelector('.dv-scroll');
    const keepScroll = scroller ? scroller.scrollLeft : null;
    const focusKey = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.fk : null;

    if(loadError){ root.innerHTML = `<div class="dv-empty">${esc(loadError)}</div>`; return; }
    if(!loaded){ root.innerHTML = `<div class="dv-empty">Loading colors in development…</div>`; return; }

    const r = range();
    const gs = groups();
    root.innerHTML = `
      ${summaryHTML()}
      <div class="dv-toolbar">
        <div class="dv-tools-left">
          <input type="search" class="dv-search" placeholder="Search colors, brands, Pantone…" value="${esc(ui.q)}" data-act="search" data-fk="search">
          <label class="dv-inline">Group by
            <select data-act="groupBy">
              ${[['for','Brand / collection'],['base','Base color'],['partner','Partner'],['none','No grouping']]
                .map(([k,l])=>`<option value="${k}" ${ui.groupBy===k?'selected':''}>${l}</option>`).join('')}
            </select>
          </label>
          <label class="dv-inline">Stage
            <select data-act="stageFilter">
              <option value="all">All active stages</option>
              ${STAGES.map(s=>`<option value="${s.key}" ${ui.stage===s.key?'selected':''}>${esc(s.label)} (${live().filter(c=>c.stage===s.key).length})</option>`).join('')}
            </select>
          </label>
          <label class="dv-inline"><input type="checkbox" data-act="showDone" ${ui.showDone?'checked':''}> Show approved &amp; stopped colors</label>
        </div>
        <div class="dv-tools-right">
          <button class="btn secondary" data-act="expandAll">${expanded.size ? 'Collapse all' : 'Expand all'}</button>
          <div class="dv-menu">
            <button class="btn secondary" data-act="menu">More ▾</button>
            <div class="dv-menu-list" hidden>
              <button data-act="exportJson">Export backup (.json)</button>
              <button data-act="exportCsv">Export steps for Excel (.csv)</button>
              <button data-act="import">Import from file…</button>
              <button data-act="bases">Edit base color list</button>
              <button data-act="trash">Recently deleted (${colors.filter(c=>c.deletedAt).length})</button>
            </div>
          </div>
          <button class="btn" data-act="new">+ New color</button>
        </div>
      </div>
      ${bulkHTML()}
      <div class="legend dv-legend">
        ${[['Pearl','#8B5A34'],['Bader','#C99A3E'],['Uncaged','#6E8F6E'],['Brand / client','#B65C4A'],['Marketing','#7A6FA0']]
          .map(([l,c])=>`<span class="item"><span class="dot" style="background:${c}"></span>${l}</span>`).join('')}
        <span class="item"><span class="dv-trial-dot"></span>Trial round</span>
        <span class="item"><span class="line-swatch" style="border-color:var(--rose)"></span>Today</span>
      </div>
      ${live().length === 0 ? emptyHTML() : `
      <div class="dv-board"><div class="dv-scroll"><div class="dv-inner" style="width:calc(var(--dv-left) + ${r.width}px)">
        ${headerHTML(r)}
        ${gs.map(([name, list])=>`
          <div class="dv-row dv-group-row"><div class="dv-left dv-group-label">${esc(name)} <span class="dv-count">${list.length}</span></div><div class="dv-track" style="width:${r.width}px"></div></div>
          ${list.map(c=>colorHTML(c, r, name)).join('')}
        `).join('') || `<div class="dv-row"><div class="dv-left dv-muted">No colors match these filters.${!ui.showDone ? ' Approved and stopped colors are hidden. Turn on “Show approved &amp; stopped colors” to see them.' : ''}</div></div>`}
        <div class="dv-today" style="left:calc(var(--dv-left) + ${xOf(today(), r) + PX/2}px)"></div>
      </div></div></div>`}
    `;

    const sc = root.querySelector('.dv-scroll');
    if(sc){
      if(!didInitialScroll && sc.clientWidth > 0){
        sc.scrollLeft = Math.max(0, xOf(today(), r) - 240);   // open on this week
        didInitialScroll = true;
      } else if(keepScroll !== null) sc.scrollLeft = keepScroll;
    }
    if(focusKey){
      const el = root.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`);
      if(el){ el.focus(); if(el.setSelectionRange && el.type==='search') el.setSelectionRange(el.value.length, el.value.length); }
    }
    root.querySelectorAll('textarea.dv-notes').forEach(autoGrow);
  }

  function summaryHTML(){
    const L = live();
    const count = st => L.filter(c=>c.stage===st).length;
    const active = L.filter(c=>!DONE_STAGES.includes(c.stage) && c.stage!=='on_hold');
    const card = (n,l,cls='',title='') => `<div class="summary-card ${cls}" title="${esc(title)}"><div class="num">${n}</div><div class="lbl">${l}</div></div>`;
    return `<div class="summary">
      ${card(active.length,'Active in R&amp;D','','Not approved, stopped or on hold')}
      ${card(count('coating_trial'),'Coating trial')}
      ${card(count('testing') + count('passed'),'Testing / passed','','Testing in progress, or passed and not yet sent to the brand')}
      ${card(count('brand_review'),'With brand')}
      ${card(count('failed_retrying'),'Failed – retrying')}
      ${card(count('on_hold'),'On hold')}
      ${card(count('final'),'Approved → Stock Offerings','dv-passed','Final approved shades. Turn on “Show approved” to see them here.')}
    </div>`;
  }

  function emptyHTML(){
    return `<div class="dv-empty">
      <p><b>No colors in development yet.</b></p>
      <p>Add one with <b>+ New color</b>, or load the starting data with <b>More → Import from file…</b></p>
    </div>`;
  }

  function headerHTML(r){
    let months = '', weeks = '';
    for(let d = new Date(r.start); d < r.end; d = addD(d,7)){
      weeks += `<div class="dv-week" style="left:${xOf(d,r)}px;width:${7*PX}px">${d.getMonth()+1}/${d.getDate()}</div>`;
    }
    let m = new Date(r.start.getFullYear(), r.start.getMonth(), 1);
    while(m < r.end){
      const next = new Date(m.getFullYear(), m.getMonth()+1, 1);
      const a = m < r.start ? r.start : m, b = next > r.end ? r.end : next;
      months += `<div class="dv-month" style="left:${xOf(a,r)}px;width:${xOf(b,r)-xOf(a,r)}px">${m.toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>`;
      m = next;
    }
    return `<div class="dv-row dv-head"><div class="dv-left dv-head-left">Color</div>
      <div class="dv-track dv-head-track" style="width:${r.width}px">${months}${weeks}</div></div>`;
  }

  function colorHTML(c, r, gname){
    const open = expanded.has(c.id);
    const st = stageDef(c.stage);
    const cur = currentStep(c);
    const meta = [c.material, c.bases.join(' + '), c.finish, c.partner].filter(Boolean).map(esc).join(' · ');
    const trialN = c.trials.length;
    const fk = `${gname}|${c.id}`;
    let html = `
    <div class="dv-row dv-color-row ${selected.has(c.id)?'is-selected':''}">
      <div class="dv-left">
        <input type="checkbox" class="dv-check" data-act="select" data-c="${c.id}" ${selected.has(c.id)?'checked':''} title="Select for bulk update">
        <button class="dv-caret" data-act="toggle" data-c="${c.id}" aria-label="Show steps">${open?'▾':'▸'}</button>
        <div class="dv-swatch" style="background:${esc(c.hex||'#ddd')}"></div>
        <div class="dv-color-main" data-act="toggle" data-c="${c.id}">
          <div class="dv-name">${esc(c.name||'Untitled')} <span class="dv-code">${esc(c.pantone||'')}</span></div>
          <div class="dv-meta">${meta || '<span class="dv-muted">No base or partner set</span>'}</div>
          <div class="dv-tags">${c.forTags.map(t=>`<span class="dv-tag">${esc(t)}</span>`).join('')}
            ${trialN ? `<span class="dv-trialcount" title="Trial rounds">Trial ${trialN}</span>` : ''}</div>
        </div>
        <div class="dv-color-side">
          <select class="dv-stage" data-c="${c.id}" data-f="stage" data-fk="${esc(fk)}|stage" style="background:${st.color};color:${contrast(st.color)}" title="Development stage">
            ${STAGES.map(x=>`<option value="${x.key}" ${c.stage===x.key?'selected':''}>${esc(x.label)}</option>`).join('')}
          </select>
          <div class="dv-next">${cur ? `${cur.status==='Not started'?'Next':'Now'}: ${esc(cur.activity)}${cur.end?` · ${fmt(cur.end)}`:''}` : (rdSteps(c).length ? 'R&amp;D steps complete' : 'No R&amp;D steps yet')}</div>
        </div>
        <button class="icon-btn dv-edit" data-act="edit" data-c="${c.id}" title="Edit color details">✎</button>
      </div>
      <div class="dv-track" style="width:${r.width}px">
        ${rdSteps(c).map(s=>bar(s.start, s.end, ownerColor(s.owner), 'dv-mini ' + (s.status==='Complete'?'done':''), `${s.activity} (${s.owner||'no owner'}) ${fmt(s.start)}–${fmt(s.end)}`, r)).join('')}
      </div>
    </div>`;
    if(!open) return html;

    // details: trial rounds + notes
    html += `
    <div class="dv-row dv-detail-row">
      <div class="dv-left dv-detail">
        <div class="dv-detail-head">Trial rounds</div>
        ${c.trials.length ? c.trials.map(t=>`
          <div class="dv-trial-line">
            ${t.hex ? `<span class="dv-round-swatch" style="background:${esc(t.hex)}"></span>` : ''}<b>Trial ${esc(t.n)}</b>${c.finalTrial!=null && String(c.finalTrial)===String(t.n) ? ' <span class="dv-final-badge">Final shade</span>' : ''} · ${esc(t.partner||'')} · ${t.start||t.end ? `${esc(fmt(t.start)||'?')}–${esc(fmt(t.end)||'?')}` : 'no dates'}
            · Testing: <span class="dv-result ${esc(t.result||'pending')}">${t.result==='pass'?'Passed':t.result==='fail'?'Failed':'Pending'}</span>
            ${t.brandFeedback ? ` · Brand: <span class="dv-fb ${esc(t.brandFeedback)}">${esc(feedbackLabel(t.brandFeedback))}</span>${t.brandNote ? ` – “${esc(t.brandNote)}”` : ''}` : ''}
            ${TEST_FIELDS.filter(f=>t[f.k]!=='' && t[f.k]!=null).map(f=>` · ${f.label} ${esc(t[f.k])}`).join('')}
            ${t.notes ? `<div class="dv-muted">${esc(t.notes)}</div>` : ''}
          </div>`).join('') : `<div class="dv-muted">No trial rounds yet.</div>`}
        <div class="dv-detail-links">
          <button class="linkish" data-act="edit" data-c="${c.id}" data-tab="trials">Add or edit trial rounds</button>
          ${c.photosUrl ? ` · <a href="${esc(c.photosUrl)}" target="_blank" rel="noopener">Photos</a>` : ''}
        </div>
        ${c.notes ? `<div class="dv-color-notes">${esc(c.notes)}</div>` : ''}
        ${(()=>{ const n = c.steps.length - rdSteps(c).length;
          return n ? `<div class="dv-muted dv-prod-note">${n} brand / production step${n===1?'':'s'} (approval, PO, production run) saved for the future Production tab.</div>` : ''; })()}
      </div>
      <div class="dv-track" style="width:${r.width}px">
        ${c.trials.map(t=>bar(t.start, t.end || t.start, 'transparent', 'dv-trialbar ' + (t.result||''), `Trial ${t.n}`, r)).join('')}
      </div>
    </div>`;

    const visibleSteps = rdSteps(c);
    visibleSteps.forEach((s, i)=>{
      const k = `${fk}|${s.id}`;
      html += `
      <div class="dv-row dv-step-row">
        <div class="dv-left dv-step">
          <div class="dv-step-line">
            <span class="dv-owner-dot" style="background:${ownerColor(s.owner)}"></span>
            <select class="dv-status st-${esc((s.status||'').replace(/\s+/g,'-').toLowerCase())}" data-c="${c.id}" data-s="${s.id}" data-f="status" data-fk="${esc(k)}|status">
              ${STEP_STATUSES.map(x=>`<option ${s.status===x?'selected':''}>${x}</option>`).join('')}
            </select>
            <input class="dv-activity" value="${esc(s.activity)}" data-c="${c.id}" data-s="${s.id}" data-f="activity" data-fk="${esc(k)}|activity" placeholder="Step">
            <span class="dv-step-btns">
              <button class="icon-btn" data-act="up" data-c="${c.id}" data-s="${s.id}" title="Move up" ${i===0?'disabled':''}>↑</button>
              <button class="icon-btn" data-act="down" data-c="${c.id}" data-s="${s.id}" title="Move down" ${i===visibleSteps.length-1?'disabled':''}>↓</button>
              <button class="icon-btn" data-act="delStep" data-c="${c.id}" data-s="${s.id}" title="Delete step">✕</button>
            </span>
          </div>
          <div class="dv-step-line dv-step-fields">
            <label>Owner <input list="dvOwnerList" value="${esc(s.owner)}" data-c="${c.id}" data-s="${s.id}" data-f="owner" data-fk="${esc(k)}|owner"></label>
            <label>Start <input type="date" value="${esc(s.start)}" data-c="${c.id}" data-s="${s.id}" data-f="start" data-fk="${esc(k)}|start"></label>
            <label>End <input type="date" value="${esc(s.end)}" data-c="${c.id}" data-s="${s.id}" data-f="end" data-fk="${esc(k)}|end"></label>
            <span class="dv-days">${days(s) ? days(s)+' d' : ''}</span>
          </div>
          <textarea class="dv-notes" rows="1" placeholder="Notes" data-c="${c.id}" data-s="${s.id}" data-f="notes" data-fk="${esc(k)}|notes">${esc(s.notes)}</textarea>
        </div>
        <div class="dv-track" style="width:${r.width}px">
          ${bar(s.start, s.end, ownerColor(s.owner), s.status==='Complete'?'done':(s.status==='At risk'?'risk':''), `${s.activity} ${fmt(s.start)}–${fmt(s.end)}`, r)}
        </div>
      </div>`;
    });
    html += `
      <div class="dv-row dv-add-row"><div class="dv-left">
        <button class="linkish" data-act="addStep" data-c="${c.id}">+ Add step</button>
        ${visibleSteps.length === 0 ? ` · <button class="linkish" data-act="addTemplate" data-c="${c.id}">Add the standard R&amp;D steps</button>` : ''}
      </div><div class="dv-track" style="width:${r.width}px"></div></div>`;
    return html;
  }

  function bulkHTML(){
    if(!selected.size) return '';
    const sel = [...selected].map(byId).filter(Boolean);
    const names = [];
    sel.forEach(c=>rdSteps(c).forEach(s=>{ const n=(s.activity||'').trim(); if(n && !names.includes(n)) names.push(n); }));
    return `<div class="dv-bulk">
      <b>${sel.length} selected</b>
      <span class="dv-bulk-group">Update step
        <select id="dvBulkStep"><option value="">Choose a step…</option>${names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select>
        <select id="dvBulkStatus"><option value="">Status (no change)</option>${STEP_STATUSES.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="date" id="dvBulkStart" title="Start">
        <input type="date" id="dvBulkEnd" title="End">
        <input id="dvBulkNote" placeholder="Note (replaces)">
        <button class="btn" data-act="bulkStep">Apply</button>
      </span>
      <span class="dv-bulk-group">Stage
        <select id="dvBulkStage"><option value="">Choose…</option>${STAGES.map(s=>`<option value="${s.key}">${esc(s.label)}</option>`).join('')}</select>
        <button class="btn" data-act="bulkStage">Set</button>
      </span>
      <button class="btn secondary" data-act="clearSel">Clear selection</button>
    </div>`;
  }

  function autoGrow(t){ t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }

  // ---------- events ----------
  function onChange(e){
    const el = e.target;
    const act = el.dataset.act;
    if(act === 'groupBy'){ ui.groupBy = el.value; writePrefs(); return render(); }
    if(act === 'stageFilter'){ ui.stage = el.value; return render(); }
    if(act === 'showDone'){ ui.showDone = el.checked; return render(); }
    if(act === 'select'){
      el.checked ? selected.add(el.dataset.c) : selected.delete(el.dataset.c);
      return render();
    }
    const c = byId(el.dataset.c); const f = el.dataset.f;
    if(!c || !f) return;
    if(f === 'stage'){
      c.stage = el.value; saveQuietly(c);
      if(c.stage === 'final' && !ui.showDone) toast(`${c.name} is approved – final. It moves to Stock Offerings and is hidden here.`);
      else if(c.stage === 'failed_stopped' && !ui.showDone) toast(`${c.name} marked “no more trials” and hidden here.`);
      return setTimeout(render, 0);
    }
    const s = c.steps.find(x=>x.id===el.dataset.s);
    if(!s) return;
    s[f] = el.value;
    saveQuietly(c);
    setTimeout(render, 0);   // let focus move first, then restore it
  }

  async function onClick(e){
    const btn = e.target.closest('[data-act]');
    const root = document.getElementById('devRoot');
    const menu = root.querySelector('.dv-menu-list');
    if(menu && !e.target.closest('.dv-menu')) menu.hidden = true;
    if(!btn || btn.tagName === 'SELECT' || btn.tagName === 'INPUT') return;
    const act = btn.dataset.act;
    const c = btn.dataset.c ? byId(btn.dataset.c) : null;
    switch(act){
      case 'menu': menu.hidden = !menu.hidden; return;
      case 'toggle': expanded.has(c.id) ? expanded.delete(c.id) : expanded.add(c.id); return render();
      case 'expandAll':
        if(expanded.size) expanded.clear(); else live().forEach(x=>expanded.add(x.id));
        return render();
      case 'edit': return openModal(c, false, btn.dataset.tab);
      case 'new': return openModal(null, true);
      case 'addStep':
        c.steps.push({id:uid(), phase:'rd', activity:'', owner:'', start:'', end:'', status:'Not started', notes:''});
        await save(c); return render();
      case 'addTemplate':
        c.steps = [...templateSteps(c.partner || 'Pearl', c.forTags[0] || '', ''), ...c.steps];
        await save(c); return render();
      case 'delStep': {
        const s = c.steps.find(x=>x.id===btn.dataset.s);
        if(!confirm(`Delete the step “${s.activity || 'Untitled'}” from ${c.name}?`)) return;
        c.steps = c.steps.filter(x=>x!==s); await save(c); return render();
      }
      case 'up': case 'down': {
        const vis = rdSteps(c);
        const vi = vis.findIndex(x=>x.id===btn.dataset.s), vj = act==='up' ? vi-1 : vi+1;
        if(vj<0 || vj>=vis.length) return;
        const i = c.steps.indexOf(vis[vi]), j = c.steps.indexOf(vis[vj]);
        [c.steps[i], c.steps[j]] = [c.steps[j], c.steps[i]];
        await save(c); return render();
      }
      case 'clearSel': selected.clear(); return render();
      case 'bulkStep': return bulkStep();
      case 'bulkStage': return bulkStage();
      case 'exportJson': menu.hidden = true; return exportJson();
      case 'exportCsv': menu.hidden = true; return exportCsv();
      case 'import': menu.hidden = true; return pickImport();
      case 'bases': menu.hidden = true; return openBases();
      case 'trash': menu.hidden = true; return openTrash();
    }
  }

  function onInput(e){
    const el = e.target;
    if(el.dataset.act === 'search'){
      ui.q = el.value;
      clearTimeout(onInput.t); onInput.t = setTimeout(render, 200);
    }
    if(el.classList.contains('dv-notes')) autoGrow(el);
  }

  async function bulkStep(){
    const name = document.getElementById('dvBulkStep').value;
    if(!name) return alert('Choose which step to update.');
    const vals = {
      status: document.getElementById('dvBulkStatus').value,
      start: document.getElementById('dvBulkStart').value,
      end: document.getElementById('dvBulkEnd').value,
      notes: document.getElementById('dvBulkNote').value,
    };
    if(!Object.values(vals).some(Boolean)) return alert('Set a status, date or note to apply.');
    let n = 0;
    for(const id of selected){
      const c = byId(id); if(!c) continue;
      const s = rdSteps(c).find(x=>(x.activity||'').trim() === name);
      if(!s) continue;
      Object.entries(vals).forEach(([k,v])=>{ if(v) s[k] = v; });
      await save(c); n++;
    }
    render();
    toast(`Updated “${name}” on ${n} color${n===1?'':'s'}.`);
  }
  async function bulkStage(){
    const st = document.getElementById('dvBulkStage').value;
    if(!st) return alert('Choose a stage.');
    for(const id of selected){ const c = byId(id); if(c){ c.stage = st; await save(c); } }
    render();
  }

  function toast(text){
    let el = document.getElementById('dvToast');
    if(!el){ el = document.createElement('div'); el.id = 'dvToast'; el.className = 'dv-toast'; document.body.appendChild(el); }
    el.textContent = text; el.style.display = '';
    clearTimeout(toast.t); toast.t = setTimeout(()=>{ el.style.display = 'none'; }, 3500);
  }

  // ---------- standard steps ----------
  function templateSteps(partner, brand, startDate){
    let d = pd(startDate);
    return TEMPLATE.map(t=>{
      const s = {id:uid(), phase:'rd', activity:t.a(partner, brand), owner:t.o(partner, brand), start:'', end:'', status:'Not started', notes:''};
      if(d){ s.start = iso(d); const e = addD(d, t.days-1); s.end = iso(e); d = addD(e, 1); }
      return s;
    });
  }

  // ---------- color modal ----------
  function ensureModal(){
    if(document.getElementById('dvModal')) return;
    const el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = 'dvModal';
    el.innerHTML = `<div class="modal dv-modal"><h2 id="dvModalTitle"></h2><div id="dvModalBody"></div>
      <div class="modal-actions">
        <button class="btn danger" id="dvDelete" style="margin-right:auto">Delete color</button>
        <button class="btn secondary" id="dvCancel">Cancel</button>
        <button class="btn" id="dvSave">Save</button>
      </div></div>`;
    document.body.appendChild(el);
    el.querySelector('#dvCancel').addEventListener('click', closeModal);
    el.querySelector('#dvSave').addEventListener('click', saveModal);
    el.querySelector('#dvDelete').addEventListener('click', deleteFromModal);
    el.addEventListener('click', e=>{
      if(e.target === el) closeModal();
      const b = e.target.closest('[data-tact]'); if(!b) return;
      readModal();
      if(b.dataset.tact === 'addTrial'){
        const last = editing.trials[editing.trials.length-1];
        editing.trials.push({n:(last ? Number(last.n)||editing.trials.length : 0)+1, partner:editing.partner||'', start:'', end:'', result:'',
          hex: last && last.hex ? last.hex : editing.hex, brandFeedback:'', brandNote:'',
          ballyFlex:'', martindale:'', coatWeight:'', deltaE:'', L:'', a:'', b:'', notes:''});
      }
      if(b.dataset.tact === 'delTrial'){ editing.trials.splice(Number(b.dataset.i), 1); }
      fillModal();
    });
    el.addEventListener('input', e=>{
      if(e.target.id === 'dvHexPick') el.querySelector('#dvHex').value = e.target.value;
      if(e.target.id === 'dvHex' && /^#[0-9a-f]{6}$/i.test(e.target.value)) el.querySelector('#dvHexPick').value = e.target.value;
    });
  }

  function openModal(c, isNew, focusTab){
    ensureModal();
    editingIsNew = isNew;
    editing = isNew
      ? {id:uid(), name:'', pantone:'', hex:'#B9A58C', forTags:[], material:'', bases:[], baseForm:'', finish:'', texture:'',
         partner:'Pearl', stage:'to_be_trialed', availability:'', photosUrl:'', notes:'', trials:[], steps:[],
         order: Math.max(0, ...colors.map(x=>x.order||0)) + 1}
      : JSON.parse(JSON.stringify(c));
    document.getElementById('dvModalTitle').textContent = isNew ? 'New color in development' : 'Edit ' + (c.name || 'color');
    document.getElementById('dvDelete').style.display = isNew ? 'none' : '';
    fillModal();
    document.getElementById('dvModal').classList.add('open');
    if(focusTab === 'trials') document.getElementById('dvTrials').scrollIntoView({block:'start'});
    else document.getElementById('dvName').focus();
  }
  function closeModal(){ document.getElementById('dvModal').classList.remove('open'); editing = null; }

  function opt(list, val, blank){
    return (blank !== undefined ? `<option value="">${blank}</option>` : '') +
      list.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('') +
      (val && !list.includes(val) ? `<option selected>${esc(val)}</option>` : '');
  }

  function fillModal(){
    const c = editing;
    const baseNames = [...new Set([...activeBases(), ...c.bases])];
    const textureNames = (typeof textures !== 'undefined' && Array.isArray(textures)) ? textures.map(t=>t.name) : [];
    document.getElementById('dvModalBody').innerHTML = `
      <datalist id="dvForList">${allForTags().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <datalist id="dvPartnerList">${allPartners().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <datalist id="dvTextureList">${textureNames.map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <div class="form-grid">
        <div class="form-field"><label>Color name</label><input id="dvName" value="${esc(c.name)}" placeholder="e.g. SM Custom Grey"></div>
        <div class="form-field"><label>Pantone code</label><input id="dvPantone" value="${esc(c.pantone)}" placeholder="e.g. 19-1220 TCX"></div>
        <div class="form-field"><label>Swatch color</label><div class="hex-row">
          <input type="color" id="dvHexPick" value="${/^#[0-9a-f]{6}$/i.test(c.hex)?esc(c.hex):'#B9A58C'}"><input id="dvHex" value="${esc(c.hex)}"></div></div>
        <div class="form-field"><label>For (brand or collection)</label>
          <input id="dvFor" list="dvForList" value="${esc(c.forTags.join(', '))}" placeholder="e.g. Reformation, Spring '27">
          <span class="dv-hint">Separate several with commas</span></div>
        <div class="form-field"><label>Material</label><select id="dvMaterial">${opt(MATERIALS, c.material, 'Not set')}</select></div>
        <div class="form-field"><label>Finish</label><select id="dvFinish">${opt(FINISHES, c.finish, 'Not set')}</select></div>
        <div class="form-field full"><label>Base color</label><div class="dv-checks">
          ${baseNames.map(b=>`<label><input type="checkbox" class="dvBase" value="${esc(b)}" ${c.bases.includes(b)?'checked':''}> ${esc(b)}</label>`).join('')}
        </div></div>
        <div class="form-field"><label>Base used</label><select id="dvBaseForm">${opt(BASE_FORMS, c.baseForm, 'Not set')}</select></div>
        <div class="form-field"><label>Texture tested on</label><input id="dvTexture" list="dvTextureList" value="${esc(c.texture)}"></div>
        <div class="form-field"><label>Partner (trial location)</label><input id="dvPartner" list="dvPartnerList" value="${esc(c.partner)}"></div>
        <div class="form-field"><label>Development stage</label><select id="dvStage">${STAGES.map(s=>`<option value="${s.key}" ${c.stage===s.key?'selected':''}>${esc(s.label)}</option>`).join('')}</select></div>
        <div class="form-field full"><label>Availability</label><select id="dvAvail">${opt(AVAILABILITY, c.availability, 'Not set')}</select></div>
        <div class="form-field full"><label>Photos link (e.g. Dropbox)</label><input id="dvPhotos" value="${esc(c.photosUrl)}" placeholder="https://"></div>
        <div class="form-field full"><label>Notes</label><textarea id="dvNotes" rows="2">${esc(c.notes)}</textarea></div>
        ${editingIsNew ? `
        <div class="form-field full dv-newsteps">
          <label><input type="checkbox" id="dvAddSteps" checked> Add the standard R&amp;D steps (send Pantone, lab color match, ship samples, Uncaged testing)</label>
          <span>First step starts <input type="date" id="dvStepStart"> <span class="dv-hint">optional: fills in suggested dates from typical durations</span></span>
        </div>` : ''}
      </div>
      <div class="dv-trials" id="dvTrials">
        <h3>Trial rounds</h3>
        ${c.trials.length ? `<div class="dv-trial-table">
          <div class="dv-trial-headrow"><span>#</span><span>Shade</span><span>Partner</span><span>Start</span><span>End</span><span>Testing</span><span>Brand feedback</span><span>Brand comment</span>${TEST_FIELDS.map(f=>`<span>${f.label}</span>`).join('')}<span>Notes</span><span></span></div>
          ${c.trials.map((t,i)=>`<div class="dv-trial-edit" data-i="${i}">
            <input data-t="n" value="${esc(t.n)}">
            <input data-t="hex" type="color" value="${/^#[0-9a-f]{6}$/i.test(t.hex||'') ? esc(t.hex) : (/^#[0-9a-f]{6}$/i.test(c.hex)?esc(c.hex):'#B9A58C')}" title="Swatch for this round">
            <input data-t="partner" list="dvPartnerList" value="${esc(t.partner)}">
            <input data-t="start" type="date" value="${esc(t.start)}">
            <input data-t="end" type="date" value="${esc(t.end)}">
            <select data-t="result"><option value="" ${!t.result?'selected':''}>Pending</option><option value="pass" ${t.result==='pass'?'selected':''}>Passed</option><option value="fail" ${t.result==='fail'?'selected':''}>Failed</option></select>
            <select data-t="brandFeedback">${BRAND_FEEDBACK.map(f=>`<option value="${f.key}" ${(t.brandFeedback||'')===f.key?'selected':''}>${f.label}</option>`).join('')}</select>
            <input data-t="brandNote" value="${esc(t.brandNote)}" placeholder="e.g. needs to be darker">
            ${TEST_FIELDS.map(f=>`<input data-t="${f.k}" value="${esc(t[f.k])}">`).join('')}
            <input data-t="notes" value="${esc(t.notes)}">
            <button class="icon-btn" data-tact="delTrial" data-i="${i}" title="Remove trial round">✕</button>
          </div>`).join('')}
        </div>` : `<p class="dv-muted">No trial rounds yet. Add one each time a partner makes a new attempt at this color.</p>`}
        <p class="dv-hint">Each round is one shade attempt. Setting a round’s brand feedback to <b>Approved</b> makes it the final shade and moves the color to Stock Offerings. <b>Changes requested</b> sends the color back to coating trial with a new round.</p>
        <button class="btn secondary" data-tact="addTrial">+ Add trial round</button>
      </div>`;
  }

  function readModal(){
    const v = id => (document.getElementById(id) || {}).value || '';
    const c = editing;
    c.name = v('dvName').trim(); c.pantone = v('dvPantone').trim(); c.hex = v('dvHex').trim();
    c.forTags = v('dvFor').split(',').map(s=>s.trim()).filter(Boolean);
    c.material = v('dvMaterial'); c.finish = v('dvFinish'); c.baseForm = v('dvBaseForm');
    c.bases = [...document.querySelectorAll('#dvModal .dvBase:checked')].map(x=>x.value);
    c.texture = v('dvTexture').trim(); c.partner = v('dvPartner').trim(); c.stage = v('dvStage');
    c.availability = v('dvAvail'); c.photosUrl = v('dvPhotos').trim(); c.notes = v('dvNotes');
    document.querySelectorAll('#dvModal .dv-trial-edit').forEach(row=>{
      const t = c.trials[Number(row.dataset.i)];
      row.querySelectorAll('[data-t]').forEach(inp=>{ t[inp.dataset.t] = inp.value.trim(); });
    });
  }

  async function saveModal(){
    readModal();
    const c = editing;
    if(!c.name) return alert('Give the color a name.');
    if(c.photosUrl && !/^https?:\/\//i.test(c.photosUrl)) c.photosUrl = 'https://' + c.photosUrl;
    let note = '';
    const before = editingIsNew ? null : byId(c.id);
    const prevFb = n => { const t = before && before.trials.find(x=>String(x.n)===String(n)); return t ? (t.brandFeedback||'') : ''; };
    const changed = c.trials.filter(t=>(t.brandFeedback||'') !== prevFb(t.n));
    const approved = changed.find(t=>t.brandFeedback==='approved');
    const latest = c.trials[c.trials.length-1];
    if(approved){
      c.stage = 'final'; c.finalTrial = approved.n;
      if(/^#[0-9a-f]{6}$/i.test(approved.hex||'')) c.hex = approved.hex;
      note = `Trial ${approved.n} approved: ${c.name} is now Approved – final and moves to Stock Offerings.`;
    } else if(latest && changed.includes(latest) && latest.brandFeedback==='changes'){
      c.stage = 'coating_trial';
      c.trials.push({n:(Number(latest.n)||c.trials.length)+1, partner:latest.partner||c.partner||'', start:'', end:'', result:'',
        hex:latest.hex||c.hex, brandFeedback:'', brandNote:'', ballyFlex:'', martindale:'', coatWeight:'', deltaE:'', L:'', a:'', b:'',
        notes: latest.brandNote ? `Brand asked: ${latest.brandNote}` : 'Brand requested changes'});
      note = `Brand requested changes: ${c.name} is back in coating trial, and trial ${Number(latest.n)+1 || c.trials.length} was added.`;
    } else if(latest && changed.includes(latest) && latest.brandFeedback==='with_brand'){
      c.stage = 'brand_review';
      note = `${c.name} is now with the brand for approval.`;
    }
    if(c.stage !== 'final') delete c.finalTrial;
    if(editingIsNew && document.getElementById('dvAddSteps').checked){
      c.steps = templateSteps(c.partner || 'Pearl', c.forTags[0] || '', document.getElementById('dvStepStart').value);
    }
    const btn = document.getElementById('dvSave'); btn.disabled = true;
    try {
      await save(c);
      const i = colors.findIndex(x=>x.id===c.id);
      if(i >= 0) colors[i] = c; else colors.push(c);
      if(editingIsNew) expanded.add(c.id);
      closeModal(); render();
      if(note) toast(note);
    } catch(e){ /* the storage layer shows a banner */ }
    finally { btn.disabled = false; }
  }

  async function deleteFromModal(){
    const c = byId(editing.id);
    if(!c || !confirm(`Delete ${c.name}? You can restore it from More → Recently deleted.`)) return;
    c.deletedAt = new Date().toISOString();
    await save(c);
    selected.delete(c.id); closeModal(); render();
    toast(`${c.name} moved to Recently deleted.`);
  }

  // ---------- small dialogs ----------
  function dialog(title, bodyHTML, onReady){
    let el = document.getElementById('dvDialog');
    if(!el){ el = document.createElement('div'); el.className = 'modal-overlay'; el.id = 'dvDialog'; document.body.appendChild(el);
      el.addEventListener('click', e=>{ if(e.target === el || e.target.closest('[data-close]')) el.classList.remove('open'); }); }
    el.innerHTML = `<div class="modal" style="max-width:520px"><h2>${esc(title)}</h2>${bodyHTML}
      <div class="modal-actions"><button class="btn secondary" data-close>Close</button></div></div>`;
    el.classList.add('open');
    if(onReady) onReady(el);
  }

  function openTrash(){
    const del = colors.filter(c=>c.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
    dialog('Recently deleted', del.length ? `<div class="dv-trash">${del.map(c=>`
      <div class="dv-trash-row"><span class="dv-swatch sm" style="background:${esc(c.hex)}"></span>
        <span><b>${esc(c.name)}</b><br><span class="dv-muted">Deleted ${esc(new Date(c.deletedAt).toLocaleString())}</span></span>
        <button class="btn secondary" data-restore="${c.id}">Restore</button>
        <button class="btn danger" data-purge="${c.id}">Delete forever</button></div>`).join('')}</div>`
      : '<p class="dv-muted">Nothing has been deleted.</p>', el=>{
      el.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click', async ()=>{
        const c = byId(b.dataset.restore); delete c.deletedAt; await save(c); render(); openTrash();
      }));
      el.querySelectorAll('[data-purge]').forEach(b=>b.addEventListener('click', async ()=>{
        const c = byId(b.dataset.purge);
        if(!confirm(`Permanently delete ${c.name}? This can’t be undone.`)) return;
        await window.storage.delete(PREFIX + c.id);
        colors = colors.filter(x=>x!==c); render(); openTrash();
      }));
    });
  }

  function openBases(){
    const used = name => live().filter(c=>c.bases.includes(name)).length;
    dialog('Base color list', `
      <p class="dv-muted">Inactive base colors are hidden when adding colors, but colors already on them keep them.</p>
      <div class="dv-trash">${settings.baseColors.map((b,i)=>`
        <div class="dv-trash-row"><span><b>${esc(b.name)}</b><br><span class="dv-muted">${used(b.name)} color(s)</span></span>
          <label class="dv-inline"><input type="checkbox" data-active="${i}" ${b.active?'checked':''}> Active</label></div>`).join('')}</div>
      <div class="dv-inline" style="margin-top:12px"><input id="dvNewBase" placeholder="New base color"> <button class="btn" id="dvAddBase">Add</button></div>`, el=>{
      el.querySelectorAll('[data-active]').forEach(cb=>cb.addEventListener('change', async ()=>{
        settings.baseColors[Number(cb.dataset.active)].active = cb.checked; await saveSettings();
      }));
      el.querySelector('#dvAddBase').addEventListener('click', async ()=>{
        const n = el.querySelector('#dvNewBase').value.trim();
        if(!n || settings.baseColors.some(b=>b.name.toLowerCase()===n.toLowerCase())) return;
        settings.baseColors.push({name:n, active:true}); await saveSettings(); openBases();
      });
    });
  }

  // ---------- export / import ----------
  function download(name, text, type){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type}));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function stamp(){ return iso(new Date()); }
  function exportJson(){
    const data = {format:'uncaged-in-development', version:1, exportedAt:new Date().toISOString(), colors: live(), settings};
    download(`in-development-backup-${stamp()}.json`, JSON.stringify(data, null, 1), 'application/json');
  }
  function exportCsv(){
    const q = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
    const head = ['Color','Pantone','For','Material','Base color','Finish','Partner','Stage','Trial rounds','Phase','Step','Owner','Start','End','Days','Status','Notes'];
    const rows = [head];
    live().sort((a,b)=>a.order-b.order).forEach(c=>{
      const base = [c.name,c.pantone,c.forTags.join('; '),c.material,c.bases.join(' + '),c.finish,c.partner,stageDef(c.stage).label,c.trials.length];
      if(!c.steps.length) rows.push([...base,'','','','','','','','']);
      c.steps.forEach(s=>rows.push([...base, phaseOf(s)==='rd'?'R&D':'Brand / production', s.activity, s.owner, s.start, s.end, days(s), s.status, s.notes]));
    });
    download(`in-development-${stamp()}.csv`, '﻿' + rows.map(r=>r.map(q).join(',')).join('\r\n'), 'text/csv');
  }
  function pickImport(){
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.txt,application/json,text/plain';
    inp.addEventListener('change', async ()=>{
      const file = inp.files[0]; if(!file) return;
      let data;
      try { data = JSON.parse(await file.text()); } catch(e){ return alert('That file isn’t a valid backup (couldn’t read it as JSON).'); }
      if(!data || data.format !== 'uncaged-in-development' || !Array.isArray(data.colors))
        return alert('That file isn’t an In Development backup.');
      const incoming = data.colors.map(normalize);
      const replacing = incoming.filter(c=>byId(c.id)).length;
      if(!confirm(`Import ${incoming.length} colors?` + (replacing ? `\n\n${replacing} already exist here and will be replaced with the version in the file.` : ''))) return;
      toast('Importing…');
      for(const c of incoming){
        delete c.deletedAt;
        await save(c);
        const i = colors.findIndex(x=>x.id===c.id);
        if(i >= 0) colors[i] = c; else colors.push(c);
      }
      if(data.settings && Array.isArray(data.settings.baseColors)){
        data.settings.baseColors.forEach(b=>{ if(!settings.baseColors.some(x=>x.name===b.name)) settings.baseColors.push(b); });
        await saveSettings();
      }
      render(); toast(`Imported ${incoming.length} colors.`);
    });
    inp.click();
  }

  // ---------- setup ----------
  function setup(){
    const root = document.getElementById('devRoot');
    if(!root) return;
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    const dl = document.createElement('datalist'); dl.id = 'dvOwnerList'; document.body.appendChild(dl);
    window.renderDev = function(){
      dl.innerHTML = allOwners().map(o=>`<option value="${esc(o)}">`).join('');
      render();
    };
    window.renderDev();
    load().then(()=>window.renderDev());
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
