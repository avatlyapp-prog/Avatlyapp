// ---------- Splash ----------
const splash = document.getElementById('splash');
setTimeout(()=> splash.classList.add('hidden-splash'), 900);
setTimeout(()=> splash.style.display='none', 1600);

// ---------- Meteo (placeholder) ----------
(function initWeather(){
  const chip = document.getElementById('chipWeather');
  if (!chip) return;
  const tempEl = document.getElementById('temp');
  let t = localStorage.getItem('avatly.temp');
  if(!t){ t = '22'; localStorage.setItem('avatly.temp', t); }
  tempEl.textContent = `${t}°`;
  chip.addEventListener('click', ()=>{
    const v = prompt('Imposta temperatura attuale (°C):', t);
    if(v!==null && v.trim()!==''){
      const n = parseInt(v,10);
      if(!Number.isNaN(n)){
        t = n; localStorage.setItem('avatly.temp', t);
        tempEl.textContent = `${t}°`;
      }
    }
  });
})();

// ---------- Tabbar / Navigazione semplice ----------
const screens = document.querySelectorAll('.screen');
function show(screenName){
  screens.forEach(s => s.classList.toggle('active', s.dataset.screen === screenName));
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === screenName));
}
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const tab = btn.dataset.tab;
    if(tab==='camera'){ alert('Fotocamera: scatta e ritaglia i capi (WIP)'); return;}
    show(tab==='home'?'home':tab);
  });
});

// ---------- Modal Avatar ----------
const modal = document.getElementById('modal');
const openBtn = document.getElementById('btnAvatar');
const closeBtn = document.getElementById('modalClose');
const cancelBtn = document.getElementById('modalCancel');
const form = document.getElementById('avatarForm');
const inpH = document.getElementById('inpH');
const inpW = document.getElementById('inpW');
const inpShape = document.getElementById('inpShape');

// carica valori salvati
(function loadAvatarPrefs(){
  const st = JSON.parse(localStorage.getItem('avatly.avatar')||'{}');
  if(st.h) inpH.value = st.h;
  if(st.w) inpW.value = st.w;
  if(st.shape) inpShape.value = st.shape;
})();

function openModal(){
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = {
    h: inpH.value.trim(),
    w: inpW.value.trim(),
    shape: inpShape.value
  };
  localStorage.setItem('avatly.avatar', JSON.stringify(data));
  closeModal();
  alert('Avatar aggiornato! (quando passeremo al 3D useremo questi dati per il corpo)');
});
