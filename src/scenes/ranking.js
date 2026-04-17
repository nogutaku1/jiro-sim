// ===== SCENE 1.5: RANKING =====
import { t } from '../i18n.js';
import { clearAllTimers } from '../state.js';
import { showScene } from '../scene-manager.js';
import { supabaseGet } from '../ranking/supabase.js';
import { ensureTitleVideo } from './title.js';
import { sceneTitle } from './title.js';

export function sceneRanking() {
  clearAllTimers();
  const scene = showScene('scene-ranking');
  scene.innerHTML = '';

  const video = ensureTitleVideo();
  scene.appendChild(video);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  scene.appendChild(overlay);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.justifyContent = 'flex-start';
  content.style.gap = '16px';
  content.style.overflowY = 'auto';
  content.innerHTML = `
    <h2 style="font-size:32px;font-weight:900;color:#D4A017;margin-top:40px;text-shadow:0 0 10px rgba(212,160,23,0.5);">RANKING</h2>
    <div id="rank-tabs" style="display:flex;gap:8px;margin-bottom:8px;">
      <button class="btn-secondary rank-tab active-tab" data-tab="global" style="padding:6px 16px;font-size:12px;">${t('world')}</button>
      <button class="btn-secondary rank-tab" data-tab="local" style="padding:6px 16px;font-size:12px;">${t('myself')}</button>
    </div>
    <div id="rank-list" style="display:flex;flex-direction:column;gap:8px;width:100%;align-items:center;min-height:200px;">
      <div style="color:#888;margin:40px 0;">${t('loading')}</div>
    </div>
    <button class="btn-secondary" id="btn-back" style="margin-top:20px;margin-bottom:60px;">${t('backToTitle')}</button>
  `;
  scene.appendChild(content);

  const tabStyle = document.createElement('style');
  tabStyle.textContent = '.rank-tab{opacity:0.5;transition:opacity 0.2s;}.rank-tab.active-tab{opacity:1;background:#D4A017 !important;color:#000 !important;border-color:#D4A017 !important;}';
  scene.appendChild(tabStyle);

  const listEl = content.querySelector('#rank-list');

  function renderList(rankings, isGlobal) {
    if (!rankings || rankings.length === 0) {
      listEl.innerHTML = '<div style="color:#888;margin:40px 0;">' + t('noRecords') + '</div>';
      return;
    }
    listEl.innerHTML = rankings.map((r, i) => {
      const score = r.score;
      const rank = isGlobal ? (r.rank_title || '') : (r.rank || '');
      const call = isGlobal ? (r.call_text || '') : (r.call || '');
      const date = isGlobal ? (r.created_at ? new Date(r.created_at).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '') : (r.date || '');
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + '位';
      const name = r.name || 'ANONYM';
      return `
        <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;width:100%;max-width:340px;border-left:4px solid ${i<3?'#D4A017':'rgba(255,255,255,0.2)'};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;color:${i<3?'#D4A017':'#bbb'};font-weight:900;min-width:40px;">${medal}</span>
            <span style="font-size:14px;color:#fff;font-weight:900;flex-grow:1;margin-left:8px;">${name}</span>
            <span style="font-size:20px;font-weight:900;color:#fff;">${score}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;align-items:center;">
            <span style="font-size:11px;font-weight:700;color:#D4A017;margin-right:8px;white-space:nowrap;">${rank}</span>
            <span style="font-size:10px;color:#aaa;flex-grow:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${call}</span>
            <span style="font-size:10px;color:#666;margin-left:8px;">${date}</span>
          </div>
        </div>`;
    }).join('');
  }

  async function loadGlobal() {
    listEl.innerHTML = '<div style="color:#888;margin:40px 0;">' + t('loading') + '</div>';
    const data = await supabaseGet('rankings', 'select=score,rank_title,call_text,created_at,name&order=score.desc&limit=20');
    if (data.length > 0) renderList(data, true);
    else loadLocal();
  }

  function loadLocal() {
    let rankings = [];
    try { rankings = JSON.parse(localStorage.getItem('jiro_rankings') || '[]'); } catch(e) {}
    renderList(rankings, false);
  }

  content.querySelectorAll('.rank-tab').forEach(tab => {
    tab.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      content.querySelectorAll('.rank-tab').forEach(x => x.classList.remove('active-tab'));
      tab.classList.add('active-tab');
      if (tab.dataset.tab === 'global') loadGlobal();
      else loadLocal();
    });
  });

  loadGlobal();

  content.querySelector('#btn-back').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sceneTitle();
  });
}
