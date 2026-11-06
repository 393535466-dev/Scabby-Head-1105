/**
 * 单端口 Node 预览服务：静态托管 dist/ + 同一个 /api/ai 代理。
 * 用途：npm run build && npm start，或任意只需要一个 HTTP 端口的托管环境。
 * 监听 PORT（默认 3000）并绑定 0.0.0.0。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAI } from './ai-core.js';
import { generateImage, imageConfiguration } from './image-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT) || 3000;

/**
 * 本地 .env.local 兜底加载：只读取 DEEPSEEK_* / DASHSCOPE_* 键，且进程环境变量优先。
 * 生产环境（Vercel Function / 托管平台）由平台注入 process.env，不依赖此文件。
 * 该文件仅存在于服务端，dist/ 静态托管目录取不到它。
 */
function loadLocalEnv() {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*((?:DEEPSEEK|DASHSCOPE)_[A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    const value = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key] && value) process.env[key] = value;
  }
}
loadLocalEnv();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 8 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/api/image') {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return json(res, 200, { ok: true, ...imageConfiguration() });
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: '仅支持 GET 和 POST' });
    try {
      return json(res, 200, await generateImage(JSON.parse((await readBody(req)) || '{}')));
    } catch (error) {
      return json(res, error.status || 502, { ok: false, code: error.code, error: error.message });
    }
  }

  if (url.pathname === '/api/ai') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: '仅支持 POST' });
    try {
      const input = JSON.parse((await readBody(req)) || '{}');
      const result = await runAI(input, {
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: process.env.DEEPSEEK_MODEL,
      });
      return json(res, 200, result);
    } catch (err) {
      return json(res, 200, { ok: false, error: `服务端加工失败：${err?.message || err}` });
    }
  }

  let rel = '/index.html';
  try {
    const decoded = decodeURIComponent(url.pathname);
    if (decoded !== '/' && !decoded.endsWith('/')) rel = decoded;
  } catch { /* 保持默认 */ }

  let file = path.resolve(dist, `.${rel}`);
  if (!file.startsWith(dist)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(dist, 'index.html'); // SPA 回退
  }
  if (!fs.existsSync(file)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><p style="font:16px/1.8 system-ui;padding:24px">还没有构建产物，请先执行 <code>npm run build</code> 再启动预览服务。</p>');
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`臭脑子预览服务已启动：http://0.0.0.0:${PORT}`);
});
