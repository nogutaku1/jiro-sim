// ===== RHYTHM BGM ENGINE (AudioBuffer scheduled) =====
import { getAudioCtx, initAudio } from './core.js';

let bgmInterval = null;
let bgmGain = null;
let bgmRunning = false;
let bgmCurrentBPM = 140;

export function setBGMCurrentBPM(bpm) { bgmCurrentBPM = bpm; }
export function getBGMCurrentBPM() { return bgmCurrentBPM; }

export function startRhythmBGM() {
  initAudio();
  const audioCtx = getAudioCtx();
  if (!audioCtx) return;
  if (bgmRunning) return;
  bgmRunning = true;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.10;
  bgmGain.connect(audioCtx.destination);

  const hhBufShort = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03 | 0, audioCtx.sampleRate);
  const hhDataS = hhBufShort.getChannelData(0);
  for (let i = 0; i < hhDataS.length; i++) hhDataS[i] = (Math.random() * 2 - 1) * (1 - i / hhDataS.length);
  const hhBufLong = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05 | 0, audioCtx.sampleRate);
  const hhDataL = hhBufLong.getChannelData(0);
  for (let i = 0; i < hhDataL.length; i++) hhDataL[i] = (Math.random() * 2 - 1) * (1 - i / hhDataL.length);

  let beat = 0;
  let nextBeatTime = audioCtx.currentTime;
  const LOOKAHEAD = 0.1;
  const TIMER_MS  = 25;

  function scheduleNote(time, bpm) {
    if (!bgmGain) return;
    try {
      if (beat % 4 === 0 || beat % 4 === 2) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        g.gain.setValueAtTime(0.6, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(g); g.connect(bgmGain);
        osc.start(time); osc.stop(time + 0.15);
      }
      const hhBuf = bpm >= 155 ? hhBufShort : hhBufLong;
      const hh = audioCtx.createBufferSource();
      hh.buffer = hhBuf;
      const hhG = audioCtx.createGain();
      hhG.gain.value = 0.3;
      const hhF = audioCtx.createBiquadFilter();
      hhF.type = 'highpass'; hhF.frequency.value = 7000;
      hh.connect(hhF); hhF.connect(hhG); hhG.connect(bgmGain);
      hh.start(time);
      if (bpm >= 155) {
        const hh2 = audioCtx.createBufferSource();
        hh2.buffer = hhBufShort;
        const hhG2 = audioCtx.createGain(); hhG2.gain.value = 0.15;
        hh2.connect(hhF); hhG2.connect(bgmGain);
        hh2.start(time + 30 / bpm);
      }
      if (beat % 4 === 0 || beat % 4 === 2) {
        const bassFreqs = [55, 65, 55, 73];
        const baseF = bassFreqs[Math.floor(beat / 4) % bassFreqs.length];
        const bOsc = audioCtx.createOscillator();
        const bG = audioCtx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.value = bpm >= 170 ? baseF * 2 : baseF;
        bG.gain.setValueAtTime(0.25, time);
        bG.gain.exponentialRampToValueAtTime(0.001, time + 60 / bpm * 1.5);
        const bF = audioCtx.createBiquadFilter();
        bF.type = 'lowpass'; bF.frequency.value = 400;
        bOsc.connect(bF); bF.connect(bG); bG.connect(bgmGain);
        bOsc.start(time); bOsc.stop(time + 60 / bpm * 2);
      }
    } catch(e) {}
    beat++;
  }

  function lookahead() {
    if (!bgmRunning) return;
    const bpm = bgmCurrentBPM || 140;
    const beatLen = 60 / bpm;
    while (nextBeatTime < audioCtx.currentTime + LOOKAHEAD) {
      scheduleNote(nextBeatTime, bpm);
      nextBeatTime += beatLen;
    }
  }

  lookahead();
  bgmInterval = setInterval(lookahead, TIMER_MS);
}

export function stopRhythmBGM(fadeOut) {
  bgmRunning = false;
  if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
  const audioCtx = getAudioCtx();
  if (bgmGain && audioCtx) {
    try {
      if (fadeOut) {
        bgmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        setTimeout(() => { bgmGain = null; }, 400);
      } else {
        bgmGain.gain.setValueAtTime(0, audioCtx.currentTime);
        bgmGain = null;
      }
    } catch(e) { bgmGain = null; }
  }
}
