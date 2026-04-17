// ===== WEB AUDIO API CORE =====
let audioCtx = null;

export function getAudioCtx() { return audioCtx; }

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playMiss() {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
    g.gain.setValueAtTime(0.5, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.2);
  } catch(e) {}
}

export function playSlurp() {
  if (!audioCtx) return;
  try {
    const size = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i]; data[i] *= 3.5;
    }
    const src = audioCtx.createBufferSource(); src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, audioCtx.currentTime + 0.15);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(2.0, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    src.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
    src.start();
  } catch(e) {}
}

export function playSound(freq, dur, type, vol) {
  if (type === 'slurp') return playSlurp();
  if (type === 'miss') return playMiss();
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = vol || 0.3;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e) {}
}

// Auto-init on first user interaction
document.addEventListener('pointerdown', function _initA() {
  initAudio();
  if (navigator.vibrate) navigator.vibrate(10);
}, false);

// Prevent page scrolling / zooming
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });
document.addEventListener('gestureend', function(e) { e.preventDefault(); }, { passive: false });
