// ===== SCENE 2: QUEUE ARRIVAL =====
import { t } from '../i18n.js';
import { addInterval } from '../state.js';
import { showScene } from '../scene-manager.js';
import { ASSETS } from '../assets.js';
import { sceneTicketMachine } from './ticket.js';

export function sceneQueueArrival() {
  const scene = showScene('scene-queue_arrival');
  scene.innerHTML = '';

  const img = document.createElement('img');
  img.className = 'bg-img';
  img.src = ASSETS.storefront;
  scene.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';

  const count = Math.floor(Math.random() * 8) + 8;
  const text = t('queueText')(count);
  content.innerHTML = `
    <div class="glass" style="padding:30px 24px;text-align:center;">
      <p id="tw-text" style="color:#fff;font-size:20px;font-weight:700;min-height:1.5em;"></p>
    </div>
    <button class="btn-gold" id="btn-queue" style="margin-top:30px;opacity:0;transition:opacity 0.5s;">${t('joinBtn')}</button>
  `;
  scene.appendChild(content);

  let i = 0;
  const el = content.querySelector('#tw-text');
  const tw = addInterval(() => {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
    } else {
      clearInterval(tw);
      content.querySelector('#btn-queue').style.opacity = '1';
    }
  }, 80);

  content.querySelector('#btn-queue').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sceneTicketMachine();
  });
}
