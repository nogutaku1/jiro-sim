// ===== TITLES (称号) =====
// Awarded for specific play patterns. Persisted in localStorage['jiro_titles'].
//
// Integration contract:
//   - Call checkTitles(ctx) after a run (game-end). ctx shape:
//       { event, score, maxCombo, misses, toppings, difficulty, isGoodEnd,
//         ticketName, callText, skullsSkipped, remainingTime, ... }
//   - Returns array of NEW title keys earned this call.
//   - Mutates state.titlesEarned and localStorage.
//
// UI:
//   - showTitleBadge(key) creates a floating `.title-badge` (CSS in styles.css)
//     that auto-removes after 3s and plays a short chime.
//
import { state } from '../state.js';
import { currentLang } from '../i18n.js';
import { playSound, getAudioCtx } from '../audio/core.js';

// ---------- Title definitions ----------
export const TITLES = {
  first_timer: {
    key: 'first_timer',
    nameJa: '初JIRO', nameEn: 'First Timer',
    descJa: '初めてJIROに来店した', descEn: 'Visited JIRO for the first time',
    emoji: '🎫', rarity: 'common',
  },
  regular: {
    key: 'regular',
    nameJa: 'JIRO常連', nameEn: 'JIRO Regular',
    descJa: '5回プレイ達成', descEn: 'Played 5 times',
    emoji: '🍥', rarity: 'common',
  },
  jiro_lifer: {
    key: 'jiro_lifer',
    nameJa: 'JIROに人生を捧げた者', nameEn: 'JIRO Lifer',
    descJa: '20回プレイ達成', descEn: 'Played 20 times',
    emoji: '🏮', rarity: 'rare',
  },
  perfect_call: {
    key: 'perfect_call',
    nameJa: '全マシマシ宣言', nameEn: 'All Max Caller',
    descJa: '全トッピングをマシマシでコール', descEn: 'Called every topping MAX',
    emoji: '💥', rarity: 'rare',
  },
  pure_monk: {
    key: 'pure_monk',
    nameJa: 'JIRO修行僧', nameEn: 'Pure Monk',
    descJa: '全てのトッピングを「なし」で完食', descEn: 'Finished with ALL toppings "none"',
    emoji: '🧘', rarity: 'rare',
  },
  no_miss: {
    key: 'no_miss',
    nameJa: '完全ノーミス', nameEn: 'No Miss Master',
    descJa: 'ミスゼロで完食', descEn: 'Zero misses in a complete run',
    emoji: '🎯', rarity: 'rare',
  },
  combo_master_30: {
    key: 'combo_master_30',
    nameJa: 'コンボマスター', nameEn: 'Combo Master',
    descJa: '30コンボ達成', descEn: 'Reached 30-combo',
    emoji: '🔥', rarity: 'common',
  },
  combo_legend_60: {
    key: 'combo_legend_60',
    nameJa: 'コンボ伝説', nameEn: 'Combo Legend',
    descJa: '60コンボ達成', descEn: 'Reached 60-combo',
    emoji: '⚡', rarity: 'legendary',
  },
  speed_eater: {
    key: 'speed_eater',
    nameJa: '早食い王', nameEn: 'Speed Eater',
    descJa: '残り時間に1000点以上稼ぐ', descEn: '+1000 points in the final stretch',
    emoji: '💨', rarity: 'rare',
  },
  skull_slayer: {
    key: 'skull_slayer',
    nameJa: 'むせ回避の達人', nameEn: 'Skull Slayer',
    descJa: '💀ノートを一度も叩かなかった', descEn: 'Never tapped a skull note',
    emoji: '💀', rarity: 'rare',
  },
  lot_respect: {
    key: 'lot_respect',
    nameJa: 'ロットの守護者', nameEn: 'Lot Respect',
    descJa: '完食＋クロス拭きまで完遂', descEn: 'Finished + wiped cloth perfectly',
    emoji: '🧼', rarity: 'legendary',
  },
  hardcore: {
    key: 'hardcore',
    nameJa: 'ハードコアJIRO', nameEn: 'Hardcore JIRO',
    descJa: '大ぶたダブル・Hardで完食', descEn: 'Beat Hard mode on Double Pork',
    emoji: '👹', rarity: 'legendary',
  },
  banned_often: {
    key: 'banned_often',
    nameJa: '出禁常習犯', nameEn: 'Banned Often',
    descJa: '累計3回出禁になった', descEn: 'Got banned 3 times total',
    emoji: '🚫', rarity: 'rare',
  },
  daily_clear: {
    key: 'daily_clear',
    nameJa: '日替わり制覇', nameEn: 'Daily Crusher',
    descJa: '日替わりチャレンジをクリア', descEn: 'Cleared the daily challenge',
    emoji: '🗓️', rarity: 'rare',
  },
  secret_hunter: {
    key: 'secret_hunter',
    nameJa: '裏メニュー発見', nameEn: 'Secret Hunter',
    descJa: '隠し要素を発見', descEn: 'Discovered a hidden element',
    emoji: '🗝️', rarity: 'legendary',
  },
  high_scorer: {
    key: 'high_scorer',
    nameJa: 'スコアマシマシ', nameEn: 'High Scorer',
    descJa: 'スコア3000点を突破', descEn: 'Scored over 3000 points',
    emoji: '🏅', rarity: 'rare',
  },
  one_life: {
    key: 'one_life',
    nameJa: '薄氷の完食', nameEn: 'One Life Left',
    descJa: '残りライフ1で完食', descEn: 'Finished with only 1 life left',
    emoji: '❤️‍🔥', rarity: 'rare',
  },
  polyglot: {
    key: 'polyglot',
    nameJa: 'バイリンガルJIRO', nameEn: 'Bilingual JIRO',
    descJa: '日本語と英語両方でプレイ', descEn: 'Played in both JP and EN',
    emoji: '🌐', rarity: 'common',
  },
};

// ---------- Helpers ----------
const LS_TITLES = 'jiro_titles';
const LS_PLAY_COUNT = 'jiro_play_count';
const LS_BAN_COUNT = 'jiro_ban_count';
const LS_LANG_SET = 'jiro_lang_seen';

function readEarnedSet() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_TITLES) || '[]');
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) { return new Set(); }
}

function writeEarnedSet(set) {
  try { localStorage.setItem(LS_TITLES, JSON.stringify([...set])); } catch (e) {}
}

export function getEarnedTitles() {
  return [...readEarnedSet()];
}

function bumpCounter(key) {
  const n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  try { localStorage.setItem(key, String(n)); } catch (e) {}
  return n;
}

function recordLangSeen() {
  try {
    const raw = localStorage.getItem(LS_LANG_SET);
    const seen = new Set(raw ? JSON.parse(raw) : []);
    seen.add(currentLang);
    localStorage.setItem(LS_LANG_SET, JSON.stringify([...seen]));
    return seen;
  } catch (e) { return new Set([currentLang]); }
}

// ---------- Evaluation ----------
function evaluate(ctx) {
  const newly = [];
  const push = (k) => { if (TITLES[k]) newly.push(k); };

  // First-timer & play count (only on game-end-ish events)
  if (ctx.event === 'game-end' || ctx.event === 'rhythm-end' || ctx.event === 'bad-end') {
    const playCount = bumpCounter(LS_PLAY_COUNT);
    if (playCount === 1) push('first_timer');
    if (playCount >= 5)  push('regular');
    if (playCount >= 20) push('jiro_lifer');
  }

  // Ban counter
  if (ctx.event === 'bad-end') {
    const banCount = bumpCounter(LS_BAN_COUNT);
    if (banCount >= 3) push('banned_often');
  }

  // Toppings analysis
  const tp = ctx.toppings || {};
  const tvals = Object.values(tp);
  const allMax = tvals.length === 4 && tvals.every(v => v >= 3);
  const allNone = tvals.length === 4 && tvals.every(v => v === 0);

  if (ctx.isGoodEnd && allMax) push('perfect_call');
  if (ctx.isGoodEnd && allNone) push('pure_monk');

  // Combo tiers
  if ((ctx.maxCombo || 0) >= 30) push('combo_master_30');
  if ((ctx.maxCombo || 0) >= 60) push('combo_legend_60');

  // Misses
  if (ctx.isGoodEnd && (ctx.misses || 0) === 0) push('no_miss');
  if (ctx.isGoodEnd && (ctx.skullsSkipped === true || ctx.skullTaps === 0)) push('skull_slayer');

  // Speed eater
  if ((ctx.lateScore || 0) >= 1000) push('speed_eater');

  // Perfect lot respect (bowl cleared + cloth tapped + good end)
  if (ctx.isGoodEnd && ctx.bowlCleared && ctx.clothTapped) push('lot_respect');

  // Hardcore: hard + double-pork + good end
  if (ctx.isGoodEnd && ctx.difficulty === 'hard' && (ctx.ticketId === 'doublePork' || /double/i.test(ctx.ticketName || ''))) {
    push('hardcore');
  }

  // Daily clear
  if (ctx.dailyCleared) push('daily_clear');

  // Secret finder
  if (Array.isArray(ctx.secretsFound) && ctx.secretsFound.length > 0) push('secret_hunter');
  else if (Array.isArray(state.secretsFound) && state.secretsFound.length > 0) push('secret_hunter');

  // Score tier
  if ((ctx.score || 0) >= 3000) push('high_scorer');

  // One life left
  if (ctx.isGoodEnd && ctx.livesLeft === 1) push('one_life');

  // Polyglot
  const langSeen = recordLangSeen();
  if (langSeen.size >= 2) push('polyglot');

  return newly;
}

/**
 * Evaluate titles given a context. Mutates state.titlesEarned & localStorage.
 * Returns array of NEW title keys earned on this call (may be empty).
 */
export function checkTitles(context) {
  if (!context || typeof context !== 'object') return [];
  const candidates = evaluate(context);
  const earnedSet = readEarnedSet();
  const newlyEarned = [];
  for (const k of candidates) {
    if (!earnedSet.has(k)) {
      earnedSet.add(k);
      newlyEarned.push(k);
    }
  }
  if (newlyEarned.length > 0) {
    writeEarnedSet(earnedSet);
  }
  // Sync state.titlesEarned
  state.titlesEarned = [...earnedSet];

  // Fire badges (one at a time, sequential)
  newlyEarned.forEach((k, i) => {
    setTimeout(() => showTitleBadge(k), 400 * i);
  });

  return newlyEarned;
}

/**
 * Return display info for a title in the current language.
 */
export function getTitleDisplay(key) {
  const def = TITLES[key];
  if (!def) return { name: key, desc: '', emoji: '❓', rarity: 'common' };
  return {
    name: currentLang === 'en' ? def.nameEn : def.nameJa,
    desc: currentLang === 'en' ? def.descEn : def.descJa,
    emoji: def.emoji,
    rarity: def.rarity,
  };
}

/**
 * Show a floating title badge at the top of the screen.
 * Uses `.title-badge` class from styles.css. Auto-removes after 3s.
 */
export function showTitleBadge(key) {
  const def = TITLES[key];
  if (!def) return;
  const info = getTitleDisplay(key);
  const host = document.getElementById('game') || document.body;
  const badge = document.createElement('div');
  badge.className = 'title-badge';
  badge.innerHTML = `<span style="margin-right:6px;">${info.emoji}</span>${info.name}`;
  host.appendChild(badge);

  // Chime via oscillator
  try {
    if (getAudioCtx()) {
      playSound(880, 0.12, 'triangle', 0.18);
      setTimeout(() => playSound(1320, 0.18, 'triangle', 0.18), 120);
    }
  } catch (e) {}

  setTimeout(() => {
    badge.style.transition = 'opacity 0.4s';
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 420);
  }, 2600);
}

// Initialize state.titlesEarned from storage on module load
state.titlesEarned = getEarnedTitles();
