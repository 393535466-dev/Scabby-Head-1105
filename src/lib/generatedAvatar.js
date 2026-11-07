import { loadImage } from './utils.js';

// Only remove green connected to the outside. Enclosed eyes and highlights stay intact.
export function cutoutAvatarPixels(pixels, width, height) {
  const count = width * height;
  const seen = new Uint8Array(count);
  const background = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0, tail = 0;
  const visit = (index) => {
    if (index < 0 || index >= count || seen[index]) return;
    seen[index] = 1;
    const p = index * 4;
    if (pixels[p + 3] === 0 || (pixels[p + 1] > 140 && pixels[p + 1] - Math.max(pixels[p], pixels[p + 2]) > 48)) {
      background[index] = 1;
      queue[tail++] = index;
    }
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    visit(index - width);
    visit(index + width);
  }
  if (tail < count * 0.05 || tail > count * 0.96) throw new Error('这次头像没有处理好，点「换一版」再试试。');
  let left = width, top = height, right = -1, bottom = -1;
  for (let index = 0; index < count; index++) {
    const p = index * 4, x = index % width, y = Math.floor(index / width);
    if (background[index]) { pixels[p + 3] = 0; continue; }
    // Suppress the green fringe left by antialiasing, without recoloring interior pixels.
    if ((x > 0 && background[index - 1]) || (x < width - 1 && background[index + 1]) || background[index - width] || background[index + width]) {
      pixels[p + 1] = Math.min(pixels[p + 1], Math.max(pixels[p], pixels[p + 2]) + 12);
    }
    if (pixels[p + 3] > 16) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export async function prepareGeneratedAvatar(dataUrl) {
  const image = await loadImage(dataUrl);
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size);
  const bounds = cutoutAvatarPixels(pixels.data, size, size);
  ctx.putImageData(pixels, 0, 0);
  const result = document.createElement('canvas');
  result.width = size; result.height = size;
  const scale = size * 0.9 / Math.max(bounds.width, bounds.height);
  const width = bounds.width * scale, height = bounds.height * scale;
  result.getContext('2d').drawImage(canvas, bounds.left, bounds.top, bounds.width, bounds.height, (size - width) / 2, (size - height) / 2, width, height);
  return result.toDataURL('image/webp', 0.92);
}
