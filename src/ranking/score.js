// ===== SCORE / RANK =====
import { state } from '../state.js';
import { t } from '../i18n.js';
import { supabasePost } from './supabase.js';

export function getRankTitle() {
  let key = 'rankBanned';
  if (state.score >= 2500) key = 'rankMaster';
  else if (state.score >= 2000) key = 'rankLian';
  else if (state.score >= 1500) key = 'rankIntermediate';
  else if (state.score >= 500)  key = 'rankBeginner';
  return t(key);
}

export function saveRanking(score, rank, callText, playerName) {
  if (score <= 0) return;
  const pName = playerName || 'ANONYM';
  supabasePost('rankings', {
    score,
    rank_title: rank,
    call_text: callText,
    max_combo: state.maxCombo,
    ticket: state.ticketName || '',
    difficulty: state.difficulty,
    name: pName
  });
  let rankings = [];
  try { rankings = JSON.parse(localStorage.getItem('jiro_rankings') || '[]'); } catch(e) {}
  const now = new Date();
  const dateStr = (now.getMonth()+1) + '/' + now.getDate() + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  rankings.push({ score, rank, call: callText, date: dateStr, name: pName });
  rankings.sort((a,b) => b.score - a.score);
  rankings = rankings.slice(0, 20);
  try { localStorage.setItem('jiro_rankings', JSON.stringify(rankings)); } catch(e) {}
}
