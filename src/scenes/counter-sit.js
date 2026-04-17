// ===== SCENE 5: COUNTER SIT =====
import { t, currentLang } from '../i18n.js';
import { addTimeout, addInterval } from '../state.js';
import { showScene } from '../scene-manager.js';
import { startSceneSE } from '../audio/ambient.js';
import { ASSETS } from '../assets.js';
import { sceneGarlicCall } from './call.js';
import { getCurrentShop } from '../meta/shops.js';

export function sceneCounterSit() {
  const scene = showScene('scene-counter_sit');
  scene.innerHTML = '';
  startSceneSE('kitchen');

  const img = document.createElement('img');
  img.className = 'bg-img';
  img.src = ASSETS.counter_seat;
  scene.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.innerHTML = `
    <div class="glass" style="padding:20px;text-align:center;">
      <p id="sit-msg" style="color:#fff;font-size:16px;font-weight:700;"></p>
    </div>
  `;
  scene.appendChild(content);

  const messages = t('sitMsgs');
  let msgIdx = 0;
  const msgEl = content.querySelector('#sit-msg');
  const shop = getCurrentShop();
  msgEl.textContent = (currentLang === 'en' ? shop.tutorialMsgEn : shop.tutorialMsgJa) || t('finallySat');
  msgEl.style.opacity = '1';

  function showMsg() {
    msgEl.style.opacity = '0';
    addTimeout(() => {
      msgEl.textContent = messages[msgIdx % messages.length];
      msgEl.style.opacity = '1';
      msgEl.style.transition = 'opacity 0.3s';
      msgIdx++;
    }, 300);
  }
  addTimeout(() => {
    showMsg();
    addInterval(() => { showMsg(); }, 3500);
  }, 2500);

  const waitTime = Math.random() * 7000 + 8000;
  addTimeout(() => { sceneGarlicCall(); }, waitTime);
}
