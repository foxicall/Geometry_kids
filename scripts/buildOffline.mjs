import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

// 將正式建置的程式與樣式內嵌，下載後不依賴伺服器或網路。
const root = resolve('dist');
let html = await readFile(resolve(root, 'index.html'), 'utf8');
async function asset(source) {
  if (!source.startsWith('/assets/')) throw new Error('Unexpected asset source');
  const path = resolve(root, source.slice(1));
  if (relative(root, path).startsWith('..')) throw new Error('Asset escapes build directory');
  return readFile(path, 'utf8');
}
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error('Expected one self-contained JavaScript bundle');
for (const match of scripts) {
  const code = await asset(match[1]);
  // 使用函式替換，避免套件內的 $& 被 String.replace 當成樣板。
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
}
const styles = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)];
if (!styles.length) throw new Error('Missing application styles');
for (const match of styles) {
  const css = await asset(match[1]);
  html = html.replace(match[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
}
if (/<(?:script|link)\b[^>]*(?:src|href)="\/assets\//.test(html)) throw new Error('Unresolved asset');
for (const forbidden of ['GEMINI_API_KEY', '@google/genai', 'generativelanguage.googleapis.com', ...(process.env.GEMINI_API_KEY?.length >= 8 ? [process.env.GEMINI_API_KEY] : [])]) {
  if (html.includes(forbidden)) throw new Error('Unsafe client content detected');
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
const version = `${commit}${dirty ? ' (含尚未提交的本機變更)' : ''}`;
html = html.replace('</head>', () => `<meta name="geometry-kids-version" content="${version}">\n</head>`);
await writeFile(resolve(root, 'geometry-kids.html'), html);
await writeFile(resolve(root, 'README-offline.txt'), `幾何小建築師\n版本：${version}\n\n解壓縮後，以 Chrome、Edge、Firefox 或 Safari 開啟 geometry-kids.html。\n包含三級幾何推理（72 題，每輪 6 題）、立體觀察十關挑戰與圖形矩陣八題練習。程式與題庫已內嵌，不需要網路或 API 金鑰。\n若手機的檔案預覽器不執行網頁程式，請改用桌面瀏覽器開啟，或將 dist 正式版由自己的靜態伺服器提供。\n暱稱與紀錄僅存於本機瀏覽器；瀏覽器拒絕儲存時仍能遊玩，但不會保留歷史。\n這是原創觀察練習，不是 IQ 測驗或正式鑑定。\n`);
console.log(`離線版本已輸出：dist/geometry-kids.html（${Buffer.byteLength(html)} bytes），版本 ${version}`);
