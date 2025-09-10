// Avatly PWA – client-only prototype
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const db = {
  items: JSON.parse(localStorage.getItem('av_items') || '[]'),
  outfits: JSON.parse(localStorage.getItem('av_outfits') || '[]'),
  avatar: JSON.parse(localStorage.getItem('av_avatar') || '{"height":null,"weight":null,"shape":"dritta","style":""}'),
  settings: JSON.parse(localStorage.getItem('av_settings') || '{"profileName":"Avatly user","unit":"metric","city":"","lat":null,"lon":null}'),
  weather: null
};
function save(k){ localStorage.setItem('av_'+k, JSON.stringify(db[k])); }

// Tabs
$$('.tab').forEach(b=>b.addEventListener('click', ()=>{
  $$('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $$('.panel').forEach(p=>p.classList.remove('active'));
  $('#'+b.dataset.tab).classList.add('active');
}));

// ---------- WARDROBE ----------
const itemForm = $('#itemForm');
const wardrobeList = $('#wardrobeList');
const filterText = $('#filterText');
const filterCat = $('#filterCat');

itemForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(itemForm);
  let photoData = '';
  const file = fd.get('photo');
  if(file && file.size){
    photoData = await toBase64(file);
  }
  const it = {
    id: crypto.randomUUID(),
    photo: photoData,
    name: fd.get('name').trim(),
    category: fd.get('category'),
    color: (fd.get('color')||'').trim(),
    warmth: Number(fd.get('warmth')||3),
    waterproof: fd.get('waterproof')==='yes',
    tags: (fd.get('tags')||'').trim(),
    note: (fd.get('note')||'').trim(),
    ts: Date.now()
  };
  db.items.unshift(it); save('items'); itemForm.reset(); renderWardrobe();
});

function toBase64(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}

function renderWardrobe(){
  const q = (filterText.value||'').toLowerCase();
  const cat = filterCat.value;
  const items = db.items.filter(it=>{
    const matchTxt = (it.name+' '+it.color+' '+it.tags).toLowerCase().includes(q);
    const matchCat = cat ? it.category===cat : true;
    return matchTxt && matchCat;
  });
  if(!items.length){ wardrobeList.innerHTML = '<p class="small">Nessun capo trovato.</p>'; return; }
  wardrobeList.innerHTML = items.map(it=>`
    <div class="card-tile" data-id="${it.id}">
      ${it.photo ? `<img src="${it.photo}" alt="${it.name}">` : `<div style="height:180px;border:1px dashed #e4dafc;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#6b5bb0">Nessuna foto</div>`}
      <div class="title" style="margin-top:8px">${it.name}</div>
      <div class="small">${it.category} • ${it.color || '—'} ${it.tags?('• '+it.tags):''}</div>
      <div class="small">Calore ${it.warmth} ${it.waterproof?'• Impermeabile':''}</div>
      <div class="actions">
        <button class="btn" data-add="${it.id}">Aggiungi a Mix</button>
        <button class="btn" data-del="${it.id}">Elimina</button>
      </div>
    </div>
  `).join('');
  wardrobeList.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-del');
    db.items = db.items.filter(x=>x.id!==id); save('items'); renderWardrobe(); refreshSelectors();
  }));
  wardrobeList.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click', ()=>{
    const it = db.items.find(x=>x.id===b.getAttribute('data-add'));
    quickAddToMix(it);
  }));
}
filterText.addEventListener('input', renderWardrobe);
filterCat.addEventListener('change', renderWardrobe);
renderWardrobe();

// ---------- AVATAR ----------
$('#height').value = db.avatar.height || '';
$('#weight').value = db.avatar.weight || '';
$('#shape').value = db.avatar.shape || 'dritta';
$('#style').value = db.avatar.style || '';

$('#saveAvatar').addEventListener('click', ()=>{
  db.avatar.height = Number($('#height').value) || null;
  db.avatar.weight = Number($('#weight').value) || null;
  db.avatar.shape = $('#shape').value;
  db.avatar.style = $('#style').value.trim();
  save('avatar');
  $('#sizeAdvice').innerHTML = sizeAdvice();
});

function sizeAdvice(){
  const h = db.avatar.height, w = db.avatar.weight, s = db.avatar.shape;
  if(!h || !w) return 'Consiglio taglie: inserisci altezza e peso per un suggerimento indicativo.';
  const bmi = w / ((h/100)*(h/100));
  let hint = 'Fit consigliato: ';
  if(bmi<18.5) hint += 'tagli regolari o leggermente oversize (evita troppo aderente)';
  else if(bmi<25) hint += 'true-to-size';
  else hint += 'mezza taglia in più / fit comodo';
  hint += `. Shape ${s}: bilancia volumi (es. `;
  if(s==='pera') hint += 'spalle strutturate, vita evidenziata';
  if(s==='mela') hint += 'linee verticali, scolli a V';
  if(s==='clessidra') hint += 'cinture/struttura in vita';
  if(s==='dritta') hint += 'layer per creare definizione';
  if(s==='triangolo') hint += 'volumi inferiori più asciutti';
  hint += ').';
  return hint;
}
$('#sizeAdvice').innerHTML = sizeAdvice();

// ---------- ARMOCROMIA (base euristica) ----------
$('#analyzeColor').addEventListener('click', ()=>{
  const skin = $('#skinColor').value; // hex
  const hair = $('#hair').value;
  const eyes = $('#eyes').value;
  const season = guessSeason(skin, hair, eyes);
  const pal = palettes[season] || palettes['Neutro'];
  $('#seasonResult').innerHTML = `<div><strong>Stagione:</strong> ${season}</div>
    <div class="swatches">${pal.colors.map(c=>`<div class="swatch" style="background:${c}" title="${c}"></div>`).join('')}</div>
    <div class="small">Consigli: ${pal.tips}</div>`;
});

function hexToRgb(hex){
  const r = parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return {r,g,b};
}
function guessSeason(skinHex, hair, eyes){
  const {r,g,b} = hexToRgb(skinHex);
  const avg = (r+g+b)/3;
  const coolScore = (Math.max(r,g,b)===b ? 1:0) + (g>r?0.5:0) + (eyes.includes('freddi')?0.7:0) + (hair.includes('freddi')?0.7:0);
  const warmScore = (r>g?0.5:0) + (hair.includes('caldi')?0.7:0) + (eyes.includes('caldi')?0.6:0) + (hair.includes('rossi')?0.6:0);
  if(avg>220 && coolScore>warmScore) return 'Estate';
  if(avg>220 && warmScore>=coolScore) return 'Primavera';
  if(avg<140 && coolScore>warmScore) return 'Inverno';
  if(avg<140 && warmScore>=coolScore) return 'Autunno';
  // neutro
  return warmScore>coolScore ? 'Primavera' : 'Estate';
}
const palettes = {
  'Inverno': { colors:['#000000','#1E3A8A','#5B21B6','#0EA5E9','#E11D48','#f0f0f0'], tips:'toni freddi, intensi, contrasti netti; evita beige caldi.'},
  'Estate': { colors:['#6B7280','#64748B','#60A5FA','#93C5FD','#A78BFA','#FCE7F3'], tips:'freddi e soft (polverosi); punta su lavanda, rosa cipria, azzurri.'},
  'Autunno': { colors:['#78350F','#92400E','#B45309','#A3E635','#22C55E','#F59E0B'], tips:'caldi e profondi; terracotta, oliva, senape, oro.'},
  'Primavera': { colors:['#F59E0B','#F97316','#10B981','#34D399','#F472B6','#fde68a'], tips:'caldi e brillanti; corallo, pesca, verde menta.'},
  'Neutro': { colors:['#6b7280','#94a3b8','#d1d5db','#f3f4f6','#e5e7eb','#111827'], tips:'neutri versatili; bilancia freddo/caldo con accessori.'}
};

// ---------- MIX & MATCH ----------
const selTop = $('#selTop'), selBottom = $('#selBottom'), selDress = $('#selDress'), selOuter = $('#selOuter'), selShoes = $('#selShoes'), selAcc = $('#selAcc');
function refreshSelectors(){
  const byCat = cat => db.items.filter(i=>i.category===cat);
  function fill(sel, items){
    sel.innerHTML = '<option value="">—</option>' + items.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
  }
  fill(selTop, byCat('top'));
  fill(selBottom, byCat('bottom'));
  fill(selDress, byCat('dress'));
  fill(selOuter, byCat('outerwear'));
  fill(selShoes, byCat('shoes'));
  fill(selAcc, byCat('accessory'));
}
function quickAddToMix(it){
  const map = {top:selTop, bottom:selBottom, dress:selDress, outerwear:selOuter, shoes:selShoes, accessory:selAcc};
  refreshSelectors();
  if(map[it.category]){ map[it.category].value = it.id; }
}
refreshSelectors();

$('#composeOutfit').addEventListener('click', ()=>{
  const ids = [selDress.value||'', selTop.value||'', selBottom.value||'', selOuter.value||'', selShoes.value||'', selAcc.value||''].filter(Boolean);
  const picks = ids.map(id=>db.items.find(i=>i.id===id)).filter(Boolean);
  if(!picks.length){ alert('Seleziona almeno 2 capi'); return; }
  const outfit = { id: crypto.randomUUID(), items: picks, ts: Date.now() };
  db.outfits.unshift(outfit); save('outfits'); renderSavedOutfits();
  $('#mixPreview').innerHTML = renderOutfitCard(picks, 'Nuovo outfit salvato');
});

function renderOutfitCard(items, title){
  const warmth = items.reduce((s,i)=>s+(i.warmth||3),0);
  const hasWP = items.some(i=>i.waterproof);
  return `<div class="outfit">
    <div><strong>${title}</strong> <span class="badge">Calore ${warmth}</span> ${hasWP?'<span class="badge">Pioggia ok</span>':''}</div>
    <ul>${items.map(i=>`<li>${i.name} <span class="small">(${i.category}${i.color?(', '+i.color):''})</span></li>`).join('')}</ul>
  </div>`;
}
function renderSavedOutfits(){
  const cont = $('#savedOutfits');
  if(!db.outfits.length){ cont.innerHTML = '<p class="small">Nessun outfit salvato.</p>'; return; }
  cont.innerHTML = db.outfits.map(o=>`
    <div class="card-tile">
      ${renderOutfitCard(o.items, 'Outfit')}
      <div class="actions"><button class="btn" data-del="${o.id}">Elimina</button></div>
    </div>
  `).join('');
  cont.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-del');
    db.outfits = db.outfits.filter(x=>x.id!==id); save('outfits'); renderSavedOutfits();
  }));
}
renderSavedOutfits();

// ---------- HOME / METEO + daily generator ----------
async function geocodeCity(q){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=it&format=json`;
  const res = await fetch(url); if(!res.ok) throw new Error('Errore geocoding');
  const j = await res.json();
  const r = j.results && j.results[0]; if(!r) throw new Error('Località non trovata');
  return { lat: r.latitude, lon: r.longitude, name: `${r.name}${r.country_code?(', '+r.country_code):''}` };
}
async function fetchWeather(lat, lon){
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    hourly: 'temperature_2m,precipitation,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Errore meteo');
  return await res.json();
}
function cToF(c){ return (c*9/5)+32; }
function formatTemp(c){ return db.settings.unit==='imperial'? Math.round(cToF(c))+'°F' : Math.round(c)+'°C'; }
function wxSummary(){
  if(!db.weather){ return '<p class="small">Nessun dato meteo. Usa GPS o inserisci una città.</p>'; }
  const d = db.weather.daily;
  const tmax = d.temperature_2m_max[0], tmin = d.temperature_2m_min[0];
  const rain = d.precipitation_probability_max[0] || 0;
  const wind = d.wind_speed_10m_max[0] || 0;
  return `<div><strong>Località:</strong> ${db.settings.city || 'GPS'}</div>
    <div><strong>Oggi:</strong> min ${formatTemp(tmin)} • max ${formatTemp(tmax)} • pioggia ${rain}% • vento max ${Math.round(wind)} km/h</div>`;
}
function renderWeather(){ $('#wxSummary').innerHTML = wxSummary(); }

async function setCityByQuery(q){
  const g = await geocodeCity(q);
  db.settings.city = g.name; db.settings.lat = g.lat; db.settings.lon = g.lon; save('settings');
  db.weather = await fetchWeather(g.lat, g.lon);
  renderWeather(); generateTodayOutfits();
}

$('#cityForm').addEventListener('submit', e=>{ e.preventDefault(); const q = $('#cityInput').value.trim(); if(q) setCityByQuery(q); });
$('#useGPS').addEventListener('click', ()=>{
  if(!navigator.geolocation){ alert('GPS non disponibile'); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude, longitude} = pos.coords;
    db.settings.city = 'GPS'; db.settings.lat = latitude; db.settings.lon = longitude; save('settings');
    db.weather = await fetchWeather(latitude, longitude); renderWeather(); generateTodayOutfits();
  }, ()=> alert('Impossibile ottenere la posizione'));
});
$('#refreshWx').addEventListener('click', async ()=>{
  if(db.settings.lat && db.settings.lon){ db.weather = await fetchWeather(db.settings.lat, db.settings.lon); renderWeather(); generateTodayOutfits(); }
});

function generateTodayOutfits(){
  const cont = $('#todayOutfits');
  const sets = generateOutfitsBasedOnWeather();
  if(!sets.length){ cont.innerHTML = '<p class="small">Aggiungi qualche capo al guardaroba per generare outfit.</p>'; return; }
  cont.innerHTML = sets.map((o,i)=>renderOutfitCard(o, 'Outfit '+(i+1))).join('');
}
$('#genToday').addEventListener('click', generateTodayOutfits);

function generateOutfitsBasedOnWeather(){
  if(db.items.length===0) return [];
  const d = db.weather && db.weather.daily;
  const tmax = d ? d.temperature_2m_max[0] : 22;
  const tmin = d ? d.temperature_2m_min[0] : 16;
  const rain = d ? (d.precipitation_probability_max[0]||0) : 0;
  const tavg = (tmax+tmin)/2;
  const raining = rain>=40;

  const tops = db.items.filter(i=>i.category==='top');
  const bottoms = db.items.filter(i=>i.category==='bottom');
  const dresses = db.items.filter(i=>i.category==='dress');
  const outer = db.items.filter(i=>i.category==='outerwear');
  const shoes = db.items.filter(i=>i.category==='shoes');
  const acc = db.items.filter(i=>i.category==='accessory');

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function compose(){
    let o = [];
    if(dresses.length && Math.random()<0.3){ o.push(pick(dresses)); }
    else { if(tops.length) o.push(pick(tops)); if(bottoms.length) o.push(pick(bottoms)); }
    if(tavg<18 && outer.length) o.push(pick(outer));
    if(shoes.length) o.push(pick(shoes));
    if(acc.length && Math.random()<0.5) o.push(pick(acc));

    if(raining && !o.some(i=>i.waterproof)){
      const wp = [...outer,...shoes].filter(i=>i.waterproof);
      if(wp.length) o.push(pick(wp));
    }
    // warm/cold adjust
    const warmth = o.reduce((s,i)=>s+(i.warmth||3),0);
    if(tavg>=25 && warmth>7){ o = o.filter(i=>i.category!=='outerwear'); }
    if(tavg<12 && outer.length && !o.some(i=>i.category==='outerwear')) o.push(pick(outer));
    return o;
  }

  const results = [];
  const keys = new Set();
  let guard=0;
  while(results.length<3 && guard<30){
    guard++;
    const o = compose();
    const key = o.map(i=>i.id).sort().join('-');
    if(o.length>=3 && !keys.has(key)){ keys.add(key); results.push(o); }
  }
  return results;
}

// ---------- SEARCH (mock offline suggestions) ----------
$('#runSearch').addEventListener('click', ()=>{
  const color = ($('#qColor').value||'').toLowerCase();
  const cat = $('#qCat').value;
  const brand = $('#qBrand').value;
  const res = db.items.filter(i=>{
    const okColor = color ? (i.color||'').toLowerCase().includes(color) : true;
    const okCat = cat ? i.category===cat : true;
    return okColor && okCat;
  }).slice(0,8);
  const container = $('#searchResults');
  if(!res.length){
    container.innerHTML = '<p class="small">Nessun capo nel tuo guardaroba corrisponde. Idee shop: cerca "'+[brand||'Zara', color || 'lavanda', cat||'top'].filter(Boolean).join(' ')+'" sul tuo store preferito.</p>';
    return;
  }
  container.innerHTML = res.map(i=>`
    <div class="card-tile">
      ${i.photo ? `<img src="${i.photo}">` : `<div style="height:180px;border:1px dashed #e4dafc;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#6b5bb0">Nessuna foto</div>`}
      <div class="title">${i.name}</div>
      <div class="small">${i.category} • ${i.color||'—'}</div>
    </div>
  `).join('');
});

// ---------- SETTINGS ----------
$('#profileName').value = db.settings.profileName || 'Avatly user';
$('#unit').value = db.settings.unit || 'metric';
$('#saveSettings').addEventListener('click', ()=>{
  db.settings.profileName = $('#profileName').value.trim() || 'Avatly user';
  db.settings.unit = $('#unit').value;
  save('settings'); alert('Impostazioni salvate ✓');
});
$('#exportData').addEventListener('click', ()=>{
  const data = {items:db.items, outfits:db.outfits, avatar:db.avatar, settings:db.settings};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
  a.download = 'avatly-data.json'; a.click();
});
$('#importBtn').addEventListener('click', ()=> $('#importData').click());
$('#importData').addEventListener('change', async e=>{
  const f = e.target.files[0]; if(!f) return;
  try{
    const json = JSON.parse(await f.text());
    if(json.items) db.items = json.items;
    if(json.outfits) db.outfits = json.outfits;
    if(json.avatar) db.avatar = json.avatar;
    if(json.settings) db.settings = json.settings;
    save('items'); save('outfits'); save('avatar'); save('settings');
    renderWardrobe(); renderSavedOutfits(); refreshSelectors(); renderWeather();
    alert('Dati importati ✓');
  }catch(_){ alert('File non valido'); }
});

// ---------- INIT / PWA ----------
(async function init(){
  if(db.settings.lat && db.settings.lon){
    try{ db.weather = await fetchWeather(db.settings.lat, db.settings.lon); } catch(_){}
  }
  renderWeather();
})();

// install prompt + SW
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false;
});
$('#installBtn').addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if(outcome==='accepted'){ $('#installBtn').hidden = true; }
  deferredPrompt = null;
});
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js'));
}
