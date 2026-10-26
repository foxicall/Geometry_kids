import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 只檢查是否洩漏，不印出環境變數值或命中的內容。
const forbidden = ['GEMINI_API_KEY', '@google/genai', 'generativelanguage.googleapis.com'];
if (process.env.GEMINI_API_KEY?.length >= 8) forbidden.push(process.env.GEMINI_API_KEY);
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else if (/\.(js|html|css|json|map)$/.test(path)) {
      const text = await readFile(path, 'utf8');
      if (forbidden.some((token) => text.includes(token))) throw new Error('前端輸出含不應公開的 Gemini 設定或 SDK；建置失敗。');
    }
  }
}
await inspect('dist');
console.log('前端輸出安全檢查通過：沒有 Gemini 金鑰、SDK 或 API 端點。');
