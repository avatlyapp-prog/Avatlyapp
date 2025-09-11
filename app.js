// Avatly – Home wire-up

// 1) Avatar edit (apre un placeholder, poi ci metteremo il pannello 3D)
document.getElementById('btnAvatar').addEventListener('click', () => {
  alert('Qui potrai personalizzare avatar: connotati, altezza, peso, forma. (WIP)');
});

// 2) Meteo (placeholder locale salvato)
(function initWeather(){
  const chip = document.getElementById('chipWeather');
  const tempEl = document.getElementById('temp');
  // Recupera temperatura fittizia da localStorage o imposta 22°
  let t = localStorage.getItem('avatly.temp');
  if(!t){ t = '22'; localStorage.setItem('avatly.temp', t); }
  tempEl.textContent = `${t}°`;
  chip.addEventListener('click', ()=>{
    const v = prompt('Imposta temperatura attuale (°C):', t);
    if(v!==null && v.trim()!==''){
      t = parseInt(v,10);
      if(!Number.isNaN(t)){
        localStorage.setItem('avatly.temp', t);
        tempEl.textContent = `${t}°`;
      }
    }
  });
})();

// 3) Tab bar (navigazione fittizia per ora)
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    switch(tab){
      case 'camera': alert('Fotocamera: scatta e ritaglia i capi (WIP)'); break;
      case 'closet': alert('Armadio: categorie e filtri (WIP)'); break;
      case 'home': /* già qui */ break;
      case 'calendar': alert('Calendario outfit (WIP)'); break;
      case 'settings': alert('Impostazioni: lingua, backup, profilo (WIP)'); break;
    }
  });
});
