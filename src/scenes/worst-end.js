// ===== WORST END (出禁エンド) =====
import { t } from '../i18n.js';
import { state, addTimeout, clearAllTimers } from '../state.js';
import { showScene, shakeScreen } from '../scene-manager.js';
import { playSound, getAudioCtx } from '../audio/core.js';
import { ASSETS } from '../assets.js';
import { shareOnX } from '../ui/share.js';
import { sceneTitle } from './title.js';

export function sceneWorstEnd(reason) {
  clearAllTimers();
  const scene = showScene('scene-worst-end');
  scene.innerHTML = '';

  const bg = document.createElement('img');
  bg.className = 'bg-img';
  bg.src = ASSETS.ramen_leftover;
  bg.style.filter = reason === 'stomach' ? 'brightness(0.4) grayscale(0.4)' : 'brightness(0.3) grayscale(0.6)';
  scene.appendChild(bg);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.style.gap = '0';

  const goText = document.createElement('p');
  goText.style.cssText = 'color:#E74C3C;font-size:48px;font-weight:900;letter-spacing:4px;animation:dramaticGrow 0.8s ease;';
  goText.textContent = 'GAME OVER';
  content.appendChild(goText);
  scene.appendChild(content);

  if (getAudioCtx()) playSound(110, 0.5, 'sawtooth', 0.3);

  addTimeout(() => shakeScreen(), 500);

  addTimeout(() => {
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#fff;font-size:15px;font-weight:700;line-height:2;text-align:center;margin-top:16px;animation:fadeIn 0.8s ease;';
    desc.innerHTML = t('worstDesc');
    content.appendChild(desc);

    const reasonText = document.createElement('p');
    reasonText.style.cssText = 'color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;margin-top:8px;animation:fadeIn 0.8s ease;';
    reasonText.textContent = reason === 'ticket' ? t('crimeTicket') : t('crimeLeftover');
    content.appendChild(reasonText);
  }, 1000);

  addTimeout(() => {
    const staffImg = document.createElement('img');
    staffImg.src = ASSETS.staff_face;
    staffImg.style.cssText = 'width:160px;height:160px;border-radius:50%;object-fit:cover;border:4px solid #E74C3C;margin:16px auto;display:block;animation:fadeIn 0.8s ease;';
    content.appendChild(staffImg);

    const scoreText = document.createElement('p');
    scoreText.style.cssText = 'color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;margin-top:8px;animation:fadeIn 0.5s ease;';
    scoreText.textContent = state.score + t('sharePts') + ' | ' + t('shareCall') + ': ' + (state.callText || t('shareNone'));
    content.appendChild(scoreText);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:20px;justify-content:center;animation:fadeIn 0.5s ease;';
    btnRow.innerHTML = '<button class="btn-gold" id="btn-retry-w">' + t('oneMore') + '</button><button class="btn-secondary" id="btn-share-w">' + t('shareX') + '</button>';
    content.appendChild(btnRow);

    content.querySelector('#btn-retry-w').addEventListener('pointerdown', (e) => { e.preventDefault(); sceneTitle(); });
    content.querySelector('#btn-share-w').addEventListener('pointerdown', (e) => { e.preventDefault(); shareOnX(t('shareBanned')); });
  }, 1500);
}
