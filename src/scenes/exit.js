// ===== SCENE 8: EXIT =====
import { t } from '../i18n.js';
import { state, addTimeout, addInterval, clearAllTimers } from '../state.js';
import { showScene } from '../scene-manager.js';
import { startSceneSE } from '../audio/ambient.js';
import { ASSETS } from '../assets.js';
import { getRankTitle, saveRanking } from '../ranking/score.js';
import { generateResultImage, saveResultImage } from '../ui/result-card.js';
import { shareOnX } from '../ui/share.js';
import { sceneTitle } from './title.js';

export function sceneExit() {
  const scene = showScene('scene-exit');
  scene.innerHTML = '';
  startSceneSE('calm');

  const rankTitle = getRankTitle();

  function flashScreenLocal(color) {
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:${color};opacity:0.5;z-index:8;pointer-events:none;transition:opacity 0.4s;`;
    scene.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '0'; });
    setTimeout(() => { flash.remove(); }, 400);
  }

  function showPhase0() {
    scene.innerHTML = '';

    const bg = document.createElement('img');
    bg.className = 'bg-img';
    bg.src = ASSETS.ramen_empty;
    scene.appendChild(bg);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.background = 'rgba(0,0,0,0.45)';
    scene.appendChild(overlay);

    const content = document.createElement('div');
    content.className = 'content';
    content.style.justifyContent = 'center';
    content.innerHTML = `
      <p style="color:#D4A017;font-size:18px;font-weight:700;">${rankTitle}</p>
      <p style="color:#fff;font-size:72px;font-weight:900;margin:8px 0;text-shadow:0 0 20px rgba(212,160,23,0.4);">${state.score}</p>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:700;">${t('maxCombo')}: ${state.maxCombo}</p>
      <button class="btn-gold" id="btn-exit0" style="margin-top:40px;font-size:18px;">${t('leaveStore')}</button>
    `;
    scene.appendChild(content);

    const bowlHint = document.createElement('div');
    bowlHint.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);width:80px;height:80px;border-radius:50%;border:2px solid rgba(212,160,23,0.5);z-index:5;animation:blinkHint 1.5s ease-in-out infinite;cursor:pointer;';
    scene.appendChild(bowlHint);

    const bowlZone = document.createElement('div');
    bowlZone.style.cssText = 'position:absolute;bottom:50px;left:50%;transform:translateX(-50%);width:100px;height:100px;z-index:6;cursor:pointer;opacity:0.01;';
    scene.appendChild(bowlZone);

    bowlZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state.bowlCleared) return;
      state.bowlCleared = true;
      flashScreenLocal('rgba(212,160,23,0.3)');
      bowlHint.style.animation = 'none';
      bowlHint.style.opacity = '1';
      bowlHint.style.background = 'rgba(212,160,23,0.3)';
      bowlHint.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#D4A017;font-size:28px;font-weight:900;">✓</span>';
      addTimeout(() => { showPhase1(); }, 800);
    });

    content.querySelector('#btn-exit0').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      showConfirmDialog();
    });
  }

  function showPhase1() {
    scene.innerHTML = '';

    const bg1 = document.createElement('img');
    bg1.className = 'bg-img';
    bg1.src = ASSETS.cloth1;
    bg1.style.transition = 'opacity 1s';
    scene.appendChild(bg1);

    const bg2 = document.createElement('img');
    bg2.className = 'bg-img';
    bg2.src = ASSETS.cloth2;
    bg2.style.opacity = '0';
    bg2.style.transition = 'opacity 1s';
    scene.appendChild(bg2);

    let showFirst = true;
    addInterval(() => {
      showFirst = !showFirst;
      bg1.style.opacity = showFirst ? '1' : '0';
      bg2.style.opacity = showFirst ? '0' : '1';
    }, 1500);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    scene.appendChild(overlay);

    const content = document.createElement('div');
    content.className = 'content';
    content.style.justifyContent = 'center';
    content.innerHTML = `
      <p style="color:#D4A017;font-size:18px;font-weight:700;">${rankTitle}</p>
      <p style="color:#fff;font-size:72px;font-weight:900;margin:8px 0;text-shadow:0 0 20px rgba(212,160,23,0.4);">${state.score}</p>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:700;">${t('maxCombo')}: ${state.maxCombo}</p>
      <button class="btn-gold" id="btn-exit" style="margin-top:40px;font-size:18px;">${t('leaveStore')}</button>
    `;
    scene.appendChild(content);

    const hint = document.createElement('div');
    hint.id = 'cloth-hint';
    hint.style.cssText = 'position:absolute;bottom:30px;right:30px;width:60px;height:60px;border-radius:50%;border:2px solid rgba(0,200,100,0.5);z-index:5;animation:blinkHint 1.5s ease-in-out infinite;cursor:pointer;';
    scene.appendChild(hint);

    const clothZone = document.createElement('div');
    clothZone.style.cssText = 'position:absolute;bottom:20px;right:20px;width:80px;height:80px;z-index:6;cursor:pointer;opacity:0.01;';
    scene.appendChild(clothZone);

    clothZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state.clothTapped) return;
      state.clothTapped = true;
      flashScreenLocal('rgba(0,200,100,0.4)');
      hint.style.animation = 'none';
      hint.style.opacity = '1';
      hint.style.background = 'rgba(0,200,100,0.3)';
      hint.style.display = 'flex';
      hint.style.alignItems = 'center';
      hint.style.justifyContent = 'center';
      hint.innerHTML = '<span style="color:#4CAF50;font-size:28px;font-weight:900;">✓</span>';
    });

    content.querySelector('#btn-exit').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      showConfirmDialog();
    });
  }

  function showConfirmDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog-box">
        <p>${t('confirmLeave')}</p>
        <div class="btn-row">
          <button class="btn-secondary" id="btn-yes" style="padding:10px 28px;">${t('yes')}</button>
          <button class="btn-secondary" id="btn-no" style="padding:10px 28px;">${t('no')}</button>
        </div>
      </div>
    `;
    scene.appendChild(dialog);

    dialog.querySelector('#btn-yes').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dialog.remove();
      if (state.clothTapped) showGoodEnd();
      else showBadEnd();
    });

    dialog.querySelector('#btn-no').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dialog.remove();
    });
  }

  function showBadEnd() {
    clearAllTimers();
    scene.innerHTML = '';
    scene.style.background = '#0a0a0a';

    const content = document.createElement('div');
    content.className = 'content';
    content.style.justifyContent = 'center';
    content.innerHTML = `
      <p style="color:#E74C3C;font-size:48px;font-weight:900;letter-spacing:4px;">GAME OVER</p>
      <img src="${ASSETS.staff_face}" style="width:200px;height:200px;border-radius:50%;object-fit:cover;border:4px solid #E74C3C;margin:20px 0;">
      <p style="color:#fff;font-size:20px;font-weight:700;">${t('banned')}</p>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:700;margin-top:8px;max-width:300px;text-align:center;">${t('wipePlease')}</p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:30px;">
        <button class="btn-gold" id="btn-retry">${t('oneMore')}</button>
        <button class="btn-secondary" id="btn-share">${t('shareX')}</button>
        <button class="btn-secondary" id="btn-save-img">📸 画像を保存</button>
      </div>
    `;
    scene.appendChild(content);

    content.querySelector('#btn-retry').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sceneTitle();
    });
    content.querySelector('#btn-share').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      shareOnX(t('shareForgot'));
    });
    content.querySelector('#btn-save-img').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const canvas = generateResultImage(state.score, rankTitle, state.callText, state.maxCombo, state.ticketName, false);
      saveResultImage(canvas);
    });
  }

  function showGoodEnd() {
    clearAllTimers();
    scene.innerHTML = '';

    const tStr = state.callText ? state.callText.replace(/ /g, '') : t('asIs');

    const bg = document.createElement('img');
    bg.className = 'bg-img';
    bg.src = ASSETS.ramen_arrival;
    bg.style.filter = 'brightness(0.7) sepia(0.3)';
    scene.appendChild(bg);

    const goldenOverlay = document.createElement('div');
    goldenOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(212,160,23,0.2),rgba(212,160,23,0.1));z-index:1;';
    scene.appendChild(goldenOverlay);

    for (let i = 0; i < 40; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      const colors = ['#D4A017', '#E74C3C', '#4CAF50', '#4FC3F7', '#FF6B35', '#fff'];
      conf.style.background = colors[Math.floor(Math.random() * colors.length)];
      conf.style.left = Math.random() * 400 + 'px';
      conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
      conf.style.animationDelay = (Math.random() * 3) + 's';
      conf.style.width = (Math.random() * 6 + 5) + 'px';
      conf.style.height = (Math.random() * 6 + 5) + 'px';
      conf.style.zIndex = '5';
      scene.appendChild(conf);
    }

    const content = document.createElement('div');
    content.className = 'content';
    content.style.justifyContent = 'center';
    content.style.zIndex = '6';
    content.innerHTML = `
      <p style="color:#D4A017;font-size:32px;font-weight:900;text-shadow:0 0 20px rgba(212,160,23,0.5);">${rankTitle}</p>
      <p style="color:#fff;font-size:56px;font-weight:900;margin:4px 0;">${state.score}</p>
      <p style="color:#fff;font-size:18px;font-weight:700;margin-bottom:16px;">${t('perfectMove')}</p>
      <div style="position:relative;display:inline-block;margin:8px 0;">
        <img src="${ASSETS.staff_face}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #D4A017;">
        <div style="position:absolute;top:-20px;right:-80px;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 14px;color:#fff;font-size:16px;font-weight:900;white-space:nowrap;">${t('seeYa')}</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:24px;">
        <button class="btn-gold" id="btn-retry">${t('oneMore')}</button>
        <button class="btn-secondary" id="btn-share">${t('shareX')}</button>
        <button class="btn-secondary" id="btn-save-img">📸 画像を保存</button>
      </div>
      <div id="submit-box" style="margin-top:20px;display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,0.5);padding:15px;border-radius:12px;border:1px solid #D4A017;">
        <p style="color:#D4A017;font-size:12px;font-weight:700;margin-bottom:8px;">ランキングに登録</p>
        <input type="text" id="player-name" maxlength="6" style="text-transform:uppercase;font-size:20px;font-weight:900;text-align:center;padding:10px;border-radius:8px;border:2px solid #D4A017;background:#222;color:#fff;width:150px;font-family:'Noto Sans JP',sans-serif;margin-bottom:12px;" placeholder="NAME">
        <button class="btn-gold" id="btn-submit-score" style="padding:10px 24px;font-size:14px;width:100%;">登録する</button>
        <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:700;margin-top:6px;">※アルファベット6文字</p>
      </div>
    `;
    scene.appendChild(content);

    const nameInput = content.querySelector('#player-name');
    nameInput.addEventListener('input', () => { nameInput.value = nameInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });

    content.querySelector('#btn-submit-score').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const n = nameInput.value.trim() || 'ANONYM';
      saveRanking(state.score, rankTitle, state.ticketName + ' ' + tStr, n);
      content.querySelector('#submit-box').innerHTML = '<p style="color:#4CAF50;font-weight:900;">登録完了！</p>';
    });

    content.querySelector('#btn-retry').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sceneTitle();
    });
    content.querySelector('#btn-share').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      shareOnX(t('sharePerfect'));
    });
    content.querySelector('#btn-save-img').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const canvas = generateResultImage(state.score, rankTitle, state.callText, state.maxCombo, state.ticketName, true);
      saveResultImage(canvas);
    });
  }

  showPhase0();
}
