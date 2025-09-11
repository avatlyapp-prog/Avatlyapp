// Avatly – Step A: Avatar 3D base + bottom bar
// Storage helper
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const db = {
  avatar: JSON.parse(localStorage.getItem('av_avatar')||'{}')
};
function save(k){ localStorage.setItem('av_'+k, JSON.stringify(db[k])); }

// --------------- Bottom bar (solo evidenziazione) ---------------
$$('.tab').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    // Qui in futuro apriremo le sezioni AI / Armadio / Calendario / Impostazioni
  });
});

// --------------- Avatar 3D: binding & scala ---------------
const av3d = $('#av3d');
function loadAvatarPrefs(){
  const a = db.avatar || {};
  $('#avHeight').value = a.height ?? '';
  $('#avWeight').value = a.weight ?? '';
  $('#avShape').value  = a.shape ?? 'dritta';
  $('#avScaleX').value = a.scaleX ?? 1;
  $('#avScaleY').value = a.scaleY ?? 1;
  applyAvatarScale();
}
function applyAvatarScale(){
  if(!av3d) return;
  const sx = parseFloat($('#avScaleX').value || 1);
  const sy = parseFloat($('#avScaleY').value || 1);
  av3d.style.transformOrigin = '50% 85%';
  av3d.style.transform = `scale(${sx},${sy})`;
}

// Fallback se manca assets/avatar.glb
av3d?.addEventListener('error', ()=>{
  $('#av3d').outerHTML = `<div style="display:grid;place-items:center;height:100%;color:#FDECF2;opacity:.85">
    Carica <code>assets/avatar.glb</code> per attivare l'avatar 3D
  </div>`;
});

// --------------- Modale ---------------
const modal = $('#avatarModal');
$('#openAvatar').addEventListener('click', ()=>{ loadAvatarPrefs(); modal.classList.add('open'); });
$('#avCancel').addEventListener('click', ()=> modal.classList.remove('open'));
modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('open'); });

$('#avSave').addEventListener('click', ()=>{
  db.avatar = {
    height: parseInt($('#avHeight').value||0,10) || null,
    weight: parseInt($('#avWeight').value||0,10) || null,
    shape: $('#avShape').value || 'dritta',
    scaleX: parseFloat($('#avScaleX').value||1),
    scaleY: parseFloat($('#avScaleY').value||1),
  };
  save('avatar');
  applyAvatarScale();
  modal.classList.remove('open');
});
$('#avScaleX').addEventListener('input', applyAvatarScale);
$('#avScaleY').addEventListener('input', applyAvatarScale);

// --------------- Meteo (placeholder) ---------------
$('#weatherBtn').addEventListener('click', ()=>{
  alert('Suggerimento AI: oggi potrebbe piovere. Prova jeans + stivaletti + trench!');
});

// Init
applyAvatarScale();
