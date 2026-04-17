// ===== SCENE 3: TICKET MACHINE =====
import { t } from '../i18n.js';
import { state, addTimeout } from '../state.js';
import { showScene } from '../scene-manager.js';
import { startSceneSE } from '../audio/ambient.js';
import { ASSETS } from '../assets.js';
import { sceneQueueWait } from './queue-wait.js';

export function sceneTicketMachine() {
  const scene = showScene('scene-ticket_machine');
  scene.innerHTML = '';
  startSceneSE('ticket');

  const img = document.createElement('img');
  img.className = 'bg-img';
  img.src = ASSETS.ticket_machine;
  scene.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.55)';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.style.gap = '0';
  content.innerHTML = `
    <p style="color:#fff;font-size:16px;font-weight:700;margin-bottom:16px;">${t('chooseTicket')}</p>
    <div class="ticket-card light" data-ticket="small" data-diff="easy">
      <span class="name">${t('smallRamen')}</span><span class="price">¥700</span>
    </div>
    <div class="ticket-card gold" data-ticket="large" data-diff="normal">
      <span class="name">${t('largeRamen')}</span><span class="price">¥750</span>
    </div>
    <div class="ticket-card red" data-ticket="double" data-diff="hard">
      <div><span class="name">${t('doublePork')}</span></div>
      <span class="price">¥1,000</span>
    </div>
  `;
  scene.appendChild(content);

  const tickets = content.querySelectorAll('.ticket-card');
  tickets.forEach(card => {
    card.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const diff = card.dataset.diff;
      const ticket = card.dataset.ticket;
      state.difficulty = diff;
      state.ticket = ticket;
      state.ticketName = card.querySelector('.name').textContent;
      state.ticketColor = diff === 'easy' ? '#fff' : diff === 'normal' ? '#D4A017' : '#E74C3C';

      tickets.forEach(c => { if (c !== card) c.style.opacity = '0.2'; });
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 0 30px rgba(212,160,23,0.5)';

      addTimeout(() => {
        const transScene = showScene('scene-ticket_transition');
        transScene.innerHTML = '';
        transScene.style.background = '#111';
        const tc = document.createElement('div');
        tc.className = 'content';
        tc.style.justifyContent = 'center';
        tc.innerHTML = `
          <p style="color:#D4A017;font-size:20px;font-weight:900;margin-bottom:16px;animation:dramaticGrow 0.5s ease;">食券を買う番が来た</p>
          <div style="background:${state.ticketColor};color:#000;padding:12px 24px;border-radius:12px;font-size:18px;font-weight:900;margin-bottom:30px;">${state.ticketName}</div>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;font-weight:700;animation:dramaticGrow 0.8s ease;">席が空くまで並び直す…</p>
        `;
        transScene.appendChild(tc);
        addTimeout(() => { sceneQueueWait(); }, 2500);
      }, 1200);
    });
  });
}
