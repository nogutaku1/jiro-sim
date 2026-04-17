// ===== SECRETS (v3: hidden easter-egg tracker) =====
// Small, localStorage-backed registry of unlocked "secrets".
// Usage:
//   import { registerSecret, hasSecret, getSecrets, installTitleTapSecret } from './meta/secrets.js';

const LS_KEY = 'jiro_secrets';

function readAll() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) { return {}; }
}

function writeAll(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { /* quota / private mode */ }
}

/**
 * Register a secret as unlocked. Returns `true` if this was a NEW unlock
 * (first time), `false` if already known. Safe to call repeatedly.
 */
export function registerSecret(key) {
  if (!key) return false;
  const all = readAll();
  if (all[key]) return false;
  all[key] = { unlockedAt: Date.now() };
  writeAll(all);
  // Mirror to in-memory state if present (non-blocking)
  try {
    import('../state.js').then((m) => {
      if (m && m.state) {
        if (!Array.isArray(m.state.secretsFound)) m.state.secretsFound = [];
        if (!m.state.secretsFound.includes(key)) m.state.secretsFound.push(key);
      }
    }).catch(() => {});
  } catch (e) { /* ignore */ }
  return true;
}

export function hasSecret(key) {
  return !!readAll()[key];
}

export function getSecrets() {
  return Object.keys(readAll());
}

// ---- UI helpers ----------------------------------------------------------

function showSecretToast(text) {
  try {
    const host = document.getElementById('game') || document.body;
    const toast = document.createElement('div');
    toast.className = 'secret-toast';
    toast.textContent = text;
    host.appendChild(toast);
    setTimeout(() => { toast.style.transition = 'opacity 0.5s'; toast.style.opacity = '0'; }, 2400);
    setTimeout(() => { toast.remove(); }, 3000);
  } catch (e) { /* best effort */ }
}

function burstConfetti(count) {
  try {
    const host = document.getElementById('game') || document.body;
    const colors = ['#D4A017', '#E74C3C', '#4CAF50', '#4FC3F7', '#FF6B35', '#fff'];
    for (let i = 0; i < count; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.background = colors[Math.floor(Math.random() * colors.length)];
      conf.style.left = Math.random() * 100 + '%';
      conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
      conf.style.animationDelay = (Math.random() * 0.6) + 's';
      conf.style.width = (Math.random() * 6 + 5) + 'px';
      conf.style.height = (Math.random() * 6 + 5) + 'px';
      conf.style.zIndex = '5';
      host.appendChild(conf);
      setTimeout(() => { conf.remove(); }, 5000);
    }
  } catch (e) { /* ignore */ }
}

/**
 * Install a document-level listener that counts taps on the Title scene's
 * logo (the <h1>) and, on reaching 7 consecutive taps within a short
 * window, unlocks the 'legendary_fan' secret with confetti + toast.
 *
 * Safe to call once from main.js — installs a single global listener.
 * Activates only when #scene-title is `.active`.
 */
export function installTitleTapSecret() {
  const TARGET = 7;
  const WINDOW_MS = 4000;
  let taps = 0;
  let firstAt = 0;

  document.addEventListener('pointerdown', (ev) => {
    const sceneTitle = document.getElementById('scene-title');
    if (!sceneTitle || !sceneTitle.classList.contains('active')) return;
    // Only count taps on the heading (the "logo")
    const target = ev.target;
    if (!target || !(target instanceof Element)) return;
    if (!target.matches('#scene-title h1')) return;

    const now = Date.now();
    if (now - firstAt > WINDOW_MS) { taps = 0; firstAt = now; }
    taps++;
    if (taps >= TARGET) {
      taps = 0;
      const wasNew = registerSecret('legendary_fan');
      if (wasNew) {
        burstConfetti(40);
        const lang = (localStorage.getItem('jiro_lang') || 'ja');
        showSecretToast(lang === 'en'
          ? '⭐ SECRET: Legendary Fan unlocked!'
          : '⭐ 隠し称号: 伝説のJIROファン 解放！');
      } else {
        const lang = (localStorage.getItem('jiro_lang') || 'ja');
        showSecretToast(lang === 'en' ? '⭐ Already unlocked' : '⭐ すでに獲得済み');
      }
    }
  }, true);
}
