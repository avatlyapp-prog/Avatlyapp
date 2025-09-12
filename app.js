/* Avatly basic interactions */

const splash = document.getElementById('splash');
const app = document.getElementById('app');

/* Splash → Home */
window.addEventListener('load', () => {
  setTimeout(() => {
    splash.classList.add('hidden');
    app.classList.remove('hidden');
  }, 900); // durata splash
});

/* Weather (placeholder) */
const weatherPill = document.getElementById('weatherPill');
const weatherTemp = document.getElementById('weatherTemp');
(function fakeWeather(){
  // segnaposto: alterna 21–24°
  const t = 21 + Math.floor(Math.random()*4);
  weatherTemp.textContent = `${t}°`;
})();

/* Avatar modal */
const avatarBtn = document.getElementById('btnAvatar');
const avatarModal = document.getElementById('avatarModal');
const closeModal = avatarModal.querySelector('.close');
const saveBtn = document.getElementById('saveAvatar');

const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const shapeInput  = document.getElementById('shapeInput');

const avatarImg = document.getElementById('avatarImg');

function loadAvatarPrefs(){
  try{
    const data = JSON.parse(localStorage.getItem('avatly.avatar')) || {};
    if(data.h) heightInput.value = data.h;
    if(data.w) weightInput.value = data.w;
    if(data.s) shapeInput.value  = data.s;
  }catch{ /* ignore */ }
}
function saveAvatarPrefs(){
  const data = {
    h: heightInput.value.trim(),
    w: weightInput.value.trim(),
    s: shapeInput.value
  };
  localStorage.setItem('avatly.avatar', JSON.stringify(data));
}

avatarBtn.addEventListener('click', () => {
  loadAvatarPrefs();
  avatarModal.showModal();
});
closeModal.addEventListener('click', () => avatarModal.close());
saveBtn.addEventListener('click', (e) => {
  e.preventDefault();
  saveAvatarPrefs();
  // segnaposto: in futuro qui scaleremo/aggiorneremo il 3D
  avatarModal.close();
});

/* Bottom tabs (placeholder actions) */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    switch(tab){
      case 'home':
        // non facciamo nulla: è la vista corrente
        break;
      case 'camera':
        alert('📸 Fotocamera: qui aggiungeremo lo scatto e l’upload dei capi.');
        break;
      case 'closet':
        alert('👗 Armadio: qui vedrai categorie e filtri dei capi.');
        break;
      case 'calendar':
        alert('🗓️ Calendario: pianifica gli outfit per i giorni.');
        break;
      case 'settings':
        alert('⚙️ Impostazioni: lingua, account, salvataggio dati…');
        break;
    }
  });
});

/* PWA service worker (se presente) */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}
