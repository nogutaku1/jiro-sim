/**
 * rhythm.js — リズムゲームエンジン
 * ノーツ生成・落下・判定・スコア・コンボ・ライフ管理
 */
(function () {
  'use strict';

  // ノーツ種別定義
  const NOTE_TYPES = {
    noodle:  { emoji: '🍜', label: '麺',     score: 1.0, bad: false },
    yasai:   { emoji: '🥬', label: 'ヤサイ',  score: 1.0, bad: false },
    ninniku: { emoji: '🧄', label: 'ニンニク', score: 1.5, bad: false },
    muse:    { emoji: '💀', label: 'むせ',     score: 0,   bad: true  },
  };

  // 判定ウィンドウ (ms)
  const JUDGE = {
    PERFECT: 50,
    GREAT:   100,
    GOOD:    200,
  };

  // 判定表示テキスト
  const JUDGE_TEXT = {
    PERFECT: 'ズルズル！！',
    GREAT:   'ズルッ',
    GOOD:    'もぐ…',
    MISS:    '箸が止まる…',
    MUSE:    'ゴホッ！！',
  };

  // 判定スコア
  const JUDGE_SCORE = {
    PERFECT: 100,
    GREAT:   70,
    GOOD:    30,
    MISS:    0,
    MUSE:    -50,
  };

  // コンボ応援テキスト
  const COMBO_CHEERS = [
    { at: 10, text: '食べるのが速い！' },
    { at: 20, text: 'もう半分！' },
    { at: 30, text: 'ロット乱しなし！' },
    { at: 40, text: '店主が頷いている…' },
    { at: 50, text: '二郎の申し子！' },
  ];

  // 背景切り替えタイミング (経過割合)
  const BG_STAGES = [
    { at: 0.00, image: 'ramen_arrival'  },
    { at: 0.25, image: 'ramen_eating_1' },
    { at: 0.55, image: 'ramen_eating_2' },
    { at: 0.85, image: 'ramen_empty'    },
  ];

  /**
   * RhythmEngine
   * @param {object} opts
   * @param {HTMLElement} opts.container - 描画先コンテナ
   * @param {number}      opts.duration  - ゲーム秒数 (default 30)
   * @param {function}    opts.onEnd     - 終了コールバック({ score, combo, life, cleared })
   */
  function RhythmEngine(opts) {
    this.container = opts.container;
    this.duration  = opts.duration || 30;
    this.onEnd     = opts.onEnd || function () {};

    // 状態
    this.score     = 0;
    this.combo     = 0;
    this.maxCombo  = 0;
    this.life      = 5;
    this.missCount = 0;
    this.elapsed   = 0;
    this.running   = false;
    this.finished  = false;

    // ノーツ管理
    this.notes          = [];   // { id, type, lane, spawnTime, el, hit }
    this.noteIdCounter  = 0;
    this.nextSpawnTime  = 0;

    // DOM 参照
    this.fieldEl    = null;
    this.judgeLineY = 0;
    this.uiEls      = {};

    this._boundClick = this._onClick.bind(this);
  }

  RhythmEngine.prototype.start = function () {
    this._buildDOM();
    this.running = true;
    this.elapsed = 0;
    this.nextSpawnTime = 0.5; // 最初のノーツまでの待ち
    this._updateLifeUI();
    this._updateScoreUI();
    this._updateProgressUI();
    this._updateBg();
  };

  RhythmEngine.prototype.update = function (dt) {
    if (!this.running || this.finished) return;

    this.elapsed += dt;

    // 時間切れ
    if (this.elapsed >= this.duration) {
      this._finish(true);
      return;
    }

    // ノーツ生成
    if (this.elapsed >= this.nextSpawnTime) {
      this._spawnNote();
      // 速度上昇: スポーン間隔を徐々に短く
      var progress = this.elapsed / this.duration;
      var interval = 0.8 - progress * 0.45; // 0.8s → 0.35s
      // ランダムゆらぎ
      interval += (Math.random() - 0.5) * 0.2;
      if (interval < 0.25) interval = 0.25;
      this.nextSpawnTime = this.elapsed + interval;
    }

    // ノーツ判定(MISS検出): ジャッジライン通過後200ms以上
    var fieldH = this.fieldEl.clientHeight;
    for (var i = this.notes.length - 1; i >= 0; i--) {
      var n = this.notes[i];
      if (n.hit) continue;

      var noteAge = this.elapsed - n.spawnTime;
      var fallDur = n.fallDuration;
      var ratio   = noteAge / fallDur;

      if (ratio > 1.0 + (JUDGE.GOOD / 1000) / fallDur) {
        // 通過 — badノーツはスルーで正解
        if (!n.type.bad) {
          this._judgeResult('MISS', n);
        }
        n.hit = true;
        this._removeNoteEl(n);
        this.notes.splice(i, 1);
      }
    }

    this._updateProgressUI();
    this._updateBg();
  };

  RhythmEngine.prototype.destroy = function () {
    this.running = false;
    this.finished = true;
    if (this.fieldEl) {
      this.fieldEl.removeEventListener('click', this._boundClick);
      this.fieldEl.removeEventListener('touchstart', this._boundClick);
    }
  };

  // --- DOM構築 ---

  RhythmEngine.prototype._buildDOM = function () {
    var c = this.container;

    // 背景
    this.bgEl = document.createElement('div');
    this.bgEl.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;transition:background-image 0.5s;';
    c.appendChild(this.bgEl);

    // 半透明オーバーレイ (ノーツ視認用)
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.45);z-index:1;';
    c.appendChild(overlay);

    // フィールド
    this.fieldEl = document.createElement('div');
    this.fieldEl.style.cssText = 'position:absolute;inset:0;z-index:2;overflow:hidden;';
    c.appendChild(this.fieldEl);

    // ジャッジメントライン
    this.judgeLineY = 600; // コンテナ高700のうち下から100px
    var line = document.createElement('div');
    line.style.cssText =
      'position:absolute;left:0;right:0;height:4px;z-index:3;' +
      'top:' + this.judgeLineY + 'px;' +
      'background:linear-gradient(90deg,transparent,#f5d623,#ff6644,#f5d623,transparent);' +
      'box-shadow:0 0 12px rgba(245,214,35,0.6);';
    this.fieldEl.appendChild(line);

    // レーンガイド (薄い縦線)
    for (var lane = 0; lane < 4; lane++) {
      var g = document.createElement('div');
      g.style.cssText =
        'position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.06);z-index:1;' +
        'left:' + (lane * 100 + 50) + 'px;';
      this.fieldEl.appendChild(g);
    }

    // UI上部: スコア・コンボ
    var hud = document.createElement('div');
    hud.style.cssText =
      'position:absolute;top:0;left:0;right:0;z-index:10;padding:8px 12px;' +
      'display:flex;justify-content:space-between;align-items:flex-start;color:#fff;font-size:13px;';
    c.appendChild(hud);

    // スコア
    this.uiEls.score = document.createElement('div');
    this.uiEls.score.textContent = '0点';
    hud.appendChild(this.uiEls.score);

    // コンボ
    this.uiEls.combo = document.createElement('div');
    this.uiEls.combo.style.cssText = 'text-align:right;';
    this.uiEls.combo.textContent = '';
    hud.appendChild(this.uiEls.combo);

    // ライフ
    this.uiEls.life = document.createElement('div');
    this.uiEls.life.style.cssText =
      'position:absolute;top:28px;left:12px;z-index:10;font-size:16px;';
    c.appendChild(this.uiEls.life);

    // 進行バー
    var barWrap = document.createElement('div');
    barWrap.style.cssText =
      'position:absolute;bottom:0;left:0;right:0;height:6px;z-index:10;background:rgba(0,0,0,0.5);';
    c.appendChild(barWrap);
    this.uiEls.progressBar = document.createElement('div');
    this.uiEls.progressBar.style.cssText =
      'height:100%;width:0%;background:#f5d623;transition:width 0.3s;';
    barWrap.appendChild(this.uiEls.progressBar);

    // 判定テキスト (中央に大きく一瞬表示)
    this.uiEls.judgeText = document.createElement('div');
    this.uiEls.judgeText.style.cssText =
      'position:absolute;left:0;right:0;top:' + (this.judgeLineY - 60) + 'px;' +
      'z-index:20;text-align:center;font-size:28px;color:#f5d623;' +
      'pointer-events:none;opacity:0;transition:opacity 0.15s;text-shadow:0 0 8px rgba(0,0,0,0.8);';
    c.appendChild(this.uiEls.judgeText);

    // コンボ応援テキスト
    this.uiEls.cheerText = document.createElement('div');
    this.uiEls.cheerText.style.cssText =
      'position:absolute;left:0;right:0;top:50%;z-index:20;text-align:center;' +
      'font-size:22px;color:#ff6644;pointer-events:none;opacity:0;transition:opacity 0.3s;' +
      'text-shadow:0 0 10px rgba(0,0,0,0.9);transform:translateY(-50%);';
    c.appendChild(this.uiEls.cheerText);

    // クリック/タッチ
    this.fieldEl.addEventListener('click', this._boundClick);
    this.fieldEl.addEventListener('touchstart', this._boundClick);
  };

  // --- ノーツ生成 ---

  RhythmEngine.prototype._spawnNote = function () {
    // 種別選択 (重み付き)
    var roll = Math.random();
    var typeKey;
    if (roll < 0.45)      typeKey = 'noodle';
    else if (roll < 0.70) typeKey = 'yasai';
    else if (roll < 0.88) typeKey = 'ninniku';
    else                   typeKey = 'muse';

    var type = NOTE_TYPES[typeKey];
    var lane = Math.floor(Math.random() * 4); // 4レーン

    // 落下時間: 進行に応じて速く (2.0s → 1.2s)
    var progress = this.elapsed / this.duration;
    var fallDur  = 2.0 - progress * 0.8;
    if (fallDur < 1.2) fallDur = 1.2;

    var id = ++this.noteIdCounter;

    // DOM
    var el = document.createElement('div');
    el.dataset.noteId = id;
    el.style.cssText =
      'position:absolute;width:60px;height:60px;font-size:36px;' +
      'display:flex;align-items:center;justify-content:center;' +
      'left:' + (lane * 100 + 20) + 'px;top:-60px;' +
      'pointer-events:auto;user-select:none;cursor:pointer;z-index:5;' +
      'filter:drop-shadow(0 0 6px rgba(0,0,0,0.7));' +
      'animation:note-fall-' + id + ' ' + fallDur + 's linear forwards;';

    el.textContent = type.emoji;

    // bad ノーツに赤い輪
    if (type.bad) {
      el.style.background = 'radial-gradient(circle, rgba(255,0,0,0.25) 0%, transparent 70%)';
      el.style.borderRadius = '50%';
    }

    // キーフレーム動的生成
    var endY = this.judgeLineY + 200; // 画面外まで落とす
    var style = document.createElement('style');
    style.textContent =
      '@keyframes note-fall-' + id + ' {' +
      '  0%   { top: -60px; }' +
      '  100% { top: ' + endY + 'px; }' +
      '}';
    document.head.appendChild(style);

    this.fieldEl.appendChild(el);

    var note = {
      id: id,
      type: type,
      typeKey: typeKey,
      lane: lane,
      spawnTime: this.elapsed,
      fallDuration: fallDur,
      el: el,
      styleEl: style,
      hit: false,
    };
    this.notes.push(note);
  };

  // --- クリック/タッチ ---

  RhythmEngine.prototype._onClick = function (e) {
    if (!this.running || this.finished) return;
    e.preventDefault();

    // クリック位置
    var rect = this.fieldEl.getBoundingClientRect();
    var clickY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    var clickX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;

    // ジャッジライン付近のみ受け付け (±120px)
    if (Math.abs(clickY - this.judgeLineY) > 120) return;

    // クリック位置に最も近いノーツを探す
    var bestNote = null;
    var bestDist = Infinity;

    for (var i = 0; i < this.notes.length; i++) {
      var n = this.notes[i];
      if (n.hit) continue;

      // 現在のノーツ位置(Y)を計算
      var age   = this.elapsed - n.spawnTime;
      var ratio = age / n.fallDuration;
      var noteY = -60 + (this.judgeLineY + 260) * ratio;
      var noteX = n.lane * 100 + 50;

      // ジャッジライン付近か
      var distY = Math.abs(noteY - this.judgeLineY);
      var distX = Math.abs(clickX - noteX);

      if (distY < 120 && distX < 80) {
        var dist = distY + distX * 0.3;
        if (dist < bestDist) {
          bestDist = dist;
          bestNote = n;
        }
      }
    }

    if (!bestNote) return;

    // bad ノーツ
    if (bestNote.type.bad) {
      this._judgeResult('MUSE', bestNote);
      bestNote.hit = true;
      this._removeNoteEl(bestNote);
      this._removeFromArray(bestNote);
      return;
    }

    // タイミング判定
    var age = this.elapsed - bestNote.spawnTime;
    var ratio = age / bestNote.fallDuration;
    // ジャッジライン到達は ratio ≈ judgeLineY / (judgeLineY + 260)
    var perfectRatio = this.judgeLineY / (this.judgeLineY + 260);
    var diffMs = Math.abs(ratio - perfectRatio) * bestNote.fallDuration * 1000;

    var judge;
    if (diffMs <= JUDGE.PERFECT)     judge = 'PERFECT';
    else if (diffMs <= JUDGE.GREAT)  judge = 'GREAT';
    else if (diffMs <= JUDGE.GOOD)   judge = 'GOOD';
    else                              judge = 'MISS';

    this._judgeResult(judge, bestNote);
    bestNote.hit = true;
    this._removeNoteEl(bestNote);
    this._removeFromArray(bestNote);
  };

  // --- 判定結果処理 ---

  RhythmEngine.prototype._judgeResult = function (judge, note) {
    var baseScore = JUDGE_SCORE[judge];

    // ニンニクは高得点(1.5倍)
    if (note && note.type && judge !== 'MISS' && judge !== 'MUSE') {
      baseScore = Math.round(baseScore * note.type.score);
    }

    this.score += baseScore;
    if (this.score < 0) this.score = 0;

    // コンボ
    if (judge === 'MISS' || judge === 'MUSE') {
      this.combo = 0;
      if (judge === 'MISS') {
        this.missCount++;
        if (this.missCount >= 3) {
          this.missCount = 0;
          this.life--;
          this._updateLifeUI();
          if (this.life <= 0) {
            this._finish(false);
            return;
          }
        }
      }
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this._checkComboCheer();
    }

    this._showJudgeText(JUDGE_TEXT[judge], judge);
    this._updateScoreUI();
  };

  // --- UI更新 ---

  RhythmEngine.prototype._showJudgeText = function (text, judge) {
    var el = this.uiEls.judgeText;
    el.textContent = text;
    el.style.opacity = '1';

    // 判定ごとに色を変える
    var colors = {
      PERFECT: '#f5d623',
      GREAT:   '#66ccff',
      GOOD:    '#aaaaaa',
      MISS:    '#ff4444',
      MUSE:    '#ff0000',
    };
    el.style.color = colors[judge] || '#fff';

    clearTimeout(this._judgeTimer);
    this._judgeTimer = setTimeout(function () {
      el.style.opacity = '0';
    }, 400);
  };

  RhythmEngine.prototype._checkComboCheer = function () {
    for (var i = 0; i < COMBO_CHEERS.length; i++) {
      if (this.combo === COMBO_CHEERS[i].at) {
        this._showCheer(COMBO_CHEERS[i].text);
        break;
      }
    }
  };

  RhythmEngine.prototype._showCheer = function (text) {
    var el = this.uiEls.cheerText;
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(this._cheerTimer);
    this._cheerTimer = setTimeout(function () {
      el.style.opacity = '0';
    }, 1200);
  };

  RhythmEngine.prototype._updateScoreUI = function () {
    this.uiEls.score.textContent = this.score + '点';
    this.uiEls.combo.textContent = this.combo > 1 ? this.combo + ' COMBO' : '';
  };

  RhythmEngine.prototype._updateLifeUI = function () {
    var s = '';
    for (var i = 0; i < 5; i++) {
      s += i < this.life ? '🍜' : '🖤';
    }
    this.uiEls.life.textContent = s;
  };

  RhythmEngine.prototype._updateProgressUI = function () {
    var pct = Math.min(100, (this.elapsed / this.duration) * 100);
    this.uiEls.progressBar.style.width = pct + '%';
  };

  RhythmEngine.prototype._updateBg = function () {
    var progress = this.elapsed / this.duration;
    var imgKey = BG_STAGES[0].image;
    for (var i = BG_STAGES.length - 1; i >= 0; i--) {
      if (progress >= BG_STAGES[i].at) {
        imgKey = BG_STAGES[i].image;
        break;
      }
    }
    var img = window.GameEngine.getImage(imgKey);
    if (img) {
      this.bgEl.style.backgroundImage = 'url(' + img.src + ')';
    }
  };

  // --- ノーツ削除 ---

  RhythmEngine.prototype._removeNoteEl = function (note) {
    if (note.el && note.el.parentNode) {
      note.el.parentNode.removeChild(note.el);
    }
    if (note.styleEl && note.styleEl.parentNode) {
      note.styleEl.parentNode.removeChild(note.styleEl);
    }
  };

  RhythmEngine.prototype._removeFromArray = function (note) {
    var idx = this.notes.indexOf(note);
    if (idx !== -1) this.notes.splice(idx, 1);
  };

  // --- 終了 ---

  RhythmEngine.prototype._finish = function (cleared) {
    this.running  = false;
    this.finished = true;

    // 残りノーツ削除
    for (var i = 0; i < this.notes.length; i++) {
      this._removeNoteEl(this.notes[i]);
    }
    this.notes = [];

    this.onEnd({
      score:    this.score,
      maxCombo: this.maxCombo,
      life:     this.life,
      cleared:  cleared,
    });
  };

  // --- 公開 ---
  window.RhythmEngine = RhythmEngine;
})();
