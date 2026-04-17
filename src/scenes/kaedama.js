// ===== KAEDAMA SCENE (noodle refill mini-rhythm) =====
// Inserted between rhythm-clear and sceneExit. Skipped for 'hard' (大ぶた).
// Three choices: kaedama mini-rhythm / oomori instant bonus / decline (restraint title).
import { currentLang } from '../i18n.js';
import { state, addTimeout, setRAF } from '../state.js';
import { showScene } from '../scene-manager.js';
import { playSound } from '../audio/core.js';

const STRINGS = {
  ja: {
    prompt: '替え玉どうですか？',
    sub: '3秒以内に選んでください',
    kaedama: '替え玉！',
    oomori: '大盛',
    decline: '結構です',
    finish: 'ごちそうさま！',
    refillGo: '替え玉スタート！',
    oomoriGet: '大盛：+200',
    restraint: '節制…',
  },
  en: {
    prompt: 'Want a refill?',
    sub: 'Decide within 3s',
    kaedama: 'Kaedama!',
    oomori: 'Oomori',
    decline: 'No thanks',
    finish: 'Thanks for the meal!',
    refillGo: 'Refill start!',
    oomoriGet: 'Oomori: +200',
    restraint: 'Restraint...',
  },
};
const s = () => STRINGS[currentLang] || STRINGS.ja;

export function sceneKaedama(onComplete) {
  // Skip entirely for 大ぶた (hard) — player is stuffed.
  if (state.difficulty === 'hard') { onComplete && onComplete({ kaedama: false, restraint: false }); return; }

  const scene = showScene('scene-kaedama');
  scene.innerHTML = '';
  scene.style.background = '#111';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,#1a1a1a,#000);z-index:0;';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.style.zIndex = '2';
  content.innerHTML = `
    <p style="color:#D4A017;font-size:22px;font-weight:900;margin-bottom:8px;">${s().prompt}</p>
    <p id="kd-countdown" style="color:#fff;font-size:14px;font-weight:700;margin-bottom:18px;opacity:0.7;">${s().sub} <span id="kd-sec">3</span></p>
    <div style="display:flex;flex-direction:column;gap:10px;align-items:center;">
      <button class="btn-gold" id="kd-yes" style="min-width:180px;">${s().kaedama}</button>
      <button class="btn-secondary" id="kd-oomori" style="min-width:180px;">${s().oomori}</button>
      <button class="btn-secondary" id="kd-no" style="min-width:180px;">${s().decline}</button>
    </div>
  `;
  scene.appendChild(content);

  let decided = false;
  let secondsLeft = 3;
  const secEl = content.querySelector('#kd-sec');
  const tick = setInterval(() => {
    secondsLeft--;
    if (secEl) secEl.textContent = String(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) {
      clearInterval(tick);
      if (!decided) choose('decline');
    }
  }, 1000);

  function choose(which) {
    if (decided) return;
    decided = true;
    clearInterval(tick);
    if (which === 'kaedama') startMiniRhythm();
    else if (which === 'oomori') { state.score += 200; playSound(660, 0.12, 'square', 0.25); finish({ kaedama: false, restraint: false, oomori: true }); }
    else { playSound(330, 0.15, 'sine', 0.2); finish({ kaedama: false, restraint: true, oomori: false }); }
  }

  content.querySelector('#kd-yes').addEventListener('pointerdown', (e) => { e.preventDefault(); choose('kaedama'); });
  content.querySelector('#kd-oomori').addEventListener('pointerdown', (e) => { e.preventDefault(); choose('oomori'); });
  content.querySelector('#kd-no').addEventListener('pointerdown', (e) => { e.preventDefault(); choose('decline'); });

  function finish(result) {
    scene.innerHTML = '';
    const msg = result.oomori ? s().oomoriGet : result.restraint ? s().restraint : s().finish;
    const fin = document.createElement('div');
    fin.className = 'content';
    fin.style.justifyContent = 'center';
    fin.innerHTML = `<p style="color:#D4A017;font-size:26px;font-weight:900;animation:dramaticGrow 0.5s ease;">${msg}</p>`;
    scene.appendChild(fin);
    addTimeout(() => { onComplete && onComplete(result); }, 1200);
  }

  function startMiniRhythm() {
    scene.innerHTML = '';
    scene.style.background = '#0a0a0a';

    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 700;
    canvas.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:100%;max-height:100%;';
    scene.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:16px;left:0;width:100%;text-align:center;z-index:5;color:#D4A017;font-size:18px;font-weight:900;';
    hud.innerHTML = `<span id="kd-t">10</span>s · <span id="kd-hit">0</span> / 8`;
    scene.appendChild(hud);

    const JUDGE_Y = 560;
    const NOTE_SIZE = 70;
    const FALL = 1800; // ms, slightly easier than normal
    const TOTAL = 10;  // seconds
    const TARGET_NOTES = 8;
    let notes = [];
    let startTime = performance.now();
    let lastSpawn = startTime - 9999;
    let hit = 0;
    let miss = 0;
    let running = true;
    const gap = (TOTAL * 1000) / (TARGET_NOTES + 1);

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const tapX = (e.clientX - rect.left) * scaleX;
      let best = null, bd = Infinity;
      notes.forEach(n => {
        if (n.judged) return;
        if (Math.abs(n.x - tapX) > 120) return;
        const d = Math.abs(n.y + NOTE_SIZE / 2 - JUDGE_Y);
        if (d < bd) { bd = d; best = n; }
      });
      if (best && bd <= 80) {
        best.judged = true;
        hit++;
        state.score += bd <= 20 ? 120 : bd <= 45 ? 80 : 40;
        playSound(bd <= 20 ? 880 : 660, 0.08, 'slurp', 0.22);
        document.getElementById('kd-hit').textContent = String(hit);
      } else {
        miss++;
        playSound(220, 0.1, 'square', 0.15);
      }
    });

    function loop(now) {
      if (!running) return;
      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, TOTAL - elapsed);
      const tEl = document.getElementById('kd-t');
      if (tEl) tEl.textContent = String(Math.ceil(remaining));

      if (now - lastSpawn > gap && notes.length < TARGET_NOTES) {
        lastSpawn = now;
        const x = 60 + Math.random() * 280;
        const speed = (JUDGE_Y + NOTE_SIZE) / FALL * 1000;
        notes.push({ x, y: -NOTE_SIZE, speed, judged: false });
      }

      ctx.clearRect(0, 0, 400, 700);

      ctx.save();
      ctx.strokeStyle = '#D4A017';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#D4A017';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(20, JUDGE_Y); ctx.lineTo(380, JUDGE_Y);
      ctx.stroke();
      ctx.restore();

      const dt = 1 / 60;
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.speed * dt;
        if (!n.judged) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y + NOTE_SIZE / 2, NOTE_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#FF6B35';
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.font = '36px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🍜', n.x, n.y + NOTE_SIZE / 2);
          ctx.restore();
        }
        if (n.y > JUDGE_Y + 40 && !n.judged) { n.judged = true; miss++; }
        if (n.y > 760) notes.splice(i, 1);
      }

      if (remaining <= 0) {
        running = false;
        const success = hit >= 5;
        if (success) state.score += 150;
        addTimeout(() => { finish({ kaedama: true, restraint: false, oomori: false, kaedamaSuccess: success }); }, 300);
        return;
      }
      setRAF(requestAnimationFrame(loop));
    }
    setRAF(requestAnimationFrame(loop));
  }
}
