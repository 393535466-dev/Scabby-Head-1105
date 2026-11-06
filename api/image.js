import { generateImage, imageConfiguration } from '../server/image-core.js';

export const config = { maxDuration: 180 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, ...imageConfiguration() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: '仅支持 GET 和 POST' });
  }
  try {
    const result = await generateImage(req.body && typeof req.body === 'object' ? req.body : {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 502).json({ ok: false, code: error.code || 'IMAGE_SERVICE_UNAVAILABLE', error: error.message || '图片暂时没有生成成功，请重试。' });
  }
}
