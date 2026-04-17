// ===== SCENE 4: QUEUE WAIT =====
import { t } from '../i18n.js';
import { state, addTimeout, addInterval } from '../state.js';
import { showScene, shakeScreen } from '../scene-manager.js';
import { startAmbientBGM, stopAmbientBGM } from '../audio/ambient.js';
import { ASSETS } from '../assets.js';
import { sceneCounterSit } from './counter-sit.js';
import { sceneWorstEnd } from './worst-end.js';

export function sceneQueueWait() {
  const scene = showScene('scene-queue_wait');
  scene.innerHTML = '';
  startAmbientBGM();

  const img = document.createElement('img');
  img.className = 'bg-img';
  img.src = ASSETS.storefront;
  scene.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  scene.appendChild(overlay);

  const timer = document.createElement('div');
  timer.className = 'elapsed-timer';
  timer.textContent = '0:00';
  scene.appendChild(timer);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.innerHTML = `
    <div class="glass" style="padding:20px;text-align:center;min-height:60px;">
      <p id="wait-msg" style="color:#fff;font-size:16px;font-weight:700;"></p>
    </div>
  `;
  scene.appendChild(content);

  const startTime = Date.now();
  const timerInt = addInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }, 1000);

  const messages = t('waitMsgs');
  let msgIdx = 0;
  const msgEl = content.querySelector('#wait-msg');

  function showRandomMsg() {
    msgEl.style.opacity = '0';
    addTimeout(() => {
      msgEl.textContent = messages[msgIdx % messages.length];
      msgEl.style.opacity = '1';
      msgEl.style.transition = 'opacity 0.3s';
      msgIdx++;
    }, 300);
    addTimeout(showRandomMsg, (Math.random() * 2000 + 3000));
  }
  addTimeout(showRandomMsg, 1000);

  const staffDelay = Math.random() * 4000 + 3000;
  addTimeout(() => {
    clearInterval(timerInt);
    stopAmbientBGM();
    content.innerHTML = `
      <img src="${ASSETS.staff_face}" style="width:150px;height:150px;border-radius:50%;object-fit:cover;border:3px solid #D4A017;margin-bottom:16px;animation:dramaticGrow 0.5s ease;">
      <p style="color:#fff;font-size:22px;font-weight:900;animation:dramaticGrow 0.6s ease;">${t('showTicket')}</p>
      <div id="countdown" style="color:#D4A017;font-size:48px;font-weight:900;margin-top:16px;">3</div>
      <div id="ticket-tap" style="margin-top:16px;padding:16px 30px;border-radius:16px;font-size:18px;font-weight:900;cursor:pointer;opacity:0;transition:opacity 0.3s;background:${state.ticketColor};color:#000;">${state.ticketName}</div>
    `;
    shakeScreen();

    let countVal = 3;
    const cdEl = content.querySelector('#countdown');
    const ticketBtn = content.querySelector('#ticket-tap');
    let ticketShown = false;
    let success = false;

    addTimeout(() => { ticketBtn.style.opacity = '1'; ticketShown = true; }, 500);

    const cdInt = addInterval(() => {
      countVal--;
      if (countVal > 0) {
        cdEl.textContent = countVal;
      } else {
        clearInterval(cdInt);
        if (!success) {
          content.innerHTML = `
            <img src="${ASSETS.staff_face}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #E74C3C;margin-bottom:16px;">
            <p style="color:#E74C3C;font-size:22px;font-weight:900;">${t('tooSlow')}</p>
          `;
          shakeScreen();
          addTimeout(() => { sceneWorstEnd('ticket'); }, 2500);
        }
      }
    }, 1000);

    ticketBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!ticketShown || success) return;
      success = true;
      clearInterval(cdInt);
      ticketBtn.style.transform = 'scale(1.1)';
      ticketBtn.style.boxShadow = '0 0 20px rgba(212,160,23,0.6)';
      cdEl.textContent = '✓';
      cdEl.style.color = '#4CAF50';

      const moreWait = Math.random() * 2000 + 3000;
      content.querySelector('p').textContent = t('pleaseWait');
      addTimeout(() => { sceneCounterSit(); }, moreWait);
    });
  }, staffDelay);
}
