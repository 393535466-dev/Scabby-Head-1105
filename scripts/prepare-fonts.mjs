import { copyFile, mkdir, readdir } from 'node:fs/promises';

// The locked npm package supplies data files only. Serve the same Unicode
// subsets from this app's origin in development and on Vercel.
const source = new URL('../node_modules/@chinese-fonts/xiaolai/dist/Xiaolai/', import.meta.url);
const destination = new URL('../public/fonts/xiaolai/', import.meta.url);
const files = (await readdir(source)).filter((name) => name === 'result.css' || name.endsWith('.woff2'));
if (!files.includes('result.css') || !files.some((name) => name.endsWith('.woff2'))) {
  throw new Error('小赖字体资源不完整，请重新运行 npm install。');
}
await mkdir(destination, { recursive: true });
await Promise.all(files.map((name) => copyFile(new URL(name, source), new URL(name, destination))));
console.log(`小赖字体已准备：${files.length - 1} 个字体分片。`);
