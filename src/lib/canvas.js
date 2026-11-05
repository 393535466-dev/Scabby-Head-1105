import { loadImage } from './utils.js';

const W = 1080;
const H = 1440;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
const INK = '#241F19';
const MUTED = '#7A7166';
const BRAND = '#4F46E5';

// 与 public/logo.svg 保持同步：脑形对话气泡 + 内描脑沟线 + 笑脸（画布内直接绘制，无异步图片依赖）
const LOGO_OUTLINE = 'M 85.0 49.7 C 87.4 49.4 89.5 47.9 92.2 46.6 C 95.0 45.4 98.2 43.2 101.5 42.1 C 104.7 41.1 108.4 40.4 111.5 40.4 C 114.6 40.5 117.6 41.4 120.1 42.5 C 122.6 43.6 124.7 45.5 126.4 47.2 C 128.1 49.0 129.3 51.1 130.5 53.0 C 131.8 54.8 132.6 56.7 133.9 58.4 C 135.2 60.1 136.6 61.5 138.3 63.0 C 140.0 64.5 142.2 65.8 144.1 67.3 C 146.0 68.8 148.7 70.4 149.7 72.2 C 150.7 74.0 150.6 76.2 150.0 78.2 C 149.4 80.1 146.6 82.1 146.2 84.0 C 145.8 85.9 147.7 87.8 147.7 89.6 C 147.8 91.5 147.5 93.5 146.6 95.2 C 145.6 97.0 143.4 98.5 142.0 100.1 C 140.6 101.7 136.9 101.8 138.3 105.0 C 140.3 111.0 143.3 117.0 150.3 119.0 C 140.3 120.0 141.8 113.6 132.8 116.6 C 129.1 117.1 129.9 120.5 127.8 122.0 C 125.7 123.5 123.0 124.8 120.2 125.6 C 117.4 126.4 114.1 126.7 111.0 126.8 C 107.9 127.0 104.7 126.6 101.7 126.4 C 98.7 126.2 95.8 125.8 93.1 125.7 C 90.3 125.6 87.7 125.7 85.0 126.0 C 82.3 126.2 79.6 126.8 76.6 127.3 C 73.7 127.7 70.6 128.4 67.5 128.5 C 64.4 128.7 61.0 128.8 58.1 128.3 C 55.1 127.8 52.2 126.9 49.8 125.6 C 47.4 124.4 45.3 122.5 43.6 120.8 C 41.9 119.0 40.7 116.9 39.5 115.0 C 38.2 113.2 37.4 111.3 36.1 109.6 C 34.8 107.9 33.4 106.5 31.7 105.0 C 30.0 103.5 27.8 102.2 25.9 100.7 C 24.0 99.2 21.3 97.6 20.3 95.8 C 19.3 94.0 19.4 91.8 20.0 89.8 C 20.6 87.9 23.4 85.9 23.8 84.0 C 24.2 82.1 22.3 80.2 22.3 78.4 C 22.2 76.5 22.5 74.5 23.4 72.8 C 24.4 71.0 26.6 69.5 28.0 67.9 C 29.4 66.3 30.7 64.8 31.7 63.0 C 32.7 61.3 33.3 59.4 34.2 57.4 C 35.1 55.5 35.8 53.3 37.2 51.4 C 38.5 49.5 40.1 47.5 42.2 46.0 C 44.3 44.5 47.0 43.2 49.9 42.5 C 52.7 41.8 56.2 41.6 59.4 41.9 C 62.7 42.2 66.3 43.2 69.4 44.3 C 72.5 45.3 75.5 47.3 78.1 48.2 C 80.7 49.1 82.6 50.0 85.0 49.7 Z';
const LOGO_SULCI = [
  'M38 62C48 48 62 44 74 50',
  'M104 48C116 45 126 52 130 62',
  'M42 108C66 116 98 116 126 107',
];
const LOGO_MOUTH = 'M56 92C68 110 98 108 118 74';
// [x, y, 宽, 高, 旋转中心 x, 旋转中心 y, 旋转角度]
const LOGO_BARS = [
  [9.2, 50.9, 6.5, 15, 12.4, 58.4, -248],
  [24.5, 31.0, 6.5, 15, 27.7, 38.5, -217],
  [47.8, 21.8, 6.5, 15, 51.1, 29.3, -186],
];
const LOGO_EYES = [
  [66, 64, 8, 23, 70, 75.5, 16],
  [100, 60, 8, 23, 104, 71.5, 16],
];

/** 以 (px, py) 为中心旋转 deg 度后画一根圆头短棒 */
function drawRoundBar(ctx, x, y, w, h, px, py, deg) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-px, -py);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, w / 2);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
}

/** 在 (x, y) 处以 width 为基准画一枚品牌标记，返回是否成功 */
function drawBrandMark(ctx, x, y, width) {
  if (typeof Path2D === 'undefined') return false;
  try {
    const s = width / 180;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    // 轮廓
    const shape = new Path2D(LOGO_OUTLINE);
    ctx.fillStyle = '#EEEBFF';
    ctx.fill(shape);
    ctx.strokeStyle = BRAND;
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(shape);

    // 内描脑沟线
    ctx.strokeStyle = '#B7AEF7';
    ctx.lineWidth = 3.2;
    LOGO_SULCI.forEach((d) => ctx.stroke(new Path2D(d)));

    // 三根灵感短棒
    ctx.fillStyle = BRAND;
    LOGO_BARS.forEach((b) => drawRoundBar(ctx, ...b));

    // 两只斜眼 + U 形笑嘴
    LOGO_EYES.forEach((e) => drawRoundBar(ctx, ...e));
    ctx.strokeStyle = BRAND;
    ctx.lineWidth = 8;
    ctx.stroke(new Path2D(LOGO_MOUTH));

    ctx.restore();
    return true;
  } catch {
    return false;
  }
}

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

  // 落款：左侧品牌标记 + 文案
  const markW = 44;
  const markOk = drawBrandMark(ctx, 80, H - 140, markW);
  ctx.fillStyle = MUTED;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(footer || '臭脑子 · 今日最臭打卡', markOk ? 80 + markW + 16 : 80, H - 108);
  ctx.textAlign = 'right';
  ctx.fillText(`${tone || '温和'} · ${direction || '正经好用'}`, W - 80, H - 108);
  ctx.textAlign = 'left';

  return c.toDataURL('image/png');
}

/** 封面按实际文字高度扩展，原文摘要与照片均由用户选择。 */
export async function composeCover({ title, body, dateText, recordText, photoDataUrl, tag }) {
  const canvas = newCanvas();
  const ctx = canvas.getContext('2d');
  ctx.font = `600 72px ${FONT}`;
  const titleLines = wrapLines(ctx, title, W - 176);
  ctx.font = `400 35px ${FONT}`;
  const bodyLines = body ? wrapLines(ctx, body, W - 176) : [];
  ctx.font = `400 29px ${FONT}`;
  const originalLines = recordText ? wrapLines(ctx, recordText, W - 176) : [];
  const photoHeight = photoDataUrl ? 460 : 0;
  const contentHeight = titleLines.length * 102 + bodyLines.length * 55 + originalLines.length * 43;
  canvas.height = Math.max(H, 700 + photoHeight + contentHeight);
  const gradient = ctx.createLinearGradient(0, 0, W, canvas.height);
  gradient.addColorStop(0, '#f2efff');
  gradient.addColorStop(0.55, '#faf9ff');
  gradient.addColorStop(1, '#f9f0dd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#626078';
  ctx.font = `500 25px ${FONT}`;
  ctx.fillText('CHOUNAOZI / 留 下 今 天', 88, 108);
  ctx.textAlign = 'right';
  ctx.fillText(dateText, W - 88, 108);
  ctx.textAlign = 'left';
  let y = 235;
  if (photoDataUrl) {
    const image = await loadImage(photoDataUrl);
    ctx.save();
    roundRectPath(ctx, 88, 176, W - 176, 420, 20);
    ctx.clip();
    drawCover(ctx, image, 88, 176, W - 176, 420);
    ctx.restore();
    y = 710;
  }
  ctx.fillStyle = '#29263b';
  ctx.font = `600 72px ${FONT}`;
  titleLines.forEach((line) => { ctx.fillText(line, 88, y); y += 102; });
  if (bodyLines.length) {
    y += 30;
    ctx.fillStyle = '#666176';
    ctx.font = `400 35px ${FONT}`;
    bodyLines.forEach((line) => { ctx.fillText(line, 88, y); y += 55; });
  }
  if (originalLines.length) {
    y += 65;
    ctx.fillStyle = '#7c7686';
    ctx.font = `400 23px ${FONT}`;
    ctx.fillText('原来记下的', 88, y);
    y += 48;
    ctx.font = `400 29px ${FONT}`;
    originalLines.forEach((line) => { ctx.fillText(line, 88, y); y += 43; });
  }
  ctx.strokeStyle = '#dcd6e8';
  ctx.beginPath(); ctx.moveTo(88, canvas.height - 190); ctx.lineTo(W - 88, canvas.height - 190); ctx.stroke();
  ctx.font = `400 27px ${FONT}`;
  ctx.fillStyle = '#777080';
  ctx.fillText(tag ? `# ${tag}` : '今天的小事，也值得留着', 88, canvas.height - 110);
  ctx.textAlign = 'right';
  ctx.font = `600 37px ${FONT}`;
  ctx.fillStyle = '#635df5';
  ctx.fillText('臭脑子 ✦', W - 88, canvas.height - 106);
  return canvas.toDataURL('image/png');
}
