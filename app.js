// Avatly v0.1 – PWA client-only (login mock). In v1: auth Apple/Google/Email reali + cloud.

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const DB = {
  user: JSON.parse(localStorage.getItem('av_user') || 'null'),
  items: JSON.parse(localStorage.getItem('av_items') || '[]'),
  categories: JSON.parse(localStorage.getItem('av_categories') || '["top","bottom","dress","outerwear","shoes","bag","accessories"]'),
  plan: JSON.parse(localStorage.getItem('av_plan') || '{}'),
  settings: JSON.parse(localStorage.getItem('av_settings') || '{"profileName":"","theme":"monelia"}'),
  weather: null
};
function save(k){ localStorage.setItem('av_'+k, JSON.stringify(DB[k])); }

// ——— Splash: nasconde dopo 2.5s
window.addEventListener("load", () => {
  setTimeout(() => {
    const s = document.getElementById("introSplash");
    if (s) s.style.display = "none";
  }, 2500);
});

// ——— LOGIN (mock)
function showApp(){
  $('#splash').hidden = true;
  $('#appHeader').hidden = false; $('#appMain').hidden = false; $('#appFooter').hidden = false;
  renderCategories(); renderItems(); renderPlanner(); renderWeather();
}
function loginMock(type){
  DB.user = { id: crypto.randomUUID(), provider:type, email: $('#email')?.value || '' };
  save('user'); showApp();
}
if(DB.user){ showApp(); }
$('#loginApple')?.addEventListener('click', ()=> loginMock('apple'));
$('#loginGoogle')?.addEventListener('click', ()=> loginMock('google'));
$('#loginEmail')?.addEventListener('click', ()=>{
  if(!$('#email').value || !$('#password').value){ alert('Inserisci email e password'); return; }
  loginMock('email');
});

// ——— Tabs
$$('.tab').forEach(b=>b?.addEventListener('click', ()=>{
  $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  $$('.panel').forEach(p=>p.classList.remove('active')); $('#'+b.dataset.tab).classList.add('active');
}));

// ——— Categories
function renderCategories(){
  const sel = $('#newCategory'); sel.innerHTML = '';
  DB.categories.forEach(c=> sel.innerHTML += `<option value="${c}">${c}</option>`);
  const editSel = $('#editCategory'); if(editSel){
    editSel.innerHTML = '';
    DB.categories.forEach(c=> editSel.innerHTML += `<option value="${c}">${c}</option>`);
  }
  const catList = $('#catList');
  if(catList){
    catList.innerHTML = DB.categories.map(c=>`<div><label><input type="checkbox" class="catFilter" value="${c}"> ${c}</label></div>`).join('');
    $$('.catFilter').forEach(cb=> cb.addEventListener('change', renderItems));
  }
}
$('#addCatBtn')?.addEventListener('click', ()=>{
  const name = prompt('Nome nuova categoria (es. palestra)')?.trim();
  if(!name) return;
  if(!DB.categories.includes(name)){ DB.categories.push(name); save('categories'); renderCategories(); }
});

// ——— Items
function toDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
$('#addItemBtn')?.addEventListener('click', async ()=>{
  const cat = $('#newCategory').value;
  const color = $('#newColor').value.trim();
  let photo='';
  const f = $('#newPhoto').files[0];
  if(f) photo = await toDataURL(f);
  DB.items.unshift({ id: crypto.randomUUID(), cat, color, photo, ts: Date.now() });
  save('items'); $('#newColor').value=''; $('#newPhoto').value=''; renderItems();
});

function renderItems(){
  const cats = Array.from(document.querySelectorAll('.catFilter:checked')).map(x=>x.value);
  const q = ($('#searchTxt')?.value || '').toLowerCase();
  let arr = DB.items.slice();
  if(cats.length) arr = arr.filter(i=> cats.includes(i.cat));
  if(q) arr = arr.filter(i=> (i.color||'').toLowerCase().includes(q));
  const g = $('#itemsGrid'); if(!g) return;
  if(!arr.length){ g.innerHTML = '<p class="small muted">Nessun capo. Aggiungine uno sopra.</p>'; return; }
  g.innerHTML = arr.map(i=>`
    <div class="item-card" data-id="${i.id}">
      <div class="item-thumb" style="background-image:url('${i.photo||""}')"></div>
      <div class="item-body">
        <div><span class="badge">${i.cat}</span> ${i.color||''}</div>
      </div>
    </div>
  `).join('');
  g.querySelectorAll('.item-card').forEach(card=> attachLongPress(card));
}
$('#searchTxt')?.addEventListener('input', renderItems);
$('#clearFilters')?.addEventListener('click', ()=>{ $$('.catFilter').forEach(c=>c.checked=false); $('#searchTxt').value=''; renderItems(); });

// ——— Long Press
let lpTimer=null;
function attachLongPress(el){
  el.addEventListener('touchstart', onStart);
  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchend', onEnd);
  el.addEventListener('mouseup', onEnd);
  function onStart(e){ e.preventDefault(); lpTimer = setTimeout(()=> openSheet(el), 450); }
  function onEnd(){ clearTimeout(lpTimer); }
}
function openSheet(el){
  const id = el.getAttribute('data-id');
  const it = DB.items.find(x=>x.id===id); if(!it) return;
  $('#lpThumb').style.backgroundImage = `url('${it.photo||""}')`;
  $('#lpTitle').textContent = it.cat;
  $('#lpDetails').textContent = it.color || '—';
  $('#lpOverlay').style.display='block'; $('#lpSheet').style.display='block';
  $('#lpCloseBtn').onclick = closeSheet;
  $('#lpDeleteBtn').onclick = ()=>{ DB.items = DB.items.filter(x=>x.id!==id); save('items'); closeSheet(); renderItems(); };
  $('#lpMoveBtn').onclick = ()=>{ closeSheet(); openEdit(it); };
  $('#lpEditBtn').onclick = ()=>{ closeSheet(); openEdit(it); };
}
function closeSheet(){ $('#lpOverlay').style.display='none'; $('#lpSheet').style.display='none'; }

// ——— Edit
let editingId=null;
function openEdit(it){
  editingId = it.id;
  renderCategories();
  $('#editCategory').value = it.cat;
  $('#editColor').value = it.color || '';
  $('#editSheet').style.display='block'; $('#lpOverlay').style.display='block';
  $('#saveEditBtn').onclick = async ()=>{
    const item = DB.items.find(x=>x.id===editingId); if(!item) return;
    item.cat = $('#editCategory').value;
    item.color = $('#editColor').value.trim();
    const f = $('#editPhoto').files[0];
    if(f){ item.photo = await toDataURL(f); }
    save('items'); closeEdit(); renderItems();
  };
  $('#cancelEditBtn').onclick = closeEdit;
}
function closeEdit(){ $('#editSheet').style.display='none'; $('#lpOverlay').style.display='none'; editingId=null; }

// ——— Meteo (Open-Meteo)
async function geocodeCity(q){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=it&format=json`;
  const r = await fetch(url); const j = await r.json(); return j.results?.[0] || null;
}
async function fetchWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
  const r = await fetch(url); return await r.json();
}
function renderWeather(){
  if(!DB.weather){ const box=$('#wxBox'); if(box) box.textContent='Nessun dato meteo.'; return; }
  const d = DB.weather.daily;
  const box = $('#wxBox'); if(!box) return;
  box.textContent = `min ${Math.round(d.temperature_2m_min[0])}°C • max ${Math.round(d.temperature_2m_max[0])}°C • pioggia ${(d.precipitation_probability_max[0]||0)}% • vento max ${Math.round(d.wind_speed_10m_max[0]||0)} km/h`;
}
$('#useGPS')?.addEventListener('click', ()=>{
  if(!navigator.geolocation){ alert('GPS non disponibile'); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude, longitude} = pos.coords;
    DB.weather = await fetchWeather(latitude, longitude); renderWeather();
  }, ()=> alert('Impossibile ottenere la posizione'));
});
$('#setCity')?.addEventListener('click', async ()=>{
  const q = $('#cityInput').value.trim(); if(!q) return;
  const g = await geocodeCity(q); if(!g){ alert('Località non trovata'); return; }
  DB.weather = await fetchWeather(g.latitude, g.longitude); renderWeather();
});

// ——— Outfit (euristica + meteo)
function aiText(o){
  const rain = DB.weather?.daily?.precipitation_probability_max?.[0] || 0;
  const tip = rain>=40 ? 'Oggi piove, punta su capi impermeabili.' : 'Tempo ok, scegli capi comodi e stratifica se serve.';
  const names = o.map(i=> i.color ? `${i.cat} ${i.color}` : i.cat).join(' + ');
  return `${tip} Consiglio: ${names}.`;
}
function generateOutfits(){
  const by = c => DB.items.filter(i=>i.cat===c);
  const results = [];
  let guard=0;
  while(results.length<3 && guard<50){
    guard++;
    let o = [];
    if(by('dress').length && Math.random()<0.35) o.push(pick(by('dress')));
    else { if(by('top').length) o.push(pick(by('top'))); if(by('bottom').length) o.push(pick(by('bottom'))); }
    if(by('outerwear').length && Math.random()<0.5) o.push(pick(by('outerwear')));
    if(by('shoes').length) o.push(pick(by('shoes')));
    if(by('bag').length && Math.random()<0.5) o.push(pick(by('bag')));
    if(by('accessories').length && Math.random()<0.4) o.push(pick(by('accessories')));
    const key = o.map(x=>x.id).sort().join('-');
    if(o.length>=3 && !results.some(r=> r.key===key)){ results.push({key, items:o}); }
  }
  return results;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
$('#genOutfitsBtn')?.addEventListener('click', ()=>{
  const sets = generateOutfits();
  const cont = $('#outfitList'); cont.innerHTML='';
  if(!sets.length){ cont.innerHTML = '<p class="small muted">Aggiungi più capi per comporre outfit.</p>'; return; }
  $('#aiHint').textContent = aiText(sets[0].items);
  cont.innerHTML = sets.map((s,i)=>`
    <div class="item-card">
      <div class="item-body">
        <div><strong>Outfit ${i+1}</strong></div>
        <ul>${s.items.map(it=>`<li>${it.cat} ${it.color||''}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');
});

// Export outfit semplice
$('#exportOutfitBtn')?.addEventListener('click', ()=>{
  const c = $('#exportCanvas'); const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = '#5A2732'; ctx.font = 'bold 42px system-ui'; ctx.fillText('Avatly – Outfit', 40, 80);
  const list = Array.from($('#outfitList').querySelectorAll('li')).map(li=>li.textContent);
  ctx.font = '28px system-ui'; let y=140;
  list.forEach(t=>{ ctx.fillText('• '+t, 60, y); y+=40; });
  const url = c.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'avatly-outfit.png'; a.click();
});

// ——— Planner
function weekDays(){
  const now = new Date();
  const day = now.getDay(); // 0 dom
  const monday = new Date(now); const diff = (day===0? -6 : 1 - day);
  monday.setDate(now.getDate()+diff);
  const days=[];
  for(let i=0;i<7;i++){ const d = new Date(monday); d.setDate(monday.getDate()+i);
    const iso = d.toISOString().slice(0,10);
    days.push({iso, label: d.toLocaleDateString('it-IT', {weekday:'short', day:'2-digit', month:'2-digit'})});
  }
  return days;
}
function renderPlanner(){
  const pg = $('#planGrid'); if(!pg) return;
  const days = weekDays(); pg.innerHTML = '';
  days.forEach(d=>{
    const list = DB.plan[d.iso] || [];
    pg.innerHTML += `<div class="day" data-day="${d.iso}"><div class="small muted">${d.label}</div><ul>${list.map(id=>{
      const it = DB.items.find(x=>x.id===id); return it ? `<li>${it.cat} ${it.color||''}</li>` : '';
    }).join('')}</ul><button class="btn" data-add="${d.iso}">+ outfit</button></div>`;
  });
  pg.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{
    const ids = prompt('Inserisci ID capi separati da virgola (long-press su un capo per ricordarti l’ID):');
    if(!ids) return;
    const arr = ids.split(',').map(s=>s.trim()).filter(Boolean);
    const day = b.getAttribute('data-add');
    DB.plan[day] = (DB.plan[day]||[]).concat(arr);
    save('plan'); renderPlanner();
  }));
}
$('#shareReminders')?.addEventListener('click', ()=>{
  const days = Object.keys(DB.plan).sort();
  let text = 'Avatly – Planner settimana\n';
  days.forEach(d=>{
    const list = DB.plan[d]||[];
    const names = list.map(id=>{
      const it = DB.items.find(x=>x.id===id); return it ? (it.cat+' '+(it.color||'')) : id;
    }).join(', ');
    text += `\n${d}: ${names}`;
  });
  navigator.clipboard.writeText(text).then(()=> alert('Copiato negli appunti. Incolla nei Promemoria.'));
});

// ——— PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./service-worker.js'));
}
