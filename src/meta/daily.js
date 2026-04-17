// ===== DAILY CHALLENGE =====
// Seeded by YYYYMMDD → deterministic modifier per day.
//
// Integration contract with Track 1 (rhythm.js):
//   Track 1 OWNS rhythm.js and may optionally import:
//     import { getDailyChallenge, applyDailyModifier } from '../meta/daily.js';
//   Then, just after building the `diff` settings object inside rhythm.js:
//     if (state.dailyChallenge) applyDailyModifier(state.dailyChallenge, diff);
//   This module exports applyDailyModifier so it mutates the diff object
//   in-place without Track 3 needing to touch rhythm.js.
//
// Lives / tutorial modifiers:
//   - `low_lives`       → caller should honor diff.startingLives when init'ing state.lives.
//                         As a convenience, this module also overwrites state.lives
//                         at apply time so any subsequent `state.lives--` logic works.
//   - `no_tutorial`     → diff.noTutorial = true; rhythm can check to skip slow notes.
//   - `mega_combo`      → diff.comboMult = 2 (rhythm reads as a multiplier).
//   - `perfect_only`    → diff.perfectOnly = true; OK hits should count as miss.
//   - `double_skulls`   → multiplies skull spawn rate (halves delay).
//   - `fast_notes`      → fallDuration *= 0.7.
//
import { state } from '../state.js';

// ---------- Seeded RNG ----------
function dateSeed(d) {
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  return yyyy * 10000 + mm * 100 + dd; // e.g. 20260417
}

// Mulberry32 deterministic PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Challenge definitions ----------
const CHALLENGES = [
  {
    id: 'double_skulls',
    nameJa: 'むせ注意報', nameEn: 'Skull Storm',
    descJa: '💀ノートの出現率2倍', descEn: 'Double skull spawn rate',
    modifier: 'double_skulls',
  },
  {
    id: 'fast_notes',
    nameJa: '早まわし', nameEn: 'Fast Forward',
    descJa: 'ノートが高速落下（×0.7）', descEn: 'Notes fall 30% faster',
    modifier: 'fast_notes',
  },
  {
    id: 'low_lives',
    nameJa: '胃弱モード', nameEn: 'Weak Stomach',
    descJa: '開始ライフ3', descEn: 'Start with 3 lives',
    modifier: 'low_lives',
  },
  {
    id: 'no_tutorial',
    nameJa: '予習禁止', nameEn: 'No Warmup',
    descJa: 'チュートリアル(序盤の遅ノート)なし', descEn: 'Skip tutorial slow notes',
    modifier: 'no_tutorial',
  },
  {
    id: 'mega_combo',
    nameJa: 'メガコンボ', nameEn: 'Mega Combo',
    descJa: 'コンボ倍率×2', descEn: 'Combo multiplier doubled',
    modifier: 'mega_combo',
  },
  {
    id: 'perfect_only',
    nameJa: 'パーフェクト縛り', nameEn: 'Perfect Only',
    descJa: 'OK判定もミス扱い', descEn: 'OK hits count as miss',
    modifier: 'perfect_only',
  },
];

// ---------- Public API ----------
/**
 * Return today's challenge (or a given Date's).
 */
export function getDailyChallenge(d = new Date()) {
  const seed = dateSeed(d);
  const rng = mulberry32(seed);
  const idx = Math.floor(rng() * CHALLENGES.length) % CHALLENGES.length;
  const base = CHALLENGES[idx];
  return {
    date: seed,
    ...base,
  };
}

/**
 * Apply the challenge modifier to a rhythm `diff` settings object in-place.
 * Safe to call with a falsy challenge (no-op).
 */
export function applyDailyModifier(challenge, diff) {
  if (!challenge || !diff) return;
  switch (challenge.modifier) {
    case 'double_skulls':
      diff.skullMin = Math.max(400, Math.round((diff.skullMin || 4000) * 0.5));
      diff.skullMax = Math.max(800, Math.round((diff.skullMax || 6000) * 0.5));
      break;
    case 'fast_notes':
      diff.fallDuration = Math.round((diff.fallDuration || 2200) * 0.7);
      break;
    case 'low_lives':
      diff.startingLives = 3;
      try { state.lives = 3; } catch (e) {}
      break;
    case 'no_tutorial':
      diff.noTutorial = true;
      break;
    case 'mega_combo':
      diff.comboMult = 2;
      break;
    case 'perfect_only':
      diff.perfectOnly = true;
      break;
  }
}

// ---------- Cleared flag ----------
function todayKey(d = new Date()) {
  return 'jiro_daily_cleared_' + dateSeed(d);
}

export function isDailyCleared(d = new Date()) {
  try { return localStorage.getItem(todayKey(d)) === '1'; } catch (e) { return false; }
}

export function markDailyCleared(d = new Date()) {
  try { localStorage.setItem(todayKey(d), '1'); } catch (e) {}
}

/**
 * Return i18n-resolved display for today's challenge.
 * lang: 'ja' | 'en'
 */
export function getDailyDisplay(lang) {
  const ch = getDailyChallenge();
  return {
    id: ch.id,
    name: lang === 'en' ? ch.nameEn : ch.nameJa,
    desc: lang === 'en' ? ch.descEn : ch.descJa,
    modifier: ch.modifier,
    cleared: isDailyCleared(),
  };
}
