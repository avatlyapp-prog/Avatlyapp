// Avatly v0.4 – layout come da sketch

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// --- Tabs
$$('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    $$('.panel').forEach(p=>p.classList.remove('active'));
    $('#'+b.dataset.tab).classList.add('active');
  });
});

// --- Meteo (demo)
const weather = { emoji:'🌤️', t: '22°', msg:'Oggi c’è il sole: prova jeans + t-shirt + sneakers!' };
function renderWeather(){
  $('.wx-emoji').textContent = weather.emoji;
  $('.wx-t').textContent = weather.t;
}
renderWeather();
$('#weatherBtn').addEventListener('click', ()=> showToast(weather.msg));
setTimeout(()=> showToast(weather.msg), 1200);

// --- Toast
function showToast(text){
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 3500);
}

// --- Avatar (placeholder)
$('#btnEditAvatar').addEventListener('click', ()=>{
  showToast('Editor avatar in arrivo: altezza/peso/linee + prova capi!');
});

// --- Armadio – demo dati
let items = [
  {id:1, name:'T-shirt bianca', cat:'top', color:'bianco'},
  {id:2, name:'Jeans blu', cat:'pantaloni', color:'blu'},
  {id:3, name:'Gonna midi nera', cat:'gonne', color:'nero'},
  {id:4, name:'Sneakers bianche', cat:'scarpe', color:'bianco'},
  {id:5, name:'Borsa a tracolla', cat:'accessori', color:'bordeaux'},
];

const grid = $('#grid');
function renderGrid(filter='tutti', q=''){
  grid.innerHTML = '';
  const ql = q.trim().toLowerCase();
  items
    .filter(x => (filter==='tutti' || x.cat===filter))
    .filter(x => !ql || (x.name+ ' ' + x.cat + ' ' + (x.color||'')).toLowerCase().includes(ql))
    .forEach(x=>{
      const li = document.createElement('li');
      li.className='item';
      li.innerHTML = `
        <div class="thumb">📷</div>
        <div class="name">👗 ${x.name}</div>
        <div class="meta">${x.cat}${x.color? ' · '+x.color:''}</div>`;
      grid.appendChild(li);
    });
}
renderGrid();

$('#q').addEventListener('input', e=>{
  const active = $('.chip.active')?.dataset.cat || 'tutti';
  renderGrid(active, e.target.value);
});
$('#chips').addEventListener('click', e=>{
  const b = e.target.closest('.chip');
  if(!b) return;
  if(b.id==='addCat'){ showToast('Nuova categoria: verrà aggiunta nella prossima versione.'); return; }
  $$('.chip').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  renderGrid(b.dataset.cat, $('#q').value);
});
$('#addItem').addEventListener('click', ()=>{
  const name = prompt('Nome capo? (es. Maglione grigio)');
  if(!name) return;
  items.push({id:Date.now(), name, cat:'top', color:''});
  renderGrid($('.chip.active').dataset.cat, $('#q').value);
  showToast('Capo aggiunto.');
});

// --- AI: finto suggeritore
$('#btnSuggest').addEventListener('click', ()=>{
  const ul = $('#aiList');
  const idea = {
    title: 'Look sole/22°',
    desc: 'T-shirt bianca + jeans blu + sneakers bianche. Aggiungi borsa bordeaux.',
  };
  const li = document.createElement('li');
  li.className='card';
  li.innerHTML = `<strong>${idea.title}</strong><div>${idea.desc}</div>`;
  ul.prepend(li);
  showToast('Nuovo outfit consigliato ✨');
});

// --- Impostazioni (demo)
$('#saveSettings').addEventListener('click', ()=>{
  showToast('Impostazioni salvate.');
});
$('#exportData').addEventListener('click', ()=> showToast('Export JSON pronto (next build).'));
$('#importData').addEventListener('click', ()=> showToast('Import JSON (next build).'));

// PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js?v=4');
  });
}
