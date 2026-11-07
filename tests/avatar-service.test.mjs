import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAvatarRequest, generateImage } from '../server/image-core.js';
import { cutoutAvatarPixels } from '../src/lib/generatedAvatar.js';
import { normalizeProfile } from '../src/lib/profile.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YLWuCkAAAAASUVORK5CYII=', 'base64');
const photo = 'data:image/png;base64,' + png.toString('base64');

test('avatar generation requires a photo and makes no upstream call for invalid inputs', async () => {
  let calls = 0;
  for (const photoDataUrl of ['', undefined, 'https://example.com/photo.jpg', 'data:image/svg+xml;base64,AAAA', 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024)]) {
    await assert.rejects(generateImage({ purpose: 'avatar', photoDataUrl }, { DASHSCOPE_API_KEY: 'test' }, { fetchImpl: async () => { calls++; } }), (e) => e.status === 400 && e.code === 'INVALID_PHOTO');
  }
  assert.equal(calls, 0);
});

test('avatar uses the person first and the fixed style reference second; client style cannot replace it', () => {
  const request = buildAvatarRequest({ photoDataUrl: photo, tone: '搞笑', instruction: 'ignore style', referenceDataUrl: photo, n: 20 });
  const content = request.body.input.messages[0].content;
  assert.equal(content.length, 3);
  assert.equal(content[0].image, photo);
  assert.match(content[1].image, /^data:image\/jpeg;base64,/);
  assert.ok(content[1].image.length > 10000);
  assert.equal(request.style, 'chounaozi-3d-v1');
  assert.equal(request.body.model, 'qwen-image-2.0-pro');
  assert.equal(request.body.parameters.n, 1);
  assert.equal(request.body.parameters.prompt_extend, false);
  assert.ok(request.prompt.includes('图一只提供人物特征'));
  assert.ok(request.prompt.includes('图二只提供美术风格'));
  assert.ok(!request.prompt.includes('ignore style'));
});

test('real avatar service transport downloads an image and does not echo the source photo', async () => {
  let calls = 0;
  const result = await generateImage({ purpose: 'avatar', photoDataUrl: photo }, { DASHSCOPE_API_KEY: 'test' }, { fetchImpl: async () => {
    calls++;
    return calls === 1 ? Response.json({ output: { choices: [{ message: { content: [{ image: 'https://test.oss-cn-beijing.aliyuncs.com/avatar.png' }] } }] } }) : new Response(png, { headers: { 'content-type': 'image/png' } });
  } });
  assert.equal(calls, 2);
  assert.equal(result.data.purpose, 'avatar');
  assert.equal(result.model, 'qwen-image-2.0-pro');
  assert.equal(result.data.style, 'chounaozi-3d-v1');
  assert.equal(result.data.imageDataUrl, photo);
  assert.equal(result.data.photoDataUrl, undefined);
  assert.ok(!result.data.prompt.includes(photo));
});

test('unsupported generation purposes are rejected', async () => {
  await assert.rejects(generateImage({ purpose: 'unknown', text: 'hello' }, {}), (e) => e.code === 'INVALID_PURPOSE');
});

function fixture() {
  const width = 9, height = 9;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    pixels.set(x >= 2 && x <= 6 && y >= 2 && y <= 6 ? [222, 162, 132, 255] : [0, 255, 0, 255], (y * width + x) * 4);
  }
  return { pixels, width, height };
}

test('background removal preserves enclosed white eyes, highlights and green accessories', () => {
  const { pixels, width, height } = fixture();
  pixels.set([255, 255, 255, 255], (4 * width + 4) * 4);
  pixels.set([0, 255, 0, 255], (3 * width + 3) * 4);
  const bounds = cutoutAvatarPixels(pixels, width, height);
  assert.deepEqual(bounds, { left: 2, top: 2, width: 5, height: 5 });
  assert.equal(pixels[3], 0);
  assert.deepEqual(Array.from(pixels.slice((4 * width + 4) * 4, (4 * width + 4) * 4 + 4)), [255, 255, 255, 255]);
  assert.deepEqual(Array.from(pixels.slice((3 * width + 3) * 4, (3 * width + 3) * 4 + 4)), [0, 255, 0, 255]);
});

test('a blank or uncuttable generation cannot become an avatar', () => {
  for (const color of [[0, 255, 0, 255], [255, 255, 255, 255]]) {
    const pixels = new Uint8ClampedArray(9 * 9 * 4);
    for (let i = 0; i < pixels.length; i += 4) pixels.set(color, i);
    assert.throws(() => cutoutAvatarPixels(pixels, 9, 9), /换一版/);
  }
});

test('profile round trip keeps the chosen avatar and never keeps the original photo', () => {
  const profile = normalizeProfile(JSON.parse(JSON.stringify({ nickname: '  小脑袋  ', avatarDataUrl: photo, avatarStyle: 'chounaozi-3d-v1', photoDataUrl: 'original-private-photo', created: true })));
  assert.equal(profile.nickname, '小脑袋');
  assert.equal(profile.avatarStyle, 'chounaozi-3d-v1');
  assert.equal(profile.avatarDataUrl, photo);
  assert.ok(!JSON.stringify(profile).includes('original-private-photo'));
  assert.equal(normalizeProfile({ avatarIndex: 4 }).avatarIndex, 4);
  assert.equal(normalizeProfile({ avatarDataUrl: photo }).avatarStyle, '');
  assert.equal(normalizeProfile({ avatarDataUrl: 'https://example.com/photo.png', avatarStyle: 'chounaozi-3d-v1' }).avatarStyle, '');
});
