import { loadImage } from './utils.js';

const W = 1080;
const H = 1440;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
const INK = '#241F19';
const MUTED = '#7A7166';
const BRAND = '#4F46E5';

function newCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  let line = '';
  for (const ch of String(text || '')) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

function softBackground(ctx) {
  ctx.fillStyle = '#FBF7EF';
  ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(920, 120, 40, 920, 120, 720);
  g1.addColorStop(0, 'rgba(224,216,255,0.75)');
  g1.addColorStop(1, 'rgba(224,216,255,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(80, 1350, 30, 80, 1350, 700);
  g2.addColorStop(0, 'rgba(255,228,166,0.7)');
  g2.addColorStop(1, 'rgba(255,228,166,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}

function drawTopBar(ctx, dateText) {
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText('臭脑子', 80, 108);
  ctx.fillStyle = MUTED;
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText('CHOU NAO ZI · 随手记', 80, 148);
  ctx.textAlign = 'right';
  ctx.fillStyle = MUTED;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(dateText, W - 80, 120);
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(36,31,25,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 182);
  ctx.lineTo(W - 80, 182);
  ctx.stroke();
}

/** 图文明信片：照片 + 配文，可直接下载 PNG */
export async function composePostcard({ photoDataUrl, caption, dateText, tone, direction }) {
  const c = newCanvas();
  const ctx = c.getContext('2d');

  if (photoDataUrl) {
    try {
      const img = await loadImage(photoDataUrl);
      drawCover(ctx, img, 0, 0, W, H);
    } catch {
      ctx.fillStyle = '#6C63C8';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#6C63C8');
    g.addColorStop(1, '#E8A87C');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const scrim = ctx.createLinearGradient(0, H * 0.3, 0, H);
  scrim.addColorStop(0, 'rgba(18,14,12,0)');
  scrim.addColorStop(0.55, 'rgba(18,14,12,0.32)');
  scrim.addColorStop(1, 'rgba(18,14,12,0.86)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText('臭脑子', 80, 100);
  ctx.textAlign = 'right';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(dateText, W - 80, 98);
  ctx.textAlign = 'left';

  ctx.font = `700 58px ${FONT}`;
  const lines = wrapLines(ctx, caption || '今天也值得留一张。', W - 180).slice(0, 5);
  const lineH = 82;
  const lastY = H - 250;
  const firstY = lastY - (lines.length - 1) * lineH;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 16;
  lines.forEach((ln, i) => ctx.fillText(ln, 90, firstY + i * lineH));
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, H - 190);
  ctx.lineTo(300, H - 190);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(`${tone || '温和'} · ${direction || '正经好用'}`, 90, H - 140);
  ctx.textAlign = 'right';
  ctx.fillText('随手记 · 慢慢发酵', W - 90, H - 140);
  ctx.textAlign = 'left';

  return c.toDataURL('image/png');
}

/** 今日最臭打卡海报：标题 + 副文案 + 落款 + 可选照片 */
export async function composePoster({ title, body, footer, dateText, recordText, photoDataUrl, tone, direction }) {
  const c = newCanvas();
  const ctx = c.getContext('2d');
  softBackground(ctx);
  drawTopBar(ctx, dateText);

  // 印章
  ctx.save();
  ctx.translate(905, 290);
  ctx.rotate(-0.16);
  ctx.strokeStyle = 'rgba(79,70,229,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(79,70,229,0.78)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 92px ${FONT}`;
  ctx.fillText('臭', 0, 6);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 胶囊标签
  ctx.fillStyle = BRAND;
  roundRectPath(ctx, 80, 232, 330, 66, 33);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText('今日最臭 · 打卡', 110, 276);

  // 主标题
  ctx.fillStyle = INK;
  ctx.font = `800 86px ${FONT}`;
  const titleLines = wrapLines(ctx, title || '今天记了一笔', W - 170).slice(0, 3);
  let y = 400;
  titleLines.forEach((ln) => { ctx.fillText(ln, 80, y); y += 112; });

  // 副文案
  ctx.fillStyle = '#5B544A';
  ctx.font = `500 40px ${FONT}`;
  const bodyLines = wrapLines(ctx, body || '', W - 170).slice(0, 4);
  y += 34;
  bodyLines.forEach((ln) => { ctx.fillText(ln, 80, y); y += 60; });

  // 底部照片 / 装饰区
  const boxY = H - 660;
  const boxH = 470;
  ctx.save();
  roundRectPath(ctx, 80, boxY, W - 160, boxH, 36);
  ctx.clip();
  if (photoDataUrl) {
    try {
      const img = await loadImage(photoDataUrl);
      drawCover(ctx, img, 80, boxY, W - 160, boxH);
    } catch {
      ctx.fillStyle = '#E8E1F7';
      ctx.fillRect(80, boxY, W - 160, boxH);
    }
  } else {
    const g = ctx.createLinearGradient(80, boxY, W - 80, boxY + boxH);
    g.addColorStop(0, '#E7E0FA');
    g.addColorStop(1, '#FDE9C8');
    ctx.fillStyle = g;
    ctx.fillRect(80, boxY, W - 160, boxH);
    ctx.fillStyle = 'rgba(79,70,229,0.14)';
    ctx.font = `800 300px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('臭', W / 2, boxY + 330);
    ctx.textAlign = 'left';
  }
  const boxScrim = ctx.createLinearGradient(0, boxY + boxH - 190, 0, boxY + boxH);
  boxScrim.addColorStop(0, 'rgba(20,16,12,0)');
  boxScrim.addColorStop(1, 'rgba(20,16,12,0.55)');
  ctx.fillStyle = boxScrim;
  ctx.fillRect(80, boxY, W - 160, boxH);
  if (recordText) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `600 32px ${FONT}`;
    const excerpt = wrapLines(ctx, recordText, W - 240).slice(0, 2);
    excerpt.forEach((ln, i) => ctx.fillText(ln, 120, boxY + boxH - 90 + i * 44));
  }
  ctx.restore();

  // 落款
  ctx.fillStyle = MUTED;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(footer || '臭脑子 · 今日最臭打卡', 80, H - 108);
  ctx.textAlign = 'right';
  ctx.fillText(`${tone || '温和'} · ${direction || '正经好用'}`, W - 80, H - 108);
  ctx.textAlign = 'left';

  return c.toDataURL('image/png');
}
