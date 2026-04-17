// ===== AMBIENT BGM + SCENE SE =====
import { getAudioCtx, initAudio } from './core.js';
import { onClearTimers } from '../state.js';

let ambientSource = null;
let ambientGain = null;

export function startAmbientBGM() {
  const audioCtx = getAudioCtx() || (initAudio(), getAudioCtx());
  if (!audioCtx) return;
  if (ambientSource) return;
  try {
    const sampleRate = audioCtx.sampleRate;
    const duration = 4;
    const size = sampleRate * duration;
    const buffer = audioCtx.createBuffer(2, size, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < size; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 5;
        data[i] += Math.sin(i / sampleRate * 2 * Math.PI * (80 + ch * 20)) * 0.02;
      }
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.5;
    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.15;
    src.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    src.start();
    ambientSource = src;
  } catch(e) {}
}

export function stopAmbientBGM() {
  const audioCtx = getAudioCtx();
  if (ambientSource && audioCtx) {
    try {
      if (ambientGain) {
        ambientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        setTimeout(() => { try { ambientSource.stop(); } catch(e) {} ambientSource = null; ambientGain = null; }, 600);
      } else {
        ambientSource.stop(); ambientSource = null;
      }
    } catch(e) { ambientSource = null; ambientGain = null; }
  }
}

// ===== SCENE AMBIENT SE =====
let sceneSENodes = [];
let sceneSEGain = null;
let sceneSEInterval = null;

export function stopSceneSE() {
  const audioCtx = getAudioCtx();
  if (sceneSEInterval) { clearInterval(sceneSEInterval); sceneSEInterval = null; }
  if (sceneSEGain && audioCtx) {
    try { sceneSEGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4); } catch(e) {}
  }
  const oldNodes = sceneSENodes;
  const oldGain = sceneSEGain;
  setTimeout(() => {
    oldNodes.forEach(n => { try { n.stop(); } catch(e) {} try { n.disconnect(); } catch(e) {} });
    if (oldGain) try { oldGain.disconnect(); } catch(e) {}
  }, 500);
  sceneSENodes = [];
  sceneSEGain = null;
}

export function startSceneSE(type) {
  initAudio();
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  stopSceneSE();
  try {
    sceneSEGain = audioCtx.createGain();
    sceneSEGain.gain.value = 0;
    sceneSEGain.connect(audioCtx.destination);

    if (type === 'ticket') {
      const sampleRate = audioCtx.sampleRate;
      const dur = 3;
      const size = sampleRate * dur;
      const buf = audioCtx.createBuffer(1, size, sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < size; i++) {
        const t = i / sampleRate;
        d[i] = Math.sin(t * 2 * Math.PI * 60) * 0.3
             + Math.sin(t * 2 * Math.PI * 120) * 0.15
             + (Math.random() * 2 - 1) * 0.05;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 200;
      lp.Q.value = 1;
      src.connect(lp);
      lp.connect(sceneSEGain);
      src.start();
      sceneSENodes.push(src);

      sceneSEInterval = setInterval(() => {
        if (!audioCtx || !sceneSEGain) return;
        try {
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(g);
          g.connect(sceneSEGain);
          osc.start(now);
          osc.stop(now + 0.03);
        } catch(e) {}
      }, 800 + Math.random() * 1200);

      sceneSEGain.gain.setValueAtTime(0, audioCtx.currentTime);
      sceneSEGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.5);

    } else if (type === 'kitchen' || type === 'kitchen_loud') {
      const vol = type === 'kitchen_loud' ? 0.13 : 0.10;
      const sampleRate = audioCtx.sampleRate;

      const sizzleDur = 4;
      const sizzleSize = sampleRate * sizzleDur;
      const sizzleBuf = audioCtx.createBuffer(1, sizzleSize, sampleRate);
      const sd = sizzleBuf.getChannelData(0);
      for (let i = 0; i < sizzleSize; i++) {
        sd[i] = (Math.random() * 2 - 1) * 0.6;
        sd[i] *= 0.5 + 0.5 * Math.sin(i / sampleRate * 2 * Math.PI * 3.5);
      }
      const sizzleSrc = audioCtx.createBufferSource();
      sizzleSrc.buffer = sizzleBuf;
      sizzleSrc.loop = true;
      const hp = audioCtx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      hp.Q.value = 0.5;
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 6000;
      bp.Q.value = 0.8;
      sizzleSrc.connect(hp);
      hp.connect(bp);
      bp.connect(sceneSEGain);
      sizzleSrc.start();
      sceneSENodes.push(sizzleSrc);

      const steamDur = 3;
      const steamSize = sampleRate * steamDur;
      const steamBuf = audioCtx.createBuffer(1, steamSize, sampleRate);
      const stData = steamBuf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < steamSize; i++) {
        const w = Math.random() * 2 - 1;
        stData[i] = (lastOut + 0.02 * w) / 1.02;
        lastOut = stData[i];
        stData[i] *= 4;
      }
      const steamSrc = audioCtx.createBufferSource();
      steamSrc.buffer = steamBuf;
      steamSrc.loop = true;
      const steamBP = audioCtx.createBiquadFilter();
      steamBP.type = 'bandpass';
      steamBP.frequency.value = 800;
      steamBP.Q.value = 0.4;
      steamSrc.connect(steamBP);
      steamBP.connect(sceneSEGain);
      steamSrc.start();
      sceneSENodes.push(steamSrc);

      sceneSEInterval = setInterval(() => {
        if (!audioCtx || !sceneSEGain) return;
        try {
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
          osc.frequency.exponentialRampToValueAtTime(300 + Math.random() * 200, now + 0.08);
          g.gain.setValueAtTime(0.06, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(g);
          g.connect(sceneSEGain);
          osc.start(now);
          osc.stop(now + 0.1);
        } catch(e) {}
      }, 1500 + Math.random() * 2000);

      sceneSEGain.gain.setValueAtTime(0, audioCtx.currentTime);
      sceneSEGain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.5);

    } else if (type === 'calm') {
      const sampleRate = audioCtx.sampleRate;
      const dur = 4;
      const size = sampleRate * dur;
      const buf = audioCtx.createBuffer(1, size, sampleRate);
      const d = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < size; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = (lastOut + 0.02 * w) / 1.02;
        lastOut = d[i];
        d[i] *= 3;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lp.Q.value = 0.3;
      src.connect(lp);
      lp.connect(sceneSEGain);
      src.start();
      sceneSENodes.push(src);

      sceneSEGain.gain.setValueAtTime(0, audioCtx.currentTime);
      sceneSEGain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1.0);
    }
  } catch(e) {}
}

// Register cleanup to run when clearAllTimers() is called
onClearTimers(() => { stopAmbientBGM(); stopSceneSE(); });
