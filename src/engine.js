(function () {
  'use strict';

  // ---- Event Bus ----
  const listeners = {};

  function on(event, fn) {
    (listeners[event] ||= []).push(fn);
  }

  function off(event, fn) {
    const list = listeners[event];
    if (!list) return;
    listeners[event] = list.filter(f => f !== fn);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  // ---- State ----
  const state = {
    currentScene: null,
    playerName: '',
    ticket: null,       // chosen menu item
    garlic: {},         // topping choices
    score: 0,
    combo: 0,
  };

  // ---- Scene Registry ----
  const scenes = {};
  const SCENE_ORDER = [
    'title', 'queue_arrival', 'ticket_machine', 'queue_wait',
    'counter_sit', 'garlic_call', 'eating_rhythm', 'exit_scene',
  ];

  function registerScene(name, sceneObj) {
    scenes[name] = sceneObj;
    if (sceneObj.init) sceneObj.init(api);
  }

  // ---- Image Store ----
  const images = {};

  function registerImage(key, img) {
    images[key] = img;
  }

  function getImage(key) {
    return images[key] || null;
  }

  // ---- DOM refs (populated on boot) ----
  let container, fadeOverlay;

  // ---- Scene Transition ----
  let transitioning = false;

  function changeScene(name) {
    if (transitioning) return;
    if (!scenes[name]) {
      console.warn(`Scene "${name}" not registered yet.`);
      return;
    }
    transitioning = true;

    // Fade out
    fadeOverlay.classList.add('active');

    setTimeout(() => {
      // Tear down current
      if (state.currentScene && scenes[state.currentScene]) {
        const prev = scenes[state.currentScene];
        if (prev.exit) prev.exit();
        const prevEl = document.getElementById('scene-' + state.currentScene);
        if (prevEl) prevEl.classList.add('hidden');
      }

      state.currentScene = name;
      const next = scenes[name];

      // Create or show scene element
      let el = document.getElementById('scene-' + name);
      if (!el) {
        el = document.createElement('div');
        el.id = 'scene-' + name;
        el.className = 'scene';
        container.appendChild(el);
      }
      el.classList.remove('hidden');

      if (next.enter) next.enter(el, api);

      emit('sceneChange', { scene: name });

      // Fade in
      setTimeout(() => {
        fadeOverlay.classList.remove('active');
        transitioning = false;
      }, 50);
    }, 400); // match CSS transition duration
  }

  // ---- Message Window ----
  function showMessage(speaker, text, onDone) {
    let win = container.querySelector('.message-window');
    if (!win) {
      win = document.createElement('div');
      win.className = 'message-window';
      win.innerHTML = `
        <div class="message-speaker"></div>
        <div class="message-text"></div>
        <div class="message-next">▼</div>
      `;
      container.appendChild(win);
    }
    win.querySelector('.message-speaker').textContent = speaker || '';
    win.classList.add('visible');

    // Typewriter effect
    const textEl = win.querySelector('.message-text');
    const nextEl = win.querySelector('.message-next');
    textEl.textContent = '';
    nextEl.style.visibility = 'hidden';
    let i = 0;

    function type() {
      if (i < text.length) {
        textEl.textContent += text[i++];
        setTimeout(type, 40);
      } else {
        nextEl.style.visibility = 'visible';
      }
    }
    type();

    function advance() {
      if (i < text.length) {
        // Skip to end
        textEl.textContent = text;
        i = text.length;
        nextEl.style.visibility = 'visible';
        return;
      }
      win.classList.remove('visible');
      win.removeEventListener('click', advance);
      if (onDone) onDone();
    }
    win.addEventListener('click', advance);
  }

  function hideMessage() {
    const win = container.querySelector('.message-window');
    if (win) win.classList.remove('visible');
  }

  // ---- Game Loop ----
  let lastTime = 0;
  let running = false;

  function loop(timestamp) {
    if (!running) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    const scene = scenes[state.currentScene];
    if (scene && scene.update) {
      scene.update(dt);
    }

    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  // ---- Title Scene (built-in) ----
  const titleScene = {
    enter(el) {
      el.innerHTML = `
        <div class="title-logo">ラーメン二郎<br>シミュレーター</div>
        <div class="title-sub">SIMULATOR</div>
        <button class="btn-jiro" id="btn-start">始める</button>
        <div class="title-start-hint">PRESS START</div>
      `;
      document.getElementById('btn-start').addEventListener('click', () => {
        changeScene('queue_arrival');
      });
    },
    update() {},
    exit() {},
  };

  // ---- Next Scene Helper ----
  function nextScene() {
    const idx = SCENE_ORDER.indexOf(state.currentScene);
    if (idx < 0 || idx >= SCENE_ORDER.length - 1) return;
    changeScene(SCENE_ORDER[idx + 1]);
  }

  // ---- Public API ----
  const api = {
    state,
    registerScene,
    changeScene,
    nextScene,
    on,
    off,
    emit,
    registerImage,
    getImage,
    showMessage,
    hideMessage,
    start,
    stop,
    SCENE_ORDER,
  };

  // ---- Boot ----
  function boot() {
    container = document.getElementById('game-container');
    if (!container) {
      console.error('#game-container not found');
      return;
    }

    // Fade overlay
    fadeOverlay = document.createElement('div');
    fadeOverlay.id = 'fade-overlay';
    container.appendChild(fadeOverlay);

    // Register built-in title scene
    registerScene('title', titleScene);

    // Start loop & show title
    start();
    changeScene('title');
  }

  window.GameEngine = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
