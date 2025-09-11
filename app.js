// Avatly v0.5 – icone SVG, dialog aggiunta capi, editor avatar
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ---------------- Tabs ---------------- */
$$('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    $$('.panel').forEach(p=>p.classList.remove('active'));
    $('#'+b.dataset.tab).classList.add('active');
  });
});

/* ---------------- Meteo (demo) ---------------- */
const weather = { emoji:'🌤️', t: '22°', msg:'Oggi c’è il sole: prova jeans + t-shirt + sneakers!' };
function renderWeather(){ $('.wx-t').textContent = weather.t; }
renderWeather();
$('#weatherBtn').addEventListener('click', ()=> showToast(weather.msg));
setTimeout(()=> showToast(weather.msg), 1200);

/* ---------------- Toast ---------------- */
function showToast(text){
  const t = $('#toast'); t.textContent = text;
  t.classList.add('show'); setTimeout(()=> t.classList.remove('show'), 3500);
}

/* ---------------- Storage helpers ---------------- */
const LS = {
  get(k, def){ try{ return JSON.parse(localStorage.getItem('av_'+k)) ?? def; }catch{ return def; } },
  set(k, v){ localStorage.setItem('av_'+k, JSON.stringify(v)); }
};

/* ---------------- Avatar ---------------- */
let avatar = LS.get('avatar', {height:165, weight:60, shape:'dritta'});
function drawAvatar(svgEl, a=avatar){
  // semplice silhouette in base alla forma
  const torsoW = a.shape==='clessidra' ? 26 : a.shape==='pera' ? 30 : 24;
  const hipsW  = a.shape==='pera' ? 34 : 26;
  const shouldersW = a.shape==='clessidra' ? 32 : 28;

  svgEl.innerHTML = `
    <circle cx="60" cy="38" r="18" />
    <path d="
      M ${60-shouldersW/2} 58
      Q 60 66 ${60+shouldersW/2} 58
      L ${60+torsoW/2} 100
      Q 60 110 ${60-torsoW/2} 100
      Z" />
    <path d="
      M ${60-hipsW/2} 100
      L ${60-hipsW/2+6} 160
      L ${60-hipsW/2+12} 160
      L ${60-4} 100
      L ${60+4} 100
      L ${60+hipsW/2-12} 160
      L ${60+hipsW/2-6} 160
      L ${60+hipsW/2} 100 Z" />`;
}
drawAvatar($('#avatarSvg'));

$('#btnEditAvatar').addEventListener('click', ()=>{
  $('#avHeight').value = avatar.height;
  $('#avWeight').value = avatar.weight;
  $('#avShape').value  = avatar.shape;
  drawAvatar($('#avatarPreview'), avatar);
  $('#dlgAvatar').showModal();
});
$('#avHeight,#avWeight,#avShape').forEach?.call
  ? $('#avShape')
  : null;
// live preview
['avHeight','avWeight','avShape'].forEach(id=>{
  $('#'+id).addEventListener('input', ()=>{
    const a = {height:+$('#avHeight').value, weight:+$('#avWeight').value, shape:$('#avShape').value};
    drawAvatar($('#avatarPreview'), a);
  });
});
$('#btnAvatarSave').addEventListener('click', (e)=>{
  e.preventDefault();
  avatar = {height:+$('#avHeight').value, weight:+$('#avWeight').value, shape:$('#avShape').value};
  LS.set('avatar', avatar);
  drawAvatar($('#avatarSvg'));
  $('#dlgAvatar').close();
  showToast('Avatar aggiornato.');
});

/* ---------------- Armadio ---------------- */
let items = LS.get('items', [
  {id:1, name:'T-shirt bianca', cat:'top', color:'bianco'},
  {id:2, name:'Jeans blu', cat:'pantaloni', color:'blu'},
  {id:3, name:'Gonna midi nera', cat:'gonne', color:'nero'},
  {id:4, name:'Sneakers bianche', cat:'scarpe', color:'bianco'},
  {id:5, name:'Borsa a tracolla', cat:'accessori', color:'bordeaux'},
]);

const grid = $('#grid');
function renderGrid(filter='tutti', q=''){
  grid.innerHTML = '';
  const ql = q.trim().toLowerCase();
  items
    .filter(x => (filter==='tutti' || x.cat===filter))
    .filter(x => !ql || (x.name+' '+x.cat+' '+(x.color||'')+' '+(x.notes||'')).toLowerCase().includes(ql))
    .forEach(x=>{
      const li = document.createElement('li');
      li.className='item';
      li.innerHTML = `
        <button class="del" title="Elimina" data-id="${x.id}">
          <svg class="i"><use href="#ic-bin"/></svg>
        </button>
        <div class="thumb">${x.photo ? `<img src="${x.photo}" alt="">` : '📷'}</div>
        <div class="name">👗 ${x.name}</div>
        <div class="meta">${x.cat}${x.color? ' · '+x.color:''}</div>`;
      grid.appendChild(li);
    });
}
renderGrid();
$('#grid').addEventListener('click', (e)=>{
  const b = e.target.closest('.del');
  if(!b) return;
  const id = +b.dataset.id;
  items = items.filter(x=>x.id!==id);
  LS.set('items', items);
  renderGrid($('.chip.active').dataset.cat, $('#q').value);
  showToast('Capo eliminato');
});

$('#q').addEventListener('input', e=>{
  const active = $('.chip.active')?.dataset.cat || 'tutti';
  renderGrid(active, e.target.value);
});
$('#chips').addEventListener('click', e=>{
  const b = e.target.closest('.chip');
  if(!b) return;
  if(b.id==='addCat'){
    const name = prompt('Nome nuova categoria? (es. Cerimonia)');
    if(!name) return;
    const btn = document.createElement('button');
    btn.className='chip'; btn.dataset.cat = name.toLowerCase();
    btn.textContent = name;
    $('#chips').insertBefore(btn, $('#addCat'));
    showToast('Categoria creata.');
    return;
  }
  $$('.chip').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  renderGrid(b.dataset.cat, $('#q').value);
});

/* ----- Dialog “Aggiungi capo” ----- */
$('#addItem').addEventListener('click', ()=> $('#dlgItem').showModal());

let photoData = null;
$('#itemPhoto').addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  if(!f) return;
  const url = await fileToDataURL(f);
  photoData = url;
  $('#itemPreview').innerHTML = `<img src="${url}" alt="">`;
});
function fileToDataURL(file){
  return new Promise(res=>{
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });
}

$('#btnSaveItem').addEventListener('click', (e)=>{
  e.preventDefault();
  const name = $('#itemName').value.trim();
  if(!name){ $('#dlgItem').close(); return; }
  const cat   = $('#itemCat').value;
  const color = $('#itemColor').value.trim();
  const notes = $('#itemNotes').value.trim();
  items.push({ id: Date.now(), name, cat, color, notes, photo: photoData });
  LS.set('items', items);
  $('#dlgItem').close();
  // reset
  photoData = null; $('#itemPreview').textContent='Anteprima'; $('#formItem').reset();
  renderGrid($('.chip.active').dataset.cat, $('#q').value);
  showToast('Capo aggiunto.');
});

/* ---------------- AI Suggest ---------------- */
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

/* ---------------- Settings (demo) ---------------- */
$('#saveSettings').addEventListener('click', ()=> showToast('Impostazioni salvate.'));
$('#exportData').addEventListener('click', ()=> showToast('Export JSON (prossima build).'));
$('#importData').addEventListener('click', ()=> showToast('Import JSON (prossima build).'));

/* ---------------- PWA ---------------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js?v=5');
  });
}
