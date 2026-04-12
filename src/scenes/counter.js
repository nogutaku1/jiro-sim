(function () {
  var engine = window.GameEngine;

  // ============================================================
  // Helper: create a DOM element with styles
  // ============================================================
  function el(tag, styles, text) {
    var e = document.createElement(tag);
    if (styles) Object.assign(e.style, styles);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // ============================================================
  // Scene 1: counter_sit  — 着席
  // ============================================================
  var counterSit = (function () {
    var timers = [];
    var elapsed = 0;
    var waitDuration = 0; // 8-15 s
    var msgIndex = 0;
    var nextMsgAt = 0;
    var messageEl = null;
    var done = false;

    var waitMessages = [
      '隣の人がすごい勢いで食べている…',
      '店員さんが麺を茹でている…',
      'ニンニクの匂いが充満している…',
      'コップの水を飲む…',
      '（ゴクリ…）',
    ];

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    return {
      enter: function (container) {
        elapsed = 0;
        done = false;
        waitDuration = 8 + Math.random() * 7; // 8-15 s
        msgIndex = 0;
        nextMsgAt = 2; // first ambient message at 2s
        timers = [];

        // -- Background
        var bg = el('div', {
          position: 'absolute', top: '0', left: '0',
          width: '100%', height: '100%',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundColor: '#1a1209',
        });
        var bgImg = engine.getImage('counter_seat');
        if (bgImg) bg.style.backgroundImage = 'url(' + bgImg.src + ')';
        container.appendChild(bg);

        // -- Overlay for darkness / mood
        var overlay = el('div', {
          position: 'absolute', top: '0', left: '0',
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.35)',
        });
        container.appendChild(overlay);

        // -- Slide-in panel (simulates sitting down)
        var panel = el('div', {
          position: 'absolute', left: '0',
          width: '100%', height: '100%',
          transform: 'translateY(-100%)',
          transition: 'transform 0.8s ease-out',
        });
        container.appendChild(panel);

        // Trigger slide-in
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            panel.style.transform = 'translateY(0)';
          });
        });

        // -- First message
        messageEl = el('div', {
          position: 'absolute', bottom: '60px', left: '0',
          width: '100%', textAlign: 'center',
          color: '#fff', fontSize: '22px',
          fontWeight: 'bold',
          textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
          transition: 'opacity 0.5s',
          opacity: '0',
        }, 'カウンターに座った。水を飲む。');
        container.appendChild(messageEl);

        // Fade in first message after slide
        timers.push(setTimeout(function () {
          messageEl.style.opacity = '1';
        }, 900));

        // Shuffle waiting messages
        waitMessages = shuffle(waitMessages);
      },

      update: function (dt) {
        if (done) return;
        elapsed += dt;

        // Show ambient messages
        if (elapsed >= nextMsgAt && msgIndex < waitMessages.length && elapsed < waitDuration) {
          messageEl.style.opacity = '0';
          var idx = msgIndex;
          msgIndex++;
          nextMsgAt = elapsed + 2 + Math.random() * 1.5;
          timers.push(setTimeout(function () {
            messageEl.textContent = waitMessages[idx];
            messageEl.style.opacity = '1';
          }, 500));
        }

        // Transition to garlic_call
        if (elapsed >= waitDuration) {
          done = true;
          messageEl.style.opacity = '0';
          timers.push(setTimeout(function () {
            engine.changeScene('garlic_call');
          }, 600));
        }
      },

      exit: function () {
        timers.forEach(clearTimeout);
        timers = [];
      },
    };
  })();

  // ============================================================
  // Scene 2: garlic_call  — ニンニクコール
  // ============================================================
  var garlicCall = (function () {
    var timers = [];
    var countdown = 5;
    var timerRunning = false;
    var timerEl = null;
    var container = null;
    var callDone = false;

    // Topping definitions
    var toppingDefs = [
      { key: 'garlic',  label: 'ニンニク', options: ['なし', '少し', 'マシ', 'マシマシ'] },
      { key: 'yasai',   label: 'ヤサイ',   options: ['なし', 'マシ', 'マシマシ'] },
      { key: 'abura',   label: 'アブラ',   options: ['なし', 'マシ', 'マシマシ'] },
      { key: 'karame',  label: 'カラメ',   options: ['なし', 'マシ', 'マシマシ'] },
    ];

    var selections = {}; // key -> selected option string
    var optionButtons = {}; // key -> [ button elements ]

    function resetSelections() {
      selections = {};
      toppingDefs.forEach(function (t) { selections[t.key] = 'なし'; });
    }

    function buildCallText() {
      var parts = [];
      toppingDefs.forEach(function (t) {
        var val = selections[t.key];
        if (val !== 'なし') {
          parts.push(t.label + val);
        }
      });
      if (parts.length === 0) return 'そのままで！';
      return parts.join('、') + 'で！！';
    }

    function saveToppings() {
      engine.state.toppings = {};
      toppingDefs.forEach(function (t) {
        engine.state.toppings[t.key] = selections[t.key];
      });
    }

    function doCall(cont) {
      if (callDone) return;
      callDone = true;
      timerRunning = false;
      saveToppings();

      // -- Call display
      var callText = buildCallText();

      // Clear container
      cont.innerHTML = '';

      // Dark bg
      var bg = el('div', {
        position: 'absolute', top: '0', left: '0',
        width: '100%', height: '100%',
        backgroundColor: '#1a1209',
      });
      cont.appendChild(bg);

      // Player call
      var playerCall = el('div', {
        position: 'absolute', top: '30%', left: '0',
        width: '100%', textAlign: 'center',
        color: '#ffe135', fontSize: '32px', fontWeight: 'bold',
        textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
        opacity: '0', transition: 'opacity 0.4s',
      }, callText);
      cont.appendChild(playerCall);

      timers.push(setTimeout(function () {
        playerCall.style.opacity = '1';
      }, 100));

      // Staff response
      var staffReply = el('div', {
        position: 'absolute', top: '55%', left: '0',
        width: '100%', textAlign: 'center',
        color: '#fff', fontSize: '40px', fontWeight: 'bold',
        textShadow: '3px 3px 10px rgba(255,50,0,0.6)',
        opacity: '0', transition: 'opacity 0.4s',
      }, 'あいよ！！');
      cont.appendChild(staffReply);

      timers.push(setTimeout(function () {
        staffReply.style.opacity = '1';
      }, 800));

      // Transition after 2s
      timers.push(setTimeout(function () {
        engine.changeScene('eating_rhythm');
      }, 2000));
    }

    return {
      enter: function (cont) {
        container = cont;
        callDone = false;
        countdown = 5;
        timerRunning = false;
        timers = [];
        optionButtons = {};
        resetSelections();

        // -- Dark background
        var bg = el('div', {
          position: 'absolute', top: '0', left: '0',
          width: '100%', height: '100%',
          backgroundColor: '#1a1209',
        });
        cont.appendChild(bg);

        // -- Staff face image (upper area, large)
        var staffImg = engine.getImage('staff_face');
        var face = el('div', {
          position: 'absolute', top: '0', left: '50%',
          transform: 'translateX(-50%)',
          width: '220px', height: '220px',
          backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundColor: 'transparent',
        });
        if (staffImg) face.style.backgroundImage = 'url(' + staffImg.src + ')';
        cont.appendChild(face);

        // -- 「ニンニク入れますか？」text with dramatic animation
        var question = el('div', {
          position: 'absolute', top: '220px', left: '0',
          width: '100%', textAlign: 'center',
          color: '#ffe135', fontWeight: 'bold',
          textShadow: '3px 3px 10px rgba(255,0,0,0.7)',
          fontSize: '60px',
          transition: 'font-size 0.6s ease-out',
          opacity: '0',
        }, 'ニンニク入れますか？');
        cont.appendChild(question);

        // Screen shake + text animation
        timers.push(setTimeout(function () {
          question.style.opacity = '1';
          // Shake
          cont.style.animation = 'jiro-shake 0.3s ease-in-out 2';
          timers.push(setTimeout(function () {
            question.style.fontSize = '28px';
            cont.style.animation = '';
          }, 700));
        }, 300));

        // -- Inject shake keyframes if not present
        if (!document.getElementById('jiro-shake-style')) {
          var style = document.createElement('style');
          style.id = 'jiro-shake-style';
          style.textContent =
            '@keyframes jiro-shake {' +
            '  0%, 100% { transform: translateX(0); }' +
            '  25% { transform: translateX(-6px) translateY(2px); }' +
            '  50% { transform: translateX(4px) translateY(-2px); }' +
            '  75% { transform: translateX(-3px) translateY(1px); }' +
            '}' +
            '@keyframes jiro-blink {' +
            '  0%, 100% { opacity: 1; }' +
            '  50% { opacity: 0.3; }' +
            '}';
          document.head.appendChild(style);
        }

        // -- Timer display (top-right)
        timerEl = el('div', {
          position: 'absolute', top: '16px', right: '16px',
          fontSize: '48px', fontWeight: 'bold',
          color: '#fff',
          textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
          fontFamily: 'monospace',
          minWidth: '60px', textAlign: 'center',
        }, '5');
        cont.appendChild(timerEl);

        // -- Topping grid
        var grid = el('div', {
          position: 'absolute', top: '290px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'grid',
          gridTemplateColumns: 'auto',
          gap: '8px',
          width: '90%', maxWidth: '500px',
        });
        cont.appendChild(grid);

        toppingDefs.forEach(function (topping) {
          var row = el('div', {
            display: 'flex', alignItems: 'center', gap: '6px',
            flexWrap: 'wrap',
          });

          // Label
          var lbl = el('div', {
            color: '#fff', fontSize: '16px', fontWeight: 'bold',
            minWidth: '80px', textAlign: 'right',
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
          }, topping.label);
          row.appendChild(lbl);

          optionButtons[topping.key] = [];

          topping.options.forEach(function (opt) {
            var btn = el('button', {
              padding: '8px 12px',
              fontSize: '14px', fontWeight: 'bold',
              border: '2px solid #555',
              borderRadius: '6px',
              backgroundColor: opt === 'なし' ? '#ffe135' : '#333',
              color: opt === 'なし' ? '#000' : '#fff',
              cursor: 'pointer',
              transition: 'background-color 0.15s, transform 0.1s',
              flex: '1',
              minWidth: '60px',
              textAlign: 'center',
            }, opt);

            btn.addEventListener('click', function () {
              if (callDone) return;
              selections[topping.key] = opt;
              // Update highlights
              optionButtons[topping.key].forEach(function (b, i) {
                var isSelected = topping.options[i] === opt;
                b.style.backgroundColor = isSelected ? '#ffe135' : '#333';
                b.style.color = isSelected ? '#000' : '#fff';
                b.style.borderColor = isSelected ? '#ffe135' : '#555';
              });
            });

            optionButtons[topping.key].push(btn);
            row.appendChild(btn);
          });

          grid.appendChild(row);
        });

        // -- 「コールする！」button
        var callBtn = el('button', {
          position: 'absolute', bottom: '30px', left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 48px',
          fontSize: '22px', fontWeight: 'bold',
          backgroundColor: '#d4190c',
          color: '#fff',
          border: '3px solid #ff4136',
          borderRadius: '10px',
          cursor: 'pointer',
          textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
          boxShadow: '0 4px 12px rgba(212,25,12,0.5)',
          transition: 'transform 0.1s',
        }, 'コールする！');

        callBtn.addEventListener('mousedown', function () {
          callBtn.style.transform = 'translateX(-50%) scale(0.95)';
        });
        callBtn.addEventListener('mouseup', function () {
          callBtn.style.transform = 'translateX(-50%) scale(1)';
        });
        callBtn.addEventListener('click', function () {
          doCall(cont);
        });
        cont.appendChild(callBtn);

        // Start countdown after dramatic entrance (1.2s delay)
        timers.push(setTimeout(function () {
          timerRunning = true;
        }, 1200));
      },

      update: function (dt) {
        if (!timerRunning || callDone) return;

        countdown -= dt;
        if (countdown < 0) countdown = 0;

        // Update timer display
        if (timerEl) {
          timerEl.textContent = Math.ceil(countdown);

          // Red blinking when <= 2s
          if (countdown <= 2) {
            timerEl.style.color = '#ff2200';
            timerEl.style.animation = 'jiro-blink 0.4s infinite';
          }
        }

        // Time's up → auto-call with defaults
        if (countdown <= 0) {
          timerRunning = false;
          resetSelections();
          doCall(container);
        }
      },

      exit: function () {
        timers.forEach(clearTimeout);
        timers = [];
        timerRunning = false;
      },
    };
  })();

  // ============================================================
  // Register scenes
  // ============================================================
  engine.registerScene('counter_sit', counterSit);
  engine.registerScene('garlic_call', garlicCall);
})();
