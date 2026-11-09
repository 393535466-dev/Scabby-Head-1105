import test from 'node:test';
import assert from 'node:assert/strict';
import { callAI, aiErrorMessage } from '../src/lib/ai.js';
import { runAI } from '../server/ai-core.js';

const generated = { ok: true, source: 'deepseek', data: { items: ['下午在上课，脑子忙着举手。'] } };

test('a transient mobile connection loss retries once with the original payload', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, body: options.body });
    if (requests.length === 1) throw new TypeError('Load failed');
    return Response.json(generated);
  });
  const result = await callAI('rewrite', { text: '下午在上课', tone: '腹黑' });
  assert.deepEqual(result, generated);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
});

test('persistent network errors stop after one retry and explain that the record is safe', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Load failed'); });
  await assert.rejects(callAI('rewrite', {}), /网络连接中断，原文已保留/);
  assert.equal(fetch.mock.callCount(), 2);
  assert.match(aiErrorMessage('Load failed'), /网络连接中断/);
});

test('offline clients do not issue a request', async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
  t.after(() => Object.defineProperty(globalThis, 'navigator', descriptor));
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(generated));
  await assert.rejects(callAI('rewrite', {}), /网络已断开/);
  assert.equal(fetch.mock.callCount(), 0);
});

test('gateway errors retry, but rate limits and application errors do not', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1
    ? new Response('gateway timeout', { status: 504 }) : Response.json(generated));
  assert.deepEqual(await callAI('rewrite', {}), generated);
  assert.equal(calls, 2);
  globalThis.fetch = async () => { calls += 1; return new Response('rate limited', { status: 429 }); };
  await assert.rejects(callAI('rewrite', {}), /加工请求有点多/);
  assert.equal(calls, 3);
  globalThis.fetch = async () => { calls += 1; return Response.json({ ok: false, error: '没有生成可用内容' }); };
  await assert.rejects(callAI('rewrite', {}), /没有生成可用内容/);
  assert.equal(calls, 4);
});

test('the client timeout also covers stalled response bodies', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fetch = t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({
    ok: true,
    json: () => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })),
  }));
  const request = callAI('rewrite', {});
  await new Promise(setImmediate);
  const rejection = assert.rejects(request, /等得有点久，原文已保留/);
  t.mock.timers.tick(55000);
  await rejection;
  assert.equal(fetch.mock.callCount(), 1);
});

test('provider timeout remains active through response-body parsing, including the fallback attempt', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fetch = t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({
    ok: true,
    json: () => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })),
  }));
  const request = runAI({ action: 'rewrite', payload: { text: '下午在上课' } }, { apiKey: 'test-only' });
  await new Promise(setImmediate);
  t.mock.timers.tick(20000);
  await new Promise(setImmediate);
  assert.equal(fetch.mock.callCount(), 2);
  t.mock.timers.tick(20000);
  const result = await request;
  assert.equal(result.source, 'demo');
  assert.equal(result.degraded, true);
  assert.ok(result.data.items.length);
});
