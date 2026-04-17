// ===== DRAMA FX: Vignette + Owner Shout Lines =====
// Public, idempotent, safe no-op if DOM missing.
// Used by worst-end and rhythm scenes to escalate pressure.

import { currentLang } from '../i18n.js';

// ---- Owner line pools (localized) ----
const OWNER_LINES = {
  ja: [
    'ロット乱す気か？',
    '急げ！',
    '後ろが詰まってるぞ',
    '早くしろ',
    '客が待ってるんだ',
  ],
  en: [
    'Breaking the lot order?',
    'Hurry up!',
    "You're holding up the line!",
    'Move it!',
    'Customers are waiting!',
  ],
};

// ---- internal state ----
let activeLineEl = null;
let activeLineTimer = null;
let vignetteEl = null;
let vignetteHideTimer = null;

function getGame() {
  return document.getElementById('game') || document.body || null;
}

// ---- Vignette ---------------------------------------------------------
export function startVignette() {
  const host = getGame();
  if (!host) return;
  // Cancel any pending hide
  if (vignetteHideTimer) { clearTimeout(vignetteHideTimer); vignetteHideTimer = null; }
  if (vignetteEl && vignetteEl.isConnected) {
    vignetteEl.style.opacity = '1';
    return; // idempotent
  }
  const el = document.createElement('div');
  el.className = 'drama-vignette';
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.4s ease';
  host.appendChild(el);
  // next frame -> fade in
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  vignetteEl = el;
}

export function stopVignette() {
  if (!vignetteEl) return;
  const el = vignetteEl;
  vignetteEl = null;
  if (vignetteHideTimer) { clearTimeout(vignetteHideTimer); vignetteHideTimer = null; }
  try { el.style.transition = 'opacity 0.5s ease'; el.style.opacity = '0'; } catch(e) {}
  vignetteHideTimer = setTimeout(() => {
    try { el.remove(); } catch(e) {}
    vignetteHideTimer = null;
  }, 520);
}

// ---- Owner lines ------------------------------------------------------
export function clearOwnerLines() {
  if (activeLineTimer) { clearTimeout(activeLineTimer); activeLineTimer = null; }
  if (activeLineEl && activeLineEl.isConnected) {
    try { activeLineEl.remove(); } catch(e) {}
  }
  activeLineEl = null;
}

export function showOwnerLine(text, opts) {
  const host = getGame();
  if (!host || !text) return;
  const duration = (opts && typeof opts.duration === 'number') ? opts.duration : 1800;

  // Replace any existing line (don't stack)
  clearOwnerLines();

  const el = document.createElement('div');
  el.className = 'drama-owner-line';
  el.textContent = text;
  host.appendChild(el);
  activeLineEl = el;

  activeLineTimer = setTimeout(() => {
    if (!el.isConnected) return;
    el.classList.add('exit');
    const removeTimer = setTimeout(() => {
      try { el.remove(); } catch(e) {}
      if (activeLineEl === el) activeLineEl = null;
    }, 320);
    // park so clearOwnerLines can cancel if needed
    activeLineTimer = removeTimer;
  }, duration);
}

export function randomOwnerLine(opts) {
  const pool = OWNER_LINES[currentLang] || OWNER_LINES.ja;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  showOwnerLine(pick, opts);
}
