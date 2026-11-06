import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { runAI } from './server/ai-core.js';
import { generateImage, imageConfiguration } from './server/image-core.js';

/**
 * 本地 /api/ai 代理。
 * 只在 Vite 的 Node 进程里运行，与 Vercel 上的 api/ai.js 共用同一份 server/ai-core.js。
 * DEEPSEEK_API_KEY 没有 VITE_ 前缀，因此永远不会被打进前端 bundle。
 */
function localApiPlugin(env) {
  const handler = (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: '仅支持 POST' }));
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size <= 8 * 1024 * 1024) chunks.push(c);
    });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      try {
        if (size > 8 * 1024 * 1024) throw new Error('请求体过大');
        const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const result = await runAI(input, {
          apiKey: env.DEEPSEEK_API_KEY,
          model: env.DEEPSEEK_MODEL,
        });
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: false, error: `本地代理异常：${err?.message || err}` }));
      }
    });
  };
  return {
    name: 'chounaozi-local-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', handler);
      server.middlewares.use('/api/image', imageHandler(env));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai', handler);
      server.middlewares.use('/api/image', imageHandler(env));
    },
  };
}

function imageHandler(env) {
  return (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.end(JSON.stringify({ ok: true, ...imageConfiguration(env) }));
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.end(JSON.stringify({ ok: false, error: '仅支持 GET 和 POST' }));
    }
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => { size += chunk.length; if (size <= 4 * 1024 * 1024) chunks.push(chunk); });
    req.on('end', async () => {
      try {
        if (size > 4 * 1024 * 1024) { res.statusCode = 413; return res.end(JSON.stringify({ ok: false, error: '照片太大了，请换一张再试。' })); }
        const result = await generateImage(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'), env);
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = error.status || 502;
        res.end(JSON.stringify({ ok: false, code: error.code, error: error.message }));
      }
    });
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(process.env.PORT) || 5173;
  return {
    plugins: [react(), localApiPlugin(env)],
    server: { host: '0.0.0.0', port, allowedHosts: true },
    preview: { host: '0.0.0.0', port, allowedHosts: true },
  };
});
