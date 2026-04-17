// ===== SHARE =====
import { state } from '../state.js';
import { t } from '../i18n.js';
import { getRankTitle } from '../ranking/score.js';
import { GAME_URL } from '../assets.js';

export function shareOnX(endingStatus) {
  const rt = getRankTitle();
  let text = '🍜 JIRO Sim 🍜\n' + rt + ' - ' + state.score + t('sharePts')
    + '\n' + t('shareCall') + ': ' + (state.callText || t('shareNone'))
    + '\n' + t('maxCombo') + ': ' + state.maxCombo
    + '\n' + endingStatus + '\n#JIROSim #ラーメン';
  if (GAME_URL) text += '\n' + GAME_URL;
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
}
