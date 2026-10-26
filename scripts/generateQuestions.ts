import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setGlobalProxyFromEnv } from 'node:http';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { generateWithFallback } from './lib/generateWithFallback';
import { safeDiagnostics } from './lib/diagnostics';
import type { Difficulty } from '../src/types/matrix';

export const CANDIDATE_MODELS = ['gemini-3.8', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'] as const;

export async function main() {
  // 即使直接使用 npx tsx，也沿用雲端 HTTPS proxy 與既有 CA 驗證。
  const restoreProxy = setGlobalProxyFromEnv();
  try {
  const { values } = parseArgs({ options: {
    count: { type: 'string', default: '3' }, difficulty: { type: 'string', default: 'easy' },
    out: { type: 'string', default: 'src/data/generatedQuestions.json' },
    offline: { type: 'boolean', default: false },
  } });
  const destination = resolve(values.out!);
  if (!destination.endsWith('.json')) throw new Error('輸出路徑必須為 .json');
  const { bank, model, source } = await generateWithFallback({ count: Number(values.count), difficulty: values.difficulty as Difficulty }, values.offline ? [] : CANDIDATE_MODELS);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    // 驗證完才原子替換，失敗時保留上一份可用題庫。
    await writeFile(temporary, `${JSON.stringify(bank, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await rename(temporary, destination);
  } finally { await rm(temporary, { force: true }); }
  console.log(`已寫入並驗證 ${bank.questions.length} 題：${destination}`);
  console.log(source === 'gemini' ? `來源：Gemini（${model}）；請在發布前審閱圖形與題解。` : '來源：內建規則題庫（本次未使用 Gemini 生成內容）。');
  } finally { restoreProxy(); }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error('題庫寫入失敗，請檢查參數或檔案權限。', JSON.stringify(safeDiagnostics(error), null, 2));
    process.exitCode = 1;
  });
}
