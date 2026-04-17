// ===== GAME STATE =====
// Shared mutable state. Mutate via exported functions or direct property assign.
export const state = {
  ticket: null, ticketColor: null, ticketName: null,
  difficulty: 'normal',
  toppings: { ninniku: 0, yasai: 0, abura: 0, karame: 0 },
  score: 0, combo: 0, maxCombo: 0, lives: 5, missCount: 0,
  bowlCleared: false, clothTapped: false, callText: '',
  // v3 extensions (populated by modules that need them)
  shopId: 'default',
  titlesEarned: [],
  secretsFound: [],
  dailyChallenge: null,
};

export function resetState() {
  state.ticket = null;
  state.ticketColor = null;
  state.ticketName = null;
  state.difficulty = 'normal';
  state.toppings = { ninniku: 0, yasai: 0, abura: 0, karame: 0 };
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.lives = 5;
  state.missCount = 0;
  state.bowlCleared = false;
  state.clothTapped = false;
  state.callText = '';
  state.titlesEarned = [];
  state.secretsFound = [];
}

// ===== TIMER REGISTRY =====
let activeTimers = [];
let activeIntervals = [];
let activeRAF = null;
const cleanupCallbacks = [];

export function addTimeout(fn, ms) { const t = setTimeout(fn, ms); activeTimers.push(t); return t; }
export function addInterval(fn, ms) { const t = setInterval(fn, ms); activeIntervals.push(t); return t; }
export function setRAF(id) { activeRAF = id; }
export function getRAF() { return activeRAF; }

export function onClearTimers(cb) { cleanupCallbacks.push(cb); }

export function clearAllTimers() {
  activeTimers.forEach(t => clearTimeout(t));
  activeIntervals.forEach(t => clearInterval(t));
  activeTimers = [];
  activeIntervals = [];
  if (activeRAF) { cancelAnimationFrame(activeRAF); activeRAF = null; }
  cleanupCallbacks.forEach(cb => { try { cb(); } catch(e) {} });
}
