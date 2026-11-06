import { loadImage } from './utils.js';

function imageApiUrl() {
  const sharecode = new URLSearchParams(window.location.search).get('sharecode');
  return sharecode ? `/api/image?sharecode=${encodeURIComponent(sharecode)}` : '/api/image';
}

export async function imageServiceStatus(signal) {
  const response = await fetch(imageApiUrl(), { signal, cache: 'no-store' });
  const json = await response.json();
  if (!response.ok || !json.ok) throw new Error('图片服务暂时不可用。');
  return json;
}

export async function createImage(payload, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 170000);
  try {
    const response = await fetch(imageApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    let json;
    try { json = await response.json(); } catch { throw new Error('图片暂时没有生成成功，请重试。'); }
    if (!response.ok || !json.ok) throw new Error(json.error || '图片暂时没有生成成功，请重试。');
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(json.data?.imageDataUrl || '')) throw new Error('图片内容不完整，请重试。');
    return json;
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error('这幅画等得有点久，可以稍后再试。');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function prepareGeneratedImage(dataUrl) {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.92);
}

export function imageExtension(dataUrl) {
  return dataUrl?.startsWith('data:image/webp;') ? 'webp' : dataUrl?.startsWith('data:image/jpeg;') ? 'jpg' : 'png';
}
