// ===== META-GAME INIT =====
// Wires up the 'jiro:game-end' custom event to the title-evaluation pipeline.
//
// Call initMetaGame() once at startup (from main.js). It listens for:
//   window.dispatchEvent(new CustomEvent('jiro:game-end', { detail: { ... } }))
// and runs checkTitles with the payload merged with live state snapshots.
//
// Event detail convention (all optional):
//   { event: 'game-end'|'bad-end'|'rhythm-end',
//     score, maxCombo, misses, toppings, difficulty,
//     isGoodEnd, ticketName, ticketId, callText,
//     skullTaps, skullsSkipped, lateScore, livesLeft,
//     bowlCleared, clothTapped, dailyCleared, secretsFound }
//
import { state } from '../state.js';
import { checkTitles, getEarnedTitles } from './titles.js';
import { markDailyCleared } from './daily.js';

let _inited = false;

export function initMetaGame() {
  if (_inited) return;
  _inited = true;

  // Hydrate state from localStorage
  state.titlesEarned = getEarnedTitles();

  window.addEventListener('jiro:game-end', (e) => {
    const detail = (e && e.detail) || {};
    const ctx = {
      event: detail.event || 'game-end',
      score: detail.score ?? state.score,
      maxCombo: detail.maxCombo ?? state.maxCombo,
      misses: detail.misses ?? state.missCount,
      toppings: detail.toppings ?? state.toppings,
      difficulty: detail.difficulty ?? state.difficulty,
      isGoodEnd: !!detail.isGoodEnd,
      ticketName: detail.ticketName ?? state.ticketName,
      ticketId: detail.ticketId ?? state.ticket,
      callText: detail.callText ?? state.callText,
      skullTaps: detail.skullTaps,
      skullsSkipped: detail.skullsSkipped,
      lateScore: detail.lateScore,
      livesLeft: detail.livesLeft ?? state.lives,
      bowlCleared: detail.bowlCleared ?? state.bowlCleared,
      clothTapped: detail.clothTapped ?? state.clothTapped,
      dailyCleared: detail.dailyCleared ?? false,
      secretsFound: detail.secretsFound ?? state.secretsFound,
    };

    // Daily challenge: if attempted + good-end, mark cleared
    if (state.dailyChallenge && ctx.isGoodEnd) {
      markDailyCleared();
      ctx.dailyCleared = true;
    }

    checkTitles(ctx);
  });
}
