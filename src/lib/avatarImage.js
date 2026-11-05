import { loadImage } from './utils.js';

const templateCache = new Map();

// 只移除与边缘连通的浅色底，脸内部的白色眼睛与高光仍然保留。
export function removeEdgeBackground(pixels, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const visit = (index) => {
    if (index < 0 || index >= width * height || seen[index]) return;
    seen[index] = 1;
    const p = index * 4;
    const r = pixels[p],
      g = pixels[p + 1],
      b = pixels[p + 2];
    if (r > 211 && g > 207 && b > 215 && Math.max(r, g, b) - Math.min(r, g, b) < 31)
      queue[tail++] = index;
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    pixels[index * 4 + 3] = 0;
    const x = index % width;
    if (x) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    visit(index - width);
    visit(index + width);
  }
  return pixels;
}

export function avatarTemplate(index) {
  if (!templateCache.has(index))
    templateCache.set(
      index,
      loadImage('/avatars/character-templates.jpg')
        .then((image) => {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const renderHeight = size * 2.85;
          const renderWidth = (renderHeight * image.naturalWidth) / image.naturalHeight;
          const x = (renderWidth - size) * [0.08, 0.51, 0.94][index % 3];
          const y = (renderHeight - size) * [0, 0.48, 1][Math.floor(index / 3)];
          ctx.drawImage(image, -x, -y, renderWidth, renderHeight);
          const pixels = ctx.getImageData(0, 0, size, size);
          removeEdgeBackground(pixels.data, size, size);
          ctx.putImageData(pixels, 0, 0);
          return canvas.toDataURL('image/png');
        })
        .catch((error) => {
          templateCache.delete(index);
          throw error;
        }),
    );
  return templateCache.get(index);
}
