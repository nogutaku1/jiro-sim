(function () {
  var engine = window.GameEngine;

  // ── Helpers ──────────────────────────────────────────────

  function createMessageWindow(container) {
    var win = document.createElement('div');
    win.style.cssText =
      'position:absolute;bottom:0;left:0;width:100%;height:25%;' +
      'background:rgba(0,0,0,0.85);color:#fff;font-size:18px;' +
      'padding:16px 20px;box-sizing:border-box;font-family:monospace;' +
      'border-top:3px solid #e8e800;overflow:hidden;z-index:10;';
    container.appendChild(win);
    return win;
  }

  var typewriterTimer = null;

  function typeText(el, text, speed, callback) {
    clearInterval(typewriterTimer);
    el.textContent = '';
    var i = 0;
    typewriterTimer = setInterval(function () {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
      } else {
        clearInterval(typewriterTimer);
        if (callback) callback();
      }
    }, speed || 50);
  }

  function clearTimers(timers) {
    timers.forEach(function (id) {
      clearTimeout(id);
      clearInterval(id);
    });
    timers.length = 0;
  }

  function setBackground(container, imageKey) {
    var img = engine.getImage(imageKey);
    if (img) {
      container.style.backgroundImage = 'url(' + img.src + ')';
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    } else {
      container.style.background = '#222';
    }
  }

  function createButton(label, onClick) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'display:block;margin:8px auto;padding:12px 32px;font-size:18px;' +
      'font-family:monospace;font-weight:bold;border:none;border-radius:6px;' +
      'background:#e8e800;color:#000;cursor:pointer;min-width:200px;';
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ═══════════════════════════════════════════════════════════
  // Scene 1: queue_arrival（店頭到着）
  // ═══════════════════════════════════════════════════════════

  var queueArrival = {
    timers: [],

    enter: function (container) {
      var self = this;
      self.timers = [];

      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      setBackground(container, 'storefront');

      var msgWin = createMessageWindow(container);
      var queueCount = Math.floor(Math.random() * 8) + 8; // 8〜15

      typeText(msgWin, '前に' + queueCount + '人並んでいます…', 50, function () {
        var tid = setTimeout(function () {
          typeText(msgWin, '列の最後尾に並びますか？', 50, function () {
            var btnArea = document.createElement('div');
            btnArea.style.cssText =
              'position:absolute;bottom:28%;left:0;width:100%;text-align:center;z-index:20;';
            btnArea.appendChild(createButton('並ぶ', function () {
              engine.changeScene('ticket_machine');
            }));
            container.appendChild(btnArea);
          });
        }, 2000);
        self.timers.push(tid);
      });
    },

    exit: function () {
      clearTimers(this.timers);
      clearInterval(typewriterTimer);
    },
  };

  // ═══════════════════════════════════════════════════════════
  // Scene 2: ticket_machine（食券購入）
  // ═══════════════════════════════════════════════════════════

  var ticketMachine = {
    timers: [],

    enter: function (container) {
      var self = this;
      self.timers = [];

      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      setBackground(container, 'ticket_machine');

      var msgWin = createMessageWindow(container);
      typeText(msgWin, 'メニューを選んでください。', 50);

      var menu = [
        { label: 'ラーメン（¥700）',     type: 'ramen', color: 'red',    price: 700  },
        { label: 'ぶたラーメン（¥850）', type: 'buta',  color: 'blue',   price: 850  },
        { label: 'ぶたダブル（¥950）',   type: 'dai',   color: 'yellow', price: 950  },
      ];

      var btnArea = document.createElement('div');
      btnArea.style.cssText =
        'position:absolute;top:30%;left:0;width:100%;text-align:center;z-index:20;';

      menu.forEach(function (item) {
        var btn = createButton(item.label, function () {
          // Disable all buttons
          btnArea.querySelectorAll('button').forEach(function (b) {
            b.disabled = true;
            b.style.opacity = '0.4';
          });

          engine.state.ticketType = item.type;
          engine.state.ticketColor = item.color;

          typeText(msgWin, '食券を手に取った！', 50);

          // Show ticket visual
          var ticket = document.createElement('div');
          var bgColor = item.color === 'red' ? '#d32f2f'
                      : item.color === 'blue' ? '#1565c0'
                      : '#f9a825';
          var textColor = item.color === 'yellow' ? '#000' : '#fff';
          ticket.style.cssText =
            'position:absolute;top:10%;left:50%;transform:translateX(-50%);' +
            'width:180px;height:90px;border-radius:8px;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-size:16px;font-weight:bold;font-family:monospace;' +
            'box-shadow:2px 4px 12px rgba(0,0,0,0.5);z-index:25;' +
            'background:' + bgColor + ';color:' + textColor + ';';
          ticket.textContent = item.label.split('（')[0];
          container.appendChild(ticket);

          var tid = setTimeout(function () {
            engine.changeScene('queue_wait');
          }, 1500);
          self.timers.push(tid);
        });
        btnArea.appendChild(btn);
      });

      container.appendChild(btnArea);
    },

    exit: function () {
      clearTimers(this.timers);
      clearInterval(typewriterTimer);
    },
  };

  // ═══════════════════════════════════════════════════════════
  // Scene 3: queue_wait（行列待ち）
  // ═══════════════════════════════════════════════════════════

  var queueWait = {
    timers: [],
    elapsed: 0,
    counterEl: null,
    running: false,

    enter: function (container) {
      var self = this;
      self.timers = [];
      self.elapsed = 0;
      self.running = true;

      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      setBackground(container, 'queue_line');

      // Wait-time counter
      var counter = document.createElement('div');
      counter.style.cssText =
        'position:absolute;top:8px;right:12px;color:#fff;font-size:14px;' +
        'font-family:monospace;background:rgba(0,0,0,0.6);padding:4px 10px;' +
        'border-radius:4px;z-index:15;';
      counter.textContent = '待ち時間: 0:00';
      container.appendChild(counter);
      self.counterEl = counter;

      // Ticket icon (for tap event later)
      var ticketIcon = document.createElement('div');
      var bgColor = engine.state.ticketColor === 'red' ? '#d32f2f'
                  : engine.state.ticketColor === 'blue' ? '#1565c0'
                  : '#f9a825';
      var textColor = engine.state.ticketColor === 'yellow' ? '#000' : '#fff';
      var ticketLabel = engine.state.ticketType === 'ramen' ? 'ラーメン'
                      : engine.state.ticketType === 'buta' ? 'ぶたラーメン'
                      : 'ぶたダブル';
      ticketIcon.style.cssText =
        'position:absolute;top:8px;left:12px;width:100px;height:50px;' +
        'border-radius:6px;display:flex;align-items:center;justify-content:center;' +
        'font-size:12px;font-weight:bold;font-family:monospace;cursor:pointer;' +
        'box-shadow:1px 2px 6px rgba(0,0,0,0.4);z-index:25;' +
        'background:' + bgColor + ';color:' + textColor + ';';
      ticketIcon.textContent = ticketLabel;
      ticketIcon.id = 'ticket-icon';
      container.appendChild(ticketIcon);

      var msgWin = createMessageWindow(container);

      // Random idle chatter
      var idleTexts = [
        'ソワソワ…',
        'お腹すいた…',
        '今日はニンニク入れようかな…',
        'あの人ロット早いな…',
        '匂いがすごい…',
        'まだかな…',
        '野菜マシにしようかな…',
        'アブラ多めで…',
        '次のロット入れるかな…',
      ];
      var idleIndex = 0;

      function showIdleText() {
        if (!self.running) return;
        var text = idleTexts[Math.floor(Math.random() * idleTexts.length)];
        typeText(msgWin, text, 60);
        var delay = 3000 + Math.random() * 4000;
        var tid = setTimeout(showIdleText, delay);
        self.timers.push(tid);
      }
      var idleStart = setTimeout(function () { showIdleText(); }, 1000);
      self.timers.push(idleStart);

      // ── Ticket check event (5〜15 seconds) ──
      var ticketCheckDelay = (5 + Math.random() * 10) * 1000;
      var ticketCheckTimer = setTimeout(function () {
        if (!self.running) return;

        // Stop idle chatter
        clearTimers(self.timers);
        self.timers = [];

        typeText(msgWin, '「食券見せてください」', 40);

        // Highlight ticket icon
        ticketIcon.style.animation = 'none';
        ticketIcon.style.border = '3px solid #fff';
        ticketIcon.style.boxShadow = '0 0 16px #e8e800';

        var ticketTapped = false;

        var tapHandler = function () {
          ticketTapped = true;
          ticketIcon.removeEventListener('click', tapHandler);
          ticketIcon.style.border = 'none';
          ticketIcon.style.boxShadow = '1px 2px 6px rgba(0,0,0,0.4)';

          typeText(msgWin, '（うなずく店員）', 50, function () {
            // Wait 10〜20 more seconds then enter shop
            var enterDelay = (10 + Math.random() * 10) * 1000;
            var enterTimer = setTimeout(function () {
              if (!self.running) return;
              var position = Math.floor(Math.random() * 5) + 1;
              typeText(msgWin, '「はい' + position + '番目のお客さん！中へどうぞ！」', 40, function () {
                var goTimer = setTimeout(function () {
                  engine.changeScene('counter_sit');
                }, 1500);
                self.timers.push(goTimer);
              });
            }, enterDelay);
            self.timers.push(enterTimer);

            // Resume idle chatter while waiting
            var idleResume = setTimeout(function () { showIdleText(); }, 3000);
            self.timers.push(idleResume);
          });
        };

        ticketIcon.addEventListener('click', tapHandler);

        // 3 second deadline
        var deadlineTimer = setTimeout(function () {
          if (ticketTapped) return;
          ticketIcon.removeEventListener('click', tapHandler);
          self.running = false;
          clearTimers(self.timers);

          typeText(msgWin, '「もたもたしてんじゃねぇ！帰れ！」', 30, function () {
            var goBack = setTimeout(function () {
              engine.changeScene('title');
            }, 2500);
            // no need to track — scene exits
          });
        }, 3000);
        self.timers.push(deadlineTimer);
      }, ticketCheckDelay);
      self.timers.push(ticketCheckTimer);
    },

    update: function (dt) {
      if (!this.running) return;
      this.elapsed += dt;
      if (this.counterEl) {
        var m = Math.floor(this.elapsed / 60);
        var s = Math.floor(this.elapsed % 60);
        this.counterEl.textContent = '待ち時間: ' + m + ':' + (s < 10 ? '0' : '') + s;
      }
    },

    exit: function () {
      this.running = false;
      clearTimers(this.timers);
      clearInterval(typewriterTimer);
    },
  };

  // ── Register scenes ──────────────────────────────────────

  engine.registerScene('queue_arrival', queueArrival);
  engine.registerScene('ticket_machine', ticketMachine);
  engine.registerScene('queue_wait', queueWait);
})();
