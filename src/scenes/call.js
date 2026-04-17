// ===== SCENE 6: GARLIC CALL =====
import { t } from '../i18n.js';
import { state, addTimeout, addInterval } from '../state.js';
import { showScene, shakeScreen } from '../scene-manager.js';
import { playSound } from '../audio/core.js';
import { startSceneSE } from '../audio/ambient.js';
import { ASSETS } from '../assets.js';
import { sceneEatingRhythm } from './rhythm.js';

export function sceneGarlicCall() {
  const scene = showScene('scene-garlic_call');
  scene.innerHTML = '';
  scene.style.background = '#111';
  startSceneSE('kitchen_loud');

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'flex-start';
  content.style.paddingTop = '0';
  content.innerHTML = `
    <img src="${ASSETS.staff_face}" style="width:100%;height:40%;object-fit:cover;object-position:center top;">
    <div style="width:100%;padding:12px 20px;flex:1;display:flex;flex-direction:column;align-items:center;overflow-y:auto;">
      <p id="garlic-q" style="color:#fff;font-size:26px;font-weight:900;margin:8px 0;text-align:center;animation:dramaticGrow 0.6s ease;">${t('garlicQ')}</p>
      <div id="countdown-garlic" style="color:#D4A017;font-size:28px;font-weight:900;margin-bottom:6px;">8</div>
      <div id="topping-area" style="width:100%;"></div>
      <button class="btn-gold" id="btn-call" style="margin-top:10px;font-size:16px;padding:10px 32px;">${t('callBtn')}</button>
    </div>
  `;
  scene.appendChild(content);
  shakeScreen();

  const toppingArea = content.querySelector('#topping-area');
  const toppings = [
    { key: 'ninniku', label: t('garlic'), options: [t('none'), t('slight'), t('more'), t('extraMore')] },
    { key: 'yasai', label: t('veggie'), options: [t('none'), t('more'), t('extraMore')] },
    { key: 'abura', label: t('fat'), options: [t('none'), t('more'), t('extraMore')] },
    { key: 'karame', label: t('salty'), options: [t('none'), t('more'), t('extraMore')] }
  ];

  toppings.forEach(tp => {
    const row = document.createElement('div');
    row.className = 'topping-row';
    row.innerHTML = `<span class="topping-label">${tp.label}</span><div class="pill-group" data-key="${tp.key}"></div>`;
    const group = row.querySelector('.pill-group');
    tp.options.forEach((opt, idx) => {
      const pill = document.createElement('span');
      pill.className = 'pill' + (idx === 0 ? ' selected' : '');
      pill.textContent = opt;
      pill.dataset.value = idx;
      pill.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        state.toppings[tp.key] = idx;
      });
      group.appendChild(pill);
    });
    toppingArea.appendChild(row);
  });

  let countVal = 8;
  const cdEl = content.querySelector('#countdown-garlic');
  const cdInt = addInterval(() => {
    countVal--;
    if (countVal > 0) cdEl.textContent = countVal;
    else { clearInterval(cdInt); doCall(); }
  }, 1000);

  function doCall() {
    clearInterval(cdInt);
    const labels = [t('garlic'), t('veggie'), t('fat'), t('salty')];
    const keys = ['ninniku', 'yasai', 'abura', 'karame'];
    const optLabels = {
      ninniku: [t('none'), t('slight'), t('more'), t('extraMore')],
      yasai: [t('none'), t('more'), t('extraMore')],
      abura: [t('none'), t('more'), t('extraMore')],
      karame: [t('none'), t('more'), t('extraMore')]
    };
    let parts = [];
    keys.forEach((k, i) => {
      const val = state.toppings[k];
      if (val > 0) parts.push(labels[i] + optLabels[k][val]);
    });
    state.callText = parts.length > 0 ? parts.join(' ') : t('asIs');

    const area = content.querySelector('div[style*="padding"]');
    area.innerHTML = `
      <p style="color:#D4A017;font-size:28px;font-weight:900;margin:20px 0;text-align:center;animation:dramaticGrow 0.5s ease;">${state.callText}</p>
      <p style="color:#fff;font-size:36px;font-weight:900;margin-top:12px;animation:dramaticGrow 0.7s ease;">${t('gotIt')}</p>
    `;
    playSound(523, 0.15, 'sine', 0.3);
    addTimeout(() => playSound(784, 0.12, 'sine', 0.3), 100);
    shakeScreen();

    addTimeout(() => {
      const arrivalScene = showScene('scene-ramen-arrival');
      arrivalScene.innerHTML = '';
      const arrImg = document.createElement('img');
      arrImg.className = 'bg-img';
      arrImg.src = ASSETS.ramen_arrival;
      arrivalScene.appendChild(arrImg);
      const arrOv = document.createElement('div');
      arrOv.className = 'overlay';
      arrOv.style.background = 'rgba(0,0,0,0.3)';
      arrivalScene.appendChild(arrOv);
      const arrContent = document.createElement('div');
      arrContent.className = 'content';
      arrContent.style.justifyContent = 'center';
      arrContent.innerHTML = '<p style="color:#fff;font-size:22px;font-weight:900;text-shadow:0 0 20px rgba(212,160,23,0.6);animation:fadeIn 0.8s ease;">' + t('theTimeHasCome') + '</p>';
      arrivalScene.appendChild(arrContent);
      addTimeout(() => { sceneEatingRhythm(); }, 3000);
    }, 2000);
  }

  content.querySelector('#btn-call').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    doCall();
  });
}
