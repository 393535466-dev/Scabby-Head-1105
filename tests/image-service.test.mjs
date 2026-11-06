import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest, generateImage, imageConfiguration } from '../server/image-core.js';
import { IMAGE_STYLES } from '../shared/imageStyles.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YLWuCkAAAAASUVORK5CYII=', 'base64');
const env = { DASHSCOPE_API_KEY: 'test-only-key' };
const input = { text: '下班买了束花，忘了买晚饭。', tone: '搞笑', direction: '无厘头' };
const imageUrl = 'https://test.oss-cn-beijing.aliyuncs.com/generated.png?signature=example';
function providerResult(url = imageUrl) {
  return Response.json({ output: { choices: [{ message: { content: [{ image: url }] } }] } });
}

for (const style of IMAGE_STYLES) {
  test(style.id + ' uses its own visual brief and returns one full image', () => {
    const request = buildImageRequest({ ...input, tone: style.id, n: 99 });
    assert.equal(request.tone, style.id);
    assert.ok(request.prompt.includes(style.prompt));
    assert.ok(request.prompt.includes(input.text));
    assert.ok(request.prompt.includes('不要明信片'));
    assert.equal(request.body.parameters.n, 1);
  });
}

test('old 幽默 output inherits the 搞笑 image style', () => {
  assert.equal(buildImageRequest({ ...input, tone: '幽默' }).tone, '搞笑');
});

test('an optional reference photo is included in the real model request', () => {
  const photo = 'data:image/png;base64,' + png.toString('base64');
  const request = buildImageRequest({ ...input, photoDataUrl: photo });
  assert.deepEqual(request.body.input.messages[0].content[0], { image: photo });
});

test('invalid or empty input does not contact an external service', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('should not call'); };
  for (const value of [{ text: '' }, { ...input, tone: 'unknown' }, { ...input, photoDataUrl: 'https://example.com/private.png' }]) {
    await assert.rejects(generateImage(value, env, { fetchImpl }), (error) => error.status === 400);
  }
  assert.equal(calls, 0);
});

test('missing credentials return a clear unavailable state without a fake image', async () => {
  assert.deepEqual(imageConfiguration({}), { configured: false, model: 'qwen-image-2.0' });
  await assert.rejects(generateImage(input, {}, { fetchImpl: () => { throw new Error('should not call'); } }), (error) => error.status === 503 && error.code === 'IMAGE_SERVICE_NOT_CONFIGURED');
});

test('a successful provider image is downloaded immediately for persistent local storage', async () => {
  const calls = [];
  const result = await generateImage(input, env, { fetchImpl: async (url, options) => {
    calls.push({ url: String(url), options });
    return calls.length === 1 ? providerResult() : new Response(png, { headers: { 'content-type': 'image/png' } });
  } });
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.startsWith('https://dashscope.aliyuncs.com/api/v1/services/aigc/'));
  assert.equal(calls[1].options.redirect, 'error');
  assert.equal(result.source, 'qwen-image');
  assert.equal(result.data.tone, '搞笑');
  assert.equal(result.data.imageDataUrl, 'data:image/png;base64,' + png.toString('base64'));
  assert.equal(JSON.stringify(result).includes('signature=example'), false);
});

test('provider authorization errors never expose a key or raw provider body', async () => {
  await assert.rejects(generateImage(input, env, { fetchImpl: async () => new Response('test-only-key', { status: 401 }) }), (error) => error.code === 'IMAGE_SERVICE_AUTH' && !error.message.includes('test-only-key'));
});

test('image URLs outside the provider asset host are not fetched', async () => {
  let calls = 0;
  await assert.rejects(generateImage(input, env, { fetchImpl: async () => { calls++; return providerResult('http://127.0.0.1/private'); } }), (error) => error.code === 'INVALID_IMAGE_URL');
  assert.equal(calls, 1);
});

test('non-image payloads and excessive image sizes are rejected', async () => {
  for (const response of [new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }), new Response('not a PNG', { headers: { 'content-type': 'image/png' } }), new Response(png, { headers: { 'content-type': 'image/png', 'content-length': String(4 * 1024 * 1024) } })]) {
    let calls = 0;
    await assert.rejects(generateImage(input, env, { fetchImpl: async () => ++calls === 1 ? providerResult() : response }), (error) => ['INVALID_IMAGE_FORMAT', 'INVALID_IMAGE_CONTENT', 'IMAGE_TOO_LARGE'].includes(error.code));
  }
});
