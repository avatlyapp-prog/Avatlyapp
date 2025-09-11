// ======================================================================
// AVATLY App JS (client-side, no backend) — v3
// ======================================================================

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const db = {
  settings: JSON.parse(localStorage.getItem('av_settings')) || {
    profileName: 'Avatly', unit: 'metric', city: '', lat: null, lon: null,
    height: '', weight: '', shape: ''
  }
};
const save = () => localStorage.setItem('av_settings', JSON.stringify(db.settings));

// -------------------------- UI references
const weatherPill = $('#weatherPill');
const aiToast = $('#aiToast');
const avatarCanvas = $('#avatarCanvas');
const ctx = avatarCanvas.getContext('2d');

const avatarModal = $('#avatarModal');
const heightInput = $('#heightInput');
const weightInput = $('#weightInput');
const shapeSelect = $('#shapeSelect');
const miniCanvas = $('#miniAvatar');
const miniCtx = miniCanvas.getContext('2d');

// -------------------------- Basic nav highlight
$$('.bottom-nav .tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.bottom-nav .tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    // (per ora la Home è l’unica “vista”; in futuro qui cambiamo pannelli)
  });
});

// -------------------------- Meteo “placeholder”
(function initWeather(){
  // Finto meteo solo estetico (22°)
  $('#weatherTemp').textContent = '22°';
})();

// -------------------------- AI toast demo
function showSuggestion(text){
  aiToast.textContent = text;
  aiToast.hidden = false;
  setTimeout(()=> aiToast.hidden = true, 4500);
}
// Mostra un messaggino iniziale
showSuggestion("Oggi c’è il sole: prova jeans + t-shirt + sneakers!");

// -------------------------- Avatar placeholder (2D semplificato)
function drawAvatar2D(c2d, w, h, color='#F9CED8'){
  c2d.clearRect(0,0,w,h);
  c2d.fillStyle = color;
  // testa
  c2d.beginPath();
  c2d.arc(w/2, h*0.28, 30, 0, Math.PI*2);
  c2d.fill();
  // busto
  c2d.fillRect(w/2 - 18, h*0.35, 36, 85);
  // gambe
  c2d.fillRect(w/2 - 12, h*0.35+85, 10, 90);
  c2d.fillRect(w/2 + 2,  h*0.35+85, 10, 90);
}

// Disegna nei due canvas
function renderAvatars(){
  drawAvatar2D(ctx, avatarCanvas.width, avatarCanvas.height, '#F5C3D1');
  drawAvatar2D(miniCtx, miniCanvas.width, miniCanvas.height, '#5A1F2A'); // scuro dentro la modale
}
renderAvatars();

// -------------------------- Modal open/close + bind
$('#avatarFab').addEventListener('click', openModal);
$('.hint .icon')?.addEventListener('click', openModal);
$('#closeModal').addEventListener('click', ()=> avatarModal.close());
$('#avatarForm').addEventListener('submit', onSaveAvatar);

function openModal(){
  // Precarico valori
  heightInput.value = db.settings.height || '';
  weightInput.value = db.settings.weight || '';
  shapeSelect.value = db.settings.shape || '';
  renderAvatars();
  avatarModal.showModal();
}

function onSaveAvatar(ev){
  ev.preventDefault();
  db.settings.height = heightInput.value.trim();
  db.settings.weight = weightInput.value.trim();
  db.settings.shape  = shapeSelect.value;
  save();
  avatarModal.close();
  showSuggestion('Avatar aggiornato ✅');
}

// -------------------------- Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js?v=9').catch(()=>{});
  });
}
