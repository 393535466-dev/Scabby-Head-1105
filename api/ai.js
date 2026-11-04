import { runAI } from '../server/ai-core.js';

// Vercel Serverless Function。DEEPSEEK_API_KEY 只在这里通过 process.env 读取。
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: '仅支持 POST' });
  }
  try {
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const result = await runAI(input, {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ ok: false, error: `服务端加工失败：${err?.message || err}` });
  }
}
