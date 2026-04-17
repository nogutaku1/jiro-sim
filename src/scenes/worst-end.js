// ===== WORST END (出禁エンド) — dramatized =====
import { t, currentLang } from '../i18n.js';
import { state, addTimeout, clearAllTimers } from '../state.js';
import { showScene, shakeScreen, flashScreen } from '../scene-manager.js';
import { playSound, getAudioCtx } from '../audio/core.js';
import { ASSETS } from '../assets.js';
import { shareOnX } from '../ui/share.js';
import { sceneTitle } from './title.js';
import { startVignette, stopVignette, showOwnerLine, clearOwnerLines } from '../ui/drama.js';

// Reason-specific owner shouts (localized).
const REASON_LINES = {
  ja: {
    ticket:   '食券すら出せないのか',
    stomach:  '食えないなら頼むな',
    leftover: '残すとかありえない',
  },
  en: {
    ticket:   "Can't even show a ticket?",
    stomach:  "Don't order if you can't finish",
    leftover: "Leftovers? Unacceptable.",
  },
};

// Generic public-shaming lines (localized).
const SHAME_LINES = {
  ja: [
    'お前みたいな客には来てほしくない',
    'もう二度と来るな',
    '顔も見たくない',
  ],
  en: [
    "We don't want customers like you",
    "Don't you ever come back",
    "Get out of my sight",
  ],
};

// Tracks the drone so we can stop it if the user navigates away.
let droneStop = null;

function startDrone() {
  stopDrone();
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';  o.frequency.value = 55;
    o2.type = 'sine';     o2.frequency.value = 55 * 1.01;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2.2);
    o.connect(g); o2.connect(g); g.connect(ctx.destination);
    o.start(); o2.start();
    droneStop = () => {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      } catch(e) {}
      try { o.stop(ctx.currentTime + 0.45); o2.stop(ctx.currentTime + 0.45); } catch(e) {}
      droneStop = null;
    };
  } catch(e) {}
}

function stopDrone() {
  if (droneStop) { try { droneStop(); } catch(e) {} }
}

// Build a fake social-media card for public shaming.
function buildShamePost(reason) {
  const card = document.createElement('div');
  card.style.cssText =
    'width:88%;max-width:340px;margin:14px auto 0;padding:12px 14px;' +
    'background:rgba(18,18,22,0.88);border:1px solid rgba(255,255,255,0.1);' +
    'border-radius:14px;text-align:left;animation:fadeIn 0.8s ease;' +
    'box-shadow:0 0 22px rgba(231,76,60,0.35);';
  const name = (state && state.playerName) ? String(state.playerName) : (currentLang === 'ja' ? 'お前' : 'this guy');
  const bodyJa = {
    ticket:   `今日の客、${name}って奴、食券出すのすらモタモタしやがる。ロット乱すな。`,
    stomach:  `${name}とかいう客、途中で食えなくなってやんの。頼むなら食い切れ。`,
    leftover: `${name}とか言う客、平気で残して帰りやがった。信じられん。`,
  };
  const bodyEn = {
    ticket:   `Had a customer "${name}" today — couldn't even get the ticket out. Holding up the whole line.`,
    stomach:  `Guy named "${name}" gave up halfway through. Don't order if you can't finish.`,
    leftover: `Customer "${name}" left food behind and walked out. Unbelievable.`,
  };
  const body = (currentLang === 'en' ? bodyEn : bodyJa)[reason] || (currentLang === 'en' ? bodyEn.ticket : bodyJa.ticket);

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="width:32px;height:32px;border-radius:50%;background:#D4A017;display:flex;align-items:center;justify-content:center;font-weight:900;color:#111;font-size:14px;">J</div>
      <div style="line-height:1.15;">
        <div style="color:#fff;font-weight:900;font-size:13px;">JIRO Master</div>
        <div style="color:rgba(255,255,255,0.55);font-size:11px;">@jiro_master</div>
      </div>
    </div>
    <div style="color:#fff;font-size:13px;line-height:1.5;font-weight:700;">${body}</div>
    <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:6px;">${currentLang === 'en' ? 'just now' : 'たった今'} · 1.2万 RT</div>
  `;
  return card;
}

export function sceneWorstEnd(reason) {
  clearAllTimers();
  clearOwnerLines();
  const scene = showScene('scene-worst-end');
  scene.innerHTML = '';

  // Background (dimmed ramen shot).
  const bg = document.createElement('img');
  bg.className = 'bg-img';
  bg.src = ASSETS.ramen_leftover;
  bg.style.filter = reason === 'stomach' ? 'brightness(0.35) grayscale(0.5)' : 'brightness(0.28) grayscale(0.65)';
  scene.appendChild(bg);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  scene.appendChild(overlay);

  // Impact frame (red flash) — one frame burst.
  flashScreen('#E74C3C', 160);
  // Start the drone + vignette pulse.
  startDrone();
  startVignette();

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'center';
  content.style.gap = '0';

  // GAME OVER with glitch/RGB split.
  const goText = document.createElement('p');
  goText.className = 'game-over-glitch';
  goText.setAttribute('data-text', 'GAME OVER');
  goText.style.cssText =
    'position:relative;color:#E74C3C;font-size:52px;font-weight:900;letter-spacing:4px;' +
    'animation:dramaticGrow 0.6s ease, gameOverGlitch 2.2s steps(2,end) infinite;' +
    'text-shadow:0 0 18px rgba(231,76,60,0.55);';
  goText.textContent = 'GAME OVER';
  content.appendChild(goText);
  scene.appendChild(content);

  if (getAudioCtx()) playSound(110, 0.5, 'sawtooth', 0.3);
  addTimeout(() => shakeScreen(), 200);
  addTimeout(() => shakeScreen(), 700);

  // First owner line — reason-specific, immediate.
  const reasonLine = (REASON_LINES[currentLang] || REASON_LINES.ja)[reason]
    || (REASON_LINES[currentLang] || REASON_LINES.ja).ticket;
  addTimeout(() => showOwnerLine(reasonLine, { duration: 1600 }), 400);

  // Description + crime.
  addTimeout(() => {
    const desc = document.createElement('p');
    desc.style.cssText = 'color:#fff;font-size:15px;font-weight:700;line-height:2;text-align:center;margin-top:16px;animation:fadeIn 0.8s ease;';
    desc.innerHTML = t('worstDesc');
    content.appendChild(desc);

    const reasonText = document.createElement('p');
    reasonText.style.cssText = 'color:rgba(255,255,255,0.55);font-size:12px;font-weight:700;margin-top:8px;animation:fadeIn 0.8s ease;';
    const crimeKey = reason === 'ticket' ? 'crimeTicket'
                   : reason === 'leftover' ? 'crimeLeftover'
                   : 'crimeLeftover';
    reasonText.textContent = t(crimeKey);
    content.appendChild(reasonText);
  }, 1000);

  // 2nd owner line (generic shame).
  addTimeout(() => {
    const pool = SHAME_LINES[currentLang] || SHAME_LINES.ja;
    showOwnerLine(pool[0], { duration: 1500 });
  }, 2100);

  // Owner face — impact frame "manga" styling with bold red lines, then settles.
  addTimeout(() => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;margin:16px auto;animation:fadeIn 0.6s ease;';

    // Radial "impact" lines behind the face.
    const impact = document.createElement('div');
    impact.style.cssText =
      'position:absolute;inset:-36px;border-radius:50%;' +
      'background:repeating-conic-gradient(from 0deg,#E74C3C 0deg 4deg,transparent 4deg 16deg);' +
      'opacity:0.85;animation:impactSpin 2.4s linear infinite, fadeIn 0.3s ease;' +
      'filter:blur(0.4px);z-index:0;';
    wrap.appendChild(impact);

    const staffImg = document.createElement('img');
    staffImg.src = ASSETS.staff_face;
    staffImg.style.cssText =
      'position:relative;z-index:1;width:160px;height:160px;border-radius:50%;object-fit:cover;' +
      'border:4px solid #E74C3C;display:block;' +
      'box-shadow:0 0 30px rgba(231,76,60,0.6);' +
      'animation:dramaticGrow 0.5s ease;';
    wrap.appendChild(staffImg);

    content.appendChild(wrap);

    // Quick double-shake for impact.
    flashScreen('#E74C3C', 120);
    shakeScreen();
  }, 1500);

  // 3rd owner line.
  addTimeout(() => {
    const pool = SHAME_LINES[currentLang] || SHAME_LINES.ja;
    showOwnerLine(pool[1] || pool[0], { duration: 1500 });
  }, 3500);

  // 4th owner line.
  addTimeout(() => {
    const pool = SHAME_LINES[currentLang] || SHAME_LINES.ja;
    showOwnerLine(pool[2] || pool[0], { duration: 1400 });
  }, 4900);

  // Score + fake social post + buttons.
  addTimeout(() => {
    const scoreText = document.createElement('p');
    scoreText.style.cssText = 'color:rgba(255,255,255,0.65);font-size:13px;font-weight:700;margin-top:10px;animation:fadeIn 0.5s ease;';
    scoreText.textContent = state.score + t('sharePts') + ' | ' + t('shareCall') + ': ' + (state.callText || t('shareNone'));
    content.appendChild(scoreText);

    // "晒された" banner.
    const exposed = document.createElement('p');
    exposed.style.cssText =
      'margin-top:10px;color:#E74C3C;font-size:14px;font-weight:900;letter-spacing:2px;' +
      'text-shadow:0 0 10px rgba(231,76,60,0.6);animation:fadeIn 0.4s ease;';
    exposed.textContent = currentLang === 'en' ? 'EXPOSED ONLINE' : '晒された';
    content.appendChild(exposed);

    // Fake social-media card.
    content.appendChild(buildShamePost(reason));

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:20px;justify-content:center;animation:fadeIn 0.5s ease;';
    btnRow.innerHTML =
      '<button class="btn-gold" id="btn-retry-w">' + t('oneMore') + '</button>' +
      '<button class="btn-secondary" id="btn-share-w">' + t('shareX') + '</button>';
    content.appendChild(btnRow);

    content.querySelector('#btn-retry-w').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      stopDrone();
      stopVignette();
      clearOwnerLines();
      sceneTitle();
    });
    content.querySelector('#btn-share-w').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      shareOnX(t('shareBanned'));
    });
  }, 2200);
}
