import test from 'node:test';
import assert from 'node:assert/strict';
import { runAI } from '../server/ai-core.js';
import { buildImageRequest } from '../server/image-core.js';
import { normalizeTone, outputToneLabel, TONES } from '../src/lib/constants.js';

test('new choices and old preferences use 古风, historical labels stay truthful', () => {
  assert.ok(TONES.includes('古风'));
  assert.ok(!TONES.includes('极简'));
  assert.equal(normalizeTone('极简'), '古风');
  assert.equal(outputToneLabel('极简'), '极简');
});

test('real text requests use a poetic brief while preserving the original facts', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ items: ['秋风拂旧路，黄叶落人间。'] }) } }] });
  };
  try {
    for (const tone of ['古风', '极简']) {
      const result = await runAI({ action: 'rewrite', payload: { text: '秋天落黄叶', tone } }, { apiKey: 'test-only' });
      assert.equal(result.source, 'deepseek');
    }
    for (const request of requests) {
      assert.match(request.messages[0].content, /古典诗词意境/);
      assert.match(request.messages[0].content, /不捏造事实/);
      assert.match(request.messages[1].content, /秋天落黄叶/);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('all demo text actions have distinct classical output; images use Chinese ink style', async () => {
  for (const action of ['rewrite', 'extend', 'caption']) {
    const classical = await runAI({ action, payload: { text: '秋天落黄叶', tone: '古风' } });
    const gentle = await runAI({ action, payload: { text: '秋天落黄叶', tone: '温和' } });
    assert.equal(classical.source, 'demo');
    assert.notDeepEqual(classical.data.items, gentle.data.items);
    assert.equal(classical.data.items.length, 3);
  }
  const image = buildImageRequest({ text: '秋天落黄叶', tone: '古风' });
  assert.match(image.prompt, /水墨/);
  assert.match(image.prompt, /不要明信片/);
  assert.equal(buildImageRequest({ text: '秋天落黄叶', tone: '极简' }).tone, '古风');
});
