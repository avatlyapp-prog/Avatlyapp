// Avatly v0.3 – bottom bar, meteo, toast, avatar Ready Player Me

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ------------ Stato ------------
const DB = {
  user: JSON.parse(localStorage.getItem('av_user') || 'null'),
  items: JSON.parse(localStorage.getItem('av_items') || '[]'),
  categories: JSON.parse(localStorage.getItem('av_categories') || '["Top","Pantaloni","Gonne","Vestiti","Giacche","Scarpe","Borse","Accessori","Palestra"]'),
  plan: JSON.parse(localStorage.getItem('av_plan') || '{}'),
  settings: JSON.parse(localStorage.getItem('av_settings') || '{"profileName":"","theme":"monelia"}'),
  weather: JSON.parse(localStorage.getItem('av_weather') || 'null'),
  avatar: JSON.parse(localStorage.getItem('av_avatar') || '{"height":"","weight":"","url":""}')
};
function save(k){ localStorage.setItem('av_'+k, JSON.stringify(DB[k])); }

// ------------ Splash ------------
window.addEventListener('load', ()=>{
  setTimeout(()=> { const s=$('#introSplash'); if(s) s.style.display='none'; }, 2500);
});

// ------------ Login (mock) ------------
function showApp(){
  $('#splash').hidden = true;
  $('#appHeader').hidden = false;
  $('#appMain').hidden = false;
  $('#appFooter').hidden = false;
  $('#bottomNav').hidden = false;

  renderCategories();
  renderItems();
  renderPlanner();
  renderWeatherBubble();
  hydrateAvatar();

  wireTabs();
  wireBottomNav();
  wireWardrobe();
  wireWeather();
  wireOutfit();
  wireAvatar();
  wireSettings();

  startWeatherHints(); // mini messaggi
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

// ------------ Router (tabs + bottom bar) ------------
function setActivePanel(id){
  $$('.panel').forEach(p=> p.classList.toggle('active', p.id===id));
  $$('.bnav').forEach(b=> b.classList.toggle('active', b.dataset.go===id));
}
function wireTabs(){
  $$('.tab').forEach(b=> b.addEventListener('click', ()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    setActivePanel(b.dataset.tab);
  }));
}
function wireBottomNav(){
  $$('.bnav').forEach(btn=>{
    btn.onclick = ()=> setActivePanel(btn.dataset.go);
  });
}

// ------------ Guardaroba ------------
function renderCategories(){
  const sel = $('#newCategory'); if(sel){ sel.innerHTML = DB.categories.map(c=>`<option>${c}</option>`).join(''); }
  const catList = $('#catList');
  if(catList){
    catList.innerHTML = DB.categories.map(c=>`<label><input type="checkbox" value="${c}"> ${c}</label>`).join('');
    $$('#catList input').forEach(i=> i.onchange = applyFilters);
  }
}
function fileToDataURL(file){
  return new Promise(res=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(file); });
}
$('#addItemBtn')?.addEventListener('click', async ()=>{
  const cat = $('#newCategory').value;
  const color = $('#newColor').value.trim();
  let photo='';
  const f = $('#newPhoto').files[0];
  if(f) photo = await fileToDataURL(f);
  DB.items.unshift({ id: crypto.randomUUID(), cat, color, photo, ts: Date.now() });
  save('items'); $('#newColor').value=''; $('#newPhoto').value=''; renderItems();
});
function renderItems(arr){
  const g = $('#itemsGrid'); if(!g) return;
  const list = arr || DB.items;
  if(!list.length){ g.innerHTML = '<p class="muted">Nessun capo. Aggiungine uno sopra.</p>'; return; }
  g.innerHTML = list.map(i=>`
    <div class="item-card" data-id="${i.id}">
      <div class="item-thumb" style="background-image:url('${i.photo||""}')"></div>
      <div class="item-body"><div><span class="badge">${i.cat}</span> ${i.color||''}</div></div>
    </div>
  `).join('');
  g.querySelectorAll('.item-card').forEach(card=> attachLongPress(card));
}
function applyFilters(){
  const cats = [...$$('#catList input:checked')].map(x=>x.value);
  const q = ($('#searchTxt')?.value || '').toLowerCase();
  let arr = DB.items.slice();
  if(cats.length) arr = arr.filter(i=> cats.includes(i.cat));
  if(q) arr = arr.filter(i=> (i.color||'').toLowerCase().includes(q));
  renderItems(arr);
}
$('#searchTxt')?.addEventListener('input', applyFilters);
$('#clearFilters')?.addEventListener('click', ()=>{ $$('#catList input').forEach(c=>c.checked=false); $('#searchTxt').value=''; renderItems(); });

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
  $('#lpMoveBtn').onclick = ()=>{ const to=prompt('Sposta in categoria:', it.cat); if(to){ it.cat=to; if(!DB.categories.includes(to)){ DB.categories.push(to); save('categories'); renderCategories(); } save('items'); renderItems(); closeSheet(); } };
  $('#lpEditBtn').onclick = ()=>{ openEdit(it); };
}
function closeSheet(){ $('#lpOverlay').style.display='none'; $('#lpSheet').style.display='none'; }
function openEdit(it){
  $('#editCategory').innerHTML = DB.categories.map(c=>`<option ${c===it.cat?'selected':''}>${c}</option>`).join('');
  $('#editColor').value = it.color || '';
  $('#editSheet').style.display='block';
  $('#saveEditBtn').onclick = async ()=>{
    it.cat = $('#editCategory').value;
    it.color = $('#editColor').value.trim();
    const f = $('#editPhoto').files[0];
    if(f){ it.photo = await fileToDataURL(f); }
    save('items'); renderItems(); $('#editSheet').style.display='none'; closeSheet();
  };
  $('#cancelEditBtn').onclick = ()=> $('#editSheet').style.display='none';
}
function wireWardrobe(){
  $('#addCatBtn').onclick = ()=>{
    const name = prompt('Nome nuova categoria:'); if(!name) return;
    if(!DB.categories.includes(name)){ DB.categories.push(name); save('categories'); renderCategories(); }
  };
}

// ------------ Meteo + bolla + toast ------------
async function geocodeCity(q){
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=it&format=json`;
  const r = await fetch(url); const j = await r.json(); return j.results?.[0] || null;
}
async function fetchWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
  const r = await fetch(url); return await r.json();
}
function renderWeatherBubble(){
  const b = $('#wxBubble'); if(!b) return;
  if(!DB.weather){ b.hidden = true; return; }
  const d = DB.weather.daily;
  const tmax = Math.round(d.temperature_2m_max[0]); const rain = d.precipitation_probability_max[0]||0;
  $('#wxTemp').textContent = `${tmax}°`;
  $('#wxEmoji').textContent = rain>=40 ? '🌧️' : '☀️';
  b.hidden = false;
}
function wireWeather(){
  $('#useGPS')?.addEventListener('click', ()=>{
    if(!navigator.geolocation){ alert('GPS non disponibile'); return; }
    navigator.geolocation.getCurrentPosition(async pos=>{
      const {latitude, longitude} = pos.coords;
      DB.weather = await fetchWeather(latitude, longitude); save('weather'); renderWeatherBubble();
    }, ()=> alert('Impossibile ottenere la posizione'));
  });
  $('#setCity')?.addEventListener('click', async ()=>{
    const q = $('#cityInput').value.trim(); if(!q) return;
    const g = await geocodeCity(q); if(!g){ alert('Località non trovata'); return; }
    DB.weather = await fetchWeather(g.latitude, g.longitude); save('weather'); renderWeatherBubble();
  });
}
function showToast(msg, ms=3000){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.hidden=false;
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.hidden=true, ms);
}
function startWeatherHints(){
  // Primo hint subito se c'è meteo
  hintOnce();
  // Poi ciclico ogni ~45s (soft)
  setInterval(hintOnce, 45000);
  function hintOnce(){
    if(!DB.weather) return;
    const d = DB.weather.daily;
    const rain = d.precipitation_probability_max[0]||0;
    const tmax = Math.round(d.temperature_2m_max[0]);
    if(rain>=50) showToast("🌧️ Oggi piove: prova trench + stivali + borsa impermeabile.");
    else if(tmax>=28) showToast("☀️ Fa caldo: top leggero + gonna/shorts + sandali.");
    else if(tmax<=10) showToast("🧥 Freddo: maglione + cappotto + stivali.");
    else showToast("✨ Oggi tempo ok: prova layering con giacca leggera.");
  }
}

// ------------ Outfit AI-ish ------------
function aiText(o){
  const rain = DB.weather?.daily?.precipitation_probability_max?.[0] || 0;
  const tip = rain>=40 ? 'Oggi piove, punta su capi impermeabili.' : 'Tempo ok, scegli capi comodi e stratifica se serve.';
  const names = o.map(i=> i.color ? `${i.cat} ${i.color}` : i.cat).join(' + ');
  return `${tip} Consiglio: ${names}.`;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function generateOutfits(){
  const by = c => DB.items.filter(i=>i.cat===c);
  const results = []; let guard=0;
  while(results.length<3 && guard<50){
    guard++;
    let o = [];
    if(by('Vestiti').length && Math.random()<0.35) o.push(pick(by('Vestiti')));
    else { if(by('Top').length) o.push(pick(by('Top'))); if(by('Pantaloni').length || by('Gonne').length) o.push(pick([...by('Pantaloni'),...by('Gonne')])) }
    if(by('Giacche').length && Math.random()<0.5) o.push(pick(by('Giacche')));
    if(by('Scarpe').length) o.push(pick(by('Scarpe')));
    if(by('Borse').length && Math.random()<0.5) o.push(pick(by('Borse')));
    if(by('Accessori').length && Math.random()<0.4) o.push(pick(by('Accessori')));
    const key = o.map(x=>x.id).sort().join('-');
    if(o.length>=3 && !results.some(r=> r.key===key)){ results.push({key, items:o}); }
  }
  return results;
}
function wireOutfit(){
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

  // Export semplice
  $('#exportOutfitBtn')?.addEventListener('click', ()=>{
    const c = $('#exportCanvas'); const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#5A2732'; ctx.font = 'bold 42px system-ui'; ctx.fillText('Avatly – Outfit', 40, 80);
    const list = Array.from($('#outfitList').querySelectorAll('li')).map(li=>li.textContent);
    ctx.font = '28px system-ui'; let y=140; list.forEach(t=>{ ctx.fillText('• '+t, 60, y); y+=40; });
    const url = c.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'avatly-outfit.png'; a.click();
  });
}

// ------------ Planner (demo) ------------
function renderPlanner(){
  const pg = $('#planGrid'); if(!pg) return;
  const days = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  pg.innerHTML = days.map(d=>`<div class="card"><strong>${d}</strong><div class="muted small">Aggiungi outfit…</div></div>`).join('');
}
$('#shareReminders')?.addEventListener('click', ()=>{
  navigator.clipboard.writeText('Avatly – Planner settimana\n(aggiungi qui i tuoi outfit)'); showToast('Copiato nei tuoi appunti ✅');
});

// ------------ Avatar (Ready Player Me) ------------
function hydrateAvatar(){
  $('#avatarHeight').value = DB.avatar.height || '';
  $('#avatarWeight').value = DB.avatar.weight || '';
  if(DB.avatar.url){
    $('#avatarPreview').innerHTML = `<div class="small muted">Avatar salvato.</div><img src="${DB.avatar.url}" alt="Avatar">`;
  }
}
function wireAvatar(){
  $('#saveAvatarMeasures').onclick = ()=>{
    DB.avatar.height = $('#avatarHeight').value;
    DB.avatar.weight = $('#avatarWeight').value;
    save('avatar'); showToast('Misure avatar salvate ✓');
  };

  const modal = $('#rpmModal'), frame = $('#rpmFrame');
  $('#openAvatarCreator').onclick = ()=>{
    // Apre il creator
    modal.style.display='flex';
    // Richiesta subscribe eventi
    frame.contentWindow.postMessage(JSON.stringify({ target:'readyplayerme', type:'subscribe', eventName:'v1.avatar.exported'}), '*');
  };
  $('#closeRpm').onclick = ()=> modal.style.display='none';

  // Listener eventi Ready Player Me
  window.addEventListener('message', (event)=>{
    let data;
    try{ data = JSON.parse(event.data); }catch{ return; }
    if(data?.source!=='readyplayerme') return;

    // Quando l'avatar è pronto/esportato
    if(data.type==='v1.avatar.exported'){
      const url = data.data?.url; // GLB (3D)
      if(url){
        // Per preview, usiamo il PNG fornito dalla scena "fullbody" se disponibile,
        // altrimenti mostriamo solo un link
        DB.avatar.url = `https://api.readyplayer.me/v1/avatars/${data.data?.avatarId}.png?scene=fullbody&blendShapes=ARKit`; // fallback preview
        save('avatar');
        hydrateAvatar();
        showToast('Avatar salvato ✓');
        modal.style.display='none';
      }
    }

    // Apre in modo affidabile il creator nella frame API
    if(data.type === 'readyplayerme') {
      // forward ping/pong se necessario
    }
  });
}

// ------------ Impostazioni ------------
function wireSettings(){
  $('#saveProfile')?.addEventListener('click', ()=>{
    DB.settings.profileName = $('#profileName').value.trim();
    save('settings'); showToast('Profilo salvato ✓');
  });
  $('#logout')?.addEventListener('click', ()=>{ if(confirm('Uscire dall\'app?')){ localStorage.removeItem('av_user'); location.reload(); } });
}

// ------------ PWA ------------
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./service-worker.js'));
}
