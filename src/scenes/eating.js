/**
 * eating.js — 食事リズムゲームシーン＋退店シーン
 */
(function () {
  'use strict';

  var engine = null;  // RhythmEngine インスタンス
  var rhythmEngine = null;

  // ========================================
  // シーン: eating_rhythm（リズムゲーム）
  // ========================================

  var eatingScene = {
    enter: function (container) {
      engine = window.GameEngine;
      rhythmEngine = new window.RhythmEngine({
        container: container,
        duration: 30,
        onEnd: function (result) {
          engine.state.score    = result.score;
          engine.state.maxCombo = result.maxCombo;

          if (!result.cleared) {
            // ライフ0 → バッドエンド
            _showFailScreen(container, result);
          } else {
            // 完食 → 退店シーンへ
            setTimeout(function () {
              engine.changeScene('exit_scene');
            }, 800);
          }
        },
      });
      rhythmEngine.start();
    },

    update: function (dt) {
      if (rhythmEngine) {
        rhythmEngine.update(dt);
      }
    },

    exit: function () {
      if (rhythmEngine) {
        rhythmEngine.destroy();
        rhythmEngine = null;
      }
    },
  };

  function _showFailScreen(container, result) {
    container.innerHTML = '';

    // 背景
    var bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:#0a0a0a;z-index:0;';
    var img = window.GameEngine.getImage('ramen_eating_2');
    if (img) {
      bg.style.backgroundImage = 'url(' + img.src + ')';
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
      bg.style.filter = 'brightness(0.3) grayscale(0.5)';
    }
    container.appendChild(bg);

    var wrap = document.createElement('div');
    wrap.style.cssText =
      'position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;color:#fff;text-align:center;gap:20px;padding:20px;';
    container.appendChild(wrap);

    var h = document.createElement('div');
    h.style.cssText = 'font-size:32px;color:#ff4444;font-weight:900;';
    h.textContent = 'GAME OVER';
    wrap.appendChild(h);

    var deathReason = result.deathReason || '残してしまった罪で出禁';
    var subH = document.createElement('div');
    subH.style.cssText = 'font-size:20px;color:#f5d623;font-weight:bold;margin-top:-10px;';
    subH.textContent = deathReason;
    wrap.appendChild(subH);

    var sub = document.createElement('div');
    sub.style.cssText = 'font-size:14px;color:#999;line-height:1.8;';
    sub.innerHTML = 'スコア: ' + result.score + '点<br>' + result.maxCombo + 'コンボ';
    wrap.appendChild(sub);

    var msg = document.createElement('div');
    msg.style.cssText = 'font-size:13px;color:#cc6666;margin-top:8px;';
    msg.textContent = deathReason.includes('ロット') ? 'ギルティ！ロットを乱す者は二郎に在らず。' : '二郎では残すのは御法度…次は完食しよう。';
    wrap.appendChild(msg);

    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:16px;';
    wrap.appendChild(btnWrap);

    var btn = document.createElement('button');
    btn.className = 'btn-jiro';
    btn.textContent = 'もう一杯';
    btn.addEventListener('click', function () {
      // 状態リセット
      engine.state.score = 0;
      engine.state.maxCombo = 0;
      engine.state.usedOshibori = false;
      engine.state.toppings = [];
      engine.changeScene('title');
    });
    btnWrap.appendChild(btn);

    // Xでシェア
    var shareBtn = document.createElement('button');
    shareBtn.className = 'btn-jiro';
    shareBtn.style.cssText += ';background:#333;color:#fff;box-shadow:4px 4px 0 #111;font-size:14px;padding:10px 32px;';
    shareBtn.textContent = 'Xでシェア';
    shareBtn.addEventListener('click', function () {
      var state = engine.state;
      var toppingsStr = (state.toppings && Object.values(state.toppings).some(v => v !== 'なし')) 
        ? Object.entries(state.toppings).filter(e => e[1] !== 'なし').map(e => e[0] + e[1]).join(' ') + 'で'
        : 'そのまま';

      var shareText =
        '【JIRO Sim】 ' + deathReason + 'になりました。\n' +
        'スコア: ' + result.score + '点\n' +
        'コール: ' + toppingsStr + '\n#JIROSim';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(function () {
          shareBtn.textContent = 'コピーしました！';
          setTimeout(function () { shareBtn.textContent = 'Xでシェア'; }, 2000);
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = shareText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        shareBtn.textContent = 'コピーしました！';
        setTimeout(function () { shareBtn.textContent = 'Xでシェア'; }, 2000);
      }
    });
    btnWrap.appendChild(shareBtn);
  }

  // ========================================
  // シーン: exit_scene（退店）
  // ========================================

  var exitScene = {
    enter: function (container) {
      engine = window.GameEngine;
      _buildExitScreen(container);
    },
    update: function () {},
    exit: function () {},
  };

  function _getRank(score) {
    if (score >= 2500) return { rank: 'S', title: '二郎マスター' };
    if (score >= 2000) return { rank: 'A', title: '常連' };
    if (score >= 1500) return { rank: 'B', title: '初心者卒業' };
    return { rank: 'C', title: '初来店' };
  }

  function _buildExitScreen(container) {
    var state = engine.state;
    var rankInfo = _getRank(state.score);

    // 背景
    var bg = document.createElement('div');
    bg.style.cssText =
      'position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;';
    var img = engine.getImage('ramen_empty');
    if (img) {
      bg.style.backgroundImage = 'url(' + img.src + ')';
    } else {
      bg.style.background = '#1a1a1a';
    }
    container.appendChild(bg);

    // 半透明オーバーレイ
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.55);z-index:1;';
    container.appendChild(overlay);

    // コンテンツ
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;color:#fff;text-align:center;gap:12px;padding:20px;';
    container.appendChild(wrap);

    // 完食
    var h = document.createElement('div');
    h.style.cssText = 'font-size:24px;color:#f5d623;';
    h.textContent = '完食！！';
    wrap.appendChild(h);

    // スコア
    var scoreLine = document.createElement('div');
    scoreLine.style.cssText = 'font-size:18px;margin-top:8px;';
    scoreLine.textContent = state.score + '点 — ' + (state.maxCombo || 0) + 'コンボ';
    wrap.appendChild(scoreLine);

    // ランク
    var rankEl = document.createElement('div');
    rankEl.style.cssText =
      'font-size:48px;color:#f5d623;margin:8px 0;' +
      'text-shadow:0 0 20px rgba(245,214,35,0.5);';
    rankEl.textContent = rankInfo.rank;
    wrap.appendChild(rankEl);

    var rankTitle = document.createElement('div');
    rankTitle.style.cssText = 'font-size:16px;color:#ffcc00;';
    rankTitle.textContent = '— ' + rankInfo.title + ' —';
    wrap.appendChild(rankTitle);

    // スペーサー
    var spacer = document.createElement('div');
    spacer.style.height = '20px';
    wrap.appendChild(spacer);

    // 退店ボタン (目立つ)
    var exitBtn = document.createElement('button');
    exitBtn.className = 'btn-jiro';
    exitBtn.textContent = '退店する';
    exitBtn.style.cssText += ';font-size:22px;padding:16px 60px;';
    exitBtn.addEventListener('click', function () {
      _showEnding(container, false);
    });
    wrap.appendChild(exitBtn);

    // おしぼりトラップ (カウンター上、画面端に小さく)
    var oshibori = document.createElement('div');
    oshibori.style.cssText =
      'position:absolute;bottom:80px;right:8px;z-index:15;' +
      'width:36px;height:36px;cursor:pointer;opacity:0.6;' +
      'display:flex;align-items:center;justify-content:center;font-size:14px;' +
      'transition:opacity 0.2s,transform 0.2s;';
    var oshiboriImg = engine.getImage('oshibori');
    if (oshiboriImg) {
      var imgEl = document.createElement('img');
      imgEl.src = oshiboriImg.src;
      imgEl.style.cssText = 'width:100%;height:100%;object-fit:contain;';
      oshibori.appendChild(imgEl);
    } else {
      // 画像がない場合はテキスト代替
      oshibori.textContent = '🧻';
      oshibori.style.fontSize = '20px';
    }

    oshibori.addEventListener('mouseenter', function () {
      oshibori.style.opacity = '1';
      oshibori.style.transform = 'scale(1.2)';
    });
    oshibori.addEventListener('mouseleave', function () {
      oshibori.style.opacity = '0.6';
      oshibori.style.transform = 'scale(1)';
    });
    oshibori.addEventListener('click', function () {
      engine.state.usedOshibori = true;
      oshibori.style.opacity = '1';
      oshibori.style.transform = 'scale(1.3)';
      oshibori.style.filter = 'brightness(1.5)';

      // フィードバック
      var fb = document.createElement('div');
      fb.style.cssText =
        'position:absolute;bottom:120px;right:4px;z-index:20;color:#f5d623;' +
        'font-size:12px;white-space:nowrap;opacity:1;transition:opacity 0.5s;';
      fb.textContent = '手を拭いた！';
      container.appendChild(fb);
      setTimeout(function () { fb.style.opacity = '0'; }, 1500);
      setTimeout(function () { if (fb.parentNode) fb.parentNode.removeChild(fb); }, 2000);
    });

    container.appendChild(oshibori);
  }

  /**
   * エンディング画面
   */
  function _showEnding(container, fromFail) {
    container.innerHTML = '';
    var state = engine.state;
    var rankInfo = _getRank(state.score);
    var isGood = state.usedOshibori;

    // 背景
    var bg = document.createElement('div');
    bg.style.cssText =
      'position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;';
    var bgKey = isGood ? 'ending_good' : 'ending_bad';
    var img = engine.getImage(bgKey);
    if (img) {
      bg.style.backgroundImage = 'url(' + img.src + ')';
    } else {
      bg.style.background = isGood
        ? 'linear-gradient(135deg, #1a2a1a, #0a1a0a)'
        : 'linear-gradient(135deg, #2a1a1a, #1a0a0a)';
    }
    container.appendChild(bg);

    // オーバーレイ
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1;';
    container.appendChild(overlay);

    // コンテンツ
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;color:#fff;text-align:center;gap:12px;padding:24px;';
    container.appendChild(wrap);

    // エンディングテキスト
    var endH = document.createElement('div');
    endH.style.cssText = 'font-size:20px;line-height:1.6;';
    if (isGood) {
      endH.style.color = '#f5d623';
      endH.textContent = '完璧な二郎ムーブ。また来よう。';
    } else {
      endH.style.color = '#ff6644';
      endH.innerHTML = 'おしぼりで手を拭かずに<br>退店してしまった…<br><span style="font-size:14px;color:#999;">マナー違反だ…</span>';
    }
    wrap.appendChild(endH);

    // 区切り線
    var hr = document.createElement('div');
    hr.style.cssText = 'width:60%;height:1px;background:#555;margin:8px 0;';
    wrap.appendChild(hr);

    // リザルト情報
    var info = document.createElement('div');
    info.style.cssText = 'font-size:13px;color:#ccc;line-height:2;';

    var minutes = Math.floor(state.totalTime / 60);
    var seconds = Math.floor(state.totalTime % 60);
    var timeStr = minutes + '分' + (seconds < 10 ? '0' : '') + seconds + '秒';

    var toppingsStr = (state.toppings && state.toppings.length > 0)
      ? state.toppings.join(' ')
      : 'そのまま';

    info.innerHTML =
      'プレイ時間: ' + timeStr + '<br>' +
      'スコア: ' + state.score + '点 (' + rankInfo.rank + 'ランク)<br>' +
      'コンボ: ' + (state.maxCombo || 0) + '<br>' +
      'コール: ' + toppingsStr;
    wrap.appendChild(info);

    // ボタン群
    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:16px;';
    wrap.appendChild(btnWrap);

    // もう一杯
    var retryBtn = document.createElement('button');
    retryBtn.className = 'btn-jiro';
    retryBtn.textContent = 'もう一杯';
    retryBtn.addEventListener('click', function () {
      engine.state.score = 0;
      engine.state.maxCombo = 0;
      engine.state.usedOshibori = false;
      engine.state.toppings = [];
      engine.state.totalTime = 0;
      engine.changeScene('title');
    });
    btnWrap.appendChild(retryBtn);

    // Xでシェア
    var shareBtn = document.createElement('button');
    shareBtn.className = 'btn-jiro';
    shareBtn.style.cssText += ';background:#333;color:#fff;box-shadow:4px 4px 0 #111;font-size:14px;padding:10px 32px;';
    shareBtn.textContent = 'Xでシェア';
    shareBtn.addEventListener('click', function () {
      var oshiboriText = state.usedOshibori ? '完璧なムーブで退店しました。' : 'カウンターを拭かなかった罪で出禁になりました。';
      var shareText =
        '【JIRO Sim】 ' + oshiboriText + '\n' +
        'スコア: ' + state.score + '点 (' + rankInfo.title + ')\n' +
        'コール: ' + toppingsStr + '\n#JIROSim';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(function () {
          shareBtn.textContent = 'コピーしました！';
          setTimeout(function () { shareBtn.textContent = 'Xでシェア'; }, 2000);
        });
      } else {
        // フォールバック
        var ta = document.createElement('textarea');
        ta.value = shareText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        shareBtn.textContent = 'コピーしました！';
        setTimeout(function () { shareBtn.textContent = 'Xでシェア'; }, 2000);
      }
    });
    btnWrap.appendChild(shareBtn);
  }

  // --- シーン登録 ---
  window.GameEngine.registerScene('eating_rhythm', eatingScene);
  window.GameEngine.registerScene('exit_scene', exitScene);
})();
