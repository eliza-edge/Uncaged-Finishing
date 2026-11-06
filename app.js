const STORAGE_KEY = 'colors';
const STAGE_DEFS = [
  {key:'labdip1', label:'Lab Dip 1', color:'#E4C989'},
  {key:'labdip2', label:'Lab Dip 2', color:'#C99A3E'},
  {key:'approved', label:'Approved Standard', color:'#6E8F6E'},
  {key:'pilot', label:'Pilot Run', color:'#8B5A34'},
  {key:'colorcard', label:'Color Card', color:'#4A453F'},
];
const GROUP_ORDER = ['Signature Stone','Luxe Off-White','Luxe Natural','Luxe Metallic'];

function d(dateStr){ return dateStr; } // passthrough helper for readability in seed data

function defaultColors(){
  return [
    // Signature - Stone
    mk('5793 C','Moss Sage','#A9AD84','Signature Stone','development',
      ['2026-08-17','2026-08-24'],['2026-08-25','2026-09-05'],['2026-09-06','2026-09-12'],['2026-09-13','2026-09-27'],['2026-09-28','2026-10-10']),
    mk('7536 C','Warm Taupe','#A69C82','Signature Stone','development',
      ['2026-08-17','2026-08-24'],['2026-08-26','2026-09-06'],['2026-09-08','2026-09-14'],['2026-09-15','2026-09-29'],['2026-09-30','2026-10-12']),
    mk('5575 C','Eucalyptus','#8FAD94','Signature Stone','development',
      ['2026-08-18','2026-08-25'],['2026-08-27','2026-09-07'],['2026-09-09','2026-09-15'],['2026-09-16','2026-09-30'],['2026-10-01','2026-10-13']),
    mk('651 C','Powder Blue','#A8C0DC','Signature Stone','development',
      ['2026-08-19','2026-08-26'],['2026-08-28','2026-09-08'],['2026-09-10','2026-09-16'],['2026-09-17','2026-10-01'],['2026-10-02','2026-10-14']),
    mk('4092 C','Dusty Rose','#C9A8B4','Signature Stone','approved',
      ['2026-07-20','2026-07-27'],['2026-07-28','2026-08-08'],['2026-08-09','2026-08-14'],['2026-08-15','2026-08-29'],['2026-08-30','2026-09-10']),
    mk('4081 C','Mauve Plum','#A67D97','Signature Stone','development',
      ['2026-08-20','2026-08-27'],['2026-08-29','2026-09-09'],['2026-09-11','2026-09-17'],['2026-09-18','2026-10-02'],['2026-10-03','2026-10-15']),
    mk('665 C','Lilac Grey','#C7BFD1','Signature Stone','onhold',
      ['2026-09-01','2026-09-08'],['2026-09-09','2026-09-20'],['2026-09-21','2026-09-27'],['2026-09-28','2026-10-12'],['2026-10-13','2026-10-25']),
    mk('535 C','Slate Blue','#8DA0BC','Signature Stone','development',
      ['2026-08-21','2026-08-28'],['2026-08-29','2026-09-09'],['2026-09-11','2026-09-17'],['2026-09-18','2026-10-02'],['2026-10-03','2026-10-15']),

    // Luxe - Off-White
    mk('7401 C','Champagne','#F5E1A4','Luxe Off-White','approved',
      ['2026-07-15','2026-07-22'],['2026-07-23','2026-08-02'],['2026-08-03','2026-08-08'],['2026-08-09','2026-08-23'],['2026-08-24','2026-09-04']),
    mk('7485 C','Sage Mist','#D0DEBB','Luxe Off-White','development',
      ['2026-08-17','2026-08-24'],['2026-08-25','2026-09-05'],['2026-09-06','2026-09-12'],['2026-09-13','2026-09-27'],['2026-09-28','2026-10-10']),
    mk('543 C','Sky Blue','#A4C8E1','Luxe Off-White','development',
      ['2026-08-18','2026-08-25'],['2026-08-26','2026-09-06'],['2026-09-08','2026-09-14'],['2026-09-15','2026-09-29'],['2026-09-30','2026-10-12']),
    mk('503 C','Blush','#E9C5C7','Luxe Off-White','development',
      ['2026-08-19','2026-08-26'],['2026-08-27','2026-09-07'],['2026-09-09','2026-09-15'],['2026-09-16','2026-09-30'],['2026-10-01','2026-10-13']),
    mk('263 C','Lilac','#D7C6E6','Luxe Off-White','onhold',
      ['2026-09-02','2026-09-09'],['2026-09-10','2026-09-21'],['2026-09-22','2026-09-28'],['2026-09-29','2026-10-13'],['2026-10-14','2026-10-26']),
    mk('1895 C','Petal Pink','#F5B6CD','Luxe Off-White','development',
      ['2026-08-20','2026-08-27'],['2026-08-28','2026-09-08'],['2026-09-10','2026-09-16'],['2026-09-17','2026-10-01'],['2026-10-02','2026-10-14']),
    mk('11-4201 TCX','Cloud Dancer','#EDEBE3','Luxe Off-White','approved',
      ['2026-07-10','2026-07-17'],['2026-07-18','2026-07-28'],['2026-07-29','2026-08-03'],['2026-08-04','2026-08-18'],['2026-08-19','2026-08-30']),

    // Luxe - Natural
    mk('6030 C','Rose Sand','#C69F90','Luxe Natural','development',
      ['2026-08-24','2026-08-31'],['2026-09-01','2026-09-12'],['2026-09-13','2026-09-19'],['2026-09-20','2026-10-04'],['2026-10-05','2026-10-17']),
    mk('4655 C','Camel','#BF9474','Luxe Natural','approved',
      ['2026-07-22','2026-07-29'],['2026-07-30','2026-08-09'],['2026-08-10','2026-08-15'],['2026-08-16','2026-08-30'],['2026-08-31','2026-09-11']),
    mk('2317 C','Toffee','#B4875E','Luxe Natural','development',
      ['2026-08-25','2026-09-01'],['2026-09-02','2026-09-13'],['2026-09-14','2026-09-20'],['2026-09-21','2026-10-05'],['2026-10-06','2026-10-18']),
    mk('729 C','Amber Tan','#B58150','Luxe Natural','development',
      ['2026-08-26','2026-09-02'],['2026-09-03','2026-09-14'],['2026-09-15','2026-09-21'],['2026-09-22','2026-10-06'],['2026-10-07','2026-10-19']),

    // Luxe - Metallic
    mk('20-0033 TPM','Glamour Gold','#E8D4A0','Luxe Metallic','development',
      ['2026-09-01','2026-09-08'],['2026-09-09','2026-09-20'],['2026-09-21','2026-09-27'],['2026-09-28','2026-10-12'],['2026-10-13','2026-10-25'],true),
    mk('20-0038 TPM','Glitteratti','#D9BE72','Luxe Metallic','development',
      ['2026-09-02','2026-09-09'],['2026-09-10','2026-09-21'],['2026-09-22','2026-09-28'],['2026-09-29','2026-10-13'],['2026-10-14','2026-10-26'],true),
    mk('20-0006 TPM','Liquid Luster','#C4C6C8','Luxe Metallic','onhold',
      ['2026-09-05','2026-09-12'],['2026-09-13','2026-09-24'],['2026-09-25','2026-10-01'],['2026-10-02','2026-10-16'],['2026-10-17','2026-10-29'],true),
    mk('20-0013 TPM','Gadget Gray','#55575A','Luxe Metallic','development',
      ['2026-09-03','2026-09-10'],['2026-09-11','2026-09-22'],['2026-09-23','2026-09-29'],['2026-09-30','2026-10-14'],['2026-10-15','2026-10-27'],true),
  ];
}

function mk(code,name,hex,group,status,s1,s2,s3,s4,s5,metallic){
  return {
    id: code.replace(/\s+/g,'_')+'_'+Math.random().toString(36).slice(2,7),
    code, name, hex, group, status, metallic: !!metallic,
    stages: {
      labdip1: {start:s1[0], end:s1[1]},
      labdip2: {start:s2[0], end:s2[1]},
      approved: {start:s3[0], end:s3[1]},
      pilot: {start:s4[0], end:s4[1]},
      colorcard: {start:s5[0], end:s5[1]},
    }
  };
}

let colors = [];
let collapsedGroups = new Set();
let activeFilter = 'all';
let editingId = null;
let bulkMode = false;
let selectedIds = new Set();
let currentView = 'swatch';
const NOW = new Date();
let calendarMonth = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
let extraGroups = [];
let groupOrder = [];
let draggedId = null;
let draggedGroupName = null;

function toISO(dt){ return dt.toISOString().slice(0,10); }

async function loadExtraGroups(){
  try{
    const res = await window.storage.get('extraGroups', false);
    if(res && res.value){
      extraGroups = JSON.parse(res.value);
      return;
    }
  }catch(e){ /* not found */ }
  extraGroups = ['Base Colors','SS27'];
  await saveExtraGroups();
}

async function saveExtraGroups(){
  try{
    await window.storage.set('extraGroups', JSON.stringify(extraGroups), false);
  }catch(e){ console.error('Storage error', e); }
}

let textures = [];

async function loadTextures(){
  try{
    const res = await window.storage.get('textures', false);
    if(res && res.value){
      textures = JSON.parse(res.value);
      return;
    }
  }catch(e){ /* not found */ }
  textures = [];
}

async function saveTextures(){
  try{
    await window.storage.set('textures', JSON.stringify(textures), false);
  }catch(e){ console.error('Storage error', e); }
}

function mkTexture(name, family, source, client, color){
  return {
    id: name.replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7),
    name, family, source, client, color
  };
}

function seededRandom(seed){
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clipPolygonByBisector(polygon, seed, other){
  const mx = (seed[0] + other[0]) / 2, my = (seed[1] + other[1]) / 2;
  const dx = other[0] - seed[0], dy = other[1] - seed[1];
  const result = [];
  for(let i = 0; i < polygon.length; i++){
    const curr = polygon[i], prev = polygon[(i - 1 + polygon.length) % polygon.length];
    const currSide = (curr[0] - mx) * dx + (curr[1] - my) * dy;
    const prevSide = (prev[0] - mx) * dx + (prev[1] - my) * dy;
    const currIn = currSide <= 0, prevIn = prevSide <= 0;
    if(currIn !== prevIn){
      const t = prevSide / (prevSide - currSide);
      result.push([prev[0] + t * (curr[0] - prev[0]), prev[1] + t * (curr[1] - prev[1])]);
    }
    if(currIn) result.push(curr);
  }
  return result;
}

function voronoiCell(seed, allPoints, bounds){
  let poly = [[bounds[0],bounds[1]],[bounds[2],bounds[1]],[bounds[2],bounds[3]],[bounds[0],bounds[3]]];
  for(const p of allPoints){
    if(p === seed) continue;
    poly = clipPolygonByBisector(poly, seed, p);
    if(poly.length === 0) break;
  }
  return poly;
}

function buildTortoiseshellPattern(){
  const el = document.getElementById('tex-croc-wild');
  if(!el) return;
  const TW = 100, TH = 78, cols = 4, rows = 3;
  const cellW = TW / cols, cellH = TH / rows;
  const basePoints = [];
  let si = 0;
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const jx = (seededRandom(si * 7.13 + 1.7) - 0.5) * cellW * 0.75;
      const jy = (seededRandom(si * 3.91 + 4.2) - 0.5) * cellH * 0.75;
      basePoints.push([c * cellW + cellW / 2 + jx, r * cellH + cellH / 2 + jy]);
      si++;
    }
  }
  const allPoints = [];
  for(let dx = -1; dx <= 1; dx++){
    for(let dy = -1; dy <= 1; dy++){
      for(const p of basePoints){
        allPoints.push([p[0] + dx * TW, p[1] + dy * TH]);
      }
    }
  }
  const bounds = [-TW, -TH, 2 * TW, 2 * TH];

  let svg = '';
  basePoints.forEach((seed, i)=>{
    const cell = voronoiCell(seed, allPoints, bounds);
    if(cell.length < 3) return;
    const pts = cell.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const fillOp = 0.08 + seededRandom(i * 5.37 + 2.1) * 0.22;
    const strokeOp = 0.38 + seededRandom(i * 9.11 + 6.6) * 0.12;
    const strokeW = 1.3 + seededRandom(i * 2.63 + 3.3) * 0.6;
    svg += `<polygon points="${pts}" fill="white" opacity="${fillOp.toFixed(2)}"/>`;
    svg += `<polygon points="${pts}" fill="none" stroke="black" stroke-width="${strokeW.toFixed(2)}" opacity="${strokeOp.toFixed(2)}"/>`;

    for(let e = 0; e < cell.length; e++){
      const a = cell[e], b = cell[(e + 1) % cell.length];
      if(seededRandom(i * 13.7 + e * 4.2) > 0.45) continue;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const len = Math.hypot(ex, ey) || 1;
      const px = -ey / len, py = ex / len;
      const tlen = 1.6 + seededRandom(i * 17.3 + e * 6.1) * 1.4;
      svg += `<line x1="${(mx - px*tlen).toFixed(1)}" y1="${(my - py*tlen).toFixed(1)}" x2="${(mx + px*tlen).toFixed(1)}" y2="${(my + py*tlen).toFixed(1)}" stroke="black" stroke-width="0.5" opacity="0.28"/>`;
    }

    if(seededRandom(i * 21.4 + 8.8) > 0.7){
      const cx = cell.reduce((s,p)=>s+p[0],0)/cell.length;
      const cy = cell.reduce((s,p)=>s+p[1],0)/cell.length;
      svg += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="5" ry="3" opacity="0.4" fill="white" transform="rotate(${(seededRandom(i)*180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    }
  });
  el.innerHTML = svg;
}

function buildEvergladePattern(){
  const el = document.getElementById('tex-croc');
  if(!el) return;
  const TW = 64, TH = 50, cols = 4, rows = 3;

  const colW = TW / cols, rowH = TH / rows;
  const xs = [0], ys = [0];
  for(let i=1;i<cols;i++) xs.push(i*colW + (seededRandom(i*11.3+2.4)-0.5)*colW*0.35);
  xs.push(TW);
  for(let j=1;j<rows;j++) ys.push(j*rowH + (seededRandom(j*8.9+5.1)-0.5)*rowH*0.3);
  ys.push(TH);

  const hOffset = {}, vOffset = {};
  for(let i=0;i<cols;i++){
    for(let j=1;j<rows;j++){
      hOffset[`${i}_${j}`] = (seededRandom(i*4.7+j*13.1+1)-0.5)*rowH*0.5;
    }
  }
  for(let i=1;i<cols;i++){
    for(let j=0;j<rows;j++){
      vOffset[`${i}_${j}`] = (seededRandom(i*9.3+j*6.7+2)-0.5)*colW*0.5;
    }
  }

  let svg = '';
  let ci = 0;
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      const x0=xs[i], x1=xs[i+1], y0=ys[j], y1=ys[j+1];
      const midX=(x0+x1)/2, midY=(y0+y1)/2;
      const topCtl = j===0 ? null : y0 + hOffset[`${i}_${j}`];
      const rightCtl = (i+1===cols) ? null : x1 + vOffset[`${i+1}_${j}`];
      const botCtl = (j+1===rows) ? null : y1 + hOffset[`${i}_${j+1}`];
      const leftCtl = i===0 ? null : x0 + vOffset[`${i}_${j}`];

      let d = `M${x0.toFixed(1)},${y0.toFixed(1)} `;
      d += topCtl===null ? `L${x1.toFixed(1)},${y0.toFixed(1)} ` : `Q${midX.toFixed(1)},${topCtl.toFixed(1)} ${x1.toFixed(1)},${y0.toFixed(1)} `;
      d += rightCtl===null ? `L${x1.toFixed(1)},${y1.toFixed(1)} ` : `Q${rightCtl.toFixed(1)},${midY.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} `;
      d += botCtl===null ? `L${x0.toFixed(1)},${y1.toFixed(1)} ` : `Q${midX.toFixed(1)},${botCtl.toFixed(1)} ${x0.toFixed(1)},${y1.toFixed(1)} `;
      d += leftCtl===null ? `L${x0.toFixed(1)},${y0.toFixed(1)} ` : `Q${leftCtl.toFixed(1)},${midY.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} `;
      d += 'Z';

      const fillOp = 0.03 + seededRandom(ci*6.6+1.1)*0.05;
      svg += `<path d="${d}" fill="black" opacity="${fillOp.toFixed(2)}"/>`;
      svg += `<path d="${d}" fill="white" opacity="${(fillOp*0.7).toFixed(2)}"/>`;

      const wx1 = x0 + (x1-x0)*0.3, wy1 = y0 + (y1-y0)*0.25;
      const wx2 = x0 + (x1-x0)*0.55, wy2 = y0 + (y1-y0)*0.7;
      svg += `<path d="M${wx1.toFixed(1)},${wy1.toFixed(1)} Q${midX.toFixed(1)},${midY.toFixed(1)} ${wx2.toFixed(1)},${wy2.toFixed(1)}" fill="none" stroke="black" stroke-width="0.5" opacity="0.14"/>`;

      svg += `<path d="${d}" fill="none" stroke="white" stroke-width="${(1.1+seededRandom(ci*3.3)*0.4).toFixed(2)}" opacity="0.4"/>`;
      svg += `<path d="${d}" fill="none" stroke="black" stroke-width="0.55" opacity="0.2"/>`;
      ci++;
    }
  }
  el.innerHTML = svg;
}

async function ensureTextures(){
  const wasEmpty = textures.length === 0;

  if(!wasEmpty){
    const canaletto = textures.find(t=>t.name==='Canaletto');
    if(canaletto && canaletto.family !== 'brushed'){
      canaletto.family = 'brushed';
      await saveTextures();
    }
    const liquid = textures.find(t=>t.name==='Liquid');
    if(liquid && liquid.family !== 'gloss'){
      liquid.family = 'gloss';
      await saveTextures();
    }
    const laguna = textures.find(t=>t.name==='Laguna');
    if(laguna && laguna.family !== 'crocwild'){
      laguna.family = 'crocwild';
      await saveTextures();
    }
    const newOnes = [
      ['Marbled','marble','#A8A296'],
      ['Floral','floral','#C9A0A0'],
      ['Lace','lace','#EDE6D6'],
      ['Ultra High Gloss','ultragloss','#121212'],
    ];
    let addedNew = false;
    newOnes.forEach(([name, family, color])=>{
      if(!textures.some(t=>t.name===name)){
        textures.push(mkTexture(name, family, 'New texture — no reference yet', '', color));
        addedNew = true;
      }
    });
    if(addedNew) await saveTextures();
  }

  if(!wasEmpty) return;
  textures = [
    mkTexture('Liquid','gloss','In office · 5 ft × 10 ft','','#1A1A1A'),
    mkTexture('Laguna','crocwild','In office · 5 ft × 10 ft','','#0D3B24'),
    mkTexture('Amazon','scale','In office · 5 ft × 10 ft','','#3A3A3D'),
    mkTexture('Everglade','croc','In office · 5 ft × 10 ft','','#8A5A2E'),
    mkTexture('Canaletto','brushed','In office · 5 ft × 6 ft','','#A97D4F'),
    mkTexture('Spiro','lattice','In office · 5 ft × 6 ft','','#9C3B35'),
    mkTexture('Emerald','liquid','Requested from Supplier A · 5 ft × 6 ft','Client B','#2B2B2B'),
    mkTexture('Marbled','marble','New texture — no reference yet','','#A8A296'),
    mkTexture('Floral','floral','New texture — no reference yet','','#C9A0A0'),
    mkTexture('Lace','lace','New texture — no reference yet','','#EDE6D6'),
    mkTexture('Ultra High Gloss','ultragloss','New texture — no reference yet','','#121212'),
  ];
  await saveTextures();
}

const TILED_FAMILIES = new Set(['croc','scale','lattice','floral']);
const FILTER_FAMILIES = new Set(['liquid','brushed','marble']);

function textureOverlaySVG(family){
  if(family === 'ultragloss'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none" style="mix-blend-mode:normal;">
      <rect width="210" height="160" fill="url(#tex-gloss-lines)" style="mix-blend-mode:overlay;opacity:0.12"/>
      <rect width="210" height="160" fill="url(#tex-ultragloss-sheen2)" style="mix-blend-mode:screen;opacity:0.9"/>
      <rect width="210" height="160" fill="url(#tex-ultragloss-sheen)" style="mix-blend-mode:screen;opacity:1"/>
    </svg>`;
  }
  if(family === 'gloss'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none" style="mix-blend-mode:normal;">
      <rect width="210" height="160" fill="url(#tex-gloss-lines)" style="mix-blend-mode:overlay;opacity:0.3"/>
      <rect width="210" height="160" fill="url(#tex-gloss-stipple)" style="mix-blend-mode:screen;opacity:0.85"/>
      <rect width="210" height="160" fill="url(#tex-gloss-sheen)" style="mix-blend-mode:screen;opacity:0.7"/>
    </svg>`;
  }
  if(family === 'crocwild'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none" style="mix-blend-mode:normal;">
      <rect width="210" height="160" fill="url(#tex-croc-wild)" style="mix-blend-mode:overlay;opacity:1"/>
      <rect width="210" height="160" fill="url(#tex-gloss-sheen)" style="mix-blend-mode:screen;opacity:0.95"/>
    </svg>`;
  }
  if(family === 'scale'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none">
      <rect width="210" height="160" fill="url(#tex-scale-big)" mask="url(#tex-amazon-left-mask)"/>
      <rect width="210" height="160" fill="url(#tex-scale-small)" mask="url(#tex-amazon-right-mask)"/>
    </svg>`;
  }
  if(family === 'lattice'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none">
      <rect width="210" height="160" fill="url(#tex-lattice-a)"/>
      <rect width="210" height="160" fill="url(#tex-lattice-b)"/>
    </svg>`;
  }
  if(family === 'croc'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none" style="mix-blend-mode:normal;">
      <rect width="210" height="160" fill="url(#tex-croc)" style="mix-blend-mode:overlay;opacity:0.95"/>
      <rect width="210" height="160" fill="url(#tex-gloss-sheen)" style="mix-blend-mode:screen;opacity:0.3"/>
    </svg>`;
  }
  if(family === 'lace'){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none" style="mix-blend-mode:screen;">
      <rect width="210" height="160" fill="url(#tex-lace)"/>
    </svg>`;
  }
  if(TILED_FAMILIES.has(family)){
    return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none">
      <rect width="210" height="160" fill="url(#tex-${family})"/>
    </svg>`;
  }
  const filterFamily = FILTER_FAMILIES.has(family) ? family : 'liquid';
  return `<svg class="texture-overlay-svg" viewBox="0 0 210 160" preserveAspectRatio="none">
    <rect width="210" height="160" fill="white" filter="url(#tex-${filterFamily}-filter)"/>
  </svg>`;
}

function renderTextures(){
  const groupColorOptions = [...new Map(colors.map(c=>[c.name, c.hex])).entries()].sort((a,b)=>a[0].localeCompare(b[0]));

  document.getElementById('textureGrid').innerHTML = textures.map(t=>{
    const optionsHtml = groupColorOptions.map(([name,hex])=>`<option value="${hex}">${name}</option>`).join('');
    return `
      <div class="texture-card">
        <div class="texture-preview" style="background-color:${t.color};">${textureOverlaySVG(t.family)}</div>
        <div class="texture-body">
          <div class="texture-name">${t.name}</div>
          <div class="texture-source">${t.source}</div>
          ${t.client ? `<span class="texture-client">${t.client}</span>` : ''}
          <div class="texture-controls">
            <input type="color" value="${t.color}" data-texturecolor="${t.id}">
            <select data-textureselect="${t.id}">
              <option value="">Preview in...</option>
              ${optionsHtml}
            </select>
          </div>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('[data-texturecolor]').forEach(el=>{
    el.addEventListener('input', async (e)=>{
      const t = textures.find(x=>x.id===el.dataset.texturecolor);
      if(!t) return;
      t.color = e.target.value;
      await saveTextures();
      renderTextures();
    });
  });
  document.querySelectorAll('[data-textureselect]').forEach(el=>{
    el.addEventListener('change', async (e)=>{
      if(!e.target.value) return;
      const t = textures.find(x=>x.id===el.dataset.textureselect);
      if(!t) return;
      t.color = e.target.value;
      await saveTextures();
      renderTextures();
    });
  });
}

// ---------- Client A Event view ----------
let eventTextures = [];

async function loadEventTextures(){
  try{
    const res = await window.storage.get('eventTextures', false);
    if(res && res.value){
      eventTextures = JSON.parse(res.value);
      return;
    }
  }catch(e){ /* not found */ }
  eventTextures = [];
}

async function saveEventTextures(){
  try{
    await window.storage.set('eventTextures', JSON.stringify(eventTextures), false);
  }catch(e){ console.error('Storage error', e); }
}

async function ensureEventTextures(){
  if(eventTextures.length === 0){
    eventTextures = textures.map(t=>({
      id: t.name.replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7),
      name: t.name, family: t.family, source: t.source, client: t.client, color: t.color
    }));
    await saveEventTextures();
    return;
  }
  const newlyAddedBaseTextures = ['Ultra High Gloss'];
  let added = false;
  newlyAddedBaseTextures.forEach(name=>{
    if(!eventTextures.some(t=>t.name===name)){
      const src = textures.find(t=>t.name===name);
      if(src){
        eventTextures.push({
          id: name.replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7),
          name: src.name, family: src.family, source: src.source, client: src.client, color: src.color
        });
        added = true;
      }
    }
  });
  if(added) await saveEventTextures();
}

async function duplicateEventTexture(id){
  const idx = eventTextures.findIndex(t=>t.id===id);
  if(idx === -1) return;
  const orig = eventTextures[idx];
  const baseName = orig.name.replace(/ #\d+$/,'');
  const count = eventTextures.filter(t=>t.name.replace(/ #\d+$/,'')===baseName).length;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = baseName.replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7);
  copy.name = `${baseName} #${count + 1}`;
  eventTextures.splice(idx + 1, 0, copy);
  await saveEventTextures();
  renderEventView();
}

async function deleteEventTexture(id){
  eventTextures = eventTextures.filter(t=>t.id!==id);
  await saveEventTextures();
  renderEventView();
}

function renderEventView(){
  const groupColorOptions = [...new Map(colors.map(c=>[c.name, c.hex])).entries()].sort((a,b)=>a[0].localeCompare(b[0]));

  document.getElementById('eventGrid').innerHTML = eventTextures.map(t=>{
    const optionsHtml = groupColorOptions.map(([name,hex])=>`<option value="${hex}">${name}</option>`).join('');
    return `
      <div class="texture-card">
        <button class="card-dup-chip" data-eventdup="${t.id}" title="Duplicate this texture">+</button>
        <button class="event-del-chip" data-eventdel="${t.id}" title="Remove">✕</button>
        <div class="texture-preview" style="background-color:${t.color};">${textureOverlaySVG(t.family)}</div>
        <div class="texture-body">
          <div class="texture-name">${t.name}</div>
          <div class="texture-source">${t.source}</div>
          ${t.client ? `<span class="texture-client">${t.client}</span>` : ''}
          <div class="texture-controls">
            <input type="color" value="${t.color}" data-eventcolor="${t.id}">
            <select data-eventselect="${t.id}">
              <option value="">Preview in...</option>
              ${optionsHtml}
            </select>
          </div>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('[data-eventdup]').forEach(el=>{
    el.addEventListener('click', ()=>duplicateEventTexture(el.dataset.eventdup));
  });
  document.querySelectorAll('[data-eventdel]').forEach(el=>{
    el.addEventListener('click', ()=>deleteEventTexture(el.dataset.eventdel));
  });
  document.querySelectorAll('[data-eventcolor]').forEach(el=>{
    el.addEventListener('input', async (e)=>{
      const t = eventTextures.find(x=>x.id===el.dataset.eventcolor);
      if(!t) return;
      t.color = e.target.value;
      await saveEventTextures();
      renderEventView();
    });
  });
  document.querySelectorAll('[data-eventselect]').forEach(el=>{
    el.addEventListener('change', async (e)=>{
      if(!e.target.value) return;
      const t = eventTextures.find(x=>x.id===el.dataset.eventselect);
      if(!t) return;
      t.color = e.target.value;
      await saveEventTextures();
      renderEventView();
    });
  });
}

async function loadGroupOrder(){
  try{
    const res = await window.storage.get('groupOrder', false);
    if(res && res.value){
      groupOrder = JSON.parse(res.value);
      return;
    }
  }catch(e){ /* not found */ }
  groupOrder = [];
}

async function saveGroupOrder(){
  try{
    await window.storage.set('groupOrder', JSON.stringify(groupOrder), false);
  }catch(e){ console.error('Storage error', e); }
}

function computeGroupNames(colorList, includeEmptyExtra){
  const groups = {};
  colorList.forEach(c=>{
    if(!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });
  if(includeEmptyExtra){
    extraGroups.forEach(g=>{ if(!groups[g]) groups[g] = []; });
  }
  const allNames = new Set(Object.keys(groups));
  const naturalOrder = [
    ...GROUP_ORDER.filter(g=>allNames.has(g)),
    ...extraGroups.filter(g=>!GROUP_ORDER.includes(g) && allNames.has(g)),
    ...[...allNames].filter(g=>!GROUP_ORDER.includes(g) && !extraGroups.includes(g))
  ];
  let ordered = groupOrder.filter(g=>allNames.has(g));
  const missing = naturalOrder.filter(g=>!ordered.includes(g));
  if(missing.length){
    ordered = [...ordered, ...missing];
    missing.forEach(g=>{ if(!groupOrder.includes(g)) groupOrder.push(g); });
    saveGroupOrder();
  }
  return {ordered, groups};
}

async function loadColors(){
  try{
    const res = await window.storage.get(STORAGE_KEY, false);
    if(res && res.value){
      colors = JSON.parse(res.value);
      return;
    }
  }catch(e){ /* not found */ }
  colors = defaultColors();
  await saveColors();
}

async function saveColors(){
  try{
    await window.storage.set(STORAGE_KEY, JSON.stringify(colors), false);
  }catch(e){ console.error('Storage error', e); }
}

function parseDate(s){ return new Date(s+'T00:00:00'); }
function fmtShort(dt){ return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtMonthYear(dt){ return dt.toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
function daysBetween(a,b){ return Math.round((b-a)/86400000); }
function addDays(dt,n){ const c = new Date(dt); c.setDate(c.getDate()+n); return c; }

const PX_PER_DAY = 15;

function computeRange(){
  let allDates = [];
  colors.forEach(c=>{
    Object.values(c.stages).forEach(s=>{
      allDates.push(parseDate(s.start));
      allDates.push(parseDate(s.end));
    });
  });
  if(allDates.length === 0){
    allDates = [new Date('2026-08-01'), new Date('2026-12-01')];
  }
  let min = new Date(Math.min(...allDates));
  let max = new Date(Math.max(...allDates));
  min = addDays(min, -6);
  max = addDays(max, 8);
  return {start:min, end:max};
}

function renderSummary(){
  const total = colors.length;

  const today = NOW;
  let nextDeadline = null;
  colors.forEach(c=>{
    Object.entries(c.stages).forEach(([key,s])=>{
      const end = parseDate(s.end);
      if(end >= today && (!nextDeadline || end < nextDeadline.date)){
        nextDeadline = {date:end, color:c, stageKey:key};
      }
    });
  });

  const cards = [
    {num:total, lbl:'Colors tracked'},
  ];

  let html = cards.map(c=>`
    <div class="summary-card">
      <div class="num">${c.num}</div>
      <div class="lbl">${c.lbl}</div>
    </div>
  `).join('');

  if(nextDeadline){
    const stageLabel = STAGE_DEFS.find(s=>s.key===nextDeadline.stageKey).label;
    html += `
    <div class="summary-card deadline">
      <div class="num">${fmtShort(nextDeadline.date)}</div>
      <div class="lbl">Next: ${nextDeadline.color.name} — ${stageLabel}</div>
    </div>`;
  }

  document.getElementById('summaryRow').innerHTML = html;
}

function renderFilters(){
  const filters = [
    {key:'all', label:'All'},
    ...STAGE_DEFS.map(s=>({key:s.key, label:s.label})),
  ];
  document.getElementById('filterChips').innerHTML = filters.map(f=>`
    <div class="filter-chip ${activeFilter===f.key?'active':''}" data-filter="${f.key}">${f.label}</div>
  `).join('');
  document.querySelectorAll('.filter-chip').forEach(el=>{
    el.addEventListener('click', ()=>{ activeFilter = el.dataset.filter; renderBoard(); });
  });
}

function renderLegend(){
  let html = STAGE_DEFS.map(s=>`
    <div class="item"><span class="dot" style="background:${s.color}"></span>${s.label}</div>
  `).join('');
  html += `<div class="item"><span class="line-swatch" style="border-color:#2A2621"></span>Today</div>`;
  document.getElementById('legendRow').innerHTML = html;
}

function renderBoard(){
  const range = computeRange();
  document.getElementById('rangeLabel').textContent =
    `Showing ${fmtShort(range.start)} – ${fmtShort(range.end)}`;

  const totalDays = daysBetween(range.start, range.end);
  const timelineWidth = totalDays * PX_PER_DAY;

  const filtered = colors.filter(c => activeFilter==='all' || c.status===activeFilter);

  const {ordered: orderedGroupNames, groups} = computeGroupNames(filtered, false);

  // ---- Sidebar ----
  let sidebarHTML = `<div class="sidebar-head">Color</div>`;
  orderedGroupNames.forEach(gName=>{
    const isCollapsed = collapsedGroups.has(gName);
    sidebarHTML += `<div class="group-row ${isCollapsed?'collapsed':''}" data-group="${gName}">
        <span class="chev">▾</span>${gName} <span class="group-count">(${groups[gName].length})</span>
      </div>`;
    if(!isCollapsed){
      groups[gName].forEach(c=>{
        const isSel = selectedIds.has(c.id);
        sidebarHTML += `
        <div class="color-row-label ${isSel?'selected':''}" data-row="${c.id}">
          ${bulkMode ? `<input type="checkbox" class="row-checkbox" data-checkbox="${c.id}" ${isSel?'checked':''}>` : ''}
          <div class="swatch ${c.metallic?'metallic':''}" style="background:${c.hex}"></div>
          <div class="row-text">
            <div class="row-name">${c.name}</div>
            <div class="row-code">${c.code}</div>
            <div class="row-base" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Base: ${c.baseColor || '—'}${c.texture ? ' · ' + c.texture : ''}</div>
            ${statusPillHTML(c.status)}
          </div>
          <div class="row-actions">
            <button class="icon-btn" data-edit="${c.id}" title="Edit">✎</button>
            <button class="icon-btn" data-del="${c.id}" title="Delete">✕</button>
          </div>
        </div>`;
      });
    }
  });
  if(filtered.length === 0){
    sidebarHTML += `<div class="empty-state">No colors match this filter yet.</div>`;
  }

  // ---- Timeline header ----
  let monthBandsHTML = '';
  let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  if(cursor < range.start) { /* fine, we clip via left calc */ }
  let iter = new Date(range.start);
  while(iter <= range.end){
    const monthStart = new Date(iter.getFullYear(), iter.getMonth(), 1);
    const monthEnd = new Date(iter.getFullYear(), iter.getMonth()+1, 0);
    const segStart = monthStart < range.start ? range.start : monthStart;
    const segEnd = monthEnd > range.end ? range.end : monthEnd;
    const left = daysBetween(range.start, segStart) * PX_PER_DAY;
    const width = (daysBetween(segStart, segEnd)+1) * PX_PER_DAY;
    monthBandsHTML += `<div class="month-band" style="left:${left}px;width:${width}px;">${fmtMonthYear(monthStart)}</div>`;
    iter = new Date(monthEnd);
    iter.setDate(iter.getDate()+1);
  }

  let weekTicksHTML = '';
  let wIter = new Date(range.start);
  while(wIter <= range.end){
    const left = daysBetween(range.start, wIter) * PX_PER_DAY;
    weekTicksHTML += `<div class="week-tick" style="left:${left}px;width:${7*PX_PER_DAY}px;">${fmtShort(wIter)}</div>`;
    wIter = addDays(wIter, 7);
  }

  // ---- Marker lines (grid area, spans full height) ----
  function markerHTML(dateStr, color, label){
    const dt = new Date(dateStr);
    if(dt < range.start || dt > range.end) return '';
    const left = daysBetween(range.start, dt) * PX_PER_DAY;
    return `<div class="marker-line" style="left:${left}px;border-color:${color};"></div>
            <div class="marker-label" style="left:${left}px;color:${color};background:${color}18;">${label}</div>`;
  }
  const markers = markerHTML(toISO(NOW),'#2A2621','Today');

  // ---- Rows ----
  let rowsHTML = '';
  orderedGroupNames.forEach(gName=>{
    if(collapsedGroups.has(gName)) return;
    groups[gName].forEach(c=>{
      let bars = '';
      STAGE_DEFS.forEach(stageDef=>{
        const stage = c.stages[stageDef.key];
        if(!stage) return;
        const s = parseDate(stage.start), e = parseDate(stage.end);
        const left = daysBetween(range.start, s) * PX_PER_DAY;
        const width = Math.max((daysBetween(s,e)+1) * PX_PER_DAY, 18);
        const top = 12 + STAGE_DEFS.indexOf(stageDef) * 0; // single lane, stacked visually via offset below
        bars += `<div class="stage-bar" style="left:${left}px;width:${width}px;background:${stageDef.color};top:${8 + (STAGE_DEFS.indexOf(stageDef)%2)*0}px;"
                    data-tip="${stageDef.label}: ${fmtShort(s)} – ${fmtShort(e)}"></div>`;
      });
      rowsHTML += `<div class="gantt-row" data-ganttrow="${c.id}">${bars}</div>`;
    });
  });

  // Actually stack stage bars vertically within row height (64px) rather than overlapping
  // Rebuild with proper vertical offsets:
  rowsHTML = '';
  orderedGroupNames.forEach(gName=>{
    if(collapsedGroups.has(gName)) return;
    groups[gName].forEach(c=>{
      let bars = '';
      const laneHeight = 10;
      STAGE_DEFS.forEach((stageDef, idx)=>{
        const stage = c.stages[stageDef.key];
        if(!stage) return;
        const s = parseDate(stage.start), e = parseDate(stage.end);
        const left = daysBetween(range.start, s) * PX_PER_DAY;
        const width = Math.max((daysBetween(s,e)+1) * PX_PER_DAY, 16);
        const top = 5 + idx * (laneHeight + 1);
        bars += `<div class="stage-bar" style="left:${left}px;width:${width}px;background:${stageDef.color};top:${top}px;height:${laneHeight}px;font-size:8px;"
                    data-tip="${stageDef.label}: ${fmtShort(s)} – ${fmtShort(e)}"></div>`;
      });
      rowsHTML += `<div class="gantt-row" data-ganttrow="${c.id}" style="height:76px;">${bars}</div>`;
    });
  });

  const boardHTML = `
    <div class="sidebar">${sidebarHTML}</div>
    <div class="timeline-wrap" style="width:${timelineWidth}px;">
      <div class="timeline-head" style="width:${timelineWidth}px;">
        ${monthBandsHTML}
        ${weekTicksHTML}
      </div>
      <div class="rows-area" style="width:${timelineWidth}px;">
        ${markers}
        ${rowsHTML}
      </div>
    </div>
  `;

  document.getElementById('boardInner').innerHTML = boardHTML;

  // Bind group collapse
  document.querySelectorAll('.group-row').forEach(el=>{
    el.addEventListener('click', ()=>{
      const g = el.dataset.group;
      if(collapsedGroups.has(g)) collapsedGroups.delete(g); else collapsedGroups.add(g);
      renderBoard();
    });
  });
  document.querySelectorAll('[data-edit]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openModal(el.dataset.edit); });
  });
  document.querySelectorAll('.color-row-label .row-text').forEach(el=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>openModal(el.closest('.color-row-label').dataset.row));
  });
  document.querySelectorAll('[data-del]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      const c = colors.find(x=>x.id===el.dataset.del);
      if(confirm(`Delete ${c.name} (${c.code})? This can't be undone.`)){
        colors = colors.filter(x=>x.id!==el.dataset.del);
        selectedIds.delete(el.dataset.del);
        saveColors();
        renderAll();
      }
    });
  });
  document.querySelectorAll('[data-checkbox]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const id = el.dataset.checkbox;
      if(el.checked) selectedIds.add(id); else selectedIds.delete(id);
      el.closest('.color-row-label').classList.toggle('selected', el.checked);
      renderBulkBar();
    });
  });
}

function renderBulkBar(){
  const bar = document.getElementById('bulkBar');
  if(!bulkMode){ bar.style.display = 'none'; bar.innerHTML=''; return; }
  bar.style.display = 'flex';
  const stageOptions = STAGE_DEFS.map(s=>`<option value="${s.key}">${s.label}</option>`).join('');
  bar.innerHTML = `
    <div class="bulk-count">${selectedIds.size} selected</div>
    <button class="btn secondary small" id="bulkSelectAll">Select all visible</button>
    <button class="btn secondary small" id="bulkClear">Clear</button>
    <div class="divider"></div>
    <div class="bulk-group">
      <label>Shift all stages</label>
      <input type="number" id="shiftDays" value="7">
      <span style="color:var(--ink-soft);font-size:11px;">days</span>
      <button class="btn small" id="applyShift">Apply</button>
    </div>
    <div class="divider"></div>
    <div class="bulk-group">
      <label>Set one stage</label>
      <select id="bulkStageSelect">${stageOptions}</select>
      <input type="date" id="bulkStageStart">
      <input type="date" id="bulkStageEnd">
      <button class="btn small" id="applyStageDates">Apply</button>
    </div>
    <div class="divider"></div>
    <div class="bulk-group">
      <label>Set status</label>
      <select id="bulkStatusSelect">
        <option value="labdip1">Lab Dip 1</option>
        <option value="labdip2">Lab Dip 2</option>
        <option value="approved">Approved Standard</option>
        <option value="pilot">Pilot Run</option>
        <option value="colorcard">Color Card</option>
      </select>
      <button class="btn small" id="applyStatus">Apply</button>
    </div>
  `;

  document.getElementById('bulkSelectAll').addEventListener('click', ()=>{
    colors.filter(c => activeFilter==='all' || c.status===activeFilter)
          .forEach(c=>selectedIds.add(c.id));
    renderAll();
  });
  document.getElementById('bulkClear').addEventListener('click', ()=>{
    selectedIds.clear();
    renderAll();
  });
  document.getElementById('applyShift').addEventListener('click', async ()=>{
    const n = parseInt(document.getElementById('shiftDays').value, 10) || 0;
    if(n === 0 || selectedIds.size === 0) return;
    colors.forEach(c=>{
      if(!selectedIds.has(c.id)) return;
      Object.values(c.stages).forEach(st=>{
        st.start = toISO(addDays(parseDate(st.start), n));
        st.end = toISO(addDays(parseDate(st.end), n));
      });
    });
    await saveColors();
    renderAll();
  });
  document.getElementById('applyStageDates').addEventListener('click', async ()=>{
    const key = document.getElementById('bulkStageSelect').value;
    const start = document.getElementById('bulkStageStart').value;
    const end = document.getElementById('bulkStageEnd').value;
    if(!start || !end || selectedIds.size === 0){
      alert('Pick a start and end date, and select at least one color.');
      return;
    }
    colors.forEach(c=>{
      if(!selectedIds.has(c.id)) return;
      c.stages[key] = {start, end};
    });
    await saveColors();
    renderAll();
  });
  document.getElementById('applyStatus').addEventListener('click', async ()=>{
    if(selectedIds.size === 0) return;
    const status = document.getElementById('bulkStatusSelect').value;
    colors.forEach(c=>{ if(selectedIds.has(c.id)) c.status = status; });
    await saveColors();
    renderAll();
  });
}

function statusLabel(s){
  const def = STAGE_DEFS.find(d=>d.key===s);
  return def ? def.label : s;
}

function statusColor(s){
  const def = STAGE_DEFS.find(d=>d.key===s);
  return def ? def.color : '#999999';
}

function contrastText(hex){
  const h = hex.replace('#','');
  const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.6 ? '#1E1B18' : '#FFFFFF';
}

function statusPillHTML(s){
  const color = statusColor(s);
  const text = contrastText(color);
  return `<span class="status-pill" style="background:${color};color:${text};">${statusLabel(s)}</span>`;
}

function qaBadgeHTML(qa){
  if(!qa) return '';
  const labels = {qa_approved:'Approved', qa_passing80k:'Passing (80K+)'};
  if(!labels[qa]) return '';
  return `<span class="qa-badge ${qa}">${labels[qa]}</span>`;
}

let pendingScrollToToday = true;

function renderAll(){
  renderTabBar();
  renderSummary();
  renderFilters();
  renderLegend();
  renderBulkBar();
  renderBoard();
  renderSwatchBoard();
  renderCalendar();
  renderTextures();
  renderEventView();
  if(currentView === 'timeline' && pendingScrollToToday){
    scrollToToday();
    pendingScrollToToday = false;
  }
}

function scrollToToday(){
  const boardScroll = document.querySelector('.board-scroll');
  if(!boardScroll) return;
  const range = computeRange();
  const px = daysBetween(range.start, NOW) * PX_PER_DAY;
  boardScroll.scrollLeft = Math.max(0, px - 160);
}

function renderTabBar(){
  const tabs = [
    {key:'swatch', label:'Stock Colors'},
    {key:'timeline', label:'Timeline'},
    {key:'calendar', label:'Calendar'},
    {key:'textures', label:'Textures'},
    {key:'event', label:'Client A Event'},
  ];
  document.getElementById('tabBar').innerHTML = tabs.map(t=>`
    <button class="tab-btn ${currentView===t.key?'active':''}" data-view="${t.key}">${t.label}</button>
  `).join('');
  document.querySelectorAll('.tab-btn').forEach(el=>{
    el.addEventListener('click', ()=>{
      currentView = el.dataset.view;
      if(currentView === 'timeline') pendingScrollToToday = true;
      applyViewVisibility();
      renderAll();
    });
  });
  applyViewVisibility();
}

function applyViewVisibility(){
  document.getElementById('viewTimeline').style.display = currentView === 'timeline' ? '' : 'none';
  document.getElementById('viewSwatch').style.display = currentView === 'swatch' ? '' : 'none';
  document.getElementById('viewCalendar').style.display = currentView === 'calendar' ? '' : 'none';
  document.getElementById('viewTextures').style.display = currentView === 'textures' ? '' : 'none';
  document.getElementById('viewEvent').style.display = currentView === 'event' ? '' : 'none';
}

// ---------- Swatch board view ----------
function renderSwatchBoard(){
  const {ordered: orderedGroupNames, groups} = computeGroupNames(colors, true);

  let html = `
    <div class="new-collection-row">
      <button class="btn secondary small" id="newCollectionBtn">+ New collection</button>
      <div id="newCollectionForm" style="display:none;">
        <input type="text" id="newCollectionName" placeholder="Collection name">
        <button class="btn small" id="newCollectionSave">Add</button>
        <button class="btn secondary small" id="newCollectionCancel">Cancel</button>
      </div>
      <span class="drag-hint">Tip: hold ⌥ Option (Alt on Windows) while dropping a swatch to copy it instead of moving it</span>
    </div>
  `;

  orderedGroupNames.forEach(gName=>{
    const list = groups[gName];
    const isCustom = extraGroups.includes(gName) && !GROUP_ORDER.includes(gName);
    html += `<div class="swatch-group" data-groupname="${gName}">
      <div class="swatch-group-title" draggable="true" data-draggroup="${gName}" title="Drag to reorder collections">
        <span class="group-drag-handle">⠿</span>${gName} <span class="count">(${list.length})</span>
        <button class="export-pdf-btn" data-exportgroup="${gName}" title="Export this collection as a PDF">Export PDF</button>
        ${isCustom && list.length===0 ? `<button class="icon-btn" data-removegroup="${gName}" title="Remove empty collection">✕</button>` : ''}
      </div>
      <div class="swatch-grid ${list.length===0?'empty-drop':''}" data-group="${gName}">`;
    if(list.length === 0){
      html += `<div class="swatch-drop-hint">Drag swatches here to compare across collections</div>`;
    }
    const isScratchGroup = extraGroups.includes(gName);
    list.forEach(c=>{
      html += `
        <div class="swatch-card" draggable="true" data-id="${c.id}">
          ${isScratchGroup ? `<button class="card-remove-chip" data-removefromcollection="${c.id}" title="Remove from this collection">✕</button>` : ''}
          <div class="big-swatch ${c.metallic?'metallic':''}" style="background:${c.hex}" data-pickhex="${c.id}" title="Click to change color"></div>
          <input type="color" class="hex-hidden" value="${c.hex}" data-hexinput="${c.id}">
          <div class="card-actions">
            <button class="icon-btn" data-copyto="${c.id}" title="Copy to another collection">⧉</button>
            <button class="icon-btn" data-edit="${c.id}" title="Edit">✎</button>
            <button class="icon-btn" data-del="${c.id}" title="Delete">✕</button>
          </div>
          <div class="card-body">
            <div class="card-name"><input class="inline-edit" data-field="name" data-id="${c.id}" value="${escAttr(c.name)}" title="Click to edit name"></div>
            <div class="card-code"><input class="inline-edit" data-field="code" data-id="${c.id}" value="${escAttr(c.code)}" title="Click to edit code"></div>
            <div class="card-base inline-row">Base: <input class="inline-edit" data-field="baseColor" data-id="${c.id}" list="baseColorList" value="${escAttr(c.baseColor === '—' ? '' : (c.baseColor || ''))}" placeholder="add base"></div>
            <div class="card-base inline-row">Texture: <input class="inline-edit" data-field="texture" data-id="${c.id}" list="textureList" value="${escAttr(c.texture || '')}" placeholder="add texture"></div>
            <div class="card-base notes-row">Notes:<textarea class="inline-edit inline-notes" rows="1" data-field="notes" data-id="${c.id}" placeholder="e.g. SS27, Client D">${escAttr(c.notes || '')}</textarea></div>
            <select class="inline-status" data-field="status" data-id="${c.id}" style="background:${statusColor(c.status)};color:${contrastText(statusColor(c.status))};">
              ${STAGE_DEFS.map(d=>`<option value="${d.key}" ${d.key===c.status?'selected':''}>${d.label}</option>`).join('')}
            </select>
          </div>
        </div>`;
    });
    html += `</div></div>`;
  });
  document.getElementById('swatchBoard').innerHTML = html;

  document.querySelectorAll('#swatchBoard [data-edit]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openModal(el.dataset.edit); });
  });
  document.querySelectorAll('#swatchBoard .swatch-card .card-body').forEach(el=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>openModal(el.closest('.swatch-card').dataset.id));
  });
  document.querySelectorAll('#swatchBoard [data-copyto]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openCopyModal(el.dataset.copyto); });
  });
  document.querySelectorAll('#swatchBoard [data-del]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      const c = colors.find(x=>x.id===el.dataset.del);
      if(confirm(`Delete ${c.name} (${c.code})? This can't be undone.`)){
        colors = colors.filter(x=>x.id!==el.dataset.del);
        selectedIds.delete(el.dataset.del);
        saveColors();
        renderAll();
      }
    });
  });
  document.querySelectorAll('#swatchBoard [data-removefromcollection]').forEach(el=>{
    el.addEventListener('click', async (e)=>{
      e.stopPropagation();
      const id = el.dataset.removefromcollection;
      colors = colors.filter(x=>x.id!==id);
      selectedIds.delete(id);
      await saveColors();
      renderAll();
    });
  });
  document.querySelectorAll('#swatchBoard [data-removegroup]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      extraGroups = extraGroups.filter(g=>g!==el.dataset.removegroup);
      saveExtraGroups();
      renderAll();
    });
  });

  document.getElementById('newCollectionBtn').addEventListener('click', ()=>{
    document.getElementById('newCollectionForm').style.display = 'flex';
    document.getElementById('newCollectionBtn').style.display = 'none';
    document.getElementById('newCollectionName').focus();
  });
  document.getElementById('newCollectionCancel').addEventListener('click', ()=>{
    document.getElementById('newCollectionForm').style.display = 'none';
    document.getElementById('newCollectionBtn').style.display = '';
  });
  document.getElementById('newCollectionSave').addEventListener('click', async ()=>{
    const name = document.getElementById('newCollectionName').value.trim();
    if(!name) return;
    if(!extraGroups.includes(name) && !GROUP_ORDER.includes(name)){
      extraGroups.push(name);
      await saveExtraGroups();
    }
    renderAll();
  });

  attachSwatchDragHandlers();
  attachInlineEditHandlers();
  document.querySelectorAll('[data-exportgroup]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openExportModal(el.dataset.exportgroup); });
    el.addEventListener('mousedown', (e)=>e.stopPropagation());
  });
  attachGroupDragHandlers();
}

function hexToRgb(hex){
  const h = (hex || '#999999').replace('#','');
  return [parseInt(h.slice(0,2),16)||0, parseInt(h.slice(2,4),16)||0, parseInt(h.slice(4,6),16)||0];
}

function buildCollectionPDF(groupName){
  const items = colors.filter(c=>c.group === groupName);
  const PW = 612, MAXH = 792, M = 40, GAP = 12, HEAD = 56;
  const hasNotes = items.some(i=>i.notes);
  const baseCardH = 110 + 82 + (hasNotes ? 30 : 0);
  const layoutFor = cols => {
    const cardW = (PW - 2*M - GAP*(cols-1)) / cols, s = cardW / 168, cardH = baseCardH * s;
    const rows = Math.ceil(items.length / cols);
    return {cols, cardW, s, cardH, needed: M + HEAD + rows*(cardH + GAP) - GAP + M};
  };
  // everything goes on ONE page: widen the grid first, and only if that still
  // isn't enough, make the single page taller instead of adding a second one
  let L = [3,4,5].map(layoutFor).find(l => l.needed <= MAXH);
  if(!L) L = layoutFor(5);
  const pageH = Math.max(MAXH, Math.ceil(L.needed));

  const doc = new window.jspdf.jsPDF({orientation:'portrait', unit:'pt', format:[PW, pageH]});
  const stageLabel = k => (STAGE_DEFS.find(d=>d.key===k)||{}).label || k;
  const clip = (t, w) => { let x = String(t||''); while(x.length>1 && doc.getTextWidth(x) > w) x = x.slice(0,-1); return x; };

  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(30,27,24);
  doc.text(groupName, M, M + 14);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(110,102,92);
  doc.text(`Uncaged Innovations · ${items.length} swatch${items.length===1?'':'es'} · exported ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`, M, M + 30);
  doc.setDrawColor(218,209,190); doc.line(M, M + 40, PW - M, M + 40);

  const {cols, cardW, s, cardH} = L;
  const swH = 110 * s;
  items.forEach((c, idx)=>{
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = M + col * (cardW + GAP), y = M + HEAD + row * (cardH + GAP);
    doc.setDrawColor(218,209,190); doc.setFillColor(255,255,255);
    doc.roundedRect(x, y, cardW, cardH, 6*s, 6*s, 'FD');
    const [r,g,b] = hexToRgb(c.hex);
    doc.setFillColor(r,g,b); doc.setDrawColor(r,g,b);
    doc.roundedRect(x+0.5, y+0.5, cardW-1, swH, 6*s, 6*s, 'F');
    doc.rect(x+0.5, y+swH-8*s, cardW-1, 8.5*s, 'F');
    const tx = x + 10*s, tw = cardW - 20*s;
    doc.setFont('helvetica','bold'); doc.setFontSize(11*s); doc.setTextColor(30,27,24);
    doc.text(clip(c.name, tw), tx, y + swH + 18*s);
    doc.setFont('courier','normal'); doc.setFontSize(8.5*s); doc.setTextColor(110,102,92);
    doc.text(clip(c.code, tw), tx, y + swH + 31*s);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5*s); doc.setTextColor(60,54,48);
    doc.text(clip('Base: ' + (c.baseColor || '—'), tw), tx, y + swH + 45*s);
    doc.text(clip('Texture: ' + (c.texture || '—'), tw), tx, y + swH + 57*s);
    doc.text(clip('Stage: ' + stageLabel(c.status), tw), tx, y + swH + 69*s);
    if(c.notes){
      doc.setFont('helvetica','italic'); doc.setFontSize(8*s);
      const lines = doc.splitTextToSize('Notes: ' + c.notes, tw).slice(0,2);
      doc.text(lines, tx, y + swH + 81*s);
    }
  });
  return doc;
}

let exportingGroup = null;
const exportFileName = g => `${g.replace(/[^a-z0-9]+/gi,'_')}_swatches.pdf`;

function openExportModal(groupName){
  const items = colors.filter(c=>c.group === groupName);
  if(!items.length){ alert(`"${groupName}" has no swatches to export yet.`); return; }
  exportingGroup = groupName;
  const stageLabel = k => (STAGE_DEFS.find(d=>d.key===k)||{}).label || k;
  document.getElementById('exportTitle').textContent = `${groupName} — PDF preview`;
  document.getElementById('exportPreview').innerHTML =
    `<div class="exp-head"><h2>${escAttr(groupName)}</h2><div>Uncaged Innovations · ${items.length} swatch${items.length===1?'':'es'} · exported ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div>` +
    `<div class="exp-grid">` + items.map(c=>`
      <div class="exp-card">
        <div class="exp-sw" style="background:${c.hex}"></div>
        <div class="exp-body">
          <b>${escAttr(c.name)}</b>
          <span class="exp-code">${escAttr(c.code)}</span>
          <span>Base: ${escAttr(c.baseColor || '—')}</span>
          <span>Texture: ${escAttr(c.texture || '—')}</span>
          <span>Stage: ${escAttr(stageLabel(c.status))}</span>
          ${c.notes ? `<span><b style="font-size:10.5px">Notes:</b> ${escAttr(c.notes)}</span>` : ''}
        </div>
      </div>`).join('') + `</div>`;
  document.getElementById('exportStatus').textContent = '';
  document.getElementById('exportModalOverlay').classList.add('open');
}

function closeExportModal(){
  document.getElementById('exportModalOverlay').classList.remove('open');
  exportingGroup = null;
}

function exportDownload(){
  if(!exportingGroup) return;
  const st = document.getElementById('exportStatus');
  if(!window.jspdf){ st.textContent = 'The PDF library did not load.'; return; }
  try{
    const blob = buildCollectionPDF(exportingGroup).output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = exportFileName(exportingGroup); a.target = '_blank'; a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 4000);
    st.textContent = 'PDF generated. If no file appeared, your viewer is blocking downloads — use "Open in new tab" or "Print / Save as PDF" instead.';
  }catch(e){ st.textContent = 'Could not build the PDF: ' + e.message; }
}

function exportOpenTab(){
  if(!exportingGroup) return;
  const st = document.getElementById('exportStatus');
  try{
    const url = buildCollectionPDF(exportingGroup).output('bloburl');
    const w = window.open(url, '_blank');
    st.textContent = w ? 'Opened in a new tab — use the viewer there to save it.' : 'Your viewer blocked the new tab — try "Print / Save as PDF".';
  }catch(e){ st.textContent = 'Could not build the PDF: ' + e.message; }
}

function exportPrint(){
  const body = document.body;
  const restore = ()=>{ body.classList.remove('printing-export'); window.removeEventListener('afterprint', restore); };
  window.addEventListener('afterprint', restore);
  body.classList.add('printing-export');
  try{ window.print(); }
  catch(e){ document.getElementById('exportStatus').textContent = 'Printing is blocked in this viewer.'; }
  finally{ setTimeout(restore, 300); }
}

function attachGroupDragHandlers(){
  document.querySelectorAll('.swatch-group-title').forEach(title=>{
    title.addEventListener('dragstart', (e)=>{
      draggedGroupName = title.dataset.draggroup;
      title.classList.add('group-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedGroupName);
    });
    title.addEventListener('dragend', ()=>{
      title.classList.remove('group-dragging');
      document.querySelectorAll('.swatch-group-title').forEach(t=>t.classList.remove('group-drag-over-before','group-drag-over-after'));
    });
    title.addEventListener('dragover', (e)=>{
      if(draggedGroupName === null) return;
      e.preventDefault();
      if(title.dataset.draggroup === draggedGroupName) return;
      const rect = title.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      title.classList.toggle('group-drag-over-before', before);
      title.classList.toggle('group-drag-over-after', !before);
    });
    title.addEventListener('dragleave', ()=>{
      title.classList.remove('group-drag-over-before','group-drag-over-after');
    });
    title.addEventListener('drop', async (e)=>{
      if(draggedGroupName === null) return;
      e.preventDefault();
      e.stopPropagation();
      const targetName = title.dataset.draggroup;
      if(targetName === draggedGroupName) return;
      const rect = title.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      await reorderGroup(draggedGroupName, targetName, before);
      draggedGroupName = null;
    });
  });
}

async function reorderGroup(dragName, targetName, insertBefore){
  const fromIdx = groupOrder.indexOf(dragName);
  if(fromIdx === -1) return;
  groupOrder.splice(fromIdx, 1);
  let targetIdx = groupOrder.indexOf(targetName);
  if(targetIdx === -1) targetIdx = groupOrder.length;
  const insertAt = insertBefore ? targetIdx : targetIdx + 1;
  groupOrder.splice(insertAt, 0, dragName);
  await saveGroupOrder();
  renderAll();
}

function escAttr(v){
  return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

function refreshInlineDatalists(){
  populateBaseColorList();
  const names = [...new Set([...textures.map(t=>t.name), ...colors.map(c=>c.texture).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
  document.getElementById('textureList').innerHTML = names.map(n=>`<option value="${escAttr(n)}">`).join('');
}

function attachInlineEditHandlers(){
  refreshInlineDatalists();
  document.querySelectorAll('#swatchBoard .inline-edit, #swatchBoard .inline-status').forEach(el=>{
    const card = el.closest('.swatch-card');
    el.addEventListener('focus', ()=>{ if(card) card.draggable = false; });
    el.addEventListener('blur', ()=>{ if(card) card.draggable = true; });
    el.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); el.blur(); } });
    if(el.tagName === 'TEXTAREA'){ const fit = ()=>{ el.style.height='auto'; el.style.height = el.scrollHeight + 'px'; }; el.addEventListener('input', fit); fit(); }
    el.addEventListener('change', async ()=>{
      const c = colors.find(x=>x.id===el.dataset.id);
      if(!c) return;
      const field = el.dataset.field;
      const val = el.value.trim();
      if((field === 'name' || field === 'code') && !val){ el.value = c[field]; return; }
      if(field === 'baseColor') c.baseColor = val || '—';
      else if(field === 'status') c.status = el.value;
      else c[field] = val;
      await saveColors();
      renderAll();
    });
  });
  document.querySelectorAll('#swatchBoard [data-pickhex]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const inp = document.querySelector(`[data-hexinput="${el.dataset.pickhex}"]`);
      if(inp) inp.click();
    });
  });
  document.querySelectorAll('#swatchBoard [data-hexinput]').forEach(el=>{
    el.addEventListener('change', async ()=>{
      const c = colors.find(x=>x.id===el.dataset.hexinput);
      if(!c) return;
      c.hex = el.value.toUpperCase();
      await saveColors();
      renderAll();
    });
  });
}

function attachSwatchDragHandlers(){
  document.querySelectorAll('.swatch-card').forEach(card=>{
    card.addEventListener('dragstart', (e)=>{
      draggedId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
    });
    card.addEventListener('dragend', ()=>{
      card.classList.remove('dragging');
      document.querySelectorAll('.swatch-card').forEach(c=>c.classList.remove('drag-over-before','drag-over-after'));
    });
    card.addEventListener('dragover', (e)=>{
      e.preventDefault();
      if(card.dataset.id === draggedId) return;
      e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
      const rect = card.getBoundingClientRect();
      const before = (e.clientX - rect.left) < rect.width/2;
      card.classList.toggle('drag-over-before', before);
      card.classList.toggle('drag-over-after', !before);
    });
    card.addEventListener('dragleave', ()=>{
      card.classList.remove('drag-over-before','drag-over-after');
    });
    card.addEventListener('drop', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const targetId = card.dataset.id;
      if(targetId === draggedId) return;
      const rect = card.getBoundingClientRect();
      const before = (e.clientX - rect.left) < rect.width/2;
      const targetGroup = card.closest('.swatch-grid').dataset.group;
      moveColor(draggedId, targetId, before, targetGroup, e.altKey);
    });
  });
  document.querySelectorAll('.swatch-grid').forEach(grid=>{
    grid.addEventListener('dragover', (e)=>{
      e.preventDefault();
      e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
    });
    grid.addEventListener('drop', (e)=>{
      if(e.target !== grid) return;
      e.preventDefault();
      moveColor(draggedId, null, false, grid.dataset.group, e.altKey);
    });
  });
}

async function moveColor(dragId, targetId, insertBefore, targetGroup, copy){
  if(!dragId) return;
  const draggedIdx = colors.findIndex(c=>c.id===dragId);
  if(draggedIdx === -1) return;
  let item;
  if(copy){
    item = JSON.parse(JSON.stringify(colors[draggedIdx]));
    item.id = (item.code || 'copy').replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7);
  } else {
    [item] = colors.splice(draggedIdx, 1);
  }
  item.group = targetGroup;
  if(targetId){
    let targetIdx = colors.findIndex(c=>c.id===targetId);
    if(targetIdx === -1) targetIdx = colors.length;
    const insertAt = insertBefore ? targetIdx : targetIdx + 1;
    colors.splice(insertAt, 0, item);
  } else {
    colors.push(item);
  }
  await saveColors();
  renderAll();
}

// ---------- Calendar view ----------
function renderCalendar(){
  document.getElementById('calMonthLabel').textContent = fmtMonthYear(calendarMonth);

  let legendHtml = STAGE_DEFS.map(s=>`
    <div class="item"><span class="dot" style="background:${s.color}"></span>${s.label}</div>
  `).join('');
  legendHtml += `<div class="item"><span class="line-swatch" style="border-color:#B65C4A"></span>PV in-office deadline / milestone</div>`;
  document.getElementById('calLegendRow').innerHTML = legendHtml;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startDow);
  const today = NOW;
  const milestoneDates = new Set(['2026-08-24','2026-09-01']);

  const events = {};
  colors.forEach(c=>{
    STAGE_DEFS.forEach(stageDef=>{
      const stage = c.stages[stageDef.key];
      if(!stage) return;
      const startKey = stage.start;
      if(!events[startKey]) events[startKey] = [];
      events[startKey].push({label:`${c.name} · ${stageDef.label} starts`, color:stageDef.color});
      const endKey = stage.end;
      if(!events[endKey]) events[endKey] = [];
      events[endKey].push({label:`${c.name} · ${stageDef.label} ends`, color:stageDef.color});
    });
  });

  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = dow.map(d=>`<div class="cal-dow">${d}</div>`).join('');

  for(let i=0;i<42;i++){
    const day = addDays(gridStart, i);
    const iso = toISO(day);
    const isOtherMonth = day.getMonth() !== month;
    const isToday = iso === toISO(today);
    const isMilestone = milestoneDates.has(iso);
    const dayEvents = events[iso] || [];
    const shown = dayEvents.slice(0,3);
    const extra = dayEvents.length - shown.length;

    html += `<div class="cal-cell ${isOtherMonth?'other-month':''} ${isToday?'today':''} ${isMilestone?'milestone':''}">
      <div class="cal-daynum">${day.getDate()}</div>
      ${shown.map(ev=>`<div class="cal-event" style="background:${ev.color}" title="${ev.label}">${ev.label}</div>`).join('')}
      ${extra > 0 ? `<div class="cal-more">+${extra} more</div>` : ''}
    </div>`;

    if(i === 41) break;
  }

  document.getElementById('calGrid').innerHTML = html;
}

document.getElementById('calPrev')?.addEventListener('click', ()=>{
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()-1, 1);
  renderCalendar();
});
document.getElementById('calNext')?.addEventListener('click', ()=>{
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 1);
  renderCalendar();
});

// ---------- Modal ----------
function populateGroupList(){
  const groups = [...new Set(colors.map(c=>c.group))];
  GROUP_ORDER.forEach(g=>{ if(!groups.includes(g)) groups.push(g); });
  extraGroups.forEach(g=>{ if(!groups.includes(g)) groups.push(g); });
  document.getElementById('groupList').innerHTML = groups.map(g=>`<option value="${g}">`).join('');
}

function populateBaseColorList(){
  const known = ['Stone Matte','Onyx Matte','Coffee','Saddle','Blue','Emerald','Ruby','Cherry','Client C Ultradark Blue','Client C Red','Client C Camel','White 11-4800 TCX'];
  const fromData = colors.map(c=>c.baseColor).filter(Boolean);
  const all = [...new Set([...known, ...fromData])];
  document.getElementById('baseColorList').innerHTML = all.map(b=>`<option value="${b}">`).join('');
}

function buildStageEditor(stages){
  return STAGE_DEFS.map(def=>{
    const val = stages && stages[def.key] ? stages[def.key] : {start:'', end:''};
    return `
      <div class="stage-edit-row" data-stagekey="${def.key}">
        <div class="stage-name"><span class="stage-dot" style="background:${def.color}"></span>${def.label}</div>
        <input type="date" class="stage-start" value="${val.start||''}">
        <input type="date" class="stage-end" value="${val.end||''}">
      </div>`;
  }).join('');
}

function populateTextureOptions(selected){
  const fromLibrary = textures.map(t=>t.name);
  const fromData = colors.map(c=>c.texture).filter(Boolean);
  const names = [...new Set([...fromLibrary, ...fromData])].sort((a,b)=>a.localeCompare(b));
  document.getElementById('textureList').innerHTML = names.map(n=>`<option value="${n}">`).join('');
  document.getElementById('f_texture').value = selected || '';
}

function openModal(id){
  editingId = id || null;
  populateGroupList();
  populateBaseColorList();
  const modalTitle = document.getElementById('modalTitle');
  if(id){
    const c = colors.find(x=>x.id===id);
    modalTitle.textContent = `Edit ${c.name}`;
    document.getElementById('f_code').value = c.code;
    document.getElementById('f_name').value = c.name;
    document.getElementById('f_hex').value = c.hex;
    document.getElementById('f_hexpicker').value = c.hex;
    document.getElementById('f_group').value = c.group;
    document.getElementById('f_basecolor').value = c.baseColor || '';
    populateTextureOptions(c.texture || '');
    document.getElementById('f_notes').value = c.notes || '';
    document.getElementById('f_status').value = c.status;
    document.getElementById('f_qastatus').value = c.qaStatus || '';
    document.getElementById('stageEditorRows').innerHTML = buildStageEditor(c.stages);
  } else {
    modalTitle.textContent = 'Add color';
    document.getElementById('f_code').value = '';
    document.getElementById('f_name').value = '';
    document.getElementById('f_hex').value = '#A9AD84';
    document.getElementById('f_hexpicker').value = '#A9AD84';
    document.getElementById('f_group').value = '';
    document.getElementById('f_basecolor').value = '';
    populateTextureOptions('');
    document.getElementById('f_notes').value = '';
    document.getElementById('f_status').value = 'labdip1';
    document.getElementById('f_qastatus').value = '';
    document.getElementById('stageEditorRows').innerHTML = buildStageEditor(null);
  }
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function saveModal(){
  const code = document.getElementById('f_code').value.trim();
  const name = document.getElementById('f_name').value.trim() || code;
  const hex = document.getElementById('f_hex').value.trim() || '#999999';
  const group = document.getElementById('f_group').value.trim() || 'Custom Development';
  const baseColor = document.getElementById('f_basecolor').value.trim() || '—';
  const status = document.getElementById('f_status').value;
  const qaStatus = document.getElementById('f_qastatus').value;
  const texture = document.getElementById('f_texture').value.trim();
  const notes = document.getElementById('f_notes').value.trim();

  if(!code){ alert('Please enter a Pantone code or reference.'); return; }

  const stages = {};
  document.querySelectorAll('.stage-edit-row').forEach(row=>{
    const key = row.dataset.stagekey;
    const start = row.querySelector('.stage-start').value;
    const end = row.querySelector('.stage-end').value;
    if(start && end){ stages[key] = {start, end}; }
  });

  if(editingId){
    const c = colors.find(x=>x.id===editingId);
    c.code = code; c.name = name; c.hex = hex; c.group = group; c.baseColor = baseColor; c.texture = texture; c.notes = notes; c.status = status; c.qaStatus = qaStatus; c.stages = stages;
  } else {
    colors.push({
      id: code.replace(/\s+/g,'_')+'_'+Math.random().toString(36).slice(2,7),
      code, name, hex, group, baseColor, texture, notes, status, qaStatus, metallic:false, stages
    });
  }
  saveColors();
  closeModal();
  renderAll();
}

let copyingId = null;

function openCopyModal(id){
  copyingId = id;
  const groupsSet = new Set(colors.map(c=>c.group));
  GROUP_ORDER.forEach(g=>groupsSet.add(g));
  extraGroups.forEach(g=>groupsSet.add(g));
  const allGroups = [...groupsSet].sort((a,b)=>a.localeCompare(b));
  document.getElementById('copyTargetGroup').innerHTML = allGroups.map(g=>`<option value="${g}">${g}</option>`).join('');
  document.getElementById('copyModalOverlay').classList.add('open');
}

function closeCopyModal(){
  document.getElementById('copyModalOverlay').classList.remove('open');
  copyingId = null;
}

async function confirmCopy(){
  if(!copyingId) return;
  const targetGroup = document.getElementById('copyTargetGroup').value;
  const idx = colors.findIndex(c=>c.id===copyingId);
  if(idx === -1){ closeCopyModal(); return; }
  const item = JSON.parse(JSON.stringify(colors[idx]));
  item.id = (item.code || 'copy').replace(/\s+/g,'_') + '_' + Math.random().toString(36).slice(2,7);
  item.group = targetGroup;
  colors.push(item);
  await saveColors();
  closeCopyModal();
  renderAll();
}

document.getElementById('copyCancelBtn').addEventListener('click', closeCopyModal);
document.getElementById('exportCloseBtn').addEventListener('click', closeExportModal);
document.getElementById('exportDownloadBtn').addEventListener('click', exportDownload);
document.getElementById('exportTabBtn').addEventListener('click', exportOpenTab);
document.getElementById('exportPrintBtn').addEventListener('click', exportPrint);
document.getElementById('exportModalOverlay').addEventListener('click', (e)=>{ if(e.target.id==='exportModalOverlay') closeExportModal(); });
document.getElementById('copyConfirmBtn').addEventListener('click', confirmCopy);
document.getElementById('copyModalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'copyModalOverlay') closeCopyModal();
});

document.getElementById('addColorBtn').addEventListener('click', ()=>openModal(null));
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveModal);
document.getElementById('modalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'modalOverlay') closeModal();
});
document.getElementById('f_hexpicker').addEventListener('input', (e)=>{
  document.getElementById('f_hex').value = e.target.value;
});
document.getElementById('f_hex').addEventListener('input', (e)=>{
  if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)){
    document.getElementById('f_hexpicker').value = e.target.value;
  }
});
document.getElementById('bulkToggleBtn').addEventListener('click', ()=>{
  bulkMode = !bulkMode;
  selectedIds.clear();
  document.getElementById('bulkToggleBtn').textContent = bulkMode ? 'Exit bulk edit' : 'Bulk edit';
  document.getElementById('bulkToggleBtn').classList.toggle('btn', true);
  renderAll();
});

async function ensureColorExpansionFW(){
  const existingCodes = colors.map(c=>c.code);
  const additions = [
    mk('4625 C','Chocolate','#4A2E20','Color Expansion FW','approved',
      ['2026-05-01','2026-05-08'],['2026-05-09','2026-05-20'],['2026-05-21','2026-05-27'],['2026-05-28','2026-06-11'],['2026-06-12','2026-06-24']),
    mk('567 C','Evergreen','#1E4C3F','Color Expansion FW','approved',
      ['2026-05-01','2026-05-08'],['2026-05-09','2026-05-20'],['2026-05-21','2026-05-27'],['2026-05-28','2026-06-11'],['2026-06-12','2026-06-24']),
    mk('289 C','Midnight','#0C2340','Color Expansion FW','approved',
      ['2026-05-01','2026-05-08'],['2026-05-09','2026-05-20'],['2026-05-21','2026-05-27'],['2026-05-28','2026-06-11'],['2026-06-12','2026-06-24']),
    mk('5753 C','Olive','#5B6236','Color Expansion FW','approved',
      ['2026-05-01','2026-05-08'],['2026-05-09','2026-05-20'],['2026-05-21','2026-05-27'],['2026-05-28','2026-06-11'],['2026-06-12','2026-06-24']),
    mk('504 C','Aubergine','#4C2A32','Color Expansion FW','approved',
      ['2026-05-01','2026-05-08'],['2026-05-09','2026-05-20'],['2026-05-21','2026-05-27'],['2026-05-28','2026-06-11'],['2026-06-12','2026-06-24']),
  ];
  let changed = false;
  additions.forEach(a=>{
    if(!existingCodes.includes(a.code)){
      colors.push(a);
      changed = true;
    }
  });
  if(changed){
    await saveColors();
  }
}

async function renameCollection(oldName, newName){
  let changed = false;
  colors.forEach(c=>{ if(c.group === oldName){ c.group = newName; changed = true; } });
  const swap = arr => [...new Set(arr.map(g => g === oldName ? newName : g))];
  if(extraGroups.includes(oldName)){ extraGroups = swap(extraGroups); await saveExtraGroups(); }
  if(groupOrder.includes(oldName)){ groupOrder = swap(groupOrder); await saveGroupOrder(); }
  if(changed) await saveColors();
}

(async function init(){
  await loadColors();
  await loadExtraGroups();
  await loadGroupOrder();
  await renameCollection('December Plan', 'SS27');
  if(extraGroups.includes('Color Expansion FW')){
    extraGroups = extraGroups.filter(g=>g!=='Color Expansion FW');
    await saveExtraGroups();
  }
  await ensureColorExpansionFW();
  await ensureInitialColorTest();
  await ensure5025C();
  await migrateStatuses();
  await ensureStockColors();
  await ensureClientC();
  await ensureClientD();
  await ensureBaseColors();
  await ensureLuxeNaturalRestored();
  await ensureLuxeOffWhiteRestored();
  await ensureDecemberAdditions();
  await loadTextures();
  await ensureTextures();
  await loadEventTextures();
  await ensureEventTextures();
  await ensureSpecialColors();
  buildTortoiseshellPattern();
  buildEvergladePattern();
  renderAll();
})();

function computeCurrentStage(c){
  const order = STAGE_DEFS.map(s=>s.key);
  let current = order[0];
  for(const key of order){
    const stage = c.stages[key];
    if(!stage) continue;
    const start = parseDate(stage.start), end = parseDate(stage.end);
    if(NOW >= start && NOW <= end) return key;
    if(NOW > end) current = key;
    if(NOW < start) break;
  }
  return current;
}

async function migrateStatuses(){
  let flagVal = null;
  try{
    const res = await window.storage.get('statusSchemaV2', false);
    if(res && res.value) flagVal = res.value;
  }catch(e){ /* not found */ }

  if(flagVal === 'done') return;

  colors.forEach(c=>{
    c.status = computeCurrentStage(c);
  });
  await saveColors();

  try{
    await window.storage.set('statusSchemaV2', 'done', false);
  }catch(e){ console.error('Storage error', e); }
}

async function ensure5025C(){
  const groupName = 'Luxe Natural';
  const already = colors.some(c=>c.code==='5025 C' && c.group===groupName);
  if(already) return;
  const addition = mk('5025 C','5025 C','#EEC7C9',groupName,'development',
    ['2026-08-27','2026-09-03'],['2026-09-04','2026-09-15'],['2026-09-16','2026-09-22'],['2026-09-23','2026-10-07'],['2026-10-08','2026-10-20']);
  colors.push(addition);
  await saveColors();
}

function mkTested(code,name,hex,group,status,labdip1){
  return {
    id: code.replace(/\s+/g,'_')+'_'+Math.random().toString(36).slice(2,7),
    code, name, hex, group, status, metallic:false,
    stages: { labdip1: {start:labdip1[0], end:labdip1[1]} }
  };
}

async function ensureInitialColorTest(){
  const groupName = 'Initial Color Test';
  const existingCodes = colors.filter(c=>c.group===groupName).map(c=>c.code);
  const additions = [
    mkTested('7687 C','Lapis','#2C4593',groupName,'rejected',['2025-09-02','2025-09-09']),
    mkTested('3517 C','Crimson','#B7291F',groupName,'rejected',['2025-09-03','2025-09-10']),
    mkTested('543 C','Cornflower','#A4C8E1',groupName,'rejected',['2025-09-04','2025-09-11']),
    mkTested('1545 C','Cinnamon','#5C3A21',groupName,'rejected',['2025-09-08','2025-09-15']),
    mkTested('4635 C','Cognac','#8B5E3B',groupName,'rejected',['2025-09-09','2025-09-16']),
    mkTested('7485 C','Mint','#D0DEBB',groupName,'rejected',['2025-09-10','2025-09-17']),
    mkTested('7605 C','Blush','#DDBBB5',groupName,'rejected',['2025-09-15','2025-09-22']),
    mkTested('729 C','Caramel','#B58150',groupName,'rejected',['2025-09-16','2025-09-23']),
    mkTested('1895 C','Pink','#F5B6CD',groupName,'rejected',['2025-09-17','2025-09-24']),
    mkTested('2167 C','Misty Blue','#56708A',groupName,'rejected',['2025-09-22','2025-09-29']),
  ];
  let changed = false;
  additions.forEach(a=>{
    if(!existingCodes.includes(a.code)){
      colors.push(a);
      changed = true;
    }
  });
  if(changed){
    await saveColors();
  }
}

async function ensureStockColors(){
  const groupName = 'Stock Colors';
  const already = colors.some(c=>c.group===groupName);
  if(already) return;

  const dates = ['2025-01-06','2025-01-13','2025-01-14','2025-01-25','2025-01-26','2025-02-01','2025-02-02','2025-02-16','2025-02-17','2025-03-01'];
  const s = (o)=>[dates[o],dates[o+1]];

  const additions = [
    mk('Stone Matte','Stone Matte','#B8AEB0',groupName,'labdip1',s(0),s(2),s(4),s(6),s(8)),
    mk('Onyx Matte','Onyx Matte','#161513',groupName,'labdip1',s(0),s(2),s(4),s(6),s(8)),
    mk('Coffee','Coffee','#5C4130',groupName,'labdip1',s(0),s(2),s(4),s(6),s(8)),
    mk('Cherry','Cherry','#5C1F26',groupName,'labdip1',s(0),s(2),s(4),s(6),s(8)),
  ];
  additions[0].baseColor = '—';
  additions[1].baseColor = '—';
  additions[2].baseColor = '—';
  additions[3].baseColor = 'Onyx Matte';
  additions.forEach(a=>{ a.status = computeCurrentStage(a); });

  additions.forEach(a=>colors.push(a));
  await saveColors();
}

async function ensureClientC(){
  const groupName = 'Client C';
  const already = colors.some(c=>c.group===groupName);
  if(already) return;

  const additions = [
    mk('Client C Ultradark Blue','Client C Ultradark Blue','#0D1220',groupName,'labdip1',
      ['2026-08-24','2026-08-31'],['2026-09-01','2026-09-12'],['2026-09-13','2026-09-19'],['2026-09-20','2026-10-04'],['2026-10-05','2026-10-17']),
    mk('485 C','Client C Red','#DA291C',groupName,'labdip1',
      ['2026-08-25','2026-09-01'],['2026-09-02','2026-09-13'],['2026-09-14','2026-09-20'],['2026-09-21','2026-10-05'],['2026-10-06','2026-10-18']),
    mk('Client C Camel','Client C Camel','#7A4632',groupName,'labdip1',
      ['2026-08-26','2026-09-02'],['2026-09-03','2026-09-14'],['2026-09-15','2026-09-21'],['2026-09-22','2026-10-06'],['2026-10-07','2026-10-19']),
    mk('11-4800 TCX','White','#F2F0EA',groupName,'labdip1',
      ['2026-08-27','2026-09-03'],['2026-09-04','2026-09-15'],['2026-09-16','2026-09-22'],['2026-09-23','2026-10-07'],['2026-10-08','2026-10-20']),
  ];
  additions.forEach(a=>{ a.baseColor = '—'; a.status = computeCurrentStage(a); });
  additions.forEach(a=>colors.push(a));
  await saveColors();
}

async function ensureClientD(){
  const groupName = 'Client D';
  const already = colors.some(c=>c.group===groupName);
  if(already) return;

  const additions = [
    mk('CLD-01','Client D 1','#BD8A3F',groupName,'labdip1',
      ['2026-08-24','2026-08-31'],['2026-09-01','2026-09-12'],['2026-09-13','2026-09-19'],['2026-09-20','2026-10-04'],['2026-10-05','2026-10-17']),
    mk('CLD-02','Client D 2','#A96A2E',groupName,'labdip1',
      ['2026-08-25','2026-09-01'],['2026-09-02','2026-09-13'],['2026-09-14','2026-09-20'],['2026-09-21','2026-10-05'],['2026-10-06','2026-10-18']),
    mk('CLD-03','Client D 3','#4E3238',groupName,'labdip1',
      ['2026-08-26','2026-09-02'],['2026-09-03','2026-09-14'],['2026-09-15','2026-09-21'],['2026-09-22','2026-10-06'],['2026-10-07','2026-10-19']),
    mk('CLD-04','Client D 4','#352F34',groupName,'labdip1',
      ['2026-08-27','2026-09-03'],['2026-09-04','2026-09-15'],['2026-09-16','2026-09-22'],['2026-09-23','2026-10-07'],['2026-10-08','2026-10-20']),
    mk('CLD-05','Client D 5','#C11F26',groupName,'labdip1',
      ['2026-08-28','2026-09-04'],['2026-09-05','2026-09-16'],['2026-09-17','2026-09-23'],['2026-09-24','2026-10-08'],['2026-10-09','2026-10-21']),
    mk('CLD-06','Client D 6','#BE5A2E',groupName,'labdip1',
      ['2026-08-29','2026-09-05'],['2026-09-06','2026-09-17'],['2026-09-18','2026-09-24'],['2026-09-25','2026-10-09'],['2026-10-10','2026-10-22']),
    mk('CLD-07','Client D 7','#55643A',groupName,'labdip1',
      ['2026-08-30','2026-09-06'],['2026-09-07','2026-09-18'],['2026-09-19','2026-09-25'],['2026-09-26','2026-10-10'],['2026-10-11','2026-10-23']),
    mk('CLD-08','Client D 8','#4A4136',groupName,'labdip1',
      ['2026-08-31','2026-09-07'],['2026-09-08','2026-09-19'],['2026-09-20','2026-09-26'],['2026-09-27','2026-10-11'],['2026-10-12','2026-10-24']),
  ];
  additions[7].metallic = true;
  const baseMap = ['Saddle','Saddle','Onyx Matte','Onyx Matte','Ruby','Saddle','Emerald','Onyx Matte'];
  additions.forEach((a,i)=>{ a.baseColor = baseMap[i]; a.status = computeCurrentStage(a); });
  additions.forEach(a=>colors.push(a));
  await saveColors();
}

const BASE_COLOR_MAP = {
  'Signature Stone|5793 C':'Stone Matte','Signature Stone|7536 C':'Stone Matte',
  'Signature Stone|5575 C':'Stone Matte','Signature Stone|651 C':'Stone Matte',
  'Signature Stone|4092 C':'Stone Matte','Signature Stone|4081 C':'Stone Matte',
  'Signature Stone|665 C':'Stone Matte','Signature Stone|535 C':'Stone Matte',
  'Luxe Off-White|7401 C':'Stone Matte','Luxe Off-White|7485 C':'Stone Matte',
  'Luxe Off-White|543 C':'Stone Matte','Luxe Off-White|503 C':'Stone Matte',
  'Luxe Off-White|263 C':'Stone Matte','Luxe Off-White|1895 C':'Stone Matte',
  'Luxe Off-White|11-4201 TCX':'Stone Matte',
  'Luxe Natural|6030 C':'Coffee','Luxe Natural|4655 C':'Coffee',
  'Luxe Natural|2317 C':'Saddle','Luxe Natural|729 C':'Saddle',
  'Luxe Natural|5025 C':'Stone Matte',
  'Luxe Metallic|20-0033 TPM':'Stone Matte','Luxe Metallic|20-0038 TPM':'Stone Matte',
  'Luxe Metallic|20-0006 TPM':'Stone Matte','Luxe Metallic|20-0013 TPM':'Onyx Matte',
  'Color Expansion FW|4625 C':'Onyx Matte','Color Expansion FW|567 C':'Onyx Matte',
  'Color Expansion FW|289 C':'Onyx Matte','Color Expansion FW|5753 C':'Onyx Matte',
  'Color Expansion FW|504 C':'Onyx Matte',
  'Initial Color Test|7687 C':'Onyx Matte','Initial Color Test|3517 C':'Onyx Matte',
  'Initial Color Test|543 C':'Stone Matte','Initial Color Test|1545 C':'Coffee',
  'Initial Color Test|4635 C':'Coffee','Initial Color Test|7485 C':'Stone Matte',
  'Initial Color Test|7605 C':'Stone Matte','Initial Color Test|729 C':'Saddle',
  'Initial Color Test|1895 C':'Stone Matte','Initial Color Test|2167 C':'Onyx Matte',
};

async function ensureSpecialColors(){
  const groupName = 'Client A Event';
  const existingNames = colors.map(c=>c.name);
  const additions = [];
  if(!existingNames.includes('Client A Green')){
    additions.push(mk('Client A Green','Client A Green','#2F5233',groupName,'labdip1',
      ['2026-08-24','2026-08-31'],['2026-09-01','2026-09-12'],['2026-09-13','2026-09-19'],['2026-09-20','2026-10-04'],['2026-10-05','2026-10-17']));
  }
  if(!existingNames.includes('Uncaged Orange')){
    additions.push(mk('Uncaged Orange','Uncaged Orange','#ED6A2C',groupName,'labdip1',
      ['2026-08-25','2026-09-01'],['2026-09-02','2026-09-13'],['2026-09-14','2026-09-20'],['2026-09-21','2026-10-05'],['2026-10-06','2026-10-18']));
  }
  if(additions.length){
    additions.forEach(a=>{
      a.baseColor = a.name === 'Uncaged Orange' ? '—' : 'Emerald';
      a.status = computeCurrentStage(a);
    });
    additions.forEach(a=>colors.push(a));
    await saveColors();
  }
}

async function ensureBaseColors(){
  let changed = false;
  colors.forEach(c=>{
    if(c.baseColor) return;
    const key = `${c.group}|${c.code}`;
    c.baseColor = BASE_COLOR_MAP[key] || '—';
    changed = true;
  });
  if(changed){
    await saveColors();
  }
}

async function ensureDecemberAdditions(){
  let flag = null;
  try{
    const res = await window.storage.get('decemberAdditionsV1', false);
    if(res && res.value) flag = res.value;
  }catch(e){ /* not found */ }
  if(flag === 'done') return;

  const groupName = 'SS27';
  if(!colors.some(c=>c.group===groupName && c.name==='Natural')){
    const natural = mk('719 C','Natural','#EFD0AD',groupName,'labdip1',
      ['2026-10-12','2026-10-19'],['2026-10-20','2026-10-31'],['2026-11-01','2026-11-07'],['2026-11-08','2026-11-22'],['2026-11-23','2026-12-05']);
    natural.baseColor = 'Stone Matte';
    natural.status = computeCurrentStage(natural);
    colors.push(natural);
  }
  if(!colors.some(c=>c.group===groupName && c.name==='Onyx Matte')){
    const src = colors.find(c=>c.group==='Stock Colors' && c.name==='Onyx Matte');
    const onyx = src ? JSON.parse(JSON.stringify(src))
                     : mk('Onyx Matte','Onyx Matte','#161513',groupName,'colorcard',
                          ['2025-01-06','2025-01-13'],['2025-01-14','2025-01-25'],['2025-01-26','2025-02-01'],['2025-02-02','2025-02-16'],['2025-02-17','2025-03-01']);
    onyx.id = 'Onyx_Matte_' + Math.random().toString(36).slice(2,7);
    onyx.group = groupName;
    if(!onyx.baseColor) onyx.baseColor = '—';
    colors.push(onyx);
  }
  await saveColors();
  try{ await window.storage.set('decemberAdditionsV1', 'done', false); }catch(e){ console.error('Storage error', e); }
}

async function ensureLuxeNaturalRestored(){
  const groupName = 'Luxe Natural';
  const existingCodes = colors.filter(c=>c.group===groupName).map(c=>c.code);
  const originals = [
    mk('6030 C','Rose Sand','#C69F90',groupName,'labdip1',
      ['2026-08-24','2026-08-31'],['2026-09-01','2026-09-12'],['2026-09-13','2026-09-19'],['2026-09-20','2026-10-04'],['2026-10-05','2026-10-17']),
    mk('4655 C','Camel','#BF9474',groupName,'labdip1',
      ['2026-07-22','2026-07-29'],['2026-07-30','2026-08-09'],['2026-08-10','2026-08-15'],['2026-08-16','2026-08-30'],['2026-08-31','2026-09-11']),
    mk('2317 C','Toffee','#B4875E',groupName,'labdip1',
      ['2026-08-25','2026-09-01'],['2026-09-02','2026-09-13'],['2026-09-14','2026-09-20'],['2026-09-21','2026-10-05'],['2026-10-06','2026-10-18']),
    mk('729 C','Amber Tan','#B58150',groupName,'labdip1',
      ['2026-08-26','2026-09-02'],['2026-09-03','2026-09-14'],['2026-09-15','2026-09-21'],['2026-09-22','2026-10-06'],['2026-10-07','2026-10-19']),
    mk('5025 C','5025 C','#EEC7C9',groupName,'labdip1',
      ['2026-08-27','2026-09-03'],['2026-09-04','2026-09-15'],['2026-09-16','2026-09-22'],['2026-09-23','2026-10-07'],['2026-10-08','2026-10-20']),
  ];
  const baseMap = {'6030 C':'Coffee','4655 C':'Coffee','2317 C':'Saddle','729 C':'Saddle','5025 C':'Stone Matte'};
  let changed = false;
  originals.forEach(o=>{
    if(!existingCodes.includes(o.code)){
      o.baseColor = baseMap[o.code];
      o.status = computeCurrentStage(o);
      colors.push(o);
      changed = true;
    }
  });
  if(changed){
    await saveColors();
  }
}

async function ensureLuxeOffWhiteRestored(){
  const groupName = 'Luxe Off-White';
  const existingCodes = colors.filter(c=>c.group===groupName).map(c=>c.code);
  const originals = [
    mk('7401 C','Champagne','#F5E1A4',groupName,'labdip1',
      ['2026-07-15','2026-07-22'],['2026-07-23','2026-08-02'],['2026-08-03','2026-08-08'],['2026-08-09','2026-08-23'],['2026-08-24','2026-09-04']),
    mk('7485 C','Sage Mist','#D0DEBB',groupName,'labdip1',
      ['2026-08-17','2026-08-24'],['2026-08-25','2026-09-05'],['2026-09-06','2026-09-12'],['2026-09-13','2026-09-27'],['2026-09-28','2026-10-10']),
    mk('543 C','Sky Blue','#A4C8E1',groupName,'labdip1',
      ['2026-08-18','2026-08-25'],['2026-08-26','2026-09-06'],['2026-09-08','2026-09-14'],['2026-09-15','2026-09-29'],['2026-09-30','2026-10-12']),
    mk('503 C','Blush','#E9C5C7',groupName,'labdip1',
      ['2026-08-19','2026-08-26'],['2026-08-27','2026-09-07'],['2026-09-09','2026-09-15'],['2026-09-16','2026-09-30'],['2026-10-01','2026-10-13']),
    mk('263 C','Lilac','#D7C6E6',groupName,'labdip1',
      ['2026-09-02','2026-09-09'],['2026-09-10','2026-09-21'],['2026-09-22','2026-09-28'],['2026-09-29','2026-10-13'],['2026-10-14','2026-10-26']),
    mk('1895 C','Petal Pink','#F5B6CD',groupName,'labdip1',
      ['2026-08-20','2026-08-27'],['2026-08-28','2026-09-08'],['2026-09-10','2026-09-16'],['2026-09-17','2026-10-01'],['2026-10-02','2026-10-14']),
    mk('11-4201 TCX','Cloud Dancer','#EDEBE3',groupName,'labdip1',
      ['2026-07-10','2026-07-17'],['2026-07-18','2026-07-28'],['2026-07-29','2026-08-03'],['2026-08-04','2026-08-18'],['2026-08-19','2026-08-30']),
  ];
  let changed = false;
  originals.forEach(o=>{
    if(!existingCodes.includes(o.code)){
      o.baseColor = 'Stone Matte';
      o.status = computeCurrentStage(o);
      colors.push(o);
      changed = true;
    }
  });
  if(changed){
    await saveColors();
  }
}
