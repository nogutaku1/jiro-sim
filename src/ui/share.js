// ===== SHARE (v3: viral-friendly helpers) =====
import { state } from '../state.js';
import { t } from '../i18n.js';
import { getRankTitle } from '../ranking/score.js';
import { GAME_URL } from '../assets.js';

const DEFAULT_URL = 'https://jiro-sim.pages.dev';
const HASHTAGS = '#JIROSim #ラーメン #Jiro';

function gameUrl() { return GAME_URL || DEFAULT_URL; }

function currentLang() {
  try { return localStorage.getItem('jiro_lang') || 'ja'; } catch (e) { return 'ja'; }
}

// Tiny inline toast for copy/share feedback (no external dep).
function showShareToast(msg) {
  try {
    const host = document.getElementById('game') || document.body;
    const toast = document.createElement('div');
    toast.className = 'secret-toast';
    toast.style.cssText = 'background:rgba(20,10,0,0.92);border:1px solid #D4A017;color:#D4A017;'
      + 'padding:12px 22px;border-radius:12px;font-weight:900;font-size:14px;'
      + 'position:absolute;bottom:120px;left:50%;transform:translateX(-50%);z-index:40;'
      + 'box-shadow:0 0 20px rgba(212,160,23,0.5);pointer-events:none;';
    toast.textContent = msg;
    host.appendChild(toast);
    setTimeout(() => { toast.style.transition = 'opacity 0.4s'; toast.style.opacity = '0'; }, 2600);
    setTimeout(() => { toast.remove(); }, 3200);
  } catch (e) { /* best effort */ }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch (e) { return false; }
}

/**
 * Open X (Twitter) intent with given text. If the popup is blocked OR the
 * user is on a context where opening fails, fall back to copying the text
 * to the clipboard and showing a "copied" toast for ~5 seconds.
 */
export function openXShare(text) {
  const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  let popup = null;
  try { popup = window.open(url, '_blank', 'noopener'); } catch (e) { popup = null; }
  if (!popup) {
    copyToClipboard(text).then((ok) => {
      const lang = currentLang();
      const msg = ok
        ? (lang === 'en' ? 'Share text copied — paste to X!' : 'テキストをコピーしました。Xに貼り付けてね')
        : (lang === 'en' ? 'Share failed — please try again' : 'シェアに失敗しました');
      showShareToast(msg);
    });
  }
}

// ---- Viral-friendly templates -------------------------------------------

function buildViralTemplate(endingStatus, opts) {
  opts = opts || {};
  const rt   = opts.rankTitle   || getRankTitle();
  const sc   = opts.score       != null ? opts.score : state.score;
  const call = opts.callText    || state.callText || t('shareNone');
  const mc   = opts.maxCombo    != null ? opts.maxCombo : state.maxCombo;
  const titles = Array.isArray(opts.titles) ? opts.titles
                : (Array.isArray(state.titlesEarned) ? state.titlesEarned : []);
  const daily = opts.daily || state.dailyChallenge;
  const streak = opts.streak || 0;

  const lines = [];
  lines.push('🍜 JIRO Sim 🍜');
  lines.push(rt + ' - ' + sc + t('sharePts'));
  lines.push(t('shareCall') + ': ' + call);
  lines.push(t('maxCombo') + ': ' + mc);
  if (titles.length > 0) {
    const badge = titles.length === 1
      ? (currentLang() === 'en' ? `🏅 Title earned: ${titles[0]}` : `🏅 称号獲得: ${titles[0]}`)
      : (currentLang() === 'en' ? `🏅 ${titles.length} titles earned` : `🏅 称号 ${titles.length}個獲得`);
    lines.push(badge);
  }
  if (daily && (opts.dailyCleared || state.dailyChallenge === daily)) {
    lines.push(currentLang() === 'en'
      ? `⭐ Cleared daily: ${daily.name || daily.title || 'challenge'}`
      : `⭐ デイリー達成: ${daily.name || daily.title || 'チャレンジ'}`);
  }
  if (streak > 1) {
    lines.push(currentLang() === 'en' ? `🔥 ${streak}-day streak` : `🔥 ${streak}日連続プレイ中`);
  }
  if (endingStatus) lines.push(endingStatus);
  lines.push(HASHTAGS);
  lines.push(gameUrl());
  return lines.join('\n');
}

// ---- Public helpers ------------------------------------------------------

export function shareOnX(endingStatus, opts) {
  openXShare(buildViralTemplate(endingStatus, opts));
}

export function sharePerfect(opts) {
  openXShare(buildViralTemplate(t('sharePerfect'), opts));
}

export function shareBad(opts) {
  openXShare(buildViralTemplate(t('shareBanned'), opts));
}

export function shareCustom(text) {
  const finalText = (text || '') + (text && text.indexOf(gameUrl()) === -1 ? ('\n' + gameUrl()) : '');
  openXShare(finalText);
}

// Helper: build text without opening, useful for callers that want to
// pass text through navigator.share (with image attachment).
export function buildShareText(endingStatus, opts) {
  return buildViralTemplate(endingStatus, opts);
}
