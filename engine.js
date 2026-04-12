(function () {
  const scenes = {};
  const listeners = {};
  const images = {};
  let activeScene = null;
  let animFrameId = null;
  let lastTime = 0;

  const engine = {
    currentScene: null,

    state: {
      ticketType: null,
      ticketColor: null,
      toppings: [],
      score: 0,
      totalTime: 0,
      usedOshibori: false,
    },

    // --- Scene management ---

    registerScene(name, scene) {
      scenes[name] = scene;
    },

    changeScene(sceneName) {
      const next = scenes[sceneName];
      if (!next) {
        console.error(`Scene "${sceneName}" not found`);
        return;
      }

      const container = document.getElementById('game-container');

      // Exit current scene
      if (activeScene && activeScene.exit) {
        activeScene.exit();
      }

      // Clear container
      container.innerHTML = '';

      // Transition
      activeScene = next;
      engine.currentScene = sceneName;

      if (activeScene.enter) {
        activeScene.enter(container);
      }

      // Restart game loop if not running
      if (!animFrameId) {
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(loop);
      }
    },

    // --- Events ---

    emit(eventName, data) {
      const cbs = listeners[eventName];
      if (cbs) {
        cbs.forEach(function (cb) { cb(data); });
      }
    },

    on(eventName, callback) {
      if (!listeners[eventName]) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(callback);
    },

    // --- Image registry (used by assets.js) ---

    registerImage(key, img) {
      images[key] = img;
    },

    getImage(key) {
      return images[key] || null;
    },
  };

  // --- Game loop ---

  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    engine.state.totalTime += dt;

    if (activeScene && activeScene.update) {
      activeScene.update(dt);
    }

    animFrameId = requestAnimationFrame(loop);
  }

  window.GameEngine = engine;
})();
