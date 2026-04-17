// ===== RESULT IMAGE GENERATION (v3: richer) =====
export function generateResultImage(score, rankTitle, callText, maxCombo, ticketName, isGoodEnd) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1080;
  const cx = c.getContext('2d');
  const grad = cx.createLinearGradient(0, 0, 0, 1080);
  grad.addColorStop(0, '#1a1a1a');
  grad.addColorStop(0.5, '#2a1a0a');
  grad.addColorStop(1, '#0a0a0a');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 1080, 1080);
  cx.strokeStyle = '#D4A017';
  cx.lineWidth = 4;
  cx.strokeRect(30, 30, 1020, 1020);
  cx.strokeStyle = 'rgba(212,160,23,0.3)';
  cx.lineWidth = 1;
  cx.strokeRect(45, 45, 990, 990);
  if (isGoodEnd) {
    const dotColors = ['#D4A017', '#E74C3C', '#4CAF50', '#4FC3F7', '#FF6B35'];
    for (let i = 0; i < 60; i++) {
      cx.beginPath();
      cx.arc(Math.random()*1080, Math.random()*1080, Math.random()*4+1, 0, Math.PI*2);
      cx.fillStyle = dotColors[Math.floor(Math.random()*dotColors.length)];
      cx.globalAlpha = Math.random()*0.5+0.2;
      cx.fill();
    }
    cx.globalAlpha = 1;
  }
  cx.textAlign = 'center';
  cx.fillStyle = '#D4A017';
  cx.font = '900 72px "Noto Sans JP", sans-serif';
  cx.shadowColor = 'rgba(212,160,23,0.5)';
  cx.shadowBlur = 20;
  cx.fillText('JIRO Sim', 540, 150);
  cx.shadowBlur = 0;
  cx.fillStyle = 'rgba(255,255,255,0.5)';
  cx.font = '700 24px "Noto Sans JP", sans-serif';
  cx.fillText('THE JIROシミュレータ', 540, 195);
  cx.fillStyle = '#fff';
  cx.font = '900 160px "Noto Sans JP", sans-serif';
  cx.shadowColor = 'rgba(255,255,255,0.3)';
  cx.shadowBlur = 30;
  cx.fillText(String(score), 540, 420);
  cx.shadowBlur = 0;
  cx.fillStyle = '#D4A017';
  cx.font = '900 48px "Noto Sans JP", sans-serif';
  cx.fillText(rankTitle, 540, 510);
  cx.fillStyle = 'rgba(255,255,255,0.8)';
  cx.font = '700 28px "Noto Sans JP", sans-serif';
  cx.fillText(ticketName || '', 540, 590);
  cx.fillText('MAX COMBO: ' + maxCombo, 540, 640);
  if (callText) {
    cx.fillStyle = 'rgba(255,255,255,0.6)';
    cx.font = '700 24px "Noto Sans JP", sans-serif';
    cx.fillText('🍜 ' + callText, 540, 710);
  }
  if (!isGoodEnd) {
    cx.fillStyle = 'rgba(231,76,60,0.15)';
    cx.fillRect(0, 0, 1080, 1080);
    cx.fillStyle = '#E74C3C';
    cx.font = '900 80px "Noto Sans JP", sans-serif';
    cx.globalAlpha = 0.25;
    cx.save();
    cx.translate(540, 540);
    cx.rotate(-0.3);
    cx.fillText('GAME OVER', 0, 0);
    cx.restore();
    cx.globalAlpha = 1;
  }
  cx.fillStyle = 'rgba(255,255,255,0.3)';
  cx.font = '400 20px "Noto Sans JP", sans-serif';
  cx.fillText('jiro-sim.pages.dev', 540, 1020);
  return c;
}

export function saveResultImage(canvas) {
  canvas.toBlob(function(blob) {
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'jiro-sim-result.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'JIRO Sim', text: '' };
      if (navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => downloadBlob(blob));
        return;
      }
    }
    downloadBlob(blob);
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
