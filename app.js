// Avatly – base SPA + Armadio a due pannelli

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Stato locale molto semplice
const db = {
  settings: JSON.parse(localStorage.getItem('av_settings') || '{"unit":"metric","city":""}'),
  items: JSON.parse(localStorage.getItem('av_items') || '[]'),
  avatar: JSON.parse(localStorage.getItem('av_avatar') || '{"height":165,"weight":60,"shape":"diritta"}'),
};

// --- Helpers persistenza
const save = (k) => localStorage.setItem('av_'+k, JSON.stringify(db[k]));

// --- UI comuni
function showToast(text, ms=3000){
  const t = $('#toast');
  t.textContent = text;
  t.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>t.style.display='none', ms);
}

// Meteo (mock locale)
function initWeather(){
  // Qui in futuro: fetch reale; ora placeholder
  $('#weatherChip span').textContent = '22°';
  // Messaggino iniziale
  showToast('Oggi c’è il sole: prova jeans + t-shirt + sneakers!');
}

// Tabs
function initTabs(){
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.target;
      $$('.view').forEach(v=>v.classList.remove('visible'));
      $('#'+id).classList.add('visible');
    });
  });
  // partenza su Armadio
  document.querySelector('.tab[data-target="view-wardrobe"]').click();
}

// -------- ARMADIO --------

// Dati demo (immagini emoji/placeholder)
const demoItems = [
  {id:1, name:'T-shirt bianca', cat:'top', emoji:'👕'},
  {id:2, name:'Jeans blu', cat:'pantaloni', emoji:'👖'},
  {id:3, name:'Gonna midi', cat:'gonne', emoji:'🩳'},
  {id:4, name:'Vestito nero', cat:'vestiti', emoji:'👗'},
  {id:5, name:'Stivali', cat:'scarpe', emoji:'👢'},
  {id:6, name:'Borsa a tracolla', cat:'borse', emoji:'👜'},
  {id:7, name:'Cintura', cat:'accessori', emoji:'🧣'},
];
if (db.items.length === 0){ db.items = demoItems; save('items'); }

function renderGrid(filter='tutti'){
  const grid = $('#grid'); grid.innerHTML = '';
  const items = db.items.filter(it => filter==='tutti' ? true : it.cat===filter);
  if(items.length===0){
    grid.innerHTML = `<p style="opacity:.8">Nessun capo in <b>${filter}</b>…</p>`;
    return;
  }
  for (const it of items){
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="img" aria-label="${it.name}">${it.emoji ?? '👚'}</div>
      <div class="meta">
        <div>
          <div>${it.name}</div>
          <div class="badge">${it.cat}</div>
        </div>
        <button class="btn ghost" data-id="${it.id}">Dettagli</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

function initCategories(){
  $('#catScroll').addEventListener('click', (e)=>{
    const b = e.target.closest('.chip'); if(!b) return;
    if(b.dataset.cat === '+'){
      const name = prompt('Nome nuova categoria:');
      if(name){
        const btn = document.createElement('button');
        btn.className='chip';
        btn.dataset.cat = name.toLowerCase();
        btn.textContent = name;
        $('#catScroll').insertBefore(btn, $('#catScroll').lastElementChild);
      }
      return;
    }
    $$('#catScroll .chip').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderGrid(b.dataset.cat);
  });
}

// Avatar modale (Step A – campi leggibili e centrati)
function initAvatar(){
  const dlg = $('#avatarModal');
  $('#btnAvatar').addEventListener('click', ()=> {
    $('#heightInput').value = db.avatar.height ?? '';
    $('#weightInput').value = db.avatar.weight ?? '';
    $('#shapeSel').value   = db.avatar.shape  ?? 'diritta';
    dlg.showModal();
  });
  dlg.addEventListener('close', ()=>{
    if(dlg.returnValue==='ok'){
      db.avatar.height = Number($('#heightInput').value||0);
      db.avatar.weight = Number($('#weightInput').value||0);
      db.avatar.shape  = $('#shapeSel').value;
      save('avatar');
      showToast('Avatar aggiornato ✅');
      // (qui potrai collegare il 3D per cambiare corpo/altezza)
    }
  });
}

// Impostazioni
function initSettings(){
  $('#unitSel').value = db.settings.unit;
  $('#cityInput').value = db.settings.city || '';
  $('#btnSaveSettings').addEventListener('click', ()=>{
    db.settings.unit = $('#unitSel').value;
    db.settings.city = $('#cityInput').value.trim();
    save('settings');
    showToast('Impostazioni salvate');
  });
}

// Aggiungi capo (bozza)
function initAddItem(){
  $('#btnNewItem').addEventListener('click', ()=>{
    const name = prompt('Nome capo?');
    if(!name) return;
    const cat = prompt('Categoria (top, pantaloni, gonne, vestiti, scarpe, borse, accessori)?','top') || 'top';
    db.items.push({id:Date.now(), name, cat, emoji:'👚'});
    save('items');
    const active = document.querySelector('#catScroll .chip.active')?.dataset.cat || 'tutti';
    renderGrid(active);
  });
}

// AI demo
function initAI(){
  const list = $('#aiList');
  list.innerHTML = `
    <li>Per un pranzo informale: jeans + t-shirt bianca + sneakers.</li>
    <li>Se piove: trench + stivaletti + borsa a tracolla.</li>
  `;
}

// Boot
initTabs();
initWeather();
initCategories();
initAvatar();
initSettings();
initAddItem();
initAI();
renderGrid('tutti');
