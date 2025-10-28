// ---------- Data ----------
const SHAPES = [
  { key: 'circle', color: '#ef4444', label: 'วงกลม' },
  { key: 'square', color: '#22c55e', label: 'สี่เหลี่ยมจัตุรัส' },
  { key: 'triangle', color: '#3b82f6', label: 'สามเหลี่ยม' },
  { key: 'rect', color: '#f59e0b', label: 'สี่เหลี่ยมผืนผ้า' },
  { key: 'diamond', color: '#06b6d4', label: 'สี่เหลี่ยมขนมเปียกปูน' },
  { key: 'pentagon', color: '#84cc16', label: 'ห้าเหลี่ยม' },
  { key: 'hexagon', color: '#f97316', label: 'หกเหลี่ยม' },
  { key: 'heart', color: '#e11d48', label: 'หัวใจ' },
  { key: 'oval', color: '#14b8a6', label: 'วงรี' },
  { key: 'decagon', color: '#a855f7', label: 'สิบเหลี่ยม' }
];

// ---------- Audio Manager ----------
const audioManager = {
  bgMusic: null,
  sounds: {},
  sfxVolume: 0.7,
  
  init: function() {
    this.bgMusic = new Audio();
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0;
    this.bgMusic.src = 'bg-music.mp3';
    
    this.sounds = {
      click: new Audio('Clicksound-เสียงคลิกปุ่ม.mp3'),
      drop: new Audio('currect-เสียงวางชิ้นส่วนถูก.mp3'),
      error: new Audio('error-เสียงวางผิด.mp3'),
      success: new Audio('success-เสียงสำเร็จ.mp3')
    };
    
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.sfxVolume;
      sound.preload = 'auto';
    });
    
    console.log('ระบบเสียงเริ่มต้นเรียบร้อยแล้ว', this.sounds);
  },
  
  playBgMusic: function() {
    return;
  },
  
  pauseBgMusic: function() {
    return;
  },
  
  stopBgMusic: function() {
    return;
  },
  
  playSound: function(soundName) {
    if (state.sound && this.sounds[soundName]) {
      try {
        const sound = this.sounds[soundName].cloneNode();
        sound.volume = this.sfxVolume;
        sound.play().catch(e => {
          console.log('ไม่สามารถเล่นเสียงได้:', e, soundName);
        });
      } catch (e) {
        console.log('เกิดข้อผิดพลาดในการเล่นเสียง:', e, soundName);
      }
    }
  },
  
  setSfxVolume: function(volume) {
    this.sfxVolume = volume;
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.volume = volume;
      }
    });
  }
};

// ---------- Elements ----------
const el = {
  time: document.getElementById('time'),
  score: document.getElementById('score'),
  board: document.getElementById('board'),
  tray: document.getElementById('tray'),
  btnSfxToggle: document.getElementById('btnSfxToggle'),
  difficulty: document.getElementById('difficulty'),
  s1: document.getElementById('s1'), 
  s2: document.getElementById('s2'), 
  s3: document.getElementById('s3'),
  modal: document.getElementById('modal'),
  btnStop: document.getElementById('btnStop'),
  btnClear: document.getElementById('btnClear'),
  btnClose: document.getElementById('btnClose'),
  optSound: document.getElementById('optSound'),
  optCustomPieces: document.getElementById('optCustomPieces'),
  optParTime: document.getElementById('optParTime'),
  optSfxVolume: document.getElementById('optSfxVolume'),
  optMaxRounds: document.getElementById('optMaxRounds'),
  currentRound: document.getElementById('currentRound'),
  maxRounds: document.getElementById('maxRounds'),
};

// ---------- State ----------
let state = {
  startTs: 0,
  raf: 0,
  placed: 0,
  paused: false,
  score: 0,
  difficulty: 'normal',
  customPieces: 6,
  parTime: 25,
  sound: true,
  set: [],
  maxRounds: 10,
  currentRound: 0,
  starCounts: { 1: 0, 2: 0, 3: 0 },
};

// Apply UI
el.difficulty.value = state.difficulty;
el.optCustomPieces.value = state.customPieces;
el.optParTime.value = state.parTime;
el.optSound.checked = !!state.sound;
el.optSfxVolume.value = 70;
el.optMaxRounds.value = state.maxRounds;
el.score.textContent = state.score;
el.maxRounds.textContent = state.maxRounds;
el.currentRound.textContent = state.currentRound;

updateSfxButton();
audioManager.init();

// ---------- Utils ----------
function rndPick(n, arr){ 
  const a = [...arr]; 
  const out = []; 
  while(out.length < n && a.length > 0){ 
    const idx = Math.floor(Math.random() * a.length);
    const item = a.splice(idx, 1)[0];
    if (item) {
      out.push(item);
    }
  } 
  return out; 
}

function shuffle(a){ 
  return a.sort(() => Math.random() - 0.5); 
}

function fmt(n){ 
  return (+n).toFixed(1); 
}

function updateSfxButton() {
  if (state.sound) {
    el.btnSfxToggle.textContent = '🔊 SFX';
    el.btnSfxToggle.title = 'ปิดเสียงเอฟเฟกต์';
  } else {
    el.btnSfxToggle.textContent = '🔇 SFX';
    el.btnSfxToggle.title = 'เปิดเสียงเอฟเฟกต์';
  }
}

// ---------- Audio Functions ----------
let AC;
function ac(){ 
  if(!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); 
  return AC; 
}

function beep(type = 'ok') {
  if (!state.sound) return;
  
  if (audioManager.sounds[type] && audioManager.sounds[type].src) {
    audioManager.playSound(type);
  } else {
    try {
      const ctx = ac(); 
      const o = ctx.createOscillator(); 
      const g = ctx.createGain();
      o.connect(g).connect(ctx.destination);
      
      switch (type) {
        case 'ok':
          o.type = 'triangle';
          o.frequency.value = 660;
          g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
          break;
        case 'bad':
          o.type = 'square';
          o.frequency.value = 220;
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          break;
        case 'click':
          o.type = 'sine';
          o.frequency.value = 392;
          g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
          g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          break;
      }
      
      o.start(); 
      o.stop(ctx.currentTime + 0.35);
    } catch(e) {
      console.log('Audio error:', e);
    }
  }
}

// ---------- Game Logic ----------
function newLevel(){
  state.placed = 0;
  state.startTs = performance.now();
  el.time.textContent = '0.0';
  el.currentRound.textContent = state.currentRound;
  cancelAnimationFrame(state.raf);
  loop();

  let n = 6;
  if(state.difficulty === 'easy') n = 3;
  else if(state.difficulty === 'normal') n = 6;
  else if(state.difficulty === 'hard') n = 9;
  else if(state.difficulty === 'custom') n = Math.min(+state.customPieces || 6, SHAPES.length);

  n = Math.min(n, SHAPES.length);
  
  const picked = rndPick(n, SHAPES);
  state.set = picked;

  el.board.innerHTML = ''; 
  el.tray.innerHTML = '';
  
  picked.forEach((s, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.key = s.key;
    slot.dataset.color = s.color;
    
    const shadowShape = document.createElement('div');
    shadowShape.className = `shape shape-${s.key}`;
    shadowShape.style.color = s.color;
    
    slot.appendChild(shadowShape);
    el.board.appendChild(slot);

    const pc = document.createElement('div');
    pc.className = 'piece';
    pc.draggable = true;
    pc.dataset.key = s.key;
    pc.dataset.color = s.color;
    
    const pieceShape = document.createElement('div');
    pieceShape.className = `shape shape-${s.key}`;
    pieceShape.style.color = s.color;
    
    pc.appendChild(pieceShape);
    el.tray.appendChild(pc);
  });
  
  shuffle([...el.tray.children]).forEach(c => el.tray.appendChild(c));
  bindDnD();
  [el.s1, el.s2, el.s3].forEach(s => s.classList.remove('filled'));
}

function loop(){
  if(!state.paused){
    const t = (performance.now() - state.startTs) / 1000;
    el.time.textContent = fmt(t);
  }
  state.raf = requestAnimationFrame(loop);
}

function finish(){
  cancelAnimationFrame(state.raf);
  const t = (performance.now() - state.startTs) / 1000;
  audioManager.playSound('success');
  
  let stars = 1; 
  if(t <= state.parTime * 1.2) stars = 2; 
  if(t <= state.parTime) stars = 3;
  
  state.starCounts[stars]++;
  
  [el.s1, el.s2, el.s3].forEach((s, i) => s.classList.toggle('filled', i < stars));
  state.score += stars * 10;
  el.score.textContent = state.score;
  
  state.currentRound++;
  
  if (state.currentRound >= state.maxRounds) {
    showGameOver();
  } else {
    showLevelComplete(t);
  }
}

function showLevelComplete(time) {
  let stars = 1;
  if (time <= state.parTime * 1.2) stars = 2;
  if (time <= state.parTime) stars = 3;
  
  document.getElementById('completeTime').textContent = fmt(time);
  ['cs1', 'cs2', 'cs3'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('filled', i < stars);
  });
  
  document.getElementById('levelCompleteModal').classList.add('open');
}

function showGameOver() {
  document.getElementById('finalRounds').textContent = state.currentRound;
  document.getElementById('finalScore').textContent = state.score;
  document.getElementById('avgScore').textContent = Math.round(state.score / state.currentRound);
  document.getElementById('star1Count').textContent = state.starCounts[1];
  document.getElementById('star2Count').textContent = state.starCounts[2];
  document.getElementById('star3Count').textContent = state.starCounts[3];
  
  document.getElementById('gameOverModal').classList.add('open');
}

// ---------- Touch & Drag ----------
let touchElement = null;
let touchOffset = { x: 0, y: 0 };

function handleTouchStart(e) {
  if (e.touches.length !== 1) return;
  
  touchElement = e.target.closest('.piece');
  if (!touchElement || touchElement.style.visibility === 'hidden') return;
  
  const touch = e.touches[0];
  const rect = touchElement.getBoundingClientRect();
  touchOffset.x = touch.clientX - rect.left;
  touchOffset.y = touch.clientY - rect.top;
  
  e.preventDefault();
}

function handleTouchMove(e) {
  if (!touchElement || e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  touchElement.style.position = 'fixed';
  touchElement.style.left = (touch.clientX - touchOffset.x) + 'px';
  touchElement.style.top = (touch.clientY - touchOffset.y) + 'px';
  touchElement.style.zIndex = '1000';
  touchElement.style.transform = 'scale(1.1)';
  
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (!touchElement) return;
  
  const elementRect = touchElement.getBoundingClientRect();
  const centerX = elementRect.left + elementRect.width / 2;
  const centerY = elementRect.top + elementRect.height / 2;
  
  let dropped = false;
  document.querySelectorAll('.slot').forEach(slot => {
    const slotRect = slot.getBoundingClientRect();
    if (
      centerX > slotRect.left &&
      centerX < slotRect.right &&
      centerY > slotRect.top &&
      centerY < slotRect.bottom
    ) {
      if (touchElement.dataset.key === slot.dataset.key && 
          touchElement.dataset.color === slot.dataset.color) {
        
        const newShape = document.createElement('div');
        newShape.className = `shape shape-${touchElement.dataset.key}`;
        newShape.style.color = touchElement.dataset.color;
        
        slot.innerHTML = '';
        slot.appendChild(newShape);
        slot.classList.add('correct');
        state.placed++;
        beep('ok');
        if (state.placed === state.set.length) {
          finish();
        }
        touchElement.style.visibility = 'hidden';
        touchElement.style.pointerEvents = 'none';
      } else {
        slot.classList.add('wrong');
        beep('bad');
        setTimeout(() => slot.classList.remove('wrong'), 500);
      }
      dropped = true;
    }
  });
  
  touchElement.style.position = '';
  touchElement.style.left = '';
  touchElement.style.top = '';
  touchElement.style.zIndex = '';
  touchElement.style.transform = '';
  
  touchElement = null;
}

function bindDnD(){
  const pcs = el.tray.querySelectorAll('.piece');
  pcs.forEach(pc => {
    pc.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        key: pc.dataset.key,
        color: pc.dataset.color
      }));
    });
    
    pc.addEventListener('touchstart', handleTouchStart, { passive: false });
    pc.addEventListener('touchmove', handleTouchMove, { passive: false });
    pc.addEventListener('touchend', handleTouchEnd);
  });
  
  const slots = el.board.querySelectorAll('.slot');
  slots.forEach(sl => {
    sl.addEventListener('dragover', ev => ev.preventDefault());
    sl.addEventListener('drop', ev => {
      ev.preventDefault();
      const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
      if(data.key === sl.dataset.key && data.color === sl.dataset.color){
        const piece = [...el.tray.querySelectorAll('.piece')].find(p => 
          p.dataset.key === data.key && 
          p.dataset.color === data.color && 
          p.style.visibility !== 'hidden'
        );
        
        const newShape = document.createElement('div');
        newShape.className = `shape shape-${data.key}`;
        newShape.style.color = data.color;
        
        sl.innerHTML = '';
        sl.appendChild(newShape);
        sl.classList.add('correct');
        state.placed++;
        beep('ok');
        
        if(piece) {
          piece.style.visibility = 'hidden';
          piece.style.pointerEvents = 'none';
          piece.draggable = false;
        }
        if(state.placed === state.set.length){ 
          finish(); 
        }
      } else {
        sl.classList.add('wrong');
        beep('bad');
        setTimeout(() => sl.classList.remove('wrong'), 500);
      }
    });
  });
}

// ---------- Button Events ----------
el.btnSfxToggle.onclick = () => {
  state.sound = !state.sound;
  updateSfxButton();
  beep('click');
};

el.difficulty.onchange = () => { 
  state.difficulty = el.difficulty.value; 
  beep('click');
  newLevel(); 
};

el.btnStop.onclick = () => {
  state.paused = true;
  beep('click');
  document.getElementById('stopModal').classList.add('open');
};

el.btnClose.onclick = () => { 
  el.modal.classList.remove('open'); 
  state.customPieces = +el.optCustomPieces.value; 
  state.parTime = +el.optParTime.value; 
  state.sound = el.optSound.checked;
  state.maxRounds = +el.optMaxRounds.value;
  el.maxRounds.textContent = state.maxRounds;
  
  updateSfxButton();
  audioManager.setSfxVolume(el.optSfxVolume.value / 100);
  
  beep('click');
};

el.btnClear.onclick = () => { 
  if(confirm('ล้างสถิติทั้งหมด?')){ 
    state.score = 0; 
    el.score.textContent = 0; 
    beep('click');
  } 
};

// ---------- Menu Events ----------
document.getElementById('btnPlayMenu').addEventListener('click', function() {
  beep('click');
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('difficultyMenu').classList.add('open');
});

document.getElementById('btnHowToPlay').addEventListener('click', function() {
  beep('click');
  document.getElementById('mainMenu').classList.remove('open');
  document.getElementById('howToPlayModal').classList.add('open');
});

document.getElementById('btnExitGame').addEventListener('click', function() {
  beep('click');
  if(confirm('คุณต้องการออกจากเกมใช่หรือไม่?')) {
    window.close();
    setTimeout(() => {
      alert('กรุณาปิดแท็บเบราว์เซอร์เพื่อออกจากเกม');
    }, 100);
  }
});

document.getElementById('btnCloseHowTo').addEventListener('click', function() {
  beep('click');
  document.getElementById('howToPlayModal').classList.remove('open');
  document.getElementById('mainMenu').classList.add('open');
});

document.getElementById('btnBackToMain').addEventListener('click', function() {
  beep('click');
  document.getElementById('difficultyMenu').classList.remove('open');
  document.getElementById('mainMenu').classList.add('open');
});

document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    beep('click');
    const difficulty = this.dataset.difficulty;
    state.difficulty = difficulty;
    el.difficulty.value = difficulty;
    
    if (difficulty === 'custom') {
      document.getElementById('difficultyMenu').classList.remove('open');
      el.modal.classList.add('open');
    } else {
      document.getElementById('difficultyMenu').classList.remove('open');
      state.score = 0;
      state.currentRound = 0;
      state.starCounts = { 1: 0, 2: 0, 3: 0 };
      el.score.textContent = 0;
      newLevel();
    }
  });
});

document.getElementById('btnNextLevel').addEventListener('click', function() {
  beep('click');
  document.getElementById('levelCompleteModal').classList.remove('open');
  newLevel();
});

// ---------- Stop Modal Events ----------
document.getElementById('btnResumeGame').addEventListener('click', function() {
  beep('click');
  state.paused = false;
  document.getElementById('stopModal').classList.remove('open');
});

document.getElementById('btnRestartLevel').addEventListener('click', function() {
  beep('click');
  document.getElementById('stopModal').classList.remove('open');
  state.paused = false;
  newLevel();
});

document.getElementById('btnSettings').addEventListener('click', function() {
  beep('click');
  document.getElementById('stopModal').classList.remove('open');
  el.modal.classList.add('open');
});

document.getElementById('btnBackToMenu').addEventListener('click', function() {
  beep('click');
  document.getElementById('stopModal').classList.remove('open');
  cancelAnimationFrame(state.raf);
  state.paused = false;
  state.score = 0;
  state.currentRound = 0;
  state.starCounts = { 1: 0, 2: 0, 3: 0 };
  el.score.textContent = 0;
  el.board.innerHTML = '';
  el.tray.innerHTML = '';
  document.getElementById('mainMenu').classList.add('open');
});

// ---------- Game Over Modal Events ----------
document.getElementById('btnPlayAgain').addEventListener('click', function() {
  beep('click');
  document.getElementById('gameOverModal').classList.remove('open');
  state.score = 0;
  state.currentRound = 0;
  state.starCounts = { 1: 0, 2: 0, 3: 0 };
  el.score.textContent = 0;
  newLevel();
});

document.getElementById('btnBackToMenuFromGameOver').addEventListener('click', function() {
  beep('click');
  document.getElementById('gameOverModal').classList.remove('open');
  cancelAnimationFrame(state.raf);
  state.paused = false;
  state.score = 0;
  state.currentRound = 0;
  state.starCounts = { 1: 0, 2: 0, 3: 0 };
  el.score.textContent = 0;
  el.board.innerHTML = '';
  el.tray.innerHTML = '';
  document.getElementById('mainMenu').classList.add('open');
});

// Preload sounds when page loads
window.addEventListener('load', function() {
  Object.values(audioManager.sounds).forEach(sound => {
    if (sound) {
      sound.load();
    }
  });
});