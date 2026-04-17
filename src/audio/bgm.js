// ===== RHYTHM BGM ENGINE (AudioBuffer scheduled) =====
// Layered synth that intensifies with combo:
//   < 10 combo  : kick + hihat + bass  (140 BPM baseline)
//   >=10 combo  : + lead melody riff   (155 BPM)
//   >=20 combo  : + arpeggio           (170 BPM)
//   >=30 combo  : + rapid hihats / doubled lead (185 BPM, peak)
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

  // Noise buffers for hihats (short / long tails)
  const hhBufShort = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03 | 0, audioCtx.sampleRate);
  const hhDataS = hhBufShort.getChannelData(0);
  for (let i = 0; i < hhDataS.length; i++) hhDataS[i] = (Math.random() * 2 - 1) * (1 - i / hhDataS.length);
  const hhBufLong = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05 | 0, audioCtx.sampleRate);
  const hhDataL = hhBufLong.getChannelData(0);
  for (let i = 0; i < hhDataL.length; i++) hhDataL[i] = (Math.random() * 2 - 1) * (1 - i / hhDataL.length);

  // Lead melody riff (minor pentatonic-ish, 8 steps per bar, C minor-ish)
  // frequencies in Hz; null = rest
  const LEAD_RIFF = [
    523.25, null,  622.25, 698.46,  622.25, null,  523.25, 466.16, // bar A
    523.25, 466.16, 523.25, 622.25,  698.46, 622.25, 523.25, null,  // bar B
  ];
  // Arpeggio sequence (16 steps per bar) triggered on every 8th note
  const ARP = [
    261.63, 311.13, 392.00, 466.16,  523.25, 466.16, 392.00, 311.13,
    261.63, 311.13, 392.00, 466.16,  523.25, 622.25, 698.46, 783.99,
  ];

  let beat = 0;            // 4-on-the-floor beat counter (quarter notes)
  let sub = 0;             // 8th-note subdivision counter
  let nextBeatTime = audioCtx.currentTime;
  const LOOKAHEAD = 0.1;
  const TIMER_MS  = 25;

  function playLead(time, freq, bpm, layered) {
    if (!bgmGain) return;
    try {
      // Main lead: square wave with small portamento feel via slight detune
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      const dur = Math.min(60 / bpm * 0.9, 0.28);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.14, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      const f = audioCtx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      osc.connect(f); f.connect(g); g.connect(bgmGain);
      osc.start(time); osc.stop(time + dur + 0.02);

      // Layered octave lead at peak (combo 30)
      if (layered) {
        const o2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(freq * 2, time);
        g2.gain.setValueAtTime(0.0001, time);
        g2.gain.exponentialRampToValueAtTime(0.06, time + 0.01);
        g2.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f2 = audioCtx.createBiquadFilter();
        f2.type = 'lowpass'; f2.frequency.value = 3500;
        o2.connect(f2); f2.connect(g2); g2.connect(bgmGain);
        o2.start(time); o2.stop(time + dur + 0.02);
      }
    } catch(e) {}
  }

  function playArp(time, freq, bpm) {
    if (!bgmGain) return;
    try {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      const dur = Math.min(60 / bpm * 0.45, 0.18);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.08, time + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(g); g.connect(bgmGain);
      osc.start(time); osc.stop(time + dur + 0.02);
    } catch(e) {}
  }

  function scheduleNote(time, bpm) {
    if (!bgmGain) return;
    try {
      // ---- KICK ----
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

      // ---- HIHATS ----
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
      // Rapid hihats at peak (combo 30): 4 subdivisions per beat
      if (bpm >= 185) {
        for (let k = 1; k <= 3; k++) {
          const hhX = audioCtx.createBufferSource();
          hhX.buffer = hhBufShort;
          const hhXG = audioCtx.createGain(); hhXG.gain.value = 0.10;
          hhX.connect(hhF); hhXG.connect(bgmGain);
          hhX.start(time + (60 / bpm) * (k / 4));
        }
      }

      // ---- BASS ----
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

      // ---- LEAD MELODY (combo 10+) ----
      // Fires on every other 8th-note step (one note per quarter) — 8 notes per bar.
      if (bpm >= 155) {
        const leadStep = (beat) % LEAD_RIFF.length;
        const f = LEAD_RIFF[leadStep];
        if (f != null) playLead(time, f, bpm, bpm >= 185);
      }

      // ---- ARPEGGIO (combo 20+) ----
      // Fires on every 8th note (two per beat).
      if (bpm >= 170) {
        const s1 = (sub) % ARP.length;
        const s2 = (sub + 1) % ARP.length;
        playArp(time, ARP[s1], bpm);
        playArp(time + 30 / bpm, ARP[s2], bpm);
      }
    } catch(e) {}
    beat++;
    sub += 2;
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
