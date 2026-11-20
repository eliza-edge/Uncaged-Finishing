/*
 * Partner Projects tab (table). It replaced In Development and Finishing Priorities.
 *
 * Everything the finishing partners are working on, one numbered priority list
 * per partner: colors in development, plus other partner jobs (a gloss
 * adjustment, a panel order...). Each record is saved on its own ("dev-<id>"),
 * so two teammates editing different rows never block each other. Shared lists
 * (base colors) are saved under "devSettings".
 *
 * Each color has one list of steps (color matching, trial rounds, in-house
 * testing, brand review, ...), edited in the Progress pop-up. A trial round's
 * quantity and dates also show in the table's "Quantity & dates" column.
 * Older records are converted when they load; nothing is deleted.
 *
 * Client data is never written into this file: the starting data is loaded
 * with More → Import, and lives only in the team database.
 */
(function(){
  const PREFIX = 'dev-';
  const SETTINGS_KEY = 'devSettings';
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
  // The steps a color goes through, following the Color Development Gantt.
  const STEP_TYPES = [
    {key:'send',        label:'Send Pantone / swatch', owner:'inhouse'},
    {key:'color_match', label:'Color matching',        owner:'partner'},
    // A trial round is the partner's job: its quantity and dates are shared with Finishing Priorities.
    {key:'trial',       label:'Trial round',           owner:'partner', result:true, shade:true, job:true},
    {key:'ship_in',     label:'Ship samples to us',    owner:'partner'},
    {key:'testing',     label:'In-house testing',      owner:'inhouse', result:true, tests:true},
    {key:'ship_brand',  label:'Ship samples to brand', owner:'inhouse'},
    {key:'brand',       label:'Brand review',          owner:'brand', feedback:true},
    {key:'other',       label:'Other',                 owner:''},
  ];
  // Step types added by the team ("+ Add new…") are stored as "custom:<name>" and behave like Other.
  const allTypes = () => [...STEP_TYPES, ...window.lists.get('stepType', []).map(l=>({key:'custom:'+l, label:l, owner:''}))];
  const typeDef = k => allTypes().find(t=>t.key===k) ||
    (String(k).startsWith('custom:') ? {key:k, label:String(k).slice(7), owner:''} : STEP_TYPES[STEP_TYPES.length-1]);
  // Dropdowns backed by a shared list get "+ Add new…" (see lists.js).
  const LA = (name, label, prefix) => window.lists.attrs(name, label, prefix);
  const LO = (name, base, val, blank) => window.lists.opts(name, base, val, blank);
  function typeOptions(val){
    return allTypes().map(x=>`<option value="${esc(x.key)}" ${x.key===val?'selected':''}>${esc(x.label)}</option>`).join('') +
      (val && !allTypes().some(x=>x.key===val) ? `<option value="${esc(val)}" selected>${esc(typeDef(val).label)}</option>` : '') +
      `<option value="__new__">+ Add new…</option>`;
  }
  const BRAND_FEEDBACK = [
    {key:'',           label:'Not sent'},
    {key:'with_brand', label:'With brand'},
    {key:'approved',   label:'Approved'},
    {key:'changes',    label:'Changes requested'},
  ];
  const feedbackLabel = k => (BRAND_FEEDBACK.find(f=>f.key===(k||'')) || BRAND_FEEDBACK[0]).label;
  const RESULTS = [{key:'', label:'Pending'}, {key:'done', label:'Complete'}, {key:'pass', label:'Passed'}, {key:'fail', label:'Failed'}];
  const UNITS = ['A4s','panels','sq ft','meters','yards'];
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
  // Standard first steps for a new color. Typical durations (days) come from the Finishing Steps tab.
  const TEMPLATE = [
    {type:'send',        days:4},
    {type:'color_match', days:14},
    {type:'ship_in',     days:4},
    {type:'testing',     days:7},
  ];
  // Brand and production work (purchase orders, trimming, spraying, shipping
  // panels) is kept on the record for a future Production tab, but not shown.
  const PRODUCTION_RE = /approval|purchase order|\bPO\b|trim panel|spray|ship panels|inspect|swatch ?book|ship (a4s? )?to (?!uncaged)|ship samples to (?!uncaged)|ships? sample to (?!uncaged)/i;
  function phaseOf(s){ return s.phase || (PRODUCTION_RE.test(s.activity||'') ? 'production' : 'rd'); }
  function rdSteps(c){ return c.steps.filter(s=>phaseOf(s)==='rd'); }
  // Approved and stopped colors leave the list by default.
  const DONE_STAGES = ['final','failed_stopped'];
  // Textures match Stock Offerings and the inventory sheet (Freeport = Fine Grain, Denver = Pebble).
  const DEV_TEXTURES = ['Fine Grain','Pebble','Nappa'];
  const SQFT_PER_YARD = 12.5;   // the Vault's rule: 1 usable yd ≈ 0.5 panel ≈ 12.5 sq ft
  function quarterOf(d){ return d.getFullYear() + ' Q' + (Math.floor(d.getMonth()/3) + 1); }
  function quarterOptions(current){
    const out = [], d = new Date(); d.setDate(1);
    for(let i = 0; i < 10; i++){ out.push(quarterOf(d)); d.setMonth(d.getMonth() + 3); }
    if(current && !out.includes(current)) out.unshift(current);
    return out;
  }
  const DEFAULT_BASES = ['Coffee','Stone','Onyx','Natural','Off-White','Cherry'];

  let colors = [];
  let settings = {baseColors: DEFAULT_BASES.map(n=>({name:n, active:true}))};
  let loaded = false, loadError = '';
  // The list opens on the stages being worked on now; any mix of stages can be picked.
  // Partner jobs that aren't a color in development (a gloss adjustment, a panel order...).
  const JOBS = ['Color match (A4s)','Panels / production','Gloss / finish adjustment','Samples','Other'];
  const isJob = c => c.kind === 'job';
  const jobDone = c => c.status === 'Complete';
  const JOB_FILTERS = [
    {key:'job',      label:'Other partner jobs', color:'#8C6A4F'},
    {key:'job_done', label:'Completed jobs',     color:'#6E8B6E'},
  ];
  const FILTERS = [...STAGES, ...JOB_FILTERS];
  const filterKey = c => isJob(c) ? (jobDone(c) ? 'job_done' : 'job') : c.stage;
  // Open work gets a priority number in its partner's list.
  const isOpen = c => isJob(c) ? !jobDone(c) : !['final','failed_stopped'].includes(c.stage);
  const DEFAULT_STAGES = ['coating_trial','testing','failed_retrying','job'];
  const ui = Object.assign({groupBy:'partner', q:'', stages:new Set(DEFAULT_STAGES), sortKey:'', sortDir:1}, readPrefs());
  const sameSet = (a, list) => a.size === list.length && list.every(x=>a.has(x));
  // Summary cards double as quick filters. "With brand" is waiting on the
  // brand, so it is not counted as active R&D.
  const CARDS = [
    {key:'active',  label:'Active in R&amp;D', stages:['to_be_trialed','coating_trial','testing','passed','failed_retrying'], title:'Not with the brand, on hold, approved or stopped'},
    {key:'coating', label:'Coating trial',     stages:['coating_trial']},
    {key:'testing', label:'Testing / passed',  stages:['testing','passed'], title:'Testing in progress, or passed and not yet sent to the brand'},
    {key:'brand',   label:'With brand',        stages:['brand_review']},
    {key:'retry',   label:'Failed – retrying', stages:['failed_retrying']},
    {key:'hold',    label:'On hold',           stages:['on_hold']},
    {key:'final',   label:'Approved → Stock Offerings', stages:['final'], cls:'dv-passed', title:'Final approved shades'},
    {key:'jobs',    label:'Other partner jobs', stages:['job'], title:'Partner work that isn’t a color in development'},
  ];
  // A color can be approved for our own stock while it is still in another
  // stage (e.g. with a brand). "Approved – final" always counts as approved.
  const isApproved = c => !isJob(c) && (c.stage === 'final' || !!c.approvedStock);
  CARDS.forEach(k=>{ k.test = k.key === 'final' ? isApproved : (c => k.stages.includes(filterKey(c))); });
  const ROOT_ID = 'dev2Root';
  const selected = new Set();
  let editing = null, editingIsNew = false;   // color details pop-up
  let stepEdit = null;                         // Progress pop-up: a copy of the color

  // ---------- helpers ----------
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function readPrefs(){
    try {
      const p = JSON.parse(localStorage.getItem('partner-projects-prefs') || '{}');
      return {groupBy: ['base','partner','none'].includes(p.groupBy) ? p.groupBy : 'partner'};
    } catch(e){ return {}; }
  }
  function writePrefs(){
    try { localStorage.setItem('partner-projects-prefs', JSON.stringify({groupBy:ui.groupBy})); } catch(e){}
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function pd(s){ if(!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
  function iso(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  function addD(d,n){ const c = new Date(d); c.setDate(c.getDate()+n); return c; }
  function fmt(s){ const d = pd(s); return d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''; }
  function today(){ const t = new Date(); t.setHours(0,0,0,0); return t; }
  function days(s){ const a = pd(s.start), b = pd(s.end); return a && b ? Math.round((b-a)/DAY)+1 : ''; }
  function stageDef(k){ return STAGES.find(s=>s.key===k) || STAGES[0]; }
  function contrast(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return '#2A2621';
    const n = parseInt(m[1],16), r=n>>16, g=(n>>8)&255, b=n&255;
    return (r*299+g*587+b*114)/1000 > 150 ? '#2A2621' : '#FFFFFF';
  }
  const isHex = h => /^#[0-9a-f]{6}$/i.test(h||'');
  function live(){ return colors.filter(c=>!c.deletedAt); }
  function liveColors(){ return live().filter(c=>!isJob(c)); }
  const nextRank = () => Math.max(0, ...colors.map(c=>Number(c.rank)||0)) + 1;
  // Priority order: open work by rank, then everything else.
  const byPriority = (a, b) => (isOpen(a) ? 0 : 1) - (isOpen(b) ? 0 : 1) || (Number(a.rank)||1e15) - (Number(b.rank)||1e15) || (a.order||0) - (b.order||0);
  const stageLabel = c => isJob(c) ? 'Partner job – ' + (c.status || 'Not started') : stageDef(c.stage).label;
  function byId(id){ return colors.find(c=>c.id===id); }
  function blankStep(type, extra){
    const s = {id:uid(), phase:'rd', type, round:1, activity:'', owner:'', start:'', end:'', status:'Not started',
      result:'', brandFeedback:'', brandNote:'', hex:'', notes:'', qty:'', unit:'', receiveDate:''};
    TEST_FIELDS.forEach(f=>{ s[f.k] = ''; });
    return Object.assign(s, extra || {});
  }
  function guessType(text){
    const t = String(text||'').toLowerCase();
    if(/color match/.test(t)) return 'color_match';
    if(/test/.test(t)) return 'testing';
    if(/send pantone|swatch to/.test(t)) return 'send';
    if(/(ship|send|receives).*(to uncaged|uncaged office|to us\b)|receives samples/.test(t)) return 'ship_in';
    if(/approval|approve/.test(t)) return 'brand';
    if(/ship .*(samples|a4s?) to|ship a4s/.test(t)) return 'ship_brand';
    return 'other';
  }
  // Older records kept trial rounds and steps apart. Merge them into one
  // list of steps, ordered by date, without losing anything.
  function migrate(c){
    const steps = (Array.isArray(c.steps) ? c.steps : []).map(s=>Object.assign(blankStep(guessType(s.activity)), s, {
      type: s.type || guessType(s.activity), phase: s.phase || phaseOf(s)}));
    const prod = steps.filter(s=>s.phase==='production');
    const rd = steps.filter(s=>s.phase!=='production');
    let finalId = '';
    (Array.isArray(c.trials) ? c.trials : []).forEach(t=>{
      const n = Number(t.n) || 1;
      const trial = blankStep('trial', {round:n, activity:'', owner:t.partner||c.partner||'', start:t.start||'', end:t.end||'',
        status: t.result || (pd(t.end) && pd(t.end) < today()) ? 'Complete' : (t.start ? 'In progress' : 'Not started'),
        result:t.result||'', hex:t.hex||'', notes:t.notes||''});
      TEST_FIELDS.forEach(f=>{ trial[f.k] = t[f.k] || ''; });
      rd.push(trial);
      if(String(c.finalTrial) === String(t.n)) finalId = trial.id;
      if(t.brandFeedback){
        rd.push(blankStep('brand', {round:n, activity:'', owner:c.forTags[0]||'Brand', start:'', end:'', _last:true,
          status: t.brandFeedback==='with_brand' ? 'In progress' : 'Complete', brandFeedback:t.brandFeedback, brandNote:t.brandNote||''}));
      }
    });
    // Dated steps in date order; undated steps keep their place after the dated one before them.
    let lastKey = '';
    // Brand reviews carried over from old trial rounds have no dates; they go last.
    const keyed = rd.map((s,i)=>{ const k = s.start || s.end; if(k) lastKey = k; return {s, k: (s._last ? '~' : (k || lastKey)) + '|' + String(i).padStart(4,'0')}; });
    rd.forEach(s=>{ delete s._last; });
    keyed.sort((a,b)=>a.k < b.k ? -1 : a.k > b.k ? 1 : 0);
    let round = 1;
    const ordered = keyed.map(x=>x.s).map(s=>{ if(s.type==='trial') round = Number(s.round)||round; else s.round = round; return s; });
    c.steps = [...ordered, ...prod];
    if(finalId) c.finalStepId = finalId;
    c.trials = [];
    delete c.finalTrial;
    c.v = 2;
  }
  function normalize(c){
    c.forTags = Array.isArray(c.forTags) ? c.forTags : [];
    c.bases = Array.isArray(c.bases) ? c.bases : [];
    if(isJob(c)){
      c.steps = []; c.v = 2; c.stage = 'job'; c.status = c.status || 'Not started';
      if(typeof c.order !== 'number') c.order = Date.now();
      return c;
    }
    if(c.v !== 2) migrate(c);
    c.steps.forEach(s=>{
      if(!s.id) s.id = uid(); if(!s.phase) s.phase = phaseOf(s); if(!s.type) s.type = guessType(s.activity);
      if(s.owner === 'Uncaged') s.owner = 'In-house';
      // A description that only repeats the step name (including the old names) is dropped.
      if(s.activity && [typeDef(s.type).label, 'Uncaged testing', 'Ship samples to Uncaged'].some(l=>same(s.activity, l))) s.activity = '';
    });
    renumber(c);
    if(typeof c.order !== 'number') c.order = Date.now();
    return c;
  }
  const same = (a, b) => String(a||'').trim().toLowerCase() === String(b||'').trim().toLowerCase();
  const stepLabel = s => typeDef(s.type).label;
  // Rounds are worked out, not typed: each Trial round starts the next round, and
  // steps before the first trial round belong to round 1.
  function renumber(c){
    let n = 0;
    rdSteps(c).forEach(s=>{ if(s.type === 'trial') n++; s.round = Math.max(n, 1); });
  }
  function latestTrialOf(c){ return rdSteps(c).filter(s=>s.type==='trial').pop() || null; }
  function newTrial(c){
    const s = blankStep('trial', {owner:c.partner||'', unit:'A4s'});
    addStepTo(c, s); renumber(c);
    return s;
  }
  function maxRound(c){ return rdSteps(c).reduce((m,s)=>Math.max(m, Number(s.round)||0), 0); }
  function trialCount(c){ return rdSteps(c).filter(s=>s.type==='trial').length; }
  function currentStep(c){
    const st = rdSteps(c);
    return st.find(s=>s.status==='In progress' || s.status==='At risk') ||
           st.find(s=>s.status==='Not started' || s.status==='TBD') || st[st.length-1];
  }
  function resultSteps(c){ return rdSteps(c).filter(s=>typeDef(s.type).result); }
  function latestResult(c){ const r = resultSteps(c); return r.filter(s=>s.result).pop() || r[r.length-1]; }
  function finalShade(c){
    const st = rdSteps(c);
    return st.find(s=>s.id===c.finalStepId) || st.filter(s=>s.type==='trial').pop() || latestResult(c) || null;
  }
  function activeBases(){ return settings.baseColors.filter(b=>b.active).map(b=>b.name); }
  function allForTags(){
    const set = new Set();
    live().forEach(c=>c.forTags.forEach(t=>set.add(t)));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function allOwners(){
    const set = new Set(['Pearl','Bader','In-house']);
    live().forEach(c=>{ c.steps.forEach(s=>s.owner && set.add(s.owner)); c.forTags.forEach(t=>set.add(t)); c.partner && set.add(c.partner); });
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function allPartners(){
    const set = new Set(['Pearl','Bader']);
    live().forEach(c=>c.partner && set.add(c.partner));
    return [...set].sort((a,b)=>a.localeCompare(b));
  }
  function ownerFor(type, c){
    const o = typeDef(type).owner;
    return o === 'partner' ? (c.partner||'') : o === 'inhouse' ? 'In-house' : o === 'brand' ? (c.forTags[0]||'Brand') : '';
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
      await movePriorities();
      await fillRanks();
      loaded = true;
    } catch(e){
      loadError = 'Couldn’t load colors in development (' + (e.message||e) + '). Reload to try again.';
      console.error(e);
    }
    render();
  }
  // The old Finishing Priorities tab kept its rows as "prio-<id>". Each one is
  // moved here once: a row for a color sets its priority and fills its trial
  // round's quantity / dates (empty fields only); a hand-entered row becomes a
  // partner job. The old rows are kept, marked as moved.
  async function movePriorities(){
    let recs = [];
    try {
      const {keys} = await window.storage.list('prio-');
      recs = (await Promise.all(keys.map(k => window.storage.get(k).then(r=>JSON.parse(r.value)).catch(()=>null)))).filter(Boolean);
    } catch(e){ return; }
    const todo = recs.filter(r=>!r.movedAt && !r.deletedAt).sort((a,b)=>(a.rank||0)-(b.rank||0));
    for(const r of todo){
      try {
        if(r.devId){
          const c = byId(r.devId);
          if(c && !c.deletedAt && !isJob(c)){
            if(!c.rank && r.rank) c.rank = r.rank;
            let t = latestTrialOf(c);
            if(!t && (r.quantity || r.receiveDate)) t = newTrial(c);
            if(t){
              if(!t.qty && r.quantity) t.qty = String(r.quantity);
              if(r.unit && (!t.unit || !t.qty)) t.unit = r.unit;
              if(!t.receiveDate && r.receiveDate) t.receiveDate = r.receiveDate;
              if(r.notes && !String(t.notes||'').includes(r.notes)) t.notes = [t.notes, r.notes].filter(Boolean).join(' · ');
              if(r.done && t.status !== 'Complete'){ t.status = 'Complete'; t.doneAt = r.doneAt || iso(new Date()); }
            }
            if(!c.brandTarget && r.targetDate) c.brandTarget = r.targetDate;
            await save(c);
          }
        } else if(!byId('job' + r.id)){
          const j = normalize({kind:'job', id:'job' + r.id, name: r.color || r.job || r.project || 'Partner job', hex: r.hex || '',
            jobType: r.job || '', partner: r.partner || '', forTags: r.project ? [r.project] : [],
            material: r.material || '', finish: r.finish || '', texture: r.texture || '',
            qty: r.quantity ? String(r.quantity) : '', unit: r.unit || 'A4s', dueDate: '', receiveDate: r.receiveDate || '',
            brandTarget: r.targetDate || '', status: r.done ? 'Complete' : 'Not started', doneAt: r.doneAt || '',
            notes: r.notes || '', rank: r.rank || 0, order: Date.now()});
          await save(j); colors.push(j);
        }
        r.movedAt = new Date().toISOString();
        await window.storage.set('prio-' + r.id, JSON.stringify(r));
      } catch(e){ console.error('Moving a priority failed', e); }
    }
  }
  // Open work without a priority yet goes to the bottom of its partner's list.
  async function fillRanks(){
    const need = live().filter(c=>isOpen(c) && !c.rank).sort((a,b)=>(a.order||0)-(b.order||0));
    let n = nextRank();
    need.forEach(c=>{ c.rank = n++; });
    await Promise.all(need.map(c=>save(c).catch(e=>console.error(e))));
  }
  async function save(c){
    c.updatedAt = new Date().toISOString();
    await window.storage.set(PREFIX + c.id, JSON.stringify(c));
  }
  async function saveSettings(){ await window.storage.set(SETTINGS_KEY, JSON.stringify(settings)); }
  function saveQuietly(c){ save(c).catch(e=>console.error('Save failed', e)); }

  // ---------- filtering, grouping, sorting ----------
  function matches(c){
    if(!ui.stages.has(filterKey(c)) && !(ui.stages.has('final') && isApproved(c))) return false;
    const q = ui.q.trim().toLowerCase();
    if(!q) return true;
    return [c.name, c.pantone, c.partner, c.material, c.finish, c.texture, c.notes, c.jobType, ...c.forTags, ...c.bases]
      .some(v => (v||'').toLowerCase().includes(q));
  }
  function groups(){
    const list = live().filter(matches).sort(byPriority);
    if(ui.groupBy === 'none') return [['', list]];
    const map = new Map();
    const NONE = ui.groupBy === 'base' ? 'No base set' : 'No partner set';
    list.forEach(c=>{
      let keys = ui.groupBy==='base' ? c.bases : (c.partner ? [c.partner] : []);
      if(!keys.length) keys = [NONE];
      keys.forEach(k=>{ if(!map.has(k)) map.set(k, []); map.get(k).push(c); });
    });
    const order = settings.baseColors.map(x=>x.name);
    return [...map.entries()].sort((a,b)=>{
      if((a[0]===NONE) !== (b[0]===NONE)) return a[0]===NONE ? 1 : -1;
      if(ui.groupBy==='base') return (order.indexOf(a[0])+1||99) - (order.indexOf(b[0])+1||99);
      return b[1].filter(isOpen).length - a[1].filter(isOpen).length || a[0].localeCompare(b[0]);
    });
  }
  function sortValue(c, key){
    switch(key){
      case 'color':    return (c.name||'').toLowerCase();
      case 'partner':  return (c.partner||'').toLowerCase();
      case 'project':  return (c.forTags[0]||'').toLowerCase();
      case 'base':     return [c.bases.join(' + '), c.texture].filter(Boolean).join(' ').toLowerCase();
      case 'stage':    return isJob(c) ? 100 + STEP_STATUSES.indexOf(c.status) : STAGES.findIndex(x=>x.key===c.stage);
      case 'progress': { if(isJob(c)) return (c.jobType||'').toLowerCase(); const s = currentStep(c); return s ? String(maxRound(c)).padStart(3,'0') + String(STEP_TYPES.findIndex(t=>t.key===s.type)).padStart(2,'0') : ''; }
      case 'job':      { const t = isJob(c) ? c : latestTrialOf(c); return (t && t.receiveDate) || ''; }
      case 'forecast': return c.forecastQuarter ? c.forecastQuarter + ' ' + String(Number(c.forecastSqft)||0).padStart(9,'0') : (Number(c.forecastSqft) ? '~' + String(Number(c.forecastSqft)).padStart(9,'0') : '');
    }
    return '';
  }
  function sortRows(list){
    if(!ui.sortKey) return list;
    return list.slice().sort((a,b)=>{
      const x = sortValue(a, ui.sortKey), y = sortValue(b, ui.sortKey);
      const ex = x === '' || x === -1, ey = y === '' || y === -1;
      if(ex !== ey) return ex ? 1 : -1;
      if(x < y) return -ui.sortDir;
      if(x > y) return ui.sortDir;
      return byPriority(a, b);
    });
  }

  // ---------- rendering ----------
  function render(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    const focusKey = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset.fk : null;
    if(loadError){ root.innerHTML = `<div class="dv-empty">${esc(loadError)}</div>`; return; }
    if(!loaded){ root.innerHTML = `<div class="dv-empty">Loading partner projects…</div>`; return; }
    const gs = groups();
    root.innerHTML = `
      ${summaryHTML()}
      <div class="dv-toolbar">
        <div class="dv-tools-left">
          <input type="search" class="dv-search" placeholder="Search colors, jobs, projects, Pantone…" value="${esc(ui.q)}" data-act="search" data-fk="search">
          <label class="dv-inline">Group by
            <select data-act="groupBy">
              ${[['none','No grouping'],['base','Base color'],['partner','Partner']].map(([k,l])=>`<option value="${k}" ${ui.groupBy===k?'selected':''}>${l}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="dv-tools-right">
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
          <button class="btn secondary" data-act="newJob" title="Partner work that isn't a color in development, e.g. a gloss adjustment or a panel order">+ New partner job</button>
          <button class="btn" data-act="new">+ New color</button>
        </div>
      </div>
      ${stageChipsHTML()}
      ${bulkHTML()}
      ${live().length === 0 ? emptyHTML() : tableHTML(gs)}`;
    if(focusKey){
      const el = root.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`);
      if(el){ el.focus(); if(el.type==='search') el.setSelectionRange(el.value.length, el.value.length); }
    }
    const all = root.querySelector('[data-act=selectAll]');
    if(all){ const vis = visibleIds(); all.indeterminate = vis.some(id=>selected.has(id)) && !vis.every(id=>selected.has(id)); }
  }
  function visibleIds(){ return [...new Set(groups().flatMap(([,l])=>l.filter(c=>!isJob(c)).map(c=>c.id)))]; }

  function summaryHTML(){
    const L = live();
    return `<div class="summary dv-cards">
      ${CARDS.map(k=>{ const on = sameSet(ui.stages, k.stages);
        return `<button type="button" class="summary-card dv-card ${k.cls||''} ${on?'on':''}" data-act="card" data-k="${k.key}"
        title="${esc((k.title ? k.title + '. ' : '') + (on ? 'Click again to go back to the default view' : 'Click to show only these'))}" aria-pressed="${on}">
        <div class="num">${L.filter(k.test).length}</div><div class="lbl">${k.label}</div></button>`; }).join('')}
    </div>`;
  }
  // Stage filter: tick any mix of stages. Opens on the default set.
  function stageChipsHTML(){
    const L = live(), isDefault = sameSet(ui.stages, DEFAULT_STAGES), isAll = ui.stages.size === FILTERS.length;
    return `<div class="dv-stagechips" role="group" aria-label="Show stages">
      <span class="dv-stagechips-lbl">Show stages</span>
      ${FILTERS.map(s=>{ const on = ui.stages.has(s.key), n = L.filter(c=> s.key === 'final' ? isApproved(c) : filterKey(c)===s.key).length;
        return `<button type="button" class="dv-chip ${on?'on':''}" data-act="stageChip" data-k="${s.key}" aria-pressed="${on}" style="--chip:${s.color}">
          <span class="dv-chip-dot"></span>${esc(s.label)} <span class="dv-chip-n">${n}</span></button>`; }).join('')}
      <span class="dv-stagechips-btns">
        ${isDefault ? '' : `<button class="linkish" data-act="stagesDefault">Default view</button>`}
        ${isAll ? '' : `<button class="linkish" data-act="stagesAll">All stages</button>`}
      </span>
    </div>`;
  }
  function emptyHTML(){
    return `<div class="dv-empty"><p><b>No partner projects yet.</b></p>
      <p>Add one with <b>+ New color</b> or <b>+ New partner job</b>, or load the starting data with <b>More → Import from file…</b></p></div>`;
  }

  const RESULT_PILL = {pass:['Passed','ok'], done:['Complete','ok'], fail:['Failed','bad'], '':['Pending','wait']};
  function testBits(t){ return TEST_FIELDS.filter(f=>t && t[f.k]!=='' && t[f.k]!=null).slice(0,3).map(f=>`${f.label} ${esc(t[f.k])}`).join(' · '); }

  // Each partner's open work is numbered 1, 2, 3... in priority order, among the rows shown.
  function numbers(gs){
    const seen = new Set(), byPartner = new Map(), out = new Map();
    gs.forEach(([,l])=>l.forEach(c=>{ if(seen.has(c.id) || !isOpen(c)) return; seen.add(c.id);
      const p = c.partner || ''; if(!byPartner.has(p)) byPartner.set(p, []); byPartner.get(p).push(c); }));
    byPartner.forEach(l=>l.sort(byPriority).forEach((c,i)=>out.set(c.id, i+1)));
    return out;
  }
  function tableHTML(gs){
    const cols = [['','#'],['color','Color / job'],['partner','Partner'],['stage','Stage'],['project','Project'],['base','Base &amp; texture'],
      ['progress','Progress'],['job','Quantity &amp; dates'],['forecast','Forecasted order'],['','']];
    const vis = visibleIds();
    const allOn = vis.length && vis.every(id=>selected.has(id));
    const head = cols.map(([k,h])=>{
      if(!k) return h ? `<th class="dt-rankh" title="Priority in each partner's list">${h}</th>` : '<th></th>';
      const sortBtn = `<span class="dt-sort-lbl" data-act="sort" data-k="${k}">${h}<span class="dt-arrow">${ui.sortKey===k ? (ui.sortDir===1?'▲':'▼') : '↕'}</span></span>`;
      return `<th class="dt-sort ${ui.sortKey===k?'on':''}" aria-sort="${ui.sortKey===k ? (ui.sortDir===1?'ascending':'descending') : 'none'}" title="Sort by ${h}">
        ${k==='color' ? `<input type="checkbox" class="dv-check" data-act="selectAll" ${allOn?'checked':''} title="Select all colors shown">` : ''}${sortBtn}</th>`;
    }).join('');
    const nums = numbers(gs);
    const movable = ui.groupBy === 'partner' && !ui.sortKey;
    const body = gs.map(([name, list])=>{
      const partner = list[0] ? (list[0].partner || '') : '';
      const copy = ui.groupBy === 'partner' && partner && list.some(isOpen);
      return `${name ? `<tr class="dt-group"><td colspan="${cols.length}">${esc(name)} <span class="dv-count">${list.length}</span>
          ${copy ? `<button class="linkish dt-copy" data-act="copy" data-p="${esc(partner)}" title="Copy ${esc(partner)}'s numbered list to paste into an email or message">Copy ${esc(partner)}'s list</button>` : ''}</td></tr>` : ''}
      ${sortRows(list).map(c=>rowHTML(c, name, nums.get(c.id), movable && isOpen(c))).join('')}`; }).join('');
    return `${forecastHTML()}
      ${movable ? '' : `<p class="dv-hint dt-orderhint">To change a partner's priority order, group by <b>Partner</b>${ui.sortKey ? ' and turn off column sorting' : ''}.</p>`}
      <div class="dt-wrap"><table class="dt">
      <thead><tr>${head}</tr></thead>
      <tbody>${list0(gs) ? body : `<tr><td colspan="${cols.length}" class="dv-muted" style="padding:16px">Nothing in the stages you’ve picked. Tick more under <b>Show stages</b>, or choose <b>All stages</b>.</td></tr>`}</tbody>
    </table></div>`;
  }
  const list0 = gs => gs.some(([,l])=>l.length);

  // Forecasted base material needs: forecast sq ft totalled by base, material and texture, per quarter.
  function forecastHTML(){
    const list = liveColors().filter(c=>c.stage!=='failed_stopped' && Number(c.forecastSqft) > 0);
    if(!list.length) return `<div class="dt-fcbox empty">Add a <b>forecasted order</b> (sq ft and quarter) to a color, and the base material it will need is totalled here by base, material and texture.</div>`;
    const rows = new Map(), quarters = new Set();
    list.forEach(c=>{
      const key = [c.bases.join(' + ') || 'Base not set', c.material || 'Material not set', c.texture || 'Texture not set'];
      const k = key.join('|'), q = c.forecastQuarter || 'No quarter';
      quarters.add(q);
      if(!rows.has(k)) rows.set(k, {key, byQ:{}, total:0, colors:[]});
      const r = rows.get(k); const n = Number(c.forecastSqft);
      r.byQ[q] = (r.byQ[q]||0) + n; r.total += n; r.colors.push(c.name);
    });
    const qs = [...quarters].sort((a,b)=> a==='No quarter' ? 1 : b==='No quarter' ? -1 : a.localeCompare(b));
    const fmtN = n => Math.round(n).toLocaleString('en-US');
    const grand = [...rows.values()].reduce((a,r)=>a+r.total,0);
    return `<div class="dt-fcbox">
      <div class="dt-fc-title">Forecasted base material needs <span class="dv-muted">every color with a forecasted order · ${list.length} color${list.length===1?'':'s'}, including approved ones</span></div>
      <div class="dt-fc-scroll"><table class="dt-mini dt-fc-table">
        <thead><tr><th>Base</th><th>Material</th><th>Texture</th>${qs.map(q=>`<th class="r">${esc(q)}</th>`).join('')}<th class="r">Total sq ft</th><th class="r">≈ Usable yds</th></tr></thead>
        <tbody>${[...rows.values()].sort((a,b)=>b.total-a.total).map(r=>`<tr title="${esc(r.colors.join(', '))}">
          ${r.key.map(x=>`<td class="${/not set$/.test(x)?'dv-muted':''}">${esc(x)}</td>`).join('')}
          ${qs.map(q=>`<td class="r">${r.byQ[q] ? fmtN(r.byQ[q]) : ''}</td>`).join('')}
          <td class="r"><b>${fmtN(r.total)}</b></td><td class="r">${fmtN(r.total / SQFT_PER_YARD)}</td></tr>`).join('')}
          <tr class="dt-fc-total"><td colspan="3">All forecasts</td>${qs.map(q=>`<td class="r">${fmtN([...rows.values()].reduce((a,r)=>a+(r.byQ[q]||0),0))}</td>`).join('')}
          <td class="r"><b>${fmtN(grand)}</b></td><td class="r">${fmtN(grand / SQFT_PER_YARD)}</td></tr>
        </tbody></table></div>
      <div class="dv-muted dt-fc-note">Yards use the Vault's rule (12.5 sq ft per usable yard). A color on two bases (e.g. Natural + Off-White) is counted once, on a combined line. Totals don't change with the stage filter; only “Failed – no more trials” is left out.</div>
    </div>`;
  }

  function progressHTML(c){
    const st = rdSteps(c), cur = currentStep(c);
    if(!st.length) return `<button class="dt-prog empty" data-act="steps" data-c="${c.id}">No steps yet <span class="dt-prog-add">+ Add</span></button>`;
    const late = cur && cur.end && pd(cur.end) < today() && cur.status !== 'Complete';
    const stCls = cur.status==='Complete' ? 'ok' : cur.status==='At risk' ? 'bad' : cur.status==='In progress' ? 'wait' : 'none';
    return `<button class="dt-prog" data-act="steps" data-c="${c.id}" title="Open all ${st.length} steps">
      <span class="dt-prog-round">Round ${cur.round || 1}${maxRound(c) > (cur.round||1) ? ` <span class="dv-muted">of ${maxRound(c)}</span>` : ''}</span>
      <span class="dt-prog-step">${esc(stepLabel(cur))}${cur.activity ? `<span class="dt-prog-detail">${esc(cur.activity)}</span>` : ''}</span>
      <span class="dt-prog-meta"><span class="dt-pill ${stCls}">${esc(cur.status)}</span>
        ${cur.start||cur.end ? `<span class="${late?'dt-late':'dv-muted'}">${esc(fmt(cur.start)||'?')} – ${esc(fmt(cur.end)||'…')}</span>` : ''}</span>
      <span class="dt-prog-count">${st.length} step${st.length===1?'':'s'} · open</span>
    </button>`;
  }

  function rankCell(c, num, movable){
    if(!num) return `<td class="dt-rank"><span class="dv-muted" title="${isJob(c) ? 'Done' : 'Approved or stopped'}, so not numbered">–</span></td>`;
    return `<td class="dt-rank">${movable ? `<span class="dt-handle" title="Drag to reorder">⠿</span>` : ''}<b title="${esc((c.partner||'No partner')+'’s priority #'+num)}">${num}</b>
      ${movable ? `<span class="dt-move"><button class="icon-btn" data-act="up" data-c="${c.id}" title="Move up">↑</button><button class="icon-btn" data-act="down" data-c="${c.id}" title="Move down">↓</button></span>` : ''}</td>`;
  }
  // Quantity and dates: a color's come from its latest trial round (the partner's
  // job), so they are the same here and in the Progress pop-up.
  function jobCell(c, fk){
    const t = isJob(c) ? c : latestTrialOf(c);
    const done = isJob(c) ? jobDone(c) : !!(t && t.status === 'Complete');
    const due = t ? (isJob(c) ? t.dueDate : t.end) : '', rcv = t ? t.receiveDate : '';
    const late = d => d && pd(d) < today() && !done ? 'late' : '';
    const tip = isJob(c) ? '' : (t ? `From trial round ${t.round}` : 'Fills in a new trial round');
    return `<td class="dt-job" title="${esc(tip)}">
      <div class="dt-job-qty"><input type="number" min="0" step="1" placeholder="Qty" value="${esc(t ? t.qty : '')}" data-c="${c.id}" data-f="jobQty" data-fk="${esc(fk)}|jq">
        <select data-c="${c.id}" data-f="jobUnit" data-fk="${esc(fk)}|ju" ${LA('unit','unit')}>${LO('unit', UNITS, (t && t.unit) || 'A4s', null)}</select></div>
      <label class="dt-job-date ${late(due)}">Due<input type="date" value="${esc(due||'')}" data-c="${c.id}" data-f="jobDue" data-fk="${esc(fk)}|jd"></label>
      <label class="dt-job-date ${late(rcv)}">Receive by<input type="date" value="${esc(rcv||'')}" data-c="${c.id}" data-f="jobReceive" data-fk="${esc(fk)}|jr"></label>
      <label class="dt-job-date">Brand target<input type="date" value="${esc(c.brandTarget||'')}" data-c="${c.id}" data-f="brandTarget" data-fk="${esc(fk)}|bt"></label>
    </td>`;
  }
  function jobRowHTML(c, gname, num, movable){
    const fk = `${gname}|${c.id}`;
    const stCls = 'st-' + String(c.status||'').replace(/\s+/g,'-').toLowerCase();
    const what = [c.material, c.finish, c.texture].filter(Boolean).join(' · ');
    return `<tr class="dt-row dt-jobrow ${jobDone(c)?'is-done':''}" data-id="${c.id}">
      ${rankCell(c, num, movable)}
      <td class="dt-color"><div class="dt-color-in">
        <span class="dv-check-sp"></span>
        <span class="dt-swatch dt-jobswatch" data-act="edit" data-c="${c.id}" ${isHex(c.hex) ? `style="background:${esc(c.hex)}"` : ''} title="Edit job"></span>
        <span class="dt-name" data-act="edit" data-c="${c.id}" title="Edit job"><b>${esc(c.name||'Untitled job')}</b><span class="dv-code">Partner job</span></span>
      </div></td>
      <td>${esc(c.partner||'—')}</td>
      <td><select class="dt-jobstatus ${stCls}" data-c="${c.id}" data-f="status" data-fk="${esc(fk)}|status" ${LA('stepStatus','status')}>${LO('stepStatus', STEP_STATUSES, c.status, null)}</select></td>
      <td>${c.forTags.length ? c.forTags.map(x=>`<span class="dv-tag">${esc(x)}</span>`).join(' ') : '<span class="dv-muted">—</span>'}</td>
      <td>${what ? esc(what) : '<span class="dv-muted">—</span>'}</td>
      <td><select class="dt-jobtype ${c.jobType ? '' : 'unset'}" data-c="${c.id}" data-f="jobType" data-fk="${esc(fk)}|jt" ${LA('job','job type')}>${LO('job', JOBS, c.jobType, 'Job type?')}</select>
        ${c.notes ? `<div class="dv-muted dt-jobnote">${esc(c.notes)}</div>` : ''}</td>
      ${jobCell(c, fk)}
      <td><span class="dv-muted">—</span></td>
      <td><button class="icon-btn" data-act="edit" data-c="${c.id}" title="Edit job">✎</button></td>
    </tr>`;
  }
  function rowHTML(c, gname, num, movable){
    if(isJob(c)) return jobRowHTML(c, gname, num, movable);
    const st = stageDef(c.stage);
    const fk = `${gname}|${c.id}`;
    return `<tr class="dt-row ${selected.has(c.id)?'is-selected':''}" data-id="${c.id}">
      ${rankCell(c, num, movable)}
      <td class="dt-color"><div class="dt-color-in">
        <input type="checkbox" class="dv-check" data-act="select" data-c="${c.id}" ${selected.has(c.id)?'checked':''} title="Select to update together">
        <span class="dt-swatch" data-act="edit" data-c="${c.id}" style="background:${esc(c.hex||'#ddd')}" title="Edit color details"></span>
        <span class="dt-name" data-act="edit" data-c="${c.id}" title="Edit color details"><b>${esc(c.name||'Untitled')}</b>${c.pantone ? `<span class="dv-code">${esc(c.pantone)}</span>` : ''}</span>
      </div></td>
      <td>${esc(c.partner||'—')}</td>
      <td><select class="dv-stage" data-c="${c.id}" data-f="stage" data-fk="${esc(fk)}|stage" style="background:${st.color};color:${contrast(st.color)}">
        ${STAGES.map(x=>`<option value="${x.key}" ${c.stage===x.key?'selected':''}>${esc(x.label)}</option>`).join('')}</select>
        <label class="dt-stockflag ${isApproved(c)?'on':''}" title="${c.stage==='final' ? 'Approved – final always counts as approved for our stock' : 'Also approved for our stock: it shows on Stock Offerings while it stays in this stage'}">
          <input type="checkbox" data-c="${c.id}" data-f="approvedStock" ${isApproved(c)?'checked':''} ${c.stage==='final'?'disabled':''}> Approved for our stock</label></td>
      <td>${c.forTags.length ? c.forTags.map(x=>`<span class="dv-tag">${esc(x)}</span>`).join(' ') : '<span class="dv-muted">—</span>'}</td>
      <td>${c.bases.length ? `<b class="dt-base">${esc(c.bases.join(' + '))}</b>` : '<span class="dv-muted">Base not set</span>'}
        <div><select class="dt-tex ${c.texture ? '' : 'unset'}" data-c="${c.id}" data-f="texture" data-fk="${esc(fk)}|texture" title="Texture it is being tested on" ${LA('texture','texture')}>
          ${LO('texture', DEV_TEXTURES, c.texture, 'Texture?')}
        </select></div>
        ${[c.material, c.finish].filter(Boolean).length ? `<div class="dv-muted">${esc([c.material, c.finish].filter(Boolean).join(' · '))}</div>` : ''}</td>
      <td class="dt-progcell">${progressHTML(c)}</td>
      ${jobCell(c, fk)}
      <td class="dt-fc">
        <div class="dt-fc-row"><input type="number" min="0" step="10" inputmode="numeric" placeholder="—" value="${esc(c.forecastSqft||'')}" data-c="${c.id}" data-f="forecastSqft" data-fk="${esc(fk)}|fsq" title="Forecasted order, sq ft"><span class="dv-muted">sq ft</span></div>
        <select data-c="${c.id}" data-f="forecastQuarter" data-fk="${esc(fk)}|fq" title="Quarter of the forecasted order" class="${c.forecastQuarter ? '' : 'unset'}">
          <option value="">Quarter?</option>${quarterOptions(c.forecastQuarter).map(q=>`<option ${c.forecastQuarter===q?'selected':''}>${q}</option>`).join('')}
        </select></td>
      <td><button class="icon-btn" data-act="edit" data-c="${c.id}" title="Edit color details">✎</button></td>
    </tr>`;
  }

  // Bulk updates for the ticked colors.
  function bulkHTML(){
    if(!selected.size) return '';
    const sel = [...selected].map(byId).filter(Boolean);
    return `<div class="dv-bulk">
      <div class="dv-bulk-line">
        <b>${sel.length} selected</b>
        <span class="dv-bulk-group">Set
          <select id="dvBulkStage" title="Stage"><option value="">Stage…</option>${STAGES.map(s=>`<option value="${s.key}">${esc(s.label)}</option>`).join('')}</select>
          <input id="dvBulkPartner" list="dvPartnerListBulk" placeholder="Partner…" title="Partner"><datalist id="dvPartnerListBulk">${allPartners().map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
          <select id="dvBulkTexture" title="Texture" ${LA('texture','texture')}>${LO('texture', DEV_TEXTURES, '', 'Texture…')}</select>
          <select id="dvBulkQuarter" title="Forecast quarter"><option value="">Forecast quarter…</option>${quarterOptions().map(q=>`<option>${q}</option>`).join('')}</select>
          <button class="btn" data-act="bulkSet">Apply</button>
        </span>
        <button class="btn secondary" data-act="clearSel">Clear selection</button>
      </div>
      <div class="dv-bulk-line">
        <span class="dv-bulk-group">Add a step to each
          <select id="dvBulkAddType" ${LA('stepType','step type','custom:')}>${typeOptions('send')}</select>
          <select id="dvBulkAddStatus" ${LA('stepStatus','status')}>${LO('stepStatus', STEP_STATUSES, 'Not started', null)}</select>
          <input type="date" id="dvBulkAddStart" title="Start"><input type="date" id="dvBulkAddEnd" title="End">
          <button class="btn" data-act="bulkAdd">Add</button>
        </span>
        <span class="dv-bulk-group">Update each one's latest
          <select id="dvBulkUpdType" ${LA('stepType','step type','custom:')}>${typeOptions('testing')}</select>
          <select id="dvBulkUpdStatus" ${LA('stepStatus','status')}>${LO('stepStatus', STEP_STATUSES, '', 'Status…')}</select>
          <select id="dvBulkUpdResult"><option value="">Result…</option>${RESULTS.filter(r=>r.key).map(r=>`<option value="${r.key}">${r.label}</option>`).join('')}<option value="pending">Pending</option></select>
          <input type="date" id="dvBulkUpdEnd" title="End date">
          <button class="btn" data-act="bulkUpd">Update</button>
        </span>
      </div>
    </div>`;
  }

  // ---------- events ----------
  function onChange(e){
    const el = e.target;
    const act = el.dataset.act;
    if(act === 'groupBy'){ ui.groupBy = el.value; writePrefs(); return render(); }
    if(act === 'select'){ el.checked ? selected.add(el.dataset.c) : selected.delete(el.dataset.c); return render(); }
    if(act === 'selectAll'){ visibleIds().forEach(id=> el.checked ? selected.add(id) : selected.delete(id)); return render(); }
    const c = byId(el.dataset.c); const f = el.dataset.f;
    if(!c || !f) return;
    if(['jobQty','jobUnit','jobDue','jobReceive'].includes(f)){
      let v = el.value.trim();
      if(f === 'jobQty') v = v === '' ? '' : String(Math.max(0, Number(v) || 0));
      const t = isJob(c) ? c : (latestTrialOf(c) || newTrial(c));
      t[{jobQty:'qty', jobUnit:'unit', jobDue: isJob(c) ? 'dueDate' : 'end', jobReceive:'receiveDate'}[f]] = v;
      saveQuietly(c);
      return setTimeout(render, 0);
    }
    if(f === 'brandTarget' || f === 'jobType'){ c[f] = el.value; saveQuietly(c); return setTimeout(render, 0); }
    if(f === 'status' && isJob(c)){
      const was = jobDone(c);
      c.status = el.value;
      if(jobDone(c) && !was) c.doneAt = iso(new Date());
      if(!jobDone(c) && was){ c.doneAt = ''; c.rank = nextRank(); }
      saveQuietly(c);
      if(jobDone(c) && !was) toast(ui.stages.has('job_done') ? `${c.name} is done.` : `${c.name} is done. Tick “Completed jobs” under Show stages to see it again.`);
      if(!jobDone(c) && was) toast(`${c.name} is back on ${c.partner || 'its partner'}’s list, at the bottom.`);
      return setTimeout(render, 0);
    }
    if(f === 'approvedStock'){
      c.approvedStock = el.checked; saveQuietly(c); repaintOthers();
      toast(el.checked ? `${c.name} is approved for our stock and now shows on Stock Offerings. Its stage stays “${stageDef(c.stage).label}”.` : `${c.name} is no longer marked approved for our stock.`);
      return setTimeout(render, 0);
    }
    if(f === 'texture' || f === 'forecastSqft' || f === 'forecastQuarter'){
      c[f] = f === 'forecastSqft' ? (el.value === '' ? '' : String(Math.max(0, Math.round(Number(el.value)) || 0))) : el.value;
      saveQuietly(c); repaintOthers();
      return setTimeout(render, 0);
    }
    if(f === 'stage'){
      const wasOpen = isOpen(c);
      c.stage = el.value;
      if(isOpen(c) && !wasOpen) c.rank = nextRank();
      saveQuietly(c); repaintOthers();
      if(c.stage === 'final') toast(`${c.name} is approved – final. It now shows on Stock Offerings.`);
      if(!ui.stages.has(c.stage)) setTimeout(()=>toast(`${c.name} is now “${stageDef(c.stage).label}”, which isn’t ticked under Show stages, so it’s hidden.`), c.stage==='final' ? 2500 : 0);
      return setTimeout(render, 0);
    }
  }
  function repaintOthers(){
    if(typeof window.renderStock === 'function') window.renderStock();
  }

  async function onClick(e){
    const btn = e.target.closest('[data-act]');
    const root = e.currentTarget;
    const menu = root.querySelector('.dv-menu-list');
    if(menu && !e.target.closest('.dv-menu')) menu.hidden = true;
    if(!btn || btn.tagName === 'SELECT' || btn.tagName === 'INPUT') return;
    const act = btn.dataset.act;
    const c = btn.dataset.c ? byId(btn.dataset.c) : null;
    switch(act){
      case 'menu': menu.hidden = !menu.hidden; return;
      case 'edit': return isJob(c) ? openJobModal(c, false) : openModal(c, false);
      case 'newJob': return openJobModal(null, true);
      case 'up': case 'down': return move(c, act);
      case 'copy': {
        const ok = await copyText(listText(btn.dataset.p));
        return toast(ok ? `${btn.dataset.p}'s list copied. Paste it into an email or message.` : 'Couldn’t copy automatically.');
      }
      case 'steps': return openSteps(c);
      case 'new': return openModal(null, true);
      case 'clearSel': selected.clear(); return render();
      case 'card': { const k = CARDS.find(x=>x.key===btn.dataset.k);
        ui.stages = new Set(sameSet(ui.stages, k.stages) ? DEFAULT_STAGES : k.stages); return render(); }
      case 'stageChip': { const k = btn.dataset.k; ui.stages.has(k) ? ui.stages.delete(k) : ui.stages.add(k); return render(); }
      case 'stagesDefault': ui.stages = new Set(DEFAULT_STAGES); return render();
      case 'stagesAll': ui.stages = new Set(FILTERS.map(x=>x.key)); return render();
      case 'sort':
        if(ui.sortKey !== btn.dataset.k){ ui.sortKey = btn.dataset.k; ui.sortDir = 1; }
        else if(ui.sortDir === 1) ui.sortDir = -1;
        else ui.sortKey = '';                       // third click: back to the normal order
        return render();
      case 'bulkSet': return bulkSet(root);
      case 'bulkAdd': return bulkAdd(root);
      case 'bulkUpd': return bulkUpd(root);
      case 'exportJson': menu.hidden = true; return exportJson();
      case 'exportCsv': menu.hidden = true; return exportCsv();
      case 'import': menu.hidden = true; return pickImport();
      case 'bases': menu.hidden = true; return openBases();
      case 'trash': menu.hidden = true; return openTrash();
    }
  }
  function onInput(e){
    if(e.target.dataset.act === 'search'){ ui.q = e.target.value; clearTimeout(onInput.t); onInput.t = setTimeout(render, 200); }
  }

  const selectedColors = () => [...selected].map(byId).filter(Boolean);
  async function bulkSet(root){
    const v = id => root.querySelector('#' + id).value.trim();
    const vals = {stage:v('dvBulkStage'), partner:v('dvBulkPartner'), texture:v('dvBulkTexture'), forecastQuarter:v('dvBulkQuarter')};
    if(!Object.values(vals).some(Boolean)) return alert('Choose a stage, partner, texture or forecast quarter to apply.');
    const list = selectedColors();
    for(const c of list){
      if(vals.partner && vals.partner !== c.partner) c.rank = nextRank();   // joins the bottom of the new partner's list
      Object.entries(vals).forEach(([k,x])=>{ if(x) c[k] = x; }); await save(c);
    }
    render(); repaintOthers(); toast(`Updated ${list.length} color${list.length===1?'':'s'}.`);
  }
  async function bulkAdd(root){
    const v = id => root.querySelector('#' + id).value;
    const type = v('dvBulkAddType'), list = selectedColors();
    for(const c of list){
      const round = type === 'trial' ? (trialCount(c) ? maxRound(c) + 1 : Math.max(1, maxRound(c))) : Math.max(1, maxRound(c));
      addStepTo(c, blankStep(type, {round, owner:ownerFor(type, c), status:v('dvBulkAddStatus'), start:v('dvBulkAddStart'), end:v('dvBulkAddEnd'), unit: type === 'trial' ? 'A4s' : ''}));
      renumber(c);
      await save(c);
    }
    render(); toast(`Added “${typeDef(type).label}” to ${list.length} color${list.length===1?'':'s'}.`);
  }
  async function bulkUpd(root){
    const v = id => root.querySelector('#' + id).value;
    const type = v('dvBulkUpdType'), status = v('dvBulkUpdStatus'), result = v('dvBulkUpdResult'), end = v('dvBulkUpdEnd');
    if(!status && !result && !end) return alert('Choose a status, result or end date to apply.');
    let n = 0, missing = 0;
    for(const c of selectedColors()){
      const s = rdSteps(c).filter(x=>x.type===type).pop();
      if(!s){ missing++; continue; }
      if(status) s.status = status;
      if(result && typeDef(type).result) s.result = result === 'pending' ? '' : result;
      if(status === 'Complete' && !s.doneAt) s.doneAt = iso(new Date());
      if(end) s.end = end;
      await save(c); n++;
    }
    render();
    toast(`Updated the latest “${typeDef(type).label}” on ${n} color${n===1?'':'s'}.` + (missing ? ` ${missing} had no such step.` : ''));
  }
  // A new step goes after the last step of an earlier or equal round (production steps stay last).
  function addStepTo(c, s){
    const rd = rdSteps(c), prod = c.steps.filter(x=>phaseOf(x)==='production');
    rd.push(s);
    c.steps = [...rd, ...prod];
  }

  // ---------- priority order ----------
  // The open rows shown for one partner, in priority order.
  function openShown(partner){
    const seen = new Set();
    return groups().flatMap(([,l])=>l).filter(c=>{ if(seen.has(c.id)) return false; seen.add(c.id); return isOpen(c) && (c.partner||'') === partner; }).sort(byPriority);
  }
  // Puts c at index `to` among `list`. The rows reuse their own rank numbers (plus
  // c's), so rows that are hidden or belong to other partners keep their place.
  async function placeAt(c, list, to){
    list = list.filter(x=>x !== c);
    list.splice(Math.max(0, Math.min(to, list.length)), 0, c);
    let slots = list.map(x=>Number(x.rank)||0).sort((a,b)=>a-b);
    if(slots.includes(0) || new Set(slots).size < slots.length){ const base = nextRank(); slots = list.map((x,k)=>base + k); }
    const changed = list.filter((x,k)=>{ if(x.rank === slots[k]) return false; x.rank = slots[k]; return true; });
    await Promise.all(changed.map(save));
  }
  async function move(c, dir){
    const list = openShown(c.partner||''), i = list.indexOf(c), j = dir === 'up' ? i-1 : i+1;
    if(i < 0 || j < 0 || j >= list.length) return;
    await placeAt(c, list, j);
    render();
  }
  function listText(partner){
    const lines = openShown(partner).map((c,i)=>{
      const t = isJob(c) ? c : latestTrialOf(c);
      const finish = [c.material, c.finish, c.texture].filter(Boolean).join(' ');
      const what = isJob(c) ? [c.forTags.join(', '), c.name, finish, c.jobType] : [c.forTags.join(', '), c.name, finish, currentStep(c) ? stepLabel(currentStep(c)) : ''];
      const qty = t && Number(t.qty) ? `${Number(t.qty).toLocaleString('en-US')} ${t.unit || ''}`.trim() : '';
      const due = t ? (isJob(c) ? t.dueDate : t.end) : '';
      const dates = [due ? `due ${fmt(due)}` : '', t && t.receiveDate ? `receive by ${fmt(t.receiveDate)}` : '', c.brandTarget ? `brand target ${fmt(c.brandTarget)}` : ''].filter(Boolean).join(', ');
      const note = isJob(c) ? c.notes : '';
      return `${i+1}. ${what.filter(Boolean).join(' – ')}${qty ? ` (${qty})` : ''}${dates ? ` – ${dates}` : ''}${note ? ` – ${note}` : ''}`;
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
  // Drag a row by its ⠿ handle (grouped by partner). Rows become draggable only
  // while the handle is held, so typing in a row is never mistaken for a drag.
  let dragId = null;
  function clearMarks(root){ root.querySelectorAll('.drop-before,.drop-after').forEach(x=>x.classList.remove('drop-before','drop-after')); }
  function endDrag(root){ dragId = null; root.querySelectorAll('tr[draggable]').forEach(x=>{ x.removeAttribute('draggable'); x.classList.remove('dragging'); }); }
  function setupDrag(root){
    root.addEventListener('mousedown', e=>{ const h = e.target.closest('.dt-handle'); if(h) h.closest('tr').setAttribute('draggable', 'true'); });
    root.addEventListener('mouseup', ()=>{ if(!dragId) endDrag(root); });
    root.addEventListener('dragstart', e=>{
      const tr = e.target.closest && e.target.closest('tr.dt-row');
      if(!tr || tr.getAttribute('draggable') !== 'true') return;
      dragId = tr.dataset.id; e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch(err){}
      tr.classList.add('dragging');
    });
    root.addEventListener('dragover', e=>{
      if(!dragId) return;
      const tr = e.target.closest('tr.dt-row'), c = byId(dragId), o = tr && byId(tr.dataset.id);
      clearMarks(root);
      if(!o || o === c || !isOpen(o) || (o.partner||'') !== (c.partner||'')) return;
      e.preventDefault();
      const box = tr.getBoundingClientRect();
      tr.classList.add(e.clientY < box.top + box.height/2 ? 'drop-before' : 'drop-after');
    });
    root.addEventListener('drop', async e=>{
      if(!dragId) return;
      e.preventDefault();
      const tr = e.target.closest('tr.dt-row'), c = byId(dragId);
      const before = tr && tr.classList.contains('drop-before'), after = tr && tr.classList.contains('drop-after');
      clearMarks(root); endDrag(root);
      if(!c || !(before || after)) return;
      const list = openShown(c.partner||'').filter(x=>x !== c), i = list.findIndex(x=>x.id === tr.dataset.id);
      if(i < 0) return;
      await placeAt(c, list, before ? i : i + 1);
      render();
    });
    root.addEventListener('dragend', ()=>{ clearMarks(root); endDrag(root); });
  }

  function toast(text){
    let el = document.getElementById('dvToast');
    if(!el){ el = document.createElement('div'); el.id = 'dvToast'; el.className = 'dv-toast'; document.body.appendChild(el); }
    el.textContent = text; el.style.display = '';
    clearTimeout(toast.t); toast.t = setTimeout(()=>{ el.style.display = 'none'; }, 3500);
  }

  // ---------- Progress pop-up: every step for one color ----------
  function ensureSteps(){
    if(document.getElementById('dvSteps')) return;
    const el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = 'dvSteps';
    el.innerHTML = `<div class="modal st-modal"><div id="dvStepsHead"></div><div id="dvStepsBody"></div>
      <div class="modal-actions"><button class="btn secondary" id="dvStepsCancel">Cancel</button><button class="btn" id="dvStepsSave">Save</button></div></div>`;
    document.body.appendChild(el);
    el.querySelector('#dvStepsCancel').addEventListener('click', ()=>{ el.classList.remove('open'); stepEdit = null; });
    el.querySelector('#dvStepsSave').addEventListener('click', saveSteps);
    el.addEventListener('click', e=>{
      if(e.target === el){ el.classList.remove('open'); stepEdit = null; return; }
      const b = e.target.closest('[data-st]'); if(!b) return;
      readSteps();
      const rd = rdSteps(stepEdit), i = rd.findIndex(s=>s.id===b.dataset.id);
      if(b.dataset.st === 'add'){
        const type = b.dataset.type;
        const round = type === 'trial' ? (trialCount(stepEdit) ? maxRound(stepEdit) + 1 : Math.max(1, maxRound(stepEdit))) : Math.max(1, maxRound(stepEdit));
        const last = rd[rd.length-1];
        const start = last && last.end ? iso(addD(pd(last.end), 1)) : '';
        addStepTo(stepEdit, blankStep(type, {round, owner:ownerFor(type, stepEdit), start, unit: type === 'trial' ? 'A4s' : ''}));
      }
      if(b.dataset.st === 'del' && confirm('Delete this step?')) setRd(rd.filter(s=>s.id!==b.dataset.id));
      if(b.dataset.st === 'up' && i > 0){ [rd[i-1], rd[i]] = [rd[i], rd[i-1]]; setRd(rd); }
      if(b.dataset.st === 'down' && i < rd.length-1){ [rd[i+1], rd[i]] = [rd[i], rd[i+1]]; setRd(rd); }
      if(b.dataset.st === 'more'){ const r = el.querySelector(`.st-row[data-id="${b.dataset.id}"]`); r.classList.toggle('more'); return; }
      renumber(stepEdit);
      fillSteps();
    });
  }
  function setRd(rd){ stepEdit.steps = [...rd, ...stepEdit.steps.filter(x=>phaseOf(x)==='production')]; }
  function openSteps(c){
    ensureSteps();
    stepEdit = JSON.parse(JSON.stringify(c));
    fillSteps();
    document.getElementById('dvSteps').classList.add('open');
  }
  function fillSteps(){
    const c = stepEdit, rd = rdSteps(c), prod = c.steps.length - rd.length;
    const owners = allOwners();
    document.getElementById('dvStepsHead').innerHTML = `<div class="st-head">
      <span class="dt-swatch" style="background:${esc(c.hex||'#ddd')}"></span>
      <div><h2>${esc(c.name)} <span class="dv-muted">progress</span></h2>
      <div class="dv-muted">${esc([c.partner, c.forTags.join(', '), c.bases.join(' + '), c.texture].filter(Boolean).join(' · '))}</div></div></div>`;
    document.getElementById('dvStepsBody').innerHTML = `
      <datalist id="dvOwnerListSt">${owners.map(o=>`<option value="${esc(o)}">`).join('')}</datalist>
      <div class="st-list">${rd.length ? rd.map((s,i)=>{
        const t = typeDef(s.type);
        const filled = TEST_FIELDS.some(f=>s[f.k]);
        const newRound = i === 0 || rd[i-1].round !== s.round;
        return `${newRound ? `<div class="st-round-head">Round ${s.round}</div>` : ''}<div class="st-row ${filled ? 'more' : ''} st-${esc(s.type)}" data-id="${s.id}">
          <div class="st-line">
            <select data-k="type" title="Step" ${LA('stepType','step type','custom:')}>${typeOptions(s.type)}</select>
            <input data-k="activity" class="st-label" value="${esc(s.activity)}" placeholder="Details (optional)">
            <input data-k="owner" list="dvOwnerListSt" value="${esc(s.owner)}" placeholder="Who" class="st-owner">
            <label class="st-date">Start<input data-k="start" type="date" value="${esc(s.start)}"></label>
            <label class="st-date">Due<input data-k="end" type="date" value="${esc(s.end)}"></label>
            <select data-k="status" class="st-status st-${esc((s.status||'').replace(/\s+/g,'-').toLowerCase())}" ${LA('stepStatus','status')}>${LO('stepStatus', STEP_STATUSES, s.status, null)}</select>
            <span class="st-btns">
              <button class="icon-btn" data-st="up" data-id="${s.id}" title="Move up" ${i===0?'disabled':''}>↑</button>
              <button class="icon-btn" data-st="down" data-id="${s.id}" title="Move down" ${i===rd.length-1?'disabled':''}>↓</button>
              <button class="icon-btn" data-st="del" data-id="${s.id}" title="Delete step">✕</button></span>
          </div>
          ${t.job ? `<div class="st-line st-job">
            <label>Quantity <input data-k="qty" type="number" min="0" step="1" value="${esc(s.qty)}" class="st-qty"></label>
            <select data-k="unit" ${LA('unit','unit')}>${LO('unit', UNITS, s.unit || 'A4s', null)}</select>
            <label class="st-date">Receive by<input data-k="receiveDate" type="date" value="${esc(s.receiveDate)}"></label>
            ${latestTrialOf(c) && latestTrialOf(c).id === s.id ? `<span class="st-linked">Also shown on the Partner Projects list</span>` : ''}
          </div>` : ''}
          <div class="st-line st-sub">
            ${t.result ? `<label>Result <select data-k="result" class="st-res ${esc(s.result||'pending')}">${RESULTS.map(r=>`<option value="${r.key}" ${(s.result||'')===r.key?'selected':''}>${r.label}</option>`).join('')}</select></label>` : ''}
            ${t.shade ? `<label title="Swatch color of this round">Shade <input data-k="hex" type="color" value="${isHex(s.hex) ? esc(s.hex) : (isHex(c.hex) ? esc(c.hex) : '#B9A58C')}"></label>` : ''}
            ${t.feedback ? `<label>Brand <select data-k="brandFeedback" class="st-fb ${esc(s.brandFeedback||'')}">${BRAND_FEEDBACK.map(f=>`<option value="${f.key}" ${(s.brandFeedback||'')===f.key?'selected':''}>${f.label}</option>`).join('')}</select></label>
              <input data-k="brandNote" value="${esc(s.brandNote)}" placeholder="Brand comment, e.g. needs to be darker" class="st-note">` : ''}
            <input data-k="notes" value="${esc(s.notes)}" placeholder="Notes" class="st-note">
            ${t.tests ? `<button class="linkish" data-st="more" data-id="${s.id}">Test data${filled ? ' ✓' : ''}</button>` : ''}
          </div>
          ${t.tests ? `<div class="st-line st-tests">${TEST_FIELDS.map(f=>`<label>${f.label}<input data-k="${f.k}" value="${esc(s[f.k])}"></label>`).join('')}</div>` : ''}
        </div>`; }).join('') : `<p class="dv-muted">No steps yet. Add the first one below.</p>`}</div>
      <div class="st-add">
        <span class="dv-muted">Add a step:</span>
        ${['color_match','trial','ship_in','testing','ship_brand','brand'].map(k=>`<button class="btn secondary" data-st="add" data-type="${k}">+ ${typeDef(k).label}</button>`).join('')}
      </div>
      <p class="dv-hint">A <b>Trial round</b> is one shade attempt and starts a new round; its quantity, due and receive-by dates show in the list's <b>Quantity &amp; dates</b> column, and can be changed in either place. Setting a <b>Brand review</b> to <b>Approved</b> makes the latest trial the final shade and moves the color to Stock Offerings. <b>Changes requested</b> sends it back to coating trial and adds the next trial round.</p>
      ${prod ? `<p class="dv-muted dv-prod-note">${prod} brand / production step${prod===1?'':'s'} (purchase order, production run) saved for a future Production tab.</p>` : ''}`;
  }
  function readSteps(){
    if(!stepEdit) return;
    document.querySelectorAll('#dvSteps .st-row').forEach(row=>{
      const s = stepEdit.steps.find(x=>x.id===row.dataset.id); if(!s) return;
      row.querySelectorAll('[data-k]').forEach(inp=>{
        let v = inp.value;
        v = String(v).trim();
        if(inp.dataset.k === 'qty') v = v === '' ? '' : String(Math.max(0, Number(v) || 0));
        s[inp.dataset.k] = v;
      });
    });
  }
  async function saveSteps(){
    readSteps();
    renumber(stepEdit);
    rdSteps(stepEdit).forEach(s=>{ if(s.status === 'Complete' && !s.doneAt) s.doneAt = iso(new Date()); if(s.status !== 'Complete') delete s.doneAt; });
    const c = stepEdit, before = byId(c.id);
    const prevFb = id => { const s = before && before.steps.find(x=>x.id===id); return s ? (s.brandFeedback||'') : ''; };
    const brands = rdSteps(c).filter(s=>s.type==='brand');
    const changed = brands.filter(s=>(s.brandFeedback||'') !== prevFb(s.id));
    const latestBrand = brands[brands.length-1];
    const trials = rdSteps(c).filter(s=>s.type==='trial');
    let note = '';
    // Brand feedback closes that review (or reopens it while it's with the brand).
    changed.forEach(s=>{ s.status = s.brandFeedback==='with_brand' ? 'In progress' : (s.brandFeedback ? 'Complete' : s.status); });
    const approved = changed.find(s=>s.brandFeedback==='approved');
    if(approved){
      const shade = trials.filter(t=>(Number(t.round)||0) <= (Number(approved.round)||99)).pop() || trials[trials.length-1];
      c.stage = 'final';
      if(shade){ c.finalStepId = shade.id; if(isHex(shade.hex)) c.hex = shade.hex; }
      note = `${c.name} approved: now Approved – final, and it moves to Stock Offerings.`;
    } else if(latestBrand && changed.includes(latestBrand) && latestBrand.brandFeedback === 'changes'){
      c.stage = 'coating_trial';
      const round = maxRound(c) + 1;
      addStepTo(c, blankStep('trial', {round, owner:c.partner||'', unit:'A4s', notes: latestBrand.brandNote ? `Brand asked: ${latestBrand.brandNote}` : 'Brand requested changes'}));
      renumber(c);
      note = `Brand requested changes: ${c.name} is back in coating trial, and trial round ${round} was added.`;
    } else if(latestBrand && changed.includes(latestBrand) && latestBrand.brandFeedback === 'with_brand'){
      c.stage = 'brand_review';
      note = `${c.name} is now with the brand for approval.`;
    }
    if(c.stage !== 'final') delete c.finalStepId;
    const btn = document.getElementById('dvStepsSave'); btn.disabled = true;
    try {
      await save(c);
      const i = colors.findIndex(x=>x.id===c.id); if(i >= 0) colors[i] = c;
      document.getElementById('dvSteps').classList.remove('open'); stepEdit = null;
      render(); repaintOthers();
      if(note) toast(note);
    } catch(e){ /* the storage layer shows a banner */ }
    finally { btn.disabled = false; }
  }

  // ---------- standard steps for a new color ----------
  function templateSteps(c, startDate){
    let d = pd(startDate);
    return TEMPLATE.map(t=>{
      const s = blankStep(t.type, {round:1, owner:ownerFor(t.type, c)});
      if(d){ s.start = iso(d); const e = addD(d, t.days-1); s.end = iso(e); d = addD(e, 1); }
      return s;
    });
  }

  // ---------- color details pop-up ----------
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
    el.addEventListener('click', e=>{ if(e.target === el) closeModal(); });
    el.addEventListener('input', e=>{
      if(e.target.id === 'dvHexPick') el.querySelector('#dvHex').value = e.target.value;
      if(e.target.id === 'dvHex' && isHex(e.target.value)) el.querySelector('#dvHexPick').value = e.target.value;
    });
  }
  function openModal(c, isNew){
    ensureModal();
    editingIsNew = isNew;
    editing = isNew
      ? {id:uid(), v:2, name:'', pantone:'', hex:'#B9A58C', forTags:[], material:'', bases:[], baseForm:'', finish:'', texture:'',
         partner:'Pearl', stage:'to_be_trialed', availability:'', photosUrl:'', notes:'', trials:[], steps:[],
         forecastSqft:'', forecastQuarter:'', order: Math.max(0, ...colors.map(x=>x.order||0)) + 1}
      : JSON.parse(JSON.stringify(c));
    document.getElementById('dvModalTitle').textContent = isNew ? 'New color in development' : 'Edit ' + (c.name || 'color');
    document.getElementById('dvDelete').style.display = isNew ? 'none' : '';
    fillModal();
    document.getElementById('dvModal').classList.add('open');
    document.getElementById('dvName').focus();
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
    document.getElementById('dvModalBody').innerHTML = `
      <datalist id="dvForList">${allForTags().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <datalist id="dvPartnerList">${allPartners().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <div class="form-grid">
        <div class="form-field"><label>Color name</label><input id="dvName" value="${esc(c.name)}" placeholder="e.g. SM Custom Grey"></div>
        <div class="form-field"><label>Pantone code</label><input id="dvPantone" value="${esc(c.pantone)}" placeholder="e.g. 19-1220 TCX"></div>
        <div class="form-field"><label>Swatch color</label><div class="hex-row">
          <input type="color" id="dvHexPick" value="${isHex(c.hex)?esc(c.hex):'#B9A58C'}"><input id="dvHex" value="${esc(c.hex)}"></div></div>
        <div class="form-field"><label>Project (brand or collection)</label>
          <input id="dvFor" list="dvForList" value="${esc(c.forTags.join(', '))}" placeholder="e.g. Reformation, Spring '27">
          <span class="dv-hint">Separate several with commas</span></div>
        <div class="form-field"><label>Material</label><select id="dvMaterial" ${LA('material','material')}>${LO('material', MATERIALS, c.material, 'Not set')}</select></div>
        <div class="form-field"><label>Finish</label><select id="dvFinish" ${LA('finish','finish')}>${LO('finish', FINISHES, c.finish, 'Not set')}</select></div>
        <div class="form-field full"><label>Base color</label><div class="dv-checks">
          ${baseNames.map(b=>`<label><input type="checkbox" class="dvBase" value="${esc(b)}" ${c.bases.includes(b)?'checked':''}> ${esc(b)}</label>`).join('')}
        </div></div>
        <div class="form-field"><label>Base used</label><select id="dvBaseForm" ${LA('baseForm','base type')}>${LO('baseForm', BASE_FORMS, c.baseForm, 'Not set')}</select></div>
        <div class="form-field"><label>Texture tested on</label><select id="dvTexture" ${LA('texture','texture')}>${LO('texture', DEV_TEXTURES, c.texture, 'Not set')}</select></div>
        <div class="form-field"><label>Partner (trial location)</label><input id="dvPartner" list="dvPartnerList" value="${esc(c.partner)}"></div>
        <div class="form-field"><label>Development stage</label><select id="dvStage">${STAGES.map(s=>`<option value="${s.key}" ${c.stage===s.key?'selected':''}>${esc(s.label)}</option>`).join('')}</select>
          <label class="dv-inline" style="margin-top:6px"><input type="checkbox" id="dvApproved" ${c.approvedStock?'checked':''}> Also approved for our stock (shows on Stock Offerings)</label></div>
        <div class="form-field"><label>Brand target date</label><input id="dvBrandTarget" type="date" value="${esc(c.brandTarget||'')}"><span class="dv-hint">Also in the Quantity &amp; dates column</span></div>
        <div class="form-field"></div>
        <div class="form-field"><label>Forecasted order (sq ft)</label><input id="dvFcSqft" type="number" min="0" step="10" value="${esc(c.forecastSqft||'')}"></div>
        <div class="form-field"><label>Forecasted order quarter</label><select id="dvFcQ"><option value="">Not set</option>${quarterOptions(c.forecastQuarter).map(q=>`<option ${c.forecastQuarter===q?'selected':''}>${q}</option>`).join('')}</select></div>
        <div class="form-field full"><label>Availability</label><select id="dvAvail" ${LA('availability','availability option')}>${LO('availability', AVAILABILITY, c.availability, 'Not set')}</select></div>
        <div class="form-field full"><label>Photos link (e.g. Dropbox)</label><input id="dvPhotos" value="${esc(c.photosUrl)}" placeholder="https://"></div>
        <div class="form-field full"><label>Notes</label><textarea id="dvNotes" rows="2">${esc(c.notes)}</textarea></div>
        ${editingIsNew ? `
        <div class="form-field full dv-newsteps">
          <label><input type="checkbox" id="dvAddSteps" checked> Add the first steps (send Pantone, color matching, ship samples to us, in-house testing)</label>
          <span>First step starts <input type="date" id="dvStepStart"> <span class="dv-hint">optional: fills in suggested dates from typical durations</span></span>
        </div>` : ''}
      </div>
      ${editingIsNew ? '' : `<p class="dv-hint">Steps, trial rounds, test results and brand feedback are in the <b>Progress</b> column.</p>`}`;
  }
  function readModal(){
    const v = id => (document.getElementById(id) || {}).value || '';
    const c = editing;
    c.name = v('dvName').trim(); c.pantone = v('dvPantone').trim(); c.hex = v('dvHex').trim();
    c.forTags = v('dvFor').split(',').map(s=>s.trim()).filter(Boolean);
    c.material = v('dvMaterial'); c.finish = v('dvFinish'); c.baseForm = v('dvBaseForm');
    c.bases = [...document.querySelectorAll('#dvModal .dvBase:checked')].map(x=>x.value);
    c.forecastSqft = v('dvFcSqft') === '' ? '' : String(Math.max(0, Math.round(Number(v('dvFcSqft'))) || 0)); c.forecastQuarter = v('dvFcQ');
    c.texture = v('dvTexture').trim(); c.partner = v('dvPartner').trim(); c.stage = v('dvStage'); c.brandTarget = v('dvBrandTarget'); c.approvedStock = !!(document.getElementById('dvApproved')||{}).checked;
    c.availability = v('dvAvail'); c.photosUrl = v('dvPhotos').trim(); c.notes = v('dvNotes');
  }
  async function saveModal(){
    readModal();
    const c = editing;
    if(!c.name) return alert('Give the color a name.');
    if(c.photosUrl && !/^https?:\/\//i.test(c.photosUrl)) c.photosUrl = 'https://' + c.photosUrl;
    if(editingIsNew && document.getElementById('dvAddSteps').checked) c.steps = templateSteps(c, document.getElementById('dvStepStart').value);
    if(c.stage !== 'final') delete c.finalStepId;
    const before = byId(c.id);
    if(editingIsNew || (before && (before.partner||'') !== (c.partner||'')) || (before && isOpen(c) && !isOpen(before))) c.rank = nextRank();
    const btn = document.getElementById('dvSave'); btn.disabled = true;
    try {
      await save(c);
      const i = colors.findIndex(x=>x.id===c.id);
      if(i >= 0) colors[i] = c; else colors.push(c);
      closeModal(); render(); repaintOthers();
    } catch(e){ /* the storage layer shows a banner */ }
    finally { btn.disabled = false; }
  }
  async function deleteFromModal(){
    const c = byId(editing.id);
    if(!c || !confirm(`Delete ${c.name}? You can restore it from More → Recently deleted.`)) return;
    c.deletedAt = new Date().toISOString();
    await save(c);
    selected.delete(c.id); closeModal(); render(); repaintOthers();
    toast(`${c.name} moved to Recently deleted.`);
  }

  // ---------- partner job pop-up ----------
  let jobEdit = null, jobIsNew = false;
  function openJobModal(c, isNew){
    let el = document.getElementById('dvJobModal');
    if(!el){
      el = document.createElement('div'); el.className = 'modal-overlay'; el.id = 'dvJobModal';
      el.innerHTML = `<div class="modal dv-modal"><h2 id="dvJobTitle"></h2><div id="dvJobBody"></div>
        <div class="modal-actions">
          <button class="btn danger" id="dvJobDelete" style="margin-right:auto">Delete job</button>
          <button class="btn secondary" id="dvJobCancel">Cancel</button>
          <button class="btn" id="dvJobSave">Save</button></div></div>`;
      document.body.appendChild(el);
      const close = ()=>{ el.classList.remove('open'); jobEdit = null; };
      el.querySelector('#dvJobCancel').addEventListener('click', close);
      el.addEventListener('click', e=>{ if(e.target === el) close(); });
      el.querySelector('#dvJobSave').addEventListener('click', saveJob);
      el.querySelector('#dvJobDelete').addEventListener('click', async ()=>{
        const j = byId(jobEdit.id);
        if(!j || !confirm(`Delete “${j.name}”? You can restore it from More → Recently deleted.`)) return;
        j.deletedAt = new Date().toISOString(); await save(j); close(); render(); toast(`${j.name} moved to Recently deleted.`);
      });
    }
    jobIsNew = isNew;
    jobEdit = isNew ? normalize({kind:'job', id:uid(), name:'', hex:'', jobType:'', partner: ui.groupBy==='partner' ? 'Pearl' : '', forTags:[],
        material:'', finish:'', texture:'', qty:'', unit:'A4s', dueDate:'', receiveDate:'', brandTarget:'', status:'Not started', notes:'',
        order: Math.max(0, ...colors.map(x=>x.order||0)) + 1})
      : JSON.parse(JSON.stringify(c));
    const j = jobEdit;
    el.querySelector('#dvJobTitle').textContent = isNew ? 'New partner job' : 'Edit ' + (j.name || 'job');
    el.querySelector('#dvJobDelete').style.display = isNew ? 'none' : '';
    el.querySelector('#dvJobBody').innerHTML = `
      <datalist id="dvJobForList">${allForTags().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <datalist id="dvJobPartnerList">${allPartners().map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
      <p class="dv-hint" style="margin-top:0">For partner work that isn’t a color in development, e.g. a gloss adjustment or a panel order. A new color goes under <b>+ New color</b>.</p>
      <div class="form-grid">
        <div class="form-field full"><label>What is the job?</label><input id="djName" value="${esc(j.name)}" placeholder="e.g. Chocolate Luxe panel, Higher gloss"></div>
        <div class="form-field"><label>Partner</label><input id="djPartner" list="dvJobPartnerList" value="${esc(j.partner)}"></div>
        <div class="form-field"><label>Project / brand</label><input id="djFor" list="dvJobForList" value="${esc(j.forTags.join(', '))}" placeholder="e.g. Dior"></div>
        <div class="form-field"><label>Job type</label><select id="djType" ${LA('job','job type')}>${LO('job', JOBS, j.jobType, 'Not set')}</select></div>
        <div class="form-field"><label>Status</label><select id="djStatus" ${LA('stepStatus','status')}>${LO('stepStatus', STEP_STATUSES, j.status, null)}</select></div>
        <div class="form-field"><label>Material</label><select id="djMaterial" ${LA('material','material')}>${LO('material', MATERIALS, j.material, 'Not set')}</select></div>
        <div class="form-field"><label>Finish</label><select id="djFinish" ${LA('finish','finish')}>${LO('finish', FINISHES, j.finish, 'Not set')}</select></div>
        <div class="form-field"><label>Texture</label><select id="djTexture" ${LA('texture','texture')}>${LO('texture', DEV_TEXTURES, j.texture, 'Not set')}</select></div>
        <div class="form-field"><label>Quantity</label><div class="hex-row"><input id="djQty" type="number" min="0" step="1" value="${esc(j.qty)}">
          <select id="djUnit" ${LA('unit','unit')}>${LO('unit', UNITS, j.unit || 'A4s', null)}</select></div></div>
        <div class="form-field"><label>Due</label><input id="djDue" type="date" value="${esc(j.dueDate)}"></div>
        <div class="form-field"><label>Receive by</label><input id="djReceive" type="date" value="${esc(j.receiveDate)}"></div>
        <div class="form-field"><label>Brand target date</label><input id="djTarget" type="date" value="${esc(j.brandTarget)}"></div>
        <div class="form-field full"><label>Notes</label><textarea id="djNotes" rows="2">${esc(j.notes)}</textarea></div>
      </div>`;
    el.classList.add('open');
    el.querySelector('#djName').focus();
  }
  async function saveJob(){
    const v = id => (document.getElementById(id) || {}).value || '';
    const j = jobEdit, before = byId(j.id);
    j.name = v('djName').trim(); j.partner = v('djPartner').trim(); j.forTags = v('djFor').split(',').map(x=>x.trim()).filter(Boolean);
    j.jobType = v('djType'); j.material = v('djMaterial'); j.finish = v('djFinish'); j.texture = v('djTexture');
    j.qty = v('djQty') === '' ? '' : String(Math.max(0, Number(v('djQty')) || 0)); j.unit = v('djUnit');
    j.dueDate = v('djDue'); j.receiveDate = v('djReceive'); j.brandTarget = v('djTarget'); j.notes = v('djNotes');
    const wasDone = before ? jobDone(before) : false;
    j.status = v('djStatus');
    if(!j.name) return alert('Say what the job is.');
    if(jobDone(j) && !wasDone) j.doneAt = iso(new Date());
    if(jobIsNew || (before && (before.partner||'') !== (j.partner||'')) || (wasDone && !jobDone(j))) j.rank = nextRank();
    const btn = document.getElementById('dvJobSave'); btn.disabled = true;
    try {
      await save(j);
      const i = colors.findIndex(x=>x.id===j.id);
      if(i >= 0) colors[i] = j; else colors.push(j);
      document.getElementById('dvJobModal').classList.remove('open'); jobEdit = null;
      if(jobIsNew && !ui.stages.has('job')){ ui.stages.add('job'); }
      render();
      if(jobIsNew) toast(`Added to the bottom of ${j.partner || 'the'} list. Use ↑ ↓ or drag ⠿ to move it up.`);
    } catch(e){ /* the storage layer shows a banner */ }
    finally { btn.disabled = false; }
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
        const c = byId(b.dataset.restore); delete c.deletedAt; await save(c); render(); repaintOthers(); openTrash();
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
    const data = {format:'uncaged-in-development', version:2, exportedAt:new Date().toISOString(), colors: live(), settings};
    download(`partner-projects-backup-${stamp()}.json`, JSON.stringify(data, null, 1), 'application/json');
  }
  function exportCsv(){
    const q = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
    const head = ['Color','Pantone','Project','Material','Base color','Texture','Finish','Forecast sq ft','Forecast quarter','Partner','Stage',
      'Phase','Round','Step','Details','Who','Start','Due','Days','Status','Result','Brand feedback','Brand comment', ...TEST_FIELDS.map(f=>f.label), 'Notes'];
    const rows = [head];
    liveColors().sort((a,b)=>a.order-b.order).forEach(c=>{
      const base = [c.name,c.pantone,c.forTags.join('; '),c.material,c.bases.join(' + '),c.texture||'',c.finish,c.forecastSqft||'',c.forecastQuarter||'',c.partner,stageLabel(c)];
      if(!c.steps.length) rows.push(base);
      c.steps.forEach(s=>rows.push([...base, phaseOf(s)==='rd'?'Development':'Brand / production', s.round||'', stepLabel(s), s.activity, s.owner, s.start, s.end, days(s), s.status,
        typeDef(s.type).result ? (RESULTS.find(r=>r.key===(s.result||''))||{}).label : '', s.type==='brand' ? feedbackLabel(s.brandFeedback) : '', s.brandNote||'',
        ...TEST_FIELDS.map(f=>s[f.k]||''), s.notes]));
    });
    download(`partner-projects-steps-${stamp()}.csv`, '﻿' + rows.map(r=>r.map(q).join(',')).join('\r\n'), 'text/csv');
  }
  function pickImport(){
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.txt,application/json,text/plain';
    inp.addEventListener('change', async ()=>{
      const file = inp.files[0]; if(!file) return;
      let data;
      try { data = JSON.parse(await file.text()); } catch(e){ return alert('That file isn’t a valid backup (couldn’t read it as JSON).'); }
      if(!data || data.format !== 'uncaged-in-development' || !Array.isArray(data.colors))
        return alert('That file isn’t a Partner Projects backup.');
      const incoming = data.colors.map(normalize);
      const replacing = incoming.filter(c=>byId(c.id)).length;
      if(!confirm(`Import ${incoming.length} colors and jobs?` + (replacing ? `\n\n${replacing} already exist here and will be replaced with the version in the file.` : ''))) return;
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
      render(); repaintOthers(); toast(`Imported ${incoming.length} colors and jobs.`);
    });
    inp.click();
  }

  // ---------- setup ----------
  function setup(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    setupDrag(root);
    // Read-only view of the colors for Stock Offerings (stock.js). Partner jobs are left out.
    window.devData = {
      colors: () => liveColors(),
      byId: id => { const c = byId(id); return c && !c.deletedAt && !isJob(c) ? c : null; },
      bases: () => settings.baseColors.slice(),
      stage: k => stageDef(k),
      finalShade: c => finalShade(c),
      trialCount: c => trialCount(c),
      stepType: c => (currentStep(c) || {}).type || '',
      isApproved: c => isApproved(c),
      loaded: () => loaded,
    };
    window.renderDev = render;
    render();
    load().then(()=>{ render(); repaintOthers(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
