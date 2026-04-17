// ===== SCENE MANAGER =====
import { clearAllTimers } from './state.js';

const game = document.getElementById('game');

export function showScene(id) {
  clearAllTimers();
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  let scene = document.getElementById(id);
  if (!scene) {
    scene = document.createElement('div');
    scene.id = id;
    scene.className = 'scene';
    game.appendChild(scene);
  }
  requestAnimationFrame(() => { scene.classList.add('active'); });
  return scene;
}

export function shakeScreen() {
  game.style.animation = 'shake 0.5s ease';
  setTimeout(() => { game.style.animation = ''; }, 500);
}

export function flashScreen(color, duration = 300) {
  const flash = document.createElement('div');
  flash.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:${color};opacity:0.3;z-index:50;pointer-events:none;transition:opacity ${duration}ms;`;
  game.appendChild(flash);
  requestAnimationFrame(() => { flash.style.opacity = '0'; });
  setTimeout(() => { flash.remove(); }, duration + 20);
}

export { game };
