// ===== RESULT IMAGE GENERATION (v3: "ramen receipt" aesthetic) =====
// Designed to feel like a chit from the ticket machine — warm, stamped, iconic.
// Three variants: GOOD (cream receipt), BAD (red "REJECTED" receipt), PERFECT (gold-edged).
import { state } from '../state.js';

const GAME_HOST = 'jiro-sim.pages.dev';

// --- helpers --------------------------------------------------------------

function roundRect(cx, x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y,     x + w, y + h, r);
  cx.arcTo(x + w, y + h, x,     y + h, r);
  cx.arcTo(x,     y + h, x,     y,     r);
  cx.arcTo(x,     y,     x + w, y,     r);
  cx.closePath();
}

function drawNoise(cx, x, y, w, h, density, alpha) {
  const n = Math.floor(w * h * density);
  cx.save();
  for (let i = 0; i < n; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const a  = alpha * (0.3 + Math.random() * 0.7);
    cx.fillStyle = `rgba(80,50,20,${a.toFixed(3)})`;
    cx.fillRect(px, py, 1, 1);
  }
  cx.restore();
}

function drawStamp(cx, text, x, y, color, rot) {
  cx.save();
  cx.translate(x, y);
  cx.rotate(rot);
  cx.globalAlpha = 0.55;
  cx.lineWidth = 6;
  cx.strokeStyle = color;
  // outer + inner ring
  cx.beginPath();
  cx.rect(-170, -70, 340, 140);
  cx.stroke();
  cx.beginPath();
  cx.rect(-160, -60, 320, 120);
  cx.stroke();
  // text
  cx.fillStyle = color;
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.font = '900 72px "Noto Sans JP", sans-serif';
  cx.fillText(text, 0, 0);
  cx.restore();
}

// Non-functional but brand-visual "QR" — 21x21 grid with finder patterns
function drawFakeQR(cx, x, y, size, fg, bg) {
  const cells = 21;
  const cs = size / cells;
  cx.save();
  cx.fillStyle = bg;
  cx.fillRect(x, y, size, size);
  cx.fillStyle = fg;

  // deterministic pseudo-random based on grid index (so QR "feels" stable)
  function rnd(i, j) {
    const v = (i * 131 + j * 17 + (i ^ j) * 53) % 100;
    return v < 48;
  }

  function drawFinder(fx, fy) {
    cx.fillRect(fx, fy, cs * 7, cs);
    cx.fillRect(fx, fy + cs * 6, cs * 7, cs);
    cx.fillRect(fx, fy, cs, cs * 7);
    cx.fillRect(fx + cs * 6, fy, cs, cs * 7);
    cx.fillRect(fx + cs * 2, fy + cs * 2, cs * 3, cs * 3);
  }

  // body
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      // skip finder regions
      const inTL = i < 8 && j < 8;
      const inTR = i > cells - 9 && j < 8;
      const inBL = i < 8 && j > cells - 9;
      if (inTL || inTR || inBL) continue;
      if (rnd(i, j)) cx.fillRect(x + i * cs, y + j * cs, cs, cs);
    }
  }
  // finders
  drawFinder(x, y);
  drawFinder(x + cs * (cells - 7), y);
  drawFinder(x, y + cs * (cells - 7));
  cx.restore();
}

function drawZigzagEdge(cx, x, y, w, isTop, color) {
  const tooth = 14;
  const count = Math.floor(w / tooth);
  cx.save();
  cx.fillStyle = color;
  cx.beginPath();
  if (isTop) {
    cx.moveTo(x, y);
    for (let i = 0; i < count; i++) {
      cx.lineTo(x + i * tooth + tooth / 2, y - tooth);
      cx.lineTo(x + (i + 1) * tooth, y);
    }
    cx.lineTo(x + w, y + 40);
    cx.lineTo(x, y + 40);
  } else {
    cx.moveTo(x, y);
    for (let i = 0; i < count; i++) {
      cx.lineTo(x + i * tooth + tooth / 2, y + tooth);
      cx.lineTo(x + (i + 1) * tooth, y);
    }
    cx.lineTo(x + w, y - 40);
    cx.lineTo(x, y - 40);
  }
  cx.closePath();
  cx.fill();
  cx.restore();
}

function drawSparkle(cx, x, y, size, color) {
  cx.save();
  cx.translate(x, y);
  cx.fillStyle = color;
  cx.globalAlpha = 0.85;
  cx.beginPath();
  cx.moveTo(0, -size);
  cx.lineTo(size * 0.25, -size * 0.25);
  cx.lineTo(size, 0);
  cx.lineTo(size * 0.25, size * 0.25);
  cx.lineTo(0, size);
  cx.lineTo(-size * 0.25, size * 0.25);
  cx.lineTo(-size, 0);
  cx.lineTo(-size * 0.25, -size * 0.25);
  cx.closePath();
  cx.fill();
  cx.restore();
}

function wrapText(cx, text, x, y, maxW, lineH) {
  const words = String(text || '').split('');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i];
    if (cx.measureText(test).width > maxW && line.length > 0) {
      cx.fillText(line, x, yy);
      line = words[i];
      yy += lineH;
    } else {
      line = test;
    }
  }
  cx.fillText(line, x, yy);
  return yy;
}

function dateStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

// Try to resolve title icons from meta/titles.js if present (Track 3), else fallback.
async function resolveTitleBadges(titleKeys) {
  if (!Array.isArray(titleKeys) || titleKeys.length === 0) return [];
  try {
    const mod = await import('../meta/titles.js').catch(() => null);
    if (mod && typeof mod.getTitleDisplay === 'function') {
      return titleKeys.map(k => {
        const d = mod.getTitleDisplay(k) || {};
        return { icon: d.icon || '🏅', label: d.label || k };
      });
    }
  } catch (e) { /* fall through */ }
  // fallback: emoji per known key, or generic
  const fallbackIcons = {
    firstBowl: '🥇', perfectCall: '🎯', ironStomach: '🍜', speedEater: '⚡',
    garlicDemon: '🧄', veggieMountain: '🥬', legendary_fan: '⭐',
  };
  return titleKeys.map(k => ({ icon: fallbackIcons[k] || '🏅', label: k }));
}

async function resolveShopName(shopId, overrideName) {
  if (overrideName) return overrideName;
  try {
    const mod = await import('../meta/shops.js').catch(() => null);
    if (mod) {
      if (typeof mod.getShopName === 'function') return mod.getShopName(shopId) || '本店';
      if (mod.SHOPS && mod.SHOPS[shopId]) return mod.SHOPS[shopId].name || '本店';
      if (mod.shops && mod.shops[shopId]) return mod.shops[shopId].name || '本店';
    }
  } catch (e) { /* ignore */ }
  return '本店';
}

// --- main -----------------------------------------------------------------

/**
 * Generate a 1080x1080 shareable result card as a Canvas.
 * Backward-compatible: returns canvas synchronously. Async enrichment
 * (title badges, shop name) is applied if opts supplies them directly,
 * otherwise they are read synchronously from state.
 *
 * @param {number} score
 * @param {string} rankTitle
 * @param {string} callText
 * @param {number} maxCombo
 * @param {string} ticketName
 * @param {boolean} isGoodEnd
 * @param {object} [opts] - { shopName, titles, dailyCleared, isPerfect, variant }
 */
export function generateResultImage(score, rankTitle, callText, maxCombo, ticketName, isGoodEnd, opts) {
  opts = opts || {};
  const W = 1080, H = 1080;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const cx = c.getContext('2d');

  // --- read state defaults (backward compat)
  const titles    = Array.isArray(opts.titles) ? opts.titles
                   : (Array.isArray(state.titlesEarned) ? state.titlesEarned : []);
  const shopName  = opts.shopName || (state.shopId === 'mita' ? '三田本店'
                   : state.shopId === 'meguro' ? '目黒店'
                   : '本店');
  const daily     = state.dailyChallenge || null;
  const dailyDone = !!(opts.dailyCleared ||
                   (daily && localStorage.getItem('jiro_daily_cleared_' + (daily.id || daily.key || '')) === '1'));
  const isPerfect = !!opts.isPerfect || (isGoodEnd && score >= 2500);
  const variant   = opts.variant || (!isGoodEnd ? 'bad' : (isPerfect ? 'perfect' : 'good'));

  const { date, time } = dateStamp();

  // ---- palette per variant
  const P = variant === 'bad' ? {
    bg1: '#3a1208', bg2: '#5a1a0e', paper1: '#f4e3cd', paper2: '#e6cba8',
    ink: '#3a1a08', accent: '#C0392B', stampColor: '#8B0000',
    stampText: 'REJECTED', subStamp: '出禁',
  } : variant === 'perfect' ? {
    bg1: '#1a0f00', bg2: '#2a1a05', paper1: '#fff6dc', paper2: '#f2d98a',
    ink: '#3a2a08', accent: '#C89B1C', stampColor: '#B8860B',
    stampText: 'PAID', subStamp: '食券済',
  } : {
    bg1: '#1a1408', bg2: '#2a1e0a', paper1: '#fbf0d6', paper2: '#ecd8aa',
    ink: '#3a2a0a', accent: '#C69516', stampColor: '#8B1A1A',
    stampText: 'PAID', subStamp: '食券済',
  };

  // ---- moody backdrop (behind the "paper")
  const bgGrad = cx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, P.bg1);
  bgGrad.addColorStop(1, P.bg2);
  cx.fillStyle = bgGrad;
  cx.fillRect(0, 0, W, H);

  // subtle vignette dots
  for (let i = 0; i < 30; i++) {
    cx.beginPath();
    cx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 1, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(255,200,100,0.06)';
    cx.fill();
  }

  // ---- receipt paper (the chit itself)
  const RX = 90, RY = 70, RW = W - 180, RH = H - 140;

  // drop shadow
  cx.save();
  cx.shadowColor = 'rgba(0,0,0,0.55)';
  cx.shadowBlur = 40;
  cx.shadowOffsetY = 12;
  // main paper gradient
  const pg = cx.createLinearGradient(0, RY, 0, RY + RH);
  pg.addColorStop(0, P.paper1);
  pg.addColorStop(1, P.paper2);
  cx.fillStyle = pg;
  cx.fillRect(RX, RY, RW, RH);
  cx.restore();

  // zigzag torn edges
  drawZigzagEdge(cx, RX, RY, RW, true, P.paper1);
  drawZigzagEdge(cx, RX, RY + RH, RW, false, P.paper2);

  // paper noise (grain)
  drawNoise(cx, RX, RY, RW, RH, 0.004, 0.5);

  // inner guide line (ticket-machine style)
  cx.strokeStyle = P.ink;
  cx.globalAlpha = 0.25;
  cx.lineWidth = 2;
  cx.setLineDash([6, 6]);
  cx.strokeRect(RX + 24, RY + 24, RW - 48, RH - 48);
  cx.setLineDash([]);
  cx.globalAlpha = 1;

  // perfect: gold edge glow
  if (variant === 'perfect') {
    cx.save();
    cx.strokeStyle = '#D4A017';
    cx.shadowColor = '#FFD700';
    cx.shadowBlur = 30;
    cx.lineWidth = 6;
    cx.strokeRect(RX + 8, RY + 8, RW - 16, RH - 16);
    cx.restore();
  }

  // ---- HEADER ZONE
  cx.textAlign = 'center';
  cx.fillStyle = P.ink;
  cx.font = '900 72px "Noto Sans JP", sans-serif';
  cx.fillText('🍜 JIRO Sim', W / 2, RY + 130);

  // tagline
  cx.font = '700 22px "Noto Sans JP", sans-serif';
  cx.globalAlpha = 0.7;
  cx.fillText('- THE JIROシミュレータ 食券 -', W / 2, RY + 170);
  cx.globalAlpha = 1;

  // shop + date row
  cx.font = '700 22px "Noto Sans JP", sans-serif';
  cx.textAlign = 'left';
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.85;
  cx.fillText(`店舗: ${shopName}`, RX + 60, RY + 225);
  cx.textAlign = 'right';
  cx.fillText(`${date}  ${time}`, RX + RW - 60, RY + 225);
  cx.globalAlpha = 1;

  // divider (dashed)
  cx.strokeStyle = P.ink;
  cx.globalAlpha = 0.4;
  cx.setLineDash([8, 8]);
  cx.beginPath();
  cx.moveTo(RX + 60, RY + 255);
  cx.lineTo(RX + RW - 60, RY + 255);
  cx.stroke();
  cx.setLineDash([]);
  cx.globalAlpha = 1;

  // ---- SCORE HERO
  cx.textAlign = 'center';
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.55;
  cx.font = '700 28px "Noto Sans JP", sans-serif';
  cx.fillText('SCORE', W / 2, RY + 305);
  cx.globalAlpha = 1;

  // huge score
  cx.fillStyle = P.ink;
  cx.font = '900 200px "Noto Sans JP", sans-serif';
  cx.fillText(String(score), W / 2, RY + 470);

  // rank title (dramatic)
  cx.fillStyle = P.accent;
  cx.font = '900 56px "Noto Sans JP", sans-serif';
  cx.shadowColor = 'rgba(0,0,0,0.15)';
  cx.shadowBlur = 8;
  cx.fillText(rankTitle || '', W / 2, RY + 540);
  cx.shadowBlur = 0;

  // ---- DETAILS ROW (ticket + max combo + call as "order slip")
  const detailY = RY + 590;
  // dashed divider
  cx.strokeStyle = P.ink;
  cx.globalAlpha = 0.35;
  cx.setLineDash([6, 6]);
  cx.beginPath();
  cx.moveTo(RX + 60, detailY);
  cx.lineTo(RX + RW - 60, detailY);
  cx.stroke();
  cx.setLineDash([]);
  cx.globalAlpha = 1;

  // left col: ticket
  cx.textAlign = 'left';
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.55;
  cx.font = '700 18px "Noto Sans JP", sans-serif';
  cx.fillText('TICKET', RX + 60, detailY + 32);
  cx.globalAlpha = 1;
  cx.font = '900 30px "Noto Sans JP", sans-serif';
  cx.fillText(ticketName || '—', RX + 60, detailY + 68);

  // right col: max combo
  cx.textAlign = 'right';
  cx.globalAlpha = 0.55;
  cx.font = '700 18px "Noto Sans JP", sans-serif';
  cx.fillText('MAX COMBO', RX + RW - 60, detailY + 32);
  cx.globalAlpha = 1;
  cx.font = '900 30px "Noto Sans JP", sans-serif';
  cx.fillText('x' + String(maxCombo || 0), RX + RW - 60, detailY + 68);

  // "order slip" for call
  if (callText) {
    const slipX = RX + 60, slipY = detailY + 90, slipW = RW - 120, slipH = 84;
    cx.save();
    // slip background: slightly darker paper
    cx.fillStyle = variant === 'bad' ? 'rgba(139,0,0,0.08)' : 'rgba(120,80,20,0.1)';
    roundRect(cx, slipX, slipY, slipW, slipH, 10);
    cx.fill();
    // corner marks
    cx.strokeStyle = P.ink;
    cx.globalAlpha = 0.45;
    cx.lineWidth = 2;
    const ml = 18;
    const corners = [
      [slipX, slipY], [slipX + slipW, slipY],
      [slipX, slipY + slipH], [slipX + slipW, slipY + slipH],
    ];
    corners.forEach(([x, y], i) => {
      cx.beginPath();
      const dx = (i % 2 === 0) ? 1 : -1;
      const dy = (i < 2) ? 1 : -1;
      cx.moveTo(x + dx * ml, y); cx.lineTo(x, y); cx.lineTo(x, y + dy * ml);
      cx.stroke();
    });
    cx.globalAlpha = 1;

    // label
    cx.fillStyle = P.accent;
    cx.font = '900 20px "Noto Sans JP", sans-serif';
    cx.textAlign = 'left';
    cx.fillText('◆ お客様コール', slipX + 16, slipY + 28);

    // content
    cx.fillStyle = P.ink;
    cx.font = '900 28px "Noto Sans JP", sans-serif';
    cx.fillText('「' + callText + '」', slipX + 16, slipY + 64);
    cx.restore();
  }

  // ---- TITLE BADGES
  const badges = Array.isArray(titles) ? titles.slice(0, 6) : [];
  if (badges.length > 0) {
    const bY = detailY + 200;
    cx.textAlign = 'center';
    cx.fillStyle = P.ink;
    cx.globalAlpha = 0.55;
    cx.font = '700 18px "Noto Sans JP", sans-serif';
    cx.fillText('— 獲得称号 / TITLES EARNED —', W / 2, bY);
    cx.globalAlpha = 1;

    const badgeSize = 56;
    const gap = 24;
    const totalW = badges.length * badgeSize + (badges.length - 1) * gap;
    let bx = W / 2 - totalW / 2;
    const fallbackIcons = ['🏅', '🥇', '⭐', '🎯', '🔥', '🧄'];
    badges.forEach((key, i) => {
      // circle
      cx.save();
      cx.beginPath();
      cx.arc(bx + badgeSize / 2, bY + 45, badgeSize / 2, 0, Math.PI * 2);
      cx.fillStyle = variant === 'bad' ? 'rgba(139,0,0,0.15)' : 'rgba(212,160,23,0.18)';
      cx.fill();
      cx.strokeStyle = P.accent;
      cx.lineWidth = 2;
      cx.stroke();
      cx.restore();
      // icon (emoji fallback — string)
      cx.fillStyle = P.ink;
      cx.font = '900 32px "Noto Sans JP", "Apple Color Emoji", sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      const icon = (typeof key === 'string' && key.length <= 2) ? key : (fallbackIcons[i % fallbackIcons.length]);
      cx.fillText(icon, bx + badgeSize / 2, bY + 45);
      cx.textBaseline = 'alphabetic';
      bx += badgeSize + gap;
    });
  }

  // ---- DAILY CHALLENGE
  if (dailyDone && daily) {
    const dyY = RY + RH - 280;
    cx.fillStyle = P.accent;
    cx.font = '900 22px "Noto Sans JP", sans-serif';
    cx.textAlign = 'center';
    cx.fillText('⭐ 本日のチャレンジ達成: ' + (daily.name || daily.title || 'Daily'), W / 2, dyY);
  }

  // ---- STAMP (rotated red)
  if (variant === 'bad') {
    drawStamp(cx, 'REJECTED', W / 2 + 180, RY + 400, P.stampColor, -0.22);
    // tiny sub-text
    cx.save();
    cx.translate(W / 2 + 180, RY + 430);
    cx.rotate(-0.22);
    cx.globalAlpha = 0.55;
    cx.fillStyle = P.stampColor;
    cx.font = '900 38px "Noto Sans JP", sans-serif';
    cx.textAlign = 'center';
    cx.fillText('出禁', 0, 50);
    cx.restore();
  } else {
    drawStamp(cx, P.stampText, W / 2 + 220, RY + 380, P.stampColor, 0.18);
    cx.save();
    cx.translate(W / 2 + 220, RY + 380);
    cx.rotate(0.18);
    cx.globalAlpha = 0.5;
    cx.fillStyle = P.stampColor;
    cx.font = '900 38px "Noto Sans JP", sans-serif';
    cx.textAlign = 'center';
    cx.fillText(P.subStamp, 0, 50);
    cx.restore();
  }

  // ---- BAD END: owner's "speech bubble"
  if (variant === 'bad') {
    const ox = RX + 70, oy = RY + RH - 220;
    // small owner head (abstract circle, since we cannot load images here safely)
    cx.save();
    cx.beginPath();
    cx.arc(ox + 40, oy + 40, 40, 0, Math.PI * 2);
    cx.fillStyle = '#3a2510';
    cx.fill();
    cx.strokeStyle = P.stampColor;
    cx.lineWidth = 3;
    cx.stroke();
    // eyes
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(ox + 28, oy + 36, 5, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(ox + 52, oy + 36, 5, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#000';
    cx.beginPath(); cx.arc(ox + 28, oy + 36, 2, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(ox + 52, oy + 36, 2, 0, Math.PI * 2); cx.fill();
    // angry mouth
    cx.strokeStyle = '#000';
    cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(ox + 28, oy + 58); cx.lineTo(ox + 52, oy + 58); cx.stroke();
    cx.restore();

    // speech bubble
    const bx = ox + 110, by = oy - 10, bw = RW - 240, bh = 90;
    cx.save();
    cx.fillStyle = '#fff';
    cx.strokeStyle = P.stampColor;
    cx.lineWidth = 2;
    roundRect(cx, bx, by, bw, bh, 14);
    cx.fill();
    cx.stroke();
    // tail
    cx.beginPath();
    cx.moveTo(bx, by + 40);
    cx.lineTo(bx - 14, by + 50);
    cx.lineTo(bx, by + 60);
    cx.closePath();
    cx.fillStyle = '#fff';
    cx.fill();
    cx.stroke();
    // text
    cx.fillStyle = P.stampColor;
    cx.font = '900 30px "Noto Sans JP", sans-serif';
    cx.textAlign = 'center';
    cx.fillText('お帰りください', bx + bw / 2, by + 55);
    cx.restore();
  }

  // ---- PERFECT END: sparkles
  if (variant === 'perfect') {
    for (let i = 0; i < 24; i++) {
      drawSparkle(cx,
        RX + 20 + Math.random() * (RW - 40),
        RY + 20 + Math.random() * (RH - 40),
        Math.random() * 12 + 4,
        i % 2 === 0 ? '#D4A017' : '#FFE680');
    }
  }

  // ---- FOOTER: QR + URL
  const qrSize = 140;
  const qrX = RX + RW - qrSize - 50;
  const qrY = RY + RH - qrSize - 60;
  // QR frame
  cx.save();
  cx.fillStyle = '#fff';
  cx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
  cx.strokeStyle = P.ink;
  cx.lineWidth = 2;
  cx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
  cx.restore();
  drawFakeQR(cx, qrX, qrY, qrSize, P.ink, '#fff');
  // QR caption
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.6;
  cx.font = '700 14px "Noto Sans JP", sans-serif';
  cx.textAlign = 'center';
  cx.fillText('SCAN TO PLAY', qrX + qrSize / 2, qrY + qrSize + 24);
  cx.globalAlpha = 1;

  // URL big
  cx.fillStyle = P.accent;
  cx.font = '900 40px "Noto Sans JP", sans-serif';
  cx.textAlign = 'left';
  cx.fillText(GAME_HOST, RX + 60, RY + RH - 90);
  // sub
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.55;
  cx.font = '700 18px "Noto Sans JP", sans-serif';
  cx.fillText('Play the JIRO Sim — Free in browser', RX + 60, RY + RH - 62);
  cx.globalAlpha = 1;

  // barcode flourish (fake — just vertical bars)
  cx.save();
  const barY = RY + RH - 40;
  cx.fillStyle = P.ink;
  let bxx = RX + 60;
  const barsEnd = qrX - 20;
  while (bxx < barsEnd) {
    const bw = 1 + Math.floor(Math.random() * 4);
    if (Math.random() > 0.35) cx.fillRect(bxx, barY - 18, bw, 18);
    bxx += bw + 1 + Math.floor(Math.random() * 3);
  }
  cx.restore();

  // ticket id (fake)
  cx.fillStyle = P.ink;
  cx.globalAlpha = 0.5;
  cx.font = '700 14px monospace';
  cx.textAlign = 'left';
  const tid = 'No.' + String(Math.floor(Math.random() * 900000) + 100000);
  cx.fillText(tid, RX + 60, RY + RH - 10);
  cx.globalAlpha = 1;

  return c;
}

// ---- SAVE / SHARE --------------------------------------------------------

function showSavedToast(msg) {
  // Inline toast — no dependency on Track 3 infrastructure.
  try {
    const host = document.getElementById('game') || document.body;
    const toast = document.createElement('div');
    toast.className = 'secret-toast';
    toast.style.cssText = 'background:rgba(20,10,0,0.92);border:1px solid #D4A017;color:#D4A017;'
      + 'padding:12px 22px;border-radius:12px;font-weight:900;font-size:14px;'
      + 'position:absolute;bottom:90px;left:50%;transform:translateX(-50%);z-index:40;'
      + 'box-shadow:0 0 20px rgba(212,160,23,0.5);pointer-events:none;';
    toast.textContent = msg;
    host.appendChild(toast);
    setTimeout(() => { toast.style.transition = 'opacity 0.4s'; toast.style.opacity = '0'; }, 1800);
    setTimeout(() => { toast.remove(); }, 2400);
  } catch (e) { /* best effort */ }
}

export function saveResultImage(canvas) {
  canvas.toBlob(function(blob) {
    if (!blob) { return; }
    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('jiro_lang')) || 'ja';
    const savedMsg = lang === 'en' ? 'Image saved' : '画像を保存しました';
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'jiro-sim-result.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'JIRO Sim', text: '' };
      if (navigator.canShare(shareData)) {
        navigator.share(shareData)
          .then(() => showSavedToast(savedMsg))
          .catch(() => { downloadBlob(blob); showSavedToast(savedMsg); });
        return;
      }
    }
    downloadBlob(blob);
    showSavedToast(savedMsg);
  }, 'image/png');
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'jiro-sim-result.png';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Expose helpers that callers (Track 3/4) may use to pre-resolve async data
// before rendering and then pass into `opts`. Safe to ignore.
export { resolveTitleBadges, resolveShopName };
