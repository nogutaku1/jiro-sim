// ===== SCENE 7: EATING RHYTHM GAME =====
import { t } from '../i18n.js';
import { state, addTimeout, setRAF } from '../state.js';
import { showScene, flashScreen } from '../scene-manager.js';
import { playSound } from '../audio/core.js';
import { startRhythmBGM, stopRhythmBGM, setBGMCurrentBPM } from '../audio/bgm.js';
import { ASSETS } from '../assets.js';
import { sceneExit } from './exit.js';
import { sceneWorstEnd } from './worst-end.js';

// --- Optional cross-track integrations (loaded lazily so missing modules no-op) ---
let _drama = null;
let _titles = null;
import('../ui/drama.js').then(m => { _drama = m; }).catch(() => {});
import('../meta/titles.js').then(m => { _titles = m; }).catch(() => {});

export function sceneEatingRhythm() {
  const scene = showScene('scene-eating_rhythm');
  scene.innerHTML = '';

  const diffSettings = {
    easy:   { fallDuration: 3000, totalTime: 25, spawnMin: 700, spawnMax: 1100, skullMin: 8000, skullMax: 12000 },
    normal: { fallDuration: 2200, totalTime: 30, spawnMin: 400, spawnMax: 700,  skullMin: 5000, skullMax: 8000 },
    hard:   { fallDuration: 1500, totalTime: 35, spawnMin: 200, spawnMax: 350,  skullMin: 2000, skullMax: 4000 }
  };
  const diff = Object.assign({}, diffSettings[state.difficulty]);
  const tp = state.toppings;
  if (tp.yasai === 1) { diff.spawnMin = Math.round(diff.spawnMin * 0.85); diff.spawnMax = Math.round(diff.spawnMax * 0.85); }
  if (tp.yasai >= 2) { diff.spawnMin = Math.round(diff.spawnMin * 0.65); diff.spawnMax = Math.round(diff.spawnMax * 0.65); }
  if (tp.abura === 1) { diff.skullMin = Math.round(diff.skullMin * 0.7); diff.skullMax = Math.round(diff.skullMax * 0.7); }
  if (tp.abura >= 2) { diff.skullMin = Math.round(diff.skullMin * 0.5); diff.skullMax = Math.round(diff.skullMax * 0.5); }
  if (tp.karame === 1) { diff.totalTime += 3; }
  if (tp.karame >= 2) { diff.totalTime += 5; }

  // Instruction overlay
  const instrOverlay = document.createElement('div');
  instrOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  const instrBg = document.createElement('img');
  instrBg.src = ASSETS.ramen_arrival;
  instrBg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
  instrOverlay.appendChild(instrBg);
  const instrDark = document.createElement('div');
  instrDark.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:1;';
  instrOverlay.appendChild(instrDark);
  const instrContent = document.createElement('div');
  instrContent.style.cssText = 'position:relative;z-index:2;text-align:center;padding:20px;';
  instrContent.innerHTML = `
    <p style="color:#D4A017;font-size:22px;font-weight:900;margin-bottom:12px;">${t('howToPlay')}</p>
    <p style="color:#fff;font-size:15px;font-weight:700;margin-bottom:6px;">🍜🥬🥩 ${t('tapEmoji')}</p>
    <p style="color:#E74C3C;font-size:15px;font-weight:700;margin-bottom:6px;">💀 ${t('skipSkull')}</p>
    <p style="color:#D4A017;font-size:13px;font-weight:700;margin-bottom:12px;">${t('comboUp')}</p>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;font-weight:700;margin-bottom:12px;">${t('tapOnBar')}</p>
    <div style="margin:20px auto;width:200px;height:120px;position:relative;border:2px solid rgba(255,255,255,0.2);border-radius:12px;overflow:hidden;">
      <div style="position:absolute;bottom:20px;left:0;width:100%;height:3px;background:#D4A017;box-shadow:0 0 10px #D4A017;"></div>
      <div id="demo-note" style="position:absolute;left:50%;transform:translateX(-50%);top:0;width:40px;height:40px;background:#FF6B35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;animation:demoDrop 1.5s ease-in infinite;">🍜</div>
    </div>
    <style>@keyframes demoDrop{0%{top:0;}80%{top:76px;}100%{top:76px;opacity:0.3;}}</style>
    <p style="color:#fff;font-size:16px;font-weight:700;margin-top:16px;">${t('tapToStart')}</p>
  `;
  instrOverlay.appendChild(instrContent);
  scene.appendChild(instrOverlay);

  instrOverlay.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    instrOverlay.remove();
    startRhythmGame();
  });

  function startRhythmGame() {
    const bgArrival = document.createElement('img');
    bgArrival.className = 'bg-img';
    bgArrival.src = ASSETS.ramen_arrival;
    bgArrival.style.transition = 'opacity 1s';
    scene.appendChild(bgArrival);

    const bgEmpty = document.createElement('img');
    bgEmpty.className = 'bg-img';
    bgEmpty.src = ASSETS.ramen_empty;
    bgEmpty.style.opacity = '0';
    bgEmpty.style.transition = 'opacity 1s';
    scene.appendChild(bgEmpty);

    const darkOverlay = document.createElement('div');
    darkOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0);transition:background 2s;z-index:1;';
    scene.appendChild(darkOverlay);

    const canvas = document.createElement('canvas');
    canvas.id = 'rhythm-canvas';
    canvas.width = 400;
    canvas.height = 700;
    canvas.style.pointerEvents = 'auto';
    scene.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const hudHTML = `
      <div class="rhythm-hud rhythm-hearts" id="rh-hearts">❤️❤️❤️❤️❤️</div>
      <div class="rhythm-hud rhythm-timer" id="rh-timer">${diff.totalTime}s</div>
      <div class="rhythm-hud rhythm-score" id="rh-score">0</div>
      <div class="rhythm-hud rhythm-combo" id="rh-combo" style="opacity:0;"></div>
    `;
    scene.insertAdjacentHTML('beforeend', hudHTML);

    const heartsEl = document.getElementById('rh-hearts');
    const timerEl = document.getElementById('rh-timer');
    const scoreEl = document.getElementById('rh-score');
    const comboEl = document.getElementById('rh-combo');

    const JUDGE_Y = 580;
    const NOTE_SIZE = 70;
    const noteTypes = [
      { emoji: '🍜', label: t('noodle'), color: '#FF6B35', skull: false },
      { emoji: '🥬', label: t('veggie'), color: '#4CAF50', skull: false },
      { emoji: '🥩', label: t('pork'), color: '#E91E63', skull: false },
      { emoji: '💀', label: t('choke'), color: '#666', skull: true }
    ];

    let notes = [];
    let particles = [];
    let gameRunning = true;
    let startTime = performance.now();
    let lastSpawn = 0;
    let lastSkullSpawn = 0;
    let nextSpawnDelay = diff.spawnMin;
    let nextSkullDelay = diff.skullMin + Math.random() * (diff.skullMax - diff.skullMin);
    let bgSwitched = false;
    let tutorialCount = 0;
    const TUTORIAL_NOTES = 5;
    let currentBPM = 140; setBGMCurrentBPM(140);

    // --- New "juice" state ---
    let missStreak = 0;          // consecutive misses
    let vignetteOn = false;      // is Track 2 vignette currently active
    let hitstopUntil = 0;        // timestamp until which game logic is frozen (perfect hit freeze)
    let hitFlashUntil = 0;       // white flash overlay across judgment line
    let milestoneFlashUntil = 0; // combo-milestone tint flash
    let milestoneColor = 'rgba(212,160,23,0.35)';
    let bestDistLastHit = 0;     // 0-1 closeness (0=perfect) — drives judgment ring pulse
    let judgePulseUntil = 0;     // brief pulse of judgment line on any hit

    function spawnNote(forceSkull) {
      if (tutorialCount < TUTORIAL_NOTES && forceSkull) return;
      const type = forceSkull ? noteTypes[3] : noteTypes[Math.floor(Math.random() * 3)];
      const x = 40 + Math.random() * 320;
      const baseSpeed = (JUDGE_Y + NOTE_SIZE) / diff.fallDuration * 1000;
      const speedMult = tutorialCount < TUTORIAL_NOTES ? 0.4 : 1;
      notes.push({
        x, y: -NOTE_SIZE, type,
        spawnTime: performance.now(),
        speed: baseSpeed * speedMult,
        judged: false,
        isTutorial: tutorialCount < TUTORIAL_NOTES
      });
      if (!forceSkull) tutorialCount++;
    }

    function spawnParticles(x, y, color, intensity) {
      // intensity: 1 = normal good/ok, 2 = perfect, 3 = milestone burst
      const count = intensity === 3 ? 22 : intensity === 2 ? 16 : 10;
      const speedBase = intensity === 3 ? 160 : intensity === 2 ? 130 : 80;
      const speedVar = intensity === 3 ? 200 : intensity === 2 ? 160 : 120;
      const life = intensity === 3 ? 0.55 : intensity === 2 ? 0.45 : 0.35;
      const rBase = intensity === 3 ? 4 : intensity === 2 ? 3.5 : 3;
      // Cap active particle count to stay cheap on mobile
      const MAX_PARTICLES = 30;
      const budget = Math.max(0, MAX_PARTICLES - particles.length);
      const toAdd = Math.min(count, budget);
      for (let i = 0; i < toAdd; i++) {
        const angle = (Math.PI * 2 / Math.max(1, toAdd)) * i + Math.random() * 0.6 - 0.3;
        const speed = speedBase + Math.random() * speedVar;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (intensity >= 2 ? 40 : 0),
          life, maxLife: life,
          color,
          r: rBase + Math.random() * 3,
          gravity: intensity >= 2 ? 260 : 0
        });
      }
    }

    function updateHUD() {
      scoreEl.textContent = state.score;
      heartsEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(5 - state.lives);
      if (state.combo >= 3) {
        comboEl.textContent = state.combo + ' COMBO';
        comboEl.style.opacity = '1';
        if (state.combo >= 30) comboEl.style.color = '#E74C3C';
        else if (state.combo >= 20) comboEl.style.color = '#FF6B35';
        else comboEl.style.color = '#D4A017';
      } else {
        comboEl.style.opacity = '0';
      }
    }

    function showJudgment(text, color) {
      const el = document.createElement('div');
      el.className = 'judgment-text';
      el.textContent = text;
      el.style.color = color;
      scene.appendChild(el);
      setTimeout(() => { el.remove(); }, 600);
    }

    function showMilestone(n, color) {
      // Dramatic zoom-in / fade-out combo milestone banner
      const el = document.createElement('div');
      el.textContent = n + ' COMBO!';
      el.style.cssText = [
        'position:absolute',
        'z-index:5',
        'left:50%',
        'top:40%',
        'transform:translate(-50%,-50%) scale(0.3)',
        'font-size:44px',
        'font-weight:900',
        'color:' + color,
        'text-shadow:0 0 18px ' + color + ', 0 0 4px #000, 2px 2px 0 #000',
        'pointer-events:none',
        'opacity:0',
        'transition:transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease',
        'letter-spacing:2px',
        'font-family:sans-serif'
      ].join(';');
      scene.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-50%) scale(1.0)';
      });
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%,-50%) scale(1.25)';
      }, 450);
      setTimeout(() => { el.remove(); }, 800);
    }

    function getMultiplier() {
      if (state.combo >= 30) return 3;
      if (state.combo >= 20) return 2;
      if (state.combo >= 10) return 1.5;
      return 1;
    }

    function safeStartVignette() {
      if (vignetteOn) return;
      vignetteOn = true;
      try { _drama && _drama.startVignette && _drama.startVignette(); } catch(e) {}
    }
    function safeStopVignette() {
      if (!vignetteOn) return;
      vignetteOn = false;
      try { _drama && _drama.stopVignette && _drama.stopVignette(); } catch(e) {}
    }

    function handleMiss() {
      state.combo = 0;
      state.missCount++;
      missStreak++;
      playSound(220, 0.15, 'square', 0.2);
      if (missStreak >= 2) safeStartVignette();
      if (state.missCount % 4 === 0) {
        state.lives--;
        if (state.lives <= 0) {
          gameRunning = false;
          safeStopVignette();
          stopRhythmBGM(false);
          scene.innerHTML = '';
          const endDiv = document.createElement('div');
          endDiv.className = 'content';
          endDiv.innerHTML = `
            <p style="color:#E74C3C;font-size:28px;font-weight:900;">${t('stomachLimit')}</p>
            <p style="color:#fff;font-size:18px;font-weight:700;margin-top:16px;">${t('scoreLabel')}: ${state.score}</p>
          `;
          scene.appendChild(endDiv);
          try { _titles && _titles.checkTitles && _titles.checkTitles({ event: 'rhythm-end', score: state.score, maxCombo: state.maxCombo, outcome: 'stomach' }); } catch(e) {}
          addTimeout(() => { sceneWorstEnd('stomach'); }, 2500);
          return;
        }
      }
      updateHUD();
    }

    function triggerMilestone(combo) {
      // Combo milestone drama: screen tint flash + bigger particle burst + zoom text
      let color, tint;
      if (combo >= 30) { color = '#E74C3C'; tint = 'rgba(231,76,60,0.40)'; }
      else if (combo >= 20) { color = '#FF6B35'; tint = 'rgba(255,107,53,0.35)'; }
      else { color = '#D4A017'; tint = 'rgba(212,160,23,0.35)'; }
      milestoneColor = tint;
      milestoneFlashUntil = performance.now() + 250;
      flashScreen(tint, 380);
      showMilestone(combo, color);
      // Extra particle burst at judgment line
      for (let i = 0; i < 3; i++) {
        spawnParticles(80 + i * 120, JUDGE_Y, color, 3);
      }
      // Sound: ascending triad
      playSound(523, 0.12, 'square', 0.25);
      setTimeout(() => playSound(659, 0.12, 'square', 0.25), 80);
      setTimeout(() => playSound(784, 0.18, 'square', 0.3), 160);
      if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!gameRunning) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const tapX = (e.clientX - rect.left) * scaleX;

      let closest = null;
      let closestDist = Infinity;
      notes.forEach(n => {
        if (n.judged) return;
        const dx = Math.abs(n.x - tapX);
        if (dx > 120) return;
        const dist = Math.abs(n.y + NOTE_SIZE / 2 - JUDGE_Y);
        if (dist < closestDist) { closestDist = dist; closest = n; }
      });

      if (closest && closestDist <= 80) {
        closest.judged = true;
        bestDistLastHit = closestDist;
        judgePulseUntil = performance.now() + 180;
        if (closest.type.skull) {
          state.score = Math.max(0, state.score - 50);
          playSound(150, 0.2, 'miss', 0.25);
          state.combo = 0;
          currentBPM = 140; setBGMCurrentBPM(140);
          flashScreen('rgba(255,0,0,0.5)');
          showJudgment('-50', '#E74C3C');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else {
          // Hit breaks any miss-streak vignette
          missStreak = 0;
          safeStopVignette();

          let pts = 0, label = '', color = '';
          let ninnikuBonus = 1;
          if (state.toppings.ninniku >= 2) ninnikuBonus = 1.3;
          if (state.toppings.ninniku >= 3) ninnikuBonus = 1.5;
          let isPerfect = false;
          if (closestDist <= 20) {
            isPerfect = true;
            pts = Math.round(100 * ninnikuBonus); label = t('perfectHit'); color = '#D4A017';
            flashScreen('rgba(212,160,23,0.3)');
            playSound(880, 0.1, 'slurp', 0.25);
            if (navigator.vibrate) navigator.vibrate(30);
            spawnParticles(closest.x, JUDGE_Y, '#D4A017', 2);
            // PERFECT SNAP: hitstop + brief bright flash
            hitstopUntil = performance.now() + 50;
            hitFlashUntil = performance.now() + 90;
            // Bigger note-pop (scale flash on the note itself handled via render)
            closest.popUntil = performance.now() + 120;
          } else if (closestDist <= 45) {
            pts = Math.round(70 * ninnikuBonus); label = t('goodHit'); color = '#4FC3F7';
            playSound(660, 0.08, 'slurp', 0.2);
            if (navigator.vibrate) navigator.vibrate(10);
            spawnParticles(closest.x, JUDGE_Y, '#4FC3F7', 1);
          } else {
            pts = Math.round(30 * ninnikuBonus); label = t('okHit'); color = '#4CAF50';
            playSound(440, 0.08, 'slurp', 0.15);
            if (navigator.vibrate) navigator.vibrate(5);
            spawnParticles(closest.x, JUDGE_Y, '#4CAF50', 1);
          }
          pts = Math.floor(pts * getMultiplier());
          state.score += pts;
          const prevCombo = state.combo;
          state.combo++;
          if (state.combo > state.maxCombo) state.maxCombo = state.combo;

          // Combo milestone detection (crossed 10/20/30 boundaries)
          if ((prevCombo < 10 && state.combo >= 10) ||
              (prevCombo < 20 && state.combo >= 20) ||
              (prevCombo < 30 && state.combo >= 30)) {
            triggerMilestone(state.combo);
          }

          if (state.combo >= 30) currentBPM = 185;
          else if (state.combo >= 20) currentBPM = 170;
          else if (state.combo >= 10) currentBPM = 155;
          else currentBPM = 140;
          setBGMCurrentBPM(currentBPM);
          showJudgment(label, color);
        }
      } else {
        showJudgment(t('miss'), '#888');
        handleMiss();
        currentBPM = 140; setBGMCurrentBPM(140);
        if (navigator.vibrate) navigator.vibrate(50);
      }
      updateHUD();
    });

    // --- Dynamic difficulty: scale spawn interval over time ---
    // Slower near the start, ramping to baseline (spawnMin/Max) by ~60% of totalTime.
    // Second half gets progressively faster (spawnMin shrinks by up to 25%).
    function spawnIntervalFor(elapsedSec) {
      const totalSec = diff.totalTime;
      const p = Math.min(1, elapsedSec / totalSec);
      // Warmup: 0 → 0.35 eases spawn from 1.6x to 1.0x of baseline
      // Peak:   0.5 → 1.0 tightens spawn from 1.0x to 0.75x of baseline
      let scale;
      if (p < 0.35) {
        const u = p / 0.35;
        scale = 1.6 - 0.6 * u; // 1.6 → 1.0
      } else if (p < 0.5) {
        scale = 1.0;
      } else {
        const u = (p - 0.5) / 0.5;
        scale = 1.0 - 0.25 * u; // 1.0 → 0.75
      }
      const min = Math.max(120, diff.spawnMin * scale);
      const max = Math.max(min + 60, diff.spawnMax * scale);
      return min + Math.random() * (max - min);
    }

    // --- Pulsing tutorial arrow (DOM overlay) ---
    const arrow = document.createElement('div');
    arrow.id = 'rh-tutorial-arrow';
    arrow.style.cssText = [
      'position:absolute',
      'z-index:4',
      'left:50%',
      // rhythm canvas is 400x700; judge line at y=580. Convert to % roughly.
      // We anchor to canvas: canvas fills scene via CSS; approximate via top:70%.
      'top:66%',
      'transform:translate(-50%,0)',
      'pointer-events:none',
      'font-size:40px',
      'color:#D4A017',
      'text-shadow:0 0 16px rgba(212,160,23,0.9), 0 0 4px #000',
      'font-weight:900',
      'animation:rhArrowBounce 0.6s ease-in-out infinite alternate'
    ].join(';');
    arrow.innerHTML = '<div style="font-size:14px;letter-spacing:2px;margin-bottom:-6px;">TAP HERE</div><div>▼</div>';
    const arrowStyle = document.createElement('style');
    arrowStyle.textContent = '@keyframes rhArrowBounce{from{transform:translate(-50%,-6px);}to{transform:translate(-50%,6px);}}';
    scene.appendChild(arrowStyle);
    scene.appendChild(arrow);

    let lastFrameTime = performance.now();
    function gameLoop(now) {
      if (!gameRunning) return;

      // Hitstop: freeze game physics for ~50ms after a perfect hit,
      // but keep the render loop ticking so the flash still draws.
      const inHitstop = now < hitstopUntil;
      const dt = inHitstop ? 0 : Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, diff.totalTime - elapsed);
      timerEl.textContent = Math.ceil(remaining) + 's';

      const progress = elapsed / diff.totalTime;
      darkOverlay.style.background = `rgba(0,0,0,${progress * 0.3})`;
      if (progress >= 0.8 && !bgSwitched) {
        bgSwitched = true;
        bgEmpty.style.opacity = '1';
        bgArrival.style.opacity = '0';
      }

      // Remove tutorial arrow when tutorial ends
      if (tutorialCount >= TUTORIAL_NOTES && arrow.parentNode) {
        arrow.style.transition = 'opacity 0.4s';
        arrow.style.opacity = '0';
        setTimeout(() => { if (arrow.parentNode) arrow.parentNode.removeChild(arrow); }, 500);
      }

      if (!inHitstop && now - lastSpawn > nextSpawnDelay) {
        spawnNote(false);
        lastSpawn = now;
        nextSpawnDelay = spawnIntervalFor(elapsed);
      }
      if (!inHitstop && now - lastSkullSpawn > nextSkullDelay) {
        spawnNote(true);
        lastSkullSpawn = now;
        nextSkullDelay = diff.skullMin + Math.random() * (diff.skullMax - diff.skullMin);
      }

      ctx.clearRect(0, 0, 400, 700);

      // --- Judgment zone bands (brighter, clearly visible) ---
      ctx.save();
      // OK (green) — outer band, up to 80px from JUDGE_Y
      const okGrad = ctx.createLinearGradient(0, JUDGE_Y - 80, 0, JUDGE_Y + 80);
      okGrad.addColorStop(0,   'rgba(76,175,80,0)');
      okGrad.addColorStop(0.3, 'rgba(76,175,80,0.10)');
      okGrad.addColorStop(0.5, 'rgba(76,175,80,0.18)');
      okGrad.addColorStop(0.7, 'rgba(76,175,80,0.10)');
      okGrad.addColorStop(1,   'rgba(76,175,80,0)');
      ctx.fillStyle = okGrad;
      ctx.fillRect(20, JUDGE_Y - 80, 360, 160);
      // Good (blue) — middle band
      const goodGrad = ctx.createLinearGradient(0, JUDGE_Y - 45, 0, JUDGE_Y + 45);
      goodGrad.addColorStop(0,   'rgba(79,195,247,0)');
      goodGrad.addColorStop(0.3, 'rgba(79,195,247,0.16)');
      goodGrad.addColorStop(0.5, 'rgba(79,195,247,0.26)');
      goodGrad.addColorStop(0.7, 'rgba(79,195,247,0.16)');
      goodGrad.addColorStop(1,   'rgba(79,195,247,0)');
      ctx.fillStyle = goodGrad;
      ctx.fillRect(20, JUDGE_Y - 45, 360, 90);
      // Perfect (gold) — inner band
      const perfGrad = ctx.createLinearGradient(0, JUDGE_Y - 20, 0, JUDGE_Y + 20);
      perfGrad.addColorStop(0,   'rgba(212,160,23,0)');
      perfGrad.addColorStop(0.5, 'rgba(212,160,23,0.40)');
      perfGrad.addColorStop(1,   'rgba(212,160,23,0)');
      ctx.fillStyle = perfGrad;
      ctx.fillRect(20, JUDGE_Y - 20, 360, 40);
      // Thin edge strokes to frame zones (subtle but readable)
      ctx.strokeStyle = 'rgba(79,195,247,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, JUDGE_Y - 45, 360, 90);
      ctx.strokeStyle = 'rgba(212,160,23,0.55)';
      ctx.strokeRect(20, JUDGE_Y - 20, 360, 40);
      ctx.restore();

      // Combo-milestone tint overlay inside canvas (lives briefly)
      if (now < milestoneFlashUntil) {
        const alpha = (milestoneFlashUntil - now) / 250;
        ctx.save();
        ctx.fillStyle = milestoneColor.replace(/[\d.]+\)$/g, (alpha * 0.35).toFixed(3) + ')');
        ctx.fillRect(0, 0, 400, 700);
        ctx.restore();
      }

      // --- Judgment line (with hit-pulse) ---
      ctx.save();
      ctx.strokeStyle = '#D4A017';
      const pulseActive = now < judgePulseUntil;
      const pulseBoost = pulseActive ? (1 - (judgePulseUntil - now) / 180) : 0;
      ctx.lineWidth = 3 + pulseBoost * 4;
      ctx.shadowColor = '#D4A017';
      ctx.shadowBlur = 10 + Math.sin(now / 300) * 5 + pulseBoost * 20;
      ctx.beginPath();
      ctx.moveTo(20, JUDGE_Y);
      ctx.lineTo(380, JUDGE_Y);
      ctx.stroke();
      ctx.restore();

      // Perfect-hit bright flash strip across judgment area
      if (now < hitFlashUntil) {
        const a = (hitFlashUntil - now) / 90;
        ctx.save();
        ctx.fillStyle = `rgba(255,240,200,${(a * 0.55).toFixed(3)})`;
        ctx.fillRect(0, JUDGE_Y - 40, 400, 80);
        ctx.restore();
      }

      // --- Particles ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      // --- Notes ---
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.speed * dt;

        if (!n.judged) {
          const distToJudge = Math.abs(n.y + NOTE_SIZE / 2 - JUDGE_Y);
          const inZone = distToJudge < 80;
          ctx.save();
          if (inZone) {
            ctx.shadowColor = n.type.skull ? '#E74C3C' : '#D4A017';
            ctx.shadowBlur = 15;
          }
          ctx.beginPath();
          ctx.arc(n.x, n.y + NOTE_SIZE / 2, NOTE_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = n.type.color;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          if (inZone && !n.type.skull) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#D4A017';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          ctx.font = '36px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.type.emoji, n.x, n.y + NOTE_SIZE / 2);
          ctx.restore();
        } else if (n.popUntil && now < n.popUntil) {
          // Perfect-hit scale pop: expanding gold ring at note's hit position
          const k = 1 - (n.popUntil - now) / 120;
          const r = (NOTE_SIZE / 2) + k * 50;
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = '#FFE68A';
          ctx.lineWidth = 4 * (1 - k) + 1;
          ctx.shadowColor = '#D4A017';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(n.x, JUDGE_Y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (n.y > JUDGE_Y + 40 && !n.judged) {
          n.judged = true;
          if (!n.type.skull) {
            showJudgment(t('miss'), '#888');
            handleMiss();
            currentBPM = 140; setBGMCurrentBPM(140);
            updateHUD();
          }
        }

        if (n.y > 750) notes.splice(i, 1);
      }

      if (remaining <= 0) {
        gameRunning = false;
        safeStopVignette();
        stopRhythmBGM(false);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(0, 0, 400, 700);
        ctx.fillStyle = '#E74C3C';
        ctx.font = '900 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 15;
        ctx.fillText(t('finished'), 200, 350);
        ctx.shadowBlur = 0;

        flashScreen('#fff');
        playSound(523, 0.15, 'square', 0.3);
        setTimeout(() => playSound(659, 0.15, 'square', 0.3), 150);
        setTimeout(() => playSound(784, 0.3, 'square', 0.4), 300);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        try { _titles && _titles.checkTitles && _titles.checkTitles({ event: 'rhythm-end', score: state.score, maxCombo: state.maxCombo, outcome: 'finished' }); } catch(e) {}
        addTimeout(() => { sceneExit(); }, 2000);
        return;
      }

      setRAF(requestAnimationFrame(gameLoop));
    }

    lastSpawn = performance.now();
    lastSkullSpawn = performance.now();
    startRhythmBGM();
    setRAF(requestAnimationFrame(gameLoop));
    updateHUD();
  }
}
