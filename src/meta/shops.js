// ===== SHOP VARIATIONS =====
// Defines 4 shop variants. Default is always unlocked; others unlock progressively.
// Reads/writes state.shopId and persists to localStorage.
import { state } from '../state.js';

const LS_SHOP = 'jiro_shop_id';
const LS_PLAYS = 'jiro_play_count';
const LS_HARDCORE = 'jiro_hardcore_win';
const LS_KAMEIDO_CODE = 'jiro_kameido_unlocked';

export const SHOPS = {
  default: {
    id: 'default',
    nameJa: '本店',
    nameEn: 'Main Shop',
    ownerLines: ['コールは？', 'お先にどうぞ'],
    bgmBpmOffset: 0,
    ownerFaceFilter: 'none',
    tutorialMsgJa: 'ようやく座れた…',
    tutorialMsgEn: 'Finally got a seat...',
    unlockCondition: () => true,
  },
  meguro: {
    id: 'meguro',
    nameJa: '目黒店',
    nameEn: 'Meguro Branch',
    ownerLines: ['ごゆっくりどうぞ', '温かいうちに、どうぞ'],
    bgmBpmOffset: -10,
    ownerFaceFilter: 'saturate(0.85) brightness(1.05)',
    tutorialMsgJa: '落ち着いた雰囲気だ…',
    tutorialMsgEn: 'A calm atmosphere...',
    unlockCondition: () => {
      try { return (parseInt(localStorage.getItem(LS_PLAYS) || '0', 10)) >= 3; }
      catch(e) { return false; }
    },
  },
  mita: {
    id: 'mita',
    nameJa: '三田本店',
    nameEn: 'Mita Main',
    ownerLines: ['コール！', 'ロット乱すな'],
    bgmBpmOffset: 15,
    ownerFaceFilter: 'contrast(1.1) saturate(1.1)',
    tutorialMsgJa: '空気がピリついている…',
    tutorialMsgEn: 'The air is tense...',
    unlockCondition: () => {
      try { return localStorage.getItem(LS_HARDCORE) === '1'; }
      catch(e) { return false; }
    },
  },
  kameido: {
    id: 'kameido',
    nameJa: '亀戸店',
    nameEn: 'Kameido Branch',
    ownerLines: ['深夜限定だぜ', 'よく来たな'],
    bgmBpmOffset: 5,
    ownerFaceFilter: 'hue-rotate(-15deg) saturate(1.2)',
    tutorialMsgJa: '深夜の静寂が漂う…',
    tutorialMsgEn: 'The hush of late night...',
    unlockCondition: () => {
      try { return localStorage.getItem(LS_KAMEIDO_CODE) === '1'; }
      catch(e) { return false; }
    },
  },
};

export function getShop(id) {
  return SHOPS[id] || SHOPS.default;
}

export function getCurrentShop() {
  return getShop(state.shopId || 'default');
}

export function setShop(id) {
  if (!SHOPS[id]) id = 'default';
  state.shopId = id;
  try { localStorage.setItem(LS_SHOP, id); } catch(e) {}
}

export function getUnlockedShops() {
  return Object.keys(SHOPS).filter(id => {
    try { return SHOPS[id].unlockCondition(); } catch(e) { return id === 'default'; }
  });
}

// Random from unlocked, weighted toward rarer (harder-to-unlock shops get a slight edge
// when available, so variety feels rewarding). default weight 3, meguro 2, mita 2, kameido 2.
const WEIGHTS = { default: 3, meguro: 2, mita: 2, kameido: 2 };

export function getRandomShop() {
  const unlocked = getUnlockedShops();
  if (unlocked.length <= 1) return 'default';
  const pool = [];
  unlocked.forEach(id => {
    const w = WEIGHTS[id] || 1;
    for (let i = 0; i < w; i++) pool.push(id);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

// Persistence helpers called by other modules. Kept here so callers can bump counters
// without duplicating localStorage wiring.
export function bumpPlayCount() {
  try {
    const n = parseInt(localStorage.getItem(LS_PLAYS) || '0', 10) + 1;
    localStorage.setItem(LS_PLAYS, String(n));
    return n;
  } catch(e) { return 0; }
}

export function markHardcoreWin() {
  try { localStorage.setItem(LS_HARDCORE, '1'); } catch(e) {}
}

export function unlockKameido() {
  try { localStorage.setItem(LS_KAMEIDO_CODE, '1'); } catch(e) {}
}

// Initialize state.shopId from localStorage on module load.
try {
  const saved = localStorage.getItem(LS_SHOP);
  if (saved && SHOPS[saved]) state.shopId = saved;
} catch(e) {}
