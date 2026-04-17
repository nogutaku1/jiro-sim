// ===== SCENE 1: TITLE =====
import { t, createLangToggle } from '../i18n.js';
import { clearAllTimers, addTimeout, resetState } from '../state.js';
import { showScene } from '../scene-manager.js';
import { sceneQueueArrival } from './queue-arrival.js';
import { sceneRanking } from './ranking.js';

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
    </div>
    <div id="leave-msg" style="color:#fff;font-size:14px;font-weight:700;opacity:0;transition:opacity 0.3s;margin-top:10px;"></div>
    <div style="position:absolute; bottom:15px; font-size:10px; color:rgba(255,255,255,0.4);"><a href="https://x.com/nogutaku" target="_blank" style="color:inherit;text-decoration:none;">Created by @nogutaku</a></div>
  `;
  scene.appendChild(content);
  scene.appendChild(createLangToggle());

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
