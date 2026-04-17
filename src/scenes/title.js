// ===== SCENE 1: TITLE =====
import { t, createLangToggle, currentLang } from '../i18n.js';
import { state, clearAllTimers, addTimeout, resetState } from '../state.js';
import { showScene } from '../scene-manager.js';
import { sceneQueueArrival } from './queue-arrival.js';
import { sceneRanking } from './ranking.js';
import { TITLES, getEarnedTitles, getTitleDisplay } from '../meta/titles.js';
import { getDailyChallenge, getDailyDisplay, isDailyCleared } from '../meta/daily.js';

let titleVideo = null;
function ensureTitleVideo() {
  if (!titleVideo) {
    titleVideo = document.createElement('video');
    titleVideo.className = 'bg-video';
    titleVideo.muted = true;
    titleVideo.loop = true;
    titleVideo.autoplay = true;
    titleVideo.playsInline = true;
    titleVideo.setAttribute('playsinline', '');
    titleVideo.setAttribute('webkit-playsinline', '');
    titleVideo.setAttribute('autoplay', '');
    titleVideo.setAttribute('muted', '');
    titleVideo.src = 'title_bg_small.mp4';
  }
  return titleVideo;
}
export { ensureTitleVideo };

export function sceneTitle() {
  clearAllTimers();
  resetState();
  const scene = showScene('scene-title');
  scene.innerHTML = '';

  const video = ensureTitleVideo();
  scene.appendChild(video);
  video.currentTime = 0;
  const p = video.play();
  if (p) p.catch(() => {});
  document.addEventListener('pointerdown', () => { video.play().catch(() => {}); }, { once: true });

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  scene.appendChild(overlay);

  const earnedCount = getEarnedTitles().length;
  const totalTitles = Object.keys(TITLES).length;
  const daily = getDailyDisplay(currentLang);
  const dailyBtnLabel = daily.cleared
    ? `⚡ ${daily.name} ✓`
    : (state.dailyChallenge
        ? `⚡ ${daily.name} ${currentLang === 'en' ? '(ON)' : '(挑戦中)'}`
        : `⚡ ${daily.name} ${currentLang === 'en' ? '(tap to toggle)' : '(挑戦)'}`);
  const dailyBtnColor = state.dailyChallenge ? '#E74C3C' : '#D4A017';

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.style.gap = '20px';
  content.innerHTML = `
    <h1 style="font-size:56px;font-weight:900;color:#fff;letter-spacing:4px;text-shadow:0 0 20px rgba(212,160,23,0.6),0 0 40px rgba(212,160,23,0.3);">JIRO Sim</h1>
    <div style="font-size:10px;color:rgba(255,255,255,0.35);font-weight:700;letter-spacing:2px;margin-top:-4px;">Ver 3.0</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:40px;align-items:center;">
      <button class="btn-gold" id="btn-start">${t('joinQueue')}</button>
      <button class="btn-secondary" id="btn-leave">${t('goHome')}</button>
      <button class="btn-secondary" id="btn-ranking" style="margin-top:20px;border-color:#D4A017;color:#D4A017;background:rgba(212,160,23,0.1);">🌍 ${t('ranking')}</button>
      <button class="btn-secondary" id="btn-daily" style="border-color:${dailyBtnColor};color:${dailyBtnColor};background:rgba(212,160,23,0.08);font-size:12px;padding:8px 18px;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${dailyBtnLabel}</button>
      <button class="btn-secondary" id="btn-titles" style="font-size:12px;padding:6px 16px;">🎖️ ${currentLang === 'en' ? 'Titles' : '称号'} ${earnedCount}/${totalTitles}</button>
    </div>
    <div id="leave-msg" style="color:#fff;font-size:14px;font-weight:700;opacity:0;transition:opacity 0.3s;margin-top:10px;"></div>
    <div style="position:absolute; bottom:15px; font-size:10px; color:rgba(255,255,255,0.4);"><a href="https://x.com/nogutaku" target="_blank" style="color:inherit;text-decoration:none;">Created by @nogutaku</a></div>
  `;
  scene.appendChild(content);
  scene.appendChild(createLangToggle());

  content.querySelector('#btn-daily').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.dailyChallenge) {
      state.dailyChallenge = null;
    } else {
      state.dailyChallenge = getDailyChallenge();
    }
    sceneTitle();
  });
  content.querySelector('#btn-titles').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    showTitleListOverlay(scene);
  });

  content.querySelector('#btn-start').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sceneQueueArrival();
  });
  content.querySelector('#btn-ranking').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sceneRanking();
  });

  let leaveClicks = 0;
  const leaveMsgs = t('leaveMsgs');
  content.querySelector('#btn-leave').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const msg = content.querySelector('#leave-msg');
    msg.textContent = leaveMsgs[Math.min(leaveClicks, leaveMsgs.length - 1)];
    msg.style.opacity = '1';
    leaveClicks++;
    addTimeout(() => { msg.style.opacity = '0'; }, 2000);
  });
}

// Re-render on lang change
window.addEventListener('jiro:lang-changed', () => {
  const titleScene = document.getElementById('scene-title');
  if (titleScene && titleScene.classList.contains('active')) sceneTitle();
});

// ---------- Title list overlay ----------
function rarityColor(r) {
  if (r === 'legendary') return '#E74C3C';
  if (r === 'rare') return '#D4A017';
  return '#7EB3D9';
}

function showTitleListOverlay(scene) {
  const earnedSet = new Set(getEarnedTitles());
  const dialog = document.createElement('div');
  dialog.className = 'dialog-overlay';

  const box = document.createElement('div');
  box.className = 'dialog-box';
  box.style.maxWidth = '340px';
  box.style.maxHeight = '80vh';
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.padding = '20px';

  const header = document.createElement('p');
  header.style.cssText = 'color:#D4A017;font-size:18px;font-weight:900;margin-bottom:12px;';
  header.textContent = `🎖️ ${currentLang === 'en' ? 'Titles' : '称号'} (${earnedSet.size}/${Object.keys(TITLES).length})`;
  box.appendChild(header);

  const list = document.createElement('div');
  list.style.cssText = 'overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;padding-right:4px;text-align:left;';

  Object.keys(TITLES).forEach((k) => {
    const info = getTitleDisplay(k);
    const def = TITLES[k];
    const earned = earnedSet.has(k);
    const row = document.createElement('div');
    const col = rarityColor(info.rarity);
    row.style.cssText = `display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:${earned ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.04)'};border:1px solid ${earned ? col : 'rgba(255,255,255,0.1)'};${earned ? '' : 'filter:grayscale(1);opacity:0.55;'}`;

    const emojiEl = document.createElement('div');
    emojiEl.style.cssText = 'font-size:22px;width:32px;text-align:center;';
    emojiEl.textContent = earned ? info.emoji : '❔';
    row.appendChild(emojiEl);

    const meta = document.createElement('div');
    meta.style.cssText = 'flex:1;min-width:0;';
    const nameEl = document.createElement('div');
    nameEl.style.cssText = `font-size:13px;font-weight:900;color:${earned ? col : '#ccc'};`;
    nameEl.textContent = earned ? info.name : (def.rarity === 'legendary' ? '???' : info.name);
    const descEl = document.createElement('div');
    descEl.style.cssText = 'font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);margin-top:2px;line-height:1.3;';
    descEl.textContent = earned ? info.desc : (def.rarity === 'legendary' ? (currentLang === 'en' ? '??? (legendary)' : '??? (伝説)') : info.desc);
    meta.appendChild(nameEl);
    meta.appendChild(descEl);
    row.appendChild(meta);

    list.appendChild(row);
  });
  box.appendChild(list);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-secondary';
  closeBtn.style.marginTop = '14px';
  closeBtn.textContent = currentLang === 'en' ? 'Close' : '閉じる';
  closeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); dialog.remove(); });
  box.appendChild(closeBtn);

  dialog.appendChild(box);
  scene.appendChild(dialog);
}
